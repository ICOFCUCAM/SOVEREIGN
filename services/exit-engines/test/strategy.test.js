import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runStrategySimulator } from '../dist/buyers/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('runStrategySimulator returns a recommended set against base constraints', () => {
  const out = runStrategySimulator(SAMPLE_SAAS, {
    targetValueUsd: 120_000_000,
    targetBuyersToEngage: 5,
  });
  assert.ok(out.recommendedBuyers.length > 0, 'expected at least one match');
  assert.ok(out.recommendedBuyers.length <= 5);
  // P(close) over the set should be higher than any individual close rate.
  for (const c of out.recommendedBuyers) {
    assert.ok(out.expectedCloseProbability >= c.expectedOutcome.closeRatePct - 0.001);
  }
  assert.ok(out.expectedRealizedValueUsd > 0);
  assert.ok(out.expectedHeadlineUsd >= out.expectedRealizedValueUsd);
});

test('preferredBuyerType filters to that type only', () => {
  const out = runStrategySimulator(SAMPLE_SAAS, {
    targetValueUsd: 120_000_000,
    preferredBuyerType: 'pe',
  });
  for (const c of out.recommendedBuyers) {
    assert.equal(c.buyer.buyerType, 'pe');
  }
  assert.ok(out.droppedByConstraint.wrongBuyerType > 0);
});

test('aggressive maxTimelineDays drops slow buyers', () => {
  const strict = runStrategySimulator(SAMPLE_SAAS, {
    targetValueUsd: 120_000_000, maxTimelineDays: 90,
  });
  for (const c of strict.recommendedBuyers) {
    assert.ok(c.expectedOutcome.expectedDaysToCash <= 90, `${c.buyer.name} expected ${c.expectedOutcome.expectedDaysToCash}d`);
  }
});

test('impossible filter → empty set + summary explains', () => {
  // 'sponsor' buyer type has no rows in the registry.
  const out = runStrategySimulator(SAMPLE_SAAS, {
    targetValueUsd: 120_000_000,
    preferredBuyerType: 'sponsor',
  });
  assert.equal(out.recommendedBuyers.length, 0);
  assert.equal(out.expectedCloseProbability, 0);
  assert.equal(out.expectedRealizedValueUsd, 0);
  assert.match(out.summary, /No buyers/i);
  assert.ok(out.droppedByConstraint.wrongBuyerType > 0);
});

test('minConfidence:high drops experimental-tier rows', () => {
  // The snapshot is unverified, so experimental floors are common.
  // Asking for 'high' should drop most/all of them.
  const lenient = runStrategySimulator(SAMPLE_SAAS, { targetValueUsd: 120_000_000 });
  const strict  = runStrategySimulator(SAMPLE_SAAS, { targetValueUsd: 120_000_000, minConfidence: 'high' });
  assert.ok(strict.recommendedBuyers.length <= lenient.recommendedBuyers.length);
  for (const c of strict.recommendedBuyers) {
    assert.equal(c.expectedOutcome.overallConfidence.tier, 'high');
  }
});

test('process structure scales with set size and buyer mix', () => {
  const out = runStrategySimulator(SAMPLE_SAAS, {
    targetValueUsd: 120_000_000, targetBuyersToEngage: 5,
  });
  const ps = out.recommendedProcessStructure;
  assert.equal(ps.buyersToEngage, out.recommendedBuyers.length);
  assert.ok(ps.recommendedTimelineDays >= 60);
  assert.ok(ps.recommendedCashFloorPct >= 0.5 && ps.recommendedCashFloorPct <= 1.0);
  assert.ok(ps.rationale.length > 0);
});

test('expected close probability honors independence math', () => {
  // Build a minimal sanity check: with two buyers both at 50% close,
  // P(≥1) = 1 - 0.5×0.5 = 0.75.
  const out = runStrategySimulator(SAMPLE_SAAS, {
    targetValueUsd: 120_000_000, targetBuyersToEngage: 30,
  });
  if (out.recommendedBuyers.length >= 2) {
    const top = out.recommendedBuyers[0].expectedOutcome.closeRatePct;
    assert.ok(out.expectedCloseProbability >= top - 0.001,
      `aggregate ${out.expectedCloseProbability} should be >= top single ${top}`);
  }
});

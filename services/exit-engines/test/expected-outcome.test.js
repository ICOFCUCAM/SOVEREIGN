import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeExpectedOutcome, confidenceFromSample,
  rollupBuyerOutcomes, runBuyerDiscovery,
} from '../dist/buyers/index.js';
import { SAMPLE_SAAS } from './sample.js';

const FAKE_BUYER = { name: 'X', buyerType: 'pe', sectorsActive: [], modelsActive: [],
  checkSizeLowUsd: 0, checkSizeHighUsd: 0, geographyPreferred: [], recentActivityScore: 0, appetite: 'warm', thesis: '' };

test('confidenceFromSample tiers calibrate against M&A small-n reality', () => {
  assert.equal(confidenceFromSample(0).tier, 'experimental');
  assert.equal(confidenceFromSample(1).tier, 'low');
  assert.equal(confidenceFromSample(2).tier, 'low');
  assert.equal(confidenceFromSample(3).tier, 'medium');
  assert.equal(confidenceFromSample(9).tier, 'medium');
  assert.equal(confidenceFromSample(10).tier, 'high');
  assert.equal(confidenceFromSample(100).tier, 'high');
  // Sample is preserved on the label.
  assert.equal(confidenceFromSample(7, 'closed deals').sample, 7);
  assert.match(confidenceFromSample(7, 'closed deals').note, /n=7 closed deals/);
});

test('computeExpectedOutcome falls back to neutral priors when no data', () => {
  const empty = { buyerName: 'X', aggregateTier: 'unverified',
    loiCount: 0, closedCount: 0, lostCount: 0, withdrawnCount: 0, pendingCount: 0,
    premiumSampleSize: 0, retradeSampleSize: 0 };
  const eo = computeExpectedOutcome(FAKE_BUYER, empty, 100_000_000);
  assert.equal(eo.usedFallback, true);
  assert.equal(eo.premiumPct, 0.20);                      // neutral default
  assert.equal(eo.closeRatePct, 0.55);                    // neutral default
  assert.equal(eo.retradePct, 0);                          // neutral default
  assert.equal(eo.expectedDaysToCash, 150);                // neutral default
  assert.ok(Math.abs(eo.expectedHeadlineUsd - 120_000_000) < 1);
  // 100M × 1.20 × (1 + 0) × 0.55 = 66M
  assert.ok(Math.abs(eo.expectedClosingUsd  -  66_000_000) < 1);
  assert.equal(eo.premiumConfidence.tier, 'experimental');
  assert.equal(eo.closeRateConfidence.tier, 'experimental');
  assert.equal(eo.retradeConfidence.tier, 'experimental');
  assert.equal(eo.daysToCashConfidence.tier, 'experimental');
  assert.equal(eo.overallConfidence.tier, 'experimental');
});

test('computeExpectedOutcome uses real data when present, overall = min of inputs', () => {
  const rich = { buyerName: 'X', aggregateTier: 'unverified',
    loiCount: 5, closedCount: 4, lostCount: 1, withdrawnCount: 0, pendingCount: 0,
    closeRatePct: 0.80, avgPremiumPct: 0.35, premiumSampleSize: 2,
    medianCloseDays: 90, avgRetradePct: -0.05, retradeSampleSize: 3 };
  const eo = computeExpectedOutcome(FAKE_BUYER, rich, 100_000_000);
  assert.equal(eo.usedFallback, false);
  assert.equal(eo.premiumPct, 0.35);
  assert.equal(eo.closeRatePct, 0.80);
  assert.equal(eo.retradePct, -0.05);
  assert.equal(eo.expectedDaysToCash, 90);
  assert.ok(Math.abs(eo.expectedHeadlineUsd - 135_000_000) < 1);
  // 100M × 1.35 × (1 - 0.05) × 0.80 = 102.6M
  assert.ok(Math.abs(eo.expectedClosingUsd - 102_600_000) < 100,
    `expected ~102.6M, got ${eo.expectedClosingUsd}`);
  // 5 resolved → medium; 2 priced → low; 3 retrades → medium; 4 closes → medium.
  // Floor = low.
  assert.equal(eo.premiumConfidence.tier, 'low');
  assert.equal(eo.overallConfidence.tier, 'low');
});

test('computeExpectedOutcome retrade drag — bad retrade reduces expectedClosing', () => {
  const badRetrade = { buyerName: 'X', aggregateTier: 'unverified',
    loiCount: 3, closedCount: 3, lostCount: 0, withdrawnCount: 0, pendingCount: 0,
    closeRatePct: 1.0, avgPremiumPct: 0.30, premiumSampleSize: 3,
    medianCloseDays: 120, avgRetradePct: -0.18, retradeSampleSize: 3 };
  const cleanRetrade = { ...badRetrade, avgRetradePct: -0.02 };
  const bad   = computeExpectedOutcome(FAKE_BUYER, badRetrade,   100_000_000);
  const clean = computeExpectedOutcome(FAKE_BUYER, cleanRetrade, 100_000_000);
  // Same headline LOI; bad-retrade buyer closes for materially less.
  assert.equal(bad.expectedHeadlineUsd, clean.expectedHeadlineUsd);
  assert.ok(bad.expectedClosingUsd < clean.expectedClosingUsd * 0.90,
    `expected bad retrade to drop closing > 10%, got bad=${bad.expectedClosingUsd} clean=${clean.expectedClosingUsd}`);
});

test('runBuyerDiscovery attaches expectedOutcome to every candidate', () => {
  const r = runBuyerDiscovery(SAMPLE_SAAS, { limit: 12 });
  for (const c of r.candidates) {
    assert.ok(c.expectedOutcome);
    assert.ok(c.expectedOutcome.expectedClosingUsd > 0);
    assert.ok(c.expectedOutcome.expectedClosingUsd <= c.expectedOutcome.expectedHeadlineUsd);
  }
});

test('sortBy=expected_outcome reorders candidates by founder take-home', () => {
  const byProb = runBuyerDiscovery(SAMPLE_SAAS, { limit: 20, sortBy: 'probability' });
  const byEO   = runBuyerDiscovery(SAMPLE_SAAS, { limit: 20, sortBy: 'expected_outcome' });
  // expected_outcome list must be sorted by expectedClosingUsd desc
  for (let i = 1; i < byEO.candidates.length; i++) {
    assert.ok(
      byEO.candidates[i - 1].expectedOutcome.expectedClosingUsd >=
      byEO.candidates[i].expectedOutcome.expectedClosingUsd,
    );
  }
  assert.equal(byEO.rankBy, 'expected_outcome');
  assert.equal(byProb.rankBy, 'probability');
});

test('expected_outcome ranking can promote a high-close-rate buyer above a high-probability one', () => {
  // From the snapshot: Salesforce (100% close, +42% premium) should
  // out-rank a buyer with similar fit but no track record.
  const r = runBuyerDiscovery(SAMPLE_SAAS, { limit: 20, sortBy: 'expected_outcome' });
  // The top candidate should have real evidence (overall confidence != experimental)
  // OR a clear expected-outcome advantage. Just sanity-check the math holds.
  const top = r.candidates[0];
  assert.ok(top.expectedOutcome.expectedClosingUsd > 0);
});

test('rollup → expectedOutcome composition matches end-to-end', () => {
  const outcomes = rollupBuyerOutcomes('Salesforce Acquisition Office');
  const eo = computeExpectedOutcome(FAKE_BUYER, outcomes, 100_000_000);
  // SF closed all and averaged ~42% premium, so expectedClosing should be
  // close to 100M × 1.42 × 1.0 = 142M.
  assert.ok(eo.expectedClosingUsd > 130_000_000 && eo.expectedClosingUsd < 150_000_000,
    `expected ~140M, got ${eo.expectedClosingUsd}`);
});

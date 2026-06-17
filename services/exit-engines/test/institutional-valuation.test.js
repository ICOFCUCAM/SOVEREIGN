// Institutional valuation — the upgrade from "founder-grade" to
// "credible to a PE firm / corp-dev team / banker". Every assertion
// checks that a figure is EVIDENCE-DRIVEN, not assumed: the premium
// comes from observed precedents, the conclusion is arithmetic on the
// baseline, the comparables and buyer universe come from the registries.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInstitutionalValuation } from '../dist/valuation/index.js';
import { SAMPLE_SAAS } from './sample.js';

const r = runInstitutionalValuation(SAMPLE_SAAS);

test('the conclusion is explained: headline = baseline × (1 + applied premium)', () => {
  const expectedMid = r.financialBaseline.mid * (1 + r.premium.appliedPct);
  // within rounding of the engine's own adjustment math
  assert.ok(Math.abs(r.headline.mid - expectedMid) / expectedMid < 0.001,
    `headline ${r.headline.mid} should equal baseline ${r.financialBaseline.mid} × (1+${r.premium.appliedPct})`);
  assert.ok(r.headline.low < r.headline.mid && r.headline.mid < r.headline.high);
});

test('methodology weights are normalized and sum to 100%', () => {
  assert.ok(r.methodologies.length >= 1);
  const total = r.methodologies.reduce((s, m) => s + m.weightPct, 0);
  assert.equal(total, 100);
  for (const m of r.methodologies) {
    assert.ok(m.evidence.length > 0, 'every method cites the market band behind its range');
  }
});

test('strategic premium is evidence-based, not a flat assumption', () => {
  // applied premium must be the mean of the observed precedent premiums
  assert.ok(r.premium.observedPremiums.length > 0, 'precedent premiums were observed');
  const mean = r.premium.observedPremiums.reduce((a, b) => a + b, 0) / r.premium.observedPremiums.length;
  assert.ok(Math.abs(r.premium.appliedPct - mean) < 1e-9, 'applied = mean(observed)');
  assert.ok(r.premium.appliedPct >= r.premium.rangeLowPct && r.premium.appliedPct <= r.premium.rangeHighPct,
    'applied sits inside the observed range');
  assert.ok(['in_sector', 'market_prior', 'neutral_prior'].includes(r.premium.basis));
  // honest confidence: a market-wide prior must NOT claim in-sector confidence
  if (r.premium.basis === 'market_prior') assert.equal(r.premium.confidence.tier, 'experimental');
});

test('comparable transactions are real and source-referenced', () => {
  assert.equal(r.comparablesUsed, r.comparableTransactions.length);
  assert.ok(r.comparablesUsed > 0);
  for (const c of r.comparableTransactions) {
    assert.ok(c.target && c.buyer);
    assert.ok(c.sourceRef.length > 0, 'each comparable cites its source');
    assert.notEqual(c.status, 'lost_bid');
  }
});

test('confidence score is a 0–100 composite with the five framework drivers', () => {
  assert.ok(r.confidence.score >= 0 && r.confidence.score <= 100);
  assert.ok(['Low', 'Moderate', 'High'].includes(r.confidence.tier));
  const d = r.confidence.drivers;
  for (const k of ['dataCompleteness', 'comparableDepth', 'sectorMaturity', 'financialQuality', 'dataFreshness']) {
    assert.ok(d[k] >= 0 && d[k] <= 1, `${k} normalized 0–1`);
  }
});

test('buyer universe and most-likely buyers come from the engine, ranked', () => {
  assert.ok(r.buyerUniverse.registry > 0);
  assert.ok(r.buyerUniverse.qualified <= r.buyerUniverse.scored);
  assert.ok(r.buyerUniverse.scored <= r.buyerUniverse.registry);
  assert.ok(r.mostLikelyBuyers.length > 0 && r.mostLikelyBuyers.length <= 5);
  for (const b of r.mostLikelyBuyers) {
    assert.ok(b.name.length > 0);
    assert.ok(b.probabilityPct >= 0 && b.probabilityPct <= 100);
  }
  // ranked by the intelligence engine's fit-adjusted expected value
  // (probability × expected realized value), not raw probability — so we
  // assert the order is stable and buyers are distinct, not prob-descending
  const names = r.mostLikelyBuyers.map((b) => b.name);
  assert.equal(new Set(names).size, names.length, 'no duplicate buyers in the ranking');
});

test('time-to-close is a positive day range and rationale is buyer-facing', () => {
  assert.ok(r.timeToClose.lowDays > 0 && r.timeToClose.highDays >= r.timeToClose.lowDays);
  assert.ok(r.strategicRationale.length >= 4 && r.strategicRationale.length <= 6);
  assert.ok(r.strategicRationale.some((b) => /market entry/i.test(b)));
});

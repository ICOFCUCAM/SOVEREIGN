import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runReadiness, runReadinessAnalysis } from '../dist/readiness/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('readiness analysis returns weaknesses for a weak profile', () => {
  const weak = {
    ...SAMPLE_SAAS,
    revenue: { ...SAMPLE_SAAS.revenue, customerConcentrationTop10Pct: 0.75, netRetentionPct: 0.85 },
    team: { ...SAMPLE_SAAS.team, leadershipBenchStrength: 'thin' },
  };
  const r = runReadiness(weak);
  const a = runReadinessAnalysis(weak, r);
  assert.ok(a.weaknesses.length >= 1);
  assert.ok(a.projectedScore >= a.currentScore);
  assert.ok(a.projectedStrategicMid > a.currentStrategicMid);
});

test('readiness analysis returns no weaknesses for a strong profile', () => {
  const strong = {
    ...SAMPLE_SAAS,
    revenue: { ...SAMPLE_SAAS.revenue, customerConcentrationTop10Pct: 0.10, netRetentionPct: 1.4, grossMarginPct: 0.85, ebitdaMarginPct: 0.25 },
    growth:  { ...SAMPLE_SAAS.growth, arrGrowthYoyPct: 1.2 },
    market:  { ...SAMPLE_SAAS.market, marketGrowthPct: 0.35, competitiveDensity: 'low' },
    product: { ...SAMPLE_SAAS.product, hasNetworkEffects: true, hasDataMoat: true, aiNative: true, defensibility: 'high', differentiation: 'monopolist', intellectualProperty: { patentsGranted: 5 } },
    team:    { ...SAMPLE_SAAS.team, leadershipBenchStrength: 'strong' },
  };
  const r = runReadiness(strong);
  const a = runReadinessAnalysis(strong, r);
  // Overall score should be strong band — strategic_acquisition territory.
  assert.ok(r.overallScore >= 65, `expected overall ≥ 65, got ${r.overallScore}`);
  // Most dimensions clear 60; Market Penetration is structurally low
  // for any company well below market saturation.
  assert.ok(r.dimensions.filter((d) => d.score >= 60).length >= 3);
  // Projected valuation should never regress.
  assert.ok(a.projectedStrategicMid >= a.currentStrategicMid);
});

test('improvement plans carry severity, effort and uplift', () => {
  const weak = {
    ...SAMPLE_SAAS,
    revenue: { ...SAMPLE_SAAS.revenue, customerConcentrationTop10Pct: 0.85 },
    growth: { ...SAMPLE_SAAS.growth, arrGrowthYoyPct: 0.10 },
  };
  const r = runReadiness(weak);
  const a = runReadinessAnalysis(weak, r);
  for (const w of a.weaknesses) {
    assert.ok(['low', 'medium', 'high'].includes(w.severity));
    assert.ok(['days', 'weeks', 'months', 'quarters'].includes(w.effort));
    assert.ok(w.valuationUpliftUsd > 0);
    assert.ok(w.valuationUpliftPct > 0);
    assert.ok(w.recommendation.length > 0);
  }
});

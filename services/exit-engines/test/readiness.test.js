import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runReadiness } from '../dist/readiness/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('readiness returns a score in [0,100] and a defensible band', () => {
  const r = runReadiness(SAMPLE_SAAS);
  assert.ok(r.overallScore >= 0 && r.overallScore <= 100);
  assert.ok(['not_ready', 'seed_acquisition', 'growth_acquisition', 'strategic_acquisition'].includes(r.band));
});

test('readiness surfaces all five dimensions with weights summing to 1', () => {
  const r = runReadiness(SAMPLE_SAAS);
  assert.equal(r.dimensions.length, 5);
  const totalWeight = r.dimensions.reduce((s, d) => s + d.weight, 0);
  assert.ok(Math.abs(totalWeight - 1) < 1e-6, `weights sum to ${totalWeight}`);
});

test('weak revenue quality lowers the score', () => {
  const weak = {
    ...SAMPLE_SAAS,
    revenue: { ...SAMPLE_SAAS.revenue, annualRecurringRevenueUsd: 500_000, grossMarginPct: 0.3, netRetentionPct: 0.7, customerConcentrationTop10Pct: 0.8 },
    growth: { ...SAMPLE_SAAS.growth, arrGrowthYoyPct: 0.05 },
  };
  const r = runReadiness(weak);
  const rev = r.dimensions.find((d) => d.name === 'Revenue Quality');
  assert.ok(rev);
  assert.ok(rev.score < 50, `expected weak revenue quality < 50, got ${rev.score}`);
});

test('strong moats lift the technology score above 80', () => {
  const strong = {
    ...SAMPLE_SAAS,
    product: { ...SAMPLE_SAAS.product, hasNetworkEffects: true, hasDataMoat: true, aiNative: true, intellectualProperty: { patentsGranted: 5 } },
  };
  const r = runReadiness(strong);
  const tech = r.dimensions.find((d) => d.name === 'Technology Moat');
  assert.ok(tech.score > 80, `expected high tech moat, got ${tech.score}`);
});

test('recommendations always include a band-specific advisory', () => {
  const r = runReadiness(SAMPLE_SAAS);
  assert.ok(r.recommendations.length > 0);
});

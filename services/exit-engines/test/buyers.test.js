import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runBuyerDiscovery, BUYER_REGISTRY } from '../dist/buyers/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('buyer discovery ranks at least one strategic candidate', () => {
  const r = runBuyerDiscovery(SAMPLE_SAAS);
  assert.ok(r.candidates.length >= 1);
  assert.ok(r.candidates.some((c) => c.buyer.buyerType === 'strategic'));
  // probabilities should be in [0,1] and descending
  for (let i = 1; i < r.candidates.length; i++) {
    assert.ok(r.candidates[i - 1].probability >= r.candidates[i].probability);
  }
});

test('buyer discovery filters by minProbability', () => {
  const r = runBuyerDiscovery(SAMPLE_SAAS, { minProbability: 0.6 });
  for (const c of r.candidates) {
    assert.ok(c.probability >= 0.6);
  }
});

test('byType breakdown sums to candidate count', () => {
  const r = runBuyerDiscovery(SAMPLE_SAAS, { limit: 50 });
  const sum = r.byType.strategic + r.byType.pe + r.byType.vc + r.byType.family_office + r.byType.sponsor;
  assert.equal(sum, r.candidates.length);
});

test('logistics company surfaces logistics-active buyers', () => {
  const logistics = {
    ...SAMPLE_SAAS,
    businessModel: 'logistics',
    sector: 'logistics_freight',
    revenue: { ...SAMPLE_SAAS.revenue, annualRecurringRevenueUsd: 8_000_000, trailingTwelveMonthsRevenueUsd: 40_000_000 },
  };
  const r = runBuyerDiscovery(logistics);
  const logisticsBuyer = r.candidates.find((c) => c.buyer.name.includes('Robinson') || c.buyer.name.includes('XPO') || c.buyer.name.includes('Uber'));
  assert.ok(logisticsBuyer, 'expected a logistics-active strategic buyer');
});

test('reference registry has full sector coverage', () => {
  const sectors = new Set();
  for (const b of BUYER_REGISTRY) {
    for (const s of b.sectorsActive) sectors.add(s);
  }
  assert.ok(sectors.size >= 7, `expected coverage of at least 7 sectors, got ${sectors.size}`);
});

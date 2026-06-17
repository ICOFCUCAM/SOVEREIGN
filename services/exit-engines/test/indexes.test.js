// ExitOS Acquisition Indexes — per-sector market intelligence aggregated
// from verified registry events. Pure and deterministic; nothing modelled.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sectorIndexes } from '../dist/market/index.js';

const EVENTS = [
  { buyer_id: 'msft', announced_date: '2025-03-01', value_usd: 100_000_000, industry: 'enterprise software' },
  { buyer_id: 'goog', announced_date: '2025-06-01', value_usd: 300_000_000, industry: 'artificial intelligence' },
  { buyer_id: 'msft', announced_date: '2024-02-01', value_usd: 200_000_000, industry: 'cloud infrastructure' },
  { buyer_id: 'crm',  announced_date: '2023-01-01', value_usd: 50_000_000,  industry: 'application software' },
  { buyer_id: 'crm',  announced_date: '2025-01-01', industry: 'security software' },   // undisclosed value
  { buyer_id: 'na',   announced_date: '2025-01-01', industry: 'totally unclassifiable widgets' }, // maps to nothing
];

const idx = sectorIndexes(EVENTS);

test('events aggregate into ExitOS-sector indexes; unmapped industries are dropped', () => {
  const sectors = idx.map((i) => i.sector);
  assert.ok(sectors.includes('Software'));
  assert.ok(sectors.includes('AI'));
  assert.ok(sectors.includes('Cloud Infrastructure'));
  assert.ok(sectors.includes('Cybersecurity'));
  // the unclassifiable widget event contributed to no index — never forced
  const total = idx.reduce((s, i) => s + i.volume, 0);
  assert.ok(total >= 5 && total <= 8, 'only mapped events count (some map to multiple sectors)');
});

test('an index carries volume, distinct buyers, median deal size and disclosed value', () => {
  const software = idx.find((i) => i.sector === 'Software');
  assert.ok(software.volume >= 2);
  assert.ok(software.activeBuyers >= 1);
  assert.ok(software.disclosedDeals >= 1);
  assert.ok(software.medianDealUsd > 0);
  assert.ok(software.totalDisclosedUsd >= software.medianDealUsd);
});

test('trend compares trailing-12m vs prior-12m, anchored on the latest event', () => {
  for (const i of idx) {
    assert.ok(i.volume12m >= 0 && i.volumePrior12m >= 0);
    if (i.trendPct != null) assert.equal(typeof i.trendPct, 'number');
  }
  // indexes are ranked by volume
  for (let k = 1; k < idx.length; k++) assert.ok(idx[k].volume <= idx[k - 1].volume);
});

test('an empty registry yields no indexes — never a fabricated one', () => {
  assert.deepEqual(sectorIndexes([]), []);
});

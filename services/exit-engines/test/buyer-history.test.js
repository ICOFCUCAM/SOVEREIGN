import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rollupBuyerHistory, ACQUISITION_HISTORY, runBuyerDiscovery,
} from '../dist/buyers/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('rollupBuyerHistory aggregates known Salesforce deals', () => {
  const r = rollupBuyerHistory('Salesforce Acquisition Office', '2026-01-01T00:00:00Z');
  assert.ok(r.totalDeals >= 4, `expected ≥4 deals, got ${r.totalDeals}`);
  // Largest disclosed deal is Slack at $27.7B
  assert.equal(r.largestDealUsd, 27_700_000_000);
  // Most recent: Own Company (2024-09-05)
  assert.equal(r.lastTargetName, 'Own Company');
  assert.ok(r.lastAcquiredAt?.startsWith('2024-09'));
  assert.ok((r.sectorMix.enterprise_saas ?? 0) >= 3);
});

test('rollupBuyerHistory recency windows ignore stale deals', () => {
  // Salesforce·MuleSoft is 2018-03-20; with asOf 2026-01-01 it's >3y old
  const r = rollupBuyerHistory('Salesforce Acquisition Office', '2026-01-01T00:00:00Z');
  assert.ok(r.dealsLast3Years < r.totalDeals);
  // last12 should be ≤ last3y
  assert.ok(r.dealsLast12Months <= r.dealsLast3Years);
});

test('rollupBuyerHistory counts terminated deals separately', () => {
  // Adobe·Figma terminated 2023
  const r = rollupBuyerHistory('Adobe Strategic', '2026-01-01T00:00:00Z');
  assert.ok(r.terminatedDeals >= 1);
  // terminated deals don't count toward totalDeals (which is closed+announced)
  const adobeEvents = ACQUISITION_HISTORY.filter((e) => e.buyerName === 'Adobe Strategic');
  assert.ok(adobeEvents.length > r.totalDeals);
});

test('rollupBuyerHistory returns neutral defaults for unknown buyer', () => {
  const r = rollupBuyerHistory('Unknown Co.');
  assert.equal(r.totalDeals, 0);
  assert.equal(r.dealsLast3Years, 0);
  assert.equal(r.terminatedDeals, 0);
  assert.equal(r.avgDisclosedCheckUsd, undefined);
  assert.equal(r.largestDealUsd, undefined);
});

test('runBuyerDiscovery attaches history rollup to each candidate', () => {
  const r = runBuyerDiscovery(SAMPLE_SAAS, { limit: 20 });
  assert.ok(r.candidates.length > 0);
  for (const c of r.candidates) {
    assert.ok(c.history, `candidate ${c.buyer.name} missing history`);
    assert.ok(typeof c.history.totalDeals === 'number');
    assert.ok(typeof c.fitDimensions.historyFit === 'number');
    assert.ok(c.fitDimensions.historyFit >= 0 && c.fitDimensions.historyFit <= 1);
  }
});

test('candidates with real M&A history surface evidence-grade signals', () => {
  const r = runBuyerDiscovery(SAMPLE_SAAS, { limit: 20 });
  const sf = r.candidates.find((c) => c.buyer.name === 'Salesforce Acquisition Office');
  assert.ok(sf, 'Salesforce should rank for an enterprise SaaS sample');
  assert.ok(sf.signals.some((s) => s.text.startsWith('Last deal:')), `expected last-deal signal, got: ${JSON.stringify(sf.signals)}`);
  assert.ok(sf.signals.some((s) => /\d+ disclosed deal/.test(s.text)));
});

test('history-derived signals carry the underlying confidence tier', () => {
  const r = runBuyerDiscovery(SAMPLE_SAAS, { limit: 20 });
  const sf = r.candidates.find((c) => c.buyer.name === 'Salesforce Acquisition Office');
  assert.ok(sf);
  const lastDeal = sf.signals.find((s) => s.text.startsWith('Last deal:'));
  assert.ok(lastDeal);
  // Snapshot ships everything as unverified until the refresh script runs against live EDGAR/Wikidata.
  assert.equal(lastDeal.kind, 'unverified');
  const derived = sf.signals.find((s) => s.text === `Active in ${SAMPLE_SAAS.sector}`);
  if (derived) assert.equal(derived.kind, 'derived');
});

test('terminated deals add a caution-kind signal', () => {
  const r = runBuyerDiscovery(SAMPLE_SAAS, { limit: 20 });
  const adobe = r.candidates.find((c) => c.buyer.name === 'Adobe Strategic');
  if (adobe) {
    const caution = adobe.signals.find((s) => /terminated deal/i.test(s.text));
    assert.ok(caution);
    assert.equal(caution.kind, 'caution');
  }
});

test('rollupBuyerHistory reports the aggregate tier and refuses to mix tiers', () => {
  // Default minTier is 'unverified' — snapshot is unverified, so includes everything in our snapshot.
  const r = rollupBuyerHistory('Salesforce Acquisition Office');
  assert.equal(r.aggregateTier, 'unverified');
  assert.ok(r.totalDeals > 0);
  assert.ok(r.coverageByTier.unverified > 0);
  // Promote to 'verified' — should drop to zero deals since nothing in the snapshot is verified.
  const verifiedOnly = rollupBuyerHistory('Salesforce Acquisition Office', { minTier: 'verified' });
  assert.equal(verifiedOnly.aggregateTier, 'verified');
  assert.equal(verifiedOnly.totalDeals, 0);
  assert.equal(verifiedOnly.avgDisclosedCheckUsd, undefined);
});

test('historyFit rewards buyers with sector-matching prior deals', () => {
  // Salesforce has multiple enterprise_saas deals → historyFit should be high
  const r = runBuyerDiscovery(SAMPLE_SAAS, { limit: 20 });
  const sf = r.candidates.find((c) => c.buyer.name === 'Salesforce Acquisition Office');
  const noHistory = r.candidates.find((c) => c.history.totalDeals === 0);
  if (sf && noHistory) {
    assert.ok(sf.fitDimensions.historyFit > noHistory.fitDimensions.historyFit,
      `expected SF history fit ${sf.fitDimensions.historyFit} > no-history ${noHistory.fitDimensions.historyFit}`);
  }
});

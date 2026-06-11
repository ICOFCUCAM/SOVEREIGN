import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rollupBuyerOutcomes, compareOutcomes, closeDurationDays, premiumPct,
  runBuyerDiscovery,
} from '../dist/buyers/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('closeDurationDays computes announced → closed in days', () => {
  const ev = {
    buyerName: 'X', targetName: 'Y',
    announcedDate: '2022-01-18', closedDate: '2023-10-13',
    status: 'closed', confidence: 'unverified', sourceRefs: [],
  };
  const days = closeDurationDays(ev);
  // Microsoft / Activision Blizzard: ~633 days
  assert.ok(days >= 625 && days <= 640, `expected ~633 days, got ${days}`);
});

test('closeDurationDays returns undefined when closedDate missing', () => {
  const ev = { buyerName: 'X', targetName: 'Y', announcedDate: '2022-01-18', status: 'announced', confidence: 'unverified', sourceRefs: [] };
  assert.equal(closeDurationDays(ev), undefined);
});

test('premiumPct = (headline - prior) / prior', () => {
  const ev = {
    buyerName: 'X', targetName: 'Y', announcedDate: '2020-12-01',
    headlinePriceUsd: 27_700_000_000, priorReferencePriceUsd: 21_400_000_000,
    status: 'closed', confidence: 'unverified', sourceRefs: [],
  };
  const pct = premiumPct(ev);
  // (27.7 - 21.4) / 21.4 ≈ 0.2944
  assert.ok(Math.abs(pct - 0.2944) < 0.01, `expected ~0.29, got ${pct}`);
});

test('premiumPct returns undefined when prior price missing', () => {
  const ev = { buyerName: 'X', targetName: 'Y', announcedDate: '2024-01-01', headlinePriceUsd: 100, status: 'closed', confidence: 'unverified', sourceRefs: [] };
  assert.equal(premiumPct(ev), undefined);
});

test('rollupBuyerOutcomes — Salesforce won every disclosed deal in snapshot', () => {
  const r = rollupBuyerOutcomes('Salesforce Acquisition Office');
  assert.ok(r.closedCount >= 4);
  assert.equal(r.lostCount, 0);
  assert.equal(r.withdrawnCount, 0);
  assert.equal(r.closeRatePct, 1.0);
});

test('rollupBuyerOutcomes — Adobe Figma termination counts as withdrawn', () => {
  const r = rollupBuyerOutcomes('Adobe Strategic');
  assert.ok(r.withdrawnCount >= 1);
  // Three closed (Frame.io, Workfront, Marketo) + 1 withdrawn (Figma)
  assert.ok(r.closedCount >= 3);
  assert.ok(r.closeRatePct < 1.0 && r.closeRatePct > 0);
});

test('rollupBuyerOutcomes — Microsoft Activision close duration ~633 days', () => {
  const r = rollupBuyerOutcomes('Microsoft Industry Solutions');
  assert.ok(r.avgCloseDays >= 100, `expected non-trivial avg, got ${r.avgCloseDays}`);
  assert.ok(r.slowestCloseDays >= 625);
});

test('rollupBuyerOutcomes — average premium computed when prior prices present', () => {
  const r = rollupBuyerOutcomes('Salesforce Acquisition Office');
  // 3 of 5 SF deals have priorReferencePriceUsd (Slack +29%, Tableau +45%, MuleSoft +51%)
  assert.equal(r.premiumSampleSize, 3);
  assert.ok(r.avgPremiumPct > 0.30 && r.avgPremiumPct < 0.50, `expected 0.30-0.50 avg, got ${r.avgPremiumPct}`);
});

test('rollupBuyerOutcomes — verified-only tier returns empty for unverified snapshot', () => {
  const r = rollupBuyerOutcomes('Salesforce Acquisition Office', { minTier: 'verified' });
  assert.equal(r.loiCount, 0);
  assert.equal(r.closeRatePct, undefined);
  assert.equal(r.avgCloseDays, undefined);
});

test('compareOutcomes identifies fastest closer and highest premium', () => {
  const r = runBuyerDiscovery(SAMPLE_SAAS, { limit: 30 });
  const standouts = compareOutcomes(r.candidates.map((c) => c.outcomes));
  // At least one of the three signals should fire from the snapshot
  const anyFound = standouts.fastestCloser || standouts.highestPremium || standouts.bestCloseRate;
  assert.ok(anyFound, 'expected at least one outcome standout');
  if (standouts.fastestCloser)  assert.ok(standouts.fastestCloser.medianCloseDays >= 0);
  if (standouts.highestPremium) assert.ok(standouts.highestPremium.avgPremiumPct > 0);
});

test('runBuyerDiscovery attaches outcomes to each candidate', () => {
  const r = runBuyerDiscovery(SAMPLE_SAAS, { limit: 20 });
  for (const c of r.candidates) {
    assert.ok(c.outcomes, `${c.buyer.name} missing outcomes`);
    assert.equal(typeof c.outcomes.loiCount, 'number');
    assert.equal(c.outcomes.aggregateTier, 'unverified');
  }
});

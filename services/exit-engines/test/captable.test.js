import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runCapTableAnalysis, signatoryRoster, computeWaterfall,
  dragAlongCheck, vestedShares, foundersNetFromOffer,
} from '../dist/captable/index.js';
import { SAMPLE_CAPTABLE } from './captable-sample.js';

test('runCapTableAnalysis reconciles shares and reports ownership', () => {
  const a = runCapTableAnalysis(SAMPLE_CAPTABLE);
  assert.equal(a.companyId, SAMPLE_CAPTABLE.companyId);
  assert.ok(a.ownershipByStakeholder.length === SAMPLE_CAPTABLE.stakeholders.length);
  // Sorted by ownership descending
  for (let i = 1; i < a.ownershipByStakeholder.length; i++) {
    assert.ok(a.ownershipByStakeholder[i - 1].fullyDilutedPct >= a.ownershipByStakeholder[i].fullyDilutedPct);
  }
  // ESOP utilization defined
  assert.ok(a.esopUtilizationPct !== undefined);
  assert.ok(a.esopUtilizationPct > 0 && a.esopUtilizationPct < 1);
  // Roles add up roughly to the reconciled fraction of fully diluted
  const roleSum = Object.values(a.ownershipByRole).reduce((s, v) => s + v, 0);
  assert.ok(roleSum > 0.8 && roleSum <= 1.01);
});

test('runCapTableAnalysis warns when reconciliation drifts > 0.5%', () => {
  const drifted = { ...SAMPLE_CAPTABLE, fullyDilutedShares: 25_000_000 };
  const a = runCapTableAnalysis(drifted);
  assert.ok(a.warnings.some((w) => w.toLowerCase().includes('reconciliation drift')));
});

test('signatoryRoster classifies required vs recommended and reports coverage', () => {
  const r = signatoryRoster(SAMPLE_CAPTABLE);
  assert.ok(r.required.length > 0);
  assert.ok(r.recommended.length > 0);
  // YC is not required (signatoryRequired: false), so should be in recommended
  assert.ok(r.recommended.some((s) => s.id === 'stk-yc'));
  // Sequoia is lead with seat — required
  assert.ok(r.required.some((s) => s.id === 'stk-seq'));
  assert.ok(r.coverageOfShares > 0 && r.coverageOfShares <= 1);
});

test('computeWaterfall pays liquidation preference before common pool', () => {
  const w = computeWaterfall(SAMPLE_CAPTABLE, {
    headlinePriceUsd: 140_000_000,
    cashPct: 0.75, stockPct: 0.15, earnoutPct: 0.10,
  });
  assert.ok(w.preferenceTotalUsd > 0);
  assert.ok(w.commonPoolUsd > 0);
  assert.equal(
    Math.round(w.preferenceTotalUsd + w.commonPoolUsd),
    140_000_000,
  );
  // Sequoia (preferred holder) gets non-zero preference
  const seq = w.distributions.find((d) => d.stakeholderId === 'stk-seq');
  assert.ok(seq && seq.preferenceUsd > 0);
  // A founder (common only) gets zero preference, some common proceeds
  const ana = w.distributions.find((d) => d.stakeholderId === 'stk-ana');
  assert.ok(ana && ana.preferenceUsd === 0 && ana.commonProceedsUsd > 0);
  // NPV ≤ gross because of stock + earnout discounts
  for (const d of w.distributions) {
    assert.ok(d.netPresentValueUsd <= d.grossProceedsUsd + 1);
  }
  // Founders net is the sum of founder NPVs
  const expectedFounderNet = w.distributions
    .filter((d) => d.role === 'founder')
    .reduce((s, d) => s + d.netPresentValueUsd, 0);
  assert.ok(Math.abs(expectedFounderNet - w.netToFoundersUsd) < 1);
});

test('computeWaterfall prorates when preference exceeds headline price', () => {
  // Drop the headline below the $32M preference stack
  const w = computeWaterfall(SAMPLE_CAPTABLE, {
    headlinePriceUsd: 20_000_000,
    cashPct: 1.0, stockPct: 0, earnoutPct: 0,
  });
  assert.equal(w.commonPoolUsd, 0);
  assert.ok(Math.abs(w.preferenceTotalUsd - 20_000_000) < 1);
  // Founders (common only) receive zero
  const ana = w.distributions.find((d) => d.stakeholderId === 'stk-ana');
  assert.ok(ana && ana.grossProceedsUsd === 0);
  assert.ok(w.notes.some((n) => /exceeds headline/i.test(n)));
});

test('dragAlongCheck identifies holdouts and meets threshold', () => {
  const d = dragAlongCheck(SAMPLE_CAPTABLE, 0.5);
  assert.ok(d.committedShares > 0);
  assert.ok(d.committedPct > 0 && d.committedPct <= 1);
  // YC and warrants holder + employees not required → holdouts
  assert.ok(d.holdouts.length > 0);
});

test('vestedShares respects cliff, monthly vesting, and CoC acceleration', () => {
  const startsAt = '2024-01-01T00:00:00Z';
  const schedule = { totalMonths: 48, cliffMonths: 12, startDate: startsAt };
  // Before cliff
  assert.equal(vestedShares(1_000_000, schedule, '2024-06-01T00:00:00Z'), 0);
  // After cliff: roughly 12/48 = 25%
  const yr1 = vestedShares(1_000_000, schedule, '2025-01-15T00:00:00Z');
  assert.ok(yr1 >= 240_000 && yr1 <= 260_000);
  // Full vest after 48 months
  assert.equal(vestedShares(1_000_000, schedule, '2028-06-01T00:00:00Z'), 1_000_000);
  // Acceleration with percentOnCoC
  const accel = {
    totalMonths: 48, cliffMonths: 12, startDate: startsAt,
    acceleration: { double: true, percentOnCoC: 0.5 },
  };
  const accelVested = vestedShares(1_000_000, accel, '2025-01-15T00:00:00Z', true);
  // Adds 50% to ~25% = ~75%
  assert.ok(accelVested > 700_000 && accelVested <= 800_000);
});

test('foundersNetFromOffer matches the waterfall founder NPV', () => {
  const offer = { headlinePriceUsd: 140_000_000, cashPct: 0.7, stockPct: 0.2, earnoutPct: 0.1 };
  const f = foundersNetFromOffer(SAMPLE_CAPTABLE, offer);
  const w = computeWaterfall(SAMPLE_CAPTABLE, offer);
  assert.equal(f.npvUsd, w.netToFoundersUsd);
  assert.equal(f.cashUsd, w.netToFoundersCashUsd);
});

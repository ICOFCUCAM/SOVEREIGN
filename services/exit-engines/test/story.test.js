import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_STORY, effectiveProvenance, usableMarketEstimate, usableForecast, storyStatus, storyCompleteness, provenanceIssues } from '../dist/story/index.js';

const src = { id: 'src-1', title: 'FY2025 statutory accounts', kind: 'statutory_accounts', date: '2026-03-31', period: 'FY2025' };
const story = { ...EMPTY_STORY, sources: [src] };

test('a figure cannot claim a source that is not attached, or verification without a process', () => {
  assert.equal(effectiveProvenance({ provenance: 'source', sourceId: 'src-1' }, story).provenance, 'source');
  assert.deepEqual(effectiveProvenance({ provenance: 'source', sourceId: 'nope' }, story), { provenance: 'founder', issue: 'cites a source document that is not attached' });
  assert.equal(effectiveProvenance({ provenance: 'verified', sourceId: 'src-1' }, story).provenance, 'source');
  assert.equal(effectiveProvenance({ provenance: 'verified', verification: { by: 'auditor', at: '2026-04-01', process: 'audit' } }, story).provenance, 'verified');
  assert.equal(effectiveProvenance({ provenance: 'estimated' }, story).provenance, 'missing');
  assert.equal(effectiveProvenance(undefined, story).provenance, 'founder');
});

test('a market size needs geography, period, methodology and a source or a documented estimate', () => {
  const base = { label: 'UK analytics software', valueUsd: 2e9, geography: 'United Kingdom', period: '2025', methodology: 'top-down from ONS IT spend' };
  assert.equal(usableMarketEstimate({ ...base, meta: { provenance: 'founder' } }, story).ok, false);
  assert.equal(usableMarketEstimate({ ...base, meta: { provenance: 'source', sourceId: 'src-1' } }, story).ok, true);
  assert.equal(usableMarketEstimate({ ...base, meta: { provenance: 'estimated', method: 'bottom-up: 4,000 firms × $500k' } }, story).ok, true);
  assert.equal(usableMarketEstimate({ ...base, geography: '', meta: { provenance: 'source', sourceId: 'src-1' } }, story).ok, false);
});

test('a forecast needs its basis', () => {
  assert.equal(usableForecast({ period: 'FY2027', revenueUsd: 3e7, basis: '' }), false);
  assert.equal(usableForecast({ period: 'FY2027', revenueUsd: 3e7, basis: 'signed pipeline plus 110% NRR' }), true);
});

test('an empty story is empty everywhere, and partial work counts', () => {
  assert.ok(storyStatus(EMPTY_STORY).every((s) => s.status === 'empty'));
  assert.equal(storyCompleteness(EMPTY_STORY), 0);
  const partial = { ...story, history: { origin: 'Founded by two analysts', milestones: [], ownershipChanges: [] } };
  assert.equal(storyStatus(partial).find((s) => s.id === 'history').status, 'partial');
  assert.ok(storyCompleteness(partial) > 0);
});

test('provenance problems are listed before anything is generated', () => {
  const s = { ...story, financials: { annual: [{ period: 'FY2025', revenueUsd: 2e7, meta: { provenance: 'source', sourceId: 'missing-doc' } }], forecasts: [{ period: 'FY2027', revenueUsd: 3e7, basis: '' }] } };
  const issues = provenanceIssues(s);
  assert.ok(issues.some((i) => /FY2025.*not attached/.test(i)));
  assert.ok(issues.some((i) => /forecast FY2027/.test(i)));
});

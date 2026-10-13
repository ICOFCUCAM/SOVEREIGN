import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_STORY, effectiveProvenance, usableMarketEstimate, usableForecast, storyStatus, storyCompleteness, provenanceIssues } from '../dist/story/index.js';

const src = { id: 'src-1', title: 'FY2025 statutory accounts', kind: 'statutory_accounts', date: '2026-03-31', period: 'FY2025' };
const story = { ...EMPTY_STORY, sources: [src] };

test('a figure cannot claim a source that is not attached, or verification without an independent record', () => {
  assert.equal(effectiveProvenance({ provenance: 'source', sourceId: 'src-1' }, story).provenance, 'source');
  assert.deepEqual(effectiveProvenance({ provenance: 'source', sourceId: 'nope' }, story), { provenance: 'founder', issue: 'cites a source document that is not attached' });
  assert.equal(effectiveProvenance({ provenance: 'verified', sourceId: 'src-1' }, story).provenance, 'source');
  assert.equal(effectiveProvenance({ provenance: 'verified', verification: { id: 'v1', reviewer: 'A. Auditor', role: 'Registered auditor', at: '2026-04-01', scope: 'FY2025 revenue', evidence: ['FY2025 audited accounts'] } }, story).provenance, 'verified');
  assert.equal(effectiveProvenance({ provenance: 'verified', verification: { id: 'v1', reviewer: 'A. Auditor', role: 'Registered auditor', at: '2026-04-01', scope: 'FY2025 revenue', evidence: [] } }, story).provenance, 'founder');
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

import { runReadiness, runReadinessAnalysis } from '../dist/readiness/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('readiness never scores an input the company did not supply', () => {
  const assumed = ['market.addressableMarketUsd', 'market.marketGrowthPct', 'market.competitiveDensity', 'market.regulatoryRisk', 'product.differentiation', 'product.defensibility', 'product.technicalArchitecture', 'team.leadershipBenchStrength'];
  const c = { ...SAMPLE_SAAS, drivers: [], assumed };   // no supplied drivers either
  const r = runReadiness(c);
  const mp = r.dimensions.find((d) => d.name === 'Market Penetration');
  const ca = r.dimensions.find((d) => d.name === 'Competitive Advantage');
  assert.equal(mp.assessed, false);
  assert.equal(ca.assessed, false);
  assert.ok(r.gaps.some((g) => /Market Penetration: not assessed/.test(g)));
  const plan = runReadinessAnalysis(c, r);
  const w = plan.weaknesses.find((x) => x.dimension === 'Market Penetration');
  assert.match(w.recommendation, /market-size estimate with its source/);
  assert.equal(w.valuationUpliftUsd, 0);
  assert.ok(!plan.weaknesses.some((x) => /TAM \(\$/.test(x.weakness)));
  // with everything supplied, the same profile is scored on all five dimensions
  assert.ok(runReadiness(SAMPLE_SAAS).dimensions.every((d) => d.assessed !== false));
});

import { cleanStory } from '../dist/story/index.js';
test('half-filled rows from a progressive intake never reach a document', () => {
  const partial = { ...EMPTY_STORY, history: { origin: 'x', milestones: [{ year: 2019 }, { year: 2020, event: 'Launched' }], ownershipChanges: [] },
    market: { geographies: ['', 'DE'], estimates: [{ label: 'EU freight software' }], competitors: [{}] }, products: [{ name: 'A' }] };
  assert.doesNotThrow(() => storyStatus(partial));
  assert.doesNotThrow(() => provenanceIssues(partial));
  const c = cleanStory(partial);
  assert.deepEqual(c.history.milestones, [{ year: 2020, event: 'Launched' }]);
  assert.deepEqual(c.market.geographies, ['DE']);
  assert.equal(c.market.estimates.length, 0);
  assert.equal(c.market.competitors.length, 0);
  assert.equal(c.products.length, 0);
});

test('a section with typed but unusable work shows as started, not empty', () => {
  const s = { ...EMPTY_STORY, market: { geographies: [], estimates: [{ label: 'EU freight software', valueUsd: 4e9 }], competitors: [] } };
  assert.equal(storyStatus(s).find((x) => x.id === 'market').status, 'partial');
});

import { applyVerifications, verificationState, withoutSelfVerification, claimValue, claimCompetence } from '../dist/story/index.js';
import { TemplateMemorandumGenerator as Gen } from '../dist/memorandum/index.js';

const vstory = { ...EMPTY_STORY, sources: [src], figures: { arrUsd: 21800000 }, headline: { arrUsd: { provenance: 'source', sourceId: 'src-1' } },
  financials: { annual: [{ period: 'FY2025', revenueUsd: 2.09e7, meta: { provenance: 'source', sourceId: 'src-1' } }], forecasts: [] } };
const rec = (over = {}) => ({ id: 'ver-1', claim: 'figure:arrUsd', value: 21800000, reviewer: 'J. Moreau', role: 'Chartered accountant, Example LLP', competence: 'financial',
  evidence: [{ description: 'Contract register reconciled to the September 2026 management accounts', sourceId: 'src-1' }], scope: 'ARR at 30 September 2026', verifiedAt: '2026-10-10T09:00:00Z', ...over });

test('only a verification record confers "verified"; a story cannot verify itself', () => {
  const forged = { ...vstory, headline: { arrUsd: { provenance: 'verified', verification: { id: 'x', reviewer: 'me', role: 'founder', at: '2026-01-01', scope: 'all', evidence: ['trust me'] } } } };
  assert.equal(withoutSelfVerification(forged).headline.arrUsd.provenance, 'founder');
  assert.equal(applyVerifications(forged, []).story.headline.arrUsd.provenance, 'founder');
  const { story } = applyVerifications(vstory, [rec()]);
  assert.equal(story.headline.arrUsd.provenance, 'verified');
  assert.equal(story.headline.arrUsd.verification.reviewer, 'J. Moreau');
});

test('a verification stops counting when the figure changes, expires or is revoked', () => {
  const now = new Date('2026-10-14T00:00:00Z');
  assert.equal(verificationState(rec(), vstory, now), 'valid');
  assert.equal(verificationState(rec(), { ...vstory, figures: { arrUsd: 23000000 } }, now), 'stale');
  assert.equal(verificationState(rec({ expiresAt: '2026-10-13T00:00:00Z' }), vstory, now), 'expired');
  assert.equal(verificationState(rec({ revokedAt: '2026-10-12T00:00:00Z' }), vstory, now), 'revoked');
  assert.equal(verificationState(rec({ staleAt: '2026-10-12T00:00:00Z' }), vstory, now), 'stale');
  const r = applyVerifications({ ...vstory, figures: { arrUsd: 23000000 } }, [rec()], now);
  assert.equal(r.story.headline.arrUsd.provenance, 'source');
  assert.equal(r.notCounted[0].state, 'stale');
});

test('a verification stops counting when the evidence document it cites changes or is removed', () => {
  const now = new Date('2026-10-14T00:00:00Z');
  const doc = { id: 'mgmt', title: 'September management accounts', kind: 'management_accounts', date: '2026-10-05' };
  const st = { ...vstory, sources: [...vstory.sources.filter((d) => d.id !== 'mgmt'), doc] };
  const v = rec({ evidence: [{ description: 'Management accounts', sourceId: 'mgmt', source: doc }] });
  assert.equal(verificationState(v, st, now), 'valid');
  assert.equal(verificationState(v, { ...st, sources: st.sources.map((d) => (d.id === 'mgmt' ? { ...d, date: '2026-11-05' } : d)) }, now), 'stale');
  assert.equal(verificationState(v, { ...st, sources: st.sources.filter((d) => d.id !== 'mgmt') }, now), 'stale');
});

test('claims resolve without their basis, and each has the competence that may verify it', () => {
  assert.deepEqual(claimValue(vstory, 'annual:FY2025'), { period: 'FY2025', revenueUsd: 2.09e7 });
  assert.deepEqual(claimCompetence('cap'), ['legal', 'financial']);
  assert.deepEqual(claimCompetence('market:x'), ['commercial']);
  assert.deepEqual(claimCompetence('figure:arrUsd'), ['financial']);
});

test('the CIM states who verified a figure, its evidence, scope and limitations', async () => {
  const { story } = applyVerifications(vstory, [rec({ limitations: 'Contracts sampled, not all reviewed', expiresAt: '2027-04-01T00:00:00Z' })], new Date('2026-10-14'));
  const doc = await new Gen().generate('cim', { company: SAMPLE_SAAS, valuation: { headline: { low: 1, mid: 2, high: 3 }, premiums: [], methodologies: [], countryAdjustment: 0 }, story });
  const text = JSON.stringify(doc.sections);
  assert.match(text, /verified by J\. Moreau \(Chartered accountant, Example LLP\), 2026-10-10; scope: ARR at 30 September 2026/);
  assert.match(text, /Independent verifications/);
  assert.match(text, /Contracts sampled, not all reviewed/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDueDiligence } from '../dist/diligence/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('diligence package generates the seven standard documents', () => {
  const r = runDueDiligence(SAMPLE_SAAS);
  const kinds = r.documents.map((d) => d.kind).sort();
  assert.deepEqual(kinds, ['commercial','financial','legal','market','security','technical_architecture','user_growth']);
});

test('every document carries sections and artifacts', () => {
  const r = runDueDiligence(SAMPLE_SAAS);
  for (const doc of r.documents) {
    assert.ok(doc.sections.length > 0);
    assert.ok(doc.artifacts.length > 0);
  }
});

test('critical questions surface for high-risk profiles', () => {
  const risky = {
    ...SAMPLE_SAAS,
    revenue: { ...SAMPLE_SAAS.revenue, customerConcentrationTop10Pct: 0.7, netRetentionPct: 0.85, ebitdaMarginPct: -0.4 },
    market: { ...SAMPLE_SAAS.market, regulatoryRisk: 'high' },
    team: { ...SAMPLE_SAAS.team, leadershipBenchStrength: 'thin' },
  };
  const r = runDueDiligence(risky);
  assert.ok(r.criticalQuestions.length >= 3);
  assert.ok(r.redFlags.length >= 1);
});

test('classifications are valid', () => {
  const r = runDueDiligence(SAMPLE_SAAS);
  for (const doc of r.documents) {
    assert.ok(['unclassified', 'sensitive', 'confidential'].includes(doc.classification));
  }
});

import { roomProgress, suggestedName } from '../dist/diligence/index.js';

test('every artifact has a unique, stable id', () => {
  const ids = runDueDiligence(SAMPLE_SAAS).documents.flatMap((d) => d.artifacts.map((a) => a.id));
  assert.equal(ids.length, 22);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z]+\.[a-z0-9_]+$/);
});

test('data-room completeness counts only accepted files tagged with a required artifact of this company', () => {
  const pkgs = runDueDiligence(SAMPLE_SAAS).documents;
  const f = (id, artifactId, reviewState, companyId = 'co-1', at = '2026-10-01') => ({ id, artifactId, companyId, reviewState, filename: `${id}.pdf`, uploadedAt: at });
  const empty = roomProgress(pkgs, [], 'co-1');
  assert.equal(empty.required, 20); assert.equal(empty.accepted, 0); assert.equal(empty.pct, 0);
  // three untagged uploads in the financial room used to make it 100%: now they count for nothing
  const loose = roomProgress(pkgs, [f('a', null, 'accepted'), f('b', null, 'accepted'), f('c', 'nonsense.id', 'accepted')], 'co-1');
  assert.equal(loose.accepted, 0); assert.equal(loose.untagged.length, 3);
  const r = roomProgress(pkgs, [
    f('1', 'financial.audited_accounts', 'accepted'),
    f('2', 'financial.cap_table', 'submitted'),
    f('3', 'financial.management_accounts', 'rejected'),
    f('4', 'financial.cohort_analysis', 'accepted', 'co-other'),
    f('5', 'growth.sales_productivity', 'accepted'),           // optional: never counts towards the required total
  ], 'co-1');
  const fin = r.packages.find((p) => p.kind === 'financial');
  assert.deepEqual(fin.artifacts.map((a) => a.status), ['accepted', 'rejected', 'in_review', 'missing']);
  assert.equal(fin.accepted, 1); assert.equal(fin.pct, 25);
  assert.equal(r.accepted, 1); assert.equal(r.pct, 5);           // 1 of 20, not an average of package percentages
  assert.equal(r.packages.find((p) => p.kind === 'user_growth').artifacts.find((a) => a.artifact.id === 'growth.sales_productivity').status, 'accepted');
});

test('a later rejected file does not undo an accepted one, and suggested names fill the period', () => {
  const pkgs = runDueDiligence(SAMPLE_SAAS).documents;
  const r = roomProgress(pkgs, [
    { id: 'x', artifactId: 'legal.charter', companyId: 'co-1', reviewState: 'accepted', filename: 'a.pdf', uploadedAt: '2026-01-01' },
    { id: 'y', artifactId: 'legal.charter', companyId: 'co-1', reviewState: 'rejected', filename: 'b.pdf', uploadedAt: '2026-02-01' },
  ], 'co-1');
  const charter = r.packages.find((p) => p.kind === 'legal').artifacts.find((a) => a.artifact.id === 'legal.charter');
  assert.equal(charter.status, 'accepted'); assert.equal(charter.files[0].id, 'y');
  const audited = pkgs.find((p) => p.kind === 'financial').artifacts[0];
  assert.equal(suggestedName(audited, '2025'), 'audited_FY2023_FY2025.pdf');
});

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

// Level 3 — the Document Factory. One engine renders every institutional
// document from a single intelligence object (the Valuation Constitution),
// and a number cannot enter a document unless it is a traced Figure. These
// tests enforce that contract end to end.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  figure, numericTokens, valuationFacts, validateTraceability,
  renderDocument, renderDocumentSuite, REPORT_SECTIONS,
} from '../dist/documents/index.js';
import { runValuationConstitution } from '../dist/valuation/index.js';
import { SAMPLE_SAAS } from './sample.js';

const c = runValuationConstitution(SAMPLE_SAAS);
const facts = valuationFacts(c);

test('a Figure cannot be constructed without full provenance', () => {
  assert.throws(() => figure({ key: 'x', label: 'X', value: '$1M', source: '', confidence: 'high', last_updated: '2026-01-01', methodology: 'm' }), /source/);
  assert.throws(() => figure({ key: 'x', label: 'X', value: '$1M', source: 's', confidence: 'high', last_updated: '2026-01-01', methodology: '' }), /methodology/);
  // a complete figure constructs fine
  const f = figure({ key: 'x', label: 'X', value: '$1M', source: 's', confidence: 'high', last_updated: '2026-01-01', methodology: 'm' });
  assert.equal(f.value, '$1M');
});

test('the fact sheet is the target tear block — every headline metric, fully sourced', () => {
  const keys = facts.map((f) => f.key);
  for (const k of ['enterprise_value', 'confidence', 'methods_used', 'comparable_transactions', 'qualified_buyers', 'expected_close_time', 'observed_premium_range', 'applied_premium', 'data_freshness']) {
    assert.ok(keys.includes(k), `fact sheet includes ${k}`);
  }
  for (const f of facts) {
    assert.ok(f.value && f.source && f.confidence && f.last_updated && f.methodology, `${f.key} fully provenanced`);
  }
});

test('every report carries the same nine canonical sections, fully traced', () => {
  const suite = renderDocumentSuite({ constitution: c });
  const kinds = ['valuation_summary', 'board_report', 'market_update', 'buyer_brief', 'acquisition_recommendation', 'exit_readiness'];
  for (const k of kinds) {
    const doc = suite[k];
    assert.ok(doc, `${k} produced`);
    assert.equal(doc.traceability.ok, true, `${k} has zero untraced numbers (got ${JSON.stringify(doc.traceability.untraced)})`);
    assert.ok(doc.traceability.checked > 0, `${k} actually contains figures to check`);
    assert.ok(doc.facts.length >= 9, `${k} carries the fact sheet`);
    // the nine canonical sections, in order, every report
    assert.deepEqual(doc.sections.map((s) => s.heading), [...REPORT_SECTIONS], `${k} has the nine canonical sections`);
  }
});

test('the nine canonical sections are exactly the institutional contract', () => {
  assert.deepEqual([...REPORT_SECTIONS], [
    'Executive Summary', 'Valuation', 'Buyer Universe', 'Comparable Transactions',
    'Strategic Rationale', 'Expected Outcome', 'Confidence Analysis',
    'Data Provenance', 'Disclaimers',
  ]);
});

test('no report invents a buyer — every named buyer is a real registry candidate', () => {
  const doc = renderDocument('acquisition_recommendation', { constitution: c });
  const buyerSection = doc.sections.find((s) => s.heading === 'Buyer Universe');
  const namesInReport = (buyerSection.rows ?? []).map((r) => r[1]);
  const registryNames = new Set(c.mostLikelyBuyers.map((b) => b.name));
  for (const n of namesInReport) assert.ok(registryNames.has(n), `${n} is a real ranked buyer`);
});

test('the board report surfaces the governed midpoint verbatim', () => {
  const doc = renderDocument('board_report', { constitution: c });
  const ev = facts.find((f) => f.key === 'enterprise_value').value;
  const text = doc.sections.map((s) => `${s.body ?? ''} ${(s.bullets ?? []).join(' ')}`).join(' ');
  assert.ok(text.includes(ev), 'board report cites the fact-sheet midpoint');
});

test('the validator CATCHES an untraced number injected into a section', () => {
  // a section that asserts a valuation not on the fact sheet must fail
  const tampered = [{ heading: 'Tampered', body: 'We assess an enterprise value of $999M with 73% confidence.' }];
  const report = validateTraceability(facts, tampered, c.frameworkVersion);
  assert.equal(report.ok, false);
  const tokens = report.untraced.map((u) => u.token);
  assert.ok(tokens.includes('$999m'), 'the fabricated EV is flagged');
});

test('numericTokens does not swallow following words as units', () => {
  assert.deepEqual(numericTokens('23 buyers'), ['23']);
  assert.deepEqual(numericTokens('$112.4M midpoint'), ['$112.4m']);
  assert.deepEqual(numericTokens('$1.2 billion deal'), ['$1.2billion']);
  assert.ok(numericTokens('10%–144%').includes('10%'));
  assert.ok(numericTokens('10%–144%').includes('144%'));
});

test('a calendar year is allowlisted; a fabricated dollar figure is not', () => {
  const sections = [{ heading: 'S', body: 'Founded in 2017, the company is unrelated to $42M.' }];
  const report = validateTraceability(facts, sections, c.frameworkVersion);
  assert.ok(!report.untraced.some((u) => u.token === '2017'), 'year allowlisted');
  assert.ok(report.untraced.some((u) => u.token === '$42m'), 'fabricated figure flagged');
});

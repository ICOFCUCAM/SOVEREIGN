import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TemplateMemorandumGenerator } from '../dist/memorandum/index.js';
import { ClaudeMemorandumGenerator } from '../dist/memorandum/claude.js';
import { runValuation } from '../dist/valuation/index.js';
import { runReadiness } from '../dist/readiness/index.js';
import { runBuyerDiscovery } from '../dist/buyers/index.js';
import { runDueDiligence } from '../dist/diligence/index.js';
import { SAMPLE_SAAS } from './sample.js';

function inputs() {
  const valuation = runValuation(SAMPLE_SAAS, { reportType: 'strategic' });
  return {
    company: SAMPLE_SAAS,
    valuation,
    readiness: runReadiness(SAMPLE_SAAS),
    buyers: runBuyerDiscovery(SAMPLE_SAAS),
    diligence: runDueDiligence(SAMPLE_SAAS),
  };
}

test('template generator produces all five document kinds', async () => {
  const gen = new TemplateMemorandumGenerator();
  const i = inputs();
  const kinds = ['cim', 'executive_summary', 'investor_deck', 'buyer_teaser', 'dd_room_index'];
  for (const k of kinds) {
    const doc = await gen.generate(k, i);
    assert.equal(doc.kind, k);
    assert.ok(doc.sections.length > 0);
    assert.ok(doc.title.length > 0);
    assert.ok(doc.wordCount > 0);
  }
});

test('buyer teaser anonymizes when requested', async () => {
  const gen = new TemplateMemorandumGenerator();
  const i = { ...inputs(), anonymize: true };
  const doc = await gen.generate('buyer_teaser', i);
  assert.equal(doc.anonymized, true);
  // company name should not appear when anonymized
  const fullText = doc.sections.map((s) => `${s.heading}\n${s.body}\n${(s.bullets ?? []).join('\n')}`).join('\n');
  assert.ok(!fullText.includes(SAMPLE_SAAS.name));
  assert.ok(fullText.includes('Project Cipher'));
});

test('CIM includes valuation methodology table', async () => {
  const gen = new TemplateMemorandumGenerator();
  const doc = await gen.generate('cim', inputs());
  const valSection = doc.sections.find((s) => s.heading.toLowerCase().includes('financial performance'));
  assert.ok(valSection);
  assert.ok(valSection.tables && valSection.tables.length > 0);
});

test('investor deck has ten slides', async () => {
  const gen = new TemplateMemorandumGenerator();
  const doc = await gen.generate('investor_deck', inputs());
  assert.equal(doc.sections.length, 10);
});

test('ClaudeMemorandumGenerator falls back to template on upstream failure', async () => {
  const stub = async () => new Response('rate limited', { status: 429 });
  const gen = new ClaudeMemorandumGenerator({ apiKey: 'sk-test', fetchImpl: stub });
  const doc = await gen.generate('executive_summary', inputs());
  // Fallback returns a valid document from the template generator
  assert.equal(doc.kind, 'executive_summary');
  assert.ok(doc.sections.length > 0);
});

test('ClaudeMemorandumGenerator parses a stubbed response', async () => {
  const stub = async () => new Response(JSON.stringify({
    content: [{
      type: 'text',
      text: '{"sections":[{"heading":"Overview","body":"A strategic platform play.","bullets":["12M ARR","62% growth"]}]}',
    }],
  }), { status: 200 });
  const gen = new ClaudeMemorandumGenerator({ apiKey: 'sk-test', fetchImpl: stub });
  const doc = await gen.generate('executive_summary', inputs());
  assert.equal(doc.sections.length, 1);
  assert.equal(doc.sections[0].heading, 'Overview');
  assert.ok(doc.sections[0].bullets.length === 2);
  assert.ok(doc.producedBy.includes('claude-memorandum-generator'));
});

test('ClaudeMemorandumGenerator rejects missing api key', () => {
  assert.throws(() => new ClaudeMemorandumGenerator({ apiKey: '' }), /apiKey required/);
});

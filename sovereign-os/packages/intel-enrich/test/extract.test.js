import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockExtractor } from '../dist/extract/mock.js';
import { parseExtractionResponse, extractionPrompt } from '../dist/extract/prompt.js';
import { ClaudeExtractor } from '../dist/extract/claude.js';

test('MockExtractor identifies organizations from headline body', async () => {
  const ext = new MockExtractor();
  const r = await ext.extract({
    signalId: 's1', tenantId: 't1',
    title: 'Ministry of Finance briefs the Cabinet on the new procurement directive',
    bodyExcerpt: 'The Department of Justice and Bank of Sovereignty join the review board.',
    signalClass: 'news_article',
    publishedAt: '2026-05-30T12:00:00Z',
  });
  const orgs = r.entities.filter((e) => e.entityType === 'organization');
  const names = orgs.map((o) => o.mention);
  assert.ok(names.some((n) => n.includes('Ministry')), names.join(' / '));
  assert.ok(names.some((n) => n.includes('Cabinet') || n.includes('Department') || n.includes('Bank')), names.join(' / '));
});

test('parseExtractionResponse handles fenced JSON', () => {
  const raw = '```json\n{"entities":[{"entity_type":"person","mention":"Ana Souza","salience":0.9,"role":"subject"}]}\n```';
  const out = parseExtractionResponse(raw);
  assert.equal(out.length, 1);
  assert.equal(out[0].entityType, 'person');
  assert.equal(out[0].mention, 'Ana Souza');
  assert.equal(out[0].role, 'subject');
});

test('parseExtractionResponse rejects invalid entity types', () => {
  const raw = '{"entities":[{"entity_type":"robot","mention":"X"}]}';
  const out = parseExtractionResponse(raw);
  assert.equal(out.length, 0);
});

test('parseExtractionResponse caps at 12 entities', () => {
  const items = Array.from({ length: 50 }, (_, i) => ({ entity_type: 'organization', mention: `Org ${i}`, salience: 0.5 }));
  const out = parseExtractionResponse(JSON.stringify({ entities: items }));
  assert.equal(out.length, 12);
});

test('parseExtractionResponse handles bare array', () => {
  const out = parseExtractionResponse('[{"entity_type":"place","mention":"Lisbon","salience":0.7}]');
  assert.equal(out.length, 1);
  assert.equal(out[0].mention, 'Lisbon');
});

test('extractionPrompt includes title, body, class, url when present', () => {
  const { system, user } = extractionPrompt({
    signalId: 's', tenantId: 't',
    title: 'A title', bodyExcerpt: 'A body', canonicalUrl: 'https://x', signalClass: 'news_article',
    publishedAt: '2026-05-30T12:00:00Z',
  });
  assert.ok(system.includes('institutional intelligence'));
  assert.ok(user.includes('A title'));
  assert.ok(user.includes('A body'));
  assert.ok(user.includes('https://x'));
});

test('ClaudeExtractor uses a stubbed fetch and parses the response', async () => {
  const stub = async (_url, init) => {
    assert.equal(init.method, 'POST');
    return new Response(JSON.stringify({
      content: [{ type: 'text', text: '{"entities":[{"entity_type":"organization","mention":"Ministry of Finance","salience":0.9}]}' }],
    }), { status: 200 });
  };
  const ext = new ClaudeExtractor({ apiKey: 'sk-test', fetchImpl: stub });
  const r = await ext.extract({
    signalId: 's', tenantId: 't', title: 'X', signalClass: 'news_article', publishedAt: '2026-05-30T12:00:00Z',
  });
  assert.equal(r.entities.length, 1);
  assert.equal(r.entities[0].mention, 'Ministry of Finance');
});

test('ClaudeExtractor surfaces upstream error', async () => {
  const stub = async () => new Response('rate limited', { status: 429 });
  const ext = new ClaudeExtractor({ apiKey: 'sk-test', fetchImpl: stub });
  await assert.rejects(
    () => ext.extract({ signalId: 's', tenantId: 't', title: 'X', signalClass: 'news_article', publishedAt: '2026-05-30T12:00:00Z' }),
    /429/,
  );
});

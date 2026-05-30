import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enrichOne, MockExtractor, MockEmbedder, MockResolver } from '../dist/index.js';

// Minimal fake Supabase capturing upserts/updates so we can assert the
// runner persists the right rows.
function fakeSupabase() {
  const writes = { signalUpdates: [], signalEntities: [], embeddings: [] };
  const builder = (table) => ({
    update(payload) {
      if (table === 'intel_signals') {
        return {
          async eq(field, value) {
            writes.signalUpdates.push({ field, value, payload });
            return { data: null, error: null };
          },
        };
      }
      return { eq: async () => ({ data: null, error: null }) };
    },
    upsert(rows) {
      if (table === 'intel_signal_entities') writes.signalEntities.push(...(Array.isArray(rows) ? rows : [rows]));
      if (table === 'intel_signal_embeddings') writes.embeddings.push(rows);
      return { data: null, error: null };
    },
  });
  return { from: (t) => builder(t), _writes: writes };
}

test('enrichOne walks language → sentiment → extract → embed → resolve → persist', async () => {
  const supabase = fakeSupabase();
  const pipeline = {
    extractor: new MockExtractor(),
    embedder:  new MockEmbedder(),
    resolver:  new MockResolver(),
  };

  const r = await enrichOne(supabase, {
    signalId: 'sig-1',
    tenantId: 'tenant-1',
    title: 'Ministry of Finance briefs the Cabinet on crisis response',
    bodyExcerpt: 'Strong support for the new measures. Minister Ana Souza announced the package.',
    signalClass: 'news_article',
    publishedAt: '2026-05-30T10:00:00Z',
  }, pipeline);

  assert.equal(r.errors.length, 0);
  assert.equal(r.language?.language, 'en');
  assert.ok(r.sentiment && r.sentiment.confidence > 0);
  assert.ok(r.embedding && r.embedding.embedding.length === 1024);
  assert.ok(r.entities.length >= 1);

  // Sentiment + language persisted onto the signal.
  assert.equal(supabase._writes.signalUpdates.length, 1);
  assert.equal(supabase._writes.signalUpdates[0].field, 'id');
  assert.equal(supabase._writes.signalUpdates[0].value, 'sig-1');
  assert.equal(supabase._writes.signalUpdates[0].payload.language, 'en');

  // Junction rows written.
  assert.ok(supabase._writes.signalEntities.length >= 1);
  assert.equal(supabase._writes.signalEntities[0].signal_id, 'sig-1');
  assert.equal(supabase._writes.signalEntities[0].tenant_id, 'tenant-1');

  // Embedding written.
  assert.equal(supabase._writes.embeddings.length, 1);
  assert.equal(supabase._writes.embeddings[0].signal_id, 'sig-1');
  assert.equal(supabase._writes.embeddings[0].model.startsWith('mock-embedder'), true);
  assert.ok(typeof supabase._writes.embeddings[0].embedding === 'string');
  assert.ok(supabase._writes.embeddings[0].embedding.startsWith('['));
});

test('enrichOne tolerates extractor failure and still persists other layers', async () => {
  const supabase = fakeSupabase();
  const failingExtractor = {
    name: 'failing', version: '0', async extract() { throw new Error('upstream 500'); },
  };
  const pipeline = {
    extractor: failingExtractor,
    embedder: new MockEmbedder(),
    resolver: new MockResolver(),
  };
  const r = await enrichOne(supabase, {
    signalId: 'sig-2',
    tenantId: 'tenant-1',
    title: 'Headline',
    signalClass: 'news_article',
    publishedAt: '2026-05-30T10:00:00Z',
  }, pipeline);
  assert.ok(r.errors.some((e) => e.startsWith('extract:')));
  // Embedding still written; sentiment + language updated.
  assert.equal(supabase._writes.signalUpdates.length, 1);
  assert.equal(supabase._writes.embeddings.length, 1);
  assert.equal(r.entities.length, 0);
});

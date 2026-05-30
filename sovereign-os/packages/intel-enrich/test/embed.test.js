import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockEmbedder, EMBEDDING_DIMENSIONS } from '../dist/index.js';
import { VoyageEmbedder } from '../dist/embed/voyage.js';

test('MockEmbedder produces a normalized 1024-dim vector', async () => {
  const e = new MockEmbedder();
  const r = await e.embed('s1', 'The institution responds to crisis within four hours.');
  assert.equal(r.embedding.length, EMBEDDING_DIMENSIONS);
  const norm = Math.sqrt(r.embedding.reduce((s, v) => s + v * v, 0));
  assert.ok(Math.abs(norm - 1) < 1e-6, `expected unit norm, got ${norm}`);
});

test('MockEmbedder is deterministic for the same input', async () => {
  const e = new MockEmbedder();
  const a = await e.embed('s', 'same text');
  const b = await e.embed('s', 'same text');
  assert.deepEqual(a.embedding.slice(0, 8), b.embedding.slice(0, 8));
});

test('MockEmbedder differs across inputs', async () => {
  const e = new MockEmbedder();
  const a = await e.embed('s', 'alpha');
  const b = await e.embed('s', 'beta');
  // First few components should differ.
  assert.notDeepEqual(a.embedding.slice(0, 16), b.embedding.slice(0, 16));
});

test('VoyageEmbedder requires apiKey', () => {
  assert.throws(() => new VoyageEmbedder({ apiKey: '' }), /apiKey required/);
});

test('VoyageEmbedder parses a stubbed batch response', async () => {
  const vec = Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => (i % 2 === 0 ? 0.01 : -0.01));
  const stub = async () => new Response(JSON.stringify({
    data: [{ embedding: vec }, { embedding: vec }],
  }), { status: 200 });
  const e = new VoyageEmbedder({ apiKey: 'pa-test', fetchImpl: stub });
  const results = await e.embedBatch([{ signalId: 's1', text: 'a' }, { signalId: 's2', text: 'b' }]);
  assert.equal(results.length, 2);
  assert.equal(results[0].embedding.length, EMBEDDING_DIMENSIONS);
  assert.equal(results[0].signalId, 's1');
});

test('VoyageEmbedder rejects dimension mismatch', async () => {
  const stub = async () => new Response(JSON.stringify({ data: [{ embedding: [1, 2, 3] }] }), { status: 200 });
  const e = new VoyageEmbedder({ apiKey: 'pa-test', fetchImpl: stub });
  await assert.rejects(() => e.embed('s', 'x'), /dims/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { persist } from '../dist/normalizer.js';

// Minimal fake supabase client supporting .from(table).insert(...).select(...).single()
// + .from(table).insert(...) terminal call. Captures inserts for inspection.
function fakeSupabase({ duplicateHashes = new Set() } = {}) {
  const inserted = { raw: [], signal: [] };
  const lookups = [];

  function tableBuilder(table) {
    let lastInsert = null;
    const builder = {
      insert(payload) {
        lastInsert = payload;
        if (table === 'intel_raw_documents') inserted.raw.push(payload);
        if (table === 'intel_signals')       inserted.signal.push(payload);
        return builder;
      },
      select() { return builder; },
      eq(field, value) { lookups.push({ table, field, value }); return builder; },
      maybeSingle() {
        return Promise.resolve({ data: { id: `mock-${inserted.raw.length}` }, error: null });
      },
      async single() {
        const hash = lastInsert?.content_hash;
        const cls = lastInsert?.signal_class;
        if (duplicateHashes.has(hash)) {
          return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
        }
        if (cls) {
          return { data: { id: `mock-signal-${inserted.signal.length}` }, error: null };
        }
        return { data: { id: `mock-raw-${inserted.raw.length}` }, error: null };
      },
      then(resolve) {
        // Terminal await on the insert() call (no .select()/.single()).
        const hash = lastInsert?.content_hash;
        if (duplicateHashes.has(hash)) {
          return resolve({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } });
        }
        return resolve({ data: null, error: null });
      },
    };
    return builder;
  }

  return {
    from(table) { return tableBuilder(table); },
    _inserted: inserted,
    _lookups: lookups,
  };
}

const samplePull = {
  raws: [
    { contentHash: 'aaaa', canonicalUrl: 'https://x.example/1', mime: 'application/json', bytes: 10, payloadExcerpt: '{}', provenance: { fetchedAt: '2026-05-30T12:00:00Z', connectorVersion: 'test@1' } },
    { contentHash: 'bbbb', canonicalUrl: 'https://x.example/2', mime: 'application/json', bytes: 10, payloadExcerpt: '{}', provenance: { fetchedAt: '2026-05-30T12:00:00Z', connectorVersion: 'test@1' } },
  ],
  signals: [
    { contentHash: '1111', canonicalUrl: 'https://x.example/1', signalClass: 'news_article', publishedAt: '2026-05-30T11:00:00Z', title: 'A', attestations: {}, provenance: { fetchedAt: '2026-05-30T12:00:00Z', connectorVersion: 'test@1' } },
    { contentHash: '2222', canonicalUrl: 'https://x.example/2', signalClass: 'news_article', publishedAt: '2026-05-30T11:05:00Z', title: 'B', attestations: {}, provenance: { fetchedAt: '2026-05-30T12:00:00Z', connectorVersion: 'test@1' } },
  ],
};

test('persist inserts raw + signal rows under the correct tenant', async () => {
  const supabase = fakeSupabase();
  const outcome = await persist({ supabase, tenantId: 'tenant-1', sourceId: 'src-1' }, samplePull);
  assert.equal(outcome.pulled, 2);
  assert.equal(outcome.inserted, 2);
  assert.equal(outcome.duplicates, 0);
  assert.equal(outcome.errors.length, 0);
  assert.equal(supabase._inserted.raw.length, 2);
  assert.equal(supabase._inserted.signal.length, 2);
  assert.equal(supabase._inserted.signal[0].tenant_id, 'tenant-1');
  assert.equal(supabase._inserted.signal[0].signal_class, 'news_article');
});

test('persist counts duplicates rather than erroring', async () => {
  const dup = new Set(['\\x2222']);
  const supabase = fakeSupabase({ duplicateHashes: dup });
  const outcome = await persist({ supabase, tenantId: 'tenant-1', sourceId: 'src-1' }, samplePull);
  assert.equal(outcome.duplicates, 1);
  assert.equal(outcome.inserted, 1);
  assert.equal(outcome.errors.length, 0);
});

test('persist surfaces non-dedup errors', async () => {
  const supabase = {
    from(table) {
      return {
        insert() { return this; },
        select() { return this; },
        async single() { return { data: null, error: { code: '42P01', message: 'relation does not exist' } }; },
        async then(resolve) { return resolve({ data: null, error: { code: '42P01', message: 'relation does not exist' } }); },
      };
    },
  };
  const outcome = await persist({ supabase, tenantId: 'tenant-1', sourceId: 'src-1' }, samplePull);
  assert.ok(outcome.errors.length > 0);
});

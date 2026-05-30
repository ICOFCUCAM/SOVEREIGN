import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockResolver, normalizeName, jaccard } from '../dist/index.js';

const t = 'tenant-1';

test('normalizeName strips honorifics and corporate suffixes', () => {
  assert.equal(normalizeName('Dr. Ana Souza'), 'ana souza');
  assert.equal(normalizeName('Cabinet Office'), 'cabinet office');
  assert.equal(normalizeName('Sovereign Bank Inc.'), 'sovereign bank');
});

test('jaccard is symmetric and bounded', () => {
  assert.ok(jaccard('a b c', 'a b c') === 1);
  assert.ok(jaccard('a b c', 'd e f') === 0);
  const ab = jaccard('Cabinet of Ministers', 'Cabinet Ministers');
  assert.ok(ab > 0 && ab <= 1);
});

test('MockResolver creates on first sight then matches by alias', async () => {
  const r = new MockResolver();
  const a = await r.resolve(t, { entityType: 'organization', mention: 'Ministry of Finance', salience: 0.8 });
  const b = await r.resolve(t, { entityType: 'organization', mention: 'ministry of finance', salience: 0.7 });
  assert.equal(a.created, true);
  assert.equal(b.created, false);
  assert.equal(a.entityId, b.entityId);
  assert.equal(b.via, 'alias');
});

test('MockResolver matches via external_id when present', async () => {
  const r = new MockResolver();
  const a = await r.resolve(t, {
    entityType: 'organization',
    mention: 'Bank of Sovereignty',
    salience: 0.8,
    externalIds: { wikidata: 'Q9999999' },
  });
  const b = await r.resolve(t, {
    entityType: 'organization',
    mention: 'BoS',
    salience: 0.5,
    externalIds: { wikidata: 'Q9999999' },
  });
  assert.equal(a.entityId, b.entityId);
  assert.equal(b.via, 'external_id');
});

test('MockResolver fuzzy-matches via jaccard threshold', async () => {
  const r = new MockResolver();
  await r.resolve(t, { entityType: 'organization', mention: 'Cabinet of Ministers', salience: 0.8, aliases: ['Cabinet'] });
  const m = await r.resolve(t, { entityType: 'organization', mention: 'Cabinet Ministers', salience: 0.7 });
  assert.equal(m.created, false);
  assert.ok(['fuzzy', 'alias'].includes(m.via));
});

test('MockResolver keeps tenants isolated', async () => {
  const r = new MockResolver();
  const a = await r.resolve('A', { entityType: 'person', mention: 'Ana Souza', salience: 0.8 });
  const b = await r.resolve('B', { entityType: 'person', mention: 'Ana Souza', salience: 0.8 });
  assert.notEqual(a.entityId, b.entityId);
  assert.equal(a.created, true);
  assert.equal(b.created, true);
});

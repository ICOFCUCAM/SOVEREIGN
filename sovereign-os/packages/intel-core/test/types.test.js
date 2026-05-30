import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SIGNAL_CLASSES, ENTITY_TYPES, SOURCE_FAMILIES, INTEL_JOB_KINDS,
  isSignalClass, isEntityType, isSourceFamily, isIntelJobKind,
} from '../dist/types.js';
import { canonicalizeUrl, signalContentHash, sha256Hex } from '../dist/hashing.js';
import { makeProvenance } from '../dist/connector.js';

test('signal classes are unique and stable', () => {
  const s = new Set(SIGNAL_CLASSES);
  assert.equal(s.size, SIGNAL_CLASSES.length);
  assert.ok(SIGNAL_CLASSES.includes('news_article'));
  assert.ok(SIGNAL_CLASSES.includes('regulatory_filing'));
});

test('entity types are unique and stable', () => {
  assert.equal(new Set(ENTITY_TYPES).size, ENTITY_TYPES.length);
  assert.ok(ENTITY_TYPES.includes('organization'));
});

test('intel job kinds match the migration vocabulary', () => {
  assert.deepEqual([...INTEL_JOB_KINDS].sort(), [
    'intel.cluster','intel.embed','intel.evaluate','intel.extract','intel.ingest','intel.normalize',
  ]);
});

test('type guards reject non-vocabulary values', () => {
  assert.equal(isSignalClass('news_article'), true);
  assert.equal(isSignalClass('nope'), false);
  assert.equal(isEntityType('person'), true);
  assert.equal(isEntityType('robot'), false);
  assert.equal(isSourceFamily('news'), true);
  assert.equal(isSourceFamily('aether'), false);
  assert.equal(isIntelJobKind('intel.ingest'), true);
  assert.equal(isIntelJobKind('film'), false);
});

test('canonicalizeUrl strips tracking params and fragments', () => {
  const u = canonicalizeUrl('https://Example.com/path?utm_source=x&q=1#section');
  assert.equal(u, 'https://example.com/path?q=1');
});

test('canonicalizeUrl drops trailing slash on long paths', () => {
  assert.equal(canonicalizeUrl('https://a.example/b/'), 'https://a.example/b');
});

test('signalContentHash is stable across syndication noise', () => {
  const a = signalContentHash({
    canonicalUrl: 'https://outlet-a.com/story?utm_source=x',
    title: 'Crisis declared',
    bodyExcerpt: 'The cabinet declared a crisis.',
  });
  const b = signalContentHash({
    canonicalUrl: 'https://outlet-a.com/story',
    title: 'Crisis declared',
    bodyExcerpt: 'The cabinet declared a crisis.',
  });
  assert.equal(a, b);
});

test('signalContentHash differs across content', () => {
  const a = signalContentHash({ title: 'A', bodyExcerpt: 'x' });
  const b = signalContentHash({ title: 'B', bodyExcerpt: 'x' });
  assert.notEqual(a, b);
});

test('sha256Hex is hex and 64 chars', () => {
  const h = sha256Hex('hello');
  assert.match(h, /^[0-9a-f]{64}$/);
});

test('makeProvenance carries connector identity', () => {
  const p = makeProvenance('gdelt-v2', '0.1.0', { etag: 'W/"abc"' });
  assert.match(p.connectorVersion, /^gdelt-v2@/);
  assert.equal(p.etag, 'W/"abc"');
  assert.ok(typeof p.fetchedAt === 'string');
});

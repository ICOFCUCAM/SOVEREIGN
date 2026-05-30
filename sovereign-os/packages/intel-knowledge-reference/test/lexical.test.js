import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, score, makeDoc } from '../dist/lexical.js';

test('tokenize lowercases and filters stopwords', () => {
  const t = tokenize('The Doctrine of Sovereign Intelligence is clear.');
  assert.ok(t.includes('doctrine'));
  assert.ok(t.includes('sovereign'));
  assert.ok(t.includes('intelligence'));
  assert.ok(!t.includes('the'));
  assert.ok(!t.includes('is'));
});

test('score ranks the most relevant document first', () => {
  const corpus = [
    makeDoc('a', 'The institutional doctrine on crisis response is clear.'),
    makeDoc('b', 'Quarterly financial results were broadly positive.'),
    makeDoc('c', 'Crisis doctrine requires immediate cabinet briefing.'),
  ];
  const results = score('crisis doctrine', corpus);
  assert.ok(results.length >= 2);
  assert.ok(['a', 'c'].includes(results[0].id), `expected a or c first, got ${results[0].id}`);
});

test('score returns empty for no matches', () => {
  const corpus = [makeDoc('a', 'finance markets quarterly')];
  assert.deepEqual(score('aviation logistics', corpus), []);
});

test('tokenize handles empty and noisy input', () => {
  assert.deepEqual(tokenize(''), []);
  assert.deepEqual(tokenize('!!! ???'), []);
});

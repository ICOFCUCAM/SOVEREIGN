import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreSentiment } from '../dist/sentiment.js';

test('scores positive headline correctly', () => {
  const r = scoreSentiment('Markets rally on strong earnings beat and partnership growth.');
  assert.ok(r.polarity > 0.2, `polarity should be positive, got ${r.polarity}`);
  assert.ok(r.confidence > 0.2);
});

test('scores negative headline correctly', () => {
  const r = scoreSentiment('Crisis deepens as sanctions hit and markets collapse on attack.');
  assert.ok(r.polarity < -0.2, `polarity should be negative, got ${r.polarity}`);
});

test('negation flips polarity', () => {
  const positive = scoreSentiment('Strong support for the deal.').polarity;
  const negated  = scoreSentiment('Not strong support for the deal.').polarity;
  assert.ok(negated < positive);
});

test('intensifier amplifies polarity', () => {
  const plain      = scoreSentiment('Strong growth this quarter.').polarity;
  const intensified = scoreSentiment('Very strong growth this quarter.').polarity;
  assert.ok(intensified >= plain);
});

test('neutral text returns near-zero polarity', () => {
  const r = scoreSentiment('The committee meets every Tuesday morning at ten.');
  assert.ok(Math.abs(r.polarity) < 0.2);
});

test('empty text returns zero confidence', () => {
  const r = scoreSentiment('');
  assert.equal(r.confidence, 0);
});

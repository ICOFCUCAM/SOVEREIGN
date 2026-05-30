import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguage } from '../dist/language.js';

test('detects English via stopwords', () => {
  const r = detectLanguage('The minister briefed the cabinet on the new policy this morning.');
  assert.equal(r.language, 'en');
  assert.ok(r.confidence > 0.4);
});

test('detects Portuguese via stopwords', () => {
  const r = detectLanguage('O ministro informou o gabinete sobre a nova política esta manhã.');
  assert.equal(r.language, 'pt');
  assert.ok(r.confidence > 0.4);
});

test('detects French via stopwords', () => {
  const r = detectLanguage('Le ministre a informé le cabinet sur la nouvelle politique ce matin.');
  assert.equal(r.language, 'fr');
});

test('detects Arabic via script', () => {
  const r = detectLanguage('وزارة الخارجية أصدرت بيانا اليوم.');
  assert.equal(r.language, 'ar');
  assert.ok(r.confidence > 0.5);
});

test('detects CJK Japanese via kana', () => {
  const r = detectLanguage('内閣は今朝、新しい政策について大臣に説明を受けました。');
  assert.equal(r.language, 'ja');
});

test('returns low-confidence on tiny input', () => {
  const r = detectLanguage('Hi.');
  assert.ok(r.confidence < 0.2);
});

test('returns und on mixed scripts', () => {
  const r = detectLanguage('ABC 文字 vapor wave 한글 русский العربية mixedmess');
  assert.ok(['und', 'mixed'].includes(r.language) || r.confidence < 0.5);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MEDIA_CLASS_PRESETS, isMediaClass, mediaDirective } from '../dist/media.js';

test('four content classes are defined', () => {
  assert.deepEqual(Object.keys(MEDIA_CLASS_PRESETS).sort(), ['cinematic', 'crisis', 'operational', 'strategic']);
});

test('each preset has a directive + scene count', () => {
  for (const p of Object.values(MEDIA_CLASS_PRESETS)) {
    assert.ok(p.directive.length > 0);
    assert.ok(p.scenes >= 1 && p.scenes <= 6);
  }
});

test('isMediaClass guards correctly', () => {
  assert.equal(isMediaClass('cinematic'), true);
  assert.equal(isMediaClass('nope'), false);
  assert.equal(isMediaClass(42), false);
});

test('mediaDirective returns the class directive', () => {
  assert.match(mediaDirective('crisis'), /CRISIS/i);
});

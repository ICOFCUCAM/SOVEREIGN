import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAgent } from '../dist/runner.js';
import { AGENT_IDS, isAgentId, toJobInput } from '../dist/registry.js';
import { AGENT_META } from '../dist/prompts.js';

test('seven agents are registered with prompts', () => {
  assert.equal(AGENT_IDS.length, 7);
  for (const id of AGENT_IDS) {
    assert.ok(AGENT_META[id].label.length > 0);
  }
});

test('isAgentId guards', () => {
  assert.equal(isAgentId('revenue'), true);
  assert.equal(isAgentId('nope'), false);
});

test('toJobInput shapes an intelligence job', () => {
  const j = toJobInput('content', 'make a brief');
  assert.equal(j.kind, 'intelligence');
  assert.equal(j.title, 'agent:content');
  assert.equal(j.input.agent, 'content');
});

test('runAgent is a dormant no-op without an api key', async () => {
  const r = await runAgent('viral', { prompt: 'forecast' }, { apiKey: undefined });
  assert.equal(r.implemented, false);
  assert.equal(r.agent, 'viral');
});

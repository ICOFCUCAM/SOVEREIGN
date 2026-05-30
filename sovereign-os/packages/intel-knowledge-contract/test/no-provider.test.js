import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NoProvider, CONTRACT_NAME, CONTRACT_VERSION, isKnowledgeError } from '../dist/index.js';
import { runContractTests } from '../dist/test-suite.js';

const principal = {
  tenantId: 'tenant-a',
  principalId: 'user-1',
  roles: ['operator'],
};

test('NoProvider declares correct meta', () => {
  assert.equal(NoProvider.meta.contract, CONTRACT_NAME);
  assert.equal(NoProvider.meta.version, CONTRACT_VERSION);
  assert.equal(NoProvider.meta.implementation, 'no-provider');
});

test('NoProvider health reports down', async () => {
  const h = await NoProvider.health();
  assert.equal(h.status, 'down');
});

test('NoProvider returns no_provider on every read', async () => {
  const r = await NoProvider.documents.list(principal, {});
  assert.equal(r.ok, false);
  assert.ok(!r.ok);
  assert.equal(r.error.code, 'no_provider');
  assert.equal(r.error.retryable, false);
  assert.ok(isKnowledgeError(r.error));
});

test('NoProvider returns no_provider on every write', async () => {
  const r = await NoProvider.memory.recordEvent(principal, {
    eventType: 'test',
    occurredAt: new Date().toISOString(),
    subjectEntityIds: [],
    summary: 's',
    payload: {},
    originService: 'test',
  });
  assert.equal(r.ok, false);
  assert.ok(!r.ok);
  assert.equal(r.error.code, 'no_provider');
});

// Run the full reusable contract test suite against NoProvider so the
// test-suite module itself is exercised in CI.
runContractTests(NoProvider, { principal });

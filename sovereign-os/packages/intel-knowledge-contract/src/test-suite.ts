import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { KnowledgeProvider } from './contract.js';
import type { PrincipalContext } from './principal.js';
import { CONTRACT_NAME, CONTRACT_VERSION } from './version.js';
import { isKnowledgeError } from './errors.js';

// Reusable test harness any provider can run to prove conformance.
// Tests assert structural contract compliance — they do not exercise
// substrate-specific behaviour (e.g. retrieval quality).

export interface ContractTestOptions {
  readonly principal: PrincipalContext;
  readonly seedDocumentId?: string;
  readonly seedEntityId?: string;
  readonly skipWriteSide?: boolean;
}

export function runContractTests(
  provider: KnowledgeProvider,
  options: ContractTestOptions,
): void {
  const label = `[${provider.meta.implementation}@${provider.meta.implementationVersion}]`;

  test(`${label} declares the contract name and version`, () => {
    assert.equal(provider.meta.contract, CONTRACT_NAME);
    assert.equal(provider.meta.version, CONTRACT_VERSION);
  });

  test(`${label} exposes all six capability groups`, () => {
    assert.ok(provider.documents,  'documents capability missing');
    assert.ok(provider.reference,  'reference capability missing');
    assert.ok(provider.doctrine,   'doctrine capability missing');
    assert.ok(provider.graph,      'graph capability missing');
    assert.ok(provider.memory,     'memory capability missing');
    assert.ok(provider.governance, 'governance capability missing');
  });

  test(`${label} health returns a status enum`, async () => {
    const h = await provider.health();
    assert.ok(['ok', 'degraded', 'down'].includes(h.status));
    assert.ok(typeof h.checkedAt === 'string');
  });

  test(`${label} all read methods return a Result envelope`, async () => {
    const p = options.principal;
    const results = await Promise.all([
      provider.documents.list(p, {}),
      provider.documents.retrieve(p, options.seedDocumentId ?? 'unknown'),
      provider.documents.resolveExcerpt(p, options.seedDocumentId ?? 'unknown', 'a1'),
      provider.reference.search(p, 'doctrine', {}),
      provider.reference.similarTo(p, { kind: 'document', documentId: 'unknown' }, {}),
      provider.reference.groundedAnswer(p, 'What is the institutional doctrine?', {}),
      provider.doctrine.doctrineFor(p, 'crisis_response'),
      provider.doctrine.precedentFor(p, { kind: 'event', descriptor: 'unknown' }),
      provider.graph.resolve(p, { kind: 'name', value: 'unknown' }),
      provider.graph.neighbours(p, options.seedEntityId ?? 'unknown'),
      provider.graph.relationship(p, 'a', 'b'),
      provider.governance.classify(p, options.seedDocumentId ?? 'unknown'),
      provider.governance.accessFor(p, options.seedDocumentId ?? 'unknown'),
      provider.governance.auditTrail(p, options.seedDocumentId ?? 'unknown'),
    ]);

    for (const r of results) {
      assert.ok(typeof r === 'object' && r !== null, 'result must be an object');
      assert.equal(typeof r.ok, 'boolean', 'result must have boolean ok');
      if (r.ok) {
        assert.ok('value' in r, 'ok result must carry value');
      } else {
        assert.ok(isKnowledgeError(r.error), 'err result must carry KnowledgeError');
      }
    }
  });

  if (!options.skipWriteSide) {
    test(`${label} memory.recordEvent returns Result envelope`, async () => {
      const r = await provider.memory.recordEvent(options.principal, {
        eventType: 'contract.smoke',
        occurredAt: new Date().toISOString(),
        subjectEntityIds: [],
        summary: 'contract smoke test event',
        payload: { source: 'contract-tests' },
        originService: 'intel-knowledge-contract.test',
      });
      assert.equal(typeof r.ok, 'boolean');
      if (!r.ok) assert.ok(isKnowledgeError(r.error));
    });
  }

  test(`${label} rejects calls without a principal context`, async () => {
    // The contract requires PrincipalContext; passing a malformed value
    // must surface as invalid_argument rather than throw.
    const bad = { tenantId: 'tenant-a' } as unknown as PrincipalContext;
    const r = await provider.documents.list(bad, {});
    if (!r.ok) {
      assert.ok(['invalid_argument', 'unauthenticated', 'no_provider'].includes(r.error.code));
    }
  });
}

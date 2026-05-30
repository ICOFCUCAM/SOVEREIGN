import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReferenceKnowledgeProvider } from '../dist/index.js';
import { runContractTests } from '@sovereign/intel-knowledge-contract/test-suite';

const principal = {
  tenantId: 'tenant-a',
  principalId: 'user-1',
  roles: ['operator'],
  clearance: 'internal',
};

const otherTenant = {
  tenantId: 'tenant-b',
  principalId: 'user-2',
  roles: ['operator'],
  clearance: 'internal',
};

const ministerPrincipal = {
  tenantId: 'tenant-a',
  principalId: 'minister-1',
  roles: ['minister'],
  clearance: 'secret',
};

const lowClearance = {
  tenantId: 'tenant-a',
  principalId: 'user-3',
  roles: ['operator'],
  clearance: 'public',
};

async function seedProvider() {
  const p = new ReferenceKnowledgeProvider();
  await p.ingest(principal, {
    title: 'Crisis Response Doctrine v1',
    kind: 'doctrine',
    body: 'The institution responds to crisis through ministerial briefing within four hours.\n\nEvery decision is captured under audit.',
    classification: 'internal',
  });
  await p.ingest(principal, {
    title: 'Quarterly Financial Outlook',
    kind: 'report',
    body: 'Quarterly financial results were broadly positive across the operating divisions.',
    classification: 'internal',
  });
  await p.ingest(principal, {
    title: 'Classified Procurement Memo',
    kind: 'memo',
    body: 'Confidential procurement details for project Halcyon.',
    classification: 'secret',
  });
  return p;
}

test('reference provider declares correct contract meta', () => {
  const p = new ReferenceKnowledgeProvider();
  assert.equal(p.meta.contract, 'tier00.knowledge-provider');
  assert.equal(p.meta.version, '0.1.0');
  assert.equal(p.meta.implementation, 'intel-knowledge-reference');
  assert.ok(p.disclaimer.includes('Reference provider'));
});

test('reference provider health returns ok', async () => {
  const p = new ReferenceKnowledgeProvider();
  const h = await p.health();
  assert.equal(h.status, 'ok');
});

test('ingest stores a document and returns DocumentRef', async () => {
  const p = new ReferenceKnowledgeProvider();
  const r = await p.ingest(principal, { title: 'Charter v1', kind: 'doctrine', body: 'Section one.' });
  assert.ok(r.ok);
  assert.ok(r.value.documentId);
  assert.equal(r.value.kind, 'doctrine');
  assert.equal(r.value.title, 'Charter v1');
});

test('documents.list returns ingested documents for the tenant', async () => {
  const p = await seedProvider();
  const r = await p.documents.list(principal, {});
  assert.ok(r.ok);
  assert.equal(r.value.items.length, 3);
});

test('tenant isolation — other tenant sees no documents', async () => {
  const p = await seedProvider();
  const r = await p.documents.list(otherTenant, {});
  assert.ok(r.ok);
  assert.equal(r.value.items.length, 0);
});

test('classification — operator cannot read secret document', async () => {
  const p = await seedProvider();
  const list = await p.documents.list(principal, {});
  assert.ok(list.ok);
  const secret = list.value.items.find((d) => d.title.includes('Classified'));
  assert.ok(secret, 'seed should include the secret doc');
  const r = await p.documents.retrieve(principal, secret.documentId);
  assert.ok(r.ok);
  assert.equal(r.value.body, '[redacted]');
  assert.ok(r.value.redactions && r.value.redactions.length > 0);
});

test('classification — minister with secret clearance reads the secret document', async () => {
  const p = await seedProvider();
  const list = await p.documents.list(ministerPrincipal, {});
  assert.ok(list.ok);
  const secret = list.value.items.find((d) => d.title.includes('Classified'));
  assert.ok(secret, 'minister should see the secret doc in list');
  const r = await p.documents.retrieve(ministerPrincipal, secret.documentId);
  assert.ok(r.ok);
  assert.ok(r.value.body.includes('Halcyon'));
});

test('reference.search returns ranked results with citations', async () => {
  const p = await seedProvider();
  const r = await p.reference.search(principal, 'crisis ministerial briefing', {});
  assert.ok(r.ok);
  assert.ok(r.value.items.length > 0);
  assert.ok(r.value.items[0].ref.title.includes('Crisis'));
  assert.ok(r.value.items[0].excerpt.text.length > 0);
});

test('reference.groundedAnswer surfaces degraded flag', async () => {
  const p = await seedProvider();
  const r = await p.reference.groundedAnswer(principal, 'How does the institution respond to crisis?', {});
  assert.ok(r.ok);
  assert.equal(r.value.degraded, true);
  assert.ok(r.value.citations.length > 0);
});

test('reference.search returns invalid_argument for empty query', async () => {
  const p = await seedProvider();
  const r = await p.reference.search(principal, '   ', {});
  assert.ok(!r.ok);
  assert.equal(r.error.code, 'invalid_argument');
});

test('documents.resolveExcerpt returns text for valid anchor', async () => {
  const p = await seedProvider();
  const list = await p.documents.list(principal, {});
  assert.ok(list.ok);
  const doc = list.value.items.find((d) => d.title.includes('Crisis'));
  assert.ok(doc);
  const r = await p.documents.resolveExcerpt(principal, doc.documentId, 'c0');
  assert.ok(r.ok);
  assert.ok(r.value.text.length > 0);
});

test('documents.resolveExcerpt 404s for unknown anchor', async () => {
  const p = await seedProvider();
  const list = await p.documents.list(principal, {});
  const doc = list.value.items[0];
  const r = await p.documents.resolveExcerpt(principal, doc.documentId, 'c999');
  assert.ok(!r.ok);
  assert.equal(r.error.code, 'not_found');
});

test('memory.recordEvent appends and returns id', async () => {
  const p = new ReferenceKnowledgeProvider();
  const r = await p.memory.recordEvent(principal, {
    eventType: 'briefing.dispatched',
    occurredAt: new Date().toISOString(),
    subjectEntityIds: [],
    summary: 'Crisis briefing dispatched to cabinet',
    payload: { channel: 'cabinet' },
    originService: 'emergency-ai',
  });
  assert.ok(r.ok);
  assert.ok(r.value.eventId);
});

test('graph.resolve finds an entity by name', async () => {
  const p = new ReferenceKnowledgeProvider();
  // Use store directly via internal — exercise the resolve path with a seeded entity.
  // Since the contract does not expose entity ingest, drop through to the store.
  await p['store'].putEntity('tenant-a', {
    entityId: 'ent-1',
    entityType: 'person',
    canonicalName: 'Dr. Ana Souza',
    aliases: ['A. Souza'],
    attributes: { title: 'Minister of Interior' },
    firstSeenAt: '2024-01-01T00:00:00Z',
    lastSeenAt: '2025-01-01T00:00:00Z',
  });
  const r = await p.graph.resolve(principal, { kind: 'name', value: 'Dr. Ana Souza' });
  assert.ok(r.ok);
  assert.ok(r.value);
  assert.equal(r.value.canonicalName, 'Dr. Ana Souza');
});

test('governance.accessFor returns redact for under-clearance principal', async () => {
  const p = await seedProvider();
  const list = await p.documents.list(ministerPrincipal, {});
  const secret = list.value.items.find((d) => d.title.includes('Classified'));
  const r = await p.governance.accessFor(lowClearance, secret.documentId);
  assert.ok(r.ok);
  assert.equal(r.value.verdict, 'redact');
});

test('doctrine.doctrineFor returns curated doctrine excerpts', async () => {
  const p = await seedProvider();
  const docList = await p.documents.list(principal, {});
  const doctrine = docList.value.items.find((d) => d.title.includes('Crisis Response Doctrine'));
  assert.ok(doctrine);
  await p['store'].putDoctrine('tenant-a', 'crisis_response', {
    position: 'Ministerial briefing within four hours; every decision captured under audit.',
    jurisdiction: 'pt',
    issuedAt: new Date().toISOString(),
    citations: [{ documentId: doctrine.documentId, versionId: doctrine.versionId }],
  });
  const r = await p.doctrine.doctrineFor(principal, 'crisis_response', 'pt');
  assert.ok(r.ok);
  assert.equal(r.value.length, 1);
  assert.ok(r.value[0].position.includes('four hours'));
  assert.equal(r.value[0].citations.length, 1);
});

// Run the reusable contract test harness against the reference provider
// to prove conformance with @sovereign/intel-knowledge-contract.
const conformanceProvider = await (async () => {
  const p = await seedProvider();
  return p;
})();
runContractTests(conformanceProvider, { principal });

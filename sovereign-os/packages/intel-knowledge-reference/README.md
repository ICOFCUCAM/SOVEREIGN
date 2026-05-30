# @sovereign/intel-knowledge-reference

**Reference implementation** of the Tier 00 Knowledge Provider contract
(`@sovereign/intel-knowledge-contract`).

> ⚠ This is a reference implementation for development and integration
> testing. **Veritas OS** is the chartered production owner of Tier 00.
> Reference behaviour: lexical retrieval (BM25-style scoring), in-memory
> store by default, no embedding model, no LLM. Designed to be replaced.

## Why it exists

Phase 0.3 unblocks Emergency AI's Tier 01 work without waiting for the
Veritas OS production build. Emergency AI consumes the contract; the
reference provider satisfies the contract; tests exercise the entire
surface deterministically. When Veritas OS production ships, the
reference provider is decommissioned in favour of it — no change to
Emergency AI's call sites.

## Usage

```ts
import { ReferenceKnowledgeProvider } from '@sovereign/intel-knowledge-reference';

const provider = new ReferenceKnowledgeProvider();

// Seed institutional documents (non-contract convenience method)
await provider.ingest(
  { tenantId: 't', principalId: 'p', roles: ['operator'] },
  {
    title: 'Crisis Response Doctrine v1',
    kind: 'doctrine',
    body: 'The institution responds to crisis through ministerial briefing within four hours.',
    classification: 'internal',
  },
);

// Read through the contract surface
const r = await provider.reference.search(
  { tenantId: 't', principalId: 'p', roles: ['operator'] },
  'crisis briefing',
  {},
);
if (r.ok) console.log(r.value.items.map((i) => i.ref.title));
```

## What it does

| Capability | Implementation |
|---|---|
| `documents.retrieve / list / resolveExcerpt` | In-memory store with versioned envelopes, paragraph-anchor chunks |
| `reference.search / similarTo / groundedAnswer` | Lexical BM25 over chunked corpus; `groundedAnswer` returns stitched excerpts with `degraded: true` (no LLM) |
| `doctrine.doctrineFor / precedentFor` | Topic-indexed curated rows with citations; precedent draws from chunks via lexical relevance |
| `graph.resolve / neighbours / relationship` | In-memory entity graph with alias and external-id lookups |
| `memory.recordEvent / recordDecision / recordOutcome` | Append-only buckets per tenant |
| `governance.classify / accessFor / auditTrail` | Reference policy: clearance ladder (`public < internal < restricted < confidential < secret`) + jurisdiction match; every access path writes to the audit log |

## What it does not do

- Embedding-based semantic retrieval (lexical only — by design).
- LLM-grounded answers (returns concatenated top-N excerpts with `degraded: true`).
- Multi-jurisdiction federation, document workflow, real OCR / docx parsing.
- Durable storage (in-memory by default; a `KnowledgeStore` interface is provided so a Postgres-backed implementation can drop in without changing the provider).

These belong to Veritas OS production. The contract is designed to make
the upgrade transparent — provider swap, not a rewrite.

## Storage

`MemoryKnowledgeStore` is the default. Implement `KnowledgeStore` to back
the provider with Postgres, SQLite, or any other substrate:

```ts
import { ReferenceKnowledgeProvider, type KnowledgeStore } from '@sovereign/intel-knowledge-reference';

class MyPostgresStore implements KnowledgeStore { /* ... */ }
const provider = new ReferenceKnowledgeProvider({ store: new MyPostgresStore() });
```

## Conformance

The package self-runs the reusable contract test suite from
`@sovereign/intel-knowledge-contract/test-suite`. All structural contract
tests plus reference-specific behavioural tests pass green:

```
npm --workspace @sovereign/intel-knowledge-reference run test
```

## Boundary

This package implements one defined interface. It has no awareness of
Emergency AI, Sovereign Dispatch or any other Sovereign product. Those
products consume it through the contract — they do not couple to its
implementation.

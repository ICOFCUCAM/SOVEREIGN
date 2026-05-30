# @sovereign/intel-core

Canonical TypeScript types and base interfaces for the Sovereign
**Strategic Intelligence Substrate** (Phase 1, Tier 01+).

This package is interface-and-types only. It mirrors the `intel_*` tables
created in `supabase_migration_0024_intel_substrate.sql` and defines the
`Connector` contract that Sprint 1.2 connectors implement.

## Surface

| Module | What it carries |
|---|---|
| `types` | `SourceRecord`, `SignalRecord`, `EntityRecord`, `RelationshipRecord`, `WatchlistRecord`, `AlertRecord`, signal/entity/source vocabulary, watch-definition DSL |
| `connector` | `Connector` interface, `ConnectorContext`, `NormalizedSignal`, `makeProvenance` helper |
| `hashing` | `signalContentHash`, `canonicalizeUrl`, `sha256Hex` — stable dedup primitives shared by every connector |

## Connector contract

Sprint 1.2 will land one `Connector` implementation per source family
(GDELT, EDGAR, Mastodon, Reddit, government RSS, …). Each is a stateless
module the scheduler invokes:

```ts
import type { Connector } from '@sovereign/intel-core';

export const myConnector: Connector = {
  name: 'gdelt-v2',
  family: 'news',
  version: '0.1.0',
  async pull(ctx) {
    const res = await ctx.fetch('https://api.gdeltproject.org/...');
    // ... build NormalizedSignal[] and Raw[]
    return { raws, signals };
  },
};
```

The normalizer consumes `ConnectorPullResult`, dedups by
`signalContentHash`, writes `intel_raw_documents` and `intel_signals`.

## Boundary

This package contains no I/O. It does not know about Supabase, HTTP,
queues, or any infrastructure. Connector authors and downstream tiers
both depend on it; nothing here pulls in network or database libraries.

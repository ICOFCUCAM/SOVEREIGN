# @sovereign/intel-connectors

Sprint 1.2 deliverable for the **Strategic Intelligence Substrate**.
Three free, no-auth connectors landed, plus a signal normalizer and a
source runner.

| Connector | Family | Signal class | Cadence | Auth | Config |
|---|---|---|---|---|---|
| `hacker-news` | social | `social_post` | every poll | none | `{ }` (uses ctx.limit) |
| `rss`         | news (or override) | `news_article` (or override) | every poll | none | `{ feed_url, signal_class?, source_family?, language? }` |
| `gdelt-doc`   | news | `news_article` | every poll | none | `{ query, maxrecords?, timespan?, sort? }` |

The `rss` connector is generic — point it at any RSS or Atom feed
(government press releases, news outlets, blogs, regulatory wires) and
it produces normalized signals at no extra engineering cost.

## Module surface

| Module | Purpose |
|---|---|
| `connectors/*` | Three first-party connectors satisfying `@sovereign/intel-core` Connector |
| `parse/rss.ts` | Minimal RSS/Atom parser with CDATA + entity decoding |
| `parse/strip-html.ts` | HTML → plain-text excerpt extractor |
| `normalizer.ts` | `persist(ctx, result)` writes `intel_raw_documents` + `intel_signals` with content-hash dedup |
| `runner.ts` | `runSource({...})` and `runEnabledSources(supabase, tenantId)` |
| `registry.ts` | Connector lookup by name |

## Running once

```ts
import { createClient } from '@supabase/supabase-js';
import { runSource } from '@sovereign/intel-connectors';

const supabase = createClient(URL, SERVICE_ROLE_KEY);
const result = await runSource({
  supabase,
  source: {
    id: '...', tenantId: '...', family: 'news', connector: 'hacker-news',
    displayName: 'Hacker News', config: {}, enabled: true,
    rateLimitPolicy: {}, freshnessSlaMinutes: 15,
  },
  limit: 25,
});
console.log(result.outcome); // { pulled, inserted, duplicates, errors }
```

Or, batch:

```ts
const outcomes = await runEnabledSources(supabase, tenantId, { limit: 50 });
```

## Dedup model

Two hashes travel through the substrate:

- `intel_raw_documents.content_hash` — `sha256` of the raw payload (the
  raw JSON / XML the connector saw). Captures "did we already store this
  exact payload?".
- `intel_signals.content_hash` — `signalContentHash({ canonicalUrl, title,
  bodyExcerpt })` from `@sovereign/intel-core`. Captures "is this the
  same article across syndication / connectors?".

The normalizer treats unique-violation errors (Postgres `23505`) on
either hash as **duplicates**, not errors. Real errors (relation missing,
auth fail, schema mismatch) still surface in `PersistOutcome.errors`.

## Scope

Sprint 1.2 deliberately omits:

- Enrichment (entity extraction, sentiment, embeddings) — Sprint 1.3
- Scheduler / cron — Sprint 1.5–1.7
- Paid sources (NewsAPI, X, Apify) — Sprint 1.4
- Watchlist evaluation — Sprint 1.5

The runner pulls once per call; a scheduler (cron, queue, Fly machine)
calls the runner. This sprint proves the ingestion path end-to-end.

## Tests

```
npm --workspace @sovereign/intel-connectors run test
```

Covers RSS parser, all three connectors with mock fetch fixtures, and
the normalizer with a fake Supabase client (including duplicate-handling
and non-dedup error pathways). Live-DB integration smoke is run via the
sprint commit pipeline, not the test suite.

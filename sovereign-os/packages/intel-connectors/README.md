# @sovereign/intel-connectors

Sprint 1.2 deliverable for the **Strategic Intelligence Substrate**.
Three free, no-auth connectors landed, plus a signal normalizer and a
source runner.

| Connector | Family | Signal class | Sprint | Auth | Config |
|---|---|---|---|---|---|
| `hacker-news` | social | `social_post` | 1.2 | none | `{ }` (uses ctx.limit) |
| `rss`         | news (or override) | `news_article` (or override) | 1.2 | none | `{ feed_url, signal_class?, source_family?, language? }` |
| `gdelt-doc`   | news | `news_article` | 1.2 | none | `{ query, maxrecords?, timespan?, sort? }` |
| `newsapi`     | news | `news_article` | 1.4 | `NEWSAPI_KEY` env (or `source.auth_ref` override) | `{ query, sources?, domains?, language?, sortBy?, pageSize?, costPerRequestUsd? }` |
| `edgar`       | regulatory | `regulatory_filing` | 1.4 | none (UA-identified) | `{ cik, formTypes?, limit?, contactEmail? }` |
| `fred`        | financial | `financial_disclosure` | 1.4 | `FRED_API_KEY` env | `{ seriesId, observationStart?, observationEnd?, limit? }` |
| `apify`       | web | `news_article` (or override) | 1.4 | `APIFY_TOKEN` env | `{ actorId, input, signalClass?, mapping?, costPerRunUsd? }` |

The `rss` and `apify` connectors are generic — point them at any RSS/Atom
feed or any Apify actor (LinkedIn scraper, Companies House, press
wires) and they produce normalized signals via config alone.

## Rate-limit middleware

`rateLimitedFetch({ key, policy, fetchImpl?, clock?, sleep? })` wraps
fetch with a per-source token bucket honouring `requestsPerMinute`,
`requestsPerHour`, and `burst`. The runner applies it automatically
when `intel_sources.rate_limit_policy` is non-empty; multiple
connectors keyed off the same `source.id` share the bucket. `clock`
and `sleep` are injectable so tests drive the bucket deterministically.

## Cost telemetry

Connectors that incur per-pull cost (`newsapi`, `apify`) report a
`costEstimateUsd` field in `ConnectorPullResult.metadata`. The runner
writes the connector's full metadata into `intel_ingest_runs.metadata`
so per-tenant / per-source cost rollups become trivial:

```sql
select
  s.connector,
  sum((r.metadata ->> 'costEstimateUsd')::numeric * r.pulled_count) as cost_usd
from public.intel_ingest_runs r
join public.intel_sources s on s.id = r.source_id
where s.tenant_id = :tenant
group by s.connector;
```

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

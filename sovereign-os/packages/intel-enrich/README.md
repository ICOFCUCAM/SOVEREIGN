# @sovereign/intel-enrich

Sprint 1.3 deliverable for the **Strategic Intelligence Substrate**.
Walks freshly ingested signals through language detection, sentiment
scoring, entity extraction, embedding, and resolution against
institutional entity history.

## Pipeline

```
intel_signals (new) ─┐
                     ▼
            ┌────────────────────┐
            │  language          │  detectLanguage(text)
            │  sentiment         │  scoreSentiment(text)
            │  extract           │  EntityExtractor.extract(input)
            │  embed             │  Embedder.embed(text)
            │  resolve           │  EntityResolver.resolve(mention)
            └─────────┬──────────┘
                      │
                      ▼
        intel_signals               (sentiment, language)
        intel_signal_entities       (junction rows with salience)
        intel_entities              (created or matched)
        intel_signal_embeddings     (pgvector vector(1024))
```

## What's production-ready

| Backend | Status | Notes |
|---|---|---|
| `ClaudeExtractor`        | production | Anthropic Messages API; default `claude-haiku-4-5`; routing to Sonnet is the Enrichment Agent's job |
| `VoyageEmbedder`         | production | `voyage-3` → 1024-dim vectors matching the schema |
| `SupabaseEntityResolver` | production | Uses `intel_entities` with `external_id` → alias → fuzzy (`pg_trgm + jaccard`) → create |
| `WikidataClient`         | production | `wbsearchentities`, type-hint reranked; meant to layer on top of `SupabaseEntityResolver` |
| `detectLanguage`         | local heuristic | Unicode script + stopword scoring; swap in fasttext-ld / cld3 for production at scale |
| `scoreSentiment`         | local lexicon | Deterministic AFINN-flavoured scoring; production replaces with a model |

## What's for tests / reference only

| Backend | Why |
|---|---|
| `MockExtractor` | Regex-based; surfaces obvious Organization / Person mentions only |
| `MockEmbedder`  | Deterministic SHA-512 derived unit vectors — no semantic meaning |
| `MockResolver`  | In-memory alias graph for unit tests |

## Calling

```ts
import {
  enrichOne, runUnenrichedForTenant,
  ClaudeExtractor, VoyageEmbedder, SupabaseEntityResolver,
} from '@sovereign/intel-enrich';

const pipeline = {
  extractor: new ClaudeExtractor({ apiKey: process.env.ANTHROPIC_API_KEY! }),
  embedder:  new VoyageEmbedder({ apiKey: process.env.VOYAGE_API_KEY! }),
  resolver:  new SupabaseEntityResolver(supabaseServiceRole),
};

const outcome = await runUnenrichedForTenant({
  supabase: supabaseServiceRole,
  tenantId,
  pipeline,
  limit: 50,
});
console.log(outcome);
// { signalsProcessed, entitiesResolved, entitiesCreated, embeddingsWritten, errors }
```

## Scope

Sprint 1.3 deliberately omits:

- Connector scheduler / cron (Sprint 1.7)
- Topic clustering (Sprint 1.5)
- Watchlist evaluation (Sprint 1.5)
- True Claude Message Batches orchestration (interface ready;
  implementation is a thin extension of `ClaudeExtractor`)
- Paid OSINT sources (Sprint 1.4)

The runner pulls unenriched signals one-shot per call; a scheduler
calls the runner. This sprint proves the enrichment path end-to-end and
keeps every backend swappable.

## Tests

```
npm --workspace @sovereign/intel-enrich run test
```

Covers language detection (English, Portuguese, French, Arabic, CJK,
mixed), sentiment (positive, negative, negation, intensifier, neutral),
extractor (Mock + Claude with stubbed fetch + response-parser edge
cases), embedder (Mock + Voyage with stubbed fetch + dimension check),
resolver (alias → external_id → fuzzy → tenant isolation), runner
(end-to-end persistence + tolerance of extractor failure).

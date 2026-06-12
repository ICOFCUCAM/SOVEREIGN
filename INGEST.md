# Acquisition Registry Ingest — Runbook

Fills the four acquisition registries from primary sources only
(Wikipedia acquisition lists, Wikidata, SEC EDGAR). **No mock data:
the pipeline aborts rather than fabricate.**

## Prerequisite — network egress

The environment's allowed domains must include:

```
en.wikipedia.org
www.wikidata.org
query.wikidata.org
www.sec.gov
data.sec.gov
efts.sec.gov
```

The run starts with a preflight that verifies all six; if any is
blocked it exits with the exact missing hosts and writes nothing.

## Run

From the repo root:

```bash
npm install --prefix services/exit-engines   # once per fresh container
npm run ingest                               # full run (≈10–25 min, rate-limited politely)
```

Variants:

```bash
npm run ingest:smoke      # 8 list pages, no Wikidata — quick sanity pass
npm run ingest:validate   # audit generated datasets against the provenance contract
```

## Output

Written to `services/exit-engines/data/`:

| file | contents |
|---|---|
| `buyer_registry.json` | corporates + private equity + sovereign funds |
| `acquisition_events.json` | row-level events (target ≥ 5,000) |
| `acquisition_registry.json` | per-buyer rollups |
| `buyer_graph.json` | co-acquisition industry graph |
| `ingest_manifest.json` | counts vs targets, hosts used, timestamp |

Every record carries `source`, `source_url`, `confidence`,
`verification_status`, `last_updated` — enforced by the `meta()` factory
(throws on a record without a real URL) and by `npm run ingest:validate`.

## After a successful run

1. `npm run ingest:validate` must report zero errors.
2. Commit the generated `services/exit-engines/data/*.json`.
3. Optional: load into Supabase using `services/exit-engines/sql/acquisition_registries.sql`
   (the schema enforces the same provenance constraints as CHECK clauses).

## Source code

`services/exit-engines/src/scripts/ingest/` — `run.ts` (orchestrator),
`wikipedia.ts`, `wikidata.ts`, `sec.ts`, `sources.ts` (seed lists),
`validate.ts`, `types.ts` (provenance contract), `util.ts` (polite fetch).
Tests: `services/exit-engines/test/ingest.test.js`.

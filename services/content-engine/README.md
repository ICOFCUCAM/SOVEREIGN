# Content Engine — the Publishing & Knowledge Platform

The first-class subsystem behind Sovereign Dispatch's SEO ecosystem. It is **not
a content generator** — it is the publishing platform that owns the whole
lifecycle of every page across every layer (Industries, Concepts, Library, Docs)
and, by design, every language.

It produced SEO Layers 2–5 (≈ 420 pages). This package persists that pipeline as
a repeatable, auditable subsystem.

## What it does (the 18 capabilities)

| Capability | Where |
|---|---|
| **Topic database** | `data/topics.json` · `lib/store.cjs` · `topic` CLI |
| **Editorial workflow** | `lib/store.cjs` (STATES) · `workflow.md` · `queue` |
| **Human review** | `review <id> --approve/--reject` (gate before publish) |
| **AI authoring (parallel models)** | `lib/providers.cjs` (mock·harness·anthropic·openai) + selector |
| **Fact verification** | `lib/stages.cjs#factCheck` (honesty rules) |
| **Internal linking engine** | `lib/stages.cjs#linkSuggest` + `lib/graph.cjs` |
| **Schema generation** | `lib/stages.cjs#schemaFor` (DefinedTerm/Article/FAQ/Breadcrumb) |
| **Version history** | `data/versions.jsonl` · `lib/store.cjs#versions` |
| **Multi-language (architecture)** | `lib/stages.cjs#translatePlan` + `LOCALES` |
| **Publishing pipeline** | `lib/pipeline.cjs` (orchestrates every stage) |
| **Search Console integration** | `lib/seo.cjs#searchConsole` (live adapter + local store) |
| **Sitemap generation** | `lib/seo.cjs#feeds` · `merge` appends per-page URLs |
| **RSS** | `lib/seo.cjs#feeds` → `public/rss.xml` |
| **IndexNow support** | `lib/seo.cjs#indexNow` (`indexnow [--submit]`) |
| **Analytics & ranking tracking** | `data/rankings.jsonl` · `rankings pull/report` |
| **Content quality scoring** | `lib/stages.cjs#qualityScore` (0–100) |
| **Evergreen review scheduling** | `reviewEveryDays` · `refresh-due` |
| **Content relationships & graph** | `lib/graph.cjs` (`graph` → hubs, orphans) |

## The pipeline

```
topic ─▶ author (model A) ─▶ refine (model B) ─▶ fact verify ─▶ quality score
      ─▶ SEO review ─▶ internal linking ─▶ schema ─▶ translation plan
      ─▶ version snapshot ─▶ [HUMAN REVIEW] ─▶ publish (splice + sitemap)
      ─▶ feeds/RSS ─▶ IndexNow ─▶ rank monitor ─▶ refresh
```

`node bin/content.cjs pipeline <topicId>` runs all of it. Without `--autopublish`
it stops at the human-review gate (status → `in_review`); with `--autopublish` it
publishes only if **fact-check passes AND quality ≥ gate (70) AND SEO ≥ gate
(72)**, then snapshots a version with the next-review date set.

## Autonomous SEO engine

The loop most companies never build — discovery feeds the topic database:

```
Search Console ─▶ keyword discovery ─▶ competitor monitoring ─▶ missing topics
              ─▶ propose topics ─▶ pipeline ─▶ publish ─▶ track ranking ─▶ improve ─▶ repeat
```

- `discover gaps` — keywords whose best coverage across all 418 pages is below
  threshold (real gap analysis; returns the closest existing page).
- `discover opportunities` — striking-distance queries (position 8–25 with
  impressions) from the ranking store: *improve*, don't duplicate.
- `discover competitors` — gap-vs-competitor (reads `data/competitors.json`).
- `discover cycle [--propose]` — the whole loop; `--propose` seeds the top gaps
  into the topic database as `idea`s. **Discovery is autonomous; publishing keeps
  the human-review gate.**

## Versioning (first-class, not V1/V2)

Every published page is a versioned record — Knowledge / Publication / Policy /
Standard / API / Documentation / Language version — with **Current, Archive, full
history, Last reviewed and Next review**. Publishing snapshots the content and
computes the next review date from the topic's `reviewEveryDays`.

```bash
node bin/content.cjs version <slug>     # current + archive + timeline
node bin/content.cjs versions due       # pages past their next-review date
```

This matters most for standards and documentation, where "which version was in
force, and when" is the entire question.

## How the AI + external stages plug in

This sandbox has no model keys and no outbound egress, so the **deterministic
stages run here and now**; the **model-dependent stages are real adapters**:

- **Authoring** — `harness` provider emits a prompt spec (`prompts/*.md` + the
  topic) for a Claude/GPT subagent to fulfil; this is exactly how Layers 2–5 were
  written. The `anthropic` / `openai` providers are API adapters (need
  `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` + network). `mock` generates a
  schema-valid local draft so the full pipeline runs in tests.
- **Search Console** — `searchConsole.pull({live:true})` needs a Google service
  account; otherwise it reads the local `rankings.jsonl` snapshot store.
- **IndexNow** — `indexnow` writes the key file and prints the payload; `--submit`
  performs the real POST.

## CLI

```bash
node bin/content.cjs stats                 # pages per layer + topics
node bin/content.cjs queue                 # editorial board by state
node bin/content.cjs topic add my-id --title "..." --type concept
node bin/content.cjs pipeline my-id        # author → … → review gate
node bin/content.cjs review my-id --approve
node bin/content.cjs merge concept <dir>   # splice an authored batch into the site
node bin/content.cjs quality concept batch.json
node bin/content.cjs graph                 # hubs + orphan pages
node bin/content.cjs discover cycle        # autonomous SEO loop (gaps + opportunities)
node bin/content.cjs discover propose      # seed top gaps into the topic database
node bin/content.cjs version <slug>        # current + archive + version history
node bin/content.cjs versions due          # pages past their next-review date
node bin/content.cjs feeds                 # rss + image sitemap + index
node bin/content.cjs indexnow [--submit]
node bin/content.cjs rankings report
node bin/content.cjs refresh-due           # evergreen review due list
```

Set `DISPATCH_WEB` to point at the web app (defaults to `../dispatch-web`).

## Production data model

`data/*` is a file-backed reference store so the platform runs with zero
dependencies. The same shape maps onto Postgres in
[`schema/M30__content_engine.sql`](schema/M30__content_engine.sql) — topics,
versions, rankings and quality scores — for when the engine moves server-side
behind an internal CMS UI.

See [ADR-014](../../docs/adr/ADR-014-ai-publishing-engine.md) for the decision
record and [`workflow.md`](workflow.md) for the editorial state machine.

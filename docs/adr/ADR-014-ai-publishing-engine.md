# ADR-014 — The AI Publishing & Knowledge Platform

- **Status:** Accepted
- **Date:** 2026-06-27
- **Supersedes/relates:** ADR-013 (AI Illustration Engine) — same provider/scoring shape, applied to text.

## Context

The SEO ecosystem now spans five layers (~420 pages): the executive homepage,
70 industry pages, 300 concept pages, a long-form library, and developer docs.
These were produced by an ad-hoc pipeline (parallel authoring subagents → merge
scripts → schema → sitemap) that lived in scratch files. To scale this to
hundreds more pages, to keep quality and honesty consistent, and to extend to
**every language**, the pipeline must become a first-class, auditable subsystem —
not a pile of scripts.

The user's requirement is explicit: build the **Publishing & Knowledge Platform**
that becomes the foundation for all SEO and every language, with a topic
database, editorial workflow, human review, parallel-model authoring, fact
verification, an internal linking engine, schema generation, version history,
multi-language architecture, a publishing pipeline, Search Console integration,
sitemap/RSS/IndexNow, ranking tracking, quality scoring, evergreen review
scheduling, and a content relationship graph.

## Decision

Create `services/content-engine` as that subsystem. It owns the **deterministic
backbone** of publishing and treats the **model-dependent and external stages as
adapters** with a working local/mock mode:

- **Deterministic, runs anywhere:** topic store + editorial state machine,
  fact-verification (honesty rules), quality scoring (0–100), internal-linking
  graph (hubs/orphans), schema generation, version history, sitemap/RSS/image
  feeds, IndexNow payloads, evergreen scheduling, the merge/splice into the web
  app's data modules.
- **Adapters (real contract, mock fallback):** authoring providers
  (`harness` → agent subagent; `anthropic`/`openai` → model APIs; `mock` →
  local), and Search Console (live API → local rankings store).

The publishing target stays the existing TypeScript data modules in
`dispatch-web` (`industries.ts`, `problems.ts`, `library.ts`, `docs.ts`) rendered
by data-driven page components. The engine splices validated, normalized,
link-wired entries into them and updates the sitemaps/feeds — so published
content is plain, reviewable, version-controlled data, not a runtime CMS
dependency.

Persistence is file-backed (`data/*`) for zero-dependency operation, with a
production Postgres schema (`schema/M30__content_engine.sql`) as the server-side
target for when an internal CMS UI is added.

## Multi-language (architecture now, content later)

Locales are modelled (`LOCALES`, 11 languages incl. RTL Arabic). The strategy is
**locale-prefixed paths with a stable slug** (`/fr/learn/<slug>`), so hreflang is
a clean derivation and a page's translations share one identity. Real localized
content is produced by **re-running the authoring stage per locale** with a
translation system prompt — i.e. translation is just another pipeline pass, which
is why the engine had to come before localization. No machine-translated pages
ship yet; only the architecture.

## Consequences

- The pipeline is repeatable and auditable; every page has a version trail and a
  quality score, and the graph surfaces orphan pages to fix (48 found at writing).
- New content is "author → verify → score → review → publish → index → monitor →
  refresh", driven from a topic database, not bespoke scripts.
- Fully-autonomous "one-click" runs require model keys + egress wired in a
  server context; in the agent environment, authoring runs through the harness
  (`harness` provider). This is documented, not hidden.
- Localization becomes a configuration + a per-locale authoring pass rather than
  a rebuild.

## Addendum — autonomous SEO loop, refine pass, first-class versioning

Extending the platform to match the full vision:

- **Autonomous SEO engine** (`lib/discover.cjs`): keyword-universe gap analysis
  against all 418 pages, striking-distance opportunities from the ranking store,
  competitor gap analysis, and `discover cycle --propose` which seeds the top
  gaps into the topic database. Discovery is autonomous; **publishing keeps the
  human-review gate** — the loop proposes, humans approve.
- **Two-model pipeline**: author with model A → `refine` with model B (Claude →
  GPT), plus a dedicated **SEO-review gate** distinct from quality. Publication
  now requires fact-check AND quality≥70 AND SEO≥72.
- **First-class versioning** (`lib/versioning.cjs`): every publish snapshots a
  versioned record with Current / Archive / history / Last reviewed / Next
  review. `versions due` feeds expired reviews back into the editorial queue —
  closing the evergreen loop, especially for standards and documentation.
- **Video sitemap** generator wired (emits when video content exists), completing
  the automatic per-page discovery family (title, meta, OG, Twitter, JSON-LD,
  FAQ/Breadcrumb/Article schema, canonical, hreflang-ready, sitemap, image
  sitemap, RSS, video sitemap, last-modified).

## Alternatives considered

- **Keep the scratch scripts** — rejected; not auditable, not scalable, no topic
  DB / review / versioning / monitoring.
- **A headless CMS (Sanity/Contentful)** — rejected for now; would move authority
  out of the repo and add a runtime dependency. The Postgres schema leaves that
  door open without taking it.
- **Runtime DB-backed pages** — rejected; published content as reviewed, diffable
  data in git matches the product's own "governed, versioned record" philosophy.

# Migration & Extraction Strategy

Principle: **extract + evolve, do not rewrite.** The source platform stays operational;
Sovereign OS reuses its proven media infrastructure as Layer 1 and grows the new layers
around it.

## Phase 1 — Foundation (this milestone) ✅

- [x] Audit source platform, identify the Media Acquisition Ecosystem.
- [x] Scaffold `sovereign-os/` monorepo (workspaces, core package, env, db migration).
- [x] Migrate the working media pipeline verbatim into `layers/layer-1-media`:
      8 edge functions + the FFmpeg worker.
- [x] Extract the `pipeline_jobs` job model into `@sovereign/core` (`jobs.ts`, `types.ts`).
- [x] Reconstruct the foundation DB schema (`db/migrations/0001_pipeline_foundation.sql`).
- [x] Seed Layer 2 (`post-campaign`) and Layer 3 (`analyze-lead`) with adapter/agent seams.

## Phase 2 — Layer 1 hardening (in progress)

- [x] Introduce a shared queue/media seam for the Deno edge runtime (`functions/_shared/`),
      mirroring `@sovereign/core` (`jobs.ts`/`media.ts`); repoint `orchestrate-film` onto it.
- [x] Add the four media classes (cinematic / operational / strategic / crisis) as a typed
      `media_class` on jobs and as director presets in `orchestrate-film`
      (`db/migrations/0002_media_class.sql`, `packages/core/src/media.ts`).
- [x] Repoint the remaining media functions (`render-video`, `poll-video-jobs`, `generate-narration`,
      `assemble-film`) onto the shared seam; thread `media_class` through `render-video`.
      All pipeline_jobs writes now flow through `_shared/queue` (`insertJob`/`transition`);
      only bespoke gather-selects remain as direct queries.
- [x] Build the executive command dashboard (`apps/command-center`, Next.js App Router + Tailwind).
      Consumes `@sovereign/core` (media presets, job types, platforms); panels for content
      classes, live pipeline monitor, distribution grid, intelligence engine. `next build`
      passes (type-checked). Visual browser verification + Framer Motion/shadcn polish pending.

## Phase 3 — Layer 2 (Sovereign Distribution Grid)

- [ ] Implement platform adapters behind a uniform `publish(campaign)` interface
      (LinkedIn ✅ seam, X, Instagram, Facebook, TikTok, YouTube ✅ seam, Threads, Telegram, WhatsApp, Pinterest, Bluesky).
- [ ] AI scheduling + smart reposting as `kind: 'campaign'` jobs on the existing queue.

## Phase 4 — Layer 3 (Strategic Intelligence Engine)

- [ ] Consolidate `analyze-lead` + valuation/broker/crm behind the typed agent registry.
- [ ] Implement the 7 agents incrementally; each runs as a `kind: 'intelligence'` job.

## What was deliberately NOT migrated yet

- The full source frontend (`src/pages/AdminPage.tsx` etc.) — pulled in selectively when the
  dashboard app lands, not bulk-copied.
- Pre-bundled `functions/*/v*/bundle.js` (minified) — re-sourced rather than carrying build artifacts.
- CRM/tenant/RBAC tables not on the media path — referenced, migrated only when a layer needs them.

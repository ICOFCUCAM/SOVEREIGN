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

## Phase 3 — Layer 2 (Sovereign Distribution Grid) (in progress)

- [x] Build `@sovereign/distribution`: uniform `PlatformAdapter.publish(campaign)` contract,
      registry covering all 11 platforms, dispatcher (`publishCampaign`/`publishToMany`).
      Builds via `tsc`; dispatcher/registry/scheduler runtime-smoke-verified.
- [x] Implement real adapters: Telegram (Bot API), Bluesky (AT Protocol), LinkedIn (UGC).
      Remaining 8 platforms are typed dormant seams.
- [x] Scheduling primitives: pure `dueCampaigns` + `repostSchedule` helpers for AI
      scheduling / smart reposting.
- [x] Wire the scheduler+dispatcher into a Node worker (`worker/`) that drains due campaigns
      and publishes across the grid. Pure `processDueCampaigns` orchestration is
      runtime-verified; the worker entry wires Supabase I/O. Live-endpoint test still pending.
- [x] Implement X, Facebook, Instagram, Pinterest, Threads adapters (now 8/11 live;
      youtube/tiktok/whatsapp remain seams — resumable upload / approval / no public API).

### Developer platform (own-your-API, vs Ayrshare)

- [x] `@sovereign/api-platform`: secure API-key issuance (SHA-256 hashed, shown once),
      HMAC bearer tokens w/ scopes+expiry, usage/rate helpers. Built + runtime-verified.
- [x] `db/migrations/0003_developer_platform.sql`: api_clients, api_keys, social_connections,
      api_usage, webhooks.
- [x] `gateway/functions`: `issue-key` (admin-gated mint) + `_shared/auth.ts` (key verify,
      scope + monthly-quota enforcement, usage metering). Dashboard API Keys panel.
- [x] Encryption-at-rest for the token vault (`vault.ts`, AES-256-GCM) — built + verified.
- [x] HMAC-signed webhook delivery (`webhooks.ts`, sign/verify/deliver) — built + verified.
- [x] OAuth connect flow: `oauth.ts` helpers (provider configs, authorize-URL, code
      exchange — runtime-verified) + `gateway/oauth-start`/`oauth-callback` that exchange,
      encrypt (vault), and store tokens in `social_connections`. Node↔Deno vault format
      verified compatible. `credentialEnv()` resolves a client's decrypted connections into
      adapter env, so publishing runs per-client off the vault.
- [x] Developer-portal UX: OAuth connect UI (`/connect` + `/api/connect` → oauth-start) and
      usage dashboard (`/usage`, 30-day metering by metric). `next build` passes (7 routes).
- [ ] Billing/plan management; live-endpoint + Deno runtime verification.
- [ ] Deno edge functions need live-runtime verification (no `deno` in CI yet).

## Phase 4 — Layer 3 (Strategic Intelligence Engine) (in progress)

- [x] Build `@sovereign/intelligence`: typed agent registry + Claude-backed `runAgent`
      runner (strict-JSON results, dormant without a key). Built + runtime-verified.
- [x] `run-agent` edge function records each run as a `kind: 'intelligence'` pipeline job.
- [ ] Consolidate `analyze-lead` + valuation/broker/crm behind the runner.
- [ ] Live inference verification; agent-specific tools/data sources.

## What was deliberately NOT migrated yet

- The full source frontend (`src/pages/AdminPage.tsx` etc.) — pulled in selectively when the
  dashboard app lands, not bulk-copied.
- Pre-bundled `functions/*/v*/bundle.js` (minified) — re-sourced rather than carrying build artifacts.
- CRM/tenant/RBAC tables not on the media path — referenced, migrated only when a layer needs them.

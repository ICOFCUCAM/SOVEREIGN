# Layer 2 — Sovereign Distribution Grid

Enterprise multi-platform publishing built around Layer 1's media output and the shared
`pipeline_jobs` queue. Packaged as `@sovereign/distribution` (builds via `tsc`).

## `src/` — the distribution library

- `types.ts` — `PlatformAdapter` contract + `PublishResult`.
- `adapters/` — concrete adapters for **all 11 platforms** (no seams remain): telegram,
  bluesky, linkedin, x, facebook, instagram, pinterest, threads, youtube (resumable upload),
  tiktok (PULL_FROM_URL), whatsapp (Cloud API message send). All credential-gated.
- `registry.ts` — every `DistributionPlatform` resolves to an adapter; `liveAdapters(env)`
  reports which are credential-ready.
- `dispatcher.ts` — `publishCampaign(campaign)` routes to the channel adapter;
  `publishToMany(...)` cross-posts.
- `scheduler.ts` — pure `dueCampaigns(...)` / `repostSchedule(...)` helpers for AI scheduling
  and smart reposting (side-effect free, unit-testable).

## Runtime contract

Adapters are credential-gated: with no env they return `{ dormant: true }` instead of
throwing, so the grid is safe to wire before every integration has keys. Adapter logic is
implemented against each platform's documented REST/XRPC API but has **not** been tested
against live endpoints here — that requires real credentials.

## Edge trigger

`functions/post-campaign` (Deno) remains the in-database publish trigger. The Node
distribution library above is the reusable service core a worker/NestJS service uses to
fan campaigns out across platforms.

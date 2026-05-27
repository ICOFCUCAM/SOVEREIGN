# Sovereign AI Media & Acquisition Infrastructure

A sovereign, three-layer media + acquisition platform, seeded from the **Media Acquisition
Ecosystem** extracted from the source platform (which remains untouched and operational at
the repo root). This is not a clone — it is **extraction + evolution + sovereign expansion**.

```
LAYER 3  Strategic Intelligence Engine     — AI intelligence & acquisition optimization
LAYER 2  Sovereign Distribution Grid        — autonomous multi-platform distribution
LAYER 1  Media Acquisition Ecosystem        — cinematic/operational/strategic/crisis media  ← migrated foundation
BACKBONE @sovereign/core                     — pipeline_jobs queue · orchestration · types · supabase
```

## Layout

```
sovereign-os/
├── packages/core/            @sovereign/core — shared types, job queue, supabase admin
├── layers/
│   ├── layer-1-media/        migrated: 8 edge functions + FFmpeg worker
│   ├── layer-2-distribution/ post-campaign + 11-platform adapter seams
│   └── layer-3-intelligence/ analyze-lead + 7-agent registry seam
├── db/migrations/            foundation schema (pipeline_jobs, campaigns)
└── docs/                     audit · dependency map · migration strategy · architecture
```

## Status (Phase 1 — Foundation)

Layer 1 is migrated and operational. Layers 2 and 3 have working seeds + complete typed
seams. See `docs/02-migration-strategy.md` for the phased plan and `docs/03-architecture.md`
for the full design.

To deploy and exercise the live (non-CI) paths, follow `docs/05-deployment-runbook.md`.

## Tests / CI

```bash
npm test            # builds all packages, runs the node:test suites
```

Covers the verifiable core logic: media presets, API keys/tokens/scopes/vault/webhooks/OAuth,
distribution registry/dispatcher/scheduler/credentials/worker, and the intelligence runner.
GitHub Actions (`.github/workflows/sovereign-os-ci.yml`) runs `npm test` + both Next builds on
every push touching `sovereign-os/**`.

## Getting started

```bash
cd sovereign-os
cp .env.example .env        # fill in Supabase + provider keys
npm install
npm run typecheck           # builds @sovereign/core

# Apply the foundation schema to your Supabase project:
#   db/migrations/0001_pipeline_foundation.sql

# Deploy the FFmpeg worker (see layers/layer-1-media/worker/README.md)
# Deploy edge functions with: supabase functions deploy <name>
```

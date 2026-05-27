# Architecture — Sovereign AI Media & Acquisition Infrastructure

Three sovereign layers over one shared backbone (`@sovereign/core` + Supabase + the
`pipeline_jobs` queue).

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3 — Strategic Intelligence Engine                      │
│  trend / influence / sentiment / viral forecasting            │
│  agents: Content · Viral · Competitor · Brand Guardian ·      │
│          Revenue · Crisis Intelligence · Executive Briefing   │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2 — Sovereign Distribution Grid                        │
│  multi-platform publish · AI scheduling · engagement tracking │
│  adapters: LinkedIn · X · Instagram · Facebook · TikTok ·     │
│            YouTube · Threads · Telegram · WhatsApp · Pinterest │
│            · Bluesky                                          │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1 — Media Acquisition Ecosystem  (migrated foundation) │
│  cinematic / operational / strategic / crisis media           │
│  orchestrate-film · render-video · narration · assemble ·     │
│  poll-video-jobs · image/content/scenario gen · FFmpeg worker │
├─────────────────────────────────────────────────────────────┤
│  BACKBONE — @sovereign/core                                   │
│  pipeline_jobs queue · job orchestration · types · supabase   │
│  storage (`ecosystem` bucket) · auth/RBAC (inherited)         │
└─────────────────────────────────────────────────────────────┘
```

## Layer 1 — Media Acquisition Ecosystem (built this milestone)

Executive media + narrative command infrastructure. Migrated and operational.
Content classes: **cinematic, operational, strategic, crisis response** (`MediaClass`).
Every render is a `pipeline_jobs` row; the FFmpeg worker stitches the final film.

## Layer 2 — Sovereign Distribution Grid (seam)

Enterprise multi-platform publishing. `post-campaign` is the working seed (LinkedIn/YouTube
live). Each platform is a self-contained adapter implementing one `publish` contract;
scheduling and reposting run as queue jobs. See `layers/layer-2-distribution/adapters`.

## Layer 3 — Strategic Intelligence Engine (seam)

AI strategic intelligence + acquisition optimization. `analyze-lead` is the working seed.
Seven typed agents share one registry and run as `kind: 'intelligence'` jobs.
See `layers/layer-3-intelligence/agents`.

## Tech stack

- **Frontend:** Next.js + TypeScript + Tailwind + Framer Motion + shadcn/ui (cinematic,
  command-center aesthetic; reuses source `ui/` + Globe/WorldMap/CinematicHero).
- **Backend:** Supabase edge functions (Deno) today; NestJS / Go / Python services added
  per layer as load demands. The `pipeline_jobs` queue is the seam that lets services be
  introduced without rewriting callers.
- **Media:** FFmpeg worker (container), Runway + gpt-image-1 + Claude + OpenAI TTS.
- **Data/infra targets:** PostgreSQL, Redis, Kafka/Temporal (for durable orchestration as
  the queue outgrows polling), ClickHouse/BigQuery-ready analytics, Kubernetes.

> Heavier infra (Kafka, Temporal, K8s, ClickHouse, Go/Python services) is **deferred by
> design** — introduced when a concrete bottleneck justifies it, not scaffolded empty.

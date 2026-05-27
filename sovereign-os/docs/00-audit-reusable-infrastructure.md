# Audit — Reusable Infrastructure Report

Audit of the source platform (`/` root, the existing CIVICOS/SOVEREIGN app) to identify
the **Media Acquisition Ecosystem** layer and catalog what is reusable as the seed of
Sovereign OS. The source platform remains untouched and operational.

## Source stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind + shadcn/ui (large component library), React Router, TanStack Query.
- **Backend:** Supabase (Postgres + Deno edge functions), a standalone Node/Express **FFmpeg worker**.
- **Data:** `pipeline_jobs` job queue, `campaigns`, plus CRM/leads/valuation/audit/tenant tables.

## Media Acquisition Ecosystem components found

| Component | Source path | Role | Reuse verdict |
|---|---|---|---|
| Film orchestration | `supabase/functions/orchestrate-film` | Claude director → scene breakdown → seed frames → Runway video → narration; writes `pipeline_jobs` | **Migrate as-is** (Layer 1) |
| Video render | `supabase/functions/render-video` | prompt → gpt-image-1 seed → Runway `image_to_video` (async) | **Migrate as-is** (Layer 1) |
| Job poller | `supabase/functions/poll-video-jobs` | finalizes async Runway jobs into storage | **Migrate as-is** (Layer 1) |
| Narration | `supabase/functions/generate-narration` | OpenAI TTS → storage | **Migrate as-is** (Layer 1) |
| Assembly trigger | `supabase/functions/assemble-film` | calls the FFmpeg worker to stitch clips + audio | **Migrate as-is** (Layer 1) |
| Image / content / scenario gen | `supabase/functions/generate-{image,content,scenario}` | AI content systems | **Migrate as-is** (Layer 1) |
| FFmpeg worker | `worker/` | downloads clips, normalizes to 1280×720/30fps, concatenates, mixes narration, uploads MP4 | **Migrate as-is** (Layer 1) |
| Campaign publish | `supabase/functions/post-campaign` | per-channel publish (LinkedIn/YouTube live, others dormant) | **Migrate → evolve** (Layer 2) |
| Lead analysis | `supabase/functions/analyze-lead` | AI scoring of inbound leads | **Migrate → evolve** (Layer 3) |
| Valuation / broker / CRM | `functions/ai-valuation`, `functions/ai-broker`, `functions/crm-dispatcher` (pre-bundled) | acquisition intelligence | **Reference → re-source** (Layer 3) |
| Job queue model | `pipeline_jobs` table | single uniform unit of work across the pipeline | **Extract to `@sovereign/core`** |
| UI system | `src/components/ui/*`, cinematic home components | shadcn/ui + Globe/WorldMap/CinematicHero | **Reuse selectively** when the dashboard app is built |

## Key observations

1. **The pipeline already has a uniform job model.** Every media step inserts/updates a
   `pipeline_jobs` row with `kind/status/provider/title/input/result/result_url/error`.
   This is the natural orchestration backbone — extracted into `@sovereign/core/jobs`.
2. **FFmpeg correctly lives outside edge functions** (Deno can't run FFmpeg). The worker
   container pattern is sound and migrates unchanged.
3. **Distribution is real but partial:** LinkedIn/YouTube paths exist; the other 9 target
   platforms are adapter seams to fill in Layer 2.
4. **Intelligence is fragmented** across `analyze-lead` and three pre-bundled functions —
   Layer 3 consolidates these behind a typed agent interface.
5. **Secrets are baked into `src/lib/supabase.ts`** in the source platform. Sovereign OS
   moves all config to env (`.env.example`); nothing is hardcoded.

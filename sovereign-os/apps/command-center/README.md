# Command Center

The executive command dashboard for Sovereign OS. Next.js (App Router) + Tailwind,
dark cinematic command-center aesthetic. Consumes `@sovereign/core` so the UI stays in
sync with the backend (media-class presets, job types, distribution platforms).

## Panels

- **Content Classes** — the four Layer 1 director presets from `@sovereign/core/media`.
- **Pipeline Monitor** — live `pipeline_jobs` feed (polls every 5s; dormant until
  `NEXT_PUBLIC_SUPABASE_*` is set).
- **Sovereign Distribution Grid** — all 11 Layer 2 platforms (LinkedIn/YouTube live).
- **Strategic Intelligence Engine** — the 7 Layer 3 agents.

## Run

```bash
cd sovereign-os
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY to go live
npm run dashboard:dev        # http://localhost:3000
```

## Status / caveats

Scaffold. It builds against `@sovereign/core` and renders dormant states without a live
Supabase project. It has **not** been visually verified in a browser in CI — `next dev`
locally is the way to confirm rendering. Framer Motion + shadcn/ui (per the design spec)
are the next enhancement; this scaffold keeps dependencies light and uses CSS animation.

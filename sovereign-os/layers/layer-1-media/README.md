# Layer 1 — Media Acquisition Ecosystem

The migrated foundation. Executive media + narrative command infrastructure.

## Content classes
Cinematic · Operational · Strategic · Crisis Response (`MediaClass` in `@sovereign/core`).

## Edge functions (`functions/`, Deno / Supabase)
- `orchestrate-film` — Claude director breaks a brief into N scenes + a continuous narration script, then fans out renders.
- `render-video` — prompt → gpt-image-1 seed frame → Runway `image_to_video` (async).
- `poll-video-jobs` — finalizes async Runway tasks into storage.
- `generate-narration` — OpenAI TTS → storage.
- `assemble-film` — calls the FFmpeg worker to stitch clips + narration.
- `generate-image` / `generate-content` / `generate-scenario` — AI content systems.

## Worker (`worker/`, Node + FFmpeg, container)
`POST /assemble { film_job_id, clip_urls[], audio_url }` → normalizes clips to 1280×720/30fps,
concatenates, mixes narration, uploads the final MP4 to the `ecosystem` bucket, marks the
`pipeline_jobs` row done. Deploy to Fly.io / Render / Railway / Cloud Run (see `worker/README.md`).

## Job model
Every step is a `pipeline_jobs` row. Use `@sovereign/core/jobs` (`enqueue`/`transition`/`claimNext`)
as functions are evolved to replace their inlined queue calls.

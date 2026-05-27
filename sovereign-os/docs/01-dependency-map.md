# Dependency Map

How the migrated media pipeline pieces depend on each other and on external services.

## Runtime flow (Layer 1 — media)

```
client / dashboard
   │  brief
   ▼
orchestrate-film ──(Claude: scenes+script)──► render-video (per scene)
   │                                              │  gpt-image-1 seed frame
   │                                              ▼
   │                                          Runway image_to_video (async task)
   │                                              │
   │                                              ▼
   │                                          poll-video-jobs ──► clip MP4 in storage
   │
   ├─► generate-narration ──(OpenAI TTS)──► narration MP3 in storage
   │
   ▼
assemble-film ──(x-worker-secret)──► FFmpeg worker /assemble
                                          │ concat clips @1280×720/30fps + mix audio
                                          ▼
                                      final film MP4 in `ecosystem` bucket
                                          │
                                          ▼
                                      pipeline_jobs row → status=done, result_url
```

All steps read/write the single `pipeline_jobs` table via `@sovereign/core/jobs`.

## External service dependencies

| Service | Used by | Env var |
|---|---|---|
| Anthropic (Claude) | orchestrate-film (director) | `ANTHROPIC_API_KEY` |
| OpenAI | render-video (gpt-image-1 seed), generate-narration (TTS), generate-image/content | `OPENAI_API_KEY` |
| Runway | render-video, poll-video-jobs | `RUNWAY_API_KEY` |
| Supabase Storage (`ecosystem` bucket) | all media outputs | `SUPABASE_*` |
| FFmpeg worker | assemble-film | `FFMPEG_WORKER_URL`, `WORKER_SECRET` |
| LinkedIn / YouTube APIs | post-campaign | `LINKEDIN_ACCESS_TOKEN`, `YOUTUBE_ACCESS_TOKEN` |

## Internal package dependencies

```
@sovereign/core (types, jobs queue, supabase admin)
   ▲            ▲                 ▲
layer-1-media  layer-2-distribution  layer-3-intelligence
```

Edge functions currently inline their Supabase calls (Deno, no bundler). As they are
evolved, they should import `@sovereign/core` helpers to keep the job model uniform.

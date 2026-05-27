# SOVEREIGN FFmpeg Assembly Worker

Stitches Runway clips + narration audio into a final film and uploads it to
Supabase storage. FFmpeg can't run inside a Supabase Edge Function, so this
runs as a small container you deploy once (Fly.io, Render, Railway, Cloud Run).

## What it does

`POST /assemble`
```json
{ "film_job_id": "<uuid>", "clip_urls": ["https://.../clip0.mp4", "..."], "audio_url": "https://.../narration.mp3" }
```
- Downloads the clips + narration
- Normalizes clips to 1280x720 / 30fps and concatenates them
- Mixes in the narration track (AAC, trimmed to video length)
- Uploads `film/<film_job_id>.mp4` to the `ecosystem` bucket
- Marks the `pipeline_jobs` row `done` with the public URL

Requests must include header `x-worker-secret: <WORKER_SECRET>`.

## Environment

| Var | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | Your project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-side only — never ship to the browser |
| `WORKER_SECRET` | yes | Shared secret; also set as a Supabase secret so `assemble-film` can call this |
| `BUCKET` | no | Defaults to `ecosystem` |
| `PORT` | no | Defaults to `8080` |

## Deploy

```bash
# Fly.io example
fly launch --no-deploy
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... WORKER_SECRET=...
fly deploy
```
Or build the Docker image and deploy to Render / Railway / Cloud Run.

## Wire it back to Supabase

Once deployed, set two Supabase secrets so the `assemble-film` edge function
can reach this worker:

```
FFMPEG_WORKER_URL = https://<your-worker-host>/assemble
WORKER_SECRET     = <same secret as above>
```

After that, calling `assemble-film` with a film's clip URLs will produce the
final stitched MP4 automatically.

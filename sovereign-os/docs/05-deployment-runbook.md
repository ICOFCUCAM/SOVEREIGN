# Deployment Runbook

How to take Sovereign OS live and exercise the paths that can't be verified in CI
(live platform endpoints + the Deno edge runtime). Work top to bottom.

> Conventions: `$` commands run from `sovereign-os/`. Never commit real secrets — set them
> in Supabase / your host's secret store.

---

## 0. Prerequisites

- Node ≥ 20, npm
- [Supabase CLI](https://supabase.com/docs/guides/local-development) (`supabase`)
- A Supabase project (or `supabase start` locally)
- Provider keys as needed: Anthropic, OpenAI, Runway; per-platform social credentials
- A container host for the two workers (Fly.io / Render / Railway / Cloud Run)
- A host for the two Next apps (Vercel works well)

---

## 1. Generate platform secrets

```bash
openssl rand -base64 32   # SOVEREIGN_VAULT_KEY   (must be exactly 32 bytes / base64)
openssl rand -hex 32      # ADMIN_SECRET
openssl rand -hex 32      # SOVEREIGN_TOKEN_SECRET
openssl rand -hex 32      # WORKER_SECRET
```

Keep these in your secret store. `SOVEREIGN_VAULT_KEY` is critical: lose it and every
encrypted social token in the vault becomes unrecoverable. Rotating it requires re-encrypting
`social_connections`.

---

## 2. Database

Apply the migrations in order to your Supabase project (SQL editor or `psql`):

```
db/migrations/0001_pipeline_foundation.sql   # pipeline_jobs, campaigns
db/migrations/0002_media_class.sql           # media_class column
db/migrations/0003_developer_platform.sql    # api_clients, api_keys, social_connections, api_usage, webhooks
```

Create the storage bucket used for all media output:

```bash
# bucket name must match BUCKET (default: ecosystem)
supabase storage create ecosystem   # or create it in the dashboard; make objects public-read
```

Review RLS: the edge functions use the **service-role** key (full access). Any direct
browser reads (dashboard/portal panels) use the anon key, so add read policies for the
tables those panels query (`pipeline_jobs`, `campaigns`, `api_keys`, `api_usage`,
`social_connections`) or expose them through a view. Never expose `api_keys.key_hash` or
`social_connections.access_token` to the anon role.

---

## 3. Assemble + deploy edge functions

Functions live under each layer plus `gateway/`. The Supabase CLI expects them under
`supabase/functions/<name>`, and shared code under `supabase/functions/_shared`. Stage them:

```bash
mkdir -p supabase/functions/_shared
# Layer 1 media
cp -r layers/layer-1-media/functions/* supabase/functions/        # includes _shared/{queue,media}.ts
# Layer 2 / 3
cp -r layers/layer-2-distribution/functions/* supabase/functions/
cp -r layers/layer-3-intelligence/functions/* supabase/functions/
# Gateway (developer platform)
cp -r gateway/functions/* supabase/functions/                     # includes _shared/{keys,auth,vault,oauth}.ts
```

> Known adjustment: `run-agent` imports the Layer 1 `_shared/queue.ts` via a deep relative
> path. After staging, point it at the co-located shared copy (e.g. `../_shared/queue.ts`)
> so it bundles. Verify each function's `_shared` imports resolve within `supabase/functions/`.

Set the function secrets, then deploy:

```bash
supabase secrets set \
  ANTHROPIC_API_KEY=… OPENAI_API_KEY=… RUNWAY_API_KEY=… \
  FFMPEG_WORKER_URL=https://<ffmpeg-worker>/assemble WORKER_SECRET=… BUCKET=ecosystem \
  ADMIN_SECRET=… SOVEREIGN_TOKEN_SECRET=… SOVEREIGN_VAULT_KEY=… \
  OAUTH_REDIRECT_URI=https://<project>.supabase.co/functions/v1/oauth-callback \
  STRIPE_WEBHOOK_SECRET=… STRIPE_PRICE_BASIC=… STRIPE_PRICE_PRO=… STRIPE_PRICE_ENTERPRISE=…

# (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.)

for fn in orchestrate-film render-video poll-video-jobs generate-narration assemble-film \
          generate-image generate-content generate-scenario post-campaign analyze-lead \
          run-agent issue-key oauth-start oauth-callback billing-webhook; do
  supabase functions deploy "$fn"
done
```

For billing: create Stripe Products/Prices, set `STRIPE_PRICE_<PLAN>` to their Price IDs,
and point a Stripe webhook endpoint at `billing-webhook`. Subscription events then move
`api_clients.plan`; keys issued afterward inherit the plan's quota + scope ceiling.

Schedule the pollers (Supabase cron / external scheduler):
- `poll-video-jobs` every ~1 min (finalizes Runway clips, auto-stitches films).

---

## 4. Workers (containers)

### FFmpeg assembly worker — `layers/layer-1-media/worker`
Build the image and deploy; set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WORKER_SECRET`,
`BUCKET`. Then set the function secret `FFMPEG_WORKER_URL=https://<host>/assemble`. See its README.

### Distribution worker — `layers/layer-2-distribution/worker`
Requires the distribution package built (`dist/`) since it imports `@sovereign/distribution`:

```bash
$ npm install
$ npm run build                       # builds @sovereign/distribution (+ others)
$ SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… DRAIN_INTERVAL_MS=60000 \
    npm --workspace @sovereign/distribution-worker start
```

Endpoints: `GET /health`, `POST /drain` (process due campaigns now). With
`DRAIN_INTERVAL_MS` it also auto-drains on a timer. For per-client publishing it reads
`social_connections`; otherwise it falls back to global per-platform env (below).

---

## 5. Social platform credentials

Two ways to give adapters tokens:

**A. Global (single-tenant, fastest):** set per-platform env on the distribution worker.

| Platform | Env |
|---|---|
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Bluesky | `BLUESKY_IDENTIFIER`, `BLUESKY_APP_PASSWORD` |
| LinkedIn | `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN` |
| X | `X_ACCESS_TOKEN` |
| Facebook | `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_TOKEN` |
| Instagram | `IG_USER_ID`, `IG_ACCESS_TOKEN` |
| Pinterest | `PINTEREST_ACCESS_TOKEN`, `PINTEREST_BOARD_ID` |
| Threads | `THREADS_USER_ID`, `THREADS_ACCESS_TOKEN` |

**B. Per-client OAuth (multi-tenant):** register an OAuth app per platform and set
`<PLATFORM>_OAUTH_CLIENT_ID` / `<PLATFORM>_OAUTH_CLIENT_SECRET` as function secrets, plus
`OAUTH_REDIRECT_URI` pointing at the deployed `oauth-callback`. Add the same redirect URI in
each provider's app settings. Tokens captured this way are encrypted into `social_connections`.

`youtube`, `tiktok`, `whatsapp` are dormant seams — no live publish yet.

---

## 6. Web apps

```bash
# Command center (ops dashboard)
$ NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… npm run dashboard:build

# Developer portal (key/connect/usage console)
#   server (key minting): SUPABASE_URL, ADMIN_SECRET
#   browser (listings):   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
$ npm run portal:build
```

### Launch on Vercel

The platform's customer-facing surface is **three Vercel projects**, each pointed at an app
subdirectory. The public **web** site is the apex domain; the other two are the
authenticated areas. No `vercel.json` is needed in the app dirs — Vercel auto-detects Next.js
and the npm workspace (lockfile at `sovereign-os/package-lock.json`) and installs at the
workspace root. **Critical:** set the **Root Directory** to the app, NOT the repo root — the
repo root's `vercel.json` runs `vite build` (the old source platform) and will fail a Next app.

For **each** app — New Project → import this repo → set Root Directory → then deploy:

| App | Root Directory | Suggested domain |
|---|---|---|
| **web** (public landing + pricing) | `sovereign-os/apps/web` | `sovereign.example` (apex) |
| **developer-portal** (console) | `sovereign-os/apps/developer-portal` | `app.sovereign.example` |
| **command-center** (internal ops) | `sovereign-os/apps/command-center` | `ops.sovereign.example` |

Framework Preset = Next.js (auto). Build / Install / Output = default. For monorepo workspace
installs, "Include files outside root directory" is enabled automatically.

> If Vercel doesn't auto-detect the workspace, set **Install Command** to
> `npm install --prefix ../../..` (the `sovereign-os/` root) — but try the defaults first.

**Environment variables** (Project Settings → Environment Variables):

*web* (public site):
- `NEXT_PUBLIC_PORTAL_URL` — the deployed developer-portal URL (header + plan CTAs target it)

*command-center* (browser-only reads):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

*developer-portal*:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser listings)
- `SUPABASE_URL`, `ADMIN_SECRET` — **server-only**, never prefixed `NEXT_PUBLIC_` (these mint
  keys / start OAuth by proxying to the admin-gated edge functions)

Push to the branch (or merge) → Vercel builds each project from its Root Directory. The CI
workflow's green `build-test` job is the same `next build` Vercel runs, so a green PR predicts
a green Vercel build.

> Portal hardening: the `/api/keys` and `/api/connect` routes currently authorize via the
> server `ADMIN_SECRET`. Before exposing the portal to real developers, put these behind
> developer authentication (Supabase Auth / SSO) and derive `client_id` from the session.

---

## 7. Verification checklist (exercise the un-CI-tested paths)

1. **Key issuance** — `POST /functions/v1/issue-key` with `x-admin-secret` → returns a
   `sov_live_…` key once. Confirm an `api_keys` row exists with a hash, not the plaintext.
2. **Auth + quota** — call a guarded function with the key; confirm an `api_usage` row is
   written and `last_used_at` updates. Exceed `rate_limit_per_month` → expect HTTP 429.
3. **Media pipeline** — `POST /functions/v1/orchestrate-film` `{ brief, mediaClass:"cinematic" }`
   → a `film` job + per-scene `video` jobs with `media_class`. Let `poll-video-jobs` run; with
   the FFmpeg worker up, a stitched MP4 lands in the `ecosystem` bucket.
4. **Distribution** — insert a `campaigns` row (`status:'scheduled'`, past `scheduled_at`),
   `POST /drain` on the distribution worker → campaign `published`, a `campaign` job recorded.
   Test one live adapter (Telegram is simplest).
5. **OAuth vault** — `oauth-start` → authorize → `oauth-callback` stores an encrypted
   `social_connections` row. Confirm the stored `access_token` is ciphertext (`iv.tag.ct`),
   and that the distribution worker can publish for that client.
6. **Intelligence** — `POST /functions/v1/run-agent` `{ agent:"viral", prompt:"…" }` → an
   `intelligence` job goes processing→done with a strict-JSON result.
7. **Webhooks** — register a `webhooks` row; trigger an event; verify the delivery's
   `X-Sovereign-Signature` against the secret.
8. **Portal** — `/` issue a key, `/connect` link an account, `/usage` shows call counts.

---

## 8. Rollback / safety

- Migrations are additive (`create table if not exists`, `add column if not exists`) — safe to
  re-run. There are no destructive down-migrations; snapshot before schema changes.
- Revoke a key: set `api_keys.status='revoked'` (auth rejects immediately).
- Suspend a client: `api_clients.status='suspended'`.
- The source platform at the repo root is untouched and can run independently.

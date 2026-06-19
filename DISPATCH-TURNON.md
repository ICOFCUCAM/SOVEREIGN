# Sovereign Dispatch — Turn-On Checklist

Dispatch + the ExitOS→Dispatch bridge are **fully wired but intentionally off**.
Nothing here bills you until you deploy the two Render containers. This doc is
the exact sequence to switch it on when you're ready.

> **Secrets:** the real values (DB password, `DISPATCH_TOKEN_SECRET`, the
> `svc-exitos` secret, S3 keys) are **not** stored in this repo. Retrieve them
> from your secure store. The ones shown during setup chat/screenshots should be
> **rotated** before go-live (commands at the bottom).

## Current state (already done, $0/month)
- ✅ Dispatch DB schema + service clients live in the **SOVEREIGN** Supabase
  project under the isolated `dispatch` schema.
  - Console client: `svc-a` / `secret-A`
  - ExitOS client: `svc-exitos` (own tenant, service-lane auto-approve, scopes
    `validate`/`render`/`read`)
- ✅ All code on `main`: API (SSL + CORS), worker, ExitOS→Dispatch bridge,
  `render.yaml`.
- ✅ `exit-dispatch-submit` edge function deployed to the SOVEREIGN project —
  **dormant** (returns `configured:false`) until its secrets are set.
- ✅ ExitOS "Submit to Dispatch" shows "not connected yet" until live. No fakes.

## Prerequisites (Supabase, free)
1. **Storage → Create bucket** `dispatch-artifacts` (private).
2. **Project Settings → Storage → S3 Connection** → enable + create S3 access
   keys. Note endpoint / region / access key id / secret.

## Step 1 — Deploy the containers (Render, the only paid part)
Render → **New → Blueprint** → repo `ICOFCUCAM/SOVEREIGN`, branch `main`
(`render.yaml` is at the repo root). It creates `dispatch-api` (Web Service) and
`dispatch-worker` (Background Worker). Build context is the **repo root** —
`render.yaml` already sets `dockerContext: "."`, so **leave Root Directory blank**.

Paste these env vars (values from your secure store):

**dispatch-api**
```
PGHOST=<supabase session-pooler host>      # aws-0-eu-west-1.pooler.supabase.com
PGPORT=5432
PGDATABASE=postgres
DISPATCH_DB_USER=dispatch_app.qvjdivcdefuprnenedje
PGPASSWORD=<dispatch_app password>
PGSSLMODE=no-verify
DISPATCH_TOKEN_SECRET=<32-byte hex>
DISPATCH_TOKEN_ISSUER=sovereign-dispatch
DISPATCH_CORS_ORIGIN=https://sovereign-beta-gilt.vercel.app
```
**dispatch-worker** (same DB three, plus storage)
```
PGHOST=<same>            DISPATCH_DB_USER=<same>            PGPASSWORD=<same>
PGSSLMODE=no-verify      PGDATABASE=postgres               PGPORT=5432
DISPATCH_STORAGE_BACKEND=s3
S3_ENDPOINT=https://qvjdivcdefuprnenedje.storage.supabase.co/storage/v1/s3
S3_REGION=us-east-1
S3_BUCKET=dispatch-artifacts
S3_ACCESS_KEY_ID=<from Supabase>
S3_SECRET_ACCESS_KEY=<from Supabase>
S3_FORCE_PATH_STYLE=1
```
Verify: `GET https://<dispatch-api>/v1/health` → `{ "ok": true }`.

## Step 2 — Point the console at the API
dispatch-web Vercel project → set `VITE_DISPATCH_API_URL=https://<dispatch-api>`
→ redeploy. Log in with `svc-a` / `secret-A`.

## Step 3 — Connect the ExitOS bridge
```
supabase secrets set \
  DISPATCH_API_URL=https://<dispatch-api> \
  DISPATCH_CLIENT_ID=svc-exitos \
  DISPATCH_CLIENT_SECRET=<svc-exitos secret> \
  --project-ref qvjdivcdefuprnenedje
```
(The function is already deployed; this just flips it from dormant to live.)

## Verify end-to-end
ExitOS → Publishing Center → **Submit to Dispatch** → the document appears in the
Dispatch console → the worker renders a PDF into `dispatch-artifacts` →
downloadable via the API.

## Rotate the secrets shown during setup
```
# DB role password (then update PGPASSWORD on both Render services)
alter role dispatch_app with password '<new>';
# Regenerate DISPATCH_TOKEN_SECRET (openssl rand -hex 32) and update dispatch-api.
# Regenerate the svc-exitos secret: store sha256(<new>) in dispatch.service_clients,
#   and update DISPATCH_CLIENT_SECRET on the edge function.
# Rotate the Supabase S3 access key in the dashboard and update the worker.
```

## Costs when on
- Render: `dispatch-worker` Starter $7/mo (required — no free workers);
  `dispatch-api` Starter $7/mo (or Free, which sleeps when idle).
- Supabase DB/Storage/Functions: within your existing project plan.

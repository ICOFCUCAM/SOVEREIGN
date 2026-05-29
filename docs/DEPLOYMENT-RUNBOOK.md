# Sovereign Dispatch — Deployment Runbook

How to take Sovereign Dispatch from this repo to a live, reachable service. Work
top to bottom. Conventions: `$` commands run from the repo root unless noted;
never commit real secrets — set them in your host's secret store.

> **What you are deploying.** Three pieces: a Postgres database, a stateless
> **API** (`dispatch-api`, serves `/v1/*` + the browser console at `/`), and a
> **worker** (`dispatch-worker`, headless-Chromium image that renders PDF/DOCX/MD).
> Plus an artifact store (local volume for a single host, **S3/Supabase Storage
> for production**). The API and worker are separate scalable services that
> share the database and the artifact store. (ADR-001.)

> **Honest status before you start.** Everything here is verified in CI/dev
> (170/170 tests on Postgres 16 + headless Chromium). Two paths are **not**
> exercisable without your infrastructure and must be validated on first deploy:
> (a) a real **S3 PUT/GET** round-trip (SigV4 signing is proven against AWS's
> published vector, but no live bucket was reachable here); (b) the **Docker
> image builds** themselves (no Docker daemon in the build environment — the
> Dockerfiles + compose are config-validated only). Build them first (§3).

---

## 0. Prerequisites

- **Docker** (+ `docker compose` v2) on the build/host machine, OR a container
  platform (Cloud Run / Fly.io / Render / ECS / Kubernetes).
- **PostgreSQL 16** — managed (RDS/Cloud SQL/Supabase/Neon) or self-hosted.
- **Object storage** for production — any S3-compatible bucket: AWS S3, **Supabase
  Storage (S3 protocol)**, Cloudflare R2, or MinIO.
- Node ≥ 20 only if you run pieces outside containers.
- The repo at `ICOFCUCAM/SOVEREIGN`, branch `claude/wizardly-dirac-d7P59`.

---

## 1. Generate secrets

```bash
openssl rand -hex 32     # DISPATCH_TOKEN_SECRET   (signs service tokens + download grants)
openssl rand -hex 32     # CALLBACK_HMAC_SECRET    (default outbound-callback HMAC; per-client refs override)
openssl rand -hex 24     # DISPATCH_APP_PASSWORD   (password for the unprivileged dispatch_app DB role)
```

Keep these in your secret manager. **`DISPATCH_TOKEN_SECRET` is critical**: it
signs both service tokens and single-artifact download grants — rotating it
invalidates all live tokens/grants (acceptable; they are short-lived).

Optional: if you accept Supabase **user** JWTs directly, set `SUPABASE_JWT_SECRET`
to that project's JWT secret. Not required for the Emergency-AI (service-token)
or console flows.

---

## 2. Database

Two roles by design (ADR-007): an **admin/owner** DSN used only by the migration
runner, and the unprivileged **`dispatch_app`** role the services connect as (so
RLS genuinely applies).

```bash
# 1. Create the database (managed provider UI or psql).
# 2. Enable pgcrypto (the seed/migrations use gen_random_uuid / digest):
psql "$ADMIN_DSN" -c "create extension if not exists pgcrypto"

# 3. Apply migrations with the Dispatch-owned runner (forward-only, checksummed):
DISPATCH_MIGRATE_URL="$ADMIN_DSN" node db/migrate.mjs up        # M1..M5, idempotent
DISPATCH_MIGRATE_URL="$ADMIN_DSN" node db/migrate.mjs status    # expect "0 pending, 5 applied"

# 4. Give dispatch_app a login password (the runner creates the role nologin):
psql "$ADMIN_DSN" -c "alter role dispatch_app with login password '<DISPATCH_APP_PASSWORD>'"

# 5. (DEV ONLY) seed demo tenants + service clients svc-a / svc-b:
DISPATCH_MIGRATE_URL="$ADMIN_DSN" node db/migrate.mjs up --seed
```

**Production:** do **not** run `--seed`. Instead provision real tenants and
service clients (one per machine caller, e.g. Emergency AI):

```sql
insert into dispatch.tenants (id, name) values (gen_random_uuid(), 'Acme Gov') returning id;
-- secret_hash = sha256(<client_secret>) (current at-rest scheme; argon2 is the
-- planned upgrade, risk R-S1-1). Generate a strong secret, store it with the caller:
insert into dispatch.service_clients (tenant_id, name, client_id, secret_hash, scopes)
values ('<tenant-id>', 'emergency-ai-prod', 'eai-prod',
        encode(digest('<client_secret>','sha256'),'hex'),
        array['dispatch:validate','dispatch:render','dispatch:read']);
```

The migration runner can also run as a one-shot container (`db/Dockerfile`):
`docker build -f db/Dockerfile -t dispatch-migrate . && docker run --rm -e DISPATCH_MIGRATE_URL=... dispatch-migrate`.

---

## 3. Build the images

Build context is the **repo root** for all three (the Dockerfiles `COPY
packages/ services/` selectively; the SPA is never included — `.dockerignore`).

```bash
docker build -f services/dispatch-api/Dockerfile    -t dispatch-api:latest .
docker build -f services/dispatch-worker/Dockerfile -t dispatch-worker:latest .   # installs Chromium — larger/slower build
docker build -f db/Dockerfile                       -t dispatch-migrate:latest .
```

Notes:
- The **worker image installs distro `chromium`** + fonts and sets
  `CHROMIUM_BIN=/usr/bin/chromium`; it runs under `tini` to reap Chromium's
  short-lived child processes. First build is heavy (Chromium); expect a few
  minutes and a ~500MB image.
- The **API image** bundles the frozen DDM validator and the console (`public/`).
- **Validate first build:** `docker run --rm dispatch-worker:latest node -e "import('/app/services/shared/src/pdf.mjs').then(m=>console.log('chromium:',m.chromiumBinary()))"`
  should print `/usr/bin/chromium`.

---

## 4. Configure environment

Set these on the API and worker (see `services/.env.example` for the full list).
**The API and worker MUST agree on `DISPATCH_TOKEN_SECRET` and the storage
config** (the worker writes artifacts; the API reads them).

| Var | API | Worker | Notes |
|---|---|---|---|
| `NODE_ENV=production` | ✓ | ✓ | **Disables dev trust tokens** |
| `PGHOST/PGPORT/PGDATABASE` | ✓ | ✓ | point at your Postgres |
| `DISPATCH_DB_USER=dispatch_app`, `PGPASSWORD` | ✓ | ✓ | unprivileged role (RLS applies) |
| `DISPATCH_TOKEN_SECRET` | ✓ | ✓ | **must match** (tokens + grants + callback) |
| `DISPATCH_TOKEN_ISSUER=sovereign-dispatch` | ✓ | ✓ | |
| `DISPATCH_STORAGE_BACKEND=s3` | ✓ | ✓ | **production**; default `fs` is single-host only |
| `S3_ENDPOINT/REGION/BUCKET/ACCESS_KEY_ID/SECRET_ACCESS_KEY` | ✓ | ✓ | S3 or Supabase Storage S3 URL |
| `S3_FORCE_PATH_STYLE=1` | ✓ | ✓ | required for Supabase Storage / MinIO |
| `DISPATCH_GRANT_TTL_SEC=300` | ✓ | — | download-grant lifetime |
| `PDF_CB_THRESHOLD / PDF_CB_COOLOFF_MS` | — | ✓ | Chromium circuit-breaker |
| `PORT=8787` | ✓ | — | API listen port |

> **Storage choice is the key production decision.** The `fs` backend only works
> if the API and worker share a filesystem (same host / shared volume). For any
> multi-instance or platform deploy, **use `s3`** so both services read/write the
> same bucket and download links become real presigned URLs. Set the S3 vars on
> **both** services.

---

## 5. Run

### 5a. Single host (Docker Compose) — fastest

`docker-compose.yml` brings up Postgres + migrate + API + worker, sharing a
`dispatch-artifacts` volume (fs backend). Good for a demo/internal box.

```bash
DISPATCH_TOKEN_SECRET=$(openssl rand -hex 32) \
DISPATCH_APP_PASSWORD=$(openssl rand -hex 24) \
docker compose up --build -d

curl -s localhost:8787/v1/health        # {"ok":true,...}
open http://localhost:8787/             # the Dispatch console
```

For S3 on compose: set `DISPATCH_STORAGE_BACKEND=s3` + `S3_*` in the environment
(both services already read them) and you can drop the shared volume.

### 5b. Platform (Cloud Run / Fly / Render / ECS) — production

Deploy **two services** from the two images, plus your managed Postgres + S3:

1. **dispatch-api** — push `dispatch-api:latest` to your registry; deploy as an
   HTTP service on `:8787`; set the §4 env (storage = **s3**); put it behind the
   platform's HTTPS/TLS load balancer. Autoscale on request volume.
2. **dispatch-worker** — deploy `dispatch-worker:latest` as a **non-HTTP** service
   (it polls the queue); set the §4 env (same secret + same S3). Autoscale on
   queue depth (`jobs_queued` — or a fixed small pool; PDF render is ~220ms warm).
   Give it adequate memory (Chromium): start at **1–2 vCPU / 1–2 GB**.
3. **Migrations** — run `dispatch-migrate` once as a pre-deploy job/step against
   the admin DSN before the API/worker start.

Cloud Run specifics: the worker has no HTTP port — deploy it as a Cloud Run
**Job** on a schedule/continuous, or use a min-instance Service with a tiny
health endpoint, or run the worker on Fly/ECS where long-running non-HTTP
processes are first-class. (The API is a clean Cloud Run Service.)

---

## 6. Smoke test (exercise the live path)

```bash
BASE=https://<your-api-host>
# 1. token (client-credentials)
TOKEN=$(curl -s $BASE/v1/token -H 'content-type: application/json' \
  -d '{"client_id":"eai-prod","secret":"<client_secret>"}' | jq -r .access_token)

# 2. submit an Executive Briefing → PDF+DOCX  (tenantId MUST match the token tenant)
JOB=$(curl -s $BASE/v1/documents -H "authorization: Bearer $TOKEN" \
  -H "content-type: application/json" -H "idempotency-key: $(uuidgen)" \
  -d '{ "schemaVersion":"1.0","idempotencyKey":"'"$(uuidgen)"'",
        "source":{"system":"emergency-ai","tenantId":"<tenant-id>"},
        "document":{ ...DDM exec_briefing... },
        "outputs":["pdf","docx"],
        "delivery":{"mode":"async","storage":"signed_url","ttlSeconds":604800} }' | jq -r .jobId)

# 3. poll → succeeded, with artifact refs
curl -s $BASE/v1/jobs/$JOB -H "authorization: Bearer $TOKEN" | jq .status

# 4. download (mint a single-artifact grant, then fetch)
AID=$(curl -s $BASE/v1/jobs/$JOB -H "authorization: Bearer $TOKEN" | jq -r '.result.artifacts[0].artifactId')
URL=$(curl -s -X POST $BASE/v1/artifacts/$AID/grant -H "authorization: Bearer $TOKEN" | jq -r .downloadUrl)
curl -s "$BASE$URL" -o out.pdf && file out.pdf      # → PDF document
```

Or just open `$BASE/` in a browser and use the console.

**Pass criteria:** `/v1/health` ok; a briefing renders to a valid multi-page PDF
+ editable DOCX; artifacts download via grant; `/v1/metrics` shows
`jobs_succeeded_total` incrementing. **Confirm the S3 round-trip works here** —
this is the path not exercisable pre-deploy.

---

## 7. Operations

- **Metrics:** `GET /v1/metrics` (unauthenticated, low-cardinality) → counters +
  durations. Scrape it; alert on `jobs_failed_total` rate, `api_errors_total`,
  `pdf_circuit_open_total`, and queue depth.
- **Logs:** structured JSON, one line per request/job transition; **content-safe**
  (no document text, PII, tokens, or secrets; tenant truncated). `DISPATCH_LOG_LEVEL`.
- **Chromium circuit-breaker:** after `PDF_CB_THRESHOLD` consecutive PDF crashes
  the worker pauses PDF for `PDF_CB_COOLOFF_MS` (md/docx keep flowing → `partial`).
  A spike in `pdf_circuit_open_total` means investigate Chromium/inputs.
- **Scaling:** API scales on requests; worker on queue depth. PDF render ~220ms
  warm, so a small worker pool handles substantial volume; raise memory before
  CPU (Chromium is memory-bound).
- **Retries/DLQ:** transient faults retry with backoff to `max_attempts`, then
  land in `dispatch.job_dlq` with a replay payload. Monitor DLQ growth.

---

## 8. Security checklist (before public exposure)

- [ ] **TLS everywhere** — terminate HTTPS at the platform LB; never expose `:8787` plaintext.
- [ ] `NODE_ENV=production` set on API **and** worker (disables dev trust tokens — verify `user <t>:<role>` is rejected).
- [ ] `DISPATCH_TOKEN_SECRET` from the secret manager, not the compose default; rotate policy defined.
- [ ] Real `service_clients` with strong secrets; **no `--seed`** in prod (svc-a/svc-b removed).
- [ ] Storage = **s3** with a **private** bucket; presigned URLs only (no public ACLs).
- [ ] DB reachable only from the services (private networking); `dispatch_app` is `nosuperuser`.
- [ ] Downloads use **grants** (default) — confirm a full token in an artifact URL is rejected (it is).
- [ ] **Residual (tracked):** service-secret at-rest is sha256, not argon2 (risk R-S1-1) — upgrade before exposing client-credential issuance to untrusted parties.
- [ ] **Out of P1 scope (ADRs):** classification is *descriptive* (banners render; not enforced), PDF/A & PDF/UA are plumbed but default-off, no SSRF gate on `image.src` yet — review before accepting untrusted DDM with remote images.

---

## 9. Rollback / safety

- **Migrations are forward-only + additive** (`create … if not exists`); the runner
  refuses to re-apply a changed file (checksum drift). Snapshot the DB before any
  schema change. There are no destructive down-migrations.
- **Artifacts are immutable** (write-once); a bad render is a new version, never an
  overwrite — roll back by pointing at the previous version.
- **Image rollback:** redeploy the previous image tag; the DB schema is
  backward-compatible within v1 (additive-only contract, see ADR-005 / versioning).
- **Revoke a caller:** `update dispatch.service_clients set active=false where client_id=…` (auth rejects immediately).

---

## 10. What this runbook does NOT cover (and why)

- **A live deploy from this repo's CI** — needs your cloud account + secrets;
  intentionally manual.
- **PDF/A archival + PDF/UA accessibility enforcement, classification/clearance
  enforcement, Veritas verification** — Phase 3/4 per the ADRs; the fields exist
  and are inert.
- **A managed warm Chromium pool** — measured unnecessary for P1 (~220ms warm
  render); revisit only if a concrete latency/concurrency bottleneck appears.

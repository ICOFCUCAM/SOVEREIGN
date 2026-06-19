# Sprint 3 — Publication Governance + Dispatch Console

**Status:** complete (local). **Date:** 2026-05-30.

Sovereign Dispatch gains the governance layer that turns it from a render
service into **institutional publication infrastructure**, plus its own
dedicated, Dispatch-branded UI — separate from the Sovereign website.

The organising principle, end to end:

```
Submit → Govern → Approve → Render → Publish → Retrieve
```

Dispatch is **not** a word processor. The document body (DDM) is a structured
payload; the value is the governed passage of that payload to a published,
provenance-tracked artifact under clearance and approval control.

---

## 1. Backend — governance layer

### Lifecycle state machine (above the render job)
A new `documents.lifecycle_state` is the governance state; the worker-owned
`documents.status` (render status) is left untouched.

```
draft → submitted → in_review → approved → rendered → published → archived
                          │
                      (rejected)              (withdrawn ← published/rendered)
```

- `services/shared/src/governance.mjs` — pure state machine (`canTransition`,
  `assertTransition`), policy resolution, quorum evaluation, render gating.
- **Render is gated on `approved`** — a render job is only created once a
  document is approved.

### Approval workflow (N-eyes + separation of duties)
- `dispatch.approval_policies` — per (tenant, doc_type, classification level),
  most-specific-wins: `required_approvals`, `min_approver_clearance`,
  `auto_approve_service`, `auto_approve_user`.
- `dispatch.approvals` — immutable decision ledger (unique per actor+version;
  UPDATE/DELETE blocked by trigger).
- **Separation of duties:** a document's submitter cannot be a deciding approver.
- **Quorum:** advance to `approved` only when distinct approver count ≥ policy.
- **Default policy:** the machine (service) lane auto-approves, so existing
  integrations (e.g. Emergency AI) render immediately and the Sprint 1/2
  contract is preserved; the human lane requires review.

### Clearance (extends Sprint 2)
Approve / publish / inbox / library / audit all enforce
`clearanceAllows(principal.clearance, doc.classification)`. Under-cleared
documents are filtered out of lists (no existence leak, mirroring the 404-not-403
rule).

### Endpoints (added to `dispatch-api`)
| Method | Path | Scope | Purpose |
|--------|------|-------|---------|
| POST | `/v1/documents/{id}/decision` | approve | approve / reject / return; on quorum → render job |
| POST | `/v1/documents/{id}/publish` | publish | release a rendered document to the library |
| POST | `/v1/documents/{id}/withdraw` | publish | pull a published/rendered document |
| GET | `/v1/approvals?state=pending` | approve | approver inbox |
| GET | `/v1/documents?state=&docType=&q=` | read | library / queues (clearance-scoped) |
| GET | `/v1/audit?target=&action=` | audit | append-only event trail |

`POST /v1/documents` now sets lifecycle + routes through policy (auto-approve
lane creates the render job inline; review lane returns `in_review`, no job).

### Roles & scopes
New scopes: `dispatch:approve`, `dispatch:publish`, `dispatch:audit`,
`dispatch:admin`. New membership roles: `publisher`, `auditor`. `roleScopes()`
updated in `services/shared/src/auth.mjs`.

### Migrations
- `M7__governance.sql` — lifecycle column, approval_policies, approvals,
  RLS + role gating, audit read policy (auditor/tenant_admin), role vocabulary.
- `M8__governance_job_insert.sql` — widen `jobs_insert` so approvers can queue
  the post-approval render job.

### Worker
On a successful/partial render the worker advances an `approved` document to
`rendered` (publishable). A hard failure leaves it `approved` for re-render.

---

## 2. Frontend — `services/dispatch-web`

A standalone **Vite + React + Tailwind** SPA — its own deployable, its own
institutional identity (dense, classification-forward; deliberately not the
cinematic Sovereign marketing theme). Talks only to `/v1`.

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | lifecycle queues; "needs my action" first |
| `/submit` | Submit | classify, choose outputs, dry-run validate, submit (DDM payload) |
| `/review` | Review & Approve | approval inbox + approve/return/reject |
| `/library` | Library | published + archived; filter by state/type/title |
| `/documents/:id` | Document | versions, render status (live poll), artifact download (grants), publish/withdraw, provenance trail |
| `/audit` | Audit | append-only event trail, filterable |

- **Auth:** client-credentials → short-lived JWT held **in memory only** (never
  localStorage). Navigation is role-filtered by scope.
- **Classification-forward:** every row/card carries a colour-banded marking.
- **Deploy:** multi-stage Dockerfile (nginx static serve) + SPA fallback; added
  to `docker-compose.yml` as `dispatch-web`.

---

## 3. Test evidence

All suites green (clean queue):

| Suite | Result |
|-------|--------|
| sprint1-e2e | 14/14 |
| sprint1-retry | 3/3 |
| epic6-pdf | 10/10 |
| epic7-docx | 17/17 |
| epic8-retrieve | 14/14 |
| epic9-console | 16/16 |
| epic10-hardening | 5/5 |
| epic10-breaker (CHROMIUM_BIN=/bin/false) | 4/4 |
| clearance (DISPATCH_ENFORCE_CLEARANCE=1) | 11/11 |
| r-s1-1-secret-hash | 10/10 |
| s3-sigv4 | 4/4 |
| **governance (new)** | **23/23** |
| ddm-schema package | 25/25 |

`dispatch-web`: `npm run build` ✓, `npm run lint` ✓ (0 errors). Verified
end-to-end against the live API via headless Chromium (sign-in → dashboard →
submit → library) and a proxy-driven validate→submit→list flow.

The Sprint 1/2 contract is preserved: the service lane still auto-approves and
renders immediately; the only test change was re-keying the `document.submitted`
audit assertion from the job id to the (more correct) document id.

---

## 4. Admin surface + retention (close-out)

Two of the Sprint 3 gaps are now closed.

### Admin surface
`dispatch:admin`-gated, tenant-scoped API + UI (`/console/admin`, three tabs):
- **Service clients** — `GET/POST /v1/admin/clients`, `PATCH .../{id}`. Provision
  a client (secret shown **once**, scrypt-hashed at rest), list (no secret
  leak), enable/disable, rotate scopes/clearance.
- **Members** — `GET/POST /v1/admin/members`. Upsert a member's role + clearance.
- **Approval policies** — `GET/POST /v1/admin/policies`. Upsert per
  (docType, classificationLevel), most-specific-wins.
- Migration `M9` adds the tenant_admin write RLS for memberships + service_clients.

### Retention sweeper
`services/dispatch-worker/src/retention.mjs`, run as the privileged
`dispatch_purge` role (BYPASSRLS + immutability-exempt, granted in `M9`):
- `published` past `retention_until` → `archived` (read-only, metadata kept).
- `archived` past a grace window (`DISPATCH_PURGE_GRACE_DAYS`, default 30) →
  artifact **bytes expired** (`expires_at=now`, `integrity_status=unrecoverable`
  → `GET` returns 410). The document, versions and audit are **kept forever**.
- Idempotent; writes `document.archived` / `artifact.purged` audit events.
- Added to `docker-compose.yml` as `dispatch-retention`.

**Tests:** new `admin-retention.test.mjs` — 18/18 (admin CRUD + gating, archive,
purge, idempotency, provenance retained).

## 6. Human SSO (close-out)

The console now signs in two ways; in both, **the API is the authority** on
role/scopes/clearance.

- **Backend (`auth.mjs` + `M10`):** a Supabase user JWT is verified
  (`SUPABASE_JWT_SECRET`), but ROLE and CLEARANCE are resolved from the
  `memberships` row via a SECURITY DEFINER `lookup_membership(tenant, sub)` —
  the token can NOT self-assert a role/clearance/scope. No membership → 403
  `NO_MEMBERSHIP`; disabled → 403 `MEMBERSHIP_DISABLED`. `actor` is now
  `user:<uuid>`.
- **`GET /v1/whoami`** resolves the caller's identity for either token kind.
- **Console:** sign-in has a "Single sign-on" / "Service client" toggle; SSO
  takes an identity-provider JWT and builds the session from `/v1/whoami` (never
  from the token's own claims). Token held in memory only.

**Tests:** `sso.test.mjs` — 9/9 (membership-authoritative role/clearance,
self-escalation ignored, no-membership / wrong-tenant / disabled → 403, tampered
token → 401, scope works end-to-end). Verified in-browser end to end.

## 7. OAuth Authorization Code + PKCE (close-out)

Full redirect SSO, on top of the membership-authoritative auth from §6.

- **Backend (`oauth.mjs` + server):** `GET /v1/auth/config` (public — IdP
  authorize URL + client_id + scopes; never a secret) and `POST /v1/auth/callback`
  (mediates the code→token exchange server-side, so an optional confidential
  `client_secret` stays off the browser and IdP CORS is avoided). The exchanged
  token is then run through the same membership-authoritative resolver, so a
  non-member is rejected at callback (`403 NO_MEMBERSHIP`).
- **Console (`oauth.ts`, `Callback.tsx`, `SignIn.tsx`):** standard public-client
  PKCE — generate verifier + S256 challenge, persist verifier + CSRF `state` in
  sessionStorage, redirect to the IdP; `/console/callback` verifies `state`,
  exchanges via the API, and establishes the in-memory session. "Sign in with
  your organisation" appears only when the API reports OAuth configured; the
  paste-a-token path remains as a fallback.
- **Config:** operator-set `OAUTH_*` env (see `.env.example` + docker-compose).
  IdP endpoints are operator-configured (not user-supplied) → no SSRF surface.

**Tests:** `oauth.test.mjs` 14/14 (config gating, PKCE shape, exchange success +
all error paths, confidential-secret handling) and `oauth-callback.test.mjs` 6/6
(live API + stub IdP: config, callback → membership-authoritative principal,
rejected code → 401, non-member → 403). Full redirect flow verified in-browser
(authorize → 302 → callback → exchange → dashboard as the seeded tenant_admin).

## 8. Refresh-token rotation (close-out)

After SSO the API issues its OWN Dispatch session, so it survives access-token
expiry without re-redirecting to the IdP.

- **Access token:** short-lived (default 15 min) Dispatch-signed USER JWT
  (`dispatch_issued:true`, authoritative role/clearance/scopes baked in). The
  resolver verifies it with `DISPATCH_TOKEN_SECRET` and trusts its claims for the
  access window — no per-request DB hit.
- **Refresh token (`session.mjs` + `M11`):** opaque high-entropy string stored
  only as its SHA-256, long-lived (default 30 days), **rotating** on every use.
  Each refresh re-resolves role/clearance from the membership (so a role change
  or disable takes effect at refresh) and returns a new pair.
- **Reuse detection:** rotations share a `family_id`; presenting an
  already-rotated (or revoked) token revokes the whole family → `401
  REFRESH_REUSE_DETECTED`. `POST /v1/auth/logout` revokes the presented token
  (or `?everywhere=true` the family).
- **Console:** stores the refresh token in memory, refreshes ~30s before access
  expiry, and falls back to sign-out if refresh fails. Logout revokes server-side.
- Endpoints: `POST /v1/auth/refresh`, `POST /v1/auth/logout`.

**Tests:** `refresh.test.mjs` 11/11 (rotation, rotated-token authenticates,
role-change-on-refresh, reuse → family revoked, logout, unknown token). OAuth /
SSO / governance canaries green. Verified in-browser: a session with a 20s
access TTL stayed alive across navigation 25s later via silent refresh.

## 9. Per-tenant / per-classification retention (close-out)

Retention is no longer one global number. `M12` adds an admin-editable
`retention_policies` table resolved most-specific-wins (exact classification
level > wildcard > the tenant's `retention_days`), with separate
`retention_days` and `purge_grace_days`.

- **At publish** the resolved policy is baked into the document as two explicit
  timestamps — `retention_until` (→ archived) and `purge_after` (→ bytes
  purged) — so the cross-tenant purge sweeper stays a pure timestamp comparison
  with no per-tenant policy context. Legacy rows (no `purge_after`) fall back to
  `retention_until + DISPATCH_PURGE_GRACE_DAYS`.
- **API:** `GET/POST /v1/admin/retention-policies` (dispatch:admin).
- **Console:** a "Retention" tab in Admin (classification / retain days / purge
  grace).
- `resolveRetention()` lives in `governance.mjs` alongside the approval-policy
  resolver.

**Tests:** `retention-policy.test.mjs` 10/10 (admin gating + upsert/list,
most-specific resolution, publish bakes both timestamps from the policy, sweep
honours per-document `purge_after`). admin-retention + governance canaries green.
Verified in-browser (Retention tab).

## 10. Document templates / scaffolds (close-out)

Institutions can define their own report formats without code. The built-in
scaffolds (`schemas/scaffolds.v1.0.json`) define, per docType, the required
section ROLES a document must contain to be publishable. `M13` adds a
tenant-editable `templates` table; the API overlays active tenant templates onto
the built-ins at validate time.

- **Validator:** `validateRequest(req, { scaffolds })` / `validateDocument(doc,
  { scaffolds })` accept an override; `resolveScaffolds(overlay)` merges tenant
  templates onto built-ins; `listDocTypes()` lists the built-ins. Pure +
  backward-compatible (existing one-arg callers unchanged).
- **DDM schema:** the frozen `docType` enum was relaxed to a string pattern, so
  the SCAFFOLD PROFILE SET (built-in + tenant) is the authority on supported
  types — an unsupported docType is still reported as `DOC_TYPE_UNSUPPORTED` by
  the post-schema scaffold check. Widening, backward-compatible.
- **API:** `tenantScaffolds(principal)` loads active templates under the tenant
  claim and feeds both validate sites (`/v1/validate`, `/v1/documents`). Admin
  CRUD `GET/POST /v1/admin/templates`, `DELETE /v1/admin/templates/{docType}`
  (dispatch:admin). `GET /v1/doctypes` returns the effective set for any reader.
- **Console:** a "Templates" tab in Admin (define/override docType, required +
  optional roles, edit/delete; built-in overrides flagged).

**Tests:** `templates.test.mjs` 12/12 (admin gating, custom docType validates,
custom docType missing a role → SCAFFOLD_INCOMPLETE, built-in override adds a
required role, effective doctypes, delete reverts to built-in, tenant
isolation). ddm-schema 25/25 (+ engine/render/policy 81) and the full services
sweep green. Build + lint clean; Templates tab verified in-browser.

## 11. Honest gaps / next

- Docker image builds for `dispatch-web` validated by local `npm run build`; the
  nginx image build itself is unexercised here (no Docker daemon in this env).
- Refresh tokens live in memory (lost on tab close); persisting them would need
  secure storage and is deliberately deferred for classified contexts.
- Retention sweeper still runs on a fixed wall-clock interval; the *windows* are
  now per-policy, but the sweep cadence itself is global.

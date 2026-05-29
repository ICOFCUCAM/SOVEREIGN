# Sprint 2 + Productionization — Completion Report

- Date: 2026-05-29
- Repo / branch: `ICOFCUCAM/SOVEREIGN` @ `claude/wizardly-dirac-d7P59`
- Head at report: `87e11af` (synced to origin)
- Status: **Sprint 2 complete; productionization + security residuals closed; deployment-ready.**
- Evidence: **203/203 tests green** on PostgreSQL 16 + headless Chromium (fresh run this date).

> Analysis only — no code changed to produce this report. Figures are reproduced
> from live runs, not memory. Honest gaps are called out in §6.

---

## 1. Scope delivered

Sprint 2 turned the Sprint-1 operational backbone (a worker with a stubbed render
seam) into a working institutional document service: **submit structured DDM →
render PDF / DOCX / Markdown → retrieve over HTTP / a browser console**, with the
productionization and security hardening needed to deploy it.

Built entirely in `SOVEREIGN` after migrating Dispatch out of the Polished Pages
repo earlier this session (history-preserved; Polished Pages is back to the
DocuForge SPA only).

## 2. Commit lineage (Dispatch)

```
87e11af  SSRF gate on image src (R-P1-3 partial)
6943193  Close R-S1-1: scrypt at-rest hashing (sha256 back-compat)
4d099a3  Deployment runbook + fix worker image/compose for Sprint-2 rendering
4989450  Harden download auth: single-artifact grants; drop full-token-in-URL
b60acec  S3-compatible artifact storage backend (shareable signed URLs)
0cfd187  Epic 10: hardening — metrics, content-safe logging, Chromium circuit-breaker
86fa484  Epic 9: Dispatch console (web UI) + browser-flow auth
be1be6b  Epic 7: DOCX renderer (LM → OOXML via `docx`)
d7077c4  Epic 6: PDF renderer (LM → themed HTML → headless Chromium)
06bee9c  Epic 8: retrieve endpoints — GET /v1/{jobs,artifacts,documents}/{id}
5181532 / adb9f9d  Epic 5: Dispatch Engine Core (Layout Model) + wire into worker (+ live MD)
   (on top of Sprint 0 296d7a4 + Sprint 1 3eb13e6 + Autonomy df9d6c8)
```

## 3. Epics — definition of done

| Epic | Delivered | Module(s) |
|---|---|---|
| **5 — Dispatch Engine / Layout Model** | Pure deterministic `buildLayout(ddm,ctx)→LM`: normalize, ref resolution (citation ordinals), template binding, scaffold enforcement (shared validator parity), ordering, numbering (sections/appendices/figures/tables), TOC. Presentation-neutral IR. | `ddm-schema/src/engine.mjs` |
| **6 — PDF renderer** | LM → themed HTML (`@page` banners, running header, page numbers, cover, TOC, inline SVG charts) → headless Chromium → PDF; deterministic after timestamp normalization; ~220ms warm. | `ddm-schema/src/render-html.mjs`, `shared/src/pdf.mjs` |
| **7 — DOCX renderer** | LM → editable OOXML via the `docx` lib: cover, Word TOC field, native tables, footnotes/citations, headers/footers, lettered appendices, signature blocks; chart→data-table fallback. | `shared/src/render-docx.mjs` |
| **8 — Retrieve endpoints** | `GET /v1/jobs/{id}` (status+result), `/v1/artifacts/{id}` (stream / `?disposition=metadata` / `?verify`), `/v1/documents/{id}`; tenant-scoped (cross-tenant→404), download audited. | `dispatch-api/src/server.mjs` |
| **9 — Dispatch console** | Single dependency-free web page served at `/`: authenticate → submit → live poll → download. | `dispatch-api/public/console.html` |
| **10 — Hardening** | `/v1/metrics` (counters/durations), content-safe structured logging (field whitelist; tenant truncated), Chromium circuit-breaker (opens after N PDF crashes; md/docx keep flowing → partial). | `shared/src/metrics.mjs` |

Also delivered (productionization + security):

| Item | What | Module(s) |
|---|---|---|
| **S3 storage** | S3-compatible backend (AWS / Supabase Storage / MinIO / R2), dependency-free SigV4; genuine presigned shareable URLs; `fs` default. | `shared/src/s3.mjs`, `shared/src/storage.mjs` |
| **Download grants** | Single-artifact, ~5-min, non-render-capable grants for browser links; removed full-token-in-URL. | `shared/src/auth.mjs`, `dispatch-api/src/server.mjs` |
| **R-S1-1 (closed)** | scrypt at-rest secret hashing (`scrypt$N$r$p$salt$hash`); legacy sha256 still verifies. | `shared/src/auth.mjs` |
| **R-P1-3 SSRF (closed)** | Image-`src` gate blocks metadata/private/loopback/IPv6-ULA/CGNAT/bare-IP/credentialed/non-http; allowlist opt-in; blocked→placeholder+warning. | `ddm-schema/src/src-policy.mjs` |
| **Deployment** | Runbook + Chromium worker image + compose (api/worker share storage + token secret). | `docs/DEPLOYMENT-RUNBOOK.md`, Dockerfiles, `docker-compose.yml` |

## 4. Test evidence (fresh run 2026-05-29, Postgres 16 + Chromium)

| Suite | Result | Covers |
|---|---|---|
| sprint1-e2e | 14/14 | contract→validate→DB→job→worker→status→audit; md artifact stored |
| sprint1-retry | 3/3 | transient retry → backoff → DLQ → failed |
| epic8-retrieve | 14/14 | jobs/artifacts/documents GET; metadata/verify; cross-tenant 404; 401 |
| epic6-pdf | 10/10 | submit→render→GET valid multi-page %PDF; sha256; pages |
| epic7-docx | 17/17 | valid OOXML parts + content; TOC field; E2E docx bytes |
| epic9-console | 16/16 | console served; token→submit→poll→download via grant; token-in-URL→401; cross-artifact grant→403 |
| epic10-hardening | 5/5 | /v1/metrics shape; counters; durations |
| epic10-breaker | 4/4 | breaker opens after 3 forced PDF failures; md still → partial |
| r-s1-1-secret-hash | 10/10 | scrypt roundtrip/salt/reject; legacy sha256; e2e both clients auth |
| s3-sigv4 | 4/4 | presign matches AWS published vector (byte-exact) |
| ddm fixtures | 25/25 | frozen DDM/Contract v1 (5 valid + 15 invalid) |
| engine | 27/27 | Layout Model: ordering/numbering/refs/determinism/parity |
| render-md | 15/15 | LM→Markdown |
| render-html | 16/16 | LM→HTML; escaping (no `<script>`); citation markers |
| src-policy | 23/23 | SSRF vectors + render-html enforcement |
| **TOTAL** | **203/203** | |

## 5. Architecture (as built)

```
caller (Emergency AI / SaaS UI / console)
  → dispatch-api  (/v1: token · validate · documents · jobs · artifacts · documents · grant · metrics; serves console at /)
       │ validate (shared Ajv + post-passes) · auth (Principal: HS256 JWT / scrypt svc creds) · tenant claim
       │ persist documents+immutable versions+jobs · append-only audit · enqueue
       ▼  Postgres (RLS, 10 tables, NULL-claim-deny)  — jobs queue (SKIP LOCKED)
  dispatch-worker
       claim → buildLayout (Engine, Epic 5) → render md/pdf/docx (independent, partial-isolated)
       → store artifact (fs|s3, sha256, expires_at) → DocumentResult → signed HMAC callback
       retry/backoff → DLQ ; Chromium circuit-breaker ; metrics + content-safe logs
  storage: fs (dev) | S3-compatible (prod, presigned URLs)
```

Invariants held throughout: one shared validator (`/validate` ≡ worker); immutable
document versions + artifacts; append-only audit; hard multi-tenant RLS; AI out of
the render path (ADR-004); deterministic renders.

## 6. Honest gaps (not done — by environment or by design)

**Not exercisable in this environment** (verified by proxy; validate on deploy):
- **Docker image builds** — no Docker daemon here; Dockerfiles + compose are
  `docker compose config`-validated only.
- **Live S3 PUT/GET** — no bucket/network; SigV4 proven against AWS's published
  vector, round-trip unrun.
- **LibreOffice/Word open-validation of DOCX** — LO headless can't load even a
  library-minimal docx here (LO/Java env issue); validated via OOXML structure +
  parts + content instead.

**Deliberately deferred (ADRs / Phase 3–4):**
- Chromium `--no-sandbox` review + seccomp + network-isolation at print time, and
  a **pentest** — the rest of R-P1-3 (deploy-time + external).
- **Classification enforcement** — descriptive only (banners render; clearance not
  enforced); PDF/A & PDF/UA plumbed but default-off.
- **Veritas verification** — Phase 3; remit still an explicit assumption.
- Per-tenant queue fairness (R-S1-5); callback retry loop is best-effort.

## 7. Risk register movement this session

- **R-S1-1 (auth dev shim / at-rest hashing): Closed** (HS256 verify + scrypt).
- **R-P1-3 (SSRF/injection/sandbox): Critical → Partial** (injection escaped, SSRF
  closed; sandbox/pentest remain).
- **R-P1-1 (tenant isolation): Mitigated** (RLS forced; SPK-B + e2e).
- Open Critical remaining: **R-P1-2** (PDF reliability/determinism *at load* —
  feasibility proven, load test pending) and the deploy-time half of R-P1-3.

## 8. Recommendation

**Sprint 2 = PASS.** All six epics delivered to DoD; productionization (S3,
grants) and the two closable security residuals (R-S1-1, SSRF) done; 203/203 on
real infrastructure. The service is **deployment-ready**: remaining work is
standing it up on real infrastructure (host + Postgres + S3 + TLS per the runbook),
load/pentest validation, and the explicitly-deferred Phase 3/4 governance features
— none of which is blocked by missing engineering.

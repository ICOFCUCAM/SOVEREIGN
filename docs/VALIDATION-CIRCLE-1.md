# CIRCLE 1 — Platform Validation Report

**Scope:** Clean-room validation of the Sovereign Dispatch platform after the
architectural milestone (two products + first-class governance). No features
added during this cycle — verification only.

**Method:** Destroyed the local mutated database, provisioned a fresh `dispatch`
database, applied migrations **M1 → M12 from zero with `--seed`** (the exact CI
recipe), booted the API, and ran every suite plus the application flows.

**Environment:** Postgres 16, local socket; API `dispatch-api@1.0.0`;
`DISPATCH_TOKEN_SECRET=ci-dispatch-token-secret` (CI parity). Render is driven
in-process via the worker's `tick()` (same as CI — no separate worker process).

---

## 1. Environment bootstrap — CONFIRMED GREEN

| Step | Result |
|---|---|
| Drop + recreate database | ✅ |
| `create extension pgcrypto` | ✅ |
| `migrate up --seed` (M1→M12) | ✅ applied 12 |
| `migrate status` | ✅ **0 pending, 12 applied** |
| `alter role dispatch_app` | ✅ |
| Seed fixtures present (3 tenants, `svc-a`) | ✅ |

`M12` (governance policies) applies idempotently on a fresh table (the
`drop policy if exists` NOTICEs are expected and harmless).

## 2. Static gates — CONFIRMED GREEN

| Gate | Result |
|---|---|
| DDM schema fixtures (`packages/ddm-schema`) | ✅ **25 / 25** |
| Web build `tsc -b && vite build` (strict) | ✅ clean |

## 3. CI backbone suites — CONFIRMED GREEN (one-shot, fresh DB)

These four are the maintained, **co-runnable** set CI actually runs.

| Suite | Result | Covers |
|---|---|---|
| `sprint1-e2e` | ✅ **14 / 14** | submit → approve → render → publish; tenant isolation (403); idempotency/replay; bad-secret 401 |
| `sprint1-retry` | ✅ **3 / 3** | retry / DLQ |
| `provisioning.test` | ✅ **15 / 15** | tenant accounts, secret issue/rotate/revoke, RLS, no-self-escalation, console path |
| `billing.test` | ✅ **14 / 14** | free plan, quota gate, subscribe, download paywall |

## 4. Governance architecture — CONFIRMED GREEN (one-shot, fresh seed)

| Suite | Result | Covers |
|---|---|---|
| `governance.test` | ✅ **23 / 23** | submit → `in_review` → approval queue → separation-of-duties → quorum approve → render → publish; reject path; machine auto-approve lane; audit trail; auditor-scope gating |

> On the first sequential run this reported 3 failures; with the free-tier
> **quota gate neutralised** (`doc_quota` raised on the seed tenant) it is a
> clean **23/23**. The failures were the quota gate (a later feature) blocking
> the test's 4th document, not governance logic. See §7.

## 5. Application architecture — CONFIRMED GREEN (browser, fresh signup)

| Flow | Result |
|---|---|
| Two products: Operations `/console` vs Administration `/admin` | ✅ separate nav, label, home |
| Product switcher only for `dispatch:admin` principals | ✅ |
| Operator isolation: non-admin at `/admin` → bounced to `/console`, no admin content | ✅ |
| Governance policy create + list (RLS-scoped, tenant-confined) | ✅ (`201` + list) |
| Policy **inheritance** shown on Create Record ("This record follows …") | ✅ |
| First-run onboarding; institutional error language (no raw backend strings) | ✅ |

## 6. Other unit / feature suites

Each passes **one-shot on a pristine database**; several fail when run *after*
other suites because they share the seed tenant (see §7).

| Suite | One-shot result |
|---|---|
| `clearance.test` | ✅ 4 / 4 |
| `r-s1-1-secret-hash.test` | ✅ 7–10 / 0 |
| `epic7-docx.test` | ✅ 13 / 0 |
| `s3-sigv4.test` | ✅ 4 / 0 |
| `epic10-hardening.test` | ✅ 5 / 0 (needs `DISPATCH_API_URL`) |
| `epic6-pdf`, `epic8-retrieve`, `epic9-console`, `epic10-breaker` | ✅ pristine / ❌ when run after others (see §7) |

---

## 7. Findings, categorised

### Confirmed green paths
Environment bootstrap; all four CI suites; governance (23/23); DDM + web build;
the two-product application, governance policy CRUD, and policy inheritance.
**A clean environment provisions from zero and completes the institutional
publication lifecycle through Publish, unattended.**

### Flaky paths — test co-runnability (environmental, not platform)
The `epic*` and `governance` suites each assume a **pristine database** and
reuse **static idempotency keys**; run in sequence on the shared seed tenant
they pollute each other (a submit returns a stale replay → `result` is `null` →
`Cannot read 'artifacts' of null`). This is why CI runs only the four
co-runnable backbone suites. **Recommendation:** give each suite an isolated
tenant (or a reset hook) so the full set can be added to CI.

### Environmental failures
- **Quota gate vs. older tests.** The free-tier quota (M10) blocks multi-submit
  tests that don't subscribe their seed tenant (`governance.test`'s 4th doc).
  Pre-dates billing. **Recommendation:** seed tenants as subscribed, or raise
  their `doc_quota`, in `sprint1_seed.sql`.
- **Mutated local DB.** Earlier in-session failures were entirely accumulated
  state; gone after a clean reseed.

### Architectural failures / gaps (real, platform-level)
1. **Archive is unreachable.** The state machine defines `published → archived`
   and `withdrawn → archived`, and CIRCLE-A added an Archives surface — but there
   is **no operator endpoint, no retention job, and no worker logic** that moves
   a record to `archived` (routes cover only `decision|publish|withdraw`). A
   record cannot currently reach the archived state. **Must fix to claim a
   complete lifecycle.**
2. **Governance is descriptive, not enforced.** The review chain / authorities
   are inherited, displayed and recorded, but the approval workflow does **not**
   yet require the policy's named roles, in order, before publication. (This is
   the planned CIRCLE 2.)

---

## 8. Exit criteria

> *A clean environment can be provisioned from scratch and complete the full
> institutional publication lifecycle without manual intervention.*

- Provision from scratch, unattended: **MET** (migrate `--seed` → 0 pending; API
  boots; backbone + governance green).
- Lifecycle **through Publish**: **MET** (`sprint1-e2e` 14/14, `governance`
  23/23).
- Lifecycle **through Archive**: **NOT MET** — archive has no trigger (gap #1).

**Verdict:** The architecture is **validated through Publish**. Two blocking
items before building further: (a) implement the **archive** transition so the
lifecycle is genuinely complete; (b) the planned **governance enforcement**
(CIRCLE 2). The flaky-suite and quota-seed items are test-infrastructure
hygiene, not platform defects.

---

## 9. Archive as Preservation — IMPLEMENTED & VALIDATED (gap #1 closed)

`M13` adds preservation (`archived_at`, `preservation_sha256`, retention index).
The archive transition, certificate, immutability and retention path were built
and validated on a fresh M1→M13 database (0 pending, seeded):

| Check | Result |
|---|---|
| Full lifecycle reaches `published` | ✅ |
| `POST /v1/documents/:id/archive` → `archived` + integrity proof | ✅ |
| Preservation certificate: record hash + matching integrity proof | ✅ |
| Certificate: publication + archive timestamps, policy, approval chain | ✅ |
| Immutable after archive: re-archive / withdraw / republish all **409** | ✅ |
| Certificate refused for a non-archived record (**409**) | ✅ |
| Retention sweep (`POST /v1/admin/retention/sweep`) auto-preserves due records | ✅ |
| Swept record is `archived` + preserved | ✅ |
| Preservation Certificate surfaced in the Archives product area (UI) | ✅ |

**Lifecycle test result: 12 / 12.** No CI regression from M13 (sprint1-e2e
14/14, retry 3/3, provisioning 15/15, billing 14/14 re-run on the M13 database).

**Updated exit criteria:** Submit → Govern → Approve → Render → Publish →
**Archive** is now **fully executable and validated in a clean environment**.
Archive is treated as preservation — an archived record is a terminal, immutable
institutional artifact with a tamper-evident certificate, not a status flag.

**Next:** CIRCLE 2 — Governance Enforcement (policy becomes a control system).

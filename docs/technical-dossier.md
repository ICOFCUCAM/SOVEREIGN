# Sovereign Dispatch — Technical Dossier (DRAFT)

**Classification: RESTRICTED — controlled distribution.**
Issued per institution during evaluation: recipient-bound, watermarked, and
delivered as a governed Dispatch record with its own verification identity.
This file is the internal working draft. It is **never** published on the
public web; the public Architecture Overview deliberately stops at the
conceptual level and refers evaluators here via the Procurement Center.

> Sections marked ⚠ TO COMPLETE need facts only the operating team holds
> (infrastructure vendors, tested recovery timings, assessment reports).
> Everything else is drawn from the codebase and stays true by construction.

---

## 1 · System context

| Component | Path | Role |
|---|---|---|
| Dispatch API | `services/dispatch-api` | REST surface; OAuth2 client-credentials; submission, governance decisions, publication, audit, artifact grants |
| Dispatch Worker | `services/dispatch-worker` | Queue-backed deterministic render lane (PDF/DOCX/MD) |
| Dispatch Web | `services/dispatch-web` | Public site, operations console, administration |
| Shared governance | `services/shared/src/governance.mjs` | Policy resolution, quorum evaluation, lifecycle transitions — one module used by API and worker |
| DDM schema | `packages/ddm-schema` | The single validator (JSON Schema + scaffold profiles) used by `/v1/validate`, `/v1/documents` and the worker; 27 record-type profiles |
| Contract schemas | `packages/contract` | Request/result envelopes shared across services |
| Database | `db/migrations` (M1–M25) | PostgreSQL, schema `dispatch`, row-level security throughout |

## 2 · Integration sequence diagrams

### 2.1 Submission → publication (async)

```
Integrator            Dispatch API              Governance          Render Lane        Record Store
    │  POST /v1/token      │                        │                   │                  │
    │─────────────────────▶│  scoped JWT            │                   │                  │
    │  POST /v1/documents  │                        │                   │                  │
    │─────────────────────▶│─ validate (DDM) ──────▶│ resolvePolicy     │                  │
    │   202 documentId     │   (docType, level)     │ N-eyes chain      │                  │
    │  POST …/decision ×N  │────────────────────────▶ quorum met        │                  │
    │  (webhook: approved) │─ enqueue render ──────────────────────────▶│ deterministic    │
    │                      │                        │                   │─ artifacts ─────▶│ hash-stamped
    │  POST …/publish      │─ seal provenance, mint Record ID ─────────────────────────────▶ published
    │  (webhook: published)│                        │                   │                  │
```

⚠ TO COMPLETE — per-integration diagrams for SSO provisioning and webhook
consumer patterns once the reference integrations are chosen.

### 2.2 Independent verification

Any holder of a Record ID queries the public verify portal; verification reads
the sealed record and its certificate chain (`M23__record_verification`,
`M24__verify_artifacts`) without authentication and without mutating anything.

## 3 · Data model & tenant isolation

- Schema `dispatch`; every tenant-owned table carries `tenant_id` with
  row-level security (`M2__rls_policies`). A missing tenant claim denies by
  default.
- Core objects: `documents` (doc_type, classification, lifecycle_state),
  versions and artifacts (content-addressed, hash-stamped), `audit_events`
  (append-only), `approval_policies` (per doc_type × classification,
  most-specific wins), preservation records (`M13`), approval steps (`M16`),
  departments/people/offices (`M19`, `M20`), SSO connections (`M21`),
  webhooks (`M22`).
- Policy writes require the elevated `tenant_admin` role in claims, scoped to
  the caller's own tenant; policies reference **offices, never people**.

⚠ TO COMPLETE — entity-relationship diagram export and per-table retention
notes for the recipient's deployment model.

## 4 · Deployment & environment topology

- Container images: Dockerfiles per service; `docker-compose.yml` for a
  self-contained stack (API, worker, web, PostgreSQL).
- Managed-cloud reference deployments: `render.yaml` (services + worker) and
  `vercel.json` (web).
- Delivery models offered: sovereign SaaS, private cloud, on-premises,
  air-gapped (scope per engagement).

⚠ TO COMPLETE — reference topology diagrams per delivery model, sizing
guidance, and the network/egress matrix for air-gapped deployments.

## 5 · Disaster recovery & continuity

⚠ TO COMPLETE — this section must state only rehearsed facts:
- RPO/RTO objectives per deployment model, and the dates they were last tested
- Backup cadence, encryption and restore procedure for the record store
- Runbooks: database restore, artifact-store restore, queue drain/replay
  (renders are deterministic and safely re-runnable from validated source)
- Failure-domain notes: the render lane is asynchronous and absorbs bursts;
  published records are immutable and reconstructible from sealed artifacts

## 6 · Security testing & hardening

Design posture (verifiable in code today): tenant RLS deny-by-default,
short-lived scoped JWTs, least-privilege scopes enforced server-side,
append-only audit with SHA-256 content hashes, AI drafting assist disabled at
OFFICIAL-SENSITIVE and above.

⚠ TO COMPLETE — penetration-test summaries, dependency/secret scanning
cadence, hardening baseline (CIS or equivalent), and vulnerability-disclosure
contact. Include only assessments that have actually been performed, with
dates and scopes.

## 7 · Migration & cutover playbooks

- Ingest path: existing archives enter through the same governed pipeline —
  structured DDM submission (API) with provenance metadata; artifacts are
  sealed and preserved with their original dates recorded in metadata.
- Record types cover the institutional estate (27 types including
  legislative instruments, gazette and public notices, tender and award
  records, contracts, judgments, board resolutions, election declarations,
  AI model approvals), so legacy classes map to first-class types rather
  than a generic bucket.

⚠ TO COMPLETE — bulk-import tooling notes, per-source mapping templates
(records management systems, shared drives, paper scans + OCR), cutover
sequencing and rollback points, and the parallel-run acceptance criteria.

---

*Issue procedure: render this dossier through Dispatch itself as a governed,
recipient-bound record (watermarked per institution) and deliver via a signed,
expiring artifact grant — the platform governing its own most sensitive
document is part of the evidence.*

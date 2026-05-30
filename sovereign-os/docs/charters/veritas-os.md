# Veritas OS — Production Charter

**Status:** Drafted Phase 0.2 (parallel to Knowledge Provider contract).
**Owner:** Sovereign Architecture.
**Decision required:** Production build go/no-go before Phase 1 ships.

This is the production charter for Veritas OS as the institutional
implementation of the Tier 00 Knowledge Provider contract. It is not a
marketing document; it is the engineering scope and decision register
that converts Veritas OS from positioning to product.

---

## Positioning (unchanged)

Veritas OS is **Knowledge & Organizational Intelligence Infrastructure**
— organisational memory, institutional knowledge, search, reference and
knowledge governance for institutions at any scale.

The dependency analysis (separate document) establishes Veritas OS as
the production owner of Tier 00 in the Sovereign intelligence stack.
Emergency AI consumes the surface; Veritas OS owns the substrate.

---

## Capability scope

Veritas OS production must satisfy the Tier 00 Knowledge Provider
contract (`@sovereign/intel-knowledge-contract` v0.1) end-to-end.

Six capability groups, MVP scope:

| Group | MVP scope |
|---|---|
| Document substrate | Upload, version, store and serve PDFs, DOCX, PPTX, plain text. Hash-addressed; tenant-isolated. |
| Structured records | Decisions, postmortems, outcomes captured through the contract's `memory` surface. |
| Knowledge graph | Institutional entity model (persons, units, programmes, contracts, products, committees, roles) with typed relationships and provenance. |
| Reference & retrieval | Tenant-scoped semantic search over uploaded documents; citation-grounded answers via the platform LLM. |
| Doctrine surface | Topic-indexed doctrine library; jurisdiction-tagged; supersession-aware. |
| Governance | Classification on every artefact; redaction-on-retrieve; complete audit log. |

Out of scope for MVP:

- Document authoring (Veritas OS curates and serves; it does not author).
- Workflow / approvals (consumed from Sovereign Operations or external).
- Real-time collaborative editing.
- Cross-tenant doctrine federation.

---

## Deployment topology

Veritas OS is a sovereign flagship. It must:

- Deploy as a single-tenant institutional system per the standard
  Sovereign deployment model.
- Run within the same sovereign jurisdiction as the institution.
- Carry the standard Sovereign audit posture and tenancy guarantees.
- Co-deploy with Emergency AI in the bundled case; federate across
  Sovereign deployments in the federated case (provider contract is the
  wire).

Veritas OS must not have a hard dependency on Emergency AI. It is
standalone-deployable for institutions buying only the knowledge layer.

---

## Surface inventory

Three first-class surfaces:

| Surface | Audience | Purpose |
|---|---|---|
| **Console** | operators, librarians, archivists | Upload, classify, version, audit, manage entity graph |
| **Provider API** | Sovereign products | Implements `@sovereign/intel-knowledge-contract` |
| **Briefing inserts** | end-users via consuming products | Excerpts, citations and doctrine excerpts surfaced inside Emergency AI briefings, Sovereign Dispatch artefacts, etc. |

Veritas OS has no direct end-user UI for non-knowledge-management
audiences. Executives, ministers and analysts consume Veritas OS
*through* Emergency AI, Sovereign Dispatch and the other flagships.

---

## Substrate sketch (MVP)

This is the engineering footprint to ship the MVP. Each item carries an
estimated build budget; total ≈ 10 weeks for production V1.

| Component | Substrate | Notes | Budget |
|---|---|---|---|
| Document store | Supabase Storage + Postgres metadata | Hash-addressed; immutable; versioned | 1 wk |
| Document parser | Worker (pdf-parse, mammoth, pptx-parser) | Text extraction; structure preservation; per-MIME handler | 1 wk |
| Embeddings | Voyage-3 via batch API | Per-chunk; HNSW pgvector index per tenant | 1 wk |
| Entity graph | Postgres tables; same shape as `intel_*` graph but in `veritas_*` namespace | Persons, units, programmes, etc. | 1 wk |
| Doctrine index | Postgres + topic taxonomy | Jurisdiction + supersession-aware | 1 wk |
| Provider API | Edge functions + Fly worker for heavy retrieve | Implements all six capability groups | 2 wk |
| Console | Next.js app under `sovereign-os/apps/veritas-console` | Upload, classify, version, audit, entity graph manager | 2 wk |
| Governance | RLS policies, classification enforcement, audit log | Same posture as Emergency AI tenant isolation | 1 wk |

Engineering can compress this with the contract test suite as the
acceptance harness — every component ships green against
`runContractTests`.

---

## Cost model

Per institutional tenant, blended estimate for a 100k-document estate:

| Component | Provider | One-off | Recurring |
|---|---|---|---|
| Storage (hot + warm) | Supabase | — | $30 / mo |
| Storage (cold raw) | Supabase Storage | — | $25 / mo |
| Parsing | Worker compute | — | $40 / mo |
| Embedding (initial) | Voyage-3 | $200 | — |
| Embedding (delta) | Voyage-3 | — | $20 / mo |
| Retrieval inference | Claude (grounded answers) | — | usage-based, ~$0.05/answer |
| Compute (provider API) | Fly machines | — | $80 / mo |
| **Blended** | | **~$200** | **~$200 / mo + retrieval usage** |

Marginal cost is dominated by retrieval inference, which scales with
Emergency AI's briefing rhythm and is billed transparently.

---

## Decision register

Decisions the user must make to charter the production build:

| # | Decision | Default if not made |
|---|---|---|
| C1 | Production build go/no-go | No-op (Veritas OS remains positioning; reference provider services Phase 1) |
| C2 | Bundled or federated deployment as primary case | Bundled |
| C3 | Console branding — Veritas OS standalone or part of Sovereign Operator Console | Standalone Veritas Console (cleaner separation) |
| C4 | Document classification taxonomy — Sovereign standard or institution-defined | Sovereign standard with override hook |
| C5 | Doctrine versioning strategy — supersession (default) or branching | Supersession |
| C6 | Embedding provider lock-in — Voyage exclusively or pluggable | Pluggable, Voyage default |
| C7 | Cross-product write-back policy — accept events from Emergency AI only, or any Sovereign product | Any Sovereign product (Sovereign Dispatch, CivicOS, ELECPRO can all write events) |

---

## Phase relationship

| Sprint | Owner | Deliverable |
|---|---|---|
| **Phase 0.1** | Sovereign | Contract spec (`@sovereign/intel-knowledge-contract` v0.1) |
| **Phase 0.2** | Sovereign | **This charter** |
| **Phase 0.3** | Sovereign | Reference provider (`@sovereign/intel-knowledge-reference`) |
| **Phase 0.4** | Sovereign | Emergency AI provider client + degradation |
| **Phase V1.x** | Veritas OS team | Production build per this charter; replaces reference provider on completion |

The reference provider unblocks Phase 1 work without committing to the
production Veritas OS build timeline. Charter approval is a separate
decision from Phase 0 progress.

---

## Acceptance

Veritas OS V1 is accepted when:

1. It passes `runContractTests` from `@sovereign/intel-knowledge-contract`.
2. A 10k-document institutional estate ingests within budget and surfaces sub-800ms p95 retrieval.
3. Emergency AI's `/console/intelligence` shows "Provider: veritas-os@1.x" in the health panel and degradation banners disappear.
4. Sovereign Dispatch produces a briefing carrying doctrine citations resolved through Veritas OS.
5. Audit log records every document access by principal, action and verdict.

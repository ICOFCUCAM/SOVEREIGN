# ExitOS document system — implementation plan

Deliverable 1 of the document-system rebuild. It maps every finding of the 13 October 2026 document audit
(baseline `6c929573`, PR #29) to the code as it stands on `claude/document-integrity-p0`, with severity, fix,
dependencies, tests and acceptance criteria, and sets the order of work.

Severity: **S0** release-blocking (confidentiality, isolation, authorization) · **S1** false or misleading
output (claims, sample data, execution states) · **S2** inconsistency between documents · **S3** production
quality.

## 1. What the code actually has (verified)

| Area | Fact | Where |
|---|---|---|
| Sign-in | Synthesised in the browser: any email and password sign in; the token is `dev.<base64>.dev`. Roles and plans are client state. | `src/lib/auth.tsx:51-100` |
| Backend identity | On sign-in the browser obtains an **anonymous** Supabase user (`auth.uid()`), one per browser, falling back to localStorage when Supabase is unreachable. | `src/lib/supabase-auth.ts`, `src/lib/exit-api.ts:424` |
| Persistence | One `ExitApiClient` interface with InMemory, LocalStorage and Supabase adapters. Tables `exitos_*` (migrations `0001`–`0003`) hold accounts, listings, deal events, NDA requests, offers, deals, documents, notifications, mandates. | `src/lib/exit-api.ts`, `src/lib/supabase-exit-api.ts`, `supabase/migrations/000*` |
| Company record | The saved intake in localStorage, merged over `SAMPLE_INTAKE` and mapped by `buildProfile`; **every company gets id `"intake"`**. No transaction record exists. | `src/lib/active-company.ts`, `src/lib/company-intake.ts:61` |
| Document generators | Five independent families: `deliverables.ts` (Markdown builders), `report-docs.ts` + `report-model.ts` (print pages), engine memoranda (`exit-engines/src/memorandum/template.ts`), the unused traced suite (`exit-engines/src/documents/engine.ts`), and inline page builders (Negotiator, Banker, Closing, DiligenceAI, Buyers). | see inventory, §3 |
| Rendering | Every "PDF" is `window.print()` (`src/lib/report-ui.tsx:27`). The monorepo already has a real renderer: **Sovereign Dispatch** — the DDM v1 schema (`packages/ddm-schema`, with classification, signatures, evidence, citations), Markdown/HTML renderers, PDF through headless Chromium (`services/shared/src/pdf.mjs`), DOCX, a job worker with an approval state, and ExitOS's own submit path for the board memo (`src/lib/dispatch-ddm.ts`, `supabase/functions/exit-dispatch-submit`). | — |
| Downloads | `triggerDownload` saves `.md`, `.csv` and `.ics` as `text/plain`. | `src/lib/ui.tsx:90-102` |

## 2. New findings (not in the audit)

| ID | Sev | Finding | Where |
|---|---|---|---|
| N-1 | S0 | **Every listing row carries the company's full private profile** (name, every financial), and RLS lets any authenticated user — including the anonymous user every browser gets — read every listing. The UI hides it; the API does not. The buyer-side Radar downloads it to match. | `supabase/migrations/0001_exitos_backend.sql:42-50`, `src/lib/listings.ts:33`, `src/pages/AcquisitionRadar.tsx:81` |
| N-2 | S0 | Offers, NDA requests, deals, deal documents and deal events are readable by **every** authenticated user (`using (true)`); writes were already restricted by `0002`/`0003`. | `0001_exitos_backend.sql:54-113`, `0003_exitos_network.sql:21` |
| N-3 | S0 | No real authentication: any role (founder, buyer, operator in dev) is claimed in the browser. Server-side authorization of approvals, counsel review or execution verification is impossible until accounts are real. | `src/lib/auth.tsx` |
| N-4 | S1 | A saved intake is merged over `SAMPLE_INTAKE`, and the form starts from the demo figures, so editing one field saved every demo figure as the founder's. Fixed `c0a327b6` (supplied vs unconfirmed fields). | `src/lib/active-company.ts:17,36` |
| N-5 | S1 | Every company's id is `"intake"`, so nothing generated can be traced to a company. Fixed `c0a327b6`. | `src/lib/company-intake.ts:64` |
| N-6 | S1 | Telemetry and calibration write against the demo tenant id. Fixed in code `016abaf7`; functions not deployed. | `src/lib/telemetry.ts`, `calibration.ts`, `buyer-stats.ts` |

## 3. Audit findings, verified against current code

Status: **Fixed** = fixed on this branch with a test · **Open** = verified still present.

### Confidentiality and isolation (S0)

| ID | Finding | Status | Fix | Test / acceptance |
|---|---|---|---|---|
| A-1 | Introduction letter states the EV midpoint pre-NDA | Fixed `af7ef82f` | removed; figures follow under NDA | `deliverables.test.ts`: no "enterprise value" in the letter |
| A-2 | Warm-intro subject names the company and ARR | Fixed `af7ef82f` | sector + ARR band only, code moved to `lib/warm-intro.ts` | `warm-intro.test.ts` |
| A-3 | Gating document claims identity / funds verification | Fixed `af7ef82f` | rewritten as an access *policy* stating what is and is not checked | `deliverables.test.ts` |
| A-4 | All data-room uploads in one shared tenant readable by all | Fixed in code `fc8b8ea2`; **not deployed** | functions take the tenant from the user's token, refuse anon | `data-room.test.ts`; acceptance needs redeploy + a two-account check |
| N-1 | Listing rows expose private profiles | Fixed in code `04a7d16b`; **migration not applied** | split: public row holds code + public view; private profile in an owner-only table; buyer-side matching on the public view | migration test (SQL policy assertions), listings unit tests, Radar works on public view |
| N-2 | Offers / NDA requests / deals / documents / events world-readable | Fixed in code `04a7d16b`; **migration not applied** | RLS: readable by the buyer party and the listing owner only; documents by visibility and signed NDA | `supabase/tests/isolation/run.sh` (owner / buyer / stranger) |
| A-5 | Radar says identity is revealed on signature; Inbox says never | Fixed `016abaf7` | one statement, from the disclosure policy (below) | copy test on both pages |
| A-6 | DiligenceAI `.md` exports have no confidentiality header | Fixed `016abaf7` | route through the shared frame (later: the registry renderer) | export test |
| A-7 | Filenames and metadata could carry the company name (`docFilename` slugs the title) | Fixed `016abaf7` (memoranda); per-type names for all exports with D3 versions | safe filenames from document type + project code + version, never the company name for pre-NDA classes | filename test per classification |

### False claims and sample data (S1)

| ID | Finding | Status | Fix / acceptance |
|---|---|---|---|
| B-1 | Autopilot claims (teaser written, rooms provisioned, disclosure schedule) | Fixed `16c7c68e` | claims match what runs |
| B-2 | Seller diligence report always on `SAMPLE_COMPANY` | Fixed `16c7c68e` | runs on the active company |
| B-3 | Offer comparison and closing checklist `.md` from demo data, unlabelled | Fixed (labelled) `16c7c68e` | banner + "sample basis"; replaced by real records in deliverable 4 |
| B-4 | Wealth plan claims state-tax / QSBS modelling | Fixed `16c7c68e` | states the flat 23.8% rate |
| B-5 | Exit run (CIM, teaser, NDAs, listing) always on `SAMPLE_COMPANY` | Fixed `137a1a77` | runs on the active company |
| B-6 | Teaser / CIM "tier-one jurisdiction" | Fixed `969663f0` | jurisdiction omitted when anonymised |
| B-7 | Negotiator, Investors, Wealth, Pipeline, Process Intelligence show demo offers / cap table to a founder with a saved intake | Fixed `ed9d8511` (founder records or empty state; demo example on request); NDA Vault and Dashboard funnel too | with a saved intake: show the founder's records or an empty state; demo data only in demo mode |
| B-8 | Counter-offer draft always for the demo company | Open (labelled) | generated from a recorded offer (deliverable 4) |
| B-9 | Fixed negotiating positions (4% break fee, 10% cap, 8% escrow) | Open | deal-specific, configurable, flagged for review (deliverable 4) |
| B-10 | Hard-coded word counts (deck 240, DD index 320) | Open | measured from content (deliverable 3) |
| B-11 | "PDF" labels on print dialogs | Relabelled `016abaf7`; real PDF D3 | relabel "Print" now; real PDF via Dispatch (deliverable 3) |
| B-12 | Module list advertises LOIs; "Generate closing docs" links to a page without them | Fixed `016abaf7` | remove the claims now; restore when built |
| B-13 | `.md` / `.csv` / `.ics` saved as `text/plain` | Fixed `016abaf7` | correct MIME types (`text/markdown`, `text/csv`, `text/calendar`) |
| B-14 | Banker on-screen teaser drops bullets | Fixed `ad1b33e4` | render through the shared preview |

### Execution states (S1)

| ID | Finding | Status | Fix / acceptance |
|---|---|---|---|
| C-1 | Issued NDA can never become active | Fixed `0afb0c6f` (local record) | signatures recorded per party; moves to the server-backed lifecycle in deliverable 4 |
| C-2 | Inbox "Mark executed" is a bare flag | Open | replaced by the NDA lifecycle: executed only with signature evidence for every required party |
| C-3 | NDA shapes: `one_way_disclosure` has no template; mutual-cure has no cure term; expiry runs from execution; 8 of "14" clauses; no clause text | Open | clause library with provenance and review status (deliverable 4); until then the package says it is a summary, not an agreement |
| C-4 | Data-room completeness counts any upload; missing list matches template filenames | Open | upload is tagged with its artifact id; completeness = required artifacts with an accepted file |
| C-5 | Deal stages have no signing stage | Open | transaction record with explicit milestones (deliverable 3) |

### Contradictions between documents (S2)

| ID | Finding | Fix (deliverable 3) |
|---|---|---|
| D-1 | Two CIMs: engine (10 sections, `.md`) vs `/report/cim` (8 sections, print) | one CIM definition; the report page becomes its preview |
| D-2 | Two closing checklists: 12 items on screen vs 6 hard-coded items in `.md` | one checklist record; screen and export render the same items, owners, statuses, dates |
| D-3 | Four timelines: CIM signing weeks 7–10 (`template.ts:214`); deck / exec summary LOI in 4–6 weeks; outreach LOI weeks 5–6 (`deliverables.ts:554`); teaser management presentation within 10 business days | one canonical process timeline on the transaction record; every document quotes it |
| D-4 | Board memo authorises launching a process but reads like approval | registry purpose + title make the scope explicit |
| D-5 | Dead code: `valuationMemo`, `tracedDocMarkdown`, `briefMarkdown`, `sendDeliverable`, the traced suite, the unused Claude generator | retire `valuationMemo`, `briefMarkdown`, `sendDeliverable`; keep the traced suite's provenance model as input to the registry; Claude generator stays off until it can be reviewed and labelled |

## 4. Architecture

Built inside the existing app and its patterns, no new infrastructure:

1. **Document registry** (`src/lib/documents/registry.ts`). One entry per document type: stable id
   (`exitos.cim`), schema version, stage, audience, kind (generated · drafted · tracked · requested ·
   counsel-supplied), classification (`public` · `pre_nda_anonymised` · `confidential_nda` ·
   `restricted_parties`), required/optional inputs, dependencies, review requirements, export formats
   actually implemented. A machine-readable export of it is the inventory deliverable.
2. **Transaction context**. A company record with a stable id (fixes N-5) and no sample fallback (N-4), plus a
   transaction record (process timeline, milestones, parties, offers, closing items, obligations) stored
   through the existing `ExitApiClient` adapters, owner-only under RLS.
3. **Input validation**. Each document type declares its inputs; generation returns either a document or a
   list of missing/invalid inputs. Drafts may proceed with explicit `[MISSING: …]` placeholders; nothing
   falls back to sample data.
4. **Disclosure gate**. Before generation, the classification is checked against the audience and the NDA
   state for that buyer; pre-NDA classes reject fields tagged confidential (name, exact figures, valuation).
5. **Generation** produces a **DDM v1 document** (the Dispatch schema), so one structure feeds the on-screen
   preview (`render-html`), Markdown (`render-md`), and PDF/DOCX through Dispatch. Distinct layouts per family
   (financial report, memorandum, legal draft, checklist, statement) as DDM profiles.
6. **Versions**. Each generation is an immutable version: type, schema and template versions, company and
   transaction ids, source-data version, input snapshot, content hash, time, author, status, supersedes.
   New table `exitos_document_versions` + `exitos_document_events` (audit), owner-only RLS, following the
   `exitos_*` conventions.
7. **Review workflow**. `draft → validated → in_review → counsel_review → approved → superseded`, separate from
   execution (`awaiting_signatures → executed (evidence) → active → expired/terminated`). Legal documents
   carry one of: educational template · founder draft · requires counsel review · counsel-reviewed ·
   executed (verified).
8. **Consistency engine**. Checks across the latest versions and the transaction record (names, values,
   currency, periods, dates, terms, milestones, closing items); findings with severity, documents, values and
   sources; an authorised note can mark a difference intentional.
9. **Exports**. Real PDF through Dispatch; Markdown, CSV, JSON, ICS with correct MIME types; safe filenames.
   Print stays available and is labelled "Print".

## 5. Prerequisites the owner must decide

- **Real authentication (N-3).** Server-enforced approval, counsel review and execution verification need
  real accounts. Until then ExitOS records *who claimed* an action, says so, and never labels anything
  approved or executed on that basis alone. Choose an auth method (Supabase email link, OAuth, SSO).
- **Deploying edge functions and migrations** to the live Supabase project (A-4 now, N-1/N-2 next).
- **Dispatch credentials** for the ExitOS submit function, so real PDFs can be produced outside development.
- **Counsel review** of any legal template before it is offered as more than an educational template.

## 6. Order of work

1. **Deliverable 2 — confidentiality, sample data, isolation** (this branch): N-1, N-2 (migration
   `20261013…_exitos_isolation.sql`), A-5, A-6, A-7, N-4, N-5, B-7, B-11 (relabel), B-12, B-13, plus a first
   registry slice with classifications and the disclosure gate, because the gate is what makes the leak
   tests enforceable. Regression test per leak.
2. **Deliverable 3 — registry, generation service, versions, exports**: full registry; transaction record and
   canonical timeline (D-3, C-5); DDM generation; one CIM (D-1); one closing checklist (D-2); measured
   counts (B-10); versions table and audit; Dispatch PDF; preview in the Documents workspace.
3. **Deliverable 4 — transaction documents, NDA lifecycle, data room**: process letter, bid instructions,
   structured IOI, LOI/term sheet, exclusivity draft, counter-offer and offer comparison from real bids
   (B-8, B-9); NDA lifecycle with evidence (C-2, C-3); artifact-tagged uploads and access requests (C-4).
4. **Deliverable 5 — consistency, signing/closing, post-closing**: consistency engine; SPA preparation,
   disclosure schedules, consents, escrow draft, funds flow, closing statement, bring-down certificate,
   closing cap table, filings checklist, announcements; post-closing obligations register; end-to-end tests.

Each increment reports changed files, migrations, behaviour changes, tests run, remaining defects and
rollback. Migrations are additive and reversible (each ships with its `down` statements in the report).

## 7. Mandate traceability (sections 1–12)

Every requirement of the mandate, with where it is handled, the deliverable that owns it, its status and the
evidence. Status: **Done** (in code, with a test) · **Partial** (started; what remains is stated) · **D3/D4/D5**
(planned in that deliverable) · **Owner** (needs a decision or access only the owner has, §5). A requirement
is never marked Done because a route, button or placeholder exists.

### §1 Assignment
| # | Requirement | Where | Status | Evidence |
|---|---|---|---|---|
| 1.1 | Read the audit; inspect generators, routes, schemas, data, exports, states, tests | §1–3 of this plan | Done | this document |
| 1.2 | Treat findings as claims to verify against current code | §3 status column | Done | each row re-checked on this branch |
| 1.3 | Rebuild the architecture, not more templates or a new Documents page | §4 | D3 | — |
| 1.4 | Work in the existing app; no demo, duplicate system or prototype | all changes in `exit-web`/`exit-engines`/`supabase` | Ongoing | — |

### §2 Authoritative inventory
| # | Requirement | Where | Status | Evidence |
|---|---|---|---|---|
| 2.1 | Machine-readable registry over all eight stages | `src/lib/documents/registry.ts` (52 types), `registryJson()` | Done | `registry.test.ts` |
| 2.2 | Per type: id, stage, audience, method, source, inputs, classification, kind, formats, export behaviour, review/execution, dependencies, defects, status | registry fields | Partial | versioning per type arrives with D3 versions; tests per type in §11 of this matrix |
| 2.3 | Human-readable report | this plan + audit doc | Done | — |
| 2.4 | Inventory both CIMs, both closing checklists, the four timelines, dead code, every sample-data output | registry `exitos.cim`, `exitos.closing_checklist`, D-3, `dead_code` entries, B-3/B-7/B-8 | Done | registry + §3 |
| 2.5 | Say what to consolidate, reuse, repair or retire | §3 (D-1, D-2, D-5) | Done | — |

### §3 Architecture
| # | Requirement | Where | Status |
|---|---|---|---|
| 3.1 | Document registry, one definition per type | registry | Partial (definitions; generation binding D3) |
| 3.2 | Transaction context (company, transaction, buyer, seller, offer, process) | company record with stable id (N-5) done; transaction record | D3 |
| 3.3 | Input validation (fields, types, units, currency, dates, provenance) | intake parsing + supplied/unconfirmed fields; gate inputs check | Partial (D3 adds typed schemas per document) |
| 3.4 | Deterministic generation from validated inputs and approved templates | DDM generation | D3 |
| 3.5 | Immutable versions with source refs, time, history, content hash, input snapshot | `exitos_document_versions` | D3 |
| 3.6 | Review workflow: draft → validation → review → counsel → approval → supersession | review states | D3 (server-enforced approval: Owner, auth) |
| 3.7 | Genuine PDF and structured exports | Dispatch renderer | D3 (credentials: Owner) |
| 3.8 | Consistency engine | §4.8 | D5 |
| 3.9 | Audit trail (generated, viewed, downloaded, changed, approved, superseded) | `exitos_document_events` | D3 |
| 3.10 | Stable type ids and explicit schema versions | registry ids, `REGISTRY_SCHEMA_VERSION` | Done (registry); per-document schema versions D3 |
| 3.11 | Existing database and migration conventions; no second source of truth | `exitos_*` tables, `ExitApiClient` adapters | Ongoing |

### §4 Confidentiality and integrity (release-blocking)
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 4.1 | No EV midpoint in the introduction letter pre-NDA | Done | `deliverables.test.ts`, `registry.test.ts` |
| 4.2 | No company name / ARR in the warm-intro subject | Done | `warm-intro.test.ts`, `registry.test.ts` |
| 4.3 | No unsupported verification / signature / access claims | Done for the gating document and Autopilot; NDA desk states its checks | `deliverables.test.ts` |
| 4.4 | Remove `SAMPLE_COMPANY`, `Project Cipher`, hard-coded figures and demo offers from real-company outputs | Partial: exit run, Autopilot findings, code names, intake contamination and founder pages (B-7) done; the negotiation step of the exit run and the Autopilot offer comparison still score demo offers, labelled, until real offers exist (D4) | `exit-process.test.ts`, `active-company.test.ts`, `registry.test.ts` |
| 4.5 | Tenant isolation for company, transaction, files, documents | Partial: listings (N-1), exchange rows (N-2) and data room (A-4) in code; deployment Owner; document versions D3 | `supabase/tests/isolation/run.sh`, `data-room.test.ts`, `listings.test.ts` |
| 4.6 | Server-side authorization for generation, retrieval, export, approval, access | Partial: RLS and data-room functions enforce party/tenant; role-based approval needs real auth (N-3, Owner) | isolation test |
| 4.7 | No leak through filenames, subjects, metadata, logs, public URLs | Partial: subjects, listing ids/rows, memorandum filenames, telemetry tenant done; document metadata with D3 versions | `listings.test.ts` |
| 4.8 | Classifications and pre-generation disclosure checks | Done for pre-NDA/public types; applied on Buyers, Banker, Documents | `registry.test.ts` |
| 4.9 | Missing input → validation error or explicit draft; never sample fallback | Partial: unconfirmed intake fields flagged and gated; typed per-document validation D3 | `active-company.test.ts` |
| 4.10 | Regression test per known leak and sample-data defect | Partial: tests for every fixed item; open items get theirs when fixed | §11 of this matrix |

### §5 One professional document system
| # | Requirement | Status |
|---|---|---|
| 5.1 | One CIM generator with validated sections | D3 (D-1) |
| 5.2 | One closing checklist; screen and export identical (items, owners, statuses, dates) | D3 (D-2) |
| 5.3 | Measured word counts and claims | D3 (B-10) |
| 5.4 | Design system: branding, covers, title/identity/classification, version/status/date/page numbers, typography, tables, figures, dates, headers/footers, notices, sources/assumptions/disclaimers, placeholders, metadata, safe filenames | D3 (DDM profiles on the Dispatch renderer) |
| 5.5 | Genuine PDF; print never presented as PDF | Partial: relabelled (B-11); real PDF D3 |
| 5.6 | Correct MIME types, filenames, extensions; editable formats only when real | Done `016abaf7` (`download.test.ts`) |
| 5.7 | Distinct layouts per family (financial, board, CIM, legal draft, checklist, statement) | D3 |

### §6 Missing M&A workflow
| # | Requirement | Status |
|---|---|---|
| 6A | Process letter, bid instructions, IOI request and criteria, management-presentation and diligence instructions | D4 |
| 6B.1 | Structured IOI (amount, currency, consideration, assumptions, financing, conditions, timing), separate from binding terms | D4 |
| 6B.2 | LOI / term sheet with unresolved terms | D4 |
| 6B.3 | Exclusivity draft (duration, scope, start/end, termination) | D4 |
| 6B.4 | Counter-offer from the actual transaction and selected offer | D4 (B-8) |
| 6B.5 | Offer comparison from real bids (consideration, conditions, financing, certainty, timing) | D4 (B-3) |
| 6C | SPA preparation; disclosure schedules linked to reps and warranties; board/shareholder approvals and consents; escrow draft; funds flow and closing statement; bring-down certificate; closing cap table and allocation; filings checklist marked for jurisdiction verification; announcements; counsel attachments and versions | D5 |
| 6D | Post-closing register: working-capital true-up, earn-outs, escrow release, indemnity deadlines and claims, IP assignments, regulatory/contractual actions, notices, deliverables — each with owner, due date, evidence, status, dependencies, reminders | D5 |

### §7 Legal and compliance boundaries
| # | Requirement | Status |
|---|---|---|
| 7.1 | Distinguish educational template · founder draft · requires counsel · counsel-reviewed · executed (verified) | D3 (legal status field), D4 (applied) |
| 7.2 | No claim of compliance, enforceability, execution or approval without evidence | Ongoing; NDA desk and gating document done |
| 7.3 | Jurisdiction, governing law, structure, parties as explicit inputs; no invented clauses, deadlines, tax or regulatory rules | Partial: teaser jurisdiction and wealth tax claims removed; transaction inputs D3 |
| 7.4 | No universal negotiation positions; configurable, attributed, validated, flagged | D4 (B-9) |
| 7.5 | Versioned clause library with jurisdiction, provenance, review status, effective dates; counsel review before production use | D4 (clause content and review: Owner) |

### §8 NDA execution and data-room access
| # | Requirement | Status |
|---|---|---|
| 8.1 | Explicit states and transitions; never active through a flag | Partial: signatures recorded per party (local); server lifecycle D4; "Mark executed" (C-2) D4 |
| 8.2 | Signature evidence, signatory identity, timestamps, document version, countersignature; external-execution workflow if no provider | Partial: signatory and time recorded; evidence attachment and version D4 |
| 8.3 | Data-room access from policy checks with server-enforced permissions; auditable; requested / approved / provisioned / revoked distinct | Partial: tenant isolation in code; access requests and audit D4 |
| 8.4 | Fix upload count vs missing artifacts; a file satisfies only its company, transaction, artifact type and review state | D4 (C-4) |

### §9 Cross-document consistency
| # | Requirement | Status |
|---|---|---|
| 9.1 | Checks: name and anonymised identity; EV, equity value, consideration, currency; ARR and periods; dates and assumptions; buyer/seller identities; offer terms; NDA and disclosure permissions; LOI, exclusivity and signing milestones; closing deliverables; post-closing dates | D5 (identity and disclosure already enforced by the gate) |
| 9.2 | One canonical timeline; milestones derived; contradictions flagged | D3 (timeline), D5 (checks) |
| 9.3 | Findings with severity, documents, values, sources; documented intentional differences | D5 |

### §10 Document experience
| # | Requirement | Status |
|---|---|---|
| 10.1 | Browse by stage and audience | D3 (registry-driven workspace) |
| 10.2 | See what ExitOS generates vs user input vs external parties | D3 (registry `kind`) |
| 10.3 | Generate from validated data; see missing inputs and disclosure restrictions first | Partial: gate notices on Buyers, Banker, Documents |
| 10.4 | Preview before export | Partial (on-screen views exist); unified preview D3 |
| 10.5 | Compare versions | D3 |
| 10.6 | Review, approval, signature and execution tracked separately | D3/D4 |
| 10.7 | Dependencies and outstanding actions | D3 |
| 10.8 | Correct version, drafts never confused with executed documents | D3/D4 |
| 10.9 | Export only when authorised and valid | Partial: blocked on disclosure findings; authorisation D3 |
| 10.10 | Capability status per document (available, needs inputs, draft only, awaiting review, externally supplied, blocked, completed); never claim an action that did not occur | Partial: registry `status`/`kind`; UI D3; false claims removed so far: B-1, B-5, data room |

### §11 Tests and release gates
| # | Requirement | Status |
|---|---|---|
| 11.1 | Per document type and required inputs | Partial (pre-NDA types; all types D3) |
| 11.2 | Real-company data propagation | Partial (exit run, teaser, gate tests) |
| 11.3 | No unintended sample data | Partial (`registry.test.ts`, `exit-process.test.ts`, `active-company.test.ts`) |
| 11.4 | Pre-NDA disclosure prevention | Done for current pre-NDA generators |
| 11.5 | Tenant isolation and server authorization | Partial (`supabase/tests/isolation`, `data-room.test.ts`) |
| 11.6 | NDA transitions and evidence | Partial (`nda-drafts.test.ts`) |
| 11.7 | Data-room completeness and permissions | D4 |
| 11.8 | PDF rendering, pagination, file types | D3 |
| 11.9 | UI / Markdown / PDF / structured export agreement | D3 |
| 11.10 | Cross-document financial and timeline consistency | D5 |
| 11.11 | Draft / review / approval / execution distinctions | D3/D4 |
| 11.12 | Post-closing obligations | D5 |
| 11.13 | Run lint, type-check, unit, integration, build; no weakened tests; report what cannot run | every increment (see the increment report) |

### §12 Delivery
| # | Requirement | Status |
|---|---|---|
| 12.1 | D1 plan mapping every finding to code, severity, fix, dependencies, tests, acceptance | Done (this document) |
| 12.2 | D2 confidentiality, sample data, isolation | Done in code (report §8); deployment Owner |
| 12.3 | D3 registry, generation service, templates, versions, exports | Planned |
| 12.4 | D4 transaction documents, NDA lifecycle, data room | Planned |
| 12.5 | D5 consistency, signing/closing, post-closing, end-to-end | Planned |
| 12.6 | Per increment: files, migrations, behaviour, tests, remaining defects, rollback | every increment report |
| 12.7 | Homepage and unrelated areas untouched | checked each increment (`boardcheck`) |

## 8. Increment report — deliverable 2 (confidentiality, sample data, isolation)

Branch `claude/document-integrity-p0`, on top of PR #29 (`6c929573`). Thirteen commits.

### Behaviour changed
- **Pre-NDA documents.** The introduction letter carries no valuation. The warm introduction names neither the company nor its exact ARR (sector and an ARR bracket). Anonymised documents use the company's own listing code name. The gating document became an access policy that claims no verification. The teaser no longer invents claims (profitable, sector-leading, management transition).
- **Gate.** A pre-generation gate (`lib/documents/gate.ts`) withholds a pre-NDA or public document containing the company's name, exact revenue, ARR or valuation, and marks a document as a draft when its inputs are still demo values. It is wired to Buyers, Banker and Documents.
- **Registry.** `lib/documents/registry.ts` lists 52 document types across the eight stages, with classification, audience, kind, inputs, source, formats that actually exist, status and open findings.
- **Listings.** The shared listing record holds only a code name, sector, region and revenue/growth brackets. The id no longer derives from the company name. Old rows are normalised when read.
- **Isolation.** Offers, NDA requests, deals, deal events and deal documents are readable only by their parties (migration). The data room, telemetry, calibration and buyer statistics take the tenant from the signed-in user's token.
- **Company record.** The intake records which fields the founder supplied; the rest are reported as unconfirmed. Each company has its own id.
- **Sample data.** The exit run and Autonomous Exit run on the founder's company. Founder pages show the founder's records or an empty state, with the demo example only on request. The NDA Vault and Dashboard funnel show the founder's own records. Demo-based exports carry a "sample data" banner.
- **NDA.** Each party's signature is recorded by its named signatory, and an NDA becomes active only when all required parties have signed.
- **Exports.** "PDF" buttons now read "Print…" or name the report. Downloads have correct media types and safe names, and memorandum filenames carry the code name, not the company name. The Diligence export is framed. The LOI and closing-document claims are removed.

### Files and migrations
- **Web:**
  - `src/lib/{bands,warm-intro,nda-drafts,listings,acquirer,active-company,company-intake,intake-fields,ui,deliverables,data-room,exit-api,supabase-exit-api,exit-process,telemetry,calibration,buyer-stats,social-publish,liquidity-view,module-list}.ts`
  - `src/lib/documents/{registry,gate}.ts`
  - `src/components/{DocumentGate,DemoExample,ExitProcessModal}.tsx`
  - pages: Autopilot, Banker, Buyers, Closing, Dashboard, DiligenceAI, Documents, FounderInbox, Intake, Investors, Nda, Negotiator, Pipeline, ProcessIntelligence, AcquisitionRadar, ReportHub, Wealth and others (PDF labels only)
- **Engines:** `src/memorandum/{template,types}.ts`.
- **Database:** `supabase/migrations/20261013010000_exitos_isolation.sql` (read policies, `exitos_owns_listing`, band functions, listing scrub). Its rollback is in the file header; the scrubbed listing data cannot be restored.
- **Edge functions:** `exit-doc-upload`, `exit-doc-list`, `exit-telemetry`, `exit-calibration`, `exit-buyer-stats`.
- **Tests:**
  - web: `bands`, `warm-intro`, `nda-drafts`, `data-room`, `exit-process`, `download`, `documents/registry`, plus additions to `listings`, `active-company`, `deliverables`, `exit-api` and `social-publish`;
  - engines: `memorandum.test.js`;
  - `supabase/tests/isolation/`.

### Tests run (all on the final commit)
- eslint over `src` with no warnings allowed: clean.
- `tsc -b`: clean.
- vitest: 50 files, 295 tests, all pass.
- Engine tests: 180 pass.
- Production build: passes.
- Isolation test against Postgres 16 with the real migrations: pass. Owner, buyer and stranger each read what they should, and listing rows are scrubbed.
- Homepage board and ribbon: unchanged.
- 40 console routes at 390 and 1440 px: no overflow and no errors.
- In Chromium:
  - founder-mode pages;
  - NDA signing;
  - the intake's unconfirmed-values notice;
  - the Documents gate.

**Not run:**
- Supabase Deno functions: no Deno runtime here, so they are checked by reading only.
- Migration against the live project: not applied.

### Remaining defects and limits
- **Not in effect until deployed.** The migration and five edge functions must be applied to the live project (owner action).
- **Authentication.** Sign-in is still browser-only (N-3), so roles cannot be enforced server-side; approval, counsel review and execution verification wait on real authentication.
- **Legacy listing ids.** Listings stored under the old name-derived id keep that id until their owner lists again.
- **Buyer statistics.** These are now per account. A pooled, cross-company view would need an owner decision with a privacy threshold.
- **Still on samples.** The exit run's negotiation step and the Autopilot offer comparison score demo offers (labelled) until real offers exist (D4). The NDA signing record is local to the browser (server lifecycle D4).
- **Open for D3 to D5.** D-1, D-2, D-3, B-8, B-9, B-10, C-2, C-3, C-4, C-5 and real PDF.

### Rollback
Revert the branch commits. For the database, run the policy statements in the migration header. Redeploying the previous edge functions restores the shared-tenant behaviour, which is the leak; don't.

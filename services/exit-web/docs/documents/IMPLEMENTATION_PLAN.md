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
| N-3 | S0 | (Email-link sign-in and server-held roles built `6df20979`; not live until the frontend and Auth settings are deployed.) No real authentication: any role (founder, buyer, operator in dev) is claimed in the browser. Server-side authorization of approvals, counsel review or execution verification is impossible until accounts are real. | `src/lib/auth.tsx` |
| N-4 | S1 | A saved intake is merged over `SAMPLE_INTAKE`, and the form starts from the demo figures, so editing one field saved every demo figure as the founder's. Fixed `c0a327b6` (supplied vs unconfirmed fields). | `src/lib/active-company.ts:17,36` |
| N-5 | S1 | Every company's id is `"intake"`, so nothing generated can be traced to a company. Fixed `c0a327b6`. | `src/lib/company-intake.ts:64` |
| N-6 | S1 | Telemetry and calibration write against the demo tenant id. Fixed `016abaf7`; functions deployed and verified. | `src/lib/telemetry.ts`, `calibration.ts`, `buyer-stats.ts` |

## 3. Audit findings, verified against current code

Status: **Fixed** = fixed on this branch with a test · **Open** = verified still present.

### Confidentiality and isolation (S0)

| ID | Finding | Status | Fix | Test / acceptance |
|---|---|---|---|---|
| A-1 | Introduction letter states the EV midpoint pre-NDA | Fixed `af7ef82f` | removed; figures follow under NDA | `deliverables.test.ts`: no "enterprise value" in the letter |
| A-2 | Warm-intro subject names the company and ARR | Fixed `af7ef82f` | sector + ARR band only, code moved to `lib/warm-intro.ts` | `warm-intro.test.ts` |
| A-3 | Gating document claims identity / funds verification | Fixed `af7ef82f` | rewritten as an access *policy* stating what is and is not checked | `deliverables.test.ts` |
| A-4 | All data-room uploads in one shared tenant readable by all | Fixed `fc8b8ea2`; **deployed and verified** | functions take the tenant from the user's token, refuse anon | `data-room.test.ts`; acceptance needs redeploy + a two-account check |
| N-1 | Listing rows expose private profiles | Fixed `04a7d16b`; **deployed and verified** (`ee1bef15`) | split: public row holds code + public view; private profile in an owner-only table; buyer-side matching on the public view | migration test (SQL policy assertions), listings unit tests, Radar works on public view |
| N-2 | Offers / NDA requests / deals / documents / events world-readable | Fixed `04a7d16b`; **deployed and verified** (`ee1bef15`) | RLS: readable by the buyer party and the listing owner only; documents by visibility and signed NDA | `supabase/tests/isolation/run.sh` (owner / buyer / stranger) |
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
| B-10 | Hard-coded word counts (deck 240, DD index 320) | Fixed `697e4589` | measured from content (deliverable 3) |
| B-11 | "PDF" labels on print dialogs | Relabelled `016abaf7`; real PDF built (`577b80f6`), blocked on Dispatch deployment | relabel "Print" now; real PDF via Dispatch (deliverable 3) |
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
| D-1 | Two CIMs (fixed `d8a577f5`): engine (10 sections, `.md`) vs `/report/cim` (8 sections, print) | one CIM definition; the report page becomes its preview |
| D-2 | Two closing checklists (fixed `aed608e4`): 12 items on screen vs 6 hard-coded items in `.md` | one checklist record; screen and export render the same items, owners, statuses, dates |
| D-3 | Four timelines (fixed `697e4589`): CIM signing weeks 7–10 (`template.ts:214`); deck / exec summary LOI in 4–6 weeks; outreach LOI weeks 5–6 (`deliverables.ts:554`); teaser management presentation within 10 business days | one canonical process timeline on the transaction record; every document quotes it |
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
evidence. Status: **Done** (in code, with a test) · **Partial** (started; what remains is stated) · **Not started**
(owned by the deliverable named) · **Blocked: O-n** (needs the owner action listed first). A requirement
is never marked Done because a route, button or placeholder exists.

### Dependencies on you (Owner)
These block a requirement from being complete in production. Nothing below is marked Done if it depends on one of them.

| ID | What you need to do | Unblocks |
|---|---|---|
| O-1 | Confirm deletion of the verification test data (SQL in `SECURITY_DEPLOYMENT.md`), then restore the listing read policy | 4.5 clean live state |
| O-2 | Deploy the new frontend (the deployed build is the old one; data room and telemetry fail closed on it) | 4.5, 4.6, 10.x live |
| O-3 | Supabase Auth settings: Site URL and redirect allow-list for `/console`, custom SMTP, a decision on `mailer_autoconfirm` (currently on) | 3.6, 4.6, 10.6 live; any verified session |
| O-4 | Grant approver / counsel roles to named people (SQL in `SECURITY_DEPLOYMENT.md`) | 3.6, 10.6 in use |
| O-5 | Deploy the Dispatch API and worker; rotate the `svc-exitos` secret; set `DISPATCH_API_URL`, `DISPATCH_CLIENT_ID`, `DISPATCH_CLIENT_SECRET` on `exit-dispatch-submit` | 3.7, 5.5, 11.8 in production |
| O-6 | Counsel review of any legal template before it is offered as more than an educational template | 7.5, D4 legal documents |
| O-7 | Decide on pooled buyer statistics, only with the controls in `BUYER_STATISTICS_PRIVACY.md` | pooled statistics (not enabled) |
| O-8 | Outside ExitOS on the same project: `public._imggen` has RLS disabled; leaked-password protection is off | project hygiene |
| O-9 | ~~Apply migration `20261014090000_exitos_company_stories.sql`~~ **Applied 13 Oct** (`20261013171613`) after preflight; structure verified live. See `SECURITY_DEPLOYMENT.md` | done |
| O-12 | Run the post-deployment self-test on the live project: apply `20261014090100_exitos_company_stories_selftest.sql`, then `select public.exitos_selftest_company_stories();`. Expect `SELFTEST PASS (0 failed of 25 …)`. Steps and rollback behaviour are in `SECURITY_DEPLOYMENT.md`. **The security verification item stays open until this passes and the evidence is recorded** | live behavioural verification of story access and isolation |
| O-14 | Confirm the configured backup schedule, retention, and PITR status and window in the Supabase Dashboard (WAL archiving alone does not establish them) | recovery procedure for the story tables |
| O-13 | Authorise reviewers deliberately (owner decision). Nobody is authorised by default. For each reviewer: identify them, verify their professional qualification and scope, then authorise for that competence only (`exitos_authorize_reviewer`, with name and professional role). The company then engages them. The administrator cannot verify claims or authorise themselves (enforced and tested). No reviewer is authorised today | any "independently verified" figure |
| O-10 | ~~Decide who may verify~~ **Decided 14 Oct:** only an authorised professional reviewer, engaged by the company, within their competence, with recorded evidence. Founder, ExitOS checks, counsel outside scope and administrators cannot verify. Implemented `5ea9f90e`, `bc2cd4fe` | done |
| O-11 | If price guidance is ever to be given: approve a separate, counsel-reviewed price-guidance document and who may send it | A.5 |

### §1 Assignment
| # | Requirement | Where | Owning | Status | Evidence |
|---|---|---|---|---|---|
| 1.1 | Read the audit; inspect generators, routes, schemas, data, exports, states, tests | §1–3 of this plan | D1 | Done | this document |
| 1.2 | Treat findings as claims to verify against current code | §3 status column | D1 | Done | each row re-checked on this branch |
| 1.3 | Rebuild the architecture, not more templates or a new Documents page | `src/lib/documents/*`, `supabase/migrations/20261013140000_*` | D3 | Partial: registry, gate, service, versions, workflow, consistency exist; 6 of 52 types go through the service | §9 below |
| 1.4 | Work in the existing app; no demo, duplicate system or prototype | changes in `exit-web`/`exit-engines`/`supabase` only; Dispatch reused | all | Ongoing | `boardcheck` each increment |

### §2 Authoritative inventory
| # | Requirement | Where | Owning | Status | Evidence |
|---|---|---|---|---|---|
| 2.1 | Machine-readable registry over all eight stages | `src/lib/documents/registry.ts` (52 types), `registryJson()` | D2 | Done | `registry.test.ts` |
| 2.2 | Per type: id, stage, audience, method, source, inputs, classification, kind, formats, export behaviour, review/execution, dependencies, defects, status | registry fields; template version `TEMPLATE_VERSION` in the service | D2/D3 | Partial: per-type schema version and typed input schemas not yet | `registry.test.ts` |
| 2.3 | Human-readable report | this plan + audit doc | D1 | Done | — |
| 2.4 | Inventory both CIMs, both checklists, the four timelines, dead code, every sample-data output | registry, §3 | D1 | Done | registry + §3 |
| 2.5 | Say what to consolidate, reuse, repair or retire | §3 (D-1, D-2, D-5) | D1 | Done | — |

### §3 Architecture
| # | Requirement | Where | Owning | Status | Evidence |
|---|---|---|---|---|---|
| 3.1 | Document registry, one definition per type | `registry.ts`; service binds type → DDM family | D3 | Partial: 6 types bound to the generation service (5 memoranda, board memo) | `service.test.ts` |
| 3.2 | Transaction context (company, transaction, buyer, seller, offer, process) | company id `co-<uuid>`; canonical timeline `exit-engines/src/process/timeline.ts` | D3/D4 | Partial: company + process timeline; no transaction record yet (parties, offers on the server) | `timeline.test.js`, `active-company.test.ts` |
| 3.3 | Input validation (fields, types, units, currency, dates, provenance) | intake supplied/unconfirmed; company story with per-figure provenance (`exit-engines story/story.ts`); `provenanceIssues`, `cleanStory` | D3/D4 | Partial: provenance and completeness rules done; typed per-document input schemas for the other 45 types not yet | `story.test.js`, `company-story.test.ts`, `capability.test.ts` |
| 3.4 | Deterministic generation from validated inputs and approved templates | `documents/service.ts` → DDM v1 | D3 | Partial (6 types) | `service.test.ts` (Dispatch validator, engine, renderers) |
| 3.5 | Immutable versions with source refs, time, history, content hash, input snapshot | `exitos_document_versions` (live), `store.ts` | D3 | Done for the 6 types (code + live migration) | `supabase/tests/documents`, `store.test.ts` |
| 3.6 | Review workflow: draft → review → counsel → approval → supersession | `exitos_document_action()` (live), `DocumentVersions.tsx` | D3 | Done in code and deployed; **in use: Owner O-2, O-3, O-4** | `supabase/tests/documents/scenario.sql`; live rolled-back check |
| 3.7 | Genuine PDF and structured exports | `exit-dispatch-submit` v8 (live), Dispatch renderer | D3 | **Blocked: Owner O-5.** PDF proven against Dispatch's real renderer in tests only | `service.test.ts` (pdftotext); live `configured:false` |
| 3.8 | Consistency engine | `documents/consistency.ts` | D3 | Partial: figures, valuation, timeline, closing items, names, currency, concentration; offers/NDA/post-closing checks need D4/D5 records; no "intentional difference" note yet | `consistency.test.ts` |
| 3.9 | Audit trail (generated, viewed, downloaded, changed, approved, superseded) | `exitos_document_events` | D3 | Partial: generated, downloaded, review actions, rendered_pdf, superseded; "viewed" not logged | `supabase/tests/documents` |
| 3.10 | Stable type ids and explicit schema versions | registry ids, `REGISTRY_SCHEMA_VERSION`, `TEMPLATE_VERSION` on each version | D3 | Done | `service.test.ts` |
| 3.11 | Existing conventions; no second source of truth | `exitos_*` tables, local fallback in `store.ts` only without a session | all | Ongoing | — |

### §4 Confidentiality and integrity (release-blocking)
Security deployment is reported separately in `SECURITY_DEPLOYMENT.md`. "Done" here means done in code with a test; the live column says what is deployed and verified.

| # | Requirement | Owning | Code | Live | Evidence |
|---|---|---|---|---|---|
| 4.1 | No EV midpoint in the introduction letter pre-NDA | D2 | Done | needs O-2 | `deliverables.test.ts` |
| 4.2 | No company name / ARR in the warm-intro subject | D2 | Done | needs O-2 | `warm-intro.test.ts` |
| 4.3 | No unsupported verification / signature / access claims | D2/D3 | Done for current outputs; approval labelled "not executed" | needs O-2 | `deliverables.test.ts`, `capability.test.ts` |
| 4.4 | No demo company, `Project Cipher`, inferred values or demo offers in real-company outputs | D2/D4 | Partial: inferred profile values are no longer stated or scored anywhere (audit, D4); the exit run's negotiation step and Autopilot offer comparison still score labelled demo offers | needs O-2 | `quality.test.ts` (provenance), `story.test.js` (readiness), `consistency.test.ts` |
| 4.5 | Tenant isolation for company, transaction, files, documents | D2/D3 | Done for listings, exchange rows, data room, document versions | **deployed and verified**; test data cleanup O-1 | `supabase/tests/isolation`, `supabase/tests/documents`, `SECURITY_DEPLOYMENT.md` |
| 4.6 | Server-side authorization for generation, retrieval, export, approval, access | D3 | Done for versions, review actions, PDF bridge, data room; roles server-held | deployed; usable after O-2, O-3 | as above |
| 4.7 | No leak through filenames, subjects, metadata, logs, public URLs | D2/D3 | Done for current exports; versions carry code name as owning body for pre-NDA types | needs O-2 | `listings.test.ts`, `service.test.ts` |
| 4.8 | Classifications and pre-generation disclosure checks | D2 | Done; the service refuses a withheld document | — | `registry.test.ts`, `service.test.ts` |
| 4.9 | Missing input → validation error or explicit draft; never sample fallback | D3/D4 | Done for memoranda: each CIM section states its gap; readiness, Exit Score and diligence mark unsupplied inputs "not assessed"; typed validation for other types not yet | — | `quality.test.ts`, `story.test.js` |
| 4.10 | Regression test per known leak and sample-data defect | all | Partial: every fixed item has one | — | §11 |

### §5 One professional document system
| # | Requirement | Owning | Status | Evidence |
|---|---|---|---|---|
| 5.1 | One CIM generator with validated sections | D3/D4 | Done: one evidence-driven CIM (`memorandum/cim.ts`) rendered by `/report/cim`, Documents, Banker, Marketplace and Autonomous Exit through `memorandumInputs` | `quality.test.ts` |
| 5.2 | One closing checklist; screen and export identical | D3 | Done: `closing-checklist.ts` | `closing-checklist.test.ts`, `consistency.test.ts` |
| 5.3 | Measured word counts and claims | D3 | Done (B-10) | `timeline.test.js` |
| 5.4 | Design system: covers, classification, version/status/date, page numbers, headers/footers, notices, safe filenames | D3 | Partial: provided by Dispatch's layout for the 6 bound types; other exports still Markdown/print | `service.test.ts` |
| 5.5 | Genuine PDF; print never presented as PDF | D3 | Print relabelled (Done); genuine PDF **Blocked: O-5** | — |
| 5.6 | Correct MIME types, filenames, extensions | D2 | Done | `download.test.ts` |
| 5.7 | Distinct layouts per family | D3 | Partial: memorandum, checklist, diligence, board memo; legal-draft and statement layouts D4/D5 | `ddm.ts` |

### §6 Missing M&A workflow
| # | Requirement | Owning | Status |
|---|---|---|---|
| 6A | Process letter, bid instructions, IOI request and criteria, presentation and diligence instructions | D4 | Not started |
| 6B.1–6B.5 | Structured IOI; LOI / term sheet; exclusivity draft; counter-offer from the real offer (B-8); offer comparison from real bids (B-3) | D4 | Not started |
| 6C | SPA preparation, disclosure schedules, approvals and consents, escrow, funds flow, closing statement, bring-down, closing cap table, filings, announcements | D5 | Not started (closing checklist items exist, D3) |
| 6D | Post-closing obligations register | D5 | Not started |

### §7 Legal and compliance boundaries
| # | Requirement | Owning | Status |
|---|---|---|---|
| 7.1 | Educational template · founder draft · requires counsel · counsel-reviewed · executed (verified) | D3/D4 | Partial: `requires_counsel` enforced before approval; "counsel reviewed" is a recorded action by a counsel grant; execution states D4 |
| 7.2 | No claim of compliance, enforceability, execution or approval without evidence | all | Ongoing: approved is labelled "not executed"; a status change never marks execution |
| 7.3 | Jurisdiction, governing law, structure, parties as explicit inputs | D4 | Partial |
| 7.4 | No universal negotiation positions (B-9) | D4 | Not started |
| 7.5 | Versioned clause library, counsel review before production | D4 | Not started; **Owner O-6** |

### §8 NDA execution and data-room access
| # | Requirement | Owning | Status |
|---|---|---|---|
| 8.1 | Explicit states; never active through a flag | D4 | Partial: local per-party signatures; "Mark executed" (C-2) still open |
| 8.2 | Signature evidence, identity, timestamps, version, countersignature | D4 | Partial |
| 8.3 | Server-enforced, auditable data-room access; requested / approved / provisioned / revoked | D2/D4 | Partial: tenant isolation deployed; request/approval states D4 |
| 8.4 | A file satisfies only its company, transaction, artifact type and review state (C-4) | D4 | Not started |

### §9 Cross-document consistency
| # | Requirement | Owning | Status | Evidence |
|---|---|---|---|---|
| 9.1 | Checks across documents | D3/D5 | Partial: name and code name, demo contamination, ARR, revenue, growth, margins, NRR, valuation midpoint and range, currency, timeline milestones, closing items, undisclosed concentration. Not yet: equity value/consideration, buyer/seller identities, offer terms, NDA permissions, post-closing dates (need D4/D5 records) | `consistency.test.ts` |
| 9.2 | One canonical timeline; milestones derived; contradictions flagged | D3 | Done | `timeline.test.js`, `consistency.test.ts` |
| 9.3 | Findings with severity, documents, values; documented intentional differences | D3/D5 | Partial: severity, document, found, expected shown on Documents; intentional-difference notes not yet | — |

### §10 Document experience
| # | Requirement | Owning | Status |
|---|---|---|---|
| 10.1 | Browse by stage and audience | D3 | Not yet (registry has the data; workspace still lists five kinds) |
| 10.2 | Generated vs user input vs external | D3 | Partial: capability shows "Supplied externally" / "Not built" from the registry |
| 10.3 | Missing inputs and disclosure restrictions before generating | D2/D3/D4 | Done on Documents (gate + CIM completeness and gaps), Buyers, Banker, Company Story (provenance issues) |
| 10.4 | Preview before export | D3 | Partial: on-screen view; DDM HTML preview not wired |
| 10.5 | Compare versions | D3 | Partial: list with hashes and dates; no diff view |
| 10.6 | Review, approval, signature, execution tracked separately | D3/D4 | Partial: review/approval done (server); signature/execution D4; **in use: O-2–O-4** |
| 10.7 | Dependencies and outstanding actions | D3 | Not yet |
| 10.8 | Correct version; drafts never confused with executed documents | D3 | Partial: version number, status and hash on every row; DDM stamped draft |
| 10.9 | Export only when authorised and valid | D3 | Partial: blocked on disclosure; PDF only for the owner's own hash-checked version |
| 10.10 | Capability status per document | D3 | Partial: `capability.ts` on Documents (8 states + sample); not yet on every page |

### §11 Tests and release gates
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 11.1 | Per document type and required inputs | Partial (6 service types + pre-NDA types) | `service.test.ts`, `registry.test.ts` |
| 11.2 | Real-company data propagation | Done for memoranda and the story (two-company sample pack); other generators partial | `quality.test.ts`, `consistency.test.ts`, `exit-process.test.ts` |
| 11.3 | No unintended sample data or inferred facts | Done for memoranda, readiness, diligence findings; demo offers remain labelled | `quality.test.ts` (provenance:assumed-stated), `story.test.js` |
| 11.4 | Pre-NDA disclosure prevention | Done for current generators | `registry.test.ts`, `service.test.ts` |
| 11.5 | Tenant isolation and server authorization | Done for deployed scope | `supabase/tests/{isolation,documents}`, live checks |
| 11.6 | NDA transitions and evidence | Partial | `nda-drafts.test.ts` |
| 11.7 | Data-room completeness and permissions | Not started (D4) | — |
| 11.8 | PDF rendering, pagination, file types | Done against the real renderer locally, inspected with pdftotext/pdfinfo on every test run; production **O-5** | `quality.test.ts` (rendered), `service.test.ts`, `download.test.ts` |
| 11.9 | UI / Markdown / PDF agreement | Done for the sample pack: every heading and table row checked in the Markdown, the HTML preview and the PDF | `rendered.ts`, `quality.test.ts` |
| 11.10 | Cross-document financial and timeline consistency | Done for the checks in 9.1 | `consistency.test.ts` |
| 11.11 | Draft / review / approval / execution distinctions | Partial (execution D4) | `supabase/tests/documents`, `capability.test.ts` |
| 11.12 | Post-closing obligations | Not started (D5) | — |
| 11.13 | Lint, type-check, unit, integration, build each increment | Every increment | §8, §9 |

### D4 (owner's decisions of 13–14 October): professional CIM and evidence-based intake
| # | Requirement | Where | Owning | Status | Evidence |
|---|---|---|---|---|---|
| A.1 | No enterprise value or valuation range in the buyer-facing CIM | `memorandum/template.ts`, `cim.ts`, `pages/ReportCIM.tsx` | D4 | Done (also the executive summary, deck, teaser and Management Presentation) | `memorandum.test.js`, `deliverables.test.ts`, `quality.test.ts` |
| A.2 | Valuation kept in the seller valuation report, negotiation and board materials | `report-model.ts`, `report-docs.ts:buildBoardMemo` | D4 | Done | `quality.test.ts` (board memo keeps it) |
| A.3 | Financial performance, revenue composition, margins, concentration and growth retained, qualified by source | `cim.ts` sections 5, 7, 9 and the source notes | D4 | Done | `quality.test.ts` |
| A.4 | Valuation functionality not removed | valuation engines and reports unchanged | D4 | Done | engine tests |
| A.5 | Price guidance only through a separate, authorised document | registry `exitos.price_guidance` (not built) | D4 | **Not built, by owner decision:** needs separate explicit approval and review by qualified M&A counsel (**O-11**) | registry |
| A.6 | Tests for indirect leakage: executive summaries, metadata, embedded tables, appendices, PDFs | `gate.ts` (seller_intelligence), `rendered.ts` | D4 | Done | `quality.test.ts` (metadata/appendix leak, PDF text), `gate.ts` |
| B.1–B.8 | Intake sections: history; products; customers; market; management; capitalisation; financial history and forecasts; sources | `story/story.ts`, `story-form.ts`, `pages/CompanyStory.tsx` | D4 | Done in code | `story.test.js`, `company-story.test.ts`, `story-form.test.ts`, browser check |
| B.progressive | Progressive, resumable, optional sections, partial completion, completion indicators, never blocked | Company Story page (autosave; per-section status; `storyCompleteness`) | D4 | Done (browser); server table deployed; live behavioural check **O-12** | browser flow, `story.test.js` |
| B.provenance | Founder-supplied / source-supported / verified / estimated / missing, preserved into documents | `FactMeta`, `effectiveProvenance`, CIM basis column and source notes | D4 | Done | `story.test.js`, `supabase/tests/stories` |
| B.verification | Independent verification by an authorised reviewer only. Each record holds the claim and value, reviewer, role, competence, evidence (with a snapshot of any cited document), scope, limitations, timestamp, expiry and revalidation trigger. It lapses when the value or evidence changes, on expiry, or on withdrawal | migration `20261014090000` (authorisations, engagements, verifications, `exitos_record_verification`), `story.ts` `applyVerifications`/`verificationState`, Company Story reviewers panel, `/console/reviews`, CIM verification appendix | D4 | Done in code; **deployed, structure verified live**; behavioural self-test on live pending (**O-12**); no reviewer authorised yet (**O-13**) | `story.test.js`, `verifications.test.ts`, `supabase/tests/stories` (scenario and self-test) |
| C.1 | No market size from revenue × constant, headcount from revenue, fixed cap table, invented ranking, retention, growth or history | `CompanyProfile.assumed`, `isKnown`, templates, readiness, Exit Score, diligence, Claude inputs | D4 | Done across all generators found by the audit | `quality.test.ts`, `story.test.js` |
| C.2 | Calculations only with explicit method and inputs, labelled | ARR per customer "(calculated)", Rule of 40 with its inputs | D4 | Done | sample pack |
| C.3 | Gaps stated professionally (what, why, what completes it) | `cim.ts` `gap()` | D4 | Done | `quality.test.ts` (coverage:gap-unstated) |
| C.4 | One canonical context for every path, Autonomous Exit included | `loadActiveCompany` + `memorandumInputs` (story, assumed) | D4 | Done (Documents, Banker, print CIM, Management Presentation, Marketplace, Autonomous Exit) | `exit-process.test.ts`, browser |
| D.1 | Professional CIM structure, expanding with available evidence | `cim.ts` (14 sections + appendix) | D4 | Done | sample pack: 97% supported (full story) / 33% (headline only) |
| D.2 | No filler; completeness against purpose and available information | coverage rule replaces word count | D4 | Done | `quality.test.ts` |
| D.3 | No seller-only material in the buyer CIM | gate + tests | D4 | Done | `quality.test.ts`, `gate.ts` |
| E.1 | `npm run docs:samples` reproducible | `package.json`, `quality.test.ts` | D4 | Done (two companies, 14 documents) | — |
| E.2 | Gate checks (consistency; unsupported facts and periods; leakage; seller-only content; placeholders; superlatives; completeness; tables, pagination, layout; state and metadata; preview = PDF) | `quality.ts`, `rendered.ts`, `consistency.ts`, `gate.ts` | D4 | Done; filename and export type covered by `download.test.ts` | `quality.test.ts` |
| E.3 | PDF inspection, not text-only; a lost table fails | `rendered.ts` with pdftotext/pdfinfo | D4 | Done | `quality.test.ts` (lost-table test) |
| E.4 | Two independent gates (A integrity, B communication and rendering), both required | `quality.ts` `gateOf`, `scored` | D4 | Done | `quality.test.ts` ("a perfect text score cannot offset…") |
| E.5 | Regression test for every new defect; human review kept separate | `quality.test.ts` "the review itself" | D4 | Done for every defect in §10; human visual review recorded in `QUALITY_LOOP.md` | — |

### §12 Delivery
| # | Requirement | Status |
|---|---|---|
| 12.1 | D1 plan | Done |
| 12.2 | D2 confidentiality, sample data, isolation | Done in code; **deployed and verified** (`SECURITY_DEPLOYMENT.md`); cleanup O-1, frontend O-2 |
| 12.3 | D3 registry, generation service, templates, versions, exports | Partial (§9 report): service, versions, workflow, one CIM/checklist/timeline, consistency done; PDF blocked on O-5; 46 types not yet on the service |
| 12.4 | D4 (revised by the owner): professional CIM and evidence-based intake | Accepted for code review (not production-ready). Story migration deployed and structure verified; live behavioural self-test O-12; production PDFs blocked on Dispatch deployment |
| 12.4b | D5 transaction documents, NDA lifecycle, data room (was D4) | Not started |
| 12.5 | D6 signing/closing, post-closing, end-to-end (was D5) | Not started |
| 12.6 | Per-increment reports | §8, §9 |
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

## 9. Increment report — deliverable 3 (generation service, versions, one CIM / checklist / timeline, consistency)

Branch `claude/document-integrity-p0`, commits `697e4589` … `78b94bb6` plus this report. Security deployment is
reported separately in `SECURITY_DEPLOYMENT.md`; nothing here depends on it being declared secure.

### Behaviour changed
- **One process timeline** (`exit-engines/src/process/timeline.ts`). Every document quotes it: the CIM, the
  executive summary, the deck, the teaser, the outreach plan and the closing checklist. Word counts are measured,
  not fixed numbers (D-3, B-10).
- **One closing checklist** (`lib/closing-checklist.ts`). The Closing page and the export use the same 12 items,
  with the same owners, statuses and timing. Statuses are labelled as tracking notes, not evidence of execution (D-2).
- **One CIM.** `/report/cim`, the Document Generator and the Banker all render the engine CIM from the same inputs
  (`memorandumInputs`) (D-1).
- **Generation service** (`lib/documents/service.ts`). Each document becomes a Dispatch DDM v1 document, and each
  version records:
  - the registry schema and template versions;
  - an input snapshot and its hash, and a content hash;
  - the inputs that are still demo values, and the disclosure findings.

  The service refuses any document the gate withholds.
- **Stored versions and review** (`exitos_document_versions`, `exitos_document_events`, `exitos_document_action`,
  all live).
  - Versions are immutable and owned by their creator.
  - Review status changes only through the server function. It checks the caller's server-held grant, requires
    a second person to approve, and requires counsel review first when the type needs it.
  - Approval is labelled "not executed".
- **PDF** (`exit-dispatch-submit` v8, live).
  - The browser sends only a version id. The function loads it under the caller's own permissions and checks the
    content hash. It uses only the dedicated `svc-exitos` client, whose credentials live in function secrets, and
    refuses `svc-a`.
  - It reports `configured:false` until Dispatch is deployed. **No production PDF exists yet.**
- **Documents workspace.** The download button became a versions panel: save, download (logged), version list with
  hashes, review actions shown only to roles the server accepts, and PDF. Each document carries a capability status:
  - not built, supplied externally, blocked, sample company;
  - needs inputs, available, draft;
  - awaiting review, approved (not executed).
- **Cross-document consistency** (`lib/documents/consistency.ts`). Every document for the company is checked
  together against:
  - the company's figures, the canonical valuation (midpoint and range) and the timeline;
  - the closing items, the name or code name, demo-company contamination, the currency, and an undisclosed
    material concentration.

  It found a real omission: the CIM and the executive summary did not disclose a 40% top-10 customer
  concentration. Both now state it.
- **Authentication** (`6df20979`). Supabase email-link sign-in with verified sessions and server-held roles. No
  anonymous sign-up. The fake SSO and password-reset paths are removed.

### Files and migrations
- **Web:**
  - `src/lib/documents/{service,ddm,store,remote,capability,consistency,memorandum-inputs}.ts`
  - `src/lib/{closing-checklist,process-plan,email-auth,auth,exit-api,supabase-auth,dispatch-client,dispatch-ddm,engines}.ts`
  - `src/components/DocumentVersions.tsx`
  - pages: `Documents`, `Closing`, `ReportCIM`, `ReportHub`, `Banker`, `SignIn`, `App`
- **Engines:** `src/process/timeline.ts`, `src/memorandum/template.ts`
- **Database:** `20261013130000_exitos_auth_roles.sql`, `20261013140000_exitos_document_versions.sql` (both applied
  live). Rollback is in `SECURITY_DEPLOYMENT.md`.
- **Function:** `exit-dispatch-submit` (v8).
- **Tests:**
  - `service`, `store`, `capability`, `consistency`, `closing-checklist`, `email-auth`
  - `timeline.test.js`
  - `supabase/tests/documents/`, plus role checks in `supabase/tests/isolation/`

### Tests run (final commit)
| Check | Result |
|---|---|
| eslint (`--max-warnings 0`) | clean |
| `tsc -b` | clean |
| vitest | 56 files, 334 tests passed, 1 skipped (pre-existing) |
| Engine tests | 185 passed |
| Production build | passes |
| SQL isolation test (Postgres 16, real migrations) | pass |
| SQL documents test (Postgres 16, real migrations) | pass |
| Dispatch validator, layout engine, Markdown/HTML renderers and Chromium PDF on generated versions | pass |
| Homepage board and ribbon | unchanged |
| 40 console routes at 390 and 1440 px | no overflow, no errors |
| Chromium: versions panel | save, re-save without duplicate, download, sample labelling, consistency section |

**Not run:**
- Deno functions: no runtime here, so they were checked live through `pg_net` instead.
- A real PDF in production: blocked on O-5.

### Remaining defects and limits
- 46 of 52 document types are not yet on the generation service. The closing checklist export is still Markdown
  outside the service.
- No transaction record: parties and offers are not yet on the server (D4).
- Still open:
  - version diff view;
  - DDM HTML preview in the workspace;
  - browse by stage and audience;
  - typed per-document input schemas;
  - intentional-difference notes on consistency findings;
  - "viewed" audit events.
- C-2, C-3, C-4, B-8 and B-9 are open (D4).

### Rollback
- Revert the commits.
- Database: see `SECURITY_DEPLOYMENT.md` → Rollback. Dropping the document tables loses stored versions; export
  them first.

## 10. Increment report — deliverable 4 (professional CIM and evidence-based intake)

Commits `323e7cfe`, `eb6a57dc`, `273f7220` and this one, on `claude/document-integrity-p0`. Production deployment and security status are reported separately in `SECURITY_DEPLOYMENT.md`; nothing here is deployed.

### CIM valuation policy (A)
- **Valuation removed from buyer documents.** The CIM, executive summary, investor deck, teaser and Management Presentation state no enterprise value, range, premium, buyer universe or buyer probabilities. The teaser's "who it suits" section is gone.
- **Print CIM.** It renders only the engine CIM, its tables, and two exhibits: market indexes and the timeline. The valuation charts and buyer charts are removed.
- **Management Presentation.** It was the worst leak: EV, range, premium, buyer ranking and readiness uplift, plus an invitation to offer "at or above" the valuation. It is now rebuilt from the buyer-safe deck.
- **Gate rule.** The disclosure gate withholds any buyer-audience document that carries the valuation figure, price guidance, buyer targeting or readiness advice.
- **Valuation kept where it belongs.** It stays in the valuation report and the board memorandum.
- **Price guidance** is registered as a separate, counsel-reviewed document (not built; O-11).

### Intake fields and provenance rules (B)
- **Story sections** (`story/story.ts`, Company Story page):
  - history: origin, milestones, ownership changes;
  - products: description, use, pricing, revenue share with basis, differentiation, roadmap;
  - revenue streams;
  - customers: segments, anonymised profiles, contract terms, gross retention and churn with basis, case studies with an approval flag;
  - sales and marketing;
  - market: target markets, geographies, market-size estimates, competitors;
  - operations, technology and IP;
  - leadership: biographies, roles and responsibilities, founder flag; headcount by function and date; structure;
  - shareholders: type, class, shares, % fully diluted; option pool, instruments, fully diluted shares, date and basis;
  - annual financials: period, period end, revenue, ARR, gross margin, EBITDA, each with basis; forecasts with their basis; definitions;
  - growth opportunities, risks with mitigations, source documents;
  - the basis of each headline intake figure.
- **Provenance.** Each material figure is one of:
  - supplied by the Company;
  - supported by an attached source (rejected if the document is not attached);
  - independently verified (only with a recorded verification; the page never offers it and the database refuses it from owners);
  - estimated (only with its method);
  - missing.
- **Market sizes** are stated only with geography, period, methodology, and a source or a documented estimate. **Forecasts** are stated only with their basis.
- **Progressive.** Every section is optional, autosaves, and shows its completion ("not started / partly done / complete") and what it still lacks. Incomplete rows are kept in the intake and dropped from documents (`cleanStory`).
- **Storage.** In the browser, or for signed-in accounts in the new owner-only table `exitos_company_stories` (O-9).

### Documents and generation paths audited (C)
An agent swept every generator and page. Fixed:
- **Templates.** Market size, headcount, cap table, competitive position, architecture, bench, gross retention and customer growth are no longer stated when not supplied. The invented prior-year ARR table is gone.
- **Readiness engine.** Unsupplied inputs are skipped. Dimensions with none are "not assessed" and excluded from the score. The TAM weakness that fired on revenue × 200 is gone.
- **Exit Score categories.** Categories resting on unsupplied inputs are "not assessed", unpriced and uncounted.
- **Diligence findings.** They no longer say "founders … hold 40%", the bench or headcount, or regulatory risk the company never gave. The diligence report no longer claims its findings came from documents it read.
- **Other pages and generators:**
  - data-room architecture item;
  - Readiness page labels;
  - Claude generator inputs;
  - Marketplace memo;
  - briefing sector;
  - wealth plan proceeds;
  - board memo basis (it now names the assumed model inputs).
- **One context.** Every memorandum path (Documents, Banker, print CIM, Management Presentation, Marketplace, Autonomous Exit) goes through `loadActiveCompany` and `memorandumInputs` with the story. The profile itself carries its `assumed` list, so engines cannot mistake a neutral value for a fact.

### CIM structure (D)
- **Sections:**
  - important notice;
  - executive summary and highlights;
  - history;
  - products;
  - business model and revenue composition;
  - market and competition;
  - customers, concentration and retention;
  - sales and marketing;
  - financial history and forecasts;
  - operations, technology and IP;
  - management;
  - ownership;
  - growth opportunities;
  - risks;
  - process;
  - appendix of source notes.
- **Evidence or gap.** Each section is written from evidence or states its gap: what, why, what completes it.
- **Highlights** state strengths only; weaknesses are in the risks section.
- **Results.** Full story: 2,064 words, 97% supported. Headline intake only: 1,391 words, 33% supported, every gap stated. No filler was added to reach a length.

### Quality rules and regression tests (E)
- **Gate A (integrity)** covers:
  - consistency;
  - disclosure and seller-only leaks in the model, metadata, tables and every rendering;
  - placeholders;
  - document state and PDF metadata;
  - `provenance:assumed-stated`;
  - `provenance:invented-period`.
- **Gate B (communication and rendering)** covers:
  - phrasing and claims;
  - coverage: each section written or its gap stated;
  - `table-dense` and `table-empty-column`;
  - headings and table rows (line-aware, cell by cell) and captions in the Markdown, the HTML preview and the PDF (pdftotext and pdfinfo).
- **Both gates must pass.** A perfect text score cannot offset a failed PDF inspection (tested).
- **Regression tests** (`quality.test.ts`, `story.test.js`, `gate.ts`) cover each defect found:
  - lost table;
  - metadata or appendix leak;
  - valuation in the executive summary, deck and teaser PDFs;
  - assumed headcount, cap table and market size;
  - invented FY;
  - dense table;
  - empty column;
  - weakness listed as a highlight;
  - half-filled rows;
  - readiness scoring of assumed inputs;
  - self-verification refused (SQL).

### Sample pack and PDF inspection
- **Two fictional companies, 14 documents.** All pass both gates.
- **Problems the PDF inspection and visual review found and fixed:**
  - checklist cells wrapping mid-value ("by weeks 8–" / "10"): Dispatch's renderer now keeps short values on one line;
  - a six-column market table unreadable on the page: now five columns, with notes for the method;
  - an empty Description column;
  - loss-making and below-threshold Rule of 40 listed as highlights.
- **A checker defect.** The first PDF check reported wrapped tables as lost; it now reads row blocks.

### Files and migrations
- **Engines:**
  - `src/story/{story,index}.ts`
  - `src/memorandum/{cim,template,types,prose,claude,index}.ts`
  - `src/readiness/{engine,improvements}.ts`
  - `src/diligence/engine.ts`, `src/valuation/{engine,institutional}.ts`, `src/types.ts`, `src/index.ts`
  - tests: `test/story.test.js`, `test/memorandum.test.js`
- **Web:**
  - `src/lib/{company-story,story-form,company-intake,active-company,exit-readiness-ai,deal-context,diligence-intel,briefing,deliverables,report-docs,report-ui,exit-process}.ts`
  - `src/lib/documents/{gate,quality,rendered,consistency,ddm,service,memorandum-inputs,sample-pack,sample-story,registry}.ts`
  - pages: `CompanyStory` (new), `Documents`, `Readiness`, `ReportCIM`, `ReportManagement`, `ReportDiligence`, `Marketplace`
  - `components/{ExitProcessModal,MorningBriefing}.tsx`, `App.tsx`, `lib/access.ts`, `lib/page-guide.ts`
  - tests: `company-story.test.ts`, `story-form.test.ts`, `quality.test.ts`
- **Dispatch:** `packages/ddm-schema/src/render-{html,md}.mjs` (no corporate scheme prefix; headings kept with content; short cells not wrapped) and `services/shared/src/render-docx.mjs`.
- **Database:** `20261014090000_exitos_company_stories.sql` plus `supabase/tests/stories/`. Not applied live (O-9). Rollback is in the file header.

### Tests run (final commit)
| Check | Result |
|---|---|
| eslint, `tsc -b`, production build | clean |
| vitest | 59 files, 362 passed, 1 skipped |
| Engine tests | 193 |
| SQL tests (Postgres 16) | isolation, documents and stories: pass |
| Dispatch renderer tests | pass (one Dispatch engine test fails on the untouched base, as before) |
| Homepage board and ribbon | unchanged |
| 41 console routes at 390 and 1440 px | no overflow, no errors |
| Browser, founder flow | Company Story autosave and reload; unsourced estimate flagged and not stated; CIM gaps; Readiness "not assessed"; diligence findings without assumed values |

### Remaining defects and production dependencies
- **Server storage.** The company story is stored on the server only after O-9. Verification needs a process (O-10).
- **Coverage of document types.** 45 document types are still not on the generation service; their typed input schemas are not built.
- **Deliverable 5 not started:** transaction documents, NDA lifecycle, data-room tagging. Demo offers still drive the exit run's negotiation step and the Autopilot offer comparison (labelled).
- **Uploads.** Source documents are listed, not uploaded through the story page. Linking them to data-room files is by id only.
- **Production.** PDF in production still needs Dispatch deployed (O-5). The frontend is not deployed (O-2).

### Rollback
- Revert the commits.
- Database: drop the trigger, function and table named in the migration header (the migration is not applied live).

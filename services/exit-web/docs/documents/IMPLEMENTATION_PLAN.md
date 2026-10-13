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
| N-4 | S1 | A saved intake is merged over `SAMPLE_INTAKE`, so any field the founder did not enter silently takes the demo company's value. | `src/lib/active-company.ts:17,36` |
| N-5 | S1 | Every company's id is `"intake"`, so nothing generated can be traced to a company. | `src/lib/company-intake.ts:64` |
| N-6 | S1 | Telemetry and calibration write against the demo tenant id. | `src/lib/telemetry.ts`, `calibration.ts`, `buyer-stats.ts` |

## 3. Audit findings, verified against current code

Status: **Fixed** = fixed on this branch with a test · **Open** = verified still present.

### Confidentiality and isolation (S0)

| ID | Finding | Status | Fix | Test / acceptance |
|---|---|---|---|---|
| A-1 | Introduction letter states the EV midpoint pre-NDA | Fixed `af7ef82f` | removed; figures follow under NDA | `deliverables.test.ts`: no "enterprise value" in the letter |
| A-2 | Warm-intro subject names the company and ARR | Fixed `af7ef82f` | sector + ARR band only, code moved to `lib/warm-intro.ts` | `warm-intro.test.ts` |
| A-3 | Gating document claims identity / funds verification | Fixed `af7ef82f` | rewritten as an access *policy* stating what is and is not checked | `deliverables.test.ts` |
| A-4 | All data-room uploads in one shared tenant readable by all | Fixed in code `fc8b8ea2`; **not deployed** | functions take the tenant from the user's token, refuse anon | `data-room.test.ts`; acceptance needs redeploy + a two-account check |
| N-1 | Listing rows expose private profiles | Open | split: public row holds code + public view; private profile in an owner-only table; buyer-side matching on the public view | migration test (SQL policy assertions), listings unit tests, Radar works on public view |
| N-2 | Offers / NDA requests / deals / documents / events world-readable | Open | RLS: readable by the buyer party and the listing owner only; documents by visibility and signed NDA | `supabase/tests/isolation/run.sh` (owner / buyer / stranger) |
| A-5 | Radar says identity is revealed on signature; Inbox says never | Open | one statement, from the disclosure policy (below) | copy test on both pages |
| A-6 | DiligenceAI `.md` exports have no confidentiality header | Open | route through the shared frame (later: the registry renderer) | export test |
| A-7 | Filenames and metadata could carry the company name (`docFilename` slugs the title) | Open | safe filenames from document type + project code + version, never the company name for pre-NDA classes | filename test per classification |

### False claims and sample data (S1)

| ID | Finding | Status | Fix / acceptance |
|---|---|---|---|
| B-1 | Autopilot claims (teaser written, rooms provisioned, disclosure schedule) | Fixed `16c7c68e` | claims match what runs |
| B-2 | Seller diligence report always on `SAMPLE_COMPANY` | Fixed `16c7c68e` | runs on the active company |
| B-3 | Offer comparison and closing checklist `.md` from demo data, unlabelled | Fixed (labelled) `16c7c68e` | banner + "sample basis"; replaced by real records in deliverable 4 |
| B-4 | Wealth plan claims state-tax / QSBS modelling | Fixed `16c7c68e` | states the flat 23.8% rate |
| B-5 | Exit run (CIM, teaser, NDAs, listing) always on `SAMPLE_COMPANY` | Fixed `137a1a77` | runs on the active company |
| B-6 | Teaser / CIM "tier-one jurisdiction" | Fixed `969663f0` | jurisdiction omitted when anonymised |
| B-7 | Negotiator, Investors, Wealth, Pipeline, Process Intelligence show demo offers / cap table to a founder with a saved intake | Open (labelled) | with a saved intake: show the founder's records or an empty state; demo data only in demo mode |
| B-8 | Counter-offer draft always for the demo company | Open (labelled) | generated from a recorded offer (deliverable 4) |
| B-9 | Fixed negotiating positions (4% break fee, 10% cap, 8% escrow) | Open | deal-specific, configurable, flagged for review (deliverable 4) |
| B-10 | Hard-coded word counts (deck 240, DD index 320) | Open | measured from content (deliverable 3) |
| B-11 | "PDF" labels on print dialogs | Open | relabel "Print" now; real PDF via Dispatch (deliverable 3) |
| B-12 | Module list advertises LOIs; "Generate closing docs" links to a page without them | Open | remove the claims now; restore when built |
| B-13 | `.md` / `.csv` / `.ics` saved as `text/plain` | Open | correct MIME types (`text/markdown`, `text/csv`, `text/calendar`) |
| B-14 | Banker on-screen teaser drops bullets | Open | render through the shared preview |

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

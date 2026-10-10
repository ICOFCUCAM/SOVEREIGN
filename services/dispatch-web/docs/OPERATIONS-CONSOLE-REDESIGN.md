# Operations Console Redesign — delivery report

Scope: the **Operations** product of `services/dispatch-web` (`/console/*`). The
uploaded preview `public/sovereign-dispatch-preview(2).html` was used as the visual
template (navy ground, seal mark, tenant card, top line, workbar, mast + hero,
lifecycle strip, footer). It is a **static prototype** with no data; it is kept
unchanged. The real React application was redesigned in place, against the real
API.

Administration (`/admin`), Executive Evaluation (`/evaluate`) and Platform
Operations (`/operator`) remain separate products. Administration shares the shell
and therefore inherits the new chrome and the re-tokenised shared primitives in
`lib/ui.tsx`; its page content is unchanged.

---

## 1. Baseline (before any change)

| Check | Result |
|---|---|
| `npm run build` (tsc -b + vite) | Pass |
| `eslint src` | 21 errors, 3 warnings — all in `brand.tsx`, `HeroCanvas.tsx`, `WebhooksCard.tsx`, `Access.tsx` (outside the Operations console) |
| Frontend unit/e2e tests | None exist in `dispatch-web` |
| Backend integration tests (`services/test`, run against a local Postgres 16 + API + worker) | 23 of 24 files pass; `epic7-docx` 16/17 (see Defects D4). Three files need special setup (worker paused / Chromium disabled / clearance enforcement) and pass with it |

## 2. Design direction

Three concepts were evaluated against the same preservation rules:

| Concept | Idea | Strength | Weakness | Verdict |
|---|---|---|---|---|
| A · **Registry** (chosen) | Dark navy workspace, graphite panels, one wayfinding blue, muted gold reserved for seals/certificates/evidence; serif only for record titles | Matches the uploaded template and the existing brand; makes official records and certificates visually distinct from operational chrome | Dark-only (no light theme) | **Selected** |
| B · Paper ledger | Light "official paper" theme, black type, red/blue rule lines | Strong print/record metaphor | Breaks continuity with the existing dark brand and the template; large migration of Administration | Rejected |
| C · Terminal | Maximal density, monospace everywhere, keyboard-first | Bloomberg-grade density | Hostile to occasional institutional users; poor for long-form record reading | Rejected — its density ideas (sortable dense register, compact mode, keyboard nav) were folded into A |

## 3. Design system (implemented in source)

* **Tokens** — `tailwind.config.ts` `sd.*` colours; scoped CSS in `src/index.css` under `.sd-console` (focus ring, skip link, dense tables, skeletons, certificate frame, reduced-motion, forced-colors).
* **Contrast** — every text token measured: `text3 #8d9bb0` ≥ 5.75:1 on every console surface; `faint #7f8ea3` ≥ 4.5:1 on bg/panel and used only for non-essential labels. The template's dimmer greys (`#68788d`, `#43546a`) fail AA and were not adopted.
* **Components** — `src/components/console/ds.tsx`: `PageHeader`, `Section`, `Panel`, `Button` (primary / secondary / ghost / approve / warn / danger, loading state), `Badge`, `LifecycleStatus` (label + glyph + tooltip meaning per state), `ClassificationMark`, `Metric`, `Fact`, `EvidenceValue` (full digest + copy + what it attests), `CopyButton`, `Alert`, `EmptyState`, `Skeleton(Rows)`, `FormField`, `Segmented`, `Kbd`, `ConfirmDialog` (native modal `<dialog>`), `useDensity`, `useHotkeys`.
* `src/components/console/governance.tsx`: `ChainOfAuthority` (shared by Review and the record file).
* `src/components/console/icons.tsx`: one 20×20 / 1.5-stroke inline icon set.
* `src/lib/format.ts`: one implementation of record number, waiting time, dates, sizes, actor names (previously duplicated in three files).

## 4. Route → component inventory and preservation matrix

All routes are from `App.tsx` (`Operations`). Scope gating is unchanged (nav items
still filter on the same scopes; the API remains the authority on every call).

### `/console` — Command centre (`pages/Dashboard.tsx`, `components/OfficeHome.tsx`)
| Original element | Redesign | Status |
|---|---|---|
| Masthead (date, "Evaluated hh:mm · live", Inst. ref) | PageHeader meta; "live" removed (it was a fetch time, not a live feed) + a real **Refresh** | Preserved, wording corrected |
| Office home (institution, name/office, department, Acting, Service credential, other offices, Today count, queue rows with waiting + Decide/Publish, "view all") | Same data, denser rows, record type added | Preserved |
| First-run panel (3 steps, Create CTA if `dispatch:render`) | Same | Preserved |
| Governance status (verdict, 3 signals, "N ready for your publication" if `dispatch:publish`) | Same logic; unknown state now says no result is asserted | Preserved |
| Lifecycle (5 stages + returned note) | 5 stages + **off-path cells for Rejected and Draft**; every cell links to the filtered register | Preserved + corrected (see C1) |
| Queues: Awaiting approval (`dispatch:approve`), Ready for publication, "Returned for revision" | Same; third queue truthfully titled **Rejected**; new **Draft** queue (where Return lands) | Corrected |
| The record: Published, Preserved | Same | Preserved |
| Ledger: official records, governance certificates, preserved, evidence events | Same values; "hash-stamped" → "recorded to the append-only trail" (not every event carries a digest) | Wording corrected |
| Recent activity (`dispatch:audit`) | Table rows with absolute time, actor, link to record | Preserved |
| Error banner | `Alert` + Try again | Preserved |
| Counts were silently capped at 100 | Shown as `100+` when the page limit is hit | Corrected |

### `/console/create` — Create official record (`pages/Create.tsx`, `components/GovernanceInstrument.tsx`)
| Original | Redesign | Status |
|---|---|---|
| 27 record types with field specs (unchanged `DOC_TYPES`) | Radio group (keyboard-operable) + type filter | Preserved |
| Classification (UNCLASSIFIED / OFFICIAL / OFFICIAL-SENSITIVE / CONFIDENTIAL) | Labelled select + marking + AI-availability note | Preserved |
| Policy resolution (type + level-specific beats type-wide) | Unchanged logic; loading state added | Preserved |
| Governance instrument (procedure, chain, publisher, artifacts, "what the institution will hold") | Same content, restyled; "Cryptographic proof" → "SHA-256 integrity proof" | Preserved, wording corrected |
| Title + per-type fields, kind hints | Proper `<label for>`; required marking; per-field error after an attempt; server validation errors mapped to fields where `field` matches | Preserved + improved |
| AI assist (Develop/Polish/Restructure/Shorten; Replace/Insert/Discard; disabled for SENSITIVE+) | Same; `aria-live` results; buttons moved outside the `<label>` (was invalid nesting) | Preserved |
| Outputs pdf/docx/md, ≥1 required | Real checkboxes | Preserved |
| Validate / Submit, missing list, 402 → upgrade modal, idempotency key, analytics events | Same calls and events; Submit is never sent while sections or format are missing (button explains instead of silently disabling) | Preserved |
| Technical payload toggle | Same | Preserved |
| Changing type silently erased authored sections | **Confirmation dialog** before clearing | Defect fixed |
| Usage banner / upgrade modal | Same | Preserved |

### `/console/review` — Governance review (`pages/Review.tsx`)
| Original | Redesign | Status |
|---|---|---|
| Inbox (`GET /v1/approvals?state=pending`), classification, title, awaiting authority, type, age | Same + submitter, precise waiting time, client-side filter, j/k navigation | Preserved |
| Panel: class, version, "Deciding as", title, type, submitted by/at, open full document | Same + record number, **governing policy, next & publication authority, chain of authority** (from existing `GET /v1/documents/:id`) | Preserved + context |
| Lifecycle "your decision advances" strip | Replaced by an explicit consequence statement per decision | Changed (clearer) |
| Optional comment | "Decision rationale" (still optional) | Preserved |
| Approve / Return / Reject → `decide(id, d, comment, ["pdf"])` | Same call. Return and Reject now **confirm first**, stating the engine's actual consequence | Preserved + confirmation |
| Success "Decision recorded: approve → x (a/r approvals)" | Plain-language success; quorum shown only when the engine reports one (chained policies report 0/0) | Corrected |
| Self-approval prohibition text | Kept; plus an informational warning when the submitter matches the session subject (the API still decides) | Preserved |

### `/console/library` and `/console/archives` — Official records / Preservation (`pages/Library.tsx`)
| Original | Redesign | Status |
|---|---|---|
| Card list: class, record no., title, type, policy+version, status chip, adaptive facts (authority, next, waiting, stage, publication authority, published, retention) | Dense **sortable table** (desktop/tablet) and stacked cards (mobile) carrying the same facts; comfortable/compact density | Preserved |
| State filter (all, in_review, approved, rendered, published, withdrawn, archived, rejected) | Same + `draft`; filters and search are now **in the URL** (shareable, linkable from Command) | Preserved + extended |
| Server search by title (`q`), limit 200 | Same; limit notice when reached | Preserved |
| `fixedState="archived"` Archives variant with its own title/blurb | Same | Preserved |
| Loading / empty / error | Skeleton, filtered-vs-empty distinction, retry | Improved |

### `/console/documents/:id` — Record file (`pages/DocumentView.tsx`)
| Original | Redesign | Status |
|---|---|---|
| Record number / publicId, classification, "Publicly verifiable ↗", title, type, created by + office, 5-stage procession | Certificate-framed record header with copyable number | Preserved |
| Publish (as authority) / Preserve / Withdraw (scope + lifecycle gated), Preserved seal | Same gating; **every act confirms first** with its real consequence (Preserve flagged irreversible); success message after the API succeeds; read-only explanation when the user lacks `dispatch:publish` | Preserved + confirmation |
| Governance standing (status, policy, current/next/publication authority, waiting/submitted) | Same + approval authority | Preserved |
| Chain of authority (+ rejected banner) | Shared component | Preserved |
| Governance certificate (result, policy+version, publication authority, separation of duties, required vs actual chain, approval sequence with delegation, delegations used, integrity proof, certifying statement) | All present; required-vs-actual as a table; **publishedBy and recordId now shown** (were in the API model, never displayed) | Preserved + completed |
| Preservation certificate (sealed time, record, policy, record hash, integrity proof, published, archived, review chain, approval authority, recorded approvals, statement) | All present + version, lifecycle at sealing, publication authority, approval **clearance** (in model, never displayed). Record number now uses the official public ID when allocated (previously contradicted the header) | Preserved + corrected |
| Render job (status, progress, 1.5 s polling), artifacts (format, size, pages, sha256 prefix, Download via grant, 402 → upgrade) | Same polling and grant flow; **full** artifact SHA-256 with copy; role & classification; **render failure** shows the job's error code/message (was never shown); warnings count | Preserved + completed |
| Versions (no., DDM version, age), created/updated/correlation | Same + template, template version, engine version (in model, never shown) | Preserved + completed |
| — | Record identity panel: document ID, public ID, engine status, published/preserved timestamps, **preservation SHA-256** (in model, never shown) | Added (existing data) |
| Provenance trail (`dispatch:audit`) | Same + digest marker + link to the filtered evidence chain | Preserved |
| Load error / loading | 404 explained without disclosing existence; skeleton | Improved |

### `/console/audit` — Evidence chain (`pages/Audit.tsx`)
| Original | Redesign | Status |
|---|---|---|
| Action + target filters, limit 300, count | Same (URL-backed, action suggestions from loaded events, Clear) | Preserved |
| Table: timestamp, actor (type), action, document, evidence id, integrity | Same columns + expandable row with **every field** the API returns (request ID, correlation ID, classification, full IDs and digest were never shown) | Preserved + completed |
| Integrity column said **"Verified"** when an event merely carried a digest | Now **"Digest recorded"**; explanatory note on what a digest proves | Overclaim removed |

### `/console/polished` — Document studio (`pages/polished/Polished.tsx`)
Previously routed but **absent from navigation**; now in the rail. Same
`VITE_POLISHED_PAGES_URL` behaviour; states whether the address is configured
and that availability is not checked; clarifies these documents are not
official records.

### Shell (`components/Shell.tsx`) — shared by Operations and Administration
Preserved: variant-specific navigation, scope filtering, product switcher rule,
quota meter + upgrade, subject, tenant, sign out, home. Added: mobile drawer (the
fixed 240 px rail previously made the console unusable below ~700 px), skip link,
breadcrumb, real session-expiry countdown, focus moved to content on navigation,
`g`+digit and `?` shortcuts (Operations only, never while typing). The Home
link is now a client-side link — a full page load drops the in-memory session.

## 5. Verification

Environment: local Postgres 16, `dispatch-api` and `dispatch-worker` from this
repo, a "Ministry of Finance" tenant created through the API (15 records across
draft, in review, rejected, rendered, published, withdrawn, preserved), console
served by Vite; Chromium via Playwright.

| Gate | Result |
|---|---|
| `tsc -b` | Pass |
| `vite build` | Pass |
| ESLint | 21 errors / 3 warnings — identical to baseline, none in changed files |
| Routes × widths (1440 / 900 / 390): 14 views incl. every lifecycle state, review with a selected record, expanded audit row, unknown record | All render; **no horizontal page overflow; no JavaScript errors** (only the deliberate 404 for the unknown-record test) |
| axe-core 4 (WCAG 2.0/2.1/2.2 A+AA + best practice), desktop, all 14 views | **0 violations** after fixes (first pass found: nested interactive, dl structure, heading order, label/name mismatch, target size, missing h1, landmarks — all fixed) |
| Keyboard | Skip link, visible focus ring, modal dialogs (Esc cancels, focus returns), radio-group record types, `j/k` queue + register, `/` search, `g n` navigation; shortcuts disabled in fields and dialogs |
| Reduced motion | All animation/transition disabled under `prefers-reduced-motion` |
| Stale-state bug found during verification | Navigating record→record requested the previous record's certificates with the new id (API 409). Fixed (state reset per id) |

Not verified: screen-reader walkthrough with NVDA/JAWS/VoiceOver; Safari/Firefox;
200–400 % zoom beyond the 390 px reflow; light-mode (none exists); a real
auditor-role person session (see D1). WCAG conformance is **not** claimed — axe
covers only automatable checks.

## 6. Defects found (outside the redesign's remit — reported, not changed)

| # | Defect | Evidence | Suggested fix |
|---|---|---|---|
| D1 | Service credentials holding `dispatch:audit` always receive **zero** audit events: RLS policy `audit_read` (M7) admits only roles `auditor`/`tenant_admin`, but service principals have role `service`. Stats still count 87 events. | `GET /v1/audit` → `{"events":[]}` for a service token with audit scope | Decide policy: either admit `service` with `dispatch:audit` in `audit_read`, or stop issuing the scope to service clients |
| D2 | Server posture `institutionalStatus("rejected")` returns "Returned for revision", while a Return decision moves the record to `draft`. Pinned by `test/posture.test.mjs`. | `shared/src/governance.mjs:252` | Change to "Rejected" (and the test). The console already labels truthfully |
| D3 | `GET /v1/documents` (list) does not return `public_id`, so the register can only show the id-derived reference, which differs from the official record ID shown on the record file | `server.mjs` list query | Add `publicId` to the list response (additive) |
| D4 | DOCX rendering is not deterministic across renders in one process (TOC bookmark ids `_Toc1` vs `_Toc8`) | `epic7-docx` "deterministic document.xml" 16/17 | Reset the bookmark counter per render |
| D6 | A malformed record id (e.g. `/v1/documents/undefined`) returns **500** rather than 400/404 | Live API, final verification | Validate the UUID before querying. The console shows a recoverable "could not be loaded" state |
| D5 | `GET /v1/approvals` lists all in-review records to any approver, not only those at the caller's step; deciding out of turn is refused by the API (`STEP_NOT_OPEN`) | Live data | Optionally filter server-side; the console now marks "Your step" rows (from `/v1/governance/my-authority`) and can isolate them |

## 7. Optimisation series (50 commits after the redesign)

Each commit was typechecked and linted before committing (helper refuses to commit
on failure); browser verification was re-run at commits 25, 47 and 50 and two
regressions it found were fixed in-series (commits 48–49).

 1. Create: stop describing every evidence event as hash-stamped
 2. Command: count withdrawn records as their own off-path state
 3. Shell: keep Official records highlighted inside a record file
 4. Shell: warn two minutes before the session token expires
 5. Create: confirm before a reload or tab close discards authored sections
 6. Create: show how each section will be composed (items, events, words)
 7. Review: select the next record after a decision is recorded
 8. Review: mark and isolate records at the reviewer's own step
 9. Command: Refresh also reloads the office queue
10. Command: re-evaluate when the operator returns to the tab
11. Command: placeholder while the office home loads
12. Command: action queues list the longest-waiting records first
13. Register: sort from the column headers
14. Register: keep the sort order in the URL
15. Register: flag retention horizons that have ended or end within 30 days
16. Register: highlight the search term in matching titles
17. Record file: title the browser tab with the record number and title
18. Record file: print layout and Print action
19. Record file: printed copies state their provenance and omit controls
20. Auth: end the session explicitly when expired or rejected, and say why
21. Shell: proper focus management for the mobile navigation drawer
22. Shell: announce client-side navigation to screen readers
23. Dialogs: clicking the backdrop cancels (never while an action is in flight)
24. Copy buttons: clear their feedback timer on unmount and on repeat copies
25. Upgrade modal: real modal dialog semantics, readable contrast
26. Create: Submit no longer claims to be disabled while it explains what is missing
27. Evidence chain: narrow the loaded events instantly
28. Evidence chain: day separators in the event table
29. Record file: copy a link to the record file
30. Record file: governance standing wraps cleanly on phones
31. Metrics: group thousands in ledger figures
32. Create: discard open AI suggestions when the classification becomes sensitive
33. Create: keyboard-complete the record type filter
34. Review: 'o' opens the selected record's full file
35. Register: Escape clears the search, a second Escape leaves the field
36. Shell: mobile browser chrome matches the console
37. Shell: show which permissions the session carries
38. Provenance: event counts on the record file, digest markers in recent activity
39. Evidence chain: label who acted — person, service credential or engine
40. Register: show last update per row; hide the density switch where it does nothing
41. Evidence chain: copy any identifier from an expanded event
42. Review: rationale length, linked hint, and Escape to clear filter
43. Billing: quota meter and usage banner on console tokens, exposed as a meter
44. Console: scrollbars in the console palette
45. Workflow links: from a record in review to the decision queue, and from an empty queue to publication
46. Create: state that an unsubmitted draft exists only in this tab
47. Docs: console README lists the actual routes, design system and shortcuts
48. Shell: return focus to the menu button after the drawer closes
49. Shell: after navigating from the mobile drawer, focus lands on the new page
50. Docs: optimisation log and final verification (this section)

### Final verification (after commit 49, live API)

| Gate | Result |
|---|---|
| `vite build` / `tsc -b` | Pass |
| ESLint | 21 errors / 3 warnings — identical to baseline; all in files not touched |
| 14 views × 3 widths (42) | No horizontal overflow; no JavaScript errors (only the deliberate 404 of the unknown-record test) |
| axe-core, 14 desktop views | 0 violations |
| Workflow checks against the live API (approve, auto-advance, return-confirm cancel, self-approval refused by API and surfaced, create → validate → submit, publish with confirmation → certificate issued, preserve warns terminal, no page errors) | 18 / 18 pass |
| Keyboard & session checks (`g`+digit, `/`, `j`, Enter, nav highlight in record file, 401 → sign-in with reason, drawer focus in/out, focus after drawer navigation) | 9 / 9 pass |
| Print (record file → A4 PDF) | 4 pages, chrome hidden, certificates intact |

Not exercised: the 15-minute natural expiry (the 401 path was simulated), real
SSO person sessions, screen readers, non-Chromium browsers.

## 8. Limitations register

* Dark theme only (print renders dark-on-white).
* Counts on Command are per-state pages of ≤100 (shown as "100+"), not server totals; the Ledger's totals come from `/v1/stats`.
* Register sorting is client-side over the loaded page (≤200).
* The self-submission warning in Review compares display subjects and is informational; separation of duties is enforced only by the API.
* The uploaded HTML template is a static prototype and is not wired to anything.
* Administration pages were not redesigned (only shell + shared primitives).

## 9. Preview

```bash
# backend (local): see DISPATCH-TURNON.md for production; locally any Postgres with db/migrate.mjs
cd services/dispatch-web && npm install && npm run dev   # http://127.0.0.1:5174/console (proxies /v1 → 127.0.0.1:8787)
```
Sign in with "Sign in with a service credential". Tokens last 15 minutes.

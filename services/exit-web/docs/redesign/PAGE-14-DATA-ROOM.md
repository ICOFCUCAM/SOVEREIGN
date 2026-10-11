# ExitOS redesign · Page 14 — Data Room

| | |
|---|---|
| Route | `/console/data-room` |
| Component | `src/pages/DataRoom.tsx` (313 lines) + `lib/data-room.ts` |
| NAV | "Data Room", founder, **Preparation or Active Mandate** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `7455dda`)

### Purpose
The founder's virtual data room: the diligence engine's required artifacts per package (financial, legal, security …), real uploads to Supabase storage, completeness per package, a dollar "value at risk" for missing artifacts, a risk scan and each package's sections and questions.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Packages, required artifacts, sections, questions, red flags | `DILIGENCE = runDueDiligence(SAMPLE_COMPANY)` | Engine, demo company unlabelled |
| **Uploads and the document list** | `exit-doc-upload` / `exit-doc-list` edge functions, **always `tenantId = DEMO_TENANT_ID`** with the public anon key | **Real files in production storage, in one tenant shared by every user** — see X12 |
| Completeness | files uploaded to a package ÷ its required-artifact count (any file counts) | Rule, not stated |
| "Value at risk −$X", "est. impact" | value × fixed package weight (financial 6 %, legal 5 %, security 4 %, technical/commercial 3 %, market/user growth 2 %) × missing count | **Invented weights, unlabelled** |
| "Due Diligence AI · risk scan" | engine red flags; category picked by keyword | Rule-based, called "AI" |
| "Confidential pkgs — ring-1 access" | a Tailwind class name leaked into the copy | Mislabel (no access tier exists) |
| Classification pills (confidential / sensitive) on uploads | stored field | Implies protection the storage does not give (X12) |
| Banker's take "ExitOS … prices the dollar impact of each gap" | — | Overclaim on a fixed-weight heuristic |
| Tape | registry snapshot | Fake live (pinging) |

### X12 — Shared data-room tenant (security) — documented, UI mitigation in G1, backend NOT changed
`lib/data-room.ts` sends every upload and list request with `tenantId = "00000000-0000-0000-0000-000000000099"` and the public anon key. `supabase/functions/exit-doc-list` uses the service role, filters only by that `tenantId` and returns **every document with a one-hour signed download URL**; its header says "Auth: anon JWT (demo); tightens to founder-tenant JWT in production" — that tightening is not implemented. Consequence: **any visitor of the app can list and download every file any founder uploaded here.** Fixing it needs per-founder tenants and authenticated edge functions — a backend change and deployment, outside this console redesign and needing the owner's decision. Existing stored files were not inspected, changed or deleted.

### Baseline
Preparation: `h1` none · axe 0 · **overflow at 390** · 0 errors · list call fails in the test harness (functions stubbed) and shows the raw error "list failed: 200". Free: Upgrade page.

## Gap register — Page 14
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Uploads land in a shared tenant visible to every user; the page implies confidentiality** (X12). | Warning panel above the uploader stating exactly who can see uploads; upload stays disabled until the founder ticks an acknowledgement; classification pills say "label only". Backend unchanged (X12 for the owner). | ☐ |
| G2 | **Invented "value at risk" weights.** | Label as a rule with the weights shown; "illustrative" not "at risk". | ☐ |
| G3 | Mislabels: "Due Diligence AI" (rule-based), "ring-1 access", completeness rule unstated, raw list error. | "Diligence risk scan (rule-based)"; drop "ring-1 access"; state the completeness rule; plain error text. | ☐ |
| G4 | Demo company unlabelled. | Engine specs, red flags and value on `loadActiveCompany()`; badge. | ☐ |
| G5 | Fake live tape. | `RegistryTape`. | ☐ |
| G6 | Design: no `h1`, overflow at 390, old primitives. | Rebuild on `xo`. | ☑ `27888d1` |

---

## Closure log

### G6 — Design
*Closed by:* `pages/DataRoom.tsx` rebuilt on `xo` (`PageHeader` `h1` with Refresh and Upload as header actions, the hidden file input labelled; four metrics; errors in a `role="alert"` box; banker's take as a page-local definition list (shared `BankerTake` no longer used here); risk scan as a list; packages as a `nav` of buttons with `aria-current`; the active package as a labelled `section` with `h2`/`h3`/`h4`; long filenames wrap). Content carried over verbatim; G1–G5 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation 1440/390: 0 errors, `h1` 1 (was 0), **no overflow** (was overflowing at 390), axe 0, all tab stops with visible focus.

# ExitOS redesign · Page 14 — Data Room

| | |
|---|---|
| Route | `/console/data-room` |
| Component | `src/pages/DataRoom.tsx` (313 lines) + `lib/data-room.ts` |
| NAV | "Data Room", founder, **Preparation or Active Mandate** |
| Status | All six gaps closed; X12 (shared tenant) open for the owner. Part of the all-pages run; reviewed together at the end. |

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
| G1 | **Uploads land in a shared tenant visible to every user; the page implies confidentiality** (X12). | Warning panel above the uploader stating exactly who can see uploads; upload stays disabled until the founder ticks an acknowledgement; classification pills say "label only". Backend unchanged (X12 for the owner). | ☑ `ec30f99` |
| G2 | **Invented "value at risk" weights.** | Label as a rule with the weights shown; "illustrative" not "at risk". | ☑ `2a1b6bd` |
| G3 | Mislabels: "Due Diligence AI" (rule-based), "ring-1 access", completeness rule unstated, raw list error. | "Diligence risk scan (rule-based)"; drop "ring-1 access"; state the completeness rule; plain error text. | ☑ `5b74542` |
| G4 | Demo company unlabelled. | Engine specs, red flags and value on `loadActiveCompany()`; badge. | ☑ `1ab2210` |
| G5 | Fake live tape. | `RegistryTape`. | ☑ `4c98b2d` |
| G6 | Design: no `h1`, overflow at 390, old primitives. | Rebuild on `xo`. | ☑ `27888d1` |

---

## Closure log

### G6 — Design
*Closed by:* `pages/DataRoom.tsx` rebuilt on `xo` (`PageHeader` `h1` with Refresh and Upload as header actions, the hidden file input labelled; four metrics; errors in a `role="alert"` box; banker's take as a page-local definition list (shared `BankerTake` no longer used here); risk scan as a list; packages as a `nav` of buttons with `aria-current`; the active package as a labelled `section` with `h2`/`h3`/`h4`; long filenames wrap). Content carried over verbatim; G1–G5 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation 1440/390: 0 errors, `h1` 1 (was 0), **no overflow** (was overflowing at 390), axe 0, all tab stops with visible focus.

### G1 — Uploads land in a shared tenant; the page implied confidentiality (UI mitigation for X12)
*Closed by:* `pages/DataRoom.tsx`. A **"Shared storage — read before uploading"** panel above the room: "Files uploaded here are stored in a single demo workspace in ExitOS storage. Anyone using this app can list and download them. Per-founder access control is not built yet, and the confidential / sensitive labels do not restrict access. Do not upload confidential documents." Both upload buttons and the file input stay **disabled until the founder ticks** "I understand that anything I upload here is visible to every ExitOS user." (buttons point to the panel via `aria-describedby`). Upload classifications read "… (label only)". The upload and list calls, the backend and stored files are unchanged — X12 stays open for the owner.
*Verification:* `tsc -b`, eslint clean · Chromium (Preparation, functions stubbed — **no real upload was sent**): before the tick Upload and the file input are disabled; after it Upload is enabled and choosing a file issues one (stubbed) upload call · 1440/390: 0 errors, axe 0, no overflow.

### G2 — Invented "value at risk" weights
*Closed by:* `pages/DataRoom.tsx` (labels and a foot; the rule itself unchanged). "Value at risk — while gaps stay open" → **"Illustrative discount — fixed-weight rule, see below"**; "est. impact" → "illustrative impact"; banker's take "… at risk" → "… illustrative discount while gaps stay open (rule)"; "ExitOS … prices the dollar impact of each gap" → "applies a fixed-weight rule to show what each gap could cost. The rule is not measured from buyer behaviour." The foot prints the rule and the **weights each package actually receives**, generated from the code: Financial 6 %, Market 2 %, User & growth 2 %, Technical architecture 2 %, Security 4 %, Legal 5 %, Commercial 3 %.
*Finding (not changed):* `PKG_IMPACT_WEIGHT` lists `technical: 0.03`, but the package kind is `technical_architecture`, so it falls back to 2 %. The page now shows the effective 2 %; the mismatch is left for the owner since the weights themselves are a product choice.
*Verification:* `tsc -b`, eslint clean · Chromium: weights line as above; 0 "Value at risk" / "est. impact" / "prices the dollar".

### G3 — Mislabels
*Closed by:* `pages/DataRoom.tsx` (text only).
| Before | After |
|---|---|
| "Due Diligence AI · risk scan" | "Diligence risk scan · rule-based" — "Engine red flags, grouped by keyword" |
| "Confidential pkgs — ring-1 access" (a CSS class in the copy) | "— engine classification" |
| completeness rule unstated | under the package list: "files uploaded to a package ÷ its required artifacts, capped at 100% — any file counts. The missing list matches required filenames." |
| raw errors "list failed: 200" / "upload failed" | "Could not load the uploaded documents (…). The engine checklist below still applies." / "The upload did not complete (…). Nothing was added." |
*Verification:* `tsc -b`, eslint clean · Chromium (list stubbed to fail): new error text shown; 0 "Due Diligence AI" / "ring-1" · Preparation 1440/390: 0 errors, axe 0, no overflow.

### G4 — Demo company unlabelled
*Closed by:* `pages/DataRoom.tsx` — the engine checklist and red flags (`runDueDiligence`) and the value behind the illustrative discount (`canonicalValuationFor(company).headline.mid`) run on `loadActiveCompany()`; `missingImpactUsd` takes the value as a parameter (same rule). Eyebrow names the source, **Demo data / Your intake** badge. Uploads still go to the shared demo tenant (G1 / X12). `pages/Intake.tsx` lists "Data Room (checklist)".
*Verification:* `tsc -b`, eslint clean · Chromium (no uploads listed): demo → DEMO DATA, illustrative discount −$75,080,073; intake "Northwind Analytics" → YOUR INTAKE, −$294,562,149 · 0 errors.
*Observation:* with nothing uploaded the rule sums to about 73 % of enterprise value (weight × count of missing artifacts, per package, uncapped). It is labelled as an illustrative rule, but the size of the number is a product issue for the owner (recalibrate or cap).

### G5 — Fake live tape
*Closed by:* `pages/DataRoom.tsx`: pinging `MarketTape` → dated `RegistryTape`.
*Verification:* Chromium: 0 "live" words, 0 pinging elements, snapshot date shown · free (Upgrade page), Preparation and Active Mandate 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus.

---

## Final verification
`tsc -b` pass · eslint 0 errors · `vitest` 204/204 · Chromium Preparation and Active Mandate 1440/390: 0 errors, `h1` 1, no overflow (was overflowing), axe 0, all tab stops with visible focus · free: Upgrade page · upload gate checked with stubbed functions (no real upload sent) · personalisation demo vs intake.

## Known issues
- **X12 (security, open):** uploads go to one shared demo tenant that anyone can list and download; the page now says so and requires acknowledgement, but per-founder storage and authenticated edge functions are needed. Owner decision.
- The illustrative-discount rule is uncapped (≈ 73 % of value with an empty room) and the `technical` weight key does not match `technical_architecture`.
- The real upload and list round-trip against production storage was not exercised (functions stubbed in tests) — NOT VERIFIED.

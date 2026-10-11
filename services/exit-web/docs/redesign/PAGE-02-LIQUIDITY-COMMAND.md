# ExitOS redesign · Page 02 — Liquidity Command

| | |
|---|---|
| Route | `/console/command` (route policy `/console`, the same as the Terminal) |
| Component | `src/pages/Dashboard.tsx` (358 lines) |
| NAV | "Liquidity Command", group Mandate, role **founder**, no plan gate. Free plan renders `BuyerInterestGate` above it. |
| Status | Stage A audit — gaps documented below; each is closed in its own commit and marked here. |

Process rule (unchanged from Page 01): **document a gap → close it → verify → mark it closed**, one at a time.

---

## Stage A — Audit of the original (baseline commit `6455b73`)

### Purpose and user
The founder's position on one screen: what the company is worth now and after fixes, how likely a sale is, who is circling, the process stage, and the next instruction. It is also where the founder starts the **Exit Process** run.

### Components and sharing
| Component | Used by | Consequence |
|---|---|---|
| `CommandTiles` (Founder Liquidity Board) | Dashboard **and** Commander (Page 05) | Do not restyle in place. |
| `ExitCommander` (Morning Briefing) | Dashboard **and** Commander | Do not restyle in place. |
| `commanderMetrics()` | Dashboard, Commander, `CommanderBlocks` (+ test) | Calculation unchanged; may be parameterised with the current behaviour as default. |
| `DashboardModules` (liquidity, matches, heat map, scenarios, funnel) | Dashboard only | Can be replaced on this page. |
| `JourneyMap` | Dashboard only | Can be replaced on this page. |
| `ExitProcessModal` + `lib/exit-process.ts` | Dashboard only | The run flow must be preserved. |

### Data flow (traced; demo company Helios Freight)
| Figure on page | Source | Nature | Value |
|---|---|---|---|
| Company, sector, ARR, jurisdiction | `SAMPLE_COMPANY` (always) | **Demo fixture** — never the founder's intake | Helios Freight |
| Enterprise value / board / briefing / "Sell today" | `strategicBuyerReport(SAMPLE_COMPANY).headline.mid` via `deal-context` | Model (strategic-buyer report) | **$108,252,000** |
| Terminal's enterprise value (Page 01) | `runInstitutionalValuation` | Model (institutional framework, "canonical" per `lib/engines.ts`) | **$102.8M** |
| Expected value / Expected outcome chip / "Optimize 6 months" | `READINESS_ANALYSIS.projectedStrategicMid` | Model (after 3 priced fixes) | $166,708,080 |
| "Optimize 12 months" | `POTENTIAL_VALUE_USD × 1.27` | **Hard-coded multiplier**, unlabelled | $211.7M |
| Close probability | `0.35·ExitScore + 0.40·min(1, active/6) + 0.25·leverage` (`commander-metrics.ts`) | **Heuristic index**, labelled "likelihood of a completed transaction" | 84% |
| Confidence | `min(92, 64 + 3·activeBuyers + 12·leverage)` | **Heuristic index**, capped at 92 | 92% (Terminal: 89%) |
| Market liquidity | `min(98, 70 + 4·activeBuyers)` | **Heuristic index**, labelled as a market measure | 98 / 100 |
| Active buyers / demand | `deal-context` over curated registry (31 buyers) | Model | 8 · High |
| Time to liquidity | median `expectedDaysToCash` / 30 | Model | 2.6 mo |
| Qualifying buyers | `runBuyerDiscovery(..., { limit: 12 }).candidates.length` | **The top-12 cap**, not a count of qualifying buyers | 12 |
| Implied price | `BUYERS.companyHeadlineUsd` (engine default when no price passed) | Model input | **$186M** next to EV $108M |
| Top buyers table + caption "sector × check × geography × activity" | `BUYERS.candidates` | Engine is a **weighted sum** of six fits (sector .25, history .22, check .20, activity .15, model .10, geography .08) — caption wrong | — |
| Readiness 46/100, band, dimensions; improvement plan | `READINESS`, `READINESS_ANALYSIS` | Model | 46 · Seed acquisition · 3 fixes |
| Valuation reports (standard / strategic / replacement) | `VALUATION_*` | Model | $72.2M / $108.3M / $63.7M mid |
| Critical diligence questions, red flags | `DILIGENCE` | Model | 0 / 0 |
| Top mandate matches | `LISTING_MATCHES` (matching engine on the sample listing) | Model on demo listing | 15 matches |
| Heat map | geographies of `DEAL_BUYERS` | Model | — |
| Deal funnel: Registry mandates / Matched / **Under NDA / Offers in hand / Leading bid** | `MARKET.buyers`, `LISTING_MATCHES`, **`SAMPLE_NDAS`, `SAMPLE_OFFERS`**, `OFFER_COMPARISON` | Last three are **demo fixtures**, captioned "this deal's live state" | 31 / 15 / … / 3 / 1 |
| Status chips Mandate "Active"/"Executing", Market "Open" | hard-coded strings | **Not data** | — |
| "Live" (board), pinging dot (matches) | decoration | **Fake live indicators** | — |
| Exit-process card (CIM words, NDAs pre-issued, listing, leader) | `loadRun()` from localStorage after a run on `SAMPLE_COMPANY` + `SAMPLE_OFFERS` | Demo run artifacts | — |

### Actions and navigation (all must survive)
Start Exit Process / Re-run / Reset (modal + `exit-process` run, telemetry `exit_process_clicked`, `exit_process_reset`, `dashboard_viewed`) · Execute → `/console/autopilot` · See the plan → `/console/autopilot` · briefing rows → `/console/readiness`, `/console/intelligence` · lifecycle → `/console/readiness`, `/intelligence`, `/banker`, `/negotiator`, `/closing`, `/wealth` · Open intelligence → `/console/intelligence` · `BuyerInterestGate` (free) · `#readiness` anchor.

### States
No loading (synchronous engines). Exit-run states: none / complete (card + Re-run/Reset). Empty states: diligence questions and red flags. Free plan: gate. No error state.

### Baseline verification
| Check | Result |
|---|---|
| axe (whole document, free + pro, 1440/900/390) | **0 violations** |
| `h1` | 1 (company name) |
| Page errors | 0 (one console error: the `dashboard_viewed` telemetry POST is blocked by this container's network — environmental) |
| Horizontal overflow at 390 | lifecycle strip +21 px, top-buyers card +40 px inside `<main>`; plus a shell-wide +128 px (X7) |

---

## Gap register — Page 02

| # | Gap | Evidence | Fix (no calculation changed) | Status |
|---|---|---|---|---|
| G1 | **Always the demo company, unlabelled.** A founder who completed Value My Company still sees Helios Freight, presented as theirs ("operator pro"). The Terminal personalises; this page does not. | `Dashboard.tsx` imports `SAMPLE_COMPANY`; `lib/engines.ts`, `deal-context.ts` | Run the page's engines on `loadActiveCompany()` (functions exist and are pure; module constants for other pages untouched). Badge Demo data / Your intake. Parts still bound to fixtures (sample offers, NDAs, exit run) say so. | ☐ |
| G2 | **Two valuation models across pages.** EV $108.3M here (strategic-buyer report) vs $102.8M on the Terminal (institutional framework); confidence 92% vs 89%; "Implied price $186M" beside EV $108M. | dump above | Name the model on every value; one reconciliation note linking to the Terminal; "Implied price" renamed to what it is (ranking basis). Choosing one canonical valuation is an **owner decision (D1)**. | ☐ |
| G3 | **Fake live / fixed status.** Hard-coded "Mandate Active/Executing", "Market Open"; "Live" + pinging dots on the board and matches. | `Dashboard.tsx:84-88`, `CommandTiles`, `DashboardModules` | Status from real state (exit run none/complete; data state). No live indicators. Board rendered with `xo` components on this page (shared `CommandTiles` left for Page 05). | ☐ |
| G4 | **Heuristic indices presented as measurements.** Close probability 84%, Confidence 92% (capped), Market liquidity 98, "Optimize 12 months" ×1.27. | `commander-metrics.ts`, `DashboardModules.tsx` | Same numbers, labelled "index" / "assumption", with the formula on the page. | ☐ |
| G5 | **Demo fixtures shown as "this deal's live state".** Funnel "Under NDA", "Offers in hand 3", "Leading bid"; exit-run card "NDAs pre-issued", "Leader: …". | `DashboardModules.tsx` funnel, run card | Split registry/model counts from demo fixtures; label fixtures as sample data in words. | ☐ |
| G6 | **Exit Process writes demo data to production telemetry.** Each run emits the 3 sample offers as `offer` events and "nda_issued" buyer responses for real registry buyers although nothing is sent. Production now holds **6 of 7** offer events from sample IDs `o-001…o-003` and 6 `nda_issued` events (2 runs, 2026-06-03 and 06-18). | `lib/exit-process.ts:250-330`; Supabase read-only query | Stop emitting offer and buyer-response events for demo fixtures; step texts say "drafted, not sent" / "sample offers". Existing rows: **owner decision (D2)** — not deleted. | ☑ G6-commit |
| G7 | **Mislabels / overclaims.** "Premium probability" shows the top premium payer; "Execute — one instruction dispatches the agents" only navigates; "Qualifying buyers 12" is the top-12 cap; probability caption describes a product, engine is a weighted sum. | code + dump | Correct labels and captions; Execute described as opening Autonomous Exit. | ☐ |
| G8 | **Plan gates hidden.** Execute / See the plan → Autonomous Exit (Preparation or Active Mandate); lifecycle Solicit, Negotiate, Execute, Transition → Active Mandate. | `lib/access.ts` | Show "Requires …" from `needsUpgrade()`, links unchanged (as Page 01 G7). | ☐ |
| G9 | **Weak hierarchy / repetition.** Enterprise value appears 6 times (chip, board, briefing, KPI row, scenarios, valuation reports); ~4 screens long; decision buried. | screenshots | Decision-first order on `xo`: mandate → position (value now / after fixes / scenarios) → next instruction → buyers → readiness plan → process & funnel → evidence, each figure once. | ☐ |
| G10 | **Responsive overflow at 390 px.** Lifecycle strip (+21 px) and top-buyers card (+40 px). | overflow probe | Wrapping lifecycle; tables in `ScrollRegion`. | ☐ |

### Owner decisions recorded (not made by me)
- **D1** Which valuation is canonical across the console (institutional framework vs strategic-buyer report).
- **D2** Whether to delete the 6 sample offer events and 6 `nda_issued` events already in production telemetry (and the 2 demo runs they belong to).

### Defects found outside this page
| # | Defect | Where | Plan |
|---|---|---|---|
| X7 | The shell's decorative ring SVG (`-right-32`) makes `<main>` scroll 128 px sideways on **every** console page (Page 01 included — my earlier overflow check measured the document, not `<main>`). | `components/Shell.tsx` ambient layer | One-class fix (`overflow-hidden` on the decorative layer); documented, fixed and verified separately. |

---

## Closure log

### X7 — Shell decorative layer scrolls `<main>` sideways (all pages)
*Documented above before the fix.* *Fix:* `overflow-hidden` on the `aria-hidden` ambient layer in `Shell.tsx`, so its off-edge ring is clipped instead of widening the scroll area. Nothing interactive lives in that layer.
*Verification:* `tsc -b` pass · `<main>` scrollWidth = clientWidth at 1440 and 390 on `/console`, `/console/readiness` (was +128 px); `/console/command` keeps only its own G10 overflow at 390. *Status:* ☑ `e4b46ae`

### G6 — Exit Process writes demo data to production telemetry
*Documented:* gap register row G6. *Closed by:* `lib/exit-process.ts`.
- Removed the per-run `buyer_response` "nda_issued" events: the NDAs are drafts kept in this browser and never sent.
- Removed the per-run `offer` events: the scored offers are `SAMPLE_OFFERS` fixtures.
- `run_completed.artifactsSummary` no longer reports the sample-offer "leader".
- Step texts: "NDA drafts prepared for top buyers (not sent)"; "sample offers scored (demo data)".
- Run start/step/completion events and the page-view events are unchanged. No engine call changed; the run produces the same artifacts.

*Verification* (Chromium, full Exit Process run, telemetry requests intercepted and answered locally so nothing reached production):

| Code | Events sent per run |
|---|---|
| original | telemetry 3 · run_started 1 · run_step 20 · run_completed 1 · **buyer_response 5 (nda_issued)** · **offer 3 (scored)** |
| fixed | telemetry 3 · run_started 1 · run_step 20 · run_completed 1 |

`tsc -b` pass · eslint clean. Rows already in production are untouched pending **D2**.

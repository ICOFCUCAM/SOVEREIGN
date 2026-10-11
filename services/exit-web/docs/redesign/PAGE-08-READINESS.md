# ExitOS redesign · Page 08 — Exit Readiness

| | |
|---|---|
| Route | `/console/readiness` |
| Component | `src/pages/Readiness.tsx` (208 lines) |
| NAV | "Readiness", group Mandate, role founder, no plan gate |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `40c3a67`)

### Purpose
Ties readiness to money: the score, value now vs after fixes, the value left, a when-to-sell verdict, and ten categories each with a priced fix.

### Data flow
| Element | Source | Nature |
|---|---|---|
| "Readiness 55/100" (header, gauge) | `EXIT_SCORE` = weighted average of the ten categories | Rule-based model |
| Pages 01/02 "Readiness 46" | `runReadiness().overallScore` (the readiness engine) | Model — **a different number under the same name** |
| Ten category scores | `exitReadinessCategories()` — fixed rules on profile fields (e.g. tech starts at 52, +14 if AI-native; IP 40 + 12/patent…) | Rule-based heuristic, unlabelled |
| Category $ impact | value left × each category's weighted gap share | Model allocation |
| Current / potential / value left | deal context (D1: institutional value + readiness uplift) | Model; current labelled "strategic mid, today" |
| Verdict ("Prepare — don't list yet" / "Window open — go" / "Monitor — hold") | gap > 25 %, growth ≥ 30 %, market growth ≥ 5 % | Rule, thresholds not shown |
| "Market window Open/Tightening" | `SAMPLE_COMPANY.market.marketGrowthPct ≥ 5 %` — the company's own market-growth input | **Mislabel** (not a market window) |
| **Re-score** | 700 ms timer → toast "Re-scored · 55/100 — 10 categories re-evaluated" | **Fake action** — nothing is recomputed |
| Tape | registry snapshot | Fake live (pinging) |
| Company | `SAMPLE_COMPANY` / demo deal context always | Demo, unlabelled |

### Baseline
`h1` none · axe color-contrast ×8 (1440) · no overflow · 0 errors.

## Gap register — Page 08
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Two "readiness" numbers.** 55 here, 46 on Pages 01/02, both called readiness. | Name this one **Exit Score (ten categories)** and show the readiness-engine score beside it with one line on the difference. | ☑ `7b7e141` |
| G2 | **Fake "Re-score".** | Remove the timer/toast; offer "Update your figures" (→ Value My Company), which is what actually changes the score. | ☑ `77f9e73` |
| G3 | **Mislabels:** "Market window" is the company's market-growth input; "strategic mid, today" (D1); verdict thresholds and category scoring unexplained. | "Market growth (company input)"; "enterprise value today"; thresholds shown with the verdict; categories and impacts labelled rule-based. | ☐ |
| G4 | Demo company unlabelled. | `dealContextFor(loadActiveCompany())` + analysis; badge. | ☑ G4-commit |
| G5 | Fake live tape. | `RegistryTape`. | ☐ |
| G6 | Design: no `h1`, 8 contrast failures, old primitives. | Rebuild on `xo`. | ☑ `21b899c` |

---

## Closure log

### G6 — Design
*Closed by:* `pages/Readiness.tsx` rebuilt on `xo` (`PageHeader` `h1` + report link announced as new tab, five summary metrics, gauge (decorative SVG, number printed), value cascade as a definition list, verdict with ✓/! plus screen-reader words, ten categories as an ordered list with numeric bars). Shared `Evidence` tooltip gained an additive `align="right"` option so right-edge tooltips no longer widen the page (default unchanged; Terminal re-checked). Content carried over verbatim; G1–G5 follow.
*Verification:* `tsc -b`, eslint clean · Chromium free/pro 1440/390: 0 errors, `h1` 1, no overflow, axe **0** (was 8), all tab stops with visible focus.

### G1 — Two "readiness" numbers
*Closed by:* `pages/Readiness.tsx`. The page's number is now named **Exit Score (ten categories)** everywhere on the page (header badge, summary metric, gauge section, verdict signal). The readiness engine's overall score (`runReadiness().overallScore`, the "Readiness" on Pages 01/02) is shown beside it — "readiness engine 46/100" — with one line under the gauge: the Exit Score is the weighted average of the ten categories; the engine uses its own dimensions and weights. The band word ("seed acquisition") belongs to the engine score and is now shown with it, not with 55. No calculation changed.
*Verification:* `tsc -b`, eslint clean · Chromium: "Exit Score 55/100 · readiness engine 46/100 (Seed Acquisition)" · free 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G2 — Fake "Re-score"
*Closed by:* `pages/Readiness.tsx`. The Re-score button (700 ms timer, then toast "Re-scored · 55/100 — 10 categories re-evaluated", nothing recomputed) is removed with its state and `notify` import. In its place: **Update your figures** (link to Value My Company, `/console/intake`) and a foot line: "There is no separate re-score step: the score is computed from the company's figures when the page opens. Changing the figures in Value My Company is what changes it." (Made true for saved intakes by G4.)
*Verification:* eslint clean · Chromium: 0 "Re-scor…" matches, link present · free 1440/390: 0 errors, axe 0, no overflow.

### G4 — Demo company unlabelled
*Closed by:* `pages/Readiness.tsx` — the Exit Score, ten categories, value now / after fixes / left, fixes, verdict inputs (growth, market growth) and the readiness-engine score all run on `loadActiveCompany()` through `dealContextFor`, `runReadiness` and `runReadinessAnalysis` (same formulas as the demo constants). Header eyebrow names the source ("Demo company: Helios Freight" / "Your intake: …") plus a **Demo data / Your intake** badge. `pages/Intake.tsx` lists Exit Readiness among the pages using the founder's figures. The linked PDF report already used the active company.
*Verification:* `tsc -b`, eslint clean · Chromium: demo → DEMO DATA, Exit Score 55 · engine 46, current value $102,849,415; saved intake "Northwind Analytics" → YOUR INTAKE, Exit Score 60 · engine 52, $403,509,792 (matches Pages 05–07) · free 1440/390: 0 errors, axe 0, no overflow.

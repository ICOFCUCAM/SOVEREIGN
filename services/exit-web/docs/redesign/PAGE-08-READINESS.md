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
| G1 | **Two "readiness" numbers.** 55 here, 46 on Pages 01/02, both called readiness. | Name this one **Exit Score (ten categories)** and show the readiness-engine score beside it with one line on the difference. | ☐ |
| G2 | **Fake "Re-score".** | Remove the timer/toast; offer "Update your figures" (→ Value My Company), which is what actually changes the score. | ☐ |
| G3 | **Mislabels:** "Market window" is the company's market-growth input; "strategic mid, today" (D1); verdict thresholds and category scoring unexplained. | "Market growth (company input)"; "enterprise value today"; thresholds shown with the verdict; categories and impacts labelled rule-based. | ☐ |
| G4 | Demo company unlabelled. | `dealContextFor(loadActiveCompany())` + analysis; badge. | ☐ |
| G5 | Fake live tape. | `RegistryTape`. | ☐ |
| G6 | Design: no `h1`, 8 contrast failures, old primitives. | Rebuild on `xo`. | ☐ |

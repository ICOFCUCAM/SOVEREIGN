# ExitOS redesign · Page 38 — Calibration

| | |
|---|---|
| Route | `/console/calibration` |
| Component | `src/pages/Calibration.tsx` (191 lines) + `lib/calibration.ts` (`fetchCalibration` → Supabase edge function `exit-calibration`, demo tenant) |
| NAV | "Calibration", group Admin, **admin only** (others are redirected; verified: a founder lands on `/console`) |
| Status | All three gaps closed; X21 and X22 recorded for the owner. Part of the all-pages run; reviewed together at the end. |

## Stage A — Audit (baseline commit `129900f`)

### Purpose
Internal: predicted valuation vs realized close price — runs, closes, mean error, an absolute-error figure, breakdowns by sector and buyer type, recent closes; an explanatory empty state until closes exist.

### How it was tested
The page calls the production edge function. Tests stub that call with **synthetic fixtures** (an empty state — 14 runs, 0 closes — a populated state — 3 closes — and a 500 error) so nothing is read from or written to production. Signed in as the dev operator (`ops@example.com` → superadmin).

### Data flow
| Element | Source | Nature |
|---|---|---|
| Runs, closes, errors, breakdowns, recent closes | `exit-calibration` (service role) over `exit_runs` and `exit_close_events`, **for the demo tenant only** (`DEMO_TENANT_ID`) | Real records ✓; scope not stated |
| "**Median \|error\|**" | `summary.mae` = **mean** of absolute errors (`exit-calibration/index.ts`: `mean(errs.map(Math.abs))`) | **Mislabel** — the median is a separate field (`medianErrorPct`) |
| "Mean error −6.2 % · predicted vs realized" | `predicted_vs_realized_pct` = (realized − predicted) ÷ predicted (`exit-telemetry`) | Sign convention not stated (negative = closed below the prediction) |
| "The valuation engine **learns from every close** … so future predictions **correct against measured error**"; "the engine has not yet learned anything from itself" | — | **Overclaim** — nothing reads calibration back into the engines; re-calibration would be a manual change |
| "Every One-Click Exit run writes a prediction snapshot (**strategic mid valuation**, …)" | `lib/exit-process.ts` sends `valuation.strategic.headline` | Accurate — but the console's value is the **canonical** midpoint (D1), so calibration would measure a figure founders never see (**X21**, below) |
| Error state | "Calibration fetch failed … may be unreachable" | ✓ |

### Found while auditing (backend — for the owner, not changed here)
- **X21 — prediction snapshot is the strategic mid, not the D1 value.** `exit-process.ts` records `valuation.strategic.headline` ($108.3M for the demo) as the run's prediction; every console page shows the canonical (institutional) midpoint ($102.8M). Changing what is recorded changes calibration history — owner decision.
- **X22 — `exit-calibration` has no caller check.** The function runs with the service role and returns the summary for whatever `tenantId` UUID it is given; the browser calls it with the public anon key. Anyone who knows or guesses a tenant id can read that tenant's predicted and realized prices. The console's admin gate is client-side only.

### Baseline (superadmin, stubbed)
`h1` "Predicted vs realized" · axe 0 · **overflow at 390 in the populated state** (tables) · 0 errors; old components (`Card`, `Kpi`, `SectionHeader`).

## Gap register — Page 38
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Self-learning overclaims.** | Say the dashboard measures error for review; nothing feeds back into the engines automatically; re-calibration is a deliberate change. | ☑ `542e82e` |
| G2 | **"Median \|error\|" shows the mean; sign and scope unstated.** | "Mean absolute error" (and the median error beside it); "error = (realized − predicted) ÷ predicted; negative = closed below the prediction"; "demo tenant"; the prediction recorded is the strategic-report midpoint (X21). | ☑ `6682907` |
| G3 | Design: old components; overflow at 390. | Rebuild on `xo`; tables in scroll regions. | ☑ `c576de8` |

---

## Closure log

### G3 — Design
*Closed by:* `pages/Calibration.tsx` rebuilt on `xo` (`PageHeader` `h1`; four metrics; loading as a status and the failure as an alert; the empty state as a titled `Section`; the three tables with row headers and scoped column headers inside keyboard-reachable `ScrollRegion`s — fixes the overflow at 390; error tones on xo tokens with the value always in text). Content carried over verbatim; G1–G2 follow.
*Verification:* `tsc -b`, eslint clean · Chromium superadmin, stubbed edge function (empty, populated and error states) at 1440/390: 0 errors, `h1` 1, **no overflow** (was overflowing at 390 when populated), axe 0 (a duplicate region name found during the rebuild was fixed).

### G1 — Self-learning overclaims
*Closed by:* `pages/Calibration.tsx` (text). "The valuation engine learns from every close … so future predictions correct against measured error" → "Measures how far recorded predictions were from realized close prices … Nothing here feeds back into the engines automatically — re-calibrating them is a deliberate change made against these figures."; "the engine has not yet learned anything from itself" → "Until then there is nothing to measure."; "the valuation engine's sector multipliers can be re-calibrated against measured error rather than priors" → "They do not change the engines by themselves; they are the evidence for re-calibrating the sector multipliers by hand."; file comment ("the muscle the engine eventually self-corrects against") corrected.
*Verification:* `tsc -b`, eslint clean · Chromium superadmin (stubbed, empty state): 0 "learns from every close", "correct against measured error", "learned anything", "self-correct"; the new description shown; 1440/390 axe 0, no overflow.

### G2 — "Median |error|" shows the mean; sign and scope unstated
*Closed by:* `pages/Calibration.tsx` (labels; data unchanged). "Median |error| — absolute deviation" (it showed `mae`, the mean of absolute errors) → **"Mean absolute error — average size of the miss"**; a "Median error" metric now shows the real median (`medianErrorPct`); "Mean error" sub → "signed — direction of the miss"; a note: "Demo tenant only. Error = (realized − predicted) ÷ predicted — negative means the deal closed below the prediction. The prediction recorded for each run is the strategic-report midpoint, not the canonical value the console shows (open item X21)."
*Verification:* `tsc -b`, eslint clean, `vitest` 206/206 · Chromium superadmin, stubbed populated state (fixture: mean −6.2 %, median −5.0 %, MAE 8.0 %): "Mean error −6.2% · Median error −5.0% · Mean absolute error 8.0%" and the note shown; 0 "Median |error|"; 1440/390 axe 0, no overflow.

---

## Final verification
`tsc -b` pass · eslint 0 errors · `vitest` 206/206 · Chromium superadmin with the edge function stubbed by synthetic fixtures (empty, populated, error) at 1440/390: 0 errors, `h1` 1, no overflow, axe 0 · non-admin redirected to `/console` (unchanged).

## Known issues
- **X21 (owner decision):** One-Click Exit records the strategic-report midpoint as the prediction; the console shows the canonical value (D1).
- **X22 (security, backend):** `exit-calibration` returns any tenant's summary to any caller holding the public anon key and a tenant UUID; the admin gate is client-side only.
- Real calibration data was not read: the page was tested only against stubbed responses, so the production demo tenant's actual figures are NOT VERIFIED here.

*Correction (found on Page 40):* the Page 38 test script stubbed the calibration call but let other function calls through, so the shell's read-only status request `GET …/functions/v1/exit-social-dispatch` reached the production endpoint during these runs. Nothing was written; the calibration figures were all from fixtures. The script was corrected on Page 40.

# ExitOS redesign · Page 38 — Calibration

| | |
|---|---|
| Route | `/console/calibration` |
| Component | `src/pages/Calibration.tsx` (191 lines) + `lib/calibration.ts` (`fetchCalibration` → Supabase edge function `exit-calibration`, demo tenant) |
| NAV | "Calibration", group Admin, **admin only** (others are redirected; verified: a founder lands on `/console`) |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

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
| G1 | **Self-learning overclaims.** | Say the dashboard measures error for review; nothing feeds back into the engines automatically; re-calibration is a deliberate change. | ☐ |
| G2 | **"Median \|error\|" shows the mean; sign and scope unstated.** | "Mean absolute error" (and the median error beside it); "error = (realized − predicted) ÷ predicted; negative = closed below the prediction"; "demo tenant"; the prediction recorded is the strategic-report midpoint (X21). | ☐ |
| G3 | Design: old components; overflow at 390. | Rebuild on `xo`; tables in scroll regions. | ☐ |

---

## Closure log

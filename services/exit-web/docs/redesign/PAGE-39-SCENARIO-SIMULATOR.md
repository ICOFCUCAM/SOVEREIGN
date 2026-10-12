# ExitOS redesign · Page 39 — Scenario Simulator

| | |
|---|---|
| Route | `/console/simulator` |
| Component | `src/pages/Simulator.tsx` (519 lines) + `runStrategySimulator`, `runInstitutionalValuation` (`@exit/engines`), shared `BankerTake` |
| NAV | "Scenario Simulator", founder, **Pro** (free: Upgrade page) |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `f7c0ffd`)

### Purpose
Set a target value and deal constraints (cash floor, earnout ceiling, timeline, buyer type, minimum evidence), see the baseline trajectory (buyer set, close probability, time to cash, expected realized value, process structure), then pick one of six scenarios and compare it with the baseline.

### Data flow (measured, Pro, demo)
| Element | Source | Nature |
|---|---|---|
| "**Close probability 100 %** — P(≥1 of 5)"; summary "P(close)=100% over the set" | `runStrategySimulator` → 1 − Π(1 − close rate) over the buyer set | **Model output shown as a fact**: assumes every buyer in the set makes an offer, independently, at its (often prior) close rate |
| "**Expected realized $144,654,185** — best of set" against the $102.8M target | the **maximum** expected closing value across the set | Upward-biased by construction (best of five); not labelled as such |
| "**Strategic valuation** / Strategic value — mid band, today" $102,849,415 | `runInstitutionalValuation(…).headline.mid` | The canonical (institutional) value, mislabelled "strategic" (D1) |
| Scenario "What happens if revenue reaches **$25M ARR**?" — drivers "ARR steps from **$18M to $25M** — crosses the scale threshold buyers reward", "Larger check size opens up upper-bracket acquirers", "Strategic band re-prices …" | hard-coded text; the factor uses the demo's ARR | Demo-specific; the "threshold" and "upper-bracket" claims are not computed |
| Other scenario drivers (e.g. "Buyers who structure around earnouts (often PE) fall out of the set", "Deep balance sheet → … faster to close") | hard-coded | Stated as outcomes; the computed diff below may show otherwise |
| Everything | **demo company only** (`SAMPLE_COMPANY`) | Demo **unlabelled**; saved intakes ignored |
| Inputs (target, cash %, earnout %, timeline) | `type=number`, `Number(e.target.value)` | No validation: clearing a field gives 0; decimals and units unclear |
| Telemetry `simulator_viewed`, `simulator_scenario` | `emitTelemetry` → edge function | Product analytics (stubbed in tests) |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline
Free: Upgrade page. Pro: `h1` none · **overflow at 390** · axe 0 (1440) · 0 errors · 39 tab stops.

## Gap register — Page 39
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Model outputs shown as facts (100 % close, best-of-set value).** | "Modelled close probability" with its assumptions (each buyer offers independently at its close rate; priors where undisclosed) and "best expected value in the set (maximum, not an average)"; the same in the scenario diff and summary. | ☑ `318272f` |
| G2 | "Strategic valuation" is the canonical value. | "Valuation (canonical midpoint)". | ☑ `f154fcf` |
| G3 | **Demo-specific and uncomputed scenario claims.** | Drivers built from the company's own figures (ARR before → after); the ARR scenario names a target above the company's ARR; uncomputed outcomes worded as expectations to check against the diff. | ☑ `c68ab55` |
| G4 | Demo only, unlabelled. | Run on the active company; Demo data / Your intake badge. | ☑ `f8779b8` |
| G5 | Unvalidated number inputs. | Text inputs parsed with `parseNumber` (units, ranges), messages, `aria-invalid`; only valid values reach the engines. | ☐ |
| G6 | Shared `BankerTake`; fake live tape. | Page-local recommended action; `RegistryTape`. | ☐ |
| G7 | Design: no `h1`, overflow at 390. | Rebuild on `xo`. | ☑ `ca01086` |

---

## Closure log

### G7 — Design
*Closed by:* `pages/Simulator.tsx` rebuilt on `xo` (`PageHeader` `h1` "Scenario Engine"; three metrics; the inputs with `label`/`id` pairs and described hints; trajectory, scenario picker and diff as titled `Section`s; the six scenarios as `aria-pressed` buttons in a labelled group; stats and diffs as `dl`s; the buyer table with row headers in a `ScrollRegion` (fixes the 390 overflow); hex accents replaced). Content carried over verbatim; the shared `BankerTake` stays until G6; G1–G6 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Pro 1440/390: 0 errors, `h1` 1 (was 0), **no overflow** (was overflowing at 390), axe 0, all tab stops with visible focus · after selecting the PE-only scenario: axe 0, no overflow · free: Upgrade page.

### G1 — Model outputs shown as facts
*Closed by:* `pages/Simulator.tsx` (labels; engine unchanged). "Close probability 100% — P(≥1 of 5)" → **"Modelled close probability — P(≥1 of 5), independence assumed"** (also in the scenario diff); "Expected realized — best of set" / "Baseline realized" → **"Best expected value in set — maximum across the set"** / "baseline · the highest buyer, not an average"; the trajectory foot states the model: "Close probability = 1 − Π(1 − close rate) across the set — it assumes every buyer in the set makes an offer, independently; close rates use priors where a buyer has not disclosed one. The value is the highest buyer's expected closing value, so it sits above what a typical buyer would pay." (the formula and the maximum confirmed in `exit-engines/src/buyers/strategy.ts`). The engine's own summary sentence ("P(close)=100% over the set. Best expected realized …") is shown unchanged above that foot; the per-buyer "Expected realized" column is a per-buyer figure and stays.
*Verification:* `tsc -b`, eslint clean · Chromium Pro: the new labels (2 modelled close probability, 3 best expected value) and the foot shown · 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G2 — "Strategic valuation" is the canonical value
*Closed by:* `pages/Simulator.tsx` (labels). The figure is `runInstitutionalValuation(…).headline.mid` — the canonical value (D1). "Strategic valuation" (scenario diff) and "Strategic value — mid band, today" (trajectory) → **"Valuation (canonical midpoint)"** ("today — the console value").
*Verification:* `tsc -b`, eslint clean · Chromium Pro: "Valuation (canonical midpoint) $102,849,415"; the only remaining "strategic valuation" text is in the scenario drivers, reworded in G3.

### G3 — Demo-specific and uncomputed scenario claims
*Closed by:* `pages/Simulator.tsx`. Scenarios now read the trajectory's own company (not the demo constant) and their drivers are computed or worded as what to check in the diff:
- Wait six months: "ARR compounds about 6 months at 42% a year: $18.0M → $21.4M"; "The valuation is re-run on the larger revenue base — see the diff above" (was "Higher revenue base lifts the strategic valuation band").
- Growth: the question names the destination — $25M ARR, or 40 % above today rounded up to the next $5M when the company is already past $25M; "ARR goes from $18.0M to $25M"; "The buyer set is re-filtered at the new size — compare Buyers in set" (was "crosses the scale threshold buyers reward", "Larger check size opens up upper-bracket acquirers"); the assumption names the same destination.
- Remove the earnout / 90-day close / PE-only: outcomes such as "Buyers who structure around earnouts (often PE) fall out of the set", "Slower acquirers drop out", "Faster, more repeatable diligence" → "may drop out — compare Buyers in set", "generally …" wording.
- Marquee buyer: "What if Microsoft enters the process?" → "What if a marquee strategic (e.g. Microsoft) enters?"; drivers state exactly what the model changes (strategics only, top of the canonical band, cash floor ≥ 80 %) instead of "raises competitive tension … faster to close".
The scenario transforms and their targets are unchanged: for the demo the six diffs are identical to before (e.g. wait six months $122,559,223, best value $199,158,737).
*Verification:* `tsc -b`, eslint clean · Chromium Pro: each of the six scenarios selected in turn — drivers as above, 0 errors · 1440/390: `h1` 1, no overflow, axe 0.

### G4 — Demo only, unlabelled
*Closed by:* `pages/Simulator.tsx`. The baseline and every scenario run on `loadActiveCompany()` (the saved intake, or the demo company); the target starts at that company's canonical midpoint (`canonicalValuationFor`), and the hint reads "Canonical midpoint: $…" (was the demo's "Implied mid"). Eyebrow "Demo company: Helios Freight" / "Your intake: …", **Demo data** / **Your intake** badge, description "Runs on the demo company. Save an intake to simulate your own." / "Runs on your saved intake."
*Verification:* `tsc -b`, eslint clean · Chromium Pro: demo unchanged (wait six months → $122,559,223); intake (Northwind Analytics, $42M ARR) → wait six months "$42.0M → $50.0M", valuation $480,837,410; the growth scenario becomes "What happens if revenue reaches $60M ARR?" ($42M × 1.4 rounded up to $60M), valuation $576,442,560; 0 errors · 1440/390: `h1` 1, no overflow, axe 0.

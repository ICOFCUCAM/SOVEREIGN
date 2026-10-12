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
| G1 | **Model outputs shown as facts (100 % close, best-of-set value).** | "Modelled close probability" with its assumptions (each buyer offers independently at its close rate; priors where undisclosed) and "best expected value in the set (maximum, not an average)"; the same in the scenario diff and summary. | ☐ |
| G2 | "Strategic valuation" is the canonical value. | "Valuation (canonical midpoint)". | ☐ |
| G3 | **Demo-specific and uncomputed scenario claims.** | Drivers built from the company's own figures (ARR before → after); the ARR scenario names a target above the company's ARR; uncomputed outcomes worded as expectations to check against the diff. | ☐ |
| G4 | Demo only, unlabelled. | Run on the active company; Demo data / Your intake badge. | ☐ |
| G5 | Unvalidated number inputs. | Text inputs parsed with `parseNumber` (units, ranges), messages, `aria-invalid`; only valid values reach the engines. | ☐ |
| G6 | Shared `BankerTake`; fake live tape. | Page-local recommended action; `RegistryTape`. | ☐ |
| G7 | Design: no `h1`, overflow at 390. | Rebuild on `xo`. | ☐ |

---

## Closure log

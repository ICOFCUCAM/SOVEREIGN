# ExitOS redesign · Page 34 — Enterprise Value (Valuation)

| | |
|---|---|
| Route | `/console/valuation` |
| Component | `src/pages/Valuation.tsx` (203 lines) + `lib/engines.ts` (`VALUATION_INSTITUTIONAL`, `VALUATION_FACTS` on the demo company), `VALUATION_FRAMEWORK`, shared `BankerTake`, `CommandState` |
| NAV | "Enterprise Value", founder, no plan gate |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `31d61c6`)

### Purpose
The valuation desk: the institutional headline (midpoint, band, premium, baseline, confidence), a sourced fact sheet with export and PDF report, an interactive DCF, methodology bars, most likely acquirers, comparable transactions and the strategic rationale.

### Data flow (measured on the demo company)
| Element | Source | Nature |
|---|---|---|
| Midpoint **$102,849,415** (band $61.5M–$173.9M), premium +43 %, financial baseline $72,168,000, confidence 89 % | `VALUATION_INSTITUTIONAL` | The canonical value (D1) ✓ |
| Tag "**Strategic-buyer basis**" | — | Mislabel — the figure is the institutional framework (the same mislabel Page 03 G3 fixed) |
| **"Comparable $2,250,000,000 — 12 precedents"** | `compMid` = the median **deal size of the comparable transactions** (other companies' acquisition prices) | **Not a valuation of this company** — a median of unrelated deal sizes, shown as a method value and drawn as a methodology bar |
| **"Blended $823,056,180 — baseline·DCF·comps"** (accent metric) | (baseline + DCF + compMid) ÷ 3 | **8× the canonical value**, driven by the $2.25B deal-size median; contradicts D1 ("use $103M everywhere") and is the most prominent figure after the midpoint |
| DCF **$147,000,540** (42 % growth, 18 % WACC) | page-local `dcf()`: EBITDA grown 5 years, discounted, Gordon terminal | A sensitivity tool on assumptions; uses **EBITDA as free cash flow** (unstated) |
| "Methodology bands · normalized weights sum to 100 %" | DCF and comps bars (no weights) + the framework's weighted methods | Title wrong: two of the bars are not weighted methods; bar scale = blended × 1.8 |
| "Every figure traces to source data, **not assumption**"; "No number on this page exists without one" | — | The DCF and its sliders are assumptions |
| Most likely acquirers "**87 %**" | `mostLikelyBuyers.probabilityPct` = discovery fit × 100 | Fit score shown as a probability (Buyer Profiles / Intelligence call it "fit probability — not a measured chance of a bid") |
| Everything | the **demo company only** | Demo **unlabelled**; saved intakes ignored (Page 03 personalises the same report) |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline
Free and Pro: `h1` none · axe color-contrast ×33 (1440), scrollable-region-focusable ×1 (390) · no overflow · 0 errors · 38 tab stops.

## Gap register — Page 34
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **"Blended $823M" and "Comparable $2.25B" presented as valuations.** | Remove the blended figure; show the comparable figure as "Median precedent deal size — other companies' deals, not a value for this company"; drop its methodology bar; bar scale from the canonical band. Calculation of the canonical value untouched. | ☐ |
| G2 | DCF presented without its simplification; "not assumption" claims. | "DCF sensitivity" — EBITDA used as a free-cash-flow proxy, assumptions set by you, not the valuation; remove "not assumption" / "no number without a source" claims; methodology title fixed. | ☐ |
| G3 | "Strategic-buyer basis"; acquirer fit shown as probability. | "Institutional framework — the console value (D1)"; "fit probability — not a measured chance of a bid". | ☐ |
| G4 | Demo only, unlabelled. | `runInstitutionalValuation(company)` and `valuationFacts` for the active company; DCF base from it; Demo data / Your intake badge. | ☐ |
| G5 | Shared `BankerTake` / `CommandState`; fake live tape. | Page-local recommended action; `RegistryTape`. | ☐ |
| G6 | Design: no `h1`, 34 axe failures. | Rebuild on `xo`. | ☐ |

---

## Closure log

### X19 — Shared `Evidence` tooltip widens the page (found here) — documented before the fix
`lib/workstation.tsx` `Evidence` keeps its tooltip in layout while hidden (`invisible` + `opacity-0`, `absolute left-0 w-60`). In the rebuilt fact sheet the tooltips of right-hand cells extend past `main`: horizontal overflow of 3 px at 1440 and 58 px at 390 (measured). The tooltip text is also small and faint when shown (`text-[9px] text-white/45`, `text-[8px]` label). *Fix:* render the tooltip `hidden` until hover or focus (`group-hover/ev:block group-focus/ev:block`), cap its width at the viewport (`max-w-[calc(100vw-2rem)]`), and raise its text to 11px / `text-white/70`. Used on Readiness, Pipeline, Valuation, Outcome Intelligence, Buyer Graph and Terminal; behaviour (hover/focus to show) unchanged.

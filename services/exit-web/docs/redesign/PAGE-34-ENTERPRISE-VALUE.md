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
| G1 | **"Blended $823M" and "Comparable $2.25B" presented as valuations.** | Remove the blended figure; show the comparable figure as "Median precedent deal size — other companies' deals, not a value for this company"; drop its methodology bar; bar scale from the canonical band. Calculation of the canonical value untouched. | ☑ `723221c` |
| G2 | DCF presented without its simplification; "not assumption" claims. | "DCF sensitivity" — EBITDA used as a free-cash-flow proxy, assumptions set by you, not the valuation; remove "not assumption" / "no number without a source" claims; methodology title fixed. | ☑ `e019b34` |
| G3 | "Strategic-buyer basis"; acquirer fit shown as probability. | "Institutional framework — the console value (D1)"; "fit probability — not a measured chance of a bid". | ☑ G3-commit |
| G4 | Demo only, unlabelled. | `runInstitutionalValuation(company)` and `valuationFacts` for the active company; DCF base from it; Demo data / Your intake badge. | ☐ |
| G5 | Shared `BankerTake` / `CommandState`; fake live tape. | Page-local recommended action; `RegistryTape`. | ☐ |
| G6 | Design: no `h1`, 34 axe failures. | Rebuild on `xo`. | ☑ `746abb0` |

---

## Closure log

### X19 — Shared `Evidence` tooltip widens the page (found here) — documented before the fix
`lib/workstation.tsx` `Evidence` keeps its tooltip in layout while hidden (`invisible` + `opacity-0`, `absolute left-0 w-60`). In the rebuilt fact sheet the tooltips of right-hand cells extend past `main`: horizontal overflow of 3 px at 1440 and 58 px at 390 (measured). The tooltip text is also small and faint when shown (`text-[9px] text-white/45`, `text-[8px]` label). *Fix:* render the tooltip `hidden` until hover or focus (`group-hover/ev:block group-focus/ev:block`), cap its width at the viewport (`max-w-[calc(100vw-2rem)]`), and raise its text to 11px / `text-white/70`. Used on Readiness, Pipeline, Valuation, Outcome Intelligence, Buyer Graph and Terminal; behaviour (hover/focus to show) unchanged.

### X19 — Shared `Evidence` tooltip widens the page
*Closed by:* `lib/workstation.tsx` `Evidence`: the tooltip is `hidden` until `group-hover/ev:block` / `group-focus/ev:block` (was `invisible opacity-0`, which kept it in layout), capped at `max-w-[calc(100vw-2rem)]`; label 8px → 11px, body 10.5px / 9px → 11px, faint text `white/45` → `white/70`. Show-on-hover/focus behaviour unchanged.
*Verification:* `tsc -b`, eslint clean, `vitest` 206/206 · Chromium: Enterprise Value overflow 3 px / 58 px → **0** at 1440 / 390 (`scrollWidth` = `main` width); focusing the first Evidence figure shows its tooltip on Enterprise Value, Terminal and Readiness, with axe 0 while it is open (1440 and 390) · the other users (Readiness, Pipeline, Terminal, Buyer Graph, Outcome Intelligence) Pro 1440/390: 0 errors, no overflow, axe 0.

### G6 — Design
*Closed by:* `pages/Valuation.tsx` rebuilt on `xo` (`PageHeader` `h1` "Enterprise Value"; seven metrics; the command state as a definition list; the fact sheet as a real `dl` with Evidence tooltips; DCF sliders with `label`/`id` pairs; methodology bars `aria-hidden` beside their figures; acquirers and comparables as tables with row headers, comparables in a `ScrollRegion` (fixes scrollable-region-focusable); hex accents replaced by xo tokens). Content carried over verbatim; the shared `BankerTake` stays until G5; G1–G5 follow. The rebuilt fact sheet exposed a shared tooltip overflow, fixed first as X19.
*Verification:* `tsc -b`, eslint clean · Chromium free/Pro 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 33 + 1), all tab stops with visible focus.

### G1 — "Blended $823M" and "Comparable $2.25B" presented as valuations
*Closed by:* `pages/Valuation.tsx`. The **"Blended $823,056,180 — baseline·DCF·comps"** metric is removed (it averaged the baseline, the DCF and the median deal size of the comparables — other companies' acquisition prices — and stood at 8× the canonical $102.8M). "Comparable $2,250,000,000 — 12 precedents" → **"Median precedent deal size — 12 precedents · other companies' deals, not a value for this company"**; its methodology bar is removed; the bar scale is the largest figure drawn (DCF, canonical high, framework methods) × 1.1 instead of blended × 1.8; the JSON export drops `blended` and names the figure `medianPrecedentDealSizeUsd`. The canonical midpoint, band and framework methods are untouched.
*Verification:* `tsc -b`, eslint clean · Chromium: 0 "Blended" / "823,056,180"; the median deal size shows with its qualifier · free/Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G2 — DCF presented without its simplification; "not assumption" claims
*Closed by:* `pages/Valuation.tsx` (labels; the DCF formula is unchanged). "DCF" → "DCF sensitivity — … · your assumptions"; "DCF assumptions" → "DCF sensitivity · your assumptions" with the foot "Projects EBITDA as a proxy for free cash flow (capex, tax and working capital are not deducted), grows it 5 years at your growth rate, discounts at your WACC and adds a terminal value at 3.0% growth. A sensitivity on your assumptions — not the valuation, which is the midpoint above."; "Methodology bands · normalized weights sum to 100%" → "Methodology bands" with the foot "The framework's weighted methods (weights sum to 100%) beside your DCF sensitivity, which carries no weight in the midpoint."; bar "DCF (5yr + terminal)" → "DCF sensitivity (not weighted)"; fact-sheet foot "No number on this page exists without one." removed ("Hover or focus any figure …"); file comment "Every figure traces to source data, not assumption" corrected.
*Verification:* `tsc -b`, eslint clean · Chromium: 0 "not assumption" / "without one" / "normalized weights"; the DCF foot shown · free/Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G3 — "Strategic-buyer basis"; acquirer fit shown as probability
*Closed by:* `pages/Valuation.tsx` (labels). Header tag "Strategic-buyer basis" → "Institutional framework — the console value" (as Page 03 G3 did for the same figure, D1); the acquirers' "87 %" column is "Fit probability" (screen-reader prefix per value) and the foot opens "Fit probability is the discovery engine's weighted fit score — not a measured chance of a bid." (the wording used on Buyer Profiles and Buyer Intelligence).
*Verification:* `tsc -b`, eslint clean · Chromium: 0 "strategic-buyer basis"; the new tag and foot shown · free 1440/390: 0 errors, `h1` 1, no overflow, axe 0.
*Note:* Value My Company (Page 03, approved) still heads the same column "Probability" — flagged for the final review.

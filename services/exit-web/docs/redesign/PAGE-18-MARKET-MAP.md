# ExitOS redesign · Page 18 — Market Map

| | |
|---|---|
| Route | `/console/market-map` |
| Component | `src/pages/MarketMap.tsx` (122 lines) |
| NAV | "Market Map", founder, **Preparation or Active Mandate** |
| Status | All four gaps closed. Part of the all-pages run; reviewed together at the end. |

## Stage A — Audit (baseline commit `6b74274`)

### Purpose
Market-wide acquisition activity from the registry snapshot: totals, a sector heatfield, a disclosed-value reactor, sector heat, regional density, cross-border corridors and the most active acquirers. Not company-specific.

### Data flow
| Element | Source | Nature |
|---|---|---|
| All figures | `market_intelligence.json` (pre-aggregated from the registry, as of 2026-10-11) | Registry snapshot ✓ |
| **"every figure aggregated from the verified registry … No estimates — pure deal data"** (comment), heatfield foot "Aggregated from the verified registry", acquirers foot "**Nothing modelled or estimated**" | — | **Overclaim**: the event registry has 6,311 events — **495 verified, 21 corroborated, 5,795 unverified** (measured from `acquisition_events.json`); most rows are source-cited Wikipedia list entries |
| "Active sectors 40", "Active acquirers 40 — top of registry" | lengths of the two lists in the extract | **Mislabels** (list sizes, not activity counts) |
| "Transaction heatfield · where capital is moving" | static snapshot aggregation | Implies motion |
| Sector heat "Hover for disclosed value" | value only in a `title` tooltip | Not reachable by keyboard or touch |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline (Preparation)
`h1` none · axe color-contrast ×5 (1440) · no overflow · 0 errors. Free: Upgrade page.

## Gap register — Page 18
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **"Verified registry … nothing modelled or estimated"** while most events are unverified. | State the source mix: most rows are source-cited but unverified list entries; a minority are verified against SEC EDGAR / Wikidata; values are as disclosed. | ☑ `5f4008a` |
| G2 | Mislabels: list sizes as "active sectors / acquirers"; "where capital is moving"; hover-only values. | "Sectors shown", "Acquirers listed — by deal count"; "by sector, snapshot"; disclosed value printed in each sector cell. | ☑ `4f3f024` |
| G3 | Fake live tape. | `RegistryTape`. | ☑ `f5b6c2b` |
| G4 | Design: no `h1`, 5 contrast failures, old primitives. | Rebuild on `xo` (acquirers table with headers; decorative visuals hidden with text equivalents). | ☑ `a4476e4` |

---

## Closure log

### G4 — Design
*Closed by:* `pages/MarketMap.tsx` rebuilt on `xo` (`PageHeader` `h1` with source and report link announced as a new tab; four metrics; the heatfield and reactor are hidden from assistive tech and the heatfield gets a **"Show data" disclosure** with the same 18 sectors as a table (acquisitions, disclosed, 12-month trend) — before, its figures were only in hover tooltips; sector cells switch to dark text on the brightest heat so numbers keep contrast; regions and corridors as lists; acquirers as a table with headers in a `ScrollRegion` — the "↑" glyph becomes a "Last 3 years" column). Content carried over verbatim; G1–G3 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 5), all tab stops with visible focus; with the heatfield data shown: axe 0, no overflow.

### G1 — "Verified registry … nothing modelled or estimated"
*Closed by:* `pages/MarketMap.tsx` (text only). Header description now: "Most events are source-cited entries from Wikipedia acquisition lists that are not yet verified; a minority are verified against SEC EDGAR or Wikidata. Values are as disclosed in those sources." Heatfield foot "Aggregated from the verified registry" → "… from the registry snapshot (mostly unverified, source-cited entries)"; acquirers foot "Nothing modelled or estimated" → "Counts of recorded events — not modelled, but mostly unverified list entries"; file comment updated. (Measured mix in the snapshot: 495 verified, 21 corroborated, 5,795 unverified of 6,311 events — recorded here rather than hard-coded on the page, since the browser bundle does not carry the event file.)
*Verification:* eslint clean · Chromium: 0 "verified registry" / "Nothing modelled or estimated"; new description present.

### G2 — Mislabels and hover-only values
*Closed by:* `pages/MarketMap.tsx`. "Active sectors — by deal volume" → "Sectors shown — top by deal volume"; "Active acquirers — top of registry" → "Acquirers listed — top by deal count" (both are list sizes in the extract); "Transaction heatfield · where capital is moving" → "· by sector, snapshot"; sector heat cells now print the disclosed value under the deal count (was a hover tooltip only), foot "Each cell shows deals and disclosed value."
*Verification:* `tsc -b`, eslint clean · Chromium: 0 matches for Active sectors / Active acquirers / where capital is moving / Hover for · Preparation 1440/390: 0 errors, axe 0, no overflow.

### G3 — Fake live tape
*Closed by:* `pages/MarketMap.tsx`: pinging `MarketTape` → dated `RegistryTape` (snapshot date from the market-intelligence extract).
*Verification:* Chromium: 0 "live" words, 0 pinging elements, snapshot date shown · free (Upgrade page), Preparation and Active Mandate 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus.

---

## Final verification
`tsc -b` pass · eslint 0 errors · `vitest` 204/204 · Chromium Preparation and Active Mandate 1440/390: 0 errors, `h1` 1, no overflow, axe 0 (was 5), all tab stops with visible focus; heatfield data table checked · free: Upgrade page · 0 "live" words.

## Known issues
- Market-wide data; nothing here is company-specific, so there is no demo/intake switch.
- The shared `TransactionHeatfield` and `LiquidityReactor` components still carry their figures only visually; on this page they are hidden from assistive tech, with the heatfield's data available as a table.

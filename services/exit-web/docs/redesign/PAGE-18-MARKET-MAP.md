# ExitOS redesign · Page 18 — Market Map

| | |
|---|---|
| Route | `/console/market-map` |
| Component | `src/pages/MarketMap.tsx` (122 lines) |
| NAV | "Market Map", founder, **Preparation or Active Mandate** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

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
| G1 | **"Verified registry … nothing modelled or estimated"** while most events are unverified. | State the source mix: most rows are source-cited but unverified list entries; a minority are verified against SEC EDGAR / Wikidata; values are as disclosed. | ☐ |
| G2 | Mislabels: list sizes as "active sectors / acquirers"; "where capital is moving"; hover-only values. | "Sectors shown", "Acquirers listed — by deal count"; "by sector, snapshot"; disclosed value printed in each sector cell. | ☐ |
| G3 | Fake live tape. | `RegistryTape`. | ☐ |
| G4 | Design: no `h1`, 5 contrast failures, old primitives. | Rebuild on `xo` (acquirers table with headers; decorative visuals hidden with text equivalents). | ☑ G4-commit |

---

## Closure log

### G4 — Design
*Closed by:* `pages/MarketMap.tsx` rebuilt on `xo` (`PageHeader` `h1` with source and report link announced as a new tab; four metrics; the heatfield and reactor are hidden from assistive tech and the heatfield gets a **"Show data" disclosure** with the same 18 sectors as a table (acquisitions, disclosed, 12-month trend) — before, its figures were only in hover tooltips; sector cells switch to dark text on the brightest heat so numbers keep contrast; regions and corridors as lists; acquirers as a table with headers in a `ScrollRegion` — the "↑" glyph becomes a "Last 3 years" column). Content carried over verbatim; G1–G3 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 5), all tab stops with visible focus; with the heatfield data shown: axe 0, no overflow.

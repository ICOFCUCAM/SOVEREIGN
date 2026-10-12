# ExitOS redesign · Page 21 — Acquisition Indexes

| | |
|---|---|
| Route | `/console/indexes` |
| Component | `src/pages/Indexes.tsx` (107 lines) |
| NAV | "Acquisition Indexes", founder, **Preparation or Active Mandate** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `b1a25bb`)

### Purpose
Per-sector indexes from the registry snapshot: volume, 12-month trend, buyers, median deal and disclosed value; a heatfield and reactor; sortable table; "hottest sector".

### Data flow
| Element | Source | Nature |
|---|---|---|
| Index rows | `acquisition_indexes.json` (as of 2026-10-11) | Registry snapshot ✓ |
| **"12m trend" ▲/▼ N %** and **"Hottest sector"** | (last-12-month count − prior-12-month count) ÷ prior, on **very small counts**: Software +67 % = 5 vs 3 deals; Cybersecurity −100 % = 0 vs 3; AI +60 % = 8 vs 5 | **Percentages on tiny samples, counts hidden** — "hottest sector" is decided by two extra deals |
| "Active buyers" | `activeBuyers` = distinct acquirers in the sector, **all years** (`exit-engines/src/market/indexes.ts`) | Mislabel |
| Comment "every figure from verified registry events" | — | Overclaim (most registry events are unverified; Page 18 G1) |
| Heatfield foot "Hover a sector for figures" | tooltip only | Same figures are in the table; the visual should be hidden from assistive tech |
| Sort buttons | no pressed state | Accessibility |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline (Preparation)
`h1` none · axe color-contrast ×7 (1440), scrollable region not focusable (390) · no overflow · 0 errors. Free: Upgrade page.

## Gap register — Page 21
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Trends on tiny counts; "hottest sector" decided by a few deals.** | Show the counts beside each trend ("5 vs 3"); mark trends under 10 deals in both windows "small sample"; the hottest-sector metric shows its counts. | ☑ `c2b16f2` |
| G2 | Mislabels: "Active buyers" (all-time distinct acquirers); "verified" comment; hover-only heatfield. | "Distinct acquirers (all years)"; comment corrected; heatfield hidden with the table as its text equivalent. | ☑ `14b90c8` |
| G3 | Fake live tape. | `RegistryTape`. | ☐ |
| G4 | Design: no `h1`, contrast failures, unfocusable scroll region, sort semantics. | Rebuild on `xo` (`Chip` sort, `ScrollRegion`). | ☑ `6090ed3` |

---

## Closure log

### G4 — Design
*Closed by:* `pages/Indexes.tsx` rebuilt on `xo` (`PageHeader` `h1` with source and as-of date; four metrics; heatfield and reactor hidden from assistive tech — the table carries the same figures; sort as `Chip` toggles with `aria-pressed`; table with row headers in a keyboard-reachable `ScrollRegion`; trend arrows carry "up/down" for screen readers). Content carried over verbatim; G1–G3 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 7 + 1), all tab stops with visible focus.

### G1 — Trends on tiny counts
*Closed by:* `pages/Indexes.tsx` (display only; trend formula and sort unchanged). Every trend shows its counts — "▲ 67% (5 vs 3, small sample)" — and windows with fewer than 10 deals in both are marked **small sample**; sectors with no prior-window deals show "— (N vs 0)". Column header "12m trend (deals vs prior 12m)". "Hottest sector" → **"Largest 12-month change"** with "· 5 vs 3 deals (small sample)". Table foot explains the counts and the threshold.
*Verification:* `tsc -b`, eslint clean · Chromium: "Largest 12-month change Software +67% 12m · 5 vs 3 deals (small sample)" · Preparation 1440/390: 0 errors, axe 0, no overflow.

### G2 — Mislabels
*Closed by:* `pages/Indexes.tsx` (labels). "Active buyers" → **"Distinct acquirers (all years)"** (what `activeBuyers` counts in `exit-engines/src/market/indexes.ts`); header description adds "mostly source-cited entries that are not yet verified"; heatfield foot "Hover a sector for figures" → "The same figures are in the index table below." (the heatfield is hidden from assistive tech since G4); file comment "verified registry events" corrected.
*Verification:* eslint clean · Chromium: 0 "Active buyers" / "Hover a sector"; new header present.

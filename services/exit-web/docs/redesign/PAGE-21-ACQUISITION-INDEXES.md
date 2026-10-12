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
| G1 | **Trends on tiny counts; "hottest sector" decided by a few deals.** | Show the counts beside each trend ("5 vs 3"); mark trends under 10 deals in both windows "small sample"; the hottest-sector metric shows its counts. | ☐ |
| G2 | Mislabels: "Active buyers" (all-time distinct acquirers); "verified" comment; hover-only heatfield. | "Distinct acquirers (all years)"; comment corrected; heatfield hidden with the table as its text equivalent. | ☐ |
| G3 | Fake live tape. | `RegistryTape`. | ☐ |
| G4 | Design: no `h1`, contrast failures, unfocusable scroll region, sort semantics. | Rebuild on `xo` (`Chip` sort, `ScrollRegion`). | ☐ |

---

## Closure log

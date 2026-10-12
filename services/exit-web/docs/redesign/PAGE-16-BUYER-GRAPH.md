# ExitOS redesign · Page 16 — Buyer Graph

| | |
|---|---|
| Route | `/console/buyer-graph` |
| Component | `src/pages/BuyerGraph.tsx` (234 lines) + `lib/buyer-dna.ts` |
| NAV | "Buyer Graph", founder, **Preparation or Active Mandate** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `fa0dd24`)

### Purpose
The acquisition-DNA registry: index size, a ranked "who is most likely to buy you" table, DNA cards for up to 30 buyers (filterable by type and search), and similar transactions in the company's sector. Links to each buyer's profile (Page 17) and a PDF report.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Index counts, DNA cards | `buyer_dna.json` (registry snapshot, Wikipedia · Wikidata · EDGAR), as-of date shown | Registry ✓ |
| **"Acquisition probability" / "Prob %"** | `acquisitionProbability()`: appetite base 50 / 32 / 14 / 2 + 0.34 × sector overlap (≤ 34) + 2.5 × deals per year (≤ 14) + recency (10 / 5 / 2) | **A composite score labelled a probability** |
| Ranking and "Your overlap" | sector tokens fixed to the **demo company** (logistics) | Demo, unlabelled; does not follow a saved intake although `sectorTokensFor()` exists |
| "Similar transactions · logistics freight — N matching your sector" | `sector_transactions.json`, 17 rows matched by **keyword** on the demo tokens (e.g. "delivery" matches *Cameyo — virtual app delivery*); each row carries `verification_status` (e.g. "unverified") that is not shown | Keyword match presented as sector comparables; verification hidden; fixed to the demo sector |
| "Active acquirers — with live cadence" | same number as "With acquisition DNA" (≥ 1 indexed event) | **Duplicate metric, "live" claim** |
| Recommended action per card ("Initiate NDA outreach", "Warm introduction via the banker" …) | rule on appetite × overlap | Rule, unlabelled |
| Tape | registry snapshot | Fake live (pinging) |
| Type filters / search | buttons without pressed state; input without label | Accessibility |

### Baseline (Preparation)
`h1` none · axe color-contrast ×11 (1440), scrollable region not focusable (390) · no overflow · 0 errors. Free: Upgrade page.

## Gap register — Page 16
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Composite score labelled "probability".** | "Likelihood score (composite)" with its formula; "not a probability". | ☐ |
| G2 | **Keyword-matched transactions presented as sector comparables; verification hidden.** | Title "Transactions matching the sector keywords"; per-row verification status; note that keyword matches can include unrelated deals. | ☐ |
| G3 | Duplicate "Active acquirers — with live cadence"; recommended actions unlabelled. | Remove the duplicate; label actions "suggested (rule)". | ☐ |
| G4 | Ranking and overlap fixed to the demo company. | Tokens from `sectorTokensFor(loadActiveCompany().sector)`; badge; transactions labelled as the demo sector when the company's sector differs. | ☐ |
| G5 | Fake live tape. | `RegistryTape`. | ☐ |
| G6 | Design: no `h1`, 11 contrast failures, unfocusable scroll region, filter semantics. | Rebuild on `xo` (`Chip`s, labelled search, `ScrollRegion`). | ☐ |

---

## Closure log

# ExitOS redesign · Page 06 — Network Intelligence

| | |
|---|---|
| Route | `/console/network` |
| Component | `src/pages/Network.tsx` (168 lines) |
| NAV | "Network Intelligence", group Market Intelligence, role founder, **Active Mandate (Pro)** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `84c1cbb`)

### Purpose
Shows the founder the platform's compounding data assets ("five moats"): the deal graph, the buyer graph, deal intelligence, the agents and the founder lifecycle — with figures from the acquisition history and the engines.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Acquirer mandates 31 · events · disclosed value | `MARKET.buyers` (curated registry), `HISTORY` | Registry |
| Median close / premium / closed rate / closes measured | `DEAL_INTEL` over `HISTORY` | Registry-derived |
| Buyer A / B cards | `buyerDna("Amazon Strategic", 80, "Rare")`, `buyerDna("Pritzker Private Capital", 60, "Aggressive")` — hard-coded names (silent fallback to the first candidate), **retention = hard-coded base 80/60 ± 6/8**, **earnout tendency = hard-coded "Rare"/"Aggressive"** | **Invented attributes** |
| ARR multiple on those cards | `VALUATION_CANONICAL.mid × (1+premium) / SAMPLE ARR` | Hypothetical for the demo company, unlabelled |
| "Buyer DNA on 12+ acquirers — measured, not guessed"; "Buyer dossiers 12 · live engine runs" | `BUYERS.candidates.length` (top-12 cap) | Mislabel / live claim |
| Agents: "The Outreach Agent **qualified** 12 buyers", "The Diligence Agent **prepared** N packages", "Eight agents do the work — 'the agent contacted the buyers'" | engine outputs | **Overclaim** — nothing is contacted; these are engine results |
| "Every acquisition teaches the system… smarter than most advisors"; "learns… LOI structures, SPA clauses, earnout models, escrow patterns" | prose | Unsupported claims |
| Tape, reactors | registry snapshot | Fake live (pinging tape) |
| Company | `SAMPLE_COMPANY` always | Demo, unlabelled |

### Baseline (Active Mandate)
`h1` none · axe color-contrast ×3 (1440) · no overflow · 0 errors.

## Gap register — Page 06
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Invented buyer attributes** (retention %, earnout tendency) and hard-coded buyer picks. | Show the active company's top two ranked buyers with measured fields only: expected days to cash, average disclosed premium (or the framework prior, labelled), and the implied ARR multiple labelled as a what-if. Retention and earnout tendency removed — no data. | ☐ |
| G2 | **Overclaims** about agents and learning; "12+ acquirers measured" (top-12 cap); "live engine runs". | Factual wording: what the engines produced; registry sizes named correctly; learning claims limited to what exists. | ☐ |
| G3 | Fake live tape. | `RegistryTape` with snapshot date. | ☐ |
| G4 | Demo company unlabelled. | Run on `loadActiveCompany()`; badge. | ☐ |
| G5 | Design: no `h1`, 3 contrast failures, card soup. | Rebuild on `xo`. | ☐ |

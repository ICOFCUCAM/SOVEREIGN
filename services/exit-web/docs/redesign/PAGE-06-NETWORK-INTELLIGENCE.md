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
| G1 | **Invented buyer attributes** (retention %, earnout tendency) and hard-coded buyer picks. | Show the active company's top two ranked buyers with measured fields only: expected days to cash, average disclosed premium (or the framework prior, labelled), and the implied ARR multiple labelled as a what-if. Retention and earnout tendency removed — no data. | ☑ `a48e5f6` |
| G2 | **Overclaims** about agents and learning; "12+ acquirers measured" (top-12 cap); "live engine runs". | Factual wording: what the engines produced; registry sizes named correctly; learning claims limited to what exists. | ☐ |
| G3 | Fake live tape. | `RegistryTape` with snapshot date. | ☐ |
| G4 | Demo company unlabelled. | Run on `loadActiveCompany()`; badge. | ☐ |
| G5 | Design: no `h1`, 3 contrast failures, card soup. | Rebuild on `xo`. | ☑ `47f2964` |

---

## Closure log

### G5 — Design
*Closed by:* `pages/Network.tsx` rebuilt on `xo` (`PageHeader` `h1`, four network metrics, reactors, each moat a labelled `Section`, buyer cards as `h3` + definition lists, lifecycle links). Content carried over verbatim; G1–G4 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Active Mandate 1440/390: 0 errors, `h1` 1, no overflow, axe **0** (was 3), 12 tab stops all with visible focus.

### G1 — Invented buyer attributes
*Closed by:* `pages/Network.tsx`. `buyerDna(name, retentionBase, earnout)` (hard-coded "Amazon Strategic"/"Pritzker", retention 80/60 ± 6/8, earnout "Rare"/"Aggressive") replaced by `buyerFacts()` over the company's **two top-ranked buyers**: probability, expected days to cash, premium (the buyer's disclosed average capped at 40 %, else the framework prior for its type — labelled "(prior)"), and a "what-if ARR multiple" with its formula. Retention and earnout tendency are removed and the card says why ("not measured").
*Verification:* Chromium demo: "Ranked #1 … 89% probability · Flexport Strategic · Days to cash 37d · Premium (prior) +28% · What-if ARR multiple 7.3×" · eslint clean · 0 errors.

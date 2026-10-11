# ExitOS redesign · Page 06 — Network Intelligence

| | |
|---|---|
| Route | `/console/network` |
| Component | `src/pages/Network.tsx` (168 lines) |
| NAV | "Network Intelligence", group Market Intelligence, role founder, **Active Mandate (Pro)** |
| Status | All five gaps closed. Part of the all-pages run; reviewed together at the end. |

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
| G2 | **Overclaims** about agents and learning; "12+ acquirers measured" (top-12 cap); "live engine runs". | Factual wording: what the engines produced; registry sizes named correctly; learning claims limited to what exists. | ☑ `231f41e` |
| G3 | Fake live tape. | `RegistryTape` with snapshot date. | ☑ `e365168` |
| G4 | Demo company unlabelled. | Run on `loadActiveCompany()`; badge. | ☑ `b914148` |
| G5 | Design: no `h1`, 3 contrast failures, card soup. | Rebuild on `xo`. | ☑ `47f2964` |

---

## Closure log

### G5 — Design
*Closed by:* `pages/Network.tsx` rebuilt on `xo` (`PageHeader` `h1`, four network metrics, reactors, each moat a labelled `Section`, buyer cards as `h3` + definition lists, lifecycle links). Content carried over verbatim; G1–G4 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Active Mandate 1440/390: 0 errors, `h1` 1, no overflow, axe **0** (was 3), 12 tab stops all with visible focus.

### G1 — Invented buyer attributes
*Closed by:* `pages/Network.tsx`. `buyerDna(name, retentionBase, earnout)` (hard-coded "Amazon Strategic"/"Pritzker", retention 80/60 ± 6/8, earnout "Rare"/"Aggressive") replaced by `buyerFacts()` over the company's **two top-ranked buyers**: probability, expected days to cash, premium (the buyer's disclosed average capped at 40 %, else the framework prior for its type — labelled "(prior)"), and a "what-if ARR multiple" with its formula. Retention and earnout tendency are removed and the card says why ("not measured").
*Verification:* Chromium demo: "Ranked #1 … 89% probability · Flexport Strategic · Days to cash 37d · Premium (prior) +28% · What-if ARR multiple 7.3×" · eslint clean · 0 errors.

### G2 — Overclaims
*Closed by:* `pages/Network.tsx` (text only).
| Before | After |
|---|---|
| "The Outreach Agent qualified 12 buyers"; "The Diligence Agent prepared N packages…"; "Eight agents do the work — 'the agent contacted the buyers.'" | "Buyer discovery ranks 12 buyers…"; "Diligence checks list N document packages and flag M open items"; "Autonomous Exit lays this work out as agent steps you approve one by one. Nothing is sent to a buyer without your approval." |
| "Every acquisition teaches the system — the AI grows smarter than most advisors"; "learns… LOI structures, SPA clauses, earnout models, escrow patterns… fed back into every recommendation" | "Measured from the source-referenced deal history"; figures recomputed on each registry refresh and used by the valuation and buyer engines; "Deal terms — LOI structure, SPA clauses, earnouts, escrow — are not yet learned from recorded deals." |
| "Buyer DNA on 12+ acquirers — measured, not guessed"; "Buyer dossiers 12 · live engine runs" | "Buyer DNA covers 1,476 acquirers in the registry (snapshot as of 2026-10-11); the ranking below uses the 31 curated mandates"; "Ranked buyers 12 · top 12 for this company" |
| footer "…and the live engine runs" | "…and the engines for this company" |
*Verification:* Chromium text checked · eslint clean · 0 errors.

### G3 — Fake live tape
*Closed by:* `pages/Network.tsx`: pinging `MarketTape` → dated `RegistryTape`; acquisition reactor foot names the snapshot date ("Rotation is decorative").
*Verification:* Chromium (Active Mandate): 0 "live" words, 0 pinging elements · eslint clean · 0 errors.

### G4 — Demo company unlabelled
*Closed by:* `pages/Network.tsx` — buyer discovery, diligence and the console value (`canonicalValuationFor`) run on `loadActiveCompany()`; header badge "Demo company · Helios Freight" / "Your intake · {name}". `pages/Intake.tsx` "Where your figures are used" lists Network Intelligence.
*Verification:* Chromium: demo → top buyer Flexport Strategic (logistics); saved intake "Northwind Analytics" (enterprise SaaS) → Vista Enterprise, YOUR INTAKE badge · 0 errors.

---

## Final verification
`tsc -b` pass · eslint 0 errors · `vitest` all pass · Chromium Active Mandate 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus · personalisation demo vs intake checked.

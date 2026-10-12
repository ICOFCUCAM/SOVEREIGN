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
| G1 | **Composite score labelled "probability".** | "Likelihood score (composite)" with its formula; "not a probability". | ☑ `71c53d1` |
| G2 | **Keyword-matched transactions presented as sector comparables; verification hidden.** | Title "Transactions matching the sector keywords"; per-row verification status; note that keyword matches can include unrelated deals. | ☑ `b06ece9` |
| G3 | Duplicate "Active acquirers — with live cadence"; recommended actions unlabelled. | Remove the duplicate; label actions "suggested (rule)". | ☑ `b73b6d4` |
| G4 | Ranking and overlap fixed to the demo company. | Tokens from `sectorTokensFor(loadActiveCompany().sector)`; badge; transactions labelled as the demo sector when the company's sector differs. | ☑ `8f9fac1` |
| G5 | Fake live tape. | `RegistryTape`. | ☑ G5-commit |
| G6 | Design: no `h1`, 11 contrast failures, unfocusable scroll region, filter semantics. | Rebuild on `xo` (`Chip`s, labelled search, `ScrollRegion`). | ☑ `a1ba835` |

---

## Closure log

### G6 — Design
*Closed by:* `pages/BuyerGraph.tsx` rebuilt on `xo` (`PageHeader` `h1` with the sources and as-of date in the badge and the PDF report announced as a new tab; five metrics; decorative reactor hidden from assistive tech; both tables with row headers inside keyboard-reachable `ScrollRegion`s; type filters as `Chip` toggles with `aria-pressed`; labelled search; DNA cards as a list with `h3`s and definition lists; source links named per buyer). Content carried over verbatim; G1–G5 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 11 contrast + 1 unfocusable scroll region), all tab stops with visible focus.

### G1 — Composite score labelled "probability"
*Closed by:* `pages/BuyerGraph.tsx` (labels; `acquisitionProbability()` unchanged). "Acquisition probability · who is most likely to buy you" → "Acquisition likelihood score · …"; column "Prob" → "Score"; values "N%" → "N/100"; tooltip "composite score (appetite + overlap + velocity + recency), not a probability"; foot gives the formula: appetite (high 50, medium 32, low 14) + sector overlap × 0.34 (max 34) + deals per year × 2.5 (max 14) + recency (10 / 5 / 2 within 18 / 36 / 60 months) — "A composite score, not a probability."
*Verification:* `tsc -b`, eslint clean · Chromium: 0 "Acquisition probability" / "Prob"; header "Score" · Preparation 1440/390: 0 errors, axe 0, no overflow.

### G2 — Keyword matches presented as sector comparables; verification hidden
*Closed by:* `pages/BuyerGraph.tsx`. "Similar transactions · {sector} — N matching your sector" → **"Transactions matching the sector keywords · {sector}" — "17 keyword matches · 0 verified"**. New **Verification** column per row (the record's `verification_status`, linked to its source; all 17 are "unverified" in the snapshot). The foot says rows match on industry text and can include unrelated deals (e.g. "delivery" in software — Cameyo, virtual app delivery, is one of them), then the source note and as-of date.
*Verification:* `tsc -b`, eslint clean · Chromium: "17 keyword matches · 0 verified"; 0 "matching your sector" · Preparation 1440/390: 0 errors, axe 0, no overflow.

### G3 — Duplicate metric; unlabelled suggested actions
*Closed by:* `pages/BuyerGraph.tsx`. "Active acquirers — with live cadence" removed (it repeated "With acquisition DNA" and claimed "live"). Each card's action reads "Suggested (rule): …", and the DNA section foot lists the rule (high appetite with overlap → NDA outreach; high without overlap → monitor; medium with overlap → warm introduction; no indexed events → registry presence only; otherwise deprioritise) — matching `recommendedAction()`.
*Verification:* `tsc -b`, eslint clean · Chromium: 0 "live cadence"; "Suggested (rule): …" on cards.

### G4 — Ranking and overlap fixed to the demo company
*Closed by:* `pages/BuyerGraph.tsx`, `lib/buyer-dna.ts` (`recommendedAction(p, tokens?)` — additive optional parameter, default unchanged). Ranking, "Your overlap" and suggested actions use `sectorTokensFor(loadActiveCompany().sector)`; the ranking foot names the company and its keywords; eyebrow and **Demo data / Your intake** badge. The transaction file only holds keyword matches for the demo sector, so for another sector the section title adds "(demo company's sector)". `pages/Intake.tsx` lists "Buyer Graph (ranking)".
*Verification:* `tsc -b`, eslint clean, `vitest` 204/204 · scratch test: the demo ranking with `sectorTokensFor("logistics_freight")` is identical to the previous fixed tokens (top 12 unchanged) · Chromium: demo → "Ranked for Helios Freight (sector keywords: logistic, freight, …)"; intake → "Ranked for Northwind Analytics (sector keywords: software, saas, enterprise, …)", YOUR INTAKE, transactions marked as the demo company's sector.

### G5 — Fake live tape
*Closed by:* `pages/BuyerGraph.tsx`: pinging `MarketTape` → dated `RegistryTape`.
*Verification:* Chromium: 0 "live" words, 0 pinging elements, snapshot date shown · free (Upgrade page), Preparation and Active Mandate 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus.

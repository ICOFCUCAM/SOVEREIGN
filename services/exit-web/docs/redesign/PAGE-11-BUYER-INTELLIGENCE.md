# ExitOS redesign · Page 11 — Buyer Intelligence

| | |
|---|---|
| Route | `/console/buyer-copilot` |
| Component | `src/pages/BuyerCopilot.tsx` (187 lines) |
| NAV | "Buyer Intelligence", group Market Intelligence, role founder, **Preparation or Active Mandate** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `b2e9a16`)

### Purpose
A dossier for each of the top eight ranked acquirers: likelihood, an expected price range, days to close, prior deals, risk, synergy, close rate, a recommended opening number and a "Buyer DNA" profile; a banker's take on whom to approach first.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Buyer list (8) | `DEAL_BUYERS` — the demo deal context, ranked by **expected outcome** | Engine; header says "ranked by likelihood" (**mislabel**) |
| "Likelihood" | `candidate.probability` — the discovery engine's weighted **fit score** | Model; reads as a measured chance of a bid |
| "Expected range" | low = value × (0.82 + 0.12 × fit); high = value × (1 + premium capped at 20 %) | Heuristic, unexplained |
| "Recommended open" | top of range × 1.1 | Rule, unexplained ("anchor above headline") |
| Risk / Synergy | rules on retrade history and confidence tier / on three fit dimensions | Rules, unexplained |
| Days to close, prior deals, close rate | expected-outcome model, buyer history | Engine / registry |
| **Buyer DNA**: founder-friendly %, earnout usage, negotiation style, integration, legal aggression, decision makers | `DNA_BY_TYPE` — one fixed profile per buyer **type**, founder-friendly = type base ± retrade | **Invented per-buyer attributes** (same class as the retention/earnout figures removed on Page 06) |
| Typical premium | buyer's disclosed average (capped 40 %) or the framework prior | Registry / prior (prior unlabelled) |
| "ExitOS scores … for every buyer from their measured deal history"; "the things a founder could never see"; "{buyer} redeploys into the next target while you wait" | — | Overclaim / invented urgency |
| "Draft outreach" → `/console/banker` | link | Outreach needs Active Mandate; a Preparation founder lands on the Upgrade page without warning |
| Tape | registry snapshot | Fake live (pinging) |
| Company | demo deal context | Demo, unlabelled |

### Baseline
Preparation / Active Mandate: `h1` none · axe color-contrast ×40 (1440) · no overflow · 0 errors. Free: Upgrade page.

## Gap register — Page 11
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Invented Buyer DNA** (founder-friendly %, earnout, negotiation, integration, legal aggression, decision makers by type). | Remove; keep the typical premium with its source (disclosed average or framework prior, labelled). Say why the rest is absent. | ☑ `5f62647` |
| G2 | **Unlabelled heuristics** ("likelihood", "expected range", "recommended open", risk, synergy) and the wrong ranking label. | Name each as a model or rule with its formula; "ranked by expected outcome"; fit probability "not a measured chance of a bid". | ☑ `274b5b7` |
| G3 | Overclaims and invented urgency. | Plain wording. | ☑ G3-commit |
| G4 | Hidden plan gate on "Draft outreach". | `requiredEngagement` label for Preparation. | ☐ |
| G5 | Demo company unlabelled. | `dealContextFor(loadActiveCompany())` and the company's own value; badge. | ☐ |
| G6 | Fake live tape. | `RegistryTape`. | ☐ |
| G7 | Design: no `h1`, 40 contrast failures, old primitives. | Rebuild on `xo`. | ☑ `90519d7` |

---

## Closure log

### G7 — Design
*Closed by:* `pages/BuyerCopilot.tsx` rebuilt on `xo` (`PageHeader` `h1` "Buyer Intelligence" — the navigation name, "Buyer Copilot" kept in the badge — four summary metrics, banker's take as a page-local definition list (shared `BankerTake` no longer used here), dossiers as an ordered list with `h3` per buyer and definition lists; risk and synergy carry their word, not only colour). Content carried over verbatim; G1–G6 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation and Active Mandate 1440/390: 0 errors, `h1` 1, no overflow, axe **0** (was 40), 13 tab stops all with visible focus.

### G1 — Invented Buyer DNA
*Closed by:* `pages/BuyerCopilot.tsx`. `buyerDNA()` and `DNA_BY_TYPE` removed: founder-friendly % (type base ± retrade), earnout usage, negotiation style, integration, legal aggression and decision makers were one fixed profile per buyer *type* shown as each buyer's own. Kept: **typical premium** via `typicalPremium()`, labelled by source — "(disclosed avg)" capped at 40 %, or "(type prior)" from the Valuation Constitution. The dossier foot says the other traits are not measured per buyer and so are not shown.
*Verification:* `tsc -b`, eslint clean · Chromium: 0 matches for Founder-friendly / Legal / Decision makers; "Typ. premium (disclosed avg) +40%" on the first dossier · Active Mandate 1440/390: 0 errors, axe 0, no overflow.

### G2 — Unlabelled heuristics and the wrong ranking label
*Closed by:* `pages/BuyerCopilot.tsx` (labels and one foot; formulas unchanged).
| Before | After |
|---|---|
| "Acquirers scored — ranked by likelihood" | "Buyers shown — top ranked by expected outcome" (the list's actual order) |
| "Likelihood", "Top likelihood", "highest acquisition likelihood at X%" | "Fit probability", "Fit probability · #1", "ranked first by expected outcome (fit probability X%)" |
| "Expected range", "Exp. range" | "Indicative range" ("heuristic, see below") |
| "Recommended open — anchor above headline" | "Opening ask (rule) — 10% above the indicative high" |
| "Risk", "Synergy" | "Risk (rule)", "Synergy (rule)" |
Dossier foot gives each rule: fit probability = the engine's weighted fit score, not a measured chance of a bid; range low = value × (0.82 + 0.12 × fit), high = value × (1 + premium: disclosed average or 12 % strategic / 4 % other, capped at 20 %); opening ask = high + 10 %; risk and synergy thresholds.
*Verification:* `tsc -b`, eslint clean · Chromium: the only "likelihood" left is the G3 sentence; 0 "Expected range" / "Recommended open" / "anchor above" · Active Mandate 1440/390: 0 errors, axe 0, no overflow.

### G3 — Overclaims and invented urgency
*Closed by:* `pages/BuyerCopilot.tsx` (text only).
| Before | After |
|---|---|
| "If you wait — Acquisition windows close — {buyer} redeploys into the next target while you wait." | "The ranking reflects the registry snapshot; a buyer's appetite can change, and nothing here tracks it over time." |
| "ExitOS does it — ExitOS scores likelihood, timing, risk and synergy for every buyer from their measured deal history." | "What ExitOS does — Ranks buyers with the discovery engine and applies the stated rules to each buyer's recorded deal history. Nothing is sent from this page." |
| File comment "the things a founder could never see … acquisition likelihood … expected price range" | describes fit probability, indicative range and rules |
*Verification:* eslint clean · Chromium: 0 matches for redeploys / could never see / measured deal history / likelihood.

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
| G1 | **Invented Buyer DNA** (founder-friendly %, earnout, negotiation, integration, legal aggression, decision makers by type). | Remove; keep the typical premium with its source (disclosed average or framework prior, labelled). Say why the rest is absent. | ☐ |
| G2 | **Unlabelled heuristics** ("likelihood", "expected range", "recommended open", risk, synergy) and the wrong ranking label. | Name each as a model or rule with its formula; "ranked by expected outcome"; fit probability "not a measured chance of a bid". | ☐ |
| G3 | Overclaims and invented urgency. | Plain wording. | ☐ |
| G4 | Hidden plan gate on "Draft outreach". | `requiredEngagement` label for Preparation. | ☐ |
| G5 | Demo company unlabelled. | `dealContextFor(loadActiveCompany())` and the company's own value; badge. | ☐ |
| G6 | Fake live tape. | `RegistryTape`. | ☐ |
| G7 | Design: no `h1`, 40 contrast failures, old primitives. | Rebuild on `xo`. | ☑ G7-commit |

---

## Closure log

### G7 — Design
*Closed by:* `pages/BuyerCopilot.tsx` rebuilt on `xo` (`PageHeader` `h1` "Buyer Intelligence" — the navigation name, "Buyer Copilot" kept in the badge — four summary metrics, banker's take as a page-local definition list (shared `BankerTake` no longer used here), dossiers as an ordered list with `h3` per buyer and definition lists; risk and synergy carry their word, not only colour). Content carried over verbatim; G1–G6 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation and Active Mandate 1440/390: 0 errors, `h1` 1, no overflow, axe **0** (was 40), 13 tab stops all with visible focus.

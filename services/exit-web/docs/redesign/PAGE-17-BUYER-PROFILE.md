# ExitOS redesign · Page 17 — Buyer Profile (`/console/buyer/:id`)

| | |
|---|---|
| Route | `/console/buyer/:id`, guarded by `/console/buyer-graph` |
| Component | `src/pages/BuyerProfile.tsx` (340 lines) |
| NAV | none (reached from Buyer Graph, Terminal and other buyer links); founder, **Preparation or Active Mandate** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `754f926`)

### Purpose
One indexed buyer's dossier: likelihood for the founder's company and the buyer's appetite score, an acquisition forecast (expected value, premium, close), headline DNA, a strategic rationale, contact intelligence (public outreach paths, engagement stats, enrichment providers), the expected outcome under this buyer, the acquisition profile, similar companies acquired and acquisition signals with the appetite-score breakdown. "Express interest" and a PDF briefing book.

### Data flow
| Element | Source | Nature |
|---|---|---|
| DNA, similar acquisitions, signals, contact paths | `buyer_dna.json` registry, `buyer-contact.ts` | Registry ✓ (feed signals and enrichment providers honestly marked not connected) |
| **"Probability · your company N%"**, forecast "Probability N% — for a company like yours" | `acquisitionProbability()` — the composite score (see Page 16 G1) | **Composite labelled a probability** |
| Expected offer / close | `expectedOutcomeFor(p, baseline)`, baseline = **demo** institutional financial baseline; priors labelled | Model; demo company |
| "Why {buyer} would acquire Helios Freight", overlap, rationale, contact registry tokens | `SAMPLE_COMPANY` / default (demo) tokens | Demo, unlabelled — the Terminal links here with a saved intake |
| "Express interest" → "✓ Interest captured"; "Captured to your deal activity — the behavioral signal that sharpens engagement intelligence" | `captureDealEvent` → **localStorage** on this browser | Nothing reaches the buyer, which the page does not say; "sharpens engagement intelligence" overclaims |
| Every page view | `captureDealEvent("viewed_buyer")` silently (localStorage) | Local only; comment "capture the view forever — the behavioral data that becomes the moat" |
| "{buyer} currently exhibits N acquisition signals" | snapshot-derived signals | "Currently" from a dated snapshot |
| "indexed node-side" | — | Jargon |
| Buyer-not-found state | old `SectionHeader` | Old design |

### Baseline (Preparation, `/console/buyer/microsoft`)
`h1` 1 · axe 0 · no overflow · 0 errors.

## Gap register — Page 17
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Composite score labelled "probability".** | "Likelihood score N/100 (composite)" with the formula reference; forecast tile likewise. | ☑ `3bf0e42` |
| G2 | **"Express interest" implies an effect it does not have.** | Say what it does: saved to deal activity on this browser; the buyer is not notified. Drop "sharpens engagement intelligence". | ☑ G2-commit |
| G3 | Snapshot wording ("currently exhibits", "node-side"). | "in the registry snapshot (as of …)"; "not in the bundled extract". | ☐ |
| G4 | Demo company unlabelled. | Company, tokens and institutional baseline from `loadActiveCompany()` (as the Terminal does); badge. | ☐ |
| G5 | Design: old primitives (found and not-found states). | Rebuild on `xo`. | ☑ `bc01f3f` |

### X14 — Terminal (Page 01, approved) calls the same composite a probability — documented here
The Terminal shows `rankedBuyers().probability.pct` as "N% likely", "N% probability", "N% likely to acquire a company like {company}". It is the composite from Page 16 G1, not a probability. Fix after Page 17, in its own commit, logged in `PAGE-01-TERMINAL.md`: wording only, the same "likelihood score N/100" used on Pages 16 and 17.

---

## Closure log

### G5 — Design
*Closed by:* `pages/BuyerProfile.tsx` rebuilt on `xo` (back link with a 24 px target; `PageHeader` `h1` = buyer, Express interest and the PDF briefing book as header actions; two score metrics; forecast and headline DNA as definition lists and metrics; rationale, contact intelligence, expected outcome, acquisition profile, similar acquisitions (row headers, `ScrollRegion`) and signals as labelled `Section`s with `h3`s; appetite drivers show "v/max" in text; signals carry "(active)/(inactive)" for screen readers; external links announced as new tabs; the not-found state uses the same header). Content carried over verbatim; G1–G4 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation `/console/buyer/microsoft` 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus; `/console/buyer/nope` (not found) 390: `h1` 1, axe 0.

### G1 — Composite score labelled "probability"
*Closed by:* `pages/BuyerProfile.tsx` (labels). "Probability · your company N%" → **"Likelihood score · your company N/100"** with "Composite: appetite + sector overlap + velocity + recency — not a probability (formula on the Buyer Graph). Suggested (rule): …"; forecast tile "Probability N% — for a company like yours" → "Likelihood score N/100 — composite, not a probability". "Expected value" and "Expected to close" were "probability-weighted"; they are offer × close rate (`expectedOutcomeFor`), so now "close-rate-weighted".
*Verification:* `tsc -b`, eslint clean · Chromium: the only "probability" on the page is "not a probability"; 0 "N%" likelihood values.

### G2 — "Express interest" implied an effect it does not have
*Closed by:* `pages/BuyerProfile.tsx` (text and a comment). "Captured to your deal activity — the behavioral signal that sharpens engagement intelligence." → **"'Express interest' and your visits to this page are saved to your deal activity in this browser only. {buyer} is not notified."** (Both events go to `captureDealEvent`, whose adapter is localStorage.) The code comment "capture the view forever — the behavioral data that becomes the moat" now says what happens. Behaviour unchanged.
*Verification:* eslint clean · Chromium: new sentence present, 0 "sharpens".

# ExitOS redesign · Page 01 — Acquisition Intelligence Terminal

| | |
|---|---|
| Route | `/console` (index route inside `/console/*`) |
| Component | `src/pages/Terminal.tsx` |
| Access policy | `/console` — role **founder** (`lib/access.ts` NAV "Intelligence Terminal"); no plan gate on the page itself. Free plan renders `BuyerInterestGate` above it. |
| Status | Gaps documented below; each is closed in its own commit and marked here. |

Process rule for this page: **document a gap → close it → verify → mark it closed**, one at a time.

---

## Stage A — Audit of the original (baseline commit `f31cbb7`)

### Purpose and user
A founder (or their advisor) evaluating a company for exit: *what is it worth, who is most likely to buy, how ready is it, and what should I do next.*

### Data flow (traced, not assumed)
| Figure on page | Source | Nature |
|---|---|---|
| Company name, sector, ARR, TTM, growth, EBITDA margin | `loadActiveCompany()` → `localStorage["exitos.intake.v1"]` via `buildProfile`, else `SAMPLE_COMPANY` ("Helios Freight") | **Company-provided** (intake) or **demo fixture** |
| Enterprise value low/mid/high, financial baseline | `runInstitutionalValuation(company)` (`exit-engines/valuation/institutional.ts`) | **Model-derived** |
| Applied premium, range, basis (`in_sector` / `market_prior` / `neutral_prior`), note | `INST.premium` | Model-derived from precedent premiums; may be a **neutral prior (assumption)** |
| Confidence score, tier, 5 drivers, note | `INST.confidence` | Model-derived |
| Qualified / scored buyer universe | `INST.buyerUniverse` | Model-derived over the registry |
| Time to close (low–high days) | `INST.timeToClose` | Model-derived |
| Comparable transactions (target, buyer, date, price, premium, **status, rationale, sourceRef**) | `INST.comparableTransactions` | **Registry records** (verification status per row) |
| Disclaimer, provenance summary, methodologies | `INST.disclaimer`, `INST.provenanceSummary`, `INST.methodologies` | Required disclosures |
| Readiness score → projected, weaknesses with uplift | `runReadinessAnalysis(company, runReadiness(company))` | Model-derived |
| Ranked buyers (8) + probability breakdown (appetite, overlap, velocity, recency, rationale) | `rankedBuyers(8, tokens)` (`lib/buyer-dna.ts`) over `buyer_dna.json` (1,476 profiles, **as of 2026-10-08**) | Registry-derived score (transparent composite) |
| Expected offer / close-weighted value, premium & close known-vs-prior | `expectedOutcomeFor(profile, baselineMid)` | Model-derived; unknown premium (20%) and close rate (55%) are **labelled neutral priors** |
| Buyer rationale (thesis + points) | `buyerRationale(...)` | Registry-derived |
| Per-buyer data confidence, `source_url`, events indexed / verified / disclosed | `buyerConfidence(p)`, DNA profile fields | Registry provenance |
| Appetite top 7 | `acquisitionAppetiteScore(p)` | Registry-derived |
| Strategic themes | `strategicThemes(8)` | Registry-derived |
| Market tape, reactor, telemetry | `buildMarketTape()`, `ACQ_INDEXES`, `MARKET_INTEL` | **Bundled registry snapshot** (`ingest_manifest.json` generated **2026-10-08T12:50Z**) — not a live feed |

### Sections (top → bottom)
1. `BuyerInterestGate` (free plan only) — 12 buyer matches, upgrade CTA.
2. Command header — layer badge, "◉ Mandate", company, sector tag, **"ACTIVE" badge**, ARR/TTM/growth/EBITDA/"AS OF *today*"; 7 equal metrics; lead-buyer sentence.
3. Market tape (animated ticker, pulsing "Tape" dot).
4. Command state strip — current / changes / action / outcome.
5. Grid: Buyer rankings (8 rows, why▾ expanders, evidence tooltip) · rail (live telemetry, market signals, action queue) · similar transactions · appetite · reactor · confidence drivers · strategic themes.
6. Footer: demo/personalised note.

### Actions and navigation (all must survive)
Buyer name → `/console/buyer/:id`; why▾ toggle; evidence tooltip; "full ranking" → `/console/buyer-graph`; action queue → `/console/banker`, `/console/readiness` (×3), `/console/nda`, `/console/documents`; "market map" → `/console/market-map`; "Value My Company" → `/console/intake`; BuyerInterestGate CTA.

### States
No loading (synchronous engines). Empty states exist for comparables and themes. Free plan shows the gate. No error state (engines are pure).

### Baseline verification
| Check | Result |
|---|---|
| `tsc -b` | pass |
| `eslint src` | 3 errors / 2 warnings — in `PublishComposer.tsx`, `banker-directives.ts`, `Autopilot.tsx` (not this page) |
| `vitest run` | 26 files, **168/168 pass** |
| Browser (Chromium, free founder) 1440/900/390 | no page errors, no horizontal overflow |
| axe (1440) | `color-contrast` ×6 (serious), `page-has-heading-one`, `scrollable-region-focusable` (serious) |

---

## Gap register — Page 01

Status: ☐ open · ☑ closed (commit noted)

| # | Gap | Evidence | Fix (without changing any calculation) | Status |
|---|---|---|---|---|
| G1 | **Fake-live indicators.** Hard-coded `status="Active"`; "Intelligence rail · live telemetry"; pulsing "Tape" dot; "AS OF" = today's date. The data is a bundled snapshot dated 2026-10-08. | `Terminal.tsx:79,85,177`; `workstation.tsx:75` | Replace with the real data state (*Personalised from your intake* / *Demo company*) and the real snapshot date (`DNA_AS_OF`); label registry panels "Indexed · as of …". No pulsing live dot. | ☐ |
| G2 | **Mislabelled decision metrics.** "Typical premium" shows the *lead buyer's* premium; "Median close" shows the *lead buyer's* close days beside "12 comps". | `Terminal.tsx:50-51,91-92` | Label them as the lead buyer's figures and show the framework's applied premium (with its basis) and time-to-close range (`INST.timeToClose`) as separate, correctly named figures. | ☐ |
| G3 | **Duplicate panel.** "Market signals · indexed" lists exactly the same `comps` as "Similar transactions". | `Terminal.tsx:180-192` vs `211-226` | One comparables table (with status, source, rationale). Replace the duplicate with real sector signals from `ACQ_INDEXES` (company's sector + largest movers). | ☐ |
| G4 | **Provenance hidden.** Per-buyer confidence, source URL, events indexed/verified/disclosed, probability breakdown, comparable status/sourceRef, premium basis note, confidence note, disclaimer — computed but never shown. | engine/DNA fields above | Evidence drawer per buyer and a provenance/methodology section with the disclaimer. | ☐ |
| G5 | **Ambiguous expected value.** "Expected value $102M–$102M" is two different measures (close-weighted, offer) shown as a range; priors marked only by `*`. | `Terminal.tsx:152-154` | Separate "Expected offer" and "Close-weighted" columns; mark priors in words ("prior") with an explanation, not an asterisk alone. | ☐ |
| G6 | **Weak hierarchy.** Seven metrics equally prominent; the decision (who to approach, what it's worth) competes with secondary telemetry. | screenshot | Mandate band → valuation hero with range → decision metrics → buyer intelligence as the centre → evidence → execution rail → supporting intelligence (progressive disclosure). | ☐ |
| G7 | **Execution rail hides plan gates.** Outreach, NDA and Documents are Pro (or Starter) surfaces; a free founder clicking them hits the paywall unannounced. | `lib/access.ts` NAV `pro`/`starter` | Mark each action with its real access requirement using `needsUpgrade()`; links unchanged. | ☐ |
| G8 | **Accessibility.** 6 contrast failures, no `h1`, keyboard-unreachable scroll region, `why▾` lacks `aria-expanded`, probability bar is colour-only decoration. | axe baseline | Contrast-checked tokens, one `h1`, focusable scroll regions, proper disclosure buttons, numeric labels for every bar. | ☐ |
| G9 | **No design system for ExitOS's next pages.** Shared `workstation.tsx` primitives serve 4 pages; restyling them would change pages not yet reviewed. | `workstation.tsx` header comment | Add an additive ExitOS design system (`xo` tokens + `src/components/xo/`) used by the Terminal only; other pages unchanged until their turn. | ☐ |

### Defects found outside this page (recorded, not changed)
| # | Defect | Where | Recommendation |
|---|---|---|---|
| X1 | **Security:** signing in with one hard-coded e-mail address grants `superadmin` + `pro` entirely client-side; any visitor can type it. The address is also personal data in source. | `src/lib/auth.tsx` `signIn` | Remove; derive roles server-side from the real auth provider. Needs owner decision. |
| X2 | Client-side "auth" accepts any e-mail/password (demo session, `fakeToken`). | `src/lib/auth.tsx` | Expected for the demo; must not ship as production auth. |
| X3 | Pre-existing lint errors (3). | see baseline | Separate clean-up. |

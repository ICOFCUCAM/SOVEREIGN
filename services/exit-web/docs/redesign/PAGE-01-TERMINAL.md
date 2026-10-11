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
| Ranked buyers (8) + probability breakdown (appetite, overlap, velocity, recency, rationale) | `rankedBuyers(8, tokens)` (`lib/buyer-dna.ts`) over `buyer_dna.json` (`buyer_dna.json` `as_of`; **2026-10-08** at audit, refreshed to **2026-10-11** by the daily radar commit `f31cbb7`) | Registry-derived score (transparent composite) |
| Expected offer / close-weighted value, premium & close known-vs-prior | `expectedOutcomeFor(profile, baselineMid)` | Model-derived; unknown premium (20%) and close rate (55%) are **labelled neutral priors** |
| Buyer rationale (thesis + points) | `buyerRationale(...)` | Registry-derived |
| Per-buyer data confidence, `source_url`, events indexed / verified / disclosed | `buyerConfidence(p)`, DNA profile fields | Registry provenance |
| Appetite top 7 | `acquisitionAppetiteScore(p)` | Registry-derived |
| Strategic themes | `strategicThemes(8)` | Registry-derived |
| Market tape, reactor, telemetry | `buildMarketTape()`, `ACQ_INDEXES`, `MARKET_INTEL` | **Bundled registry snapshot** (`ingest_manifest.json` `generated_at`, currently **2026-10-11T12:09Z**) — not a live feed |

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
| G1 | **Fake-live indicators.** Hard-coded `status="Active"`; "Intelligence rail · live telemetry"; pulsing "Tape" dot; "AS OF" = today's date. The data is a bundled snapshot (`DNA_AS_OF`, currently 2026-10-11). | `Terminal.tsx:79,85,177`; `workstation.tsx:75` | Replace with the real data state (*Personalised from your intake* / *Demo company*) and the real snapshot date (`DNA_AS_OF`); label registry panels "Indexed · as of …". No pulsing live dot. | ☑ `b11cc29` |
| G2 | **Mislabelled decision metrics.** "Typical premium" shows the *lead buyer's* premium; "Median close" shows the *lead buyer's* close days beside "12 comps". | `Terminal.tsx:50-51,91-92` | Label them as the lead buyer's figures and show the framework's applied premium (with its basis) and time-to-close range (`INST.timeToClose`) as separate, correctly named figures. | ☑ `68f3512` |
| G3 | **Duplicate panel.** "Market signals · indexed" lists exactly the same `comps` as "Similar transactions". | `Terminal.tsx:180-192` vs `211-226` | One comparables table (with status, source, rationale). Replace the duplicate with real sector signals from `ACQ_INDEXES` (company's sector + largest movers). | ☑ `72f57f3` |
| G4 | **Provenance hidden.** Per-buyer confidence, source URL, events indexed/verified/disclosed, probability breakdown, comparable status/sourceRef, premium basis note, confidence note, disclaimer — computed but never shown. | engine/DNA fields above | Evidence drawer per buyer and a provenance/methodology section with the disclaimer. | ☐ |
| G5 | **Ambiguous expected value.** "Expected value $102M–$102M" is two different measures (close-weighted, offer) shown as a range; priors marked only by `*`. | `Terminal.tsx:152-154` | Separate "Expected offer" and "Close-weighted" columns; mark priors in words ("prior") with an explanation, not an asterisk alone. | ☐ |
| G6 | **Weak hierarchy.** Seven metrics equally prominent; the decision (who to approach, what it's worth) competes with secondary telemetry. | screenshot | Mandate band → valuation hero with range → decision metrics → buyer intelligence as the centre → evidence → execution rail → supporting intelligence (progressive disclosure). | ☐ |
| G7 | **Execution rail hides plan gates.** Outreach, NDA and Documents are Pro (or Starter) surfaces; a free founder clicking them hits the paywall unannounced. | `lib/access.ts` NAV `pro`/`starter` | Mark each action with its real access requirement using `needsUpgrade()`; links unchanged. | ☐ |
| G8 | **Accessibility.** 6 contrast failures, no `h1`, keyboard-unreachable scroll region, `why▾` lacks `aria-expanded`, probability bar is colour-only decoration. | axe baseline | Contrast-checked tokens, one `h1`, focusable scroll regions, proper disclosure buttons, numeric labels for every bar. | ☐ |
| G9 | **No design system for ExitOS's next pages.** Shared `workstation.tsx` primitives serve 4 pages; restyling them would change pages not yet reviewed. | `workstation.tsx` header comment | Add an additive ExitOS design system (`xo` tokens + `src/components/xo/`) used by the Terminal only; other pages unchanged until their turn. | ☑ `7b04e58` |

### Defects found outside this page (recorded, not changed)
| # | Defect | Where | Recommendation |
|---|---|---|---|
| X1 | **Security:** signing in with one hard-coded e-mail address grants `superadmin` + `pro` entirely client-side; any visitor can type it. The address is also personal data in source. | `src/lib/auth.tsx` `signIn` | Remove; derive roles server-side from the real auth provider. Needs owner decision. |
| X2 | Client-side "auth" accepts any e-mail/password (demo session, `fakeToken`). | `src/lib/auth.tsx` | Expected for the demo; must not ship as production auth. |
| X3 | Pre-existing lint errors (3). | see baseline | Separate clean-up. |
| X4 | Shell ribbon shows "● ExitOS **Live**" with a pulsing dot on every console page, over snapshot data. | `src/components/InstitutionalRibbon.tsx:45` (shared chrome, all pages) | Relabel to the snapshot date when the shell is reviewed; not changed here because it is shared by every page. |

---

## Gap closure log

### G9 — ExitOS design system (additive)
*Documented:* gap register row G9. *Closed by:* `tailwind.config.ts` `xo` palette + `src/components/xo/`.

| Token | Hex | Use | Contrast (measured) |
|---|---|---|---|
| `xo-ink` / `xo-panel` / `xo-raise` | `#0b1220` / `#101a2b` / `#16233a` | command surfaces | — |
| `xo-text` | `#e8edf5` | primary text on dark | 14.8:1 on panel |
| `xo-muted` | `#a3b1c6` | secondary text | 8.0:1 on panel |
| `xo-faint` | `#8796ad` | labels, captions | 5.2:1 on raise (worst case) |
| `xo-verified` | `#34d399` | verified / positive | 9.1:1 |
| `xo-action` | `#7cb2ff` | actions, links | 8.0:1 |
| `xo-brass` | `#c9a86a` | restrained institutional accent | 7.7:1 |
| `xo-caution` | `#fbbf24` | assumption / prior / plan gate | 10.4:1 |
| `xo-risk` | `#f87171` | negative trend | 6.3:1 |
| `xo-paper` + `paper-text` / `paper-muted` / `verified-ink` / `action-ink` | `#f6f4ef` + … | light editorial reading surface | 14.5 / 6.3 / 5.0 / 6.1 : 1 |

Components: `Provenance` (verified · registry · model · prior · your intake · demo · snapshot — never "live"), `Section` (landmark + real heading), `ScrollRegion` (focusable), `Metric`, `Bar` (always numeric; fill `aria-hidden`), `Disclosure` (`aria-expanded`/`aria-controls`), `ActionLink`, `Fact`.

Not changed: `lib/workstation.tsx` and the `ink`/`deal`/`loi`/`stage` tokens, so Buyer Graph, Acquisition Radar and Founder Inbox are unaffected.

Verification: `tsc -b` pass · `eslint` on new files clean · `src/components/xo/xo.test.tsx` **6/6 pass** (bar label + clamping, disclosure state, labelled landmark, focusable region, provenance wording).

### G1 — Fake-live indicators
*Documented:* gap register row G1 (before the change). *Closed by:* `Terminal.tsx`, new `components/xo/RegistryTape.tsx`.

| Before | After |
|---|---|
| `status="Active"` (hard-coded) | `Your intake` or `Demo company` — from `loadActiveCompany().fromIntake` |
| `AS OF` = `new Date()` (today) | `REGISTRY AS OF` = `DNA_AS_OF` (snapshot date in `buyer_dna.json`) |
| `MarketTape` — animated ticker, pinging "Tape" dot | `RegistryTape` — static, scrollable, keyboard-focusable strip; each entry dated; badge "Registry · as of …"; platform events labelled "Your activity" |
| "Intelligence rail · live telemetry" | "Registry extremes · as of …" |
| Reactor foot "from the live sector indexes" | "sector indexes snapshot as of … Rotation is decorative." |
| Footer "composed live" | "computed from … (registry snapshot as of …)" |

Shared `MarketTape`/`CommandHeader` were not edited (other pages still use them). The shell ribbon's "Live" label is outside this page → recorded as X4.

Verification: `tsc -b` pass · eslint clean on changed files · Chromium free + pro at 1440/390: 0 page errors, no horizontal overflow; pro plan hides the buyer-interest gate as before.

### G2 — Mislabelled decision metrics
*Documented:* gap register row G2. *Closed by:* `Terminal.tsx` (labels and sources only; no calculation changed).

Observed on the demo company (Helios Freight) before the change: header "Typical premium **+41%**" and "Median close **178d**" — both were Microsoft's own disclosed figures. The valuation framework actually applies **+43%** (market-wide prior, 14 precedents) and its time-to-close range is **27–257d**.

| Before | After |
|---|---|
| Typical premium = `lead.profile.premium_pct ?? INST.premium.appliedPct` | **Applied premium** = `INST.premium.appliedPct`, qualifier names the basis (`in_sector` / `market_prior` / `neutral_prior`) with sample size and range |
| Median close = `lead.profile.median_close_days ?? INST.timeToClose.lowDays`, sub "12 comps" | **Time to close** = `INST.timeToClose` low–high, sub "announced → closed · ranked acquirers" |
| Lead buyer's figures unlabelled | Lead sentence: "Microsoft's own record: premium +41% · median close 178d" — or "not disclosed" (no silent fallback) |
| Expected outcome "close ~178d" | "close 27–257d" |

Verification: `tsc -b` pass · eslint clean · Chromium pro 1440/390: 0 errors, no overflow; rendered text checked (above figures).

### G3 — Duplicate panel
*Documented:* gap register row G3. *Closed by:* `Terminal.tsx`, new `lib/sector-signals.ts` (+ test).

- "Market signals · indexed" (a second copy of the comparables) is replaced by **Sector signals**: the company's sectors (explicit, reviewable map `SECTOR_INDEX_MAP` from intake keys to the index taxonomy; a test asserts every mapped name exists in the snapshot) followed by the busiest sectors in the last 12 months. Each row shows **counts (12m vs prior 12m)** before the trend, because samples are small.
- Honest finding surfaced: for the demo company (logistics) the mapped sectors — Supply Chain, Transportation, Logistics — show **0 vs 0** acquisitions in the last 12 months of the snapshot. The old panel hid this.
- The single **Comparable transactions** table now carries headers, status, days to close, "undisclosed" instead of "—" for price, and a per-row source (`sourceRef` type) with the engine's comparability rationale on hover/focus.

Verification: `tsc -b` pass · eslint clean · `sector-signals.test.ts` **4/4 pass** · Chromium pro 1440/900/390: 0 errors, no overflow.

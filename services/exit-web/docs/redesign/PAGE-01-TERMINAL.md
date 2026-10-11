# ExitOS redesign · Page 01 — Acquisition Intelligence Terminal

| | |
|---|---|
| Route | `/console` (index route inside `/console/*`) |
| Component | `src/pages/Terminal.tsx` |
| Access policy | `/console` — role **founder** (`lib/access.ts` NAV "Intelligence Terminal"); no plan gate on the page itself. Free plan renders `BuyerInterestGate` above it. |
| Status | All nine gaps (G1–G9) closed, each in its own commit, marked below. **Awaiting review — Page 02 not started.** |

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
| G4 | **Provenance hidden.** Per-buyer confidence, source URL, events indexed/verified/disclosed, probability breakdown, comparable status/sourceRef, premium basis note, confidence note, disclaimer — computed but never shown. | engine/DNA fields above | Evidence drawer per buyer and a provenance/methodology section with the disclaimer. | ☑ `0d59a69` |
| G5 | **Ambiguous expected value.** "Expected value $102M–$102M" is two different measures (close-weighted, offer) shown as a range; priors marked only by `*`. | `Terminal.tsx:152-154` | Separate "Expected offer" and "Close-weighted" columns; mark priors in words ("prior") with an explanation, not an asterisk alone. | ☑ `e66e427` |
| G6 | **Weak hierarchy.** Seven metrics equally prominent; the decision (who to approach, what it's worth) competes with secondary telemetry. | screenshot | Mandate band → valuation hero with range → decision metrics → buyer intelligence as the centre → evidence → execution rail → supporting intelligence (progressive disclosure). | ☑ `16e31a3` |
| G7 | **Execution rail hides plan gates.** Outreach, NDA and Documents are Pro (or Starter) surfaces; a free founder clicking them hits the paywall unannounced. | `lib/access.ts` NAV `pro`/`starter` | Mark each action with its real access requirement using `needsUpgrade()`; links unchanged. | ☑ `fde2f99` |
| G8 | **Accessibility.** 6 contrast failures, no `h1`, keyboard-unreachable scroll region, `why▾` lacks `aria-expanded`, probability bar is colour-only decoration. | axe baseline | Contrast-checked tokens, one `h1`, focusable scroll regions, proper disclosure buttons, numeric labels for every bar. | ☑ `7cc77c3` |
| G9 | **No design system for ExitOS's next pages.** Shared `workstation.tsx` primitives serve 4 pages; restyling them would change pages not yet reviewed. | `workstation.tsx` header comment | Add an additive ExitOS design system (`xo` tokens + `src/components/xo/`) used by the Terminal only; other pages unchanged until their turn. | ☑ `7b04e58` |

### Defects found outside this page (recorded, not changed)
| # | Defect | Where | Recommendation |
|---|---|---|---|
| X1 | **Security:** signing in with one hard-coded e-mail address grants `superadmin` + `pro` entirely client-side; any visitor can type it. The address is also personal data in source. | `src/lib/auth.tsx` `signIn` | Remove; derive roles server-side from the real auth provider. Needs owner decision. |
| X2 | Client-side "auth" accepts any e-mail/password (demo session, `fakeToken`). | `src/lib/auth.tsx` | Expected for the demo; must not ship as production auth. |
| X3 | Pre-existing lint errors (3). | see baseline | Separate clean-up. |
| X5 | Shell chrome accessibility: the ribbon (`InstitutionalRibbon.tsx:38`) is a horizontally scrolling region with no keyboard focus (`scrollable-region-focusable`), and ribbon / layer-bar / sub-nav labels at `text-white/30–35`, 8–10.5 px fail contrast (axe, observed once the page is scrolled). | `components/InstitutionalRibbon.tsx`, `LayerBar.tsx`, `LayerSubNav.tsx` (every page) | Fix with the shell review. |
| X6 | `buyerConfidence()` rates a buyer "High" from events indexed + disclosed values without considering `verified_events` (e.g. Microsoft: High, 419 indexed, **0 verified**). Shown side by side in the drawer so the reader sees both. | `lib/buyer-dna.ts` | Product decision whether verification should weigh in. |
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

### G5 — Ambiguous expected value
*Documented:* gap register row G5. *Closed by:* `Terminal.tsx` (presentation only; `expectedOutcomeFor` unchanged).

| Before | After |
|---|---|
| One column "Expected value" = `expectedClose–expectedOffer`, e.g. "$48M–$87M" read as a range | Two columns: **Expected offer** ($87M) and **Close-weighted** ($48M) |
| Undisclosed premium / close rate marked `*` | Word tag **PRIOR** (amber, with a tooltip) on premium, close rate — and on **Days**, which silently fell back to the framework's low end |
| Foot: "Probability = appetite × sector overlap × velocity × recency" | "appetite **+** sector overlap **+** velocity **+** recency" — `acquisitionProbability` sums the components; the old caption misdescribed it |
| Formula unstated | Foot states the formula with the actual baseline ($72M for the demo company) and the prior values (20 % / 55 %) |

Verification: `tsc -b` pass · eslint clean · Chromium pro 1440/390: 0 errors, no overflow; rendered table text checked.

### G7 — Execution rail hides plan gates
*Documented:* gap register row G7. *Closed by:* `Terminal.tsx` (reads `NAV`, `PLAN_LABEL`, `needsUpgrade` from `lib/access.ts`; access policy itself not modified, route `Guard` still enforces).

Each action shows "Requires …" and a lock instead of the arrow when `needsUpgrade(to, role, plan)` is true. The label comes from the NAV entry: `starter` surfaces → "Preparation or Active Mandate", other `pro` surfaces → "Active Mandate". Links are unchanged — a gated click still reaches the Upgrade page through the Guard.

Measured in Chromium (1440):

| Plan | Gates shown |
|---|---|
| free | Outreach → Active Mandate · NDA → Active Mandate · CIM/Documents → Preparation or Active Mandate |
| prep | Outreach → Active Mandate · NDA → Active Mandate |
| pro | none |

Readiness actions are open to every founder and show no gate. Verification: `tsc -b` pass · eslint clean · 0 page errors. Known: buyer-table header contrast (3.82:1, pre-existing style; the new column adds one node) → G8.

### G6 — Weak hierarchy
*Documented:* gap register row G6. *Closed by:* `Terminal.tsx` layout rewritten on the `xo` system; the data/logic block above `return` is unchanged except where earlier gaps already changed it.

New reading order (top → bottom):
1. **Mandate** — `h1` company name, sector, data-state badge (Demo data / Your intake), firmographics as a definition list, one sentence on data state + registry snapshot date (absorbs the old footer note and its "Value My Company" link).
2. **Value + decision metrics** — Enterprise value hero (midpoint 40 px, low/mid/high printed, band visual with the pre-premium baseline marked) beside six metrics, each with a provenance badge: most likely buyer, qualified buyers, confidence, applied premium, time to close, readiness.
3. **Decision brief** — where you stand · market context · recommended next move · expected outcome (replaces `CommandState`).
4. Lead-buyer sentence (thesis + their own disclosed record).
5. **Buyer intelligence** (8 cols) beside **Next actions** + **Sector signals** (4 cols). Execution now sits next to the ranking it derives from.
6. **Evidence** — comparable transactions + confidence drivers.
7. **Supporting market intelligence** — collapsed `<details>` with the registry tape, appetite, reactor, registry extremes and themes.

Corrections made while restructuring:
- Decision brief said "**7 acquirers active in your space**" — `ACTIVE` is the global top-7 by appetite, so it was always 7 and not sector-specific. Now: "311 acquirers with indexed activity" (`activeAcquirers`), and the comparables line adds the latest comparable date from `provenanceSummary`.
- The shared `CommandHeader`'s layer badge ("L II") is dropped on this page; the shell's layer bar already shows it.

Functions preserved (checked): buyer links `/console/buyer/:id` (table, metric, brief, lead sentence, appetite list), Why disclosure per buyer, evidence tooltips, Full ranking → `/console/buyer-graph`, every action link, Market map → `/console/market-map`, Value My Company → `/console/intake`, `BuyerInterestGate` on free plan.

Verification: `tsc -b` pass · eslint clean · Chromium free + pro at 1440/900/390: 0 page errors, no horizontal overflow · axe (1440, free and pro): `page-has-heading-one` and all `color-contrast` findings **gone**; one `scrollable-region-focusable` remains → G8.

### G4 — Provenance hidden
*Documented:* gap register row G4. *Closed by:* `Terminal.tsx` (reads fields the engines already return).

1. **Per-buyer evidence drawer** (the old "why▾" row, now "Evidence"): rationale points · the probability **decomposed** into appetite / sector overlap / velocity / recency with each component's maximum, plus the engine's rationale string · evidence base: `buyerConfidence`, events indexed, verified events, events with disclosed value, last dated acquisition, and a link to the registry `source_url` (new tab, announced to screen readers).
2. **"How these figures were produced"** on the light editorial surface (`tone="paper"`): valuation methods with basis, multiple, weight and midpoint; premium basis note; confidence note; comparables note; sources behind the figures (`provenanceSummary.bySource`) with its note and the registry snapshot date; the framework **disclaimer** in full.
3. Comparable rows already carry status and source from G3.

Example (demo company, Microsoft): probability 74% = appetite 50 + overlap … ; data confidence High; 419 events indexed; **0 verified**; 130 with disclosed value — see X6.

Verification: `tsc -b` pass · eslint clean · Chromium: drawer opens by keyboard (Enter), `aria-expanded` false → true, `aria-controls` points at the drawer row; section text checked (methods 60 % revenue multiple / 40 % EBITDA multiple; 34 figures by source; disclaimer present) · 0 page errors · axe on this page's content clean; remaining findings are shell chrome → X5.

### G8 — Accessibility
*Documented:* gap register row G8. *Closed by:* the `xo` primitives (G9) adopted in G6, plus this commit (heading in the supporting-intelligence summary, focus rings on in-text links, `data-page="terminal"` root used to scope checks).

| Baseline finding | Now |
|---|---|
| `color-contrast` ×6 (table headers 3.82:1, gate text) | 0 on page content — all text uses `xo` tokens ≥ 5.2:1 |
| `page-has-heading-one` | one `h1` (company name); h2 per region; h3 inside drawers, the methodology section and supporting panels |
| `scrollable-region-focusable` (page tables) | tables sit in `ScrollRegion` (`role=region`, named, `tabIndex=0`) |
| why▾ without state | `Disclosure` button: `aria-expanded`, `aria-controls`, screen-reader text "Evidence for {buyer}" |
| colour-only bars | every `Bar` prints its number; fill is `aria-hidden`; EV band is `aria-hidden` with low/mid/high printed |
| lock glyph | `aria-hidden`; requirement given in words ("Requires Active Mandate") |

Measured (Chromium, `reducedMotion: reduce`, one evidence drawer and the supporting section open; axe 4 rules wcag2a/aa, 21a/aa, 22aa, best-practice, scoped to `[data-page=terminal]`):

| Plan · width | Page errors | `h1` | axe violations | Tab stops | Without visible focus |
|---|---|---|---|---|---|
| free · 1440 | 0 | 1 | **0** | 56 | 0 |
| free · 390 | 0 | 1 | **0** | 56 | 0 |
| pro · 1440 | 0 | 1 | **0** | 56 | 0 |
| pro · 390 | 0 | 1 | **0** | 56 | 0 |

Not covered here: shell chrome findings (X5). Screen-reader testing with a real AT (NVDA/VoiceOver) was **not performed** — NOT VERIFIED.

---

## Final verification (after G1–G9)
| Check | Result |
|---|---|
| `tsc -b` | pass |
| `eslint src` | 3 errors / 2 warnings — the same pre-existing ones (X3); none in changed files |
| `vitest run` | **28 files, 178/178 pass** (baseline 168 + 6 design-system + 4 sector-signal tests) |
| `vite build` | pass (existing chunk-size warning) |
| Browser | see G8 table; also 900 px checked during G6 |

---

## Closing the defects found outside this page (X1–X6)

Requested by the owner after the Page 01 review ("START FIXING"). Same rule: document → fix → verify → mark.

### X1 — Client-side superadmin bootstrap by hard-coded e-mail (security)
*Documented before the fix.* `src/lib/auth.tsx` grants `superadmin` + `pro` to anyone who signs in with one hard-coded address; auth is entirely in the browser, so any visitor can type it. The address (personal data) is also shipped in the production bundle and listed in `src/pages/Admin.tsx` sample data.

*Fix:* no role can be secured in the browser, so the production build gets **no** e-mail-based elevation at all. A local-development operator path remains: `VITE_EXITOS_DEV_OPERATOR_EMAIL`, honoured only when `import.meta.env.DEV` is true (the branch is removed from production builds). The decision is a pure, tested function. The address is removed from source and from the Admin sample row.

*Consequence the owner should know:* in production nobody reaches the Admin console via this shortcut any more. Production admin access needs server-side roles (e.g. a Supabase `app_metadata.role` claim checked by the backend). The address remains in git history; rewriting history is a separate decision.

*Verification:* `tsc -b` pass · eslint clean · `auth.test.ts` 2/2 · production `vite build` bundle contains neither the address nor the operator path · Chromium (dev server with `VITE_EXITOS_DEV_OPERATOR_EMAIL=ops@example.com`): the old address → founder console; `ops@example.com` → operator console; any other address → founder console. *Status:* ☑ `e6900b6`

### X2 — Demo sign-in presented as real authentication
*Documented before the fix.* `auth.tsx` accepts any non-empty e-mail/password and builds the session in the browser. The sign-in page does not say so, and it implies two things that do not happen: "Continue with Google / Apple / Microsoft" never contacts those providers (it signs in as `founder@google.com` etc.), and "Send reset link" reports "a password-reset link is on its way" although nothing is sent.

*Fix (honesty, not new auth):* a visible demo-access notice on the sign-in page; provider buttons labelled "(demo)"; the reset confirmation states that no e-mail was sent and that any password works in the demo. All controls and flows are kept. Real authentication (e.g. Supabase e-mail/password or OAuth, with server-checked roles — this also completes X1) is a separate project and is **not** done here.

*Verification:* `tsc -b` pass · eslint clean · Chromium 1280/390: notice visible, reset flow shows the no-e-mail message as a `status`, axe (WCAG A/AA) on the sign-in page 0 violations, 0 page errors. Sign-in itself is unchanged, and the screenshot scripts still sign in with it. *Status:* ☑ `412b48b` (honesty fix; real auth still outstanding)

### X3 — Pre-existing lint errors
*Documented before the fix.* `eslint src`: 3 errors — two `no-unused-expressions` (a ternary used as a statement to add/remove from a Set in `PublishComposer.tsx:23` and `Autopilot.tsx:112`) and one `prefer-const` (`banker-directives.ts:201`). *Fix:* rewrite the ternaries as `if/else` and make the binding `const`; no behaviour change. The 2 `exhaustive-deps` warnings (`DealActivity.tsx:32` and one more `useCallback`, both listed by `eslint src`) change memoisation if "fixed" mechanically, so they are left as warnings for the owning pages' reviews.

*Verification:* `eslint src` **0 errors**, 2 warnings (left on purpose, above) · `tsc -b` pass · `vitest run` 29 files, **180/180 pass** (banker-directives tests included). *Status:* ☑ `2804a21`

### X4 — Shell ribbon claims "Live" over snapshot data
*Documented before the fix.* `InstitutionalRibbon.tsx` (shown on every console page) opens with a pinging dot + "ExitOS **Live**". Its vitals are computed once from the bundled registry snapshot. In `lib/market-ribbon.ts`, "Buyer Activity" is hard-coded `dir: "up"`, so it always shows ▲ although the figure is a count with no trend behind it. The UTC clock is genuinely live and stays.

*Fix:* static dot, "ExitOS" + "Registry · <snapshot date>" (from `DNA_AS_OF`); remove the unconditional ▲ on Buyer Activity (Market Status keeps its arrow — it is computed from the sector trends).

*Verification:* `tsc -b` pass · eslint clean · Chromium: ribbon reads "ExitOS · Registry · 2026-10-11 · Market Status Mixed · Buyer Activity 21 …" (no ▲), 0 pinging elements in the console, 0 page errors. *Status:* ☑ `c45a539`

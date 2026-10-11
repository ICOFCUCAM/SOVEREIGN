# ExitOS redesign · Page 04 — Acquisition Radar (buyer command center)

| | |
|---|---|
| Route | `/console/acquisition-radar` |
| Component | `src/pages/AcquisitionRadar.tsx` (276 lines) |
| NAV | "Acquisition Radar", group Market Intelligence, roles **founder, buyer**, no plan gate |
| Status | All six gaps closed (documented first, one commit each). Part of the all-pages run; reviewed together at the end. |

## Stage A — Audit (baseline commit `b0ab855`)

### Purpose and user
A buyer (or a founder looking from the buyer side) sets an acquisition mandate — sectors, size, regions, growth, themes — and sees the listed companies scored against it, then acts: follow, publish, express interest (request NDA), submit an indicative offer. Below: sector intelligence for the chosen sectors.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Mandate form | local state; hydrated from `myMandate()`; saved by `saveMandate()` | Buyer-provided |
| Opportunities | `allListings()` = stored listings **plus seeds**: `lst-demo-helios` (the demo company) and `lst-sov-*` (Sovereign product catalog entries) | Founder listings / **demo + catalog seeds, unlabelled** |
| Match score + reasons | `matchCompanyToCriteria(profile, criteria)` | Model |
| Sector watch, reactor, telemetry, tape | `ACQ_INDEXES`, `buildMarketTape()`, `ReactorTelemetry` | Registry snapshot (2026-10-11) |
| Follow | `captureDealEvent("added_to_outreach")` on **every click, including unfollow** | Telemetry |
| Express interest | 2 deal events + `requestNda(listing)` + `startDeal(listing, "nda_requested")` | Writes records the founder sees |
| Submit offer | `submitOffer(listing, $M×1e6)` + `startDeal` → `advanceDeal("ioi")` | Writes an offer record |
| Publish | `PublishComposer` (social publish of the anonymised listing) | — |

### Baseline verification (measured)
| Check | Result |
|---|---|
| Founder free/pro 1440/390, buyer free 1440 | 0 page errors, no overflow |
| `h1` | **none** |
| axe | `color-contrast` ×11 (3.82:1, labels) |
| Typing `2.5` into "Min check ($M)" | shows **`25`** |
| Mandate readers | `myMandate()` is called only by this page; **no founder surface reads buyer mandates** |
| "Min/Max check ($M)" | filters the listed company's **TTM revenue** (`matchCompanyToCriteria`), not deal size |
| Offer validation | `if (!m) return` — negative amounts are not rejected |

## Gap register — Page 04
| # | Gap | Evidence | Fix (no scoring/engine change) | Status |
|---|---|---|---|---|
| G1 | **Fake-live indicators.** Pinging "Tape", "Intelligence rail · live telemetry", "Live ExitOS Acquisition Indexes", "live listings", reactor "across the network". | `AcquisitionRadar.tsx`, shared `MarketTape` | Snapshot-dated labels; `RegistryTape`; "listings", not "live listings". | ☑ `ab60b00` |
| G2 | **Demo and catalog listings shown as live opportunities.** The demo company and Sovereign product-catalog seeds appear in the scored pool unlabelled. | `listings.ts` SEEDS | Badge each: "Demo listing" / "Product catalog"; count founder listings separately. | ☑ `1118d65` |
| G3 | **Overclaims.** Toast "Mandate published — founders can now match it" and "matchable by founders" — nothing reads mandates. "Follow" logs "added to outreach" on follow **and** unfollow. | code | "Mandate saved" + plain note that founders don't see mandates yet; log only on follow. | ☑ `61d8902` |
| G4 | **Inputs wrong or unvalidated.** "Min/Max check" actually filter company revenue; `2.5` → 25; min > max accepted; offers accept negatives and decimals are not guarded. | measured | Rename to "Target revenue (min/max, $M)"; reuse the Page 03 parsing rules; validate min ≤ max and offer > 0 with messages. | ☑ `c21e177` |
| G5 | **Consequential actions without saying what happens.** "Express interest" sends an NDA request and opens a deal in one click; "Submit offer" records an indicative offer — neither says who sees what. | code | Inline confirmation naming the effect (founder receives the request/offer; identity revealed on NDA signature); same calls. | ☑ G5-commit |
| G6 | **Design system, hierarchy, accessibility.** No `h1`; 11 contrast failures; chip toggles without `aria-pressed`; old workstation primitives. | axe, code | Rebuild on `xo`: header with `h1` → mandate (left) → scored opportunities (centre) → sector watch; toggles with `aria-pressed`. | ☑ `3c91fff` |

---

## Closure log

### G6 — Design system, hierarchy, accessibility
*Closed by:* `pages/AcquisitionRadar.tsx` rebuilt on `xo`; new shared `PageHeader`, `Chip` (`aria-pressed`) and `XO_INPUT`/`XO_LABEL` in `components/xo` (+ 2 tests). Order: header (`h1`, mandate summary line) → four mandate metrics → decision brief → mandate form (left, `fieldset`/`legend`, labelled inputs) beside scored opportunities (centre, each an `h3`, match reasons with screen-reader "Meets/Does not meet") → reactor + sector watch table. All handlers, telemetry and API calls unchanged; labels carried over verbatim (fixed in G1–G5).

*Verification:* `tsc -b`, eslint clean · xo tests 8/8 · Chromium founder free/pro 1440/390 and buyer free/pro 1440: 0 errors, `h1` 1, no overflow, axe **0** (was colour-contrast ×11), keyboard: every stop (80 sampled) has visible focus.

### G1 — Fake-live indicators
*Closed by:* `pages/AcquisitionRadar.tsx`. Pinging `MarketTape` → static `RegistryTape` dated to the registry snapshot; "Intelligence rail · live telemetry" → "Registry extremes · Snapshot · as of 2026-10-11"; "live listings" → "listings" (3 places); reactor and sector-watch feet name the snapshot date ("Rotation is decorative").
Left as is: the "Live market" **tag** on Sovereign product-catalog listings (`lib/sovereign-intel.ts`) — it describes products being on the market, not a data feed.

*Verification:* `tsc -b`, eslint clean · Chromium: 0 pinging elements, 2 snapshot-date mentions; remaining "live" text = the catalog tag only · axe 0 · 0 errors.

### G2 — Demo and catalog listings shown as live opportunities
*Closed by:* `lib/listings.ts` (`listingOrigin()`: founder / demo / catalog, + test) and `pages/AcquisitionRadar.tsx`. Each card carries **Demo listing** or **Product catalog**; the qualified-opportunities metric reads "of 43 listings · 0 from founders, 43 demo/catalog"; the section foot explains the seeds. Scoring unchanged.

*Verification:* `listings.test.ts` 7/7 · Chromium: 1 demo + 42 catalog cards labelled; metric as above · 0 errors.

**X8 (recorded, not changed):** all 42 catalog listings show region "North America" — including UK, Norway, Germany and other national marketplaces — because `sovereignProfile()` in `lib/listings.ts` builds every catalog entry with `jurisdiction: "US"`. The correct HQ per product is owner information; not guessed here.

### G3 — Overclaims
*Closed by:* `pages/AcquisitionRadar.tsx`. "Publish mandate" → **Save mandate**; toast "Mandate published — founders can now match it" → "Mandate saved to your account"; "matchable by founders" → "Saved to your account and used for scoring here. Founders don't see buyer mandates yet." Follow records the `added_to_outreach` event only when following, not again on unfollow. `saveMandate` itself unchanged.

*Verification:* Chromium (events read through the app's own `deal-events` module): before 0 → follow 1 → unfollow still 1 (was 2); Follow button `aria-pressed="true"` when following; new mandate wording shown · 0 errors.

### G4 — Inputs wrong or unvalidated
*Closed by:* `lib/intake-fields.ts` (`parseNumber`, the Page 03 rules generalised; `parseField` delegates to it; + test) and `pages/AcquisitionRadar.tsx`.
- "Min/Max check ($M)" → **Target revenue min/max ($M)** with the hint "Listed company's TTM revenue" — that is what `matchCompanyToCriteria` filters. (The saved mandate still stores the values as `minCheckUsd/maxCheckUsd`; renaming the stored fields would change the backend contract and is not done.)
- Text is kept as typed (decimals work); min > max shows "Minimum is above maximum." and scoring keeps the last valid band; header summary "Target revenue".
- Indicative offer: zero/negative → "Enter an amount above zero." (`role="alert"`), nothing submitted; valid decimals submit as before.

*Verification:* `tsc -b`, eslint clean · `intake-fields.test.ts` 5/5 · Chromium: min "2.5" → $2.5–500M (was 25); max "1" → error, band unchanged; max "600" → $2.5–600M; offer "-5" → error, not submitted; offer "12.5" → submitted · 0 errors.

### G5 — Consequential actions without saying what happens (and false success)
*Closed by:* `pages/AcquisitionRadar.tsx`.
- **Express interest** and **Submit offer** open an inline confirmation (`role="group"`) that says what happens: an NDA request reaches the listing's founder and opens a deal they can see, identity revealed only if they sign; or an indicative, non-binding offer of $X M is recorded, the deal moves to indication of interest, and the founder sees it in their inbox. Confirm / Cancel.
- **False success removed:** `requestNda` / `submitOffer` return `null` when the session isn't connected to an account backend; the page used to show "✓ NDA requested" / "✓ Offer submitted" regardless. Now the ✓ and the deal events are recorded only when a record was created; otherwise the card says "Not sent — this session isn't connected to the deal backend, so nothing reached the founder."
- The same API calls and telemetry run as before, now after confirmation and success.

*Verification:* Chromium: confirmation text shown; Cancel → 0 `nda_requested` events; Send → status "NDA request sent to the founder.", 1 event, ✓ shown, **1 NDA record on the listing** (read back via `ndaRequestsForListing`) · 0 errors. The "Not sent" path was **not exercised in the browser** (the session connects automatically here); it is the `if (!req)` / `if (!offer)` branch, checked by code review.

---

## Final verification (after G1–G6)
| Check | Result |
|---|---|
| `tsc -b` / `eslint src` | pass / 0 errors |
| `vitest run` | **203/203** |
| Chromium founder free/pro 1440/390, buyer free 1440/390 | 0 errors, 1 `h1`, no overflow, axe **0** (was 11), visible focus on every sampled stop |

## Known issues
- X8: catalog listings all claim "North America" (owner data needed).
- Buyer mandates are saved but no founder page reads them yet (stated on the page).
- The 43 listings in this build are all seeds (1 demo + 42 catalog); labelled.

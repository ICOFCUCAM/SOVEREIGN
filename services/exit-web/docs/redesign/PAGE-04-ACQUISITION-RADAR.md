# ExitOS redesign · Page 04 — Acquisition Radar (buyer command center)

| | |
|---|---|
| Route | `/console/acquisition-radar` |
| Component | `src/pages/AcquisitionRadar.tsx` (276 lines) |
| NAV | "Acquisition Radar", group Market Intelligence, roles **founder, buyer**, no plan gate |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

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
| G2 | **Demo and catalog listings shown as live opportunities.** The demo company and Sovereign product-catalog seeds appear in the scored pool unlabelled. | `listings.ts` SEEDS | Badge each: "Demo listing" / "Product catalog"; count founder listings separately. | ☑ G2-commit |
| G3 | **Overclaims.** Toast "Mandate published — founders can now match it" and "matchable by founders" — nothing reads mandates. "Follow" logs "added to outreach" on follow **and** unfollow. | code | "Mandate saved" + plain note that founders don't see mandates yet; log only on follow. | ☐ |
| G4 | **Inputs wrong or unvalidated.** "Min/Max check" actually filter company revenue; `2.5` → 25; min > max accepted; offers accept negatives and decimals are not guarded. | measured | Rename to "Target revenue (min/max, $M)"; reuse the Page 03 parsing rules; validate min ≤ max and offer > 0 with messages. | ☐ |
| G5 | **Consequential actions without saying what happens.** "Express interest" sends an NDA request and opens a deal in one click; "Submit offer" records an indicative offer — neither says who sees what. | code | Inline confirmation naming the effect (founder receives the request/offer; identity revealed on NDA signature); same calls. | ☐ |
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

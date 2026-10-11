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
| G1 | **Fake-live indicators.** Pinging "Tape", "Intelligence rail · live telemetry", "Live ExitOS Acquisition Indexes", "live listings", reactor "across the network". | `AcquisitionRadar.tsx`, shared `MarketTape` | Snapshot-dated labels; `RegistryTape`; "listings", not "live listings". | ☐ |
| G2 | **Demo and catalog listings shown as live opportunities.** The demo company and Sovereign product-catalog seeds appear in the scored pool unlabelled. | `listings.ts` SEEDS | Badge each: "Demo listing" / "Product catalog"; count founder listings separately. | ☐ |
| G3 | **Overclaims.** Toast "Mandate published — founders can now match it" and "matchable by founders" — nothing reads mandates. "Follow" logs "added to outreach" on follow **and** unfollow. | code | "Mandate saved" + plain note that founders don't see mandates yet; log only on follow. | ☐ |
| G4 | **Inputs wrong or unvalidated.** "Min/Max check" actually filter company revenue; `2.5` → 25; min > max accepted; offers accept negatives and decimals are not guarded. | measured | Rename to "Target revenue (min/max, $M)"; reuse the Page 03 parsing rules; validate min ≤ max and offer > 0 with messages. | ☐ |
| G5 | **Consequential actions without saying what happens.** "Express interest" sends an NDA request and opens a deal in one click; "Submit offer" records an indicative offer — neither says who sees what. | code | Inline confirmation naming the effect (founder receives the request/offer; identity revealed on NDA signature); same calls. | ☐ |
| G6 | **Design system, hierarchy, accessibility.** No `h1`; 11 contrast failures; chip toggles without `aria-pressed`; old workstation primitives. | axe, code | Rebuild on `xo`: header with `h1` → mandate (left) → scored opportunities (centre) → sector watch; toggles with `aria-pressed`. | ☐ |

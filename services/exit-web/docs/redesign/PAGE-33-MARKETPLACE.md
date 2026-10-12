# ExitOS redesign · Page 33 — Marketplace (Anonymous Listings / Browse Opportunities)

| | |
|---|---|
| Route | `/console/marketplace` |
| Component | `src/pages/Marketplace.tsx` (370 lines) + `lib/engines.ts` (`LISTING_PRIVATE`, `LISTING_PUBLIC`, `LISTING_MATCHES` = `createListing` / `matchBuyersToListing` on the demo company; `useMemorandum`), shared `BankerTake` |
| NAV | Founder: "Anonymous Listings" (Exchange). Buyer: "Browse Opportunities" (Marketplace). No plan gate |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `f55c055`)

### Purpose
"Become the banker": a five-step sell-side pipeline (teaser, CIM, anonymisation, buyer identification, outreach) behind a "Publish Opportunity" button; the listing in founder and public views; matched buyers; an edit-listing dialog; marketplace mechanics.

### Data flow
| Element | Source | Nature |
|---|---|---|
| **"Publish Opportunity"** pipeline | a timer advancing five steps every 850 ms; step texts from real engine artefacts (teaser and CIM from `useMemorandum`, the anonymised title, the match list) | Artefacts real ✓; **the publishing is simulated**: nothing is published, no outreach starts, yet the page then shows status **"Live"**, "**● Live · 15 buyers in outreach**", "Now live · the Shopify of company sales — your opportunity is published anonymized, **the data room is indexed**, and 15 matched buyers are **entering sequenced outreach**. Engagement signals flow straight into the negotiation engine", "● Published to marketplace" and the take "**You're live** — review the 15 buyers entering outreach". Listing on the exchange actually happens from the intake ("List on the exchange") |
| "0 Bankers hired · 1-click To full process · 100 % Founder-owned"; "ExitOS does all five, in one click, the moment you publish" | — | Marketing claims tied to the simulation |
| Asking price **$108,252,000** (band $64.7M–$183.0M) and ideal-buyer check size | `createListing` → `runValuation(…, 'strategic')` headline | **Conflicts with D1** ("use $103M everywhere" — the canonical institutional headline) |
| Matched buyers "**89 %**" (Flexport Strategic, top) | `matchScore × 100` | A match score shown as a percentage |
| **Buyer role** ("Browse Opportunities") | same page | **Buyers see the founder view by default**: "Identity (founder view): **Helios Freight**", the founder's ask band, "Edit listing", "Publish Opportunity" and the founder's matched-buyer list — the anonymisation is defeated for every buyer |
| "Request NDA" (public view) | `<Button>` with no handler | **Dead button** |
| "Edit listing" → toast "Listing updated" | local `useState` only | Not saved or published anywhere; the number field has no validation (`type=number`, any value) |
| Mechanics: "Buyers request NDA → **de-anonymized data shared**"; "Engagement signals **feed the negotiation engine**" | — | **False** — nothing reveals data on NDA (Page 29) and no engagement feed exists |
| Listing, teaser, CIM, matches | the **demo company only** | Demo **unlabelled**; saved intakes ignored |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline
Founder free and Pro, buyer free: `h1` none · axe **dlitem ×18** (`dt`/`dd` outside a `dl`) · no overflow · 0 errors · 35 tab stops.

## Gap register — Page 33
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Simulated publishing and outreach presented as live.** | "Prepare the sell-side pack": generates the four real artefacts (teaser, CIM, anonymised view, matched buyers) and says outreach is **not started** and nothing is published here; link to "List on the exchange" (intake) and to the Outreach Plan; remove "Live", "in outreach", "data room indexed", "Shopify", the manifesto figures and the one-click claim. | ☐ |
| G2 | **Buyers see the founder view (identity, ask, edit, matches).** | Buyer role gets its own view: the anonymised public listing only, no identity, no founder controls or matches; NDA requests go through the Acquisition Radar. | ☐ |
| G3 | Dead "Request NDA"; "Edit listing" claims an update. | Founder public preview has no NDA button (it says buyers request from the Radar); edit is a "preview adjustment — not saved or published", validated with `parseNumber`. | ☐ |
| G4 | **Ask band conflicts with D1; match score as %; false mechanics.** | Asking band and check size from `canonicalValuationFor` ($103M mid for the demo); "match score N/100"; mechanics stated truthfully (no data release on NDA; no engagement feed). | ☐ |
| G5 | Demo only, unlabelled. | Listing, matches and memoranda for the active company (intake inputs as on Documents); Demo data / Your intake badge. | ☐ |
| G6 | Shared `BankerTake`; fake live tape. | Page-local recommended action; `RegistryTape`. | ☐ |
| G7 | Design: no `h1`, 18 dlitem failures. | Rebuild on `xo`. | ☑ G7-commit |

---

## Closure log

### G7 — Design
*Closed by:* `pages/Marketplace.tsx` rebuilt on `xo` (`PageHeader` `h1` "Exit Marketplace" with the two report links as actions; four metrics; the pitch and the pipeline as titled `Section`s — pipeline steps in a polite live list, progress bar `aria-hidden`, spinner only under `motion-safe`; the founder/public switch as `Chip`s (`aria-pressed`) in a labelled group; listing figures, ideal-buyer profile and the manifesto as real `dl`s (fixes the 18 dlitem failures); tags as a list; matched buyers and mechanics as sections; the edit dialog unchanged in behaviour). Content carried over verbatim; G1–G6 follow.
*Verification:* `tsc -b`, eslint clean · Chromium founder free/Pro and buyer 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 18), 35 tab stops with visible focus · after "Publish Opportunity" and after "Public listing": axe 0, no overflow · edit dialog: role dialog, focus inside, axe 0, Escape returns focus to "Edit listing".

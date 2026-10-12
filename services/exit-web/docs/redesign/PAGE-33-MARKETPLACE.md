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
| G1 | **Simulated publishing and outreach presented as live.** | "Prepare the sell-side pack": generates the four real artefacts (teaser, CIM, anonymised view, matched buyers) and says outreach is **not started** and nothing is published here; link to "List on the exchange" (intake) and to the Outreach Plan; remove "Live", "in outreach", "data room indexed", "Shopify", the manifesto figures and the one-click claim. | ☑ `ec4b220` |
| G2 | **Buyers see the founder view (identity, ask, edit, matches).** | Buyer role gets its own view: the anonymised public listing only, no identity, no founder controls or matches; NDA requests go through the Acquisition Radar. | ☑ `8dbf152` |
| G3 | Dead "Request NDA"; "Edit listing" claims an update. | Founder public preview has no NDA button (it says buyers request from the Radar); edit is a "preview adjustment — not saved or published", validated with `parseNumber`. | ☑ G3-commit |
| G4 | **Ask band conflicts with D1; match score as %; false mechanics.** | Asking band and check size from `canonicalValuationFor` ($103M mid for the demo); "match score N/100"; mechanics stated truthfully (no data release on NDA; no engagement feed). | ☐ |
| G5 | Demo only, unlabelled. | Listing, matches and memoranda for the active company (intake inputs as on Documents); Demo data / Your intake badge. | ☐ |
| G6 | Shared `BankerTake`; fake live tape. | Page-local recommended action; `RegistryTape`. | ☐ |
| G7 | Design: no `h1`, 18 dlitem failures. | Rebuild on `xo`. | ☑ `c5b28e6` |

---

## Closure log

### G7 — Design
*Closed by:* `pages/Marketplace.tsx` rebuilt on `xo` (`PageHeader` `h1` "Exit Marketplace" with the two report links as actions; four metrics; the pitch and the pipeline as titled `Section`s — pipeline steps in a polite live list, progress bar `aria-hidden`, spinner only under `motion-safe`; the founder/public switch as `Chip`s (`aria-pressed`) in a labelled group; listing figures, ideal-buyer profile and the manifesto as real `dl`s (fixes the 18 dlitem failures); tags as a list; matched buyers and mechanics as sections; the edit dialog unchanged in behaviour). Content carried over verbatim; G1–G6 follow.
*Verification:* `tsc -b`, eslint clean · Chromium founder free/Pro and buyer 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 18), 35 tab stops with visible focus · after "Publish Opportunity" and after "Public listing": axe 0, no overflow · edit dialog: role dialog, focus inside, axe 0, Escape returns focus to "Edit listing".

### G1 — Simulated publishing and outreach presented as live
*Closed by:* `pages/Marketplace.tsx`. The 850 ms timer that "published" the opportunity is removed. "Publish Opportunity" → **"Prepare the sell-side pack"**, which shows the four artefacts the engines already produce — Teaser drafted (title, words, anonymized), CIM drafted (sections, words, link to Documents), Anonymized public view (the title buyers would see), Buyers matched — and a fifth row **"Outreach — not started: ExitOS does not contact buyers from here. Plan who to approach in the Outreach Plan."**; section "Automated sell-side pipeline" → "Sell-side pack" with "4 artefacts prepared · outreach not started"; after preparing: "Pack prepared — nothing published or sent" and "What happens next — Nothing has been published or sent. To list the company on the exchange … use List on the exchange" (link to the intake, where listing really happens). Removed: status "Live", "● Live · 15 buyers in outreach", "Now live · the Shopify of company sales … published anonymized, the data room is indexed … entering sequenced outreach. Engagement signals flow straight into the negotiation engine", "● Published to marketplace", the manifesto ("0 Bankers hired · 1-click To full process · 100% Founder-owned") and "ExitOS does all five, in one click, the moment you publish" (now "ExitOS drafts the first four for you; listing on the exchange and the outreach stay your decisions"). The listing card's publish button → "List on the exchange →" (intake). The take: "You're live — review the 15 buyers entering outreach" → "Your sell-side pack is ready — … list on the exchange when you are ready"; automation line → "It does not publish the listing or contact buyers".
*Verification:* `tsc -b`, eslint clean · Chromium Pro: after "Prepare the sell-side pack" the five rows and the next-steps text show; 0 "Live", "in outreach", "Shopify", "1-click", "Bankers hired", "one click" on the page · 1440/390 before and after preparing: 0 errors, `h1` 1, no overflow, axe 0.

### G2 — Buyers see the founder view
*Closed by:* `pages/Marketplace.tsx`. With `session.role === "buyer"` the route renders a separate `BuyerMarketplace` ("Browse Opportunities"): the anonymized public listing only (`LISTING_PUBLIC` — title, model, sector, founding year, "jurisdiction redacted", headline figures, asking range, highlights), a **Demo listing** badge, and pointers to the Acquisition Radar for every exchange listing, NDA requests and offers. No identity, no founder view toggle, no edit or prepare controls, no matched-buyer list. Founder view unchanged (`FounderMarketplace`).
*Verification:* `tsc -b`, eslint clean · Chromium buyer free/Pro: `h1` "Browse Opportunities"; 0 "Helios", "Identity", "Edit listing", "Founder view", "Matched buyers", "Prepare the sell-side pack" · buyer free/Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus.

### G3 — Dead "Request NDA"; "Edit listing" claims an update
*Closed by:* `pages/Marketplace.tsx`. The founder's public preview no longer has the handler-less "Request NDA" button; it says "This is the preview buyers would see. They request an NDA from the Acquisition Radar; there is nothing to request here." "Edit listing" → **"Adjust preview"** (dialog subtitle "Changes this page's preview only — not saved, not published"; "Save" → "Apply to preview"; toasts "Preview updated — not saved or published" / "Preview reset to engine values"); while an adjustment is applied the listing says "Preview only: the asking mid shown is your adjustment ($…). It is not saved or published." The ask field is now text in $M validated with `parseNumber` (0.1–1,000,000), with `aria-invalid`, a described message and Apply disabled when invalid (was `type=number` accepting anything).
*Verification:* `tsc -b`, eslint clean · Chromium Pro 1440/390: field starts at 108.3; "abc" → "Use digits only, e.g. 12.5.", Apply disabled, `aria-invalid` true, dialog axe 0; "120" → metric $120,000,000 and the preview-only note; public preview shows the Radar line and 0 "Request NDA" buttons; page axe 0; 0 errors.

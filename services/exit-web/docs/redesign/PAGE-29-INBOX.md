# ExitOS redesign · Page 29 — Inbox

| | |
|---|---|
| Route | `/console/inbox` |
| Component | `src/pages/FounderInbox.tsx` (259 lines) + `lib/exit-api.ts` (NDA requests, offers, deals, mandates), `lib/acquirer.ts` (`matchCompanyToCriteria`) |
| NAV | "Inbox", group Exchange, founder only (buyers are redirected to the Buyer Portal), no plan gate |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `8899bdc`)

### Purpose
The founder's side of the exchange: buyer mandates that match the founder's listing, the deals opened on it, NDA requests to execute, offers to accept or decline, and an incoming-activity feed.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Listing | `listingFromCompany(loadActiveCompany())` — the saved intake, or the **demo company (Helios Freight)** when there is none | Demo **unlabelled**; with no intake the derived id `lst-helios-freight` is not the exchange's demo listing `lst-demo-helios`, so nothing arrives |
| Matching mandates | `allMandates()` scored by `matchCompanyToCriteria`: sector 40 + revenue 25 + region 20 + growth 15; "qualified" = ≥ 70 and sector match | Real records ✓; the score is shown as **"N %"** (reads as a probability) and the buyer's **target-revenue** band is labelled **"check"** (the field is named `minCheckUsd` but the Acquisition Radar fills it from "Target revenue") |
| Deals, NDA requests, offers, events | backend records for the listing (`dealsForListing`, `ndaRequestsForListing`, `offersForListing`, `eventsForSubject`) | Real records ✓ |
| "NDA executed, **identity released**"; "Executing **releases your identity** to the requesting buyer and **opens diligence**" | `signNda` only sets the request's status to `signed`; nothing in the code reveals the company to the buyer or opens diligence; no document is signed | **Overclaim** |
| "Counterparties stay anonymous to you **until they sign**"; "Buyers stay anonymous until they sign" | buyers are shown as "A buyer" before and after signing | **Misleading** — nothing is revealed at signing |
| "Every NDA and offer is a record resolved … under **owner-scoped security**"; file comment "owner-scoped RLS" | true only on the Supabase backend; the browser-local backend has no access control | Overclaim when local |
| "Advancing a stage captures telemetry that **feeds buyer DNA, response and close-rate models**" | `advanceDeal` records an event in the account's stream; buyer DNA is a static build and is not fed | **Overclaim** |
| "A deal opens **the moment a buyer expresses interest**" | deals open on an NDA request or an offer (`startDeal` in the Acquisition Radar) | Mislabel |
| "Live deals" | open deal records | Wording ("live") |
| **Execute NDA, Accept, Decline, Withdraw** | write to the record immediately; no undo in the UI | **Consequential actions without confirmation** |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline
Founder free and Pro: `h1` none · axe color-contrast ×7 + link-in-text-block ×1 (1440) · no overflow · 0 errors · 23 tab stops. Buyer: redirected to `/console/buyer-portal` (Page 37).

## Gap register — Page 29
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Identity-release, diligence, security and model-feeding overclaims.** | State what each action records: "Execute NDA" marks the request signed (no document is sent or signed; your identity is not revealed automatically); buyers stay anonymous on this page; security wording only for the exchange backend; advancing records an event; deals open on an NDA request or offer; "Open deals". | ☑ `5828adb` |
| G2 | **Consequential actions without confirmation.** | Inline confirmation for Execute NDA, Accept, Decline and Withdraw, stating what is recorded and that it cannot be undone here. | ☐ |
| G3 | Match score shown as "%"; target revenue labelled "check". | "Match score N/100" with the rule (weights, qualified threshold); "target revenue $a–$b". | ☐ |
| G4 | **Demo company unlabelled, and bound to the wrong listing.** With no intake the inbox derives `lst-helios-freight` ("Project Meridian", Draft), while the exchange carries the demo company as the seeded `lst-demo-helios` ("Project Beacon"). Buyer actions on the demo listing never reach the demo inbox (verified: a buyer NDA request and $90M offer on Project Beacon left the founder inbox at 0). | Demo data / Your intake badge and a line naming the listing; with no intake, track the seeded demo listing `lst-demo-helios` (same company, same profile). | ☑ `75afa8c` |
| G5 | Fake live tape. | `RegistryTape`. | ☐ |
| G6 | Design: no `h1`, 8 axe failures. | Rebuild on `xo`. | ☑ `d8968ce` |

---

## Closure log

### G6 — Design
*Closed by:* `pages/FounderInbox.tsx` rebuilt on `xo` (`PageHeader` `h1` **"Inbox"** — the NAV name — with Listed/Draft badge and the company, code, sector, region and revenue in the description; six metrics; mandates, deals, NDA requests, offers and the activity feed as titled `Section`s with lists; real `<button>`s with focus rings; the stage track `aria-hidden` beside "Stage n of 9" text; links underlined in body text). Content carried over verbatim; G1–G5 follow.
*Verification:* `tsc -b`, eslint 0 errors (one pre-existing `useCallback` dependency warning, `listing.profile`) · Chromium free/Pro 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 8), 23 tab stops with visible focus. The populated panels are exercised after G4 (with no intake nothing reaches this inbox until then).

### G4 — Demo company unlabelled and bound to the wrong listing
*Closed by:* `pages/FounderInbox.tsx`. With no saved intake the inbox now tracks the exchange's seeded demo listing `lst-demo-helios` (built from the same demo company by the same `listingFromCompany`), so buyer actions on the demo listing arrive; with an intake it is unchanged (`lst-<company name>`). Eyebrow "Demo company: Helios Freight" / "Your intake: …", **Demo data** / **Your intake** badge, and the description "No intake saved, so this shows the demo company's listing on the exchange — requests and offers here come from anyone using the demo. Save an intake to see your own." (or "Your company's listing, from your saved intake.").
*Verification:* `tsc -b`, eslint 0 errors · Chromium (local backend): a buyer sent an NDA request and a $90M indicative offer on Project Beacon from the Acquisition Radar; the founder inbox (no intake) then showed **Listed**, 1 deal at "NDA Requested", 1 NDA request awaiting, the $90.0M offer (submitted) with Accept/Decline, and 2 incoming events (was 0 everywhere, Draft "Project Meridian") · intake (Northwind): "Your intake", its own listing · free 1440/390: 0 errors, `h1` 1, no overflow, axe 0 — populated state 1440 also axe 0.

### G1 — Identity-release, diligence, security and model-feeding overclaims
*Closed by:* `pages/FounderInbox.tsx` (text only; actions unchanged). Event "— NDA executed, identity released" → "marked the NDA executed"; metric "NDAs executed — identity released" → "— marked signed"; "Live deals" → "Open deals"; NDA foot → "Execute NDA marks the request signed; the buyer sees “NDA signed”. ExitOS does not send or sign an NDA document and does not reveal your company to the buyer — share it yourself once the NDA is in place. Buyers are shown anonymously."; deal foot "captures telemetry that feeds buyer DNA, response and close-rate models" → "updates the deal record and adds an event to your Deal Activity record; it does not change any model"; empty deal state "opens the moment a buyer expresses interest" → "opens when a buyer requests an NDA or submits an offer"; "until they sign" (×3) → "shown anonymously"; activity foot "resolved … under owner-scoped security" → "records on the exchange backend" / "stored in this browser"; file comment corrected.
*Why no security claim:* in `supabase/migrations/0002_exitos_ownership.sql` the update policies on `exitos_nda_requests` and `exitos_offers` allow the listing owner **and the requesting buyer** — so a buyer could, through the API, mark their own request signed or their offer accepted. Logged as **X17** for the owner; not changed (backend).
*Verification:* `tsc -b`, eslint 0 errors · Chromium populated inbox (buyer request + offer on the demo listing): 0 "identity released" / "releases your identity" / "until they sign" / "buyer DNA" / "owner-scoped" / "live deals"; "Open deals" and "stored in this browser" present; axe 0; 0 errors.

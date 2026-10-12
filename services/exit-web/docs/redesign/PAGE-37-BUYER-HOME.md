# ExitOS redesign · Page 37 — Buyer Home (Buyer Portal)

| | |
|---|---|
| Route | `/console/buyer-portal` |
| Component | `src/pages/BuyerPortal.tsx` (135 lines) + `lib/buyer-portal.ts` (`SEAT`, `PORTAL_OPPORTUNITIES`, `PORTAL_NEGOTIATIONS`, `PORTAL_STATS` — built from the demo listing, its matches and the sample offers/NDAs) |
| NAV | "Buyer Home", buyer only (the buyer's landing page), no plan gate |
| Status | All six gaps closed. Part of the all-pages run; reviewed together at the end. |

## Stage A — Audit (baseline commit `6c23801`)

### Purpose
The acquirer's home: a seat (name, mandate, rank), matched opportunities with a watchlist, diligence access and negotiations.

### Data flow (measured, buyer)
| Element | Source | Nature |
|---|---|---|
| Title **"Flexport Strategic" · "Acquirer seat" · "Rank #1"**, mandate "Logistics / Freight & B2b Marketplace · check $25M–$500M · US + CA + GB + DE + NL + CN" | `SEAT` = the registry buyer the matching engine ranks first for the demo listing | **A demo seat shown as the signed-in buyer's own** — every buyer account sees itself as Flexport Strategic; unlabelled |
| Opportunities: "Logistics Freight platform · ~$18M ARR · 89% fit · readiness 46/100 · Revenue NDA-gated · **Ask $108,252,000** · Sourcing" | the demo public listing | Demo; the ask is the strategic report's mid (**D1**: the canonical value is $102,849,415, as Page 33 now shows); the title already reveals ARR while "Revenue" says NDA-gated; fit shown as % |
| "**Request access**", "**Open data room**", "**Request NDA**", "**Open**", "**Respond**" | `<Button>`s with **no handlers** | **Dead buttons** (NDA requests and offers really happen on the Acquisition Radar) |
| "identity and packages unlock on NDA"; "data room granted · 7 packages" | — | Overclaim — nothing unlocks automatically (Page 29) |
| "No offers in motion. **Submit an offer from an opportunity**" | — | There is no submit control here |
| Negotiation line "+N % vs strategic mid" | `VALUATION_CANONICAL` | The canonical midpoint, mislabelled "strategic" |
| Watchlist "tracked targets" | page state | Lost on reload; not stated |
| **The buyer's own NDA requests, deals, offers and mandate** | available via `myNdaRequests()`, `dealsForBuyer()`, `myMandate()` | **Not shown** — the home page of a buyer ignores their real activity |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline (buyer)
`h1` none · axe color-contrast ×4 (1440), target-size ×3 (390) · no overflow · 0 errors · 44 tab stops.

## Gap register — Page 37
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Demo seat shown as the buyer's own.** | `h1` "Buyer Home"; the seat section labelled "Demo seat — Flexport Strategic, a registry buyer; not your account" with a Demo data badge. | ☑ `47e54a1` |
| G2 | **The buyer's real activity is missing.** | "Your activity" section from the backend: your NDA requests (status), your deals (stage) and your saved mandate — with links to Access Requests and the Acquisition Radar; empty states that say how to start. | ☑ `b3dcb7c` |
| G3 | **Dead buttons; unlock and submit claims.** | Replace with links to where the action exists (Acquisition Radar for NDA requests and offers, Access Requests for status); remove "unlock on NDA", "data room granted" and "submit an offer from an opportunity". | ☑ `1b6bbb5` |
| G4 | D1 ask; fit as %; "strategic mid"; watchlist persistence unstated. | Ask = canonical midpoint (display); "fit score N/100"; "canonical midpoint"; "watchlist for this visit". | ☑ `97476dc` |
| G5 | Fake live tape. | `RegistryTape`. | ☑ `d7e8018` |
| G6 | Design: no `h1`, 7 axe failures. | Rebuild on `xo`. | ☑ `84463f9` |

---

## Closure log

### G6 — Design
*Closed by:* `pages/BuyerPortal.tsx` rebuilt on `xo` (`PageHeader` `h1`; four metrics; the workstation as a titled `Section` whose view switcher is a labelled group of `Chip`s (`aria-pressed`); opportunities, diligence and negotiations as lists with `h3`s and `dl`s; stages in words; the watch toggle announces its state (`aria-pressed`); shared `Button`/`StageBadge` replaced; 24px+ targets). Content carried over verbatim; G1–G5 follow.
*Verification:* `tsc -b`, eslint clean · Chromium buyer free/Pro 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 4 contrast + 3 target-size), all tab stops with visible focus · after switching to Opportunities, Diligence, Negotiations and Watchlist: axe 0, no overflow.

### G1 — Demo seat shown as the buyer's own
*Closed by:* `pages/BuyerPortal.tsx`. `h1` "Flexport Strategic · Acquirer seat · Rank #1" → **"Buyer Home"** with a **Demo seat** badge and "The workstation below shows a demo seat — Flexport Strategic, the registry buyer the matching engine ranks #1 for the demo listing. It is not your account. Your own NDA requests are on Access Requests." (link); the workstation is titled "Demo seat workstation · Flexport Strategic"; the matched-opportunities metric carries a Demo data tag and "fit the demo seat's mandate"; file comment corrected.
*Verification:* `tsc -b`, eslint clean · Chromium buyer: `h1` "Buyer Home", the demo-seat line shown · free 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G2 — The buyer's real activity is missing
*Closed by:* `pages/BuyerPortal.tsx` — a new **"Your activity"** section (first on the page) built only from the signed-in buyer's own backend records: "Your NDA requests" (`myNdaRequests()` with status — Awaiting the founder / NDA signed / Declined), "Your deals" (`dealsForBuyer()` with the stage label) and "Your mandate" (`myMandate()` — sectors, target revenue, regions). Listing ids are shown by their exchange code. It re-queries on mount and on every deal-event change, so it fills in once the account's backend connects after sign-in (Buyer Home is the buyer's landing page). Empty states say how to start; the foot links the Acquisition Radar (requests, offers) and Access Requests.
*Verification:* `tsc -b`, eslint clean · Chromium (local backend), buyer landing straight after sign-in: "None yet" ×2 and "Not saved"; after saving the radar mandate, sending an NDA request and a $90M indicative offer on Project Beacon: "Project Beacon — Awaiting the founder", "Project Beacon — IOI", "AI · Software · Developer Tools · target revenue $5M–$500M · North America, Europe"; axe 0 and no overflow at 1440 and 390 in both states; 0 errors.

### G3 — Dead buttons; unlock and submit claims
*Closed by:* `pages/BuyerPortal.tsx`. The handler-less "Request access" / "Open data room" → link **"Open on the Acquisition Radar →"**; diligence "Request NDA" / "Open" → "Request your own NDA on the Radar →" (with "NDA active" text when the demo seat has one); "Respond" removed. "identity and packages unlock on NDA" → "the demo seat has no NDA on this listing — nothing is shared automatically" (or "the demo seat's NDA is active · 7 diligence packages in the demo"); "No offers in motion. Submit an offer from an opportunity …" (no such control) → "The demo seat has no offers. Make your own indicative offers on the Acquisition Radar."
*Verification:* `tsc -b`, eslint clean · Chromium buyer: every workstation view checked — 0 handler-less buttons, 0 "unlock on NDA", "data room granted", "Submit an offer from an opportunity", "Respond"; links go to `/console/acquisition-radar` · after switching to Opportunities, Diligence and Negotiations 1440/390: axe 0, no overflow, 0 errors.

### G4 — D1 ask; fit as %; "strategic mid"; watchlist persistence unstated
*Closed by:* `lib/buyer-portal.ts` (the opportunity's `ask` is now the canonical midpoint — display data; `buyer-portal.test.ts` unchanged and passing) and `pages/BuyerPortal.tsx` (labels). "Ask $108,252,000" (the listing engine's strategic mid) → **"Value (canonical midpoint) $102,849,415"** (D1, as on the Marketplace); "89% fit" → "fit score 89/100"; "+N% vs strategic mid" → "vs the canonical midpoint"; watchlist "tracked targets" → "this visit only — not saved".
*Verification:* `tsc -b`, eslint clean, `buyer-portal.test.ts` 4/4 · Chromium buyer: Opportunities shows "fit score 89/100" and "Value (canonical midpoint) $102,849,415" · free/Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus.

### G5 — Fake live tape
*Closed by:* `pages/BuyerPortal.tsx`: pinging `MarketTape` → dated `RegistryTape`; the last "live" word ("Ranked #1 of 15 mandates matched to the live listing") → "… the demo listing".
*Verification:* `tsc -b`, eslint clean, `vitest` 206/206 · Chromium buyer: 0 "live" words, 0 pinging elements, snapshot date shown · free/Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus.

---

## Final verification
`tsc -b` pass · eslint 0 errors · `vitest` 206/206 · Chromium buyer free/Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0 (was 7), all tab stops with visible focus · all workstation views axe 0 · "Your activity" verified end to end on the local backend (NDA request, offer, mandate).

## Known issues
- The demo seat (Flexport Strategic) remains as a labelled example of the buyer workstation; it is not tied to the signed-in account.
- The demo listing's anonymized title reveals ARR ("~$18M ARR") while its revenue is marked NDA-gated — listing engine title rule, unchanged.
- The watchlist is not saved (stated).
- Behaviour against the Supabase backend — NOT VERIFIED; "Your activity" tested only on the browser-local backend.

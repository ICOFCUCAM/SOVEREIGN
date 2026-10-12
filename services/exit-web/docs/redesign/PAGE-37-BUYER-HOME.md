# ExitOS redesign · Page 37 — Buyer Home (Buyer Portal)

| | |
|---|---|
| Route | `/console/buyer-portal` |
| Component | `src/pages/BuyerPortal.tsx` (135 lines) + `lib/buyer-portal.ts` (`SEAT`, `PORTAL_OPPORTUNITIES`, `PORTAL_NEGOTIATIONS`, `PORTAL_STATS` — built from the demo listing, its matches and the sample offers/NDAs) |
| NAV | "Buyer Home", buyer only (the buyer's landing page), no plan gate |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

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
| G1 | **Demo seat shown as the buyer's own.** | `h1` "Buyer Home"; the seat section labelled "Demo seat — Flexport Strategic, a registry buyer; not your account" with a Demo data badge. | ☐ |
| G2 | **The buyer's real activity is missing.** | "Your activity" section from the backend: your NDA requests (status), your deals (stage) and your saved mandate — with links to Access Requests and the Acquisition Radar; empty states that say how to start. | ☐ |
| G3 | **Dead buttons; unlock and submit claims.** | Replace with links to where the action exists (Acquisition Radar for NDA requests and offers, Access Requests for status); remove "unlock on NDA", "data room granted" and "submit an offer from an opportunity". | ☐ |
| G4 | D1 ask; fit as %; "strategic mid"; watchlist persistence unstated. | Ask = canonical midpoint (display); "fit score N/100"; "canonical midpoint"; "watchlist for this visit". | ☐ |
| G5 | Fake live tape. | `RegistryTape`. | ☐ |
| G6 | Design: no `h1`, 7 axe failures. | Rebuild on `xo`. | ☐ |

---

## Closure log

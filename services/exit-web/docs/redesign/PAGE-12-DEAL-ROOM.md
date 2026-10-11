# ExitOS redesign · Page 12 — Deal Room

| | |
|---|---|
| Route | `/console/deal-room` |
| Component | `src/pages/DealRoom.tsx` (155 lines) + `lib/deal-room-activity.ts` |
| NAV | founder: "Live Deal Room", group Exchange, **Active Mandate**; buyer: "Deal Room", group Deals, **Pro** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `cee53de`)

### Purpose
For the founder: which buyers are in the data room, how long they spent, what they viewed and downloaded, which sensitive documents drew dwell, and whom to call. For the buyer (same route): their deal room.

### What is real
**Nothing on this page is recorded activity.** `lib/deal-room-activity.ts` says so in its header: "In demo mode there is no real session telemetry, so engagement is modelled deterministically from each buyer's acquisition probability." There is no deal-room telemetry anywhere in the codebase or backend (searched `deal_room`, `document_view`, `dealroom`).

| Element | Source | Nature |
|---|---|---|
| "Every buyer's session, live: who viewed what …" | page copy | **False live claim** |
| Six "buyers in the room — with NDA + access" | the top-6 *discovery* candidates of the demo company | **Fabricated** — none signed an NDA or entered a room |
| Time in room, documents viewed, downloads, dwell, "concern signals" | formulas on fit probability (35 + 230 × p minutes; 2 + 6 × p documents; …), document set rotated per buyer | **Simulated** |
| "Interest %", status ("Likely moving to LOI" …) | 44 + 52 × p + 8 × download ratio; thresholds | **Simulated** |
| "active 12m ago / 1h ago / …"; "Documents downloaded — this week" | fixed list by index; label | **Fabricated recency** |
| Banker's take "Call {buyer} now — … Likely moving to LOI"; "Engagement decays fast …"; "ExitOS tracks every view, download and dwell, scores intent …" | — | **Action advice on simulated data**; false capability claim |
| "Documents drawing attention", "Causing concern — prep the rebuttal in the CIM" | aggregation of the simulated views | Simulated |
| Buyer role | sees the **same founder view**: other buyers' names, simulated engagement and "Call Flexport Strategic now" | **Role-inappropriate content** (founder intelligence about other bidders shown to a buyer) |
| NAV label "Live Deal Room" | `lib/access.ts` | False live claim |
| Company | demo buyer pool | Demo, unlabelled |

### Baseline
Founder Active Mandate: `h1` 1 · axe 0 · **overflow at 390** · 0 errors. Buyer Pro: same founder page. Free (both roles): Upgrade page.

## Gap register — Page 12
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Simulated activity presented as live, recorded telemetry** (page copy, NAV label, "with NDA + access", recency, "this week"). | Say it is a simulation everywhere it shows: header and badge "Simulated activity", one line on what is not recorded yet, NAV "Deal Room"; buyers described as the top-ranked buyers the simulation uses (no NDA claim); fabricated recency and "this week" removed. | ☑ `7d78309` |
| G2 | **Advice to act on simulated data** ("Call X now", decay warning, "ExitOS tracks every view…"). | Replace the banker's take with how to read the simulation; no call-to-action on a specific buyer; capability stated as it is (not recorded yet). | ☐ |
| G3 | **Buyers see the founder's view of other bidders.** | Buyer role gets its own view: no other bidders; what a buyer's deal room will hold and how access is granted (NDA → founder approval), with links to Access Requests and Browse Opportunities. Route and plan gate unchanged. | ☑ `2af6373` |
| G4 | Demo company unlabelled. | Simulate on the active company's ranked buyers; badge. | ☐ |
| G5 | Design: overflow at 390, old primitives. | Rebuild on `xo`. | ☑ `51ed348` |

---

## Closure log

### G5 — Design
*Closed by:* `pages/DealRoom.tsx` rebuilt on `xo` (`PageHeader` `h1`, banker's take as a page-local definition list (shared `BankerTake` no longer used here), four summary metrics, buyers as an ordered list with `h3`s, documents as a list with "downloaded"/"concern" words for screen readers, the attention table with row headers inside a keyboard-reachable `ScrollRegion`, concern list). Content carried over verbatim; G1–G4 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Active Mandate 1440/390: 0 errors, `h1` 1, **no overflow** (was overflowing at 390), axe 0 (after renaming the scroll region so it does not duplicate the section's landmark name), all tab stops with visible focus.

### G3 — Buyers saw the founder's view of other bidders
*Closed by:* `pages/DealRoom.tsx`: for `session.role === "buyer"` the page renders `BuyerDealRoom` — `h1` "Deal Room", "No deal room has been opened for your account." and how a room opens (founder approves an access request under NDA; only the documents that founder shares; "never other bidders or their activity"), with links to Access requests (`/console/nda`) and Browse opportunities (`/console/marketplace`), both buyer routes. The founder view is unchanged. Route, NAV entries and plan gates unchanged.
*Verification:* `tsc -b`, eslint clean · Chromium: buyer (Pro) → "Deal Room", "No deal room has been opened for your account", 0 other buyer names (before: "Call Flexport Strategic now"); founder (Active Mandate) unchanged · buyer 1440/390: 0 errors, `h1` 1, no overflow, axe 0, visible focus.

### G1 — Simulated activity presented as live, recorded telemetry
*Closed by:* `pages/DealRoom.tsx`, `lib/access.ts` (NAV label only).
| Before | After |
|---|---|
| `h1` "Live Deal Room"; NAV "Live Deal Room" | "Deal Room" (both); badge **Simulated activity** |
| "Every buyer's session, live: who viewed what …" | "ExitOS does not record data-room sessions yet. This page shows what the room will report, using activity simulated from each buyer's fit probability. No buyer below has signed an NDA or opened a document." |
| "Buyers in the room — with NDA + access" | "Buyers simulated — top ranked · no NDA or access" |
| "Documents downloaded — this week"; "Total time in room — across all buyers" | "Downloads — simulated"; "Time in room — simulated, all buyers" |
| "active 12m ago / 1h ago / …" (fixed list) | removed |
| "Hottest buyer", "Interest" | "Highest simulated interest", "Interest (sim.)" |
| Section titles | "· simulated" on activity, attention and concern; activity foot gives the simulation formula |
*Verification:* `tsc -b`, eslint clean, `vitest` 204/204 · Chromium (founder): 0 matches for live / this week / with NDA / "… ago" / yesterday · Active Mandate 1440/390: 0 errors, axe 0, no overflow.

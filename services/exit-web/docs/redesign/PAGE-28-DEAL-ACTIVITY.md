# ExitOS redesign · Page 28 — Deal Activity

| | |
|---|---|
| Route | `/console/activity` |
| Component | `src/pages/DealActivity.tsx` (115 lines) + `lib/deal-events.ts`, `lib/network-stats.ts` |
| NAV | "Deal Activity", founder and buyer, no plan gate |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `af4bcb4`)

### Purpose
The record of deal-flow actions taken in ExitOS (buyer views, interest, NDA requests …): counts, a funnel, rates, and a feed. Other pages write to it (`captureDealEvent`).

### Data flow
| Element | Source | Nature |
|---|---|---|
| Events | `deal-events` store: **this browser's localStorage**, or — once `connectExitApi` connects an account — **that account's own event stream** in the backend | Real records of the user's own actions ✓ |
| "Network effects · learned from captured transactions"; "the response/close-rate moat no banker or database has"; "With the exit-api, every event persists per account, **network-wide** — feeding response history and engagement for all participants" | `networkStats(events)` over the **same own events** | **Overclaim** — nothing is aggregated across users |
| "Events captured — **this session**" | all stored events (persist across sessions) | Mislabel |
| **"Clear"** | `clearDealEvents()` → writes an empty list through the adapter — with a connected account this **overwrites the account's stored events in the backend** | **Destructive, no confirmation, consequence not stated** |
| Buyer role | sees every event stored in the browser, including founder actions (e.g. "founder viewed {buyer}") when roles are switched on one browser | Role-inappropriate in the shared-browser case |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline
Founder and buyer (free): `h1` none · axe color-contrast ×14 (1440) · no overflow · 0 errors.

## Gap register — Page 28
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **"Network-wide moat" overclaims; "this session".** | Say the figures are your own recorded actions (this browser, or your account when connected); "stored events"; no network claims. | ☑ `ed8522d` |
| G2 | **"Clear" erases history without confirmation.** | Inline confirmation stating exactly what is erased (this browser's record, and the account's stored events when connected). | ☑ `bf9815d` |
| G3 | Buyer sees founder events recorded in the same browser. | Buyer view filters to events with `actorRole: "buyer"`. | ☑ `aecff92` |
| G4 | Fake live tape. | `RegistryTape`. | ☑ `ea8e4c2` |
| G5 | Design: no `h1`, 14 contrast failures. | Rebuild on `xo`. | ☑ `f8a9ca3` |

---

## Closure log

### G5 — Design
*Closed by:* `pages/DealActivity.tsx` rebuilt on `xo` (`PageHeader` `h1` "Deal Activity"; four metrics; the rates as a definition list; the funnel as an ordered list with decorative bars; the feed as a list with links to buyer profiles; focus rings on every control). Content carried over verbatim; G1–G4 follow.
*Verification:* `tsc -b`, eslint 0 errors (one pre-existing `useMemo` dependency warning on the tape, removed with the tape in G4) · Chromium free founder 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 14), 19 tab stops with visible focus.

### G1 — "Network-wide moat" overclaims; "this session"
*Closed by:* `pages/DealActivity.tsx` (text only; `networkStats` unchanged). Description: "Deal-flow actions you have taken in ExitOS …, as recorded in this browser" (or "your account's stored events" when `listingDestination()` is the exchange backend). "Network effects · learned from captured transactions" → "Your rates · from recorded events"; foot "… the response/close-rate moat no banker or database has … until the network produces the events" → "Computed from your own recorded events only — not across other users …"; funnel foot "every event persists per account, network-wide — feeding … all participants" → "Distinct buyers or listings that reached each stage in your recorded events."; "Events captured — this session" → "Stored events — all recorded"; "Capture spine" badge → "N stored events"; file comment corrected.
*Verification:* `tsc -b`, eslint 0 errors · Chromium: 0 "network" / "moat" / "this session" / "capture spine"; free 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G2 — "Clear" erases history without confirmation
*Closed by:* `pages/DealActivity.tsx`. "Clear" → **"Clear history…"**, which opens an inline `role="alert"` confirmation: "Erase all N stored events? This permanently deletes the deal-activity record held in this browser (or: your account's stored events in the backend, when the exchange backend is connected). Funnel counts and rates on this page, and buyer activity on other pages, reset to zero. It cannot be undone." Buttons "Erase N events" and "Keep history" (focused first; Keep returns focus to "Clear history…"). `clearDealEvents` is unchanged.
*Verification:* `tsc -b`, eslint 0 errors · Chromium Pro, 3 events recorded by opening two buyer profiles, 1440/390: the confirmation shows, focus on "Keep history", axe 0, no overflow; Keep leaves 3 stored events and returns focus; Erase leaves 0 and shows the empty state; 0 errors.

### G3 — Buyer sees founder events
*Closed by:* `pages/DealActivity.tsx`. With `session.role === "buyer"` the page uses only events whose `actorRole` is `"buyer"`; the description says "Buyer-side deal-flow actions … Founder actions are not shown."; the "Clear history…" control is not offered to buyers (erasing would also delete founder events stored in the same record). Founder view unchanged.
*Verification:* `tsc -b`, eslint 0 errors · Chromium, one browser and one email in both roles: as founder, two "founder viewed Microsoft" events; then as buyer, an NDA request from the Acquisition Radar — the buyer page lists only "buyer expressed interest in / requested NDA with Project Beacon" (2 events) while the stored record holds 4; 0 Clear buttons for the buyer · buyer free 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G4 — Fake live tape
*Closed by:* `pages/DealActivity.tsx`: pinging `MarketTape` → dated `RegistryTape` ("Registry · as of" the snapshot date). For buyers the tape omits the "Your activity" entries (they are built from all stored events, so they could show founder actions — same rule as G3). The `useMemo` dependency warning is gone.
*Verification:* `tsc -b`, eslint clean (0 warnings) · Chromium: 0 "live" words, snapshot date shown; same-browser test — founder tape shows "Your activity · founder viewed Microsoft" ×2, buyer tape shows none · founder free/Pro and buyer free 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

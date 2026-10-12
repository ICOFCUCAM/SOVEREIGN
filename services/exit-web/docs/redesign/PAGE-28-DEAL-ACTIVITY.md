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
| G1 | **"Network-wide moat" overclaims; "this session".** | Say the figures are your own recorded actions (this browser, or your account when connected); "stored events"; no network claims. | ☐ |
| G2 | **"Clear" erases history without confirmation.** | Inline confirmation stating exactly what is erased (this browser's record, and the account's stored events when connected). | ☐ |
| G3 | Buyer sees founder events recorded in the same browser. | Buyer view filters to events with `actorRole: "buyer"`. | ☐ |
| G4 | Fake live tape. | `RegistryTape`. | ☐ |
| G5 | Design: no `h1`, 14 contrast failures. | Rebuild on `xo`. | ☑ G5-commit |

---

## Closure log

### G5 — Design
*Closed by:* `pages/DealActivity.tsx` rebuilt on `xo` (`PageHeader` `h1` "Deal Activity"; four metrics; the rates as a definition list; the funnel as an ordered list with decorative bars; the feed as a list with links to buyer profiles; focus rings on every control). Content carried over verbatim; G1–G4 follow.
*Verification:* `tsc -b`, eslint 0 errors (one pre-existing `useMemo` dependency warning on the tape, removed with the tape in G4) · Chromium free founder 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 14), 19 tab stops with visible focus.

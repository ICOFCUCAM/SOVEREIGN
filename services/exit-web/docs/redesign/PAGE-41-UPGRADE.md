# ExitOS redesign · Page 41 — Upgrade (engagement selector)

| | |
|---|---|
| Route | `/console/upgrade`, and rendered in place of any plan-gated page (`needsUpgrade` in `App.tsx`, with the gated feature's name) |
| Component | `src/pages/Upgrade.tsx` (116 lines) + `lib/auth.tsx` (`upgradeTo`), `lib/access.ts` (gating) |
| NAV | — (reached from gated pages and links), any signed-in role |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `d244555`)

### Purpose
Four engagement tiers — Listed Founder (free), Preparation ($995 one-time), Active Mandate ($995/mo + 2.5 % success fee), Institutional (custom) — with features and a button that switches the session's plan; also the screen every free user sees on a gated page.

### Data flow
| Element | Source | Nature |
|---|---|---|
| "Prepare my company →" / "Launch a mandate →" | `upgradeTo(plan)` — sets the in-memory session plan, then navigates home | **No payment, no account change, reverts on sign-out**; said only in a faint footnote ("Demo: choosing an engagement switches your session instantly.") |
| Description "An Active Mandate runs the live process — **and is paid only when you close**" | — | **Contradicts the price** ($995/mo is paid regardless; only the 2.5 % fee is on close) |
| Active Mandate features "Buyer outreach & **NDA automation**", "Acquisition intelligence & **AI negotiation**", "Closing Center — **net-to-founder math**" | hard-coded | Overclaims per the audited pages: no outreach is sent and NDAs are records (Pages 29, 36); the Bid Room is rule-based, no AI (Page 23); the Closing Center is a checklist (Page 32) |
| Listed Founder "Receive buyer interest & **mandate alerts**" | — | No alerts exist; interest arrives in the Inbox |
| "**Most selected**" badge | — | Unverified popularity claim |
| Buyer role | same founder tiers and buttons ("Prepare my company →") | Founder copy for buyers; for buyers Active Mandate unlocks the Deal Room and Access Requests (`access.ts`); no buyer pricing is published |
| Institutional ("Dedicated managing director & deal team", "Legal & escrow coordination", "Single-tenant deployment") → "Request a briefing →" `/pricing` | — | Commercial offer (contact) — not verifiable here; left as offered, routed to pricing |
| The same tier texts on the marketing Pricing page | `Pricing.tsx` | Out of scope here — to be aligned in the marketing redesign task |

### Baseline
Founder free/Pro and buyer: `h1` 1 · axe 0 · no overflow · 0 errors; old components (`Card`, `SectionHeader`, `Button`).

## Gap register — Page 41
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Plan switch looks like a purchase.** | A prominent note: demo mode — no payment is taken, nothing changes on any account; choosing a tier switches this session's plan until you sign out; button names say "(demo)". | ☐ |
| G2 | **"Paid only when you close"; feature overclaims; "Most selected".** | "its 2.5 % success fee is paid only when you close"; features worded as the console delivers them (outreach drafts & NDA requests; rule-based negotiation in the Bid Room; closing checklist; buyer interest in the Inbox); "Recommended for a live process" instead of "Most selected". | ☐ |
| G3 | Buyers see founder tiers. | A buyer note: what Active Mandate unlocks for buyers (Deal Room, Access Requests) and that no buyer pricing is published; buyer-appropriate button text. | ☐ |
| G4 | Design: old components. | Rebuild on `xo`. | ☑ `f998ff2` |

---

## Closure log

### G4 — Design
*Closed by:* `pages/Upgrade.tsx` rebuilt on `xo` (`PageHeader` `h1`; the four tiers as a list of panels with an `h2` per tier, features as lists with decorative marks hidden, the action pinned to the panel foot; shared `Card`/`SectionHeader`/`Button` and gradients replaced by xo tokens). Content carried over verbatim; G1–G3 follow. Button names unchanged (the plan switch and every gated-page test depend on them).
*Verification:* `tsc -b`, eslint clean · Chromium founder free/Pro and buyer 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus · as the gate on a plan-gated page (Outreach Plan, free): same; the plan switch still works (Closing Center reached on Pro).

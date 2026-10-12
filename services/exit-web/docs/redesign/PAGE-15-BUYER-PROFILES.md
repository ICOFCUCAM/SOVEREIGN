# ExitOS redesign · Page 15 — Buyer Profiles

| | |
|---|---|
| Route | `/console/buyers` |
| Component | `src/pages/Buyers.tsx` (209 lines) |
| NAV | "Buyer Profiles", group Market Intelligence, founder, no plan gate |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `c542928`)

### Purpose
Profile cards for the 12 ranked buyers (header "Buyer Marketplace"): interest level, appetite, average deal, time to close, last acquisition, founder-friendliness, match; filters; a generated warm-introduction email per buyer.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Buyers | `BUYERS` (demo company, top 12) | Engine, demo unlabelled |
| **"Send introduction →"** | toast "Introduction to {buyer} queued with the banker" | **False action** — nothing is queued or sent |
| Warm-intro text | template; signed "**Best, James**"; always claims "your recent activity in the space" | **Invented sender name**; activity claim not checked |
| "Hot / Warm / Cool · N%" with a **pulsing dot** | fit probability thresholds | Mislabel ("interest") + fake live indicator |
| "Founder-friendly High/Moderate/Low" + bar | type base (78 / 88 / 64) ± retrade | **Invented attribute** (removed on Page 11 for the same reason) |
| "Active mandates — recent-12mo activity" | `appetite === "active"` (registry attribute) | Mislabel |
| "Avg deal", "Median target check — across registry" | midpoint of the check-size range; median over the shown buyers | Mislabels |
| Banker's take "Hot interest cools — buyers redeploy …"; "ExitOS drafts … and routes it through the banker" | — | Invented urgency, overclaim |
| "Send via The Banker" → `/console/banker` | link; page has no plan gate | Hidden Active Mandate requirement |
| Intro drawer | plain `div` overlay: no dialog role, no focus management, no Escape | Accessibility defect |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline
`h1` none · axe color-contrast ×24 (1440) · no overflow · 0 errors.

## Gap register — Page 15
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **False "queued with the banker"; invented sender "James"; unchecked activity claim.** | Intro dialog offers Copy and "Open Outreach" (with plan note), states nothing is sent from here; sign-off placeholder "[Your name]"; "recent activity" sentence only when the buyer has deals in the last 3 years. | ☐ |
| G2 | **Invented founder-friendliness; fit shown as "interest" with a pulsing dot; appetite/check mislabels.** | Remove founder-friendliness; "Fit · Hot/Warm/Cool" with thresholds, no pulse; "Active-appetite buyers — registry attribute"; "Check-size midpoint"; "median across these N buyers". | ☐ |
| G3 | Banker's-take urgency and overclaim; hidden plan gate. | Plain wording; `requiredEngagement` note. | ☐ |
| G4 | Demo company unlabelled. | Buyers and intro text on `loadActiveCompany()`; badge. | ☐ |
| G5 | Fake live tape. | `RegistryTape`. | ☐ |
| G6 | Design: no `h1`, 24 contrast failures, header name differs from NAV, drawer not a dialog. | Rebuild on `xo`; `h1` "Buyer Profiles"; intro in the shared `Modal`. | ☐ |

### X13 — Shared `Modal` is not an accessible dialog (found here) — documented before the fix
`lib/ui.tsx` `Modal` renders a plain `div` overlay: no `role="dialog"`, no `aria-modal`, no accessible name, focus is not moved into it on open nor returned on close (Escape and backdrop click already close it), and its close button has no visible focus ring. Used by every page that opens a modal. *Fix (additive, same props and look):* `role="dialog"`, `aria-modal="true"`, `aria-labelledby` → the title; focus moves to the dialog panel on open and back to the previously focused element on close; Tab is kept inside the dialog; visible focus ring on the close button.

---

## Closure log

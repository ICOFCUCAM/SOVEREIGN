# ExitOS redesign · Page 36 — Outreach (The Banker)

| | |
|---|---|
| Route | `/console/banker` |
| Component | `src/pages/Banker.tsx` (508 lines) + `lib/banker-directives.ts` (directive parser, `exitos.mandate.directives.v1` in this browser), `lib/deliverables.ts`, `lib/engines.ts` (`BUYERS`, `DILIGENCE`, `VALUATION_CANONICAL`, `useMemorandum` — demo company) |
| NAV | "Outreach", founder, **Pro** (free: Upgrade page) |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `ad0c95e`)

### Purpose
"The Banker — your permanent investment banker": a first-person status briefing, recent activity, banker directives (a deterministic parser that re-weights the buyer pool), a deal funnel, workstreams, strategy advice and deliverables (outreach campaign, buyer introductions, teaser, executive summary).

### Data flow (measured, Pro, demo)
| Element | Source | Nature |
|---|---|---|
| "**● Working the deal · live**"; "I've identified 12 qualified buyers, shortlisted 7, **opened conversations with 4**, and **2 are showing active interest** — Flexport Strategic and DP World Logistics M&A. **One is in diligence.**" | `nContact = min(4, shortlist)`, `nInterest = min(2, …)`, `nDiligence = min(1, …)` — fixed slices of the ranked list | **Invented process.** No one has been contacted; the "interested" buyers are simply ranks 1–2 |
| "Recent activity": "2h ago — Flexport Strategic and DP World … showing active interest", "5h ago — Answered a buyer's diligence question …", "1d ago — Sent the Project Cipher teaser to 4 tier-1 targets; 2 replied", "2d ago", "3d ago" | hard-coded `baseActivity` | **Fabricated events** with relative times |
| Workstreams: "Draft outreach — done: teaser **sent to 4**"; "Answer buyer questions — **live** buyer questions being handled"; "Coordinate diligence — **tracked to resolution**" | hard-coded statuses | Invented progress (teaser and CIM drafting are real) |
| Funnel Identified 12 · Shortlisted 7 · **Contacted 4 · Interested 2 · In diligence 1** | the slices above | Last three invented |
| "**Approve next step**" → "Approved: I'll send the CIM to the engaged buyers …", toast "Approved — next step underway"; "All steps approved — the process is running" | local state | **Fake action** — nothing runs |
| "**Send campaign**" ("Outreach campaign launched to the shortlist"), "**Send introduction**" ("Introduction sent to …"), teaser/summary "**Send**" ("Delivered to the buyer's data room") | `notify` + a local "Sent ✓" flag | **False sends** — nothing is sent or delivered |
| Introduction letter signed "**Anne Kovac, CEO**" | `FROM_NAME` constant | **Invented person** (Buyer Profiles and Bid Room use "[Your name]") |
| Strategy advice: "Best timing **Months 7–13**", "earnout capped at **15 %**", "Escrow **≤8 %** released in 12 months; reverse break-fee; 30–45 day sign-to-close", "fastest path to a $173,889,733 exit" | hard-coded text (only names and the anchor are computed) | Rules of thumb presented as computed advice |
| Anchor options "Strategic mid / Strategic high (stretch)" | `VALUATION_CANONICAL` headline | The canonical (institutional) band — mislabelled "strategic" (D1) |
| Buyer cards "89 %" (Flexport Strategic), "88 %" … | discovery fit probability (re-weighted by directives) | Fit score shown as a probability |
| Directives | `useDirectives()` — parsed deterministically, stored in this browser | Real ✓ ("stored against the mandate" — it is this browser only) |
| Everything | demo company only | Demo **unlabelled** |

### Baseline (Pro)
`h1` 1 · axe 0 · no overflow · 0 errors · 39 tab stops; old components (`Card`, `SectionHeader`, `Button`).

## Gap register — Page 36
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Invented process: live agent, contacts, interest, diligence, activity log, workstream statuses.** | Status says nothing has been sent and no buyer contacted; funnel shows only Identified and Shortlisted (Contacted / Interested / In diligence = 0, "none recorded"); activity lists only what the user did on this page; workstreams state what is drafted vs not started; "Approve next step" removed. | ☑ `0878da2` |
| G2 | **False sends.** | Remove "Send campaign / introduction / Send"; downloads stay; say the user sends them. | ☑ G2-commit |
| G3 | Invented signer. | "[Your name]" as on Buyer Profiles and Bid Room. | ☐ |
| G4 | **Rules of thumb as computed advice; "strategic" anchor; fit as %.** | Advice labelled "general guidance — not computed for this company" where not derived; anchor "Canonical midpoint / high"; "fit score N/100". | ☐ |
| G5 | Demo only, unlabelled. | Buyers, memoranda and the canonical band for the active company; Demo data / Your intake badge; directives "saved in this browser". | ☐ |
| G6 | Design: old components. | Rebuild on `xo`. | ☑ `b98943f` |

---

## Closure log

### G6 — Design
*Closed by:* `pages/Banker.tsx` rebuilt on `xo` (`PageHeader` `h1` "The Banker"; status and activity, directives, funnel, workstreams, advice and deliverables as titled `Section`s; funnel as an ordered list with `aria-hidden` bars; advice and posture as `dl`s; the deliverable switcher as `Chip`s (`aria-pressed`) in a labelled group; per-buyer "Draft introduction" and "Remove directive" buttons carry the buyer/directive in their accessible name; shared `Card`/`SectionHeader` and hex accents replaced). Content carried over verbatim; G1–G5 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus · "Brief the banker" and "Adjust strategy" dialogs: role dialog, focus inside, axe 0, Escape returns focus · switching to Buyer introductions, Teaser and Executive summary: axe 0, no overflow · free: Upgrade page.

### G1 — Invented process: live agent, contacts, interest, diligence, activity log, workstream statuses
*Closed by:* `pages/Banker.tsx` (and one posture string in `lib/banker-directives.ts`).
- Status: "● Working the deal · live — I've identified 12 qualified buyers, shortlisted 7, opened conversations with 4, and 2 are showing active interest — Flexport Strategic and DP World Logistics M&A. One is in diligence." → "**Not started · nothing sent** — I've ranked 12 buyers and shortlisted 7. No buyer has been contacted — ExitOS does not send outreach. The campaign, introductions, teaser and summary below are drafts for you to send." and "Next: review the shortlist and the drafts, then send them yourself or through your adviser."; the page description says the same.
- "Approve next step" and its four scripted steps ("Approved: I'll send the CIM to the engaged buyers …", "All steps approved — the process is running") are removed.
- "Recent activity" with five fabricated entries (2h / 5h / 1d / 2d / 3d ago) → "Your activity on this page" — only the directives and strategy changes the user makes on this visit, with an empty state; foot "Nothing here comes from buyers."
- Funnel: Contacted / Interested / In diligence were fixed slices (4 / 2 / 1) → **0, "none recorded"**; Identified 12 and Shortlisted 7 stay (ranking and the shortlist setting).
- Workstreams: "Draft outreach — teaser sent to 4" → "queued — 6-step campaign drafted — not sent; no buyer contacted"; "Answer buyer questions — live buyer questions being handled" → "Prepare for buyer questions — N critical questions from diligence to prepare answers for — no buyer questions received"; "Coordinate diligence — tracked to resolution" → "to resolve before buyers ask — not tracked automatically"; CIM "final review" → "for your review". The downloadable campaign's status line → "12 acquirers identified and 7 shortlisted; none contacted yet".
- Directive posture "Outreach is live — no hold directive in force." → "No hold directive in force — the drafts can be sent whenever you choose."
*Verification:* `tsc -b`, eslint clean, `vitest` 206/206 · Chromium Pro: 0 "live", "opened conversations", "showing active interest", "… ago", "Approve next step", "sent to 4", "being handled", "tracked to resolution"; funnel 12 · 7 · 0 · 0 · 0; briefing "avoid private equity" lists "Directive applied — Private equity buyers down-weighted to 25%." under "Your activity on this page" · 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### X20 — Shared `Modal` body not keyboard-scrollable (found here) — documented before the fix
`lib/ui.tsx` `Modal` (made accessible in X13) renders its content in `max-h-[64vh] overflow-y-auto` with nothing focusable inside when the content is text only. With a long introduction letter open, axe reports **scrollable-region-focusable** (a keyboard user cannot scroll the letter). *Fix:* make the body a focusable region named by the dialog title (`tabIndex={0}`, `role="region"`, `aria-labelledby`, visible focus ring). It joins the existing focus trap (which already includes `[tabindex]`). Affects every dialog using `Modal`; behaviour otherwise unchanged.

### X20 — Shared `Modal` body not keyboard-scrollable
*Closed by:* `lib/ui.tsx` `Modal`: the body is `role="region"`, `aria-labelledby` the dialog title, `tabIndex={0}`, with an inset focus ring.
*Verification:* `tsc -b`, eslint clean, `vitest` 206/206 · Chromium: the Banker's introduction dialog axe 1 → **0**; Escape still returns focus to "Draft introduction to Flexport Strategic" · other `Modal` dialogs re-checked — Closing call, Marketplace "Adjust preview", Bid Room "Draft the response", "Brief the banker": axe 0, Escape returns focus to the opener.

### G2 — False sends
*Closed by:* `pages/Banker.tsx`. Removed: "Send campaign" (toast "Outreach campaign launched to the shortlist"), "Send introduction" (toast "Introduction sent to …"), the teaser/summary "Send" (toast "Delivered to the buyer's data room") and every "Sent ✓ · resend" flag. Downloads stay and are now the primary action; the outreach tab says "A plan to run yourself — ExitOS does not send it."; the introduction dialog's subtitle says "download it and send it yourself; ExitOS does not send email" with "Close" / "Download draft"; the deliverables header reads "Drafts to review and download — ExitOS sends nothing." The "Held by directive" notice stays (the hold now only affects the wording of the posture). Found while testing: the introduction dialog's scrolling body was not keyboard-reachable — fixed for every dialog as X20.
*Verification:* `tsc -b`, eslint clean · Chromium Pro: 0 "Send" / "Sent" buttons on the page; introduction dialog buttons "✕ / Close / Download draft", axe 0 (after X20), Escape returns focus to "Draft introduction to Flexport Strategic"; Teaser, Executive summary and Outreach campaign each offer only "Download" · 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

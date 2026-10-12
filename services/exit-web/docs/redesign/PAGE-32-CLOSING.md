# ExitOS redesign · Page 32 — Closing Center

| | |
|---|---|
| Route | `/console/closing` |
| Component | `src/pages/Closing.tsx` (259 lines) + `lib/engines.ts` (`DILIGENCE` = `runDueDiligence(SAMPLE_COMPANY)`, `OFFER_EVALUATIONS`), shared `BankerTake` |
| NAV | "Closing Center / Signatures / Escrow", founder, **Pro** (free: Upgrade page) |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `f95aa68`)

### Purpose
A closing checklist (12 items with owner, due day and status), a close-probability meter with the risks gating the wire, the diligence red flags and critical questions, and a closing-call agenda with a calendar invite.

### Data flow
| Element | Source | Nature |
|---|---|---|
| **"Closing in 6 days — Sentinel Holdings"**, "in signing", "Closing checklist — Sentinel Holdings" | hard-coded | **Invented deal.** In the sample data Sentinel Holdings' NDA is **revoked** (`engines.ts`); no deal has reached closing |
| Checklist statuses and due days (2 done, 6 in progress, 4 pending; "Fri", "Tue 9am" …) | hard-coded `CLOSING` array | **Invented progress** |
| "Shareholder consent — **95 % threshold**"; "Regulatory filings — **Form 8023 / NJ-1054**" | hard-coded | Invented specifics (no source; the threshold depends on the company's documents and the filings on counsel's advice) |
| **"42 % close prob"** / "modeled close probability" meter ((2 done + ½ × 6 in progress) / 12, no blockers, 0 red flags for the demo) | `closeProbability`: (done + ½ in progress) / total − 8 % per blocker − 4 % per diligence red flag | A rule run on the **invented statuses**, presented as a probability |
| Deal value in the take | max headline of the sample offers | Sample data, unlabelled |
| Diligence red flags and critical questions | `runDueDiligence(SAMPLE_COMPANY)` | Engine ✓ on the **demo company only**, unlabelled; saved intakes ignored |
| Closing call: **"Schedule"** → toast "Closing call scheduled"; "Dial-in issued with the calendar invite"; subtitle "**Tuesday** 08:00" | — | **False actions**: nothing is scheduled, no dial-in exists; the .ics is set to the day after tomorrow, not Tuesday |
| .ics summary "Closing call — **Helios Freight** transaction" | hard-coded | Demo name for every company |
| "ExitOS **tracks every signature, escrow movement and filing, and nudges the owner** before each due date" | shared `BankerTake` | **Overclaim** — none of this exists |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline (Pro)
`h1` none · **overflow at 390** · axe 0 (1440) · 0 errors · 25 tab stops. Free: Upgrade page.

## Gap register — Page 32
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Invented closing deal and progress.** | No buyer, no countdown: the checklist is a template; each item's status is **set by the user** (Not started / In progress / Done / Blocked), saved in this browser; no invented due days. | ☑ `c07603d` |
| G2 | **"Close probability" from invented statuses.** | "Checklist readiness (rule)" computed from the user's statuses and the diligence red flags, with the rule stated; not a probability. | ☑ `1fcb1ac` |
| G3 | **False "Schedule", dial-in and tracking claims; wrong day.** | Remove "Schedule" and the dial-in line; the invite is a download the user imports and sends; the subtitle shows the invite's real date; no tracking or nudging claims; invite names the active company. | ☑ `2cc24ca` |
| G4 | Invented item specifics (95 % threshold, Form 8023 / NJ-1054). | Neutral items: "Shareholder consent — at the threshold your documents require"; "Regulatory and tax filings — as counsel advises". | ☑ G4-commit |
| G5 | Diligence on the demo company only, unlabelled. | `runDueDiligence(company)` for the active company; Demo data / Your intake badge. | ☐ |
| G6 | Shared `BankerTake` and fake live tape. | Page-local recommended action; `RegistryTape`. | ☐ |
| G7 | Design: no `h1`, overflow at 390. | Rebuild on `xo`. | ☑ `d8a0b6d` |

---

## Closure log

### G7 — Design
*Closed by:* `pages/Closing.tsx` rebuilt on `xo` (`PageHeader` `h1` "Deal Closing Center" with Print / Closing call actions; four metrics; the meter and gating risks as titled `Section`s — ring `aria-hidden`, figure in text; the checklist in a `ScrollRegion` with items as row headers; diligence flags and questions under `h3`s; status and severity in words with colour; shared `Card` and the hex colours replaced by xo tokens). Content carried over verbatim; the shared `BankerTake` stays until G6; G1–G6 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Pro 1440/390: 0 errors, `h1` 1 (was 0), **no overflow at 390** (was overflowing), axe 0, 27 tab stops with visible focus · closing-call dialog: role dialog, focus inside, axe 0, Escape closes and focus returns to "Closing call".

### G1 — Invented closing deal and progress
*Closed by:* `pages/Closing.tsx`. The 12 items are now a **template** (id, title, owner only): the invented statuses (2 done, 6 in progress, 4 pending) and due days ("Fri", "Tue 9am" …) are removed. Each item has a labelled status select ("Status of {item}": Not started / In progress / Done / Blocked), defaulting to Not started and saved in this browser (`exitos.closing.v1`). "Closing in 6 days — Sentinel Holdings" → "Checklist — 12 items · template · statuses set by you"; "Closing checklist — Sentinel Holdings" → "Closing checklist (template)"; the Due column is removed; a note: "No deal has reached closing on ExitOS. This is a closing checklist template: set each item's status yourself as your counsel and the buyer report progress. Statuses are saved in this browser only."; the take's buyer line → "No deal in closing — the checklist is a template."
*Verification:* `tsc -b`, eslint clean · Chromium Pro: default 0/12 done, the rule reads 5 % (its floor); setting two items Done, one In progress and one Blocked → 2/12 done, 1 in progress, 1 blocker, 13 % ((2 + 0.5)/12 − 8 %); after a reload the statuses persist (`{"c-05":"done","c-06":"done","c-01":"in_progress","c-11":"blocked"}`) · 1440/390: axe 0, no overflow, 0 errors.

### G2 — "Close probability" from invented statuses
*Closed by:* `pages/Closing.tsx` (labels; the rule is unchanged and now runs on the user's statuses). "42% close prob" / "modeled close probability" / "Current close probability … to close" → **"Checklist readiness (rule)"**, "checklist readiness N%", "(a rule, not a probability)"; the meter's foot states the rule: "(Done + ½ × In progress) ÷ 12 items, minus 8 points per blocked item and 4 per diligence red flag; floor 5 %, cap 99 %. Built from the statuses you set — a progress rule, not a probability of closing."; code comment corrected.
*Verification:* `tsc -b`, eslint clean · Chromium Pro: the only "probability" words are in "not a probability"; readiness 5 % by default and 13 % after setting statuses (as G1) · 1440/390: 0 errors, `h1` 1, no overflow, axe 0 · closing-call dialog axe 0, Escape returns focus.

### G3 — False "Schedule", dial-in and tracking claims; wrong day
*Closed by:* `pages/Closing.tsx`. The dialog's **"Schedule"** button (which only showed the toast "Closing call scheduled") is removed — the footer is "Close" and "Download invite (.ics)"; "Participants: … Dial-in issued with the calendar invite." → "Suggested participants: Founder · Counsel · Banker · Buyer. ExitOS does not send invitations or create a dial-in: download the invite, add a meeting link in your calendar and invite the participants yourself."; subtitle "Tuesday 08:00" → the invite's real date ("Invite for Wednesday, Oct 14, 08:00 AM" — the day after tomorrow, as the .ics always was); .ics summary "Helios Freight transaction" → the active company's name; the take's "ExitOS tracks every signature, escrow movement and filing, and nudges the owner before each due date" → "ExitOS keeps this checklist and builds the call agenda. It does not track signatures, escrow or filings, and sends no reminders."
*Verification:* `tsc -b`, eslint clean · Chromium Pro: dialog buttons "✕ / Close / Download invite (.ics)", axe 0; the downloaded .ics reads "SUMMARY:Closing call — Helios Freight transaction" (demo) and "— Northwind Analytics transaction" (intake), DTSTART 2026-10-14 08:00, matching the subtitle; Close returns focus to "Closing call"; 0 errors.

### G4 — Invented item specifics
*Closed by:* `pages/Closing.tsx` (two template titles). "Shareholder consent — 95% threshold" → "Shareholder consent — at the threshold your documents require"; "Regulatory filings — Form 8023 / NJ-1054" → "Regulatory and tax filings — as counsel advises". Both still match the hard-gate rule (`/consent|…|regulatory|…/`), so they stay high-severity gates.
*Verification:* `tsc -b`, eslint clean · Chromium Pro: 0 "95%", "Form 8023", "NJ-1054"; the new titles appear in the checklist, the take and the call agenda ("[gate] Regulatory and tax filings — as counsel advises — owner Counsel").

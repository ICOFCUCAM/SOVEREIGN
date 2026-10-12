# ExitOS redesign · Page 23 — Bid Room (`/console/negotiator`)

| | |
|---|---|
| Route | `/console/negotiator` |
| Component | `src/pages/Negotiator.tsx` (421 lines) |
| NAV | "Bid Room", founder, **Active Mandate (Pro)** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `7f762d9`)

### Purpose
Offer evaluation and negotiation: each sample offer scored with a recommendation, conflicts and counter moves; a generated counteroffer (price, structure, justification) and a response draft; reservation lines; "Autonomous Negotiation" terms; negotiation posture; cross-bid comparison.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Offers, scores, conflicts, comparison, posture | `OFFER_EVALUATIONS`, `OFFER_COMPARISON`, `NEGOTIATION_STATE` on `SAMPLE_OFFERS` (demo) | Engine on **demo offers, unlabelled** |
| **"Leading bid 67/100 — Vista"**; banker's take "Lead with {active} — your strongest bid" | the *selected* offer, which defaults to the first in the list (Vista 67) | **Wrong**: the engine's leader is Microsoft Industry Solutions (68) |
| **"Send counter →" → toast "Counter sent to {buyer}"**, "Sent ✓ · resend" | local state | **False action** — nothing is sent |
| Response draft | template; "Re: Acquisition of **Helios Freight**" hard-coded; growth **0.42 hard-coded** ("from company profile (Helios)"); signed "**James** — on behalf of Helios Freight"; "the competitive process underway" | **Invented sender**, hard-coded demo facts |
| Counter price | max(value, offer) × (1 + 18 / 12 / 7 % by leverage), capped at 105 % of the high value; "strategic-buyer valuation midpoint" | Rule, unexplained; D1 wording ("strategic mid" — the canonical value is institutional) |
| **"AI Deal Negotiator"; "Autonomous Negotiation — the AI anchors the counter, drafts the clauses, and engineers seller protections like a junior banker and lawyer"; "AI strategy: …"** | `autonomousTerms()` — fixed lists of clauses (4 % reverse break fee, 10 % indemnity cap, 8 % escrow …); the "strategy" echoes the three inputs | **Overclaim** — templates, not AI; no legal-advice caveat |
| Walk-away / minimum / ideal; headline floor | `Number(e.target.value)` | No validation; walk > minimum > ideal order not checked |
| Leverage "high" | from the three sample offers | Demo |
| Draft overlay | plain `div` | Not a dialog (X13 does not apply) |
| Tape | registry snapshot | Fake live (pinging) |

### Observation closed
`NEGOTIATION_STATE.leadingBuyer` receives an offer id (noted on Page 10). It is not displayed anywhere (`nextMove` and `recommendations` do not use it) — no visible effect; left unchanged.

### Baseline (Active Mandate)
Active Mandate: `h1` none · axe 0 · no overflow · 0 errors. Free / Preparation: Upgrade page.

## Gap register — Page 23
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **"Leading bid" / "your strongest bid" show the first offer, not the engine's leader.** | Default selection and the leading-bid metric follow `OFFER_COMPARISON.leader`; the banker's take names the leader. | ☑ `9e4d5fa` |
| G2 | **False "Counter sent".** | Copy only, and "Nothing is sent from ExitOS"; no sent state. | ☑ `b042c31` |
| G3 | **Invented sender and hard-coded demo facts in the draft.** | "[Your name]"; company name and growth from the company profile; no "competitive process" claim beyond the offer count. | ☑ `6dc91dc` |
| G4 | **"AI / autonomous" overclaims**; counter rule unexplained; "strategic mid" (D1). | "Standard negotiating positions (templates) — not legal advice"; counter rule stated; "enterprise value (institutional)". | ☑ G4-commit |
| G5 | Unvalidated amounts; demo offers unlabelled. | `parseNumber` with walk ≤ minimum ≤ ideal checks; badge and line for sample offers. | ☐ |
| G6 | Design: old primitives, draft overlay not a dialog, tape. | Rebuild on `xo`; draft in the shared `Modal`; `RegistryTape`. | ☑ `2bf306b` |

---

## Closure log

### G6 — Design, dialog, tape
*Closed by:* `pages/Negotiator.tsx` rebuilt on `xo` (`PageHeader` `h1` with Edit reservation lines and Generate counter as header actions; four metrics; banker's take as a page-local definition list (shared `BankerTake` no longer used here); offers as a `nav` of buttons with `aria-current`; the selected offer as a labelled section with `h2`/`h3`/`h4`; counteroffer, score breakdown, conflicts and moves with severities in words; cross-bid comparison as a definition list; the response draft now opens in the shared `Modal` (an accessible dialog since X13) instead of a bare overlay; pinging `MarketTape` → dated `RegistryTape`). Content carried over verbatim; G1–G5 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Active Mandate 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe 0 (after moving the "→" inside a `dt` — axe flagged it as an invalid `dl` child), all tab stops with visible focus; draft and reservation dialogs: role dialog, focus inside, axe 0, Escape returns focus to the opener · free: Upgrade page.

### G1 — "Leading bid" showed the first offer, not the engine's leader
*Closed by:* `pages/Negotiator.tsx`. The leader is `OFFER_EVALUATIONS.find(offerId === OFFER_COMPARISON.leader)`; it is the **default selection**, the "Leading bid" metric always shows it whatever offer is selected, and the banker's take "Lead with … your strongest bid" names it (adding "The counter shown is for {selected}" when another offer is selected). Before: Vista 67/100 (first in the list) was shown as the leading bid; the engine's leader is Microsoft Industry Solutions 68/100.
*Verification:* `tsc -b`, eslint clean · Chromium (Active Mandate): "Leading bid 68/100 Microsoft Industry Solutions"; banker's take "Lead with Microsoft Industry Solutions — your strongest bid at 68/100."

### G2 — False "Counter sent"
*Closed by:* `pages/Negotiator.tsx`. The draft dialog's "Send counter →" (toast "Counter sent to {buyer}", then "Sent ✓ · resend") is removed with its state. The footer reads "Nothing is sent from ExitOS — copy the draft into your own email." and offers **Copy draft**.
*Verification:* `tsc -b`, eslint clean · Chromium: the dialog shows the note and "Copy draft"; no send control.

### G3 — Invented sender and hard-coded facts in the draft
*Closed by:* `pages/Negotiator.tsx`. The draft is signed "**[Your name]** — on behalf of {company}" (was "James — on behalf of Helios Freight"); the subject line and signature take the company name from `SAMPLE_COMPANY` (the offers' company) instead of the hard-coded "Helios Freight"; ARR growth comes from the profile (`SAMPLE_COMPANY.growth.arrGrowthYoyPct`, 42 %) instead of the constant `0.42`, and prints as a whole percent; "the competitive process underway" → "the other offers we have received" (the offer count is stated below it).
*Verification:* `tsc -b`, eslint clean · Chromium: draft begins "Re: Acquisition of Helios Freight — response to your $165,000,000 proposal", ends "[Your name] — on behalf of Helios Freight"; 0 "James".

### G4 — "AI / autonomous" overclaims; counter rule unexplained; D1 wording
*Closed by:* `pages/Negotiator.tsx` (text only; the counter rule and templates unchanged).
| Before | After |
|---|---|
| `h1` "AI Deal Negotiator" | "Bid Room" (the NAV name), eyebrow "Negotiation desk" |
| "Autonomous Negotiation · AI — the AI anchors the counter, drafts the clauses, and engineers seller protections like a junior banker and lawyer"; "AI strategy: …" | "Negotiating positions · Standard templates — not legal advice — … standard negotiating positions with fixed figures (for example a 4% reverse break fee) — a starting list to take to your advisers"; "Your lines: …" |
| "AI Counteroffer" | "Counteroffer (rule)" + the rule (anchor = max(enterprise value, offer) + 18 / 12 / 7 % by leverage or override, capped at 105 % of the high value; cash raised to the minimum, earnout capped) |
| "ExitOS does it — … writes the ready-to-send response for you" | "What ExitOS does — Scores every offer and drafts a counter and a response from the stated rules. You review the draft and send it yourself." |
| "Accepting the first bid leaves the strategic premium on the table" | "… may leave value on the table; leverage is high on the offers in hand" |
| "Strategic mid — valuation reference"; justification and draft "strategic-buyer valuation midpoint" (D1) | "Enterprise value — institutional framework · counter reference"; "enterprise value (institutional framework) is …"; draft "an enterprise value of …" |
*Verification:* `tsc -b`, eslint clean · Chromium: the only "AI" on the page is the AI sector in the registry tape; 0 "autonomous" / "strategic-buyer" / "Strategic mid" / "junior banker" · Active Mandate 1440/390: 0 errors, axe 0, no overflow.

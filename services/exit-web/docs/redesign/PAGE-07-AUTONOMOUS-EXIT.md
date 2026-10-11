# ExitOS redesign · Page 07 — Autonomous Exit

| | |
|---|---|
| Route | `/console/autopilot` |
| Component | `src/pages/Autopilot.tsx` (502 lines) |
| NAV | "Autonomous Exit", group Mandate, role founder, **Preparation or Active Mandate** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `dc113ca`)

### Purpose
A guided simulation of an end-to-end exit: eight agents (valuation, buyer discovery, outreach, data room, diligence, negotiation, closing, wealth) each produce a work product from the engines and wait for the founder's approval; deliverables can be reviewed, downloaded or opened as PDF reports. Destination of "Execute" on Pages 02 and 05.

### What is real and what is simulated
| Element | Nature |
|---|---|
| Valuation, buyer list, diligence findings, offer comparison, deliverable documents | Real engine output — for the **demo company** (`VALUATION_*`, `BUYERS`, `discoverFindings()`, `OFFER_COMPARISON` on sample offers) |
| Agent progression (queued → working 1.1 s → needs approval → approved) | Simulated |
| Banner "Simulated … no live outreach, escrow or wires are executed" | Honest |

### Findings (measured / read)
| Finding | Evidence |
|---|---|
| **Access gap:** the Pro gate only applies to the retired `"starter"` plan key. A **Preparation** founder can approve Outreach, Data room, … Closing, Wealth — Active Mandate surfaces. | Chromium, Preparation plan: approved "Approve the ask", "Approve the list", **"Send outreach"**, "Approve gating" |
| **False "sent":** "Send deliverable" / "Send" toasts "… deliverable sent to the deal room" — it only sets local state. | `send()` |
| **Simulation overclaims outside the banner:** "You uploaded revenue, financials and a cap table" with ✓ chips (nothing was uploaded); "runs them autonomously … Approve. Approve. Approve. Money arrives."; status "✓ Deal closed"; finale **"Money arrives — $102.8M wired to escrow → your account"**, "ExitOS ran your exit end to end … money in the bank"; decision "Send the anonymized teaser to N buyers?". | page text |
| Demo company, unlabelled; Pages 02/05 send a founder with saved figures here and this page shows Helios Freight. | `lib/engines` imports |
| "Launch a mandate & continue" upgrades the plan in place without saying it's a demo switch. | `upgradeTo("pro")` |
| Baseline a11y: `h1` present, axe 0, no overflow (Preparation and Active Mandate, 1440/390). | check script |

## Gap register — Page 07
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Preparation plan can run Active Mandate steps.** | Gate on the access policy (`needsUpgrade` for the outreach surface) instead of the retired `starter` key; Preparation stops after buyer discovery, as the copy already says. "Launch a mandate" states it is a demo plan switch. | ☑ `955c0c0` |
| G2 | **False "sent to the deal room".** | "Mark as ready" + a status that nothing leaves ExitOS in this simulation. | ☑ `3a20159` |
| G3 | **Simulation overclaims** (uploads, "money arrives", "deal closed", "send"). | Every simulated outcome says so: "Simulation complete", "would be wired" etc.; no upload claims; decisions marked "(simulated)". | ☑ `482ad7f` |
| G4 | Demo company unlabelled. | Valuation and buyer discovery on `loadActiveCompany()`; steps still on demo fixtures (diligence findings, sample offers) labelled. | ☐ |
| G5 | Old design system. | Rebuild on `xo` (header, mission control, agent steps as an ordered list with status words, deliverables). | ☐ |

---

## Closure log

### G1 — Preparation plan could run Active Mandate steps (access)
*Closed by:* `pages/Autopilot.tsx`. The step gate reads the access policy — `needsUpgrade("/console/banker", role, plan)` (outreach is an Active Mandate surface) — instead of `plan === "starter"`. Preparation (and the retired Starter key) stop after Buyer Discovery; locked steps read "Requires Active Mandate"; the description names the plan; "Launch a mandate & continue" now says "Demo: this switches your session to Active Mandate instantly — no payment is taken." (the same demo switch as the Upgrade page). Route access itself is unchanged.
*Verification:* Chromium, Preparation: approves "Approve the ask", "Approve the list", then **no further approve button**, "Buyers found" panel with the demo note (before: "Send outreach" and "Approve gating" were approvable). Active Mandate: all 8 steps approvable. eslint clean · 0 errors.

### G2 — False "sent to the deal room"
*Closed by:* `pages/Autopilot.tsx`. "Send deliverable" / "Send" / "Sent ✓ · resend" → **Mark ready** / "✓ Marked ready" / "✓ Ready"; the toast reads "… deliverable marked ready — in this simulation nothing leaves ExitOS"; the review modal says "Nothing is sent from this simulation." The recorded state is the same as before.
*Verification:* Chromium (Active Mandate): approve step 1 → Mark ready → toast "Valuation Agent deliverable marked ready — in this simulation nothing leaves ExitOS", button "✓ Ready" · eslint clean · 0 errors.

### G3 — Simulation overclaims
*Closed by:* `pages/Autopilot.tsx` (text only).
| Before | After |
|---|---|
| "You uploaded revenue, financials and a cap table. ExitOS does the rest … approve, approve, approve." + ✓ revenue / financials / cap table chips | "A walkthrough of how the agents would run an exit on the figures ExitOS holds … Each step waits for your approval." Chips removed (nothing was uploaded). |
| "…runs them autonomously … Approve. Approve. Approve. Money arrives." | "…in sequence. Each pauses to put one decision in front of you. In this simulation nothing is sent, signed or wired." |
| "Your decision" | "Your decision · simulated" |
| "✓ Deal closed · you approved 8 decisions" | "✓ Simulation complete · you approved 8 decisions" |
| Finale "Money arrives — $X wired to escrow → your account"; "ExitOS ran your exit end to end … money in the bank" | "Simulation complete — $X enterprise value used in this walkthrough — no money moves"; "You approved 8 simulated decisions. In a live mandate these steps run with real buyers, documents and escrow; here each step was simulated on engine output." |
| Gate: "took you from uploads to a priced, listed company" | "priced the company and matched N buyers" (no listing is created here) |
*Verification:* Chromium (Active Mandate), full 8-step run: finale shows "Simulation complete"; 0 matches for money arrives / uploaded / deal closed / money in the bank / wired to escrow · eslint clean · 0 errors.

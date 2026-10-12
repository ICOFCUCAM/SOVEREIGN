# ExitOS redesign · Page 31 — Engagement Registry

| | |
|---|---|
| Route | `/console/engagement-registry` |
| Component | `src/pages/EngagementRegistry.tsx` (90 lines) + `lib/engagement-registry.ts`, `lib/buyer-contact.ts`, `lib/buyer-dna.ts` (`acquisitionAppetiteScore`) |
| NAV | "Engagement Registry", founder, **Preparation or Pro** (free: Upgrade page) |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `3b2aba2`)

### Purpose
One row per registry buyer (top 40): intent, deal history, outreach path, contact confidence, NDA / LOI conversion and close rate, ranked by an "engagement likelihood".

### Data flow
| Element | Source | Nature |
|---|---|---|
| Engagement score | `engagementLikelihood`: with no response history, **appetite score × contact-confidence factor** (High 1, Medium 0.85, Low 0.6); with history, 0.6 × response rate + 0.4 × appetite. Tiers ≥ 65 High, ≥ 40 Moderate | Rule ✓ — shown as **"100 % engagement"** and "likely to respond"; the rule is only in a hover `title` |
| **"Response history — real processes"**; NDA / LOI conversion | `buyerActivity(buyer_id)` over the deal-event store, plus `BUYER_RESPONSES` (sample fixtures, matched by name) | **Defect:** every event whose subject is a buyer is the **founder's own action** (`viewed_buyer`, `expressed_interest` from Buyer Profile). Verified: opening Microsoft's profile once turns "Response history 0" into **"1 real processes"** and sets Microsoft's response rate to 50, dropping its score 100 → 70 and its rank from 1st. The sample fixtures match no registry buyer (probe: 0 of 24 names), so they never apply |
| Ranking | `engagementRegistry(tokens, 40)` — the score does not use the company | **The same list for every company**; the page implies "who to contact" for you |
| "History 419 · 3/12m" | `events_indexed`, `deals_12m` | Indexed registry entries — most unverified (Page 18) |
| "Outreach path" | first outreach path = the buyer type's typical role | A role, not a path |
| "Contact" High/Medium/Low | `contactConfidence` rule (≥ 40 / ≥ 8 indexed deals) | Rule unstated |
| "Close" | `reg.engagement.closeRatePct` — registry close rate where disclosed (Microsoft 100 %) | Source labelled only in the foot |
| Foot "Engagement likelihood sharpens with every real process" | — | Implies learning that today comes from the founder's own clicks |
| Search | `<input placeholder="Search buyer…">` | **No accessible label** |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline
Free: Upgrade page. Preparation and Pro: `h1` none · axe color-contrast ×39 (1440) · no overflow · 0 errors · 41 tab stops.

## Gap register — Page 31
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **The founder's own clicks counted as buyer response history.** | In `engagement-registry.ts`, count only events a **buyer** performed (`actorRole: "buyer"`) as response history — today none target a buyer, so every score is the stated appetite estimate and "Response history" reads 0 until real buyer responses exist. Calculation change, documented. | ☑ `d6b3754` |
| G2 | **Score shown as a percentage and "likely to respond"; rule hidden.** | "Engagement estimate N/100"; rule stated on the page (appetite × contact-confidence factor; tiers); "High engagement — estimate ≥ 65". | ☑ `b386c88` |
| G3 | Not company-specific; column sources unstated. | Say the ranking is the same for every company; "Indexed deals · last 12m" (mostly unverified); "Typical contact role"; "Contact confidence" with its rule; "Close rate (registry, where disclosed)"; "Intent (stated themes)". | ☑ G3-commit |
| G4 | Fake live tape. | `RegistryTape`. | ☐ |
| G5 | Design: no `h1`, 39 contrast failures, unlabelled search. | Rebuild on `xo`; labelled search. | ☑ `210cec4` |

---

## Closure log

### G5 — Design
*Closed by:* `pages/EngagementRegistry.tsx` rebuilt on `xo` (`PageHeader` `h1` "Engagement Registry"; four metrics; the table in a keyboard-reachable `ScrollRegion` with buyer names as row headers and scoped column headers; the search is a labelled `type="search"` field ("Search buyer") with a polite status "N of 40 buyers shown" and an empty state). Content carried over verbatim; G1–G4 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation and Pro 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 39), 42 tab stops with visible focus · search "micro" → 1 row, status "1 of 40 buyers shown"; "zzzz" → 0 rows and the empty state; axe 0 in both, 1440 and 390.

### G1 — The founder's own clicks counted as buyer response history
*Closed by:* `lib/engagement-registry.ts` — **calculation change** (one line): response history now uses only events whose `actorRole` is `"buyer"` (`buyerActivity(p.buyer_id, allDealEvents().filter((e) => e.actorRole === "buyer"))`). Every event that targets a buyer today is the founder's own (`viewed_buyer` and the local `expressed_interest` on Buyer Profile), so before this a founder opening Microsoft's profile became "1 real process", a 50 % response rate, and an engagement score of 70 instead of 100. The scoring formula itself is unchanged; once buyers' own actions are recorded against a buyer record, they count. `buyerActivity` and its other caller (`BuyerInterestGate`) are unchanged.
*Tests:* two cases added to `engagement-registry.test.ts` — founder views and local interest leave `processesRun` and the score unchanged; a buyer's own `nda_signed` does count. Against the old line the first case fails (1 failed / 6 passed); with the fix 7/7.
*Verification:* `tsc -b`, eslint clean, `vitest` 206/206 (204 + 2 new) · Chromium Pro: after opening the Microsoft and Alphabet profiles the registry still reads "Response history 0", Microsoft 100 first, Alphabet 92 (before the fix: 1 process, Microsoft dropped out of first place); 0 errors.

### G2 — Score shown as a percentage and "likely to respond"; rule hidden
*Closed by:* `pages/EngagementRegistry.tsx` (labels; scores unchanged). Description states the rule: "Engagement estimate (0–100) = the buyer's acquisition-appetite score (cadence, acceleration, recency, breadth, stated themes, geography) × a contact-confidence factor (High 1, Medium 0.85, Low 0.6). Once a buyer's own responses are recorded, it becomes 60% response rate + 40% appetite. High is 65 or more, Moderate 40 or more. An estimate of willingness to engage, not a probability of response." Column "Engagement 100 %" → "Engagement estimate 100/100" with "appetite estimate" / "with response history" under each value; metrics "High engagement — likely to respond" → "High engagement estimate — 65 or more", "Response history — real processes" → "With response history — buyers with recorded responses of their own", "Top buyer — 100% engagement" → "engagement estimate 100/100", "ranked by engagement" → "top 40 by engagement estimate"; foot "Engagement likelihood sharpens with every real process" removed, and NDA/LOI conversion explained ("your own views and interest do not count").
*Verification:* `tsc -b`, eslint clean · Chromium: 0 "likely to respond" / "real process" / "% engagement" / "sharpens"; rule shown · Preparation and Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G3 — Not company-specific; column sources unstated
*Closed by:* `pages/EngagementRegistry.tsx` (labels). A note above the table: "The ranking does not depend on your company: the engagement estimate uses only each buyer's own record, so this list is the same for every company. For buyers ranked against your company, see the Outreach Plan." Columns "Intent" → "Stated themes", "History" → "Indexed deals · 12m", "Outreach path" → "Typical contact role", "Contact" → "Contact confidence", "Close" → "Close rate (registry)"; the foot adds "Indexed deals are registry entries, most of them unverified. Contact confidence is a rule on indexed deals — High at 40 or more, Medium at 8 or more, otherwise Low. The contact role is the one typical for the buyer type, never a named person".
*Verification:* `tsc -b`, eslint clean · probe: `engagementRegistry` for logistics, enterprise-SaaS and empty tokens returns the identical 40 buyers and scores (`identical: true`) · Chromium Preparation and Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0, 43 tab stops with visible focus.

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
| G1 | **The founder's own clicks counted as buyer response history.** | In `engagement-registry.ts`, count only events a **buyer** performed (`actorRole: "buyer"`) as response history — today none target a buyer, so every score is the stated appetite estimate and "Response history" reads 0 until real buyer responses exist. Calculation change, documented. | ☐ |
| G2 | **Score shown as a percentage and "likely to respond"; rule hidden.** | "Engagement estimate N/100"; rule stated on the page (appetite × contact-confidence factor; tiers); "High engagement — estimate ≥ 65". | ☐ |
| G3 | Not company-specific; column sources unstated. | Say the ranking is the same for every company; "Indexed deals · last 12m" (mostly unverified); "Typical contact role"; "Contact confidence" with its rule; "Close rate (registry, where disclosed)"; "Intent (stated themes)". | ☐ |
| G4 | Fake live tape. | `RegistryTape`. | ☐ |
| G5 | Design: no `h1`, 39 contrast failures, unlabelled search. | Rebuild on `xo`; labelled search. | ☑ `210cec4` |

---

## Closure log

### G5 — Design
*Closed by:* `pages/EngagementRegistry.tsx` rebuilt on `xo` (`PageHeader` `h1` "Engagement Registry"; four metrics; the table in a keyboard-reachable `ScrollRegion` with buyer names as row headers and scoped column headers; the search is a labelled `type="search"` field ("Search buyer") with a polite status "N of 40 buyers shown" and an empty state). Content carried over verbatim; G1–G4 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation and Pro 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 39), 42 tab stops with visible focus · search "micro" → 1 row, status "1 of 40 buyers shown"; "zzzz" → 0 rows and the empty state; axe 0 in both, 1440 and 390.

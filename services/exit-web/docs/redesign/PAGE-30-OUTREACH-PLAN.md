# ExitOS redesign · Page 30 — Outreach Plan

| | |
|---|---|
| Route | `/console/outreach-plan` |
| Component | `src/pages/OutreachPlan.tsx` (85 lines) + `lib/outreach-plan.ts`, `lib/buyer-dna.ts` (`rankedBuyers`, `expectedOutcomeFor`), `lib/buyer-contact.ts` |
| NAV | "Outreach Plan", founder, **Preparation or Pro** (free: Upgrade page) |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `06623c9`)

### Purpose
A suggested outreach programme for the active company: the top 20 buyers by likelihood score, split into three waves (4 lead, 8 competitive set, 8 expansion), with a value per buyer, a contact role and a contact-confidence tier.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Buyer list and order | `rankedBuyers(20, activeTokens(company))` — sorted by the composite likelihood score (appetite + sector overlap + velocity + recency) | Engine ✓ — but shown as **"Qualified buyers"**, **"Prob 74 %"** and "Highest-**probability** acquirers" (X14 renamed this composite a *likelihood score*, not a probability). For the demo (Logistics) the list is led by Microsoft, Alphabet, Cisco, IBM, Sony, Embracer — ranked by appetite with **no sector overlap shown** |
| "Expected value" | `expectedOutcomeFor(profile, financialBaseline.mid).expectedClose` = financial baseline × (1 + premium) × close rate — the same rule as the Terminal (Page 01) | Engine ✓, but **unlabelled**: it is a close-weighted value, and where the buyer has no disclosed premium or close rate a neutral **prior** (20 %, 55 %) is used — most rows read **$48M** for that reason, with no PRIOR tag (the Terminal tags it) |
| "Contact path" | `outreachPaths[0].channel ?? bestContactRole` — for every row in the demo: "Director / VP, Corporate Development" | A typical **role**, not a path |
| "Conf" High / Medium / Low | `contactConfidence`: ≥ 40 indexed deals High, ≥ 8 Medium, else Low | Fixed rule on indexed-deal counts (most registry events are unverified — Page 18); rule not stated |
| Status "**Sequenced**", "targeted, not mass", "Lead bidders" | — | Implies a running programme; nothing is sent or scheduled — it is a suggested plan |
| Tag | `fromIntake ? "Your mandate" : company.name` | Demo **unlabelled** |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline
Free: Upgrade page (`h1` 1, axe 0). Preparation and Pro: `h1` none · axe color-contrast ×26 (1440) · no overflow · 0 errors.

## Gap register — Page 30
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Likelihood score shown as a probability; "qualified buyers".** | "Likelihood score N/100 — composite, not a probability"; "Ranked buyers"; wave text without "probability"; show each buyer's sector overlap with this company (additive field) and say how many have none. | ☑ `4a0a723` |
| G2 | **Value per buyer unlabelled; priors untagged.** | "Close-weighted value" with the formula and baseline in the foot; PRIOR tag where premium or close rate is the neutral assumption (additive fields); the anchor metric labelled the same. | ☑ `d88eadb` |
| G3 | "Contact path" is a role; "Conf" rule unstated. | "Typical contact role"; "Contact confidence" with its rule (indexed deals, mostly unverified). | ☑ `d1f13e3` |
| G4 | "Sequenced" implies a running programme. | Say it is a suggested plan: nothing is sent or scheduled; week labels are suggested timing. | ☑ `61bfec0` |
| G5 | Demo unlabelled. | Demo data / Your intake badge and line. | ☑ `25f08d5` |
| G6 | Fake live tape. | `RegistryTape`. | ☐ |
| G7 | Design: no `h1`, 26 contrast failures. | Rebuild on `xo`. | ☑ `edab625` |

---

## Closure log

### G7 — Design
*Closed by:* `pages/OutreachPlan.tsx` rebuilt on `xo` (`PageHeader` `h1` "Buyer Outreach Plan" with the summary as description; four metrics; each wave a titled `Section` with its buyer table in a keyboard-reachable `ScrollRegion`, buyer names as row headers, column headers scoped; footer link underlined). Content carried over verbatim; G1–G6 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation and Pro 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 26), all tab stops with visible focus · free: Upgrade page.

### G1 — Likelihood score shown as a probability; "qualified buyers"
*Closed by:* `pages/OutreachPlan.tsx` and `lib/outreach-plan.ts` (labels; ranking unchanged). Column "Prob 74 %" → "Likelihood score 74/100"; "Qualified buyers — targeted, not mass" → "Ranked buyers — top 20 by likelihood score"; summary "20 qualified buyers … (74%, …)" → "20 ranked buyers … (likelihood score 74/100, …)"; wave rationales "Highest-probability acquirers" → "Highest likelihood scores", "lower-probability fits" → "lower-scoring fits"; a note above the waves: "Buyers are ranked by likelihood score — a composite of acquisition appetite, sector overlap with {company}, deal cadence and recency (0–100), not a probability. N of 20 have no sector overlap with this company and rank on appetite, cadence and recency alone."; each such row reads "· no sector overlap". `PlanBuyer` gains `sectorOverlapPts` (additive — the score's existing overlap component).
*Finding:* for the demo company (Helios Freight, Logistics) **all 20** ranked buyers have no sector overlap — the plan is led by Microsoft, Alphabet, Cisco and IBM purely on appetite, cadence and recency. With the Northwind (enterprise SaaS) intake, 10 of 20 have none. The page now says so; the ranking rule is unchanged (owner decision whether overlap should gate the list).
*Verification:* `tsc -b`, eslint clean, `outreach-plan.test.ts` 4/4 · Chromium: 0 "Prob" / "qualified buyers" / "probability" outside "not a probability"; demo "20 of 20 have no sector overlap", intake "10 of 20" · Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G2 — Value per buyer unlabelled; priors untagged
*Closed by:* `pages/OutreachPlan.tsx` and `lib/outreach-plan.ts` (labels; values unchanged). Column "Expected value" → **"Close-weighted value"**, with a **PRIOR** tag (the Terminal's) where the buyer has no disclosed premium or close rate; metric "Anchor expected value — top buyer" → "Lead buyer · close-weighted — Microsoft · expected offer × close rate"; the note states the rule: "Close-weighted value = financial baseline $72M × (1 + the buyer's premium) × its close rate — the Terminal's rule. PRIOR marks 18 of 20 buyers that have not disclosed a premium or close rate, so a neutral assumption (premium 20%, close rate 55%) is used."; summary "exp." → "close-weighted". `PlanBuyer` gains `premiumKnown` and `closeKnown` (additive, from the existing `expectedOutcomeFor`).
*Note:* the value is on the **financial baseline** ($72M for the demo), as on the Terminal, not the $103M headline (D1 governs the headline valuation; this is a per-buyer expected offer built from the pre-premium baseline plus that buyer's premium).
*Verification:* `tsc -b`, eslint clean, `outreach-plan.test.ts` 4/4 · Chromium: demo 18 of 20 tagged PRIOR (the two $48M-free rows, Microsoft $102M and Amazon $117M, carry disclosed figures); intake (Northwind) baseline $291M, 18 of 20 · Preparation and Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G3 — "Contact path" is a role; "Conf" rule unstated
*Closed by:* `pages/OutreachPlan.tsx` (labels). Column "Contact path" → "Typical contact role" (the plan takes the first outreach path, which is always the buyer type's typical role, e.g. "Director / VP, Corporate Development"); "Conf" → "Contact confidence"; footer: "the role is the one typical for the buyer type, never a named person; confidence is a rule on the buyer's indexed deals — High at 40 or more, Medium at 8 or more, otherwise Low — and most indexed deals are unverified registry entries."
*Verification:* `tsc -b`, eslint clean · Chromium: 0 "Contact path" / "Conf" headers · Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G4 — "Sequenced" implies a running programme
*Closed by:* `pages/OutreachPlan.tsx` and `lib/outreach-plan.ts` (labels). Status "Sequenced" → "Suggested plan · nothing sent"; description adds "This is a suggested plan: ExitOS has not contacted any of these buyers, and nothing is sent or scheduled. Week labels are suggested timing from the day you start."; "Sequenced waves — competitive tension" → "Suggested waves — to build competitive tension"; "Lead bidders — week 1" metric → "Lead wave — buyers · suggested week 1"; wave headers "Week 1 · 4 buyers" → "Suggested week 1 · 4 buyers"; summary "sequenced waves" → "suggested waves". The wave name "Lead bidders" is kept (the plan's label, asserted in `outreach-plan.test.ts`).
*Verification:* `tsc -b`, eslint clean, `outreach-plan.test.ts` 4/4 · Chromium: 0 "sequenced"; the description shown · Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### G5 — Demo unlabelled
*Closed by:* `pages/OutreachPlan.tsx`. Eyebrow "Demo company: Helios Freight" / "Your intake: …" (was "Your mandate" or the bare name), **Demo data** / **Your intake** badge, and the description ends "Built for the demo company (Helios Freight); save an intake to build it for your company." or "Built for {company} from your saved intake."
*Verification:* `tsc -b`, eslint clean · Chromium: demo → Demo data and the demo line; intake (Northwind Analytics) → Your intake and its line · Preparation and Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

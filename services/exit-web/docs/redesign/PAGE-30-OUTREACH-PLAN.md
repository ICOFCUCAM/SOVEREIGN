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
| G1 | **Likelihood score shown as a probability; "qualified buyers".** | "Likelihood score N/100 — composite, not a probability"; "Ranked buyers"; wave text without "probability"; show each buyer's sector overlap with this company (additive field) and say how many have none. | ☐ |
| G2 | **Value per buyer unlabelled; priors untagged.** | "Close-weighted value" with the formula and baseline in the foot; PRIOR tag where premium or close rate is the neutral assumption (additive fields); the anchor metric labelled the same. | ☐ |
| G3 | "Contact path" is a role; "Conf" rule unstated. | "Typical contact role"; "Contact confidence" with its rule (indexed deals, mostly unverified). | ☐ |
| G4 | "Sequenced" implies a running programme. | Say it is a suggested plan: nothing is sent or scheduled; week labels are suggested timing. | ☐ |
| G5 | Demo unlabelled. | Demo data / Your intake badge and line. | ☐ |
| G6 | Fake live tape. | `RegistryTape`. | ☐ |
| G7 | Design: no `h1`, 26 contrast failures. | Rebuild on `xo`. | ☐ |

---

## Closure log

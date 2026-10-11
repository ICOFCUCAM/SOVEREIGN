# ExitOS redesign · Page 10 — Liquidity & Transition

| | |
|---|---|
| Route | `/console/wealth` |
| Component | `src/pages/Wealth.tsx` (192 lines) |
| NAV | "Liquidity & Transition", group Mandate, role founder, **Active Mandate (Pro)** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `0ec8465`)

### Purpose
After the deal: what the founder walks away with (headline → preferences → tax), when each tranche becomes liquid, a diversification plan and the post-exit topics (tax, trusts, family office, investing, philanthropy, next venture).

### Data flow
| Element | Source | Nature |
|---|---|---|
| "Leading offer" | `SAMPLE_OFFERS.find(o => o.buyerName === OFFER_COMPARISON.leader)` — but `leader` is an **offer id** (`"o-002"`), so the match never succeeds and the page always falls back to the first sample offer | **Bug**: shows Vista ($132M); the engine's leader is Microsoft Industry Solutions ($165M) |
| "Your gross" | sum of every `founder`-role holder in the sample cap table (three founders + founder warrants) with the group's stake % | **Mislabel** — the founder group, not "you" |
| "After preferences" | `waterfall.netToFoundersUsd` — the engine's **risk-adjusted** value (stock −15 %, earnout −45 %) | **Mislabel** — preferences are already out of the founders' gross; this is a risk haircut |
| Tranches (cash / stock / earnout) | after-tax risk-adjusted value × the offer's mix | **Wrong arithmetic** — haircut applied, then mixed again; the engine already gives each founder's nominal cash, stock and earnout |
| "Liquid on day one" | cash tranche | Ignores the offer's **escrow** term (e.g. 12 % / 24 mo) |
| Lock-up "~6–12 months", earnout "~24 months" | hard-coded | Not in the offer terms; unlabelled |
| Tax 23.8 % | constant (comment: "illustrative; the engine has no tax model") | Assumption shown as "est. capital gains", applied to the whole amount, no basis, federal only — not said on the page |
| Diversification plan 55 / 20 / 15 / 10 % | constant | Illustrative template |
| "WealthOS" nine threads with pills **Allocated / Reserved / Recommended / Setup** and amounts at 12 / 30 / 8 / 10 / 12 / 8 / 10 % | constants | **Invented statuses and a second, inconsistent allocation** (does not match the 55/20/15/10 plan) |
| Family office "SFO if ≥ $50M" | rule | Unstated threshold |
| "ExitOS runs the waterfall, models the tax, schedules the liquidity and drafts the diversification plan"; "nine threads ExitOS keeps after the wire"; "ExitOS keeps the readiness clock running for round two" | — | **Overclaims** (flat-rate tax, nothing scheduled, no ongoing service) |
| Banker's take "At lock-up, move 55 % …" | constant | Investment recommendation from a template |
| Tape | registry snapshot | Fake live (pinging) |
| Offers and cap table | demo sample (Helios Freight); intake has neither | Demo, unlabelled |

### Baseline (Active Mandate)
`h1` none · axe 0 · no overflow · 0 errors. Free / Preparation: Upgrade page.

## Gap register — Page 10
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Wrong leading offer** (id compared with a buyer name). | Match on `offerId`; the page follows the engine's leader. | ☐ |
| G2 | **Cascade and tranches mislabelled and miscomputed** ("your" = founder group; "after preferences" = risk haircut; haircut × mix; escrow ignored; timings invented). | Cascade: headline → preference stack → founders' gross (named as the founder group) → risk-adjusted value (engine haircuts stated) → after the tax assumption. Tranches from the engine's nominal cash / stock / earnout for the founders; escrow held back from cash per the offer term; timings from the offer where present, else "not in the offer terms". | ☐ |
| G3 | Tax assumption unlabelled. | State it wherever used: flat 23.8 % (US federal LTCG + NIIT), whole amount, no cost basis, no state tax, no QSBS. | ☐ |
| G4 | **Invented statuses and a second allocation** ("Allocated", "Reserved", "Recommended", "Setup"; 12/30/8 … %). | One illustrative template (labelled "not a recommendation"); the topics list without invented amounts or statuses; family-office line states its $50M rule. | ☐ |
| G5 | Overclaims (runs/models/schedules/drafts; keeps threads; readiness clock for round two). | Plain wording. | ☐ |
| G6 | Demo offers and cap table unlabelled. | Badge and line: sample offers and cap table (demo), also when an intake is saved (intake has no offers or cap table). | ☐ |
| G7 | Fake live tape. | `RegistryTape`. | ☐ |
| G8 | Design: no `h1`, old primitives. | Rebuild on `xo`. | ☑ G8-commit |

### Observation (no visible effect today)
`lib/engines.ts` and `lib/exit-process.ts` pass `OFFER_COMPARISON.leader` (an offer id) as `leadingBuyer` to `deriveNegotiationState`. No page displays `leadingBuyer`; left as is and re-checked on the Negotiator page.

---

## Closure log

### G8 — Design
*Closed by:* `pages/Wealth.tsx` rebuilt on `xo` (`PageHeader` `h1` "Liquidity & Transition" — the navigation name; "WealthOS" was only the old header — three summary metrics, banker's take as a page-local definition list (shared `BankerTake` no longer used here), cascade as an ordered list, lifecycle topics as a list with `h3`s, tranches and allocation with decorative bars and values in text, after-the-wire cards with `h3`s). Content carried over verbatim; G1–G7 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Active Mandate 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe 0, 12 tab stops all with visible focus.

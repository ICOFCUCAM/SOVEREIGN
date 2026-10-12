# ExitOS redesign · Page 26 — Active Processes (`/console/pipeline`)

| | |
|---|---|
| Route | `/console/pipeline` |
| Component | `src/pages/Pipeline.tsx` (262 lines) |
| NAV | "Active Processes", group Exchange, founder, no plan gate |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `e25bdb7`)

### Purpose
A kanban of deals across the negotiation stages, a "Deal Probability Engine" table (close probability, expected days, probability-adjusted value, top risk), negotiation posture and stage-conversion benchmarks.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Three offer deals | `OFFER_EVALUATIONS` on the sample offers; stage from the recommendation (counter → LOI, decline → dead) | Engine on **demo offers, unlabelled** |
| **"C.H. Robinson Bolt-on — engaged, $110M, 25 %"**, "Pritzker Private Capital — sourcing, 5 %", "Walton Enterprises — sourcing, 4 %" | hard-coded in the page ("placeholder until outreach engine ships", a code comment only) | **Invented deals** counted in "Live deals", "Pipeline value" and the probability-weighted total |
| **"Deal Probability Engine — Predicted close probability …"** | `probFromScore`: accept ≥ 85 %, counter max(45 %, 0.85 × score), decline 5 %, else max(20 %, 0.5 × score); expected days = stage base (140 / 96 / 64 / 38 / 14) × (1 − 0.45 × p) | Fixed rules called a prediction engine |
| **"Stage conversion · benchmarks" 38 % / 42 % / 55 % / 61 % / 92 %** | hard-coded, no source anywhere in the codebase | **Invented benchmarks** |
| "ExitOS scores every deal, drafts the counter and sequences buyer follow-ups automatically" | — | Overclaim (no follow-up sequencing exists) |
| `h1` | none ("Acquisition Pipeline" header; NAV "Active Processes") | |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline (free founder — no plan gate)
`h1` none · axe color-contrast ×11 (1440) · no overflow · 0 errors.

## Gap register — Page 26
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Three invented deals** in the pipeline and its totals. | Remove them; the sourcing column shows the top ranked buyers from discovery as "candidates — not contacted", with no amount or probability, excluded from totals. | ☐ |
| G2 | **Invented stage-conversion benchmarks.** | Remove the figures; say no sourced benchmark exists yet. | ☐ |
| G3 | "Prediction engine" and automation overclaims. | "Close-probability rule" with its formula; expected-days rule stated; plain "What ExitOS does". | ☐ |
| G4 | Demo offers unlabelled. | Badge and line: sample offers of the demo company. | ☐ |
| G5 | Design: no `h1`, 11 contrast failures, tape. | Rebuild on `xo`; `h1` "Active Processes"; `RegistryTape`. | ☑ `82783c3` |

---

## Closure log

### G5 — Design
*Closed by:* `pages/Pipeline.tsx` rebuilt on `xo` (`PageHeader` `h1` **"Active Processes"** — the NAV name; "Acquisition Pipeline" in the eyebrow; five metrics; the command-state strip and banker's take merged into one page-local definition list (Today, At stake, If you wait, Pursue, What ExitOS does — shared `BankerTake`/`CommandState` no longer used here); probability table with row headers in a `ScrollRegion`; the kanban as labelled stage sections with `h3`s and lists; stage names as words; pinging tape kept until G-tape below). Content carried over; G1–G4 follow.
*Verification:* `tsc -b`, eslint clean · Chromium free 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 11), all tab stops with visible focus.

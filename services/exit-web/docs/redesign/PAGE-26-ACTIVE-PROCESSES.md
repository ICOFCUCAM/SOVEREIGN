# ExitOS redesign · Page 26 — Active Processes (`/console/pipeline`)

| | |
|---|---|
| Route | `/console/pipeline` |
| Component | `src/pages/Pipeline.tsx` (262 lines) |
| NAV | "Active Processes", group Exchange, founder, no plan gate |
| Status | All five gaps closed. Part of the all-pages run; reviewed together at the end. |

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
| G1 | **Three invented deals** in the pipeline and its totals. | Remove them; the sourcing column shows the top ranked buyers from discovery as "candidates — not contacted", with no amount or probability, excluded from totals. | ☑ `bc3aef0` |
| G2 | **Invented stage-conversion benchmarks.** | Remove the figures; say no sourced benchmark exists yet. | ☑ `dbce62f` |
| G3 | "Prediction engine" and automation overclaims. | "Close-probability rule" with its formula; expected-days rule stated; plain "What ExitOS does". | ☑ `4451c62` |
| G4 | Demo offers unlabelled. | Badge and line: sample offers of the demo company. | ☑ `0a09c40` |
| G5 | Design: no `h1`, 11 contrast failures, tape. | Rebuild on `xo`; `h1` "Active Processes"; `RegistryTape`. | ☑ `82783c3` |

---

## Closure log

### G5 — Design
*Closed by:* `pages/Pipeline.tsx` rebuilt on `xo` (`PageHeader` `h1` **"Active Processes"** — the NAV name; "Acquisition Pipeline" in the eyebrow; five metrics; the command-state strip and banker's take merged into one page-local definition list (Today, At stake, If you wait, Pursue, What ExitOS does — shared `BankerTake`/`CommandState` no longer used here); probability table with row headers in a `ScrollRegion`; the kanban as labelled stage sections with `h3`s and lists; stage names as words; pinging tape kept until G-tape below). Content carried over; G1–G4 follow.
*Verification:* `tsc -b`, eslint clean · Chromium free 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 11), all tab stops with visible focus.
*Completed in a follow-up commit (the G5 row includes the tape):* pinging `MarketTape` → dated `RegistryTape`. Chromium: 0 pinging elements; the 3 remaining "live" words are "live deals" (active deals, not live data) — renamed in G1.

### G1 — Three invented deals
*Closed by:* `pages/Pipeline.tsx`. The hard-coded "C.H. Robinson Bolt-on (engaged, $110M, 25 %)", "Pritzker Private Capital (sourcing, 5 %)" and "Walton Enterprises (sourcing, 4 %)" are removed. The sourcing column now lists the **top three discovery candidates that have not made an offer** (from `BUYERS`), dashed and marked "candidate — not contacted", with no amount or probability and not counted anywhere ("Sourcing 0 + 3 candidates"). "Live deals" → "Active deals — offers, excluding dead" (and "live deals" → "active deals" in the take — not live data).
Totals now reflect only the sample offers: **2 active deals** (was 5), pipeline value **$297,000,000** (was $407M with the invented $110M), probability-weighted **$171,163,315**.
*Verification:* `tsc -b`, eslint clean · Chromium: 0 "C.H. Robinson" / "Walton" deals; Pritzker appears only as a discovery candidate; figures above · free 1440/390: 0 errors, axe 0, no overflow.

### G2 — Invented stage-conversion benchmarks
*Closed by:* `pages/Pipeline.tsx`. The five hard-coded rates (Sourcing → Engaged 38 %, Engaged → Diligence 42 %, Diligence → LOI 55 %, LOI → Signed 61 %, Signed → Closed 92 %) had no source anywhere in the codebase and are removed. The section stays and says: "No sourced stage-conversion benchmark is available yet, so none is shown. Conversion rates will appear here once they can be measured from recorded processes or cited from a source."
*Verification:* `tsc -b`, eslint clean · Chromium: 0 "38%" / "92%"; the note is shown.

### G3 — "Prediction engine" and automation overclaims
*Closed by:* `pages/Pipeline.tsx` (labels; rules unchanged). "Deal Probability Engine — Predicted close probability …" → **"Close-probability rule"** with the full rule in the foot (accept ≥ 85 %, counter max(45 %, 0.85 × score), other max(20 %, 0.5 × score), decline 5 %; expected days = stage base 140 / 96 / 64 / 38 / 14 × (1 − 0.45 × p); adjusted value = amount × p) and "Rule, not a prediction"; metric "Prob-weighted (rule)"; "ExitOS scores every deal, drafts the counter and sequences buyer follow-ups automatically" → "What ExitOS does — Scores each offer and applies the stated close-probability rule. Counters are drafted in the Bid Room; follow-ups are not sequenced automatically."
*Verification:* eslint clean · Chromium: 0 "Probability Engine" / "Predicted" / "sequences buyer follow-ups automatically".

### G4 — Demo offers unlabelled
*Closed by:* `pages/Pipeline.tsx`: **Demo data** badge and "The demo company's sample offers (Helios Freight) and its top discovery candidates. Saved intakes hold no offers, so this page stays on demo data."
*Verification:* `tsc -b`, eslint clean, `vitest` 204/204 · Chromium free/Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus · 0 "live" words, 0 pinging elements.

---

## Final verification
`tsc -b` pass · eslint 0 errors · `vitest` 204/204 · Chromium free/Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0 (was 11), all tab stops with visible focus · 0 "live" words · totals now from the sample offers only.

## Known issues
- No real pipeline exists yet: offers are the demo company's samples; candidates come from discovery (labelled).
- Close probabilities are fixed rules (stated); no stage-conversion benchmark is shown until one can be sourced.

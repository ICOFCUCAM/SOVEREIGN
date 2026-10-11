# ExitOS redesign · Page 05 — Chief Investment Banker

| | |
|---|---|
| Route | `/console/commander` |
| Component | `src/pages/Commander.tsx` (137 lines) + `components/CommandTiles.tsx`, `ExitCommander.tsx`, `CommanderBlocks.tsx` (now used **only** by this page — Page 02 stopped using them) |
| NAV | "Chief Investment Banker", group Mandate, role founder, **Active Mandate (Pro)** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `dfa4175`)

### Purpose
The paid founder's command surface: value now and after fixes, odds, who is circling, the banker's recommended instruction (Execute → Autonomous Exit), links to the other layers, board memorandum / publishing.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Company | `SAMPLE_COMPANY` (always) | **Demo**, unlabelled, even with a saved intake |
| Value, potential, exit probability, demand, buyers, time, confidence | `commanderMetrics()` (demo context; D1 value) | Model / heuristic indices |
| **Exit probability breakdown** | `CommanderBlocks.ExitProbabilityBreakdown`: fixed weights *market conditions 26, buyer demand 21, technology moat 18, growth 14, readiness 11, risk −6* scaled to the 84 % | **Invented decomposition** — the index is 0.35·Exit Score + 0.40·demand + 0.25·leverage; none of these six factors is an input |
| Deal temperature HOT 98 | `min(98, 70 + 4·active)` | Heuristic (same as Page 02 liquidity index) |
| Buyer movement ("Actively deploying / Monitoring") + pinging dot | `DEAL_BUYERS` appetite field (static registry attribute) | **Not movement**; fake live dot |
| Expected automation "What runs the moment you press Execute" with ✓ | static list | **Overclaim** — Execute only navigates to Autonomous Exit, where each step waits for approval |
| Acquisition radar "N qualified buyers" | `BUYERS.byType` (top-12 cap) | Mislabel |
| Banker notes "Computed from the live engine state" | deal context + deal history | Live claim |
| Tape, reactors, "Live telemetry", "live market feed" | registry snapshot | Fake live |
| Liquidity Board "Live" + "Close probability — likelihood of a completed transaction"; Morning Briefing "One instruction dispatches the agents", "Premium probability" | shared components | Same defects fixed on Page 02 |

### Baseline (measured, Active Mandate plan)
| Check | Result |
|---|---|
| `h1` | none |
| axe | color-contrast ×15 (1440), ×7 (390) |
| Overflow at 390 | **yes** |
| Free plan | Upgrade page (gate works) |

## Gap register — Page 05
| # | Gap | Fix (no calculation changed) | Status |
|---|---|---|---|
| G1 | Always the demo company, unlabelled. | Run on `loadActiveCompany()` via `dealContextFor` / `commanderMetrics(ctx, analysis)` (as Page 02); data badge. | ☑ `545da32` |
| G2 | **Invented probability breakdown.** | Show the real index decomposition: 0.35 × Exit Score, 0.40 × buyer demand, 0.25 × negotiation leverage (sample offers), each with its points. | ☑ `70730b9` |
| G3 | Fake live (tape, pinging dots, "Live", "live telemetry", "live market feed", "live engine state"). | Snapshot-dated labels, `RegistryTape`, no live dots. | ☑ `a0b5fec` |
| G4 | Overclaims and mislabels: "What runs the moment you press Execute" ✓ list; "Buyer movement" from a static attribute; "qualified buyers" = top-12 cap; "Close probability" / "Confidence" / "Deal temperature" heuristics unlabelled; "Premium probability". | Plain wording: "What Autonomous Exit will prepare (each step needs your approval)"; "Buyer appetite (registry)"; "top 12 ranked"; indices named with formulas; "Top premium payer". | ☑ `7dfc568` |
| G5 | Plan gates hidden on layer links (Market map → Preparation or Pro). | `requiredEngagement` labels. | ☐ |
| G6 | Design: no `h1`, 15 contrast failures, overflow at 390, old shared components. | Rebuild on `xo` as one page component; retire `CommandTiles`, `ExitCommander`, `CommanderBlocks` (no other users). | ☑ `03200b1` |

---

## Closure log

### G6 — Design, hierarchy, accessibility
*Closed by:* `pages/Commander.tsx` rebuilt on `xo`; `CommandTiles.tsx`, `ExitCommander.tsx`, `CommanderBlocks.tsx` removed (no other users after Page 02). Order: header (`h1` = company, Board Memorandum / Publishing links announced as new-tab) → Liquidity Board → recommended action + Execute beside the briefing register → probability breakdown, deal temperature, value gap → expected automation → buyer movement → acquirer-mix radar (SVG labelled with every count) + banker notes → layer links (`nav`) → tape and reactors. Content carried over verbatim; fixes follow in G1–G5.

*Verification:* `tsc -b`, eslint clean, `vitest` 203/203 · Chromium Active Mandate 1440/390: 0 errors, `h1` 1, no overflow (was overflowing at 390), axe **0** (was 15), 20 tab stops all with visible focus.

### G1 — Always the demo company
*Closed by:* `pages/Commander.tsx` — runs `dealContextFor`, `runReadinessAnalysis` and `runBuyerDiscovery` on `loadActiveCompany()` and passes them to `commanderMetrics(ctx, analysis)` (formulas unchanged); `h1` = company, **Demo data / Your intake** badge. `pages/Intake.tsx`: "Where your figures are used" now lists Chief Investment Banker.

*Verification:* `tsc -b`, eslint clean · Chromium (Active Mandate): demo → Helios Freight, DEMO DATA, EV $102,849,415 (unchanged); saved intake "Northwind Analytics" → YOUR INTAKE, EV $403,509,792, no Helios mentions · 0 errors.

### G2 — Invented probability breakdown
*Closed by:* `lib/commander-metrics.ts` (new `exitProbabilityParts(ctx)`; `commanderMetrics` now computes the index through it — same formula, + test that parts sum to the index) and `pages/Commander.tsx`.
The six invented factors (market conditions 26, buyer demand 21, technology moat 18, growth 14, readiness 11, risk −6 — fixed weights scaled to the total) are replaced by the index's actual parts, each with its points and maximum, a rounded total, and "a heuristic, not a measured likelihood".

*Verification:* `vitest` (commander-metrics) pass · Chromium: demo "Exit Score 55/100 × 0.35 → 19.3/35 · Active buyers 8 of 6 (capped) × 0.40 → 40.0/40 · Negotiation leverage "high" × 0.25 (sample offers) → 25.0/25 · Total 84"; saved intake → Exit Score 60 → 21.0, total 86 · axe 0 · 0 errors.

### G3 — Fake live
*Closed by:* `pages/Commander.tsx`: "Live" removed from the Liquidity Board; `MarketTape` → `RegistryTape` (dated); "Live telemetry" → "Registry extremes · Snapshot · as of 2026-10-11"; reactor feet name the snapshot date ("Rotation is decorative"); banker notes "live engine state" → "the engines for this company". The pinging dot went with the G6 rebuild.

*Verification:* Chromium (Active Mandate): 0 "live" words, 0 pinging elements on the page · eslint clean · 0 errors.

### G4 — Overclaims and mislabels
*Closed by:* `pages/Commander.tsx` (text only).
| Before | After |
|---|---|
| "Expected automation — What runs the moment you press Execute" with ✓ marks | "What Autonomous Exit prepares — Each step waits for your approval", numbered |
| "One instruction dispatches the agents…" | "Execute opens Autonomous Exit, where … each step waits for your approval. Nothing is sent from this page." |
| "Buyer movement — Actively deploying / Monitoring" | "Buyer appetite" + "Appetite is a registry profile attribute of each buyer, not recent activity." |
| "Acquisition radar — 12 qualified buyers" | "Acquirer mix — Top 12 ranked buyers by type (list capped at 12)" |
| "Close Probability — likelihood of a completed transaction" | "Close-probability index — heuristic, breakdown below" |
| "Confidence 92%", header "conf 92%" | "Confidence index" + formula, "not the valuation confidence" |
| "Deal temperature" | "Deal temperature index" + formula (70 + 4 × active buyers, capped at 98) |
| EV "strategic mid · engine-priced"; note "…to the strategic mid" | "institutional framework mid"; "…to the enterprise value" (D1) |
("Premium probability" was not on this page — its briefing never received that row.)

*Verification:* Chromium: new texts present · axe 0, no overflow (1440/390) · 0 errors.

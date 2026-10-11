# ExitOS redesign · Page 09 — Exit Timing

| | |
|---|---|
| Route | `/console/exit-timing` |
| Component | `src/pages/ExitTiming.tsx` (180 lines) |
| NAV | "Exit Timing", group Mandate, role founder, **Active Mandate (Pro)** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `f550422`)

### Purpose
Tells the founder *when* to sell: a recommended window in months, the value of waiting (sell today vs at the window), a multi-year readiness/value timeline, and six market signals rated tailwind / headwind.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Window "months 2–13" | longest fix effort (weeks ≈ 2, months ≈ 6, quarters ≈ 9 months, min 3) − 2 / + 4 | Rule-based heuristic, unexplained |
| Sell today / Sell at window, "+N % value of waiting" | deal context: value now and value after fixes (D1) | Model; "Sell today" labelled "strategic mid" (D1 mislabel); the "window" value excludes any growth while the timeline below compounds |
| **Three-year timeline** | Exit Score **+22, +38** (fixed) per year; value **× 1.3 per year** (fixed); window = first year with score ≥ 85; "**Q2** {year}" | **Invented forecast** — no engine produces these steps, rate or quarter |
| Signal impacts (tailwind / neutral) | **hard-coded** per row — multiples, activity, buyer demand and trajectory are "tailwind" whatever the numbers; buyer demand trend "high" fixed | **Invented verdicts** |
| "40 tracked deals" | sum of the top-12 buyers' deal counts **capped at 40** | Mislabel (the cap is shown as the count) |
| Sector exits + "median premium" | sector event count; premium is the **registry-wide** median | Mislabel (reads as the sector's premium) |
| Notes "Strategics and sponsors are both active in the sector", "Active acquirers match your profile right now" | static text; appetite is a registry attribute | Unsupported claims |
| "ExitOS monitors the market continuously and pings you when the window opens"; "Market signals monitored"; "Buyers circling" | — nothing monitors or notifies | **False claims** |
| Tape | registry snapshot | Fake live (pinging) |
| Company | `SAMPLE_COMPANY`, demo constants | Demo, unlabelled |

### Baseline (Active Mandate)
`h1` none · axe color-contrast ×5 (1440) · no overflow · 0 errors. Free / Preparation: Upgrade page (gate works).

## Gap register — Page 09
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Invented forecast** (score +22/+38 per year, value ×1.3 per year, "Q2 {year}"). | Replace the three-year timeline with what the engines produce: now vs after fixes — readiness-engine score current → projected, value now → after fixes — and the window in months with its rule shown. No years or quarters. | ☐ |
| G2 | **Invented signal verdicts and mislabels** (fixed "tailwind", "high", 40-cap count, registry premium shown as sector's, static notes). | Verdicts only where a stated rule exists (ARR growth ≥ 30 %; buyer demand from the active-buyer count; sector exits > 0); the rest shown as context. Actual deal count of the top-12 buyers; premium labelled registry-wide; notes say what each figure is. | ☐ |
| G3 | **False monitoring claims** ("monitors continuously and pings you", "signals monitored", "buyers circling", "right now"). | Plain wording: computed when the page opens; no alerts exist. | ☐ |
| G4 | Demo company unlabelled; "strategic mid" (D1). | Run on `loadActiveCompany()`; badge; "enterprise value today". | ☑ G4-commit |
| G5 | Fake live tape. | `RegistryTape`. | ☐ |
| G6 | Design: no `h1`, 5 contrast failures, old primitives. | Rebuild on `xo`. | ☑ `bc00810` |

### X11 — Shared mid-green buttons (found here) — documented before the fix
Same defect as X9 in three shared components that do not use the shared `Button`: `BankerTake` CTA (used by 17 pages), the Shell "Upgrade to Pro" link and the report toolbar "Download PDF" (`lib/report-ui.tsx`) — white text on `deal-600`, 3.77:1. *Fix:* `bg-deal-700` with hover `deal-600`, as X9. Page-local copies (Documents, DiligenceAI) are fixed with their pages.

---

## Closure log

### X11 — Shared mid-green buttons
*Closed by:* `components/BankerTake.tsx` (CTA link and button), `components/Shell.tsx` ("Upgrade to Pro"), `lib/report-ui.tsx` ("Download PDF"): `bg-deal-600 hover:bg-deal-500` → `bg-deal-700 hover:bg-deal-600` (white text 5.5:1). No behaviour change.
*Verification:* `tsc -b` pass · Chromium computed backgrounds: BankerTake CTA "See readiness fixes →" rgb(4,120,87) = deal-700; report "Download PDF →" rgb(4,120,87). (The Shell link renders only in a state not reached in this run; same class change — NOT VERIFIED in the browser.)

### G6 — Design
*Closed by:* `pages/ExitTiming.tsx` rebuilt on `xo` (`PageHeader` `h1`, six summary metrics, the banker's take as a page-local definition list with one CTA — the shared `BankerTake` is no longer used here — window and timing curve side by side (curve decorative, values in text), timeline as an ordered list, signals as a list with `h3` labels and ▲/▼/■ glyphs so impact is not colour-only). Content carried over verbatim; G1–G5 follow. (X11 commit: `a6371cf`.)
*Verification:* `tsc -b`, eslint clean · Chromium Active Mandate 1440/390: 0 errors, `h1` 1, no overflow, axe **0** (was 5), 14 tab stops all with visible focus · free / Preparation: Upgrade page.

### G4 — Demo company unlabelled; "strategic mid"
*Closed by:* `pages/ExitTiming.tsx` — value now / after fixes, Exit Score, fix efforts (window), buyer pool, standard-valuation multiple, growth and sector all run on `loadActiveCompany()` (`dealContextFor`, `runReadinessAnalysis`, `runBuyerDiscovery` limit 12, `runValuation` standard — same calls the demo constants use). Eyebrow names the source, **Demo data / Your intake** badge. "Sell today — strategic mid" → "enterprise value today" (D1). `pages/Intake.tsx` lists Exit Timing.
*Verification:* `tsc -b`, eslint clean · Chromium (Active Mandate): demo → DEMO DATA, sell today $102,849,415; saved intake "Northwind Analytics" → YOUR INTAKE, $403,509,792 · 0 errors.

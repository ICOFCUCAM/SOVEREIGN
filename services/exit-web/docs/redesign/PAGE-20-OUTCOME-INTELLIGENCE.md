# ExitOS redesign · Page 20 — Outcome Intelligence

| | |
|---|---|
| Route | `/console/outcomes` |
| Component | `src/pages/OutcomeIntelligence.tsx` (121 lines) |
| NAV | "Outcome Intelligence", founder, **Preparation or Active Mandate** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `67e992e`)

### Purpose
Market-level outcomes: the buyers paying the highest premiums, the fastest closers, and sectors ranked by valuation multiple.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Highest premium payers | `premiumLeague()` over `buyer_dna.json` `premium_pct` — which comes from the **curated outcome records** (`rollupBuyerOutcomes`, matched to the registry buyer by name in `exit-engines/src/scripts/dna/build.ts`), **not** from disclosed registry deals | Tooltip says "acquisition registry (disclosed deals only)" with sample = `disclosed_events` — e.g. **Salesforce +42 %, n = 0**; Amazon +144 % on 10 | **Provenance mislabelled** |
| Fastest closers | `speedLeague()` over `median_close_days` (same curated source) | See X15 |
| Sectors by multiple — "what commands the strongest valuation" | `MULTIPLES` — the framework's **priors** (the foot says so) | Title presents priors as market evidence |
| Comment "Every row is a DISCLOSED figure from the registry / framework" | — | Overclaim |
| Tables | no column headers on the two league tables; the close-rate column is unlabelled | Accessibility / clarity |
| Tape | registry snapshot | Fake live (pinging) |

### X15 — Outcome records attached to the wrong buyers (data pipeline) — documented, NOT changed
`exit-engines/src/scripts/dna/build.ts` attaches a curated outcome record when `curated.includes(name) || name.includes(firstWordOfCurated) && curated.startsWith(firstWordOfName)`. Any registry buyer whose name shares the first word with a curated desk inherits that desk's outcomes. In the snapshot **General Motors, General Dynamics, General Atlantic, General Mills and General Instrument all show 66 days and a 100 % close rate** — five of the twelve "fastest closers". The fix (exact or alias-based matching, then regenerating `buyer_dna.json` / `buyer_outcomes.json`) is a data-pipeline change outside this console redesign; recorded for the owner. The page now says that outcome figures are matched by name and may be mis-attributed.

### Baseline (Preparation)
`h1` none · axe color-contrast ×12 (1440) · no overflow · 0 errors. Free: Upgrade page.

## Gap register — Page 20
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Premium and close figures attributed to "disclosed deals" with a disclosed-deal count as the sample.** | Source named as curated outcome records matched by buyer name; disclosed registry deals shown as their own labelled column; caveat about name matching (X15). | ☐ |
| G2 | Framework priors presented as "what commands the strongest valuation". | Title "Sector multiple priors (framework)"; comment corrected. | ☐ |
| G3 | Fake live tape. | `RegistryTape`. | ☐ |
| G4 | Design: no `h1`, 12 contrast failures, header-less tables. | Rebuild on `xo` with table headers. | ☑ G4-commit |

---

## Closure log

### G4 — Design
*Closed by:* `pages/OutcomeIntelligence.tsx` rebuilt on `xo` (`PageHeader` `h1` with the as-of date; four metrics; reactor hidden from assistive tech; all three tables with column headers (the close-rate column is now labelled "Close rate") and row headers, each in a keyboard-reachable `ScrollRegion`; the premium tooltip aligns right so it stays on screen). Content carried over verbatim; G1–G3 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 12), all tab stops with visible focus.

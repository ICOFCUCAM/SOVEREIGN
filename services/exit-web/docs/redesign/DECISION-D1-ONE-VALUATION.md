# Decision D1 — one enterprise value across the console

| | |
|---|---|
| Decided by | Owner, 2026-10-11: "use $103M everywhere" |
| Rule | Every console page, document and calculation that needs *the company's value* uses the **institutional valuation framework** (`runInstitutionalValuation`, the "Valuation Constitution" — Terminal, Valuation page, valuation report). For the demo company: **$102.8M** mid (band $61.5M – $173.9M), instead of the strategic-buyer report's $108.3M (band $64.7M – $183.0M). |
| Related | D2 (delete 12 demo telemetry rows): owner says **keep for now**, delete later. Nothing deleted. |

## Status before this change (audited)
Two headline values were in use:

| Value | Used by |
|---|---|
| Institutional ($102.8M) | Terminal, Valuation page, valuation report (`report-model.ts`), document suite (`DOCUMENT_SUITE`) |
| Strategic-buyer report ($108.3M) | `deal-context.ts` (→ Liquidity Command, Chief Investment Banker blocks, Readiness, Exit Timing, every `commanderMetrics` reader) · `VALUATION_STRATEGIC.headline` read directly by Autopilot, Banker, Negotiator, Simulator, BuyerCopilot, Network, Documents, DataRoom, Intelligence (buyer-ranking price), `diligence-intel.ts`, `buyer-portal.ts` · offer scoring (`OFFER_EVALUATIONS`, `OFFER_COMPARISON`) · the CIM/teaser generator (`useMemorandum`) · the Exit Process run · the readiness report document (`report-docs.ts`) |

Correction to what I told the owner: I said "the documents use the institutional value". The valuation report and document suite do; the **CIM and teaser did not** (they used the strategic-buyer value). This change fixes that.

## How the change is made (no formula inside any engine changes)
1. `lib/canonical-valuation.ts` (new): `canonicalValuationFor(company)` returns the strategic-buyer report object with its **headline replaced by the institutional headline**. Consumers (offer scoring, memorandum generator) read only `headline.low/mid/high` (checked in `exit-engines/src/negotiation` and `src/documents`), so they now see one value. `VALUATION_CANONICAL` is that object for the demo company.
2. **Value after readiness fixes** = canonical mid + the readiness engine's uplift (`projectedStrategicMid − currentStrategicMid`, an absolute amount; for the demo $58.46M). This is the same uplift the Terminal already adds to $103M, so the Terminal and Liquidity Command will agree: $102.8M → **$161.3M** (was $108.3M → $166.7M).
3. `deal-context.ts` (shared + `dealContextFor`) uses the canonical band and the rule above. Buyer pool anchoring (`impliedPriceUsd`) moves with it.
4. Pages and libs reading `VALUATION_STRATEGIC.headline` switch to `VALUATION_CANONICAL.headline`. Where the strategic-buyer report is shown **as one of several methods** (Liquidity Command "Valuation reports", Autopilot's method list), it stays, labelled as a method; the console value is labelled "institutional framework".
5. Exit Process run and the readiness report document use the canonical value.
6. Page 02's G2 note is replaced: it no longer says the pages differ.

## Expected effects (demo company), to be verified
- Liquidity Command EV $108,252,000 → $102,849,415; expected value $166.7M → $161.3M; scenarios move accordingly.
- Indices that depend on value only through the buyer pool (active buyers, close-probability, confidence, liquidity) may shift if the buyer pool changes with the new anchor price — reported in the verification, not hidden.
- Offer scoring and the negotiator now anchor reservation/premium maths on $102.8M.

## Implemented
Files: `lib/canonical-valuation.ts` (new, + `canonical-valuation.test.ts`), `lib/engines.ts` (`VALUATION_CANONICAL`; offer scoring and memorandum generator use it), `lib/deal-context.ts`, `lib/exit-process.ts`, `lib/report-docs.ts`, `lib/diligence-intel.ts`, `lib/buyer-portal.ts`, pages Autopilot, Banker, BuyerCopilot, DataRoom, Documents, Intelligence, Negotiator, Network, Simulator (what-if runs now use `runInstitutionalValuation`), Dashboard (Liquidity Command).

Liquidity Command: the "two models" note (Page 02 G2) is replaced by "Enterprise value is the institutional valuation framework's midpoint — the same figure as the Intelligence Terminal and the valuation report"; the methods table lists the institutional framework first as the console value, with standard / strategic-buyer report / asset replacement as methods.

## Verification
| Check | Result |
|---|---|
| `tsc -b`, `eslint src` | pass · 0 errors |
| `vitest run` | 31 files, **193/193** — new D1 tests: canonical = Terminal headline; deal context and `commanderMetrics` use it; value after fixes = value + uplift; a founder's company gets its own institutional value; offer scoring still compares 3 offers |
| Values shown per page (Chromium, demo company, Active Mandate) — occurrences of $108.3M → $102.8M | Terminal 0→0 / 3→3 · Liquidity Command 4→1\* / 1→4 · Valuation 0→0 / 4→4 · Readiness 4→0 / 0→4 · Exit Timing 7→0 / 0→7 · Chief Investment Banker 5→0 / 0→5 · Outreach (Banker) 2→0 / 0→2 · Bid Room 2→0 / 0→2 · Simulator 4→0 / 0→4 · Documents 1→0 / 2→3 |
| Terminal vs Liquidity Command | demo: $103M / $102,849,415, uplift $58M / +$58,456,080, expected $161,305,495 · intake (test input): $404M / $403,509,792, uplift $236M / +$236,057,143 |
| Simulator what-ifs | still move from the new baseline (e.g. $25M ARR → ▲ $19,709,808 on $102,849,415) |
| Liquidity Command indices | unchanged: close-probability 84%, confidence 92%, liquidity 98, 8 active of 12 |
| Liquidity Command a11y | axe 0, keyboard focus visible, no overflow (free/pro, 1440/390) |
| Page errors | 0 on all 14 pages scanned |

\* the remaining $108.3M on Liquidity Command is the "Strategic buyer report" row of the methods table, shown on purpose as a method, not as the company's value.

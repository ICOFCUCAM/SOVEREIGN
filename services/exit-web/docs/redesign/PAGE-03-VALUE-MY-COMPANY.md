# ExitOS redesign · Page 03 — Value My Company

| | |
|---|---|
| Route | `/console/intake` |
| Component | `src/pages/Intake.tsx` (154 lines) |
| NAV | "Value My Company", group Mandate, role **founder**, no plan gate |
| Status | Stage A audit — gaps documented below; each is closed in its own commit and marked here. |

Process rule: **document a gap → close it → verify → mark it closed**, one at a time.

---

## Stage A — Audit of the original (baseline commit `006b17b`)

### Purpose and user
The founder enters their company's figures and immediately sees what it is worth, who is likely to buy it and on what evidence. The saved figures are what **every other page** personalises to (`loadActiveCompany()` reads `localStorage["exitos.intake.v1"]`); without them the console shows the demo company. The page can also list the company on the exchange.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Form (13 inputs) | `useState<IntakeInputs>` seeded from `localStorage` or `SAMPLE_INTAKE` (= the demo company **Helios Freight**) | Company-provided / demo example |
| Saved data | `useEffect` writes the inputs to `localStorage` on **every render, including the first** | — |
| Enterprise value, band, confidence, premium, comparables count, qualified buyers, time to close | `runInstitutionalValuation(buildProfile(inputs))` | Model (institutional framework = the console value, decision D1) |
| Most likely acquirers | `report.mostLikelyBuyers` (curated registry) | Model |
| Comparable transactions (target, buyer, date, premium, price) | `report.comparableTransactions` (status, rationale, sourceRef not shown) | Registry records |
| Provenance line | `report.mandatoryOutputs.data_provenance_summary` | Required disclosure |
| List on the exchange | `listCompany(buildProfile(inputs))` → listings adapter → `saveListings` (Supabase `exitos_listings` when configured, else this browser) | Publishes an anonymised listing: sector, region, **exact TTM revenue, growth, EBITDA margin** (Acquisition Radar shows them to buyers); name withheld |
| Reset to example | sets the inputs to `SAMPLE_INTAKE` | — |

### Actions (all must survive)
Edit any field (live recompute) · List on the exchange · Reset to example · links to `/console/valuation` and `/console`.

### Baseline verification (measured)
| Check | Result |
|---|---|
| axe (free + pro, 1440/900/390) | 0 violations |
| Page errors / overflow | 0 / none |
| **Opening the page without typing anything** | writes Helios Freight to `exitos.intake.v1`; the Terminal then shows **"YOUR INTAKE" · Helios Freight** instead of "DEMO DATA" |
| Typing `12.5` into TTM revenue ($M) | field shows **`125`** → revenue $125M |
| Typing `-50` into Growth YoY (%) | field shows **`50`** |
| Production `exitos_listings` | 0 rows (read-only query) — nothing published yet |

---

## Gap register — Page 03

| # | Gap | Evidence | Fix (no calculation changed) | Status |
|---|---|---|---|---|
| G1 | **Opening the page turns the demo into "your data".** The save effect runs on mount, so a visit stores Helios Freight as the founder's intake; every page then labels demo figures "Your intake". "Reset to example" also saves the example as the founder's data. | measured above | Save only after the founder edits a field. "Reset to example" becomes "Clear my data" (removes the saved intake, back to the demo state). Show the data state on the page. | ☐ |
| G2 | **Numbers cannot be entered correctly.** Decimal points are dropped (12.5 → 125), negative values are impossible, clearing a field forces 0, nothing is validated (e.g. 150 % margin, ARR > revenue unflagged). | measured above | Keep the typed text per field; parse decimals and negatives; validate with field-level messages (`aria-invalid`, `aria-describedby`); only valid values reach the engines. | ☐ |
| G3 | **Mislabelled valuation.** "Enterprise value · strategic-buyer basis" — the figure is the institutional framework, the console value (D1). | `Intake.tsx` | Label it as the institutional framework, the same figure every page shows. | ☐ |
| G4 | **One click publishes, without saying what.** "List on the exchange" lists immediately, does not say which figures buyers will see (exact revenue, growth, EBITDA margin, sector, region) or where it is stored (exchange vs this browser), and offers no way back. | `listings.ts`, `exit-api.ts` | Confirmation step naming exactly what buyers see and where it is stored; result message says the same. Listing mechanics unchanged. | ☐ |
| G5 | **Evidence thin.** Comparable status/source and rationale, confidence drivers and the framework disclaimer are computed but not shown; buyers' source (curated registry) not named. | engine fields | Show them (as on the Terminal). | ☐ |
| G6 | **No path forward.** Nothing tells the founder that their saved figures now drive the Terminal and Liquidity Command. | page | A "your figures now drive…" panel linking to those pages (only when data is saved). | ☐ |
| G7 | **Old design system and weak hierarchy.** Generic cards/KPI tiles; form labels in tiny uppercase; report and form compete. | screenshots | Rebuild on `xo`: form (with units and hints) beside a decision-first report: value → key figures → buyers → comparables → evidence. | ☐ |

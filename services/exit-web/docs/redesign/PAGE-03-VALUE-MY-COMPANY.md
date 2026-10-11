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
| G1 | **Opening the page turns the demo into "your data".** The save effect runs on mount, so a visit stores Helios Freight as the founder's intake; every page then labels demo figures "Your intake". "Reset to example" also saves the example as the founder's data. | measured above | Save only after the founder edits a field. "Reset to example" becomes "Clear my data" (removes the saved intake, back to the demo state). Show the data state on the page. | ☑ `3f26229` |
| G2 | **Numbers cannot be entered correctly.** Decimal points are dropped (12.5 → 125), negative values are impossible, clearing a field forces 0, nothing is validated (e.g. 150 % margin, ARR > revenue unflagged). | measured above | Keep the typed text per field; parse decimals and negatives; validate with field-level messages (`aria-invalid`, `aria-describedby`); only valid values reach the engines. | ☑ `6f44313` |
| G3 | **Mislabelled valuation.** "Enterprise value · strategic-buyer basis" — the figure is the institutional framework, the console value (D1). | `Intake.tsx` | Label it as the institutional framework, the same figure every page shows. | ☑ `87a03c7` |
| G4 | **One click publishes, without saying what.** "List on the exchange" lists immediately, does not say which figures buyers will see (exact revenue, growth, EBITDA margin, sector, region) or where it is stored (exchange vs this browser), and offers no way back. | `listings.ts`, `exit-api.ts` | Confirmation step naming exactly what buyers see and where it is stored; result message says the same. Listing mechanics unchanged. | ☑ `6f7d042` |
| G5 | **Evidence thin.** Comparable status/source and rationale, confidence drivers and the framework disclaimer are computed but not shown; buyers' source (curated registry) not named. | engine fields | Show them (as on the Terminal). | ☑ `e17e5be` |
| G6 | **No path forward.** Nothing tells the founder that their saved figures now drive the Terminal and Liquidity Command. | page | A "your figures now drive…" panel linking to those pages (only when data is saved). | ☑ `a82fcb7` |
| G7 | **Old design system and weak hierarchy.** Generic cards/KPI tiles; form labels in tiny uppercase; report and form compete. | screenshots | Rebuild on `xo`: form (with units and hints) beside a decision-first report: value → key figures → buyers → comparables → evidence. | ☑ `52719c6` |

---

## Closure log

### G1 — Opening the page turned the demo into "your data"
*Documented:* gap register row G1. *Closed by:* `lib/active-company.ts` (`loadSavedIntake`, `saveIntake`, `clearIntake` + test) and `pages/Intake.tsx`.
- The mount-time save effect is gone; a field edit saves.
- "Reset to example" (which also saved the example as the founder's data) is replaced by **Clear my data**, shown only when data is saved; it removes the saved figures so every page returns to the demo company.
- A status line says which state the page is in: demo company (nothing saved) or the founder's saved figures driving every page.

*Verification:* `tsc -b`, eslint clean · `vitest run` **194/194** (new: nothing saved until saved; save → active company; clear → demo) · Chromium: open only → nothing stored, Terminal "DEMO DATA"; edit name → stored "Acme Robotics", Terminal "YOUR INTAKE · Acme Robotics"; Clear my data → nothing stored, button hidden, Terminal "DEMO DATA · Helios Freight"; 0 page errors.

### G2 — Numbers could not be entered correctly
*Documented:* gap register row G2. *Closed by:* new `lib/intake-fields.ts` (+ 4 tests) and `pages/Intake.tsx`.
- Each number field keeps the text as typed; `parseField` accepts decimals, a leading minus where it is meaningful (growth, EBITDA margin), and thousands separators, and rejects empty, non-numeric, out-of-range and fractional counts with a plain message.
- Ranges: revenue and ARR ≥ 0 ($M), growth −100…1,000 %, gross margin 0…100 %, EBITDA margin −100…100 %, net retention 0…300 %, top-10 share 0…100 %, customers whole ≥ 1.
- Only a valid value is saved and reaches the engines; while a field is invalid the report keeps the last valid value and the field says why (`aria-invalid`, message linked by `aria-describedby`). Each field has a visible unit and a hint; labels are tied to inputs with `for`/`id`.
- `buildProfile` is unchanged (its clamps remain as a second guard).

*Verification:* `tsc -b`, eslint clean · `intake-fields.test.ts` 4/4 (decimals, negatives, rejections, round-trip of the demo values) · Chromium: "12.5" → shown 12.5, stored $12,500,000 (was 125 / $125M); "-50" → stored −0.5 (was 50); "150" gross margin → "Must be at most 100.", `aria-invalid`, not stored; empty ARR → "Enter a number.", not stored · axe 0 · 0 page errors.

### G7 — Old design system and weak hierarchy
*Documented:* gap register row G7. *Closed by:* `pages/Intake.tsx` rebuilt on `xo` (no logic change; `Card`/`Kpi`/`SectionHeader`/`Field` no longer used here).
- Header: eyebrow, `h1`, data badge (Demo data / Your intake), description, List / Clear my data.
- Left: "Your company" form — sentence-case labels tied to inputs, units shown, hints and errors under each number field, defensibility checkboxes in a `fieldset`, status line.
- Right, in reading order: Enterprise value hero (mid, band, confidence, midpoint formula) → key figures → most likely acquirers (table with headers, `ScrollRegion`) → comparable transactions (table with headers, `ScrollRegion`, provenance line) → links to the valuation desk and Terminal.
- Labels carried over unchanged in this commit; label/evidence fixes follow (G3, G5).

*Verification:* `tsc -b`, eslint clean · Chromium free + pro at 1440/900/390: 0 errors, 1 `h1`, axe 0, no overflow · G1 cycle (open/edit/clear) and G2 entry checks re-run: unchanged results.

### G3 — Mislabelled valuation
*Documented:* gap register row G3. *Closed by:* `pages/Intake.tsx`. "Enterprise value · strategic-buyer basis" → "Institutional valuation framework · the console value", plus a line saying this is (or, once a field is edited, becomes) the value every console page shows. The figure was already `runInstitutionalValuation` — only the label was wrong.

*Verification:* `tsc -b`, eslint clean · Chromium: demo EV $102,849,415 here equals the Terminal ($103M) and Liquidity Command ($102,849,415) · 0 page errors.

### G4 — One click published, without saying what
*Documented:* gap register row G4. *Closed by:* `pages/Intake.tsx`; additive helpers `unlistCompany`, `isListed` (`lib/listings.ts`, + test) and `listingDestination()` (`lib/exit-api.ts`: "exchange" when the Supabase backend is active, else "browser"). `listCompany` and the listing record are unchanged.
- **List on the exchange** opens a confirmation panel: "this is what buyers will see" — sector, region, TTM revenue, growth, EBITDA margin (from `listingFromCompany(...).publicView`) — states that the name is withheld, where the listing goes (live exchange, or this browser only when no backend is configured) and that it can be withdrawn. Confirm / Cancel.
- After listing, a status names the listing code and destination and shows the figures buyers actually see (the stored listing). Editing figures afterwards shows "Your figures changed since you listed…" and **Update listing**; **Withdraw listing** removes it.
- Listing requires saved figures: with only the demo company showing, the button is disabled and says why (the original allowed listing the demo company as the founder's).

*Verification:* `tsc -b`, eslint clean · `listings.test.ts` 6/6 (new: withdraw) · `vitest run` all pass · Chromium (local backend in this container): demo → List disabled; edit name → List → panel with the five public fields and "saved in this browser only"; Cancel → nothing stored; Confirm → stored `lst-acme-robotics` ($62M), status "Saved as an anonymous listing Project Atlas in this browser only…"; edit revenue → stale notice + Update listing; Update → stored $70M; Withdraw → removed · axe 0 · 0 page errors. The "live exchange" wording path (Supabase configured) was **not exercised** here — this container has no backend configured.

### G5 — Evidence thin
*Documented:* gap register row G5. *Closed by:* `pages/Intake.tsx` (fields the engine already returns).
- Most likely acquirers: foot names the source — the curated buyer registry with its composition (demo: 31 acquirers: 15 strategic, 14 financial, 2 family office, 0 sovereign) — and that probability / time to cash are the framework's buyer model.
- Comparable transactions: each row adds status, days to close and the engine's comparability rationale; a Source column (source type, full reference on hover); "undisclosed" instead of "—" for price.
- New **Confidence** section: the five drivers with numeric bars and the engine's note.
- New **Disclaimer** section on the light reading surface: the framework's full disclaimer.

*Verification:* `tsc -b`, eslint clean · Chromium: all four sections render with the values above (e.g. DB Schenker → DSV "closed · 229d to close · Same sector (logistics freight) · completed transaction", source "press release"; confidence drivers 100/100/100/59/78 %) · axe 0, no overflow (free/pro, 1440/390) · 0 page errors.

### G6 — No path forward (and a correction to G1/G3 wording)
*Documented:* gap register row G6. *Closed by:* `pages/Intake.tsx`.
- New **Where your figures are used** section (only once figures are saved), listing exactly the pages that read them today — found with `grep loadActiveCompany`: Intelligence Terminal, Liquidity Command, Engagement Registry, Inbox, Outreach Plan, Reports — with links and the engagement each requires (`requiredEngagement`), and the plain statement that other console pages still show the demo company until their redesign.
- **Correction:** the G1 status line said "every console page now uses them" and the G3 line said the value is "the value every console page shows for your company". Both overclaimed — Readiness, Exit Timing, the Valuation desk and others still run on the demo company. They now read "See below for the pages that use them" and "The same institutional framework produces the value on every console page" (true since D1).

*Verification:* `tsc -b`, eslint clean · Chromium: panel absent before saving; after editing the name it lists the six destinations, with "requires Preparation or Active Mandate" on Engagement Registry and Outreach Plan for a free founder; the Liquidity Command link opens `/console/command` showing "Acme Robotics" · 0 page errors.

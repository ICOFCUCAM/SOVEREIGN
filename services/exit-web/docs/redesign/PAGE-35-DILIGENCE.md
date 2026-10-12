# ExitOS redesign · Page 35 — Diligence

| | |
|---|---|
| Route | `/console/diligence-ai` |
| Component | `src/pages/DiligenceAI.tsx` (244 lines) + `lib/diligence-intel.ts` (`discoverFindings`, `allReports`, `SOURCE_FILES`), `lib/engines.ts` (`DILIGENCE` on the demo company), shared `BankerTake` |
| NAV | "Diligence", founder, **Preparation or Pro** (free: Upgrade page) |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `4923cd8`)

### Purpose
"AI Due Diligence": risks in three categories, six generated reports (buyer, seller, readiness, red flag, valuation impact, legal), an estimated buyer discount, per-source "Analyzed" cards, export and a PDF report, and the diligence question bank.

### Data flow (measured on the demo company)
| Element | Source | Nature |
|---|---|---|
| 11 findings, 4 high severity | `discoverFindings()` — fixed rules on **`SAMPLE_COMPANY`** (concentration, recurring share, margins, growth, IP counts, regulatory rating, founder status, bench); **no document is read** | Rules on the demo profile ✓, but presented as document analysis |
| "**Ingestion**" cards: "● Analyzed — Financial statements / Contracts / Employment agreements / Customer lists / Tax filings, N findings"; each finding "Source: Contracts" …; "ExitOS **reads every uploaded file**, classifies the risk, prices the impact" | `SOURCE_FILES` — a fixed list each rule is tagged with | **False** — no file is uploaded, read or analysed here |
| Findings asserted without any check: "**Key customer & vendor agreements not in the data room**" (high), "**No litigation schedule on file**", "Carrier / vendor dependency in the delivery network" (logistics text for every company), "lead with … **108 % net retention**" | hard-coded rule texts | **Unverified facts** (the data room is never consulted); 108 % is the demo profile's `netRetentionPct` written into the text, so every company is told it has 108 % |
| "**Re-run analysis**" → 800 ms → toast "Re-ran across 5 sources · 11 findings" | `setTimeout` | **Fake action** |
| "**Est. buyer discount −$49,900,000** — buyers would deduct" | Σ fixed weights (10, 5, 4, 3, 6, 3, 2.5, 1, 8, 3, 3 = 48.5 %) × the canonical midpoint — **every finding deducts, whatever its severity** | An illustrative rule presented as what buyers would deduct (cf. the Data Room's illustrative discount, Page 14) |
| Title "**AI** Due Diligence"; "Six reports an investment bank and law firm would bill thousands for"; "Investment bank **$40,000+ · 4–6 weeks** → ExitOS … seconds" | — | Rule-based, not AI; bank figures unsourced |
| Critical questions 0; question bank | `DILIGENCE` = `runDueDiligence(SAMPLE_COMPANY)` | Engine ✓ on the demo only |
| Everything | demo company only | Demo **unlabelled** |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline
Free: Upgrade page. Preparation and Pro: `h1` none · axe 0 · no overflow · 0 errors · 38 tab stops.

## Gap register — Page 35
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Document analysis claimed; nothing is read.** | Say the findings are rules applied to the company profile; replace the "Analyzed" source cards with "where a buyer would look" (the document each check concerns, not analysed); remove "reads every uploaded file"; per-finding "Source:" → "Buyer would check: …". | ☑ `cb6666f` |
| G2 | **Invented facts and a fake re-run.** | Unverified findings worded as checks to make ("Confirm key agreements are in the data room", "Prepare a litigation schedule"); the logistics-only vendor item shown only for logistics; "108 % net retention" taken from the profile's own `netRetentionPct` (omitted when absent); "Re-run analysis" removed (findings recompute from the profile on load). | ☐ |
| G3 | **"Buyers would deduct" — an illustrative rule.** | "Illustrative discount (rule)": weights stated, every finding counted regardless of severity, % of the canonical midpoint; not a buyer estimate. | ☐ |
| G4 | "AI"; unsourced bank comparison. | "Diligence" (rule-based); remove the $40,000 / 4–6 weeks comparison and "would bill thousands". | ☐ |
| G5 | Demo only, unlabelled. | `discoverFindings(company)` (additive parameter) and `runDueDiligence(company)` for the active company; Demo data / Your intake badge. | ☐ |
| G6 | Shared `BankerTake`; fake live tape. | Page-local recommended action; `RegistryTape`. | ☐ |
| G7 | Design: no `h1`; old components. | Rebuild on `xo`. | ☑ `a019bd1` |

---

## Closure log

### G7 — Design
*Closed by:* `pages/DiligenceAI.tsx` rebuilt on `xo` (`PageHeader` `h1` with the re-run action; four metrics; source cards and the comparison strip as labelled sections; the three risk categories as `Section`s with findings as list items under `h3`s; the report switcher as `Chip`s (`aria-pressed`) in a labelled group; the question bank with `Disclosure` toggles (`aria-expanded`/`aria-controls`); severity in words with colour; shared `Card`/`Button` replaced). Content carried over verbatim; the shared `BankerTake` stays until G6; G1–G6 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation and Pro 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe 0 (heading order fixed during the rebuild), all tab stops with visible focus · after opening a question set and after switching to the Buyer Diligence Report: axe 0, no overflow · free: Upgrade page.

### G1 — Document analysis claimed; nothing is read
*Closed by:* `pages/DiligenceAI.tsx` (and comments in `lib/diligence-intel.ts`; no logic changed). The five "● Analyzed" ingestion cards → a "Where a buyer would look" section: each document with "N checks · not analysed" and the foot "The findings are fixed checks on the company profile — no document is uploaded or read here. Each check names the document a buyer would use to test it; the counts are checks per document."; each finding's "Source: Contracts" → "A buyer would check: Contracts"; the take's "ExitOS reads every uploaded file, classifies the risk, prices the impact and drafts both risk reports" → "ExitOS applies fixed checks to the company profile and drafts the reports. It does not read documents."; file comments corrected.
*Verification:* `tsc -b`, eslint clean · Chromium Pro: 0 "Analyzed", 0 "reads every uploaded file", 0 "Source:"; 11 "A buyer would check" lines (4 contracts, 3 employment, 2 financial statements, 1 customer lists, 1 tax filings) · 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

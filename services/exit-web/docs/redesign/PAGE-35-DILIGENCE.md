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
| Findings asserted without any check: "**Key customer & vendor agreements not in the data room**" (high), "**No litigation schedule on file**", "Carrier / vendor dependency in the delivery network" (logistics text for every company), "lead with … **108 % net retention**" | hard-coded rule texts | **Invented facts** (the data room is never consulted; 108 % appears nowhere in the profile) |
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
| G1 | **Document analysis claimed; nothing is read.** | Say the findings are rules applied to the company profile; replace the "Analyzed" source cards with "where a buyer would look" (the document each check concerns, not analysed); remove "reads every uploaded file"; per-finding "Source:" → "Buyer would check: …". | ☐ |
| G2 | **Invented facts and a fake re-run.** | Unverified findings worded as checks to make ("Confirm key agreements are in the data room", "Prepare a litigation schedule"); the logistics-only vendor item shown only for logistics; "108 % net retention" removed; "Re-run analysis" removed (findings recompute from the profile on load). | ☐ |
| G3 | **"Buyers would deduct" — an illustrative rule.** | "Illustrative discount (rule)": weights stated, every finding counted regardless of severity, % of the canonical midpoint; not a buyer estimate. | ☐ |
| G4 | "AI"; unsourced bank comparison. | "Diligence" (rule-based); remove the $40,000 / 4–6 weeks comparison and "would bill thousands". | ☐ |
| G5 | Demo only, unlabelled. | `discoverFindings(company)` (additive parameter) and `runDueDiligence(company)` for the active company; Demo data / Your intake badge. | ☐ |
| G6 | Shared `BankerTake`; fake live tape. | Page-local recommended action; `RegistryTape`. | ☐ |
| G7 | Design: no `h1`; old components. | Rebuild on `xo`. | ☐ |

---

## Closure log

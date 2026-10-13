# Sample pack — quality review

Two independent gates; a document is accepted only when both pass (score ≥ 90 and no critical finding in that gate). Penalties: critical 25, major 6, minor 1.
- **Gate A — integrity:** figures, provenance, confidentiality, consistency, document state, no fabricated claims or periods.
- **Gate B — communication and rendering:** structure and substance for the purpose, phrasing, claims, tables, headings and layout in the Markdown, the preview and the PDF.
Completeness is the share of sections the company's information supports; a gap is stated, never filled. Rules cannot judge persuasiveness — human review is a separate requirement.

| Document | Words | Gate A | Gate B | Completeness | Result | Critical | Major | Minor |
|---|---|---|---|---|---|---|---|---|
| Confidential Information Memorandum — Northwind Analytics | 2064 | 100 | 94 | 97% | accepted | 0 | 0 | 6 |
| Northwind Analytics — Executive Summary | 410 | 100 | 100 | — | accepted | 0 | 0 | 0 |
| Northwind Analytics — Investor deck | 271 | 100 | 100 | — | accepted | 0 | 0 | 0 |
| Project Meridian — Confidential opportunity overview | 239 | 100 | 100 | — | accepted | 0 | 0 | 0 |
| Northwind Analytics — Data room index | 342 | 100 | 95 | — | accepted | 0 | 0 | 5 |
| Closing Checklist — Northwind Analytics | 224 | 100 | 100 | — | accepted | 0 | 0 | 0 |
| Northwind Analytics — Board Transaction Memorandum | 596 | 100 | 100 | — | accepted | 0 | 0 | 0 |
| Confidential Information Memorandum — Calder Freight Software (headline intake only) | 1388 | 100 | 97 | 33% | accepted | 0 | 0 | 3 |
| Calder Freight Software — Executive Summary (headline intake only) | 390 | 100 | 100 | — | accepted | 0 | 0 | 0 |
| Calder Freight Software — Investor deck (headline intake only) | 233 | 100 | 100 | — | accepted | 0 | 0 | 0 |
| Project Atlas — Confidential opportunity overview (headline intake only) | 215 | 100 | 100 | — | accepted | 0 | 0 | 0 |
| Calder Freight Software — Data room index (headline intake only) | 343 | 100 | 95 | — | accepted | 0 | 0 | 5 |
| Closing Checklist — Calder Freight Software (headline intake only) | 224 | 100 | 100 | — | accepted | 0 | 0 | 0 |
| Calder Freight Software — Board Transaction Memorandum (headline intake only) | 596 | 100 | 99 | — | accepted | 0 | 0 | 1 |

## Confidential Information Memorandum — Northwind Analytics — Gate A 100, Gate B 94

| Gate | Severity | Rule | Section | Excerpt | Fix |
|---|---|---|---|---|---|
| B | minor | repeated-sentence | Appendix: Source notes and basis of preparation | Revenue (TTM) / $24.6M / Management accounts, September 2026 (2026-10-05) | also in "Historical financial performance and forecasts"; say it once |
| B | minor | repeated-sentence | Appendix: Source notes and basis of preparation | Annual recurring revenue / $21.8M / Management accounts, September 2026 (2026-10 | also in "Historical financial performance and forecasts"; say it once |
| B | minor | repeated-sentence | Appendix: Source notes and basis of preparation | ARR growth (YoY) / 36% / Management accounts, September 2026 (2026-10-05) | also in "Historical financial performance and forecasts"; say it once |
| B | minor | repeated-sentence | Appendix: Source notes and basis of preparation | Gross margin / 78% / Management accounts, September 2026 (2026-10-05) | also in "Historical financial performance and forecasts"; say it once |
| B | minor | repeated-sentence | Appendix: Source notes and basis of preparation | EBITDA margin / 14% / Management accounts, September 2026 (2026-10-05) | also in "Historical financial performance and forecasts"; say it once |
| B | minor | repeated-sentence | Appendix: Source notes and basis of preparation | Net revenue retention / 117% / supplied by the Company | also in "Historical financial performance and forecasts"; say it once |

## Northwind Analytics — Data room index — Gate A 100, Gate B 95

| Gate | Severity | Rule | Section | Excerpt | Fix |
|---|---|---|---|---|---|
| B | minor | repeated-sentence | User & growth diligence package | Access level: sensitive; 2 of its 3 documents are required. | also in "Market diligence package"; say it once |
| B | minor | repeated-sentence | Technical architecture diligence | Access level: confidential; 3 of its 3 documents are required. | also in "Financial diligence package"; say it once |
| B | minor | repeated-sentence | Security & compliance diligence | Access level: confidential; 3 of its 3 documents are required. | also in "Financial diligence package"; say it once |
| B | minor | repeated-sentence | Legal diligence package | Access level: confidential; 3 of its 3 documents are required. | also in "Financial diligence package"; say it once |
| B | minor | repeated-sentence | Commercial diligence package | Access level: sensitive; 2 of its 3 documents are required. | also in "Market diligence package"; say it once |

## Confidential Information Memorandum — Calder Freight Software (headline intake only) — Gate A 100, Gate B 97

| Gate | Severity | Rule | Section | Excerpt | Fix |
|---|---|---|---|---|---|
| B | minor | repeated-sentence | Appendix: Source notes and basis of preparation | Annual recurring revenue / $8.9M / supplied by the Company | also in "Historical financial performance and forecasts"; say it once |
| B | minor | repeated-sentence | Appendix: Source notes and basis of preparation | ARR growth (YoY) / 19% / supplied by the Company | also in "Historical financial performance and forecasts"; say it once |
| B | minor | repeated-sentence | Appendix: Source notes and basis of preparation | Net revenue retention / 102% / supplied by the Company | also in "Historical financial performance and forecasts"; say it once |

## Calder Freight Software — Data room index (headline intake only) — Gate A 100, Gate B 95

| Gate | Severity | Rule | Section | Excerpt | Fix |
|---|---|---|---|---|---|
| B | minor | repeated-sentence | User & growth diligence package | Access level: sensitive; 2 of its 3 documents are required. | also in "Market diligence package"; say it once |
| B | minor | repeated-sentence | Technical architecture diligence | Access level: confidential; 3 of its 3 documents are required. | also in "Financial diligence package"; say it once |
| B | minor | repeated-sentence | Security & compliance diligence | Access level: confidential; 3 of its 3 documents are required. | also in "Financial diligence package"; say it once |
| B | minor | repeated-sentence | Legal diligence package | Access level: confidential; 3 of its 3 documents are required. | also in "Financial diligence package"; say it once |
| B | minor | repeated-sentence | Commercial diligence package | Access level: sensitive; 2 of its 3 documents are required. | also in "Market diligence package"; say it once |

## Calder Freight Software — Board Transaction Memorandum (headline intake only) — Gate A 100, Gate B 99

| Gate | Severity | Rule | Section | Excerpt | Fix |
|---|---|---|---|---|---|
| B | minor | long-sentence | Basis of Preparation | The Company has not yet supplied market size, market growth, intensity of compet… | 52 words; split it |

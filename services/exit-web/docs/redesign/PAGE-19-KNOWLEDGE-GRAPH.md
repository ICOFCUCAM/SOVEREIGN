# ExitOS redesign · Page 19 — Knowledge Graph

| | |
|---|---|
| Route | `/console/knowledge-graph` |
| Component | `src/pages/KnowledgeGraph.tsx` (157 lines) |
| NAV | "Knowledge Graph", founder, **Preparation or Active Mandate** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `b57bb80`)

### Purpose
Query the acquisition index (3,855 events, as of 2026-10-11) by sector keyword, region, value range and year; see matching buyers and acquisitions with their source. Four preset queries.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Results | `queryAcquisitions(acquisition_index.json, query)` | Registry snapshot ✓ — every row carries its source (Wikipedia 3,535 · Wikidata 320) |
| Comment "relationship query over **verified** deal data" | — | Overclaim in code; the index rows carry no verification status (Page 18 G1: most registry events are unverified) |
| As-of date of the index | `indexFile.as_of` | Not shown on the page |
| Min / max value, since year | free text → `Number(text)` | **No validation**: "abc" gives `NaN` and the filter silently changes the result; min > max is not flagged |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline (Preparation)
`h1` none · axe color-contrast ×6 (1440) · no overflow · 0 errors. Free: Upgrade page.

## Gap register — Page 19
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Numeric filters accept anything; bad input silently changes results.** | `parseNumber` for min/max ($M, ≥ 0) and year (1900–this year, whole); invalid fields are flagged and ignored; min > max flagged. | ☐ |
| G2 | Provenance: index date not shown; "verified" in the code comment. | Show "Index as of …, N events"; state that rows are source-cited and not individually verified; comment corrected. | ☐ |
| G3 | Fake live tape. | `RegistryTape`. | ☐ |
| G4 | Design: no `h1`, 6 contrast failures, unreachable scroll areas, preset chips. | Rebuild on `xo` (labelled inputs, `ScrollRegion`s, table headers). | ☐ |

---

## Closure log

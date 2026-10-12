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
| G1 | **Numeric filters accept anything; bad input silently changes results.** | `parseNumber` for min/max ($M, ≥ 0) and year (1900–this year, whole); invalid fields are flagged and ignored; min > max flagged. | ☑ `347c857` |
| G2 | Provenance: index date not shown; "verified" in the code comment. | Show "Index as of …, N events"; state that rows are source-cited and not individually verified; comment corrected. | ☑ `5ef004c` |
| G3 | Fake live tape. | `RegistryTape`. | ☐ |
| G4 | Design: no `h1`, 6 contrast failures, unreachable scroll areas, preset chips. | Rebuild on `xo` (labelled inputs, `ScrollRegion`s, table headers). | ☑ `0510a75` |

---

## Closure log

### G4 — Design
*Closed by:* `pages/KnowledgeGraph.tsx` rebuilt on `xo` (`PageHeader` `h1`; four result metrics; query inputs with `<label for>` associations (an error slot ready for G1); presets as a labelled group of buttons; buyers list and acquisitions table inside keyboard-reachable `ScrollRegion`s with a sticky header and row headers). Content carried over verbatim; G1–G3 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Preparation 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 6), all tab stops with visible focus.

### G1 — Numeric filters accepted anything
*Closed by:* `pages/KnowledgeGraph.tsx`. Min and max value use `parseNumber` ($M, 0–10,000,000, scaled to USD); since-year accepts whole years 1900 – current year. An invalid field shows its error under the input ("Use digits only, e.g. 12.5. Ignored." / "Enter a year from 1900 to 2026, e.g. 2020. Ignored."), is marked `aria-invalid` and described by the message, and is **left out of the query** (before: `Number("abc")` = `NaN` silently changed the filter). Min above max → "Min is above max — max ignored."
*Verification:* `tsc -b`, eslint clean · Chromium (Preparation): all 3,855 · min "abc" → 3,855 with the error · min 500 / max 10 → 223 (max ignored, message) · 500–1000 with year "20x" → 109 with the year error · 500–1000 since 2020 → 11 · 1440/390: 0 errors, axe 0, no overflow.

### G2 — Provenance
*Closed by:* `pages/KnowledgeGraph.tsx`. Header badge "Query the registry · index as of 2026-10-11 · 3,855 events" (from the index file), and the description: "Every row comes from a source-cited registry entry (Wikipedia acquisition lists or Wikidata, shown in the Source column). Rows are not individually verified here; values are as disclosed in those sources." Code comment "verified deal data" → "source-cited acquisition index".
*Verification:* `tsc -b`, eslint clean · Chromium: as-of date and count shown; description present.

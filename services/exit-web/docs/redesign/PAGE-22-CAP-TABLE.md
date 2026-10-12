# ExitOS redesign · Page 22 — Cap Table

| | |
|---|---|
| Route | `/console/investors` |
| Component | `src/pages/Investors.tsx` (260 lines) |
| NAV | "Cap Table", group Mandate, founder, no plan gate |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `ff2113a`)

### Purpose
The cap table (fully-diluted ownership, signatory and board flags), signatory coverage and drag-along readiness, per-offer liquidation waterfall and "what you walk away with", and an "Add stakeholder" form.

### Data flow
| Element | Source | Nature |
|---|---|---|
| Cap table, signatories, drag-along, waterfalls | `SAMPLE_CAPTABLE`, `SAMPLE_OFFERS` (demo company) via the cap-table engine | Engine ✓ on **demo data, unlabelled** |
| **"What you walk away with"**: "Your gross proceeds" / "After preferences" / "After taxes" | same block as Page 10 before its G2: "your" = the founder group; "after preferences" = the engine's **risk-adjusted value** (stock −15 %, earnout −45 %); tax 23.8 % applied to that value | **Mislabels and mixed calculation** (fixed on Page 10, still here) |
| Header "Net to founders" | `netToFoundersUsd` (risk-adjusted) | Mislabel |
| Tax 23.8 % | constant | Assumption, unlabelled |
| **"Add stakeholder" → "Added {name} to the cap-table CRM"** | React state only — lost on reload; not part of the cap table or any calculation | Implies a saved change |
| `h1` | "Investor CRM" (NAV: "Cap Table") | Name mismatch |
| Offer selector | `select` without an accessible name | Accessibility (axe critical) |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline (free founder — no plan gate)
`h1` none · axe color-contrast ×12, select-name (critical) (1440); scrollable regions not focusable (390) · no overflow · 0 errors.

## Gap register — Page 22
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Walk-away cascade mislabelled and mixed** (as Page 10). | Same correction as Page 10 G2/G3: headline → preference stack → founders' gross (founder group) → after the flat tax assumption on gross; risk-adjusted value shown separately and labelled; header metric renamed. | ☐ |
| G2 | **"Added to the cap-table CRM"** — nothing is saved or calculated. | Say it: a contact list for this session, not saved, not in the cap table or waterfall. | ☐ |
| G3 | Demo cap table and offers unlabelled. | Badge and line: sample cap table and offers of the demo company (intake has neither). | ☐ |
| G4 | Fake live tape. | `RegistryTape`. | ☐ |
| G5 | Design: no `h1`, contrast, unnamed select, unfocusable scroll regions, name mismatch. | Rebuild on `xo`; `h1` "Cap Table". | ☐ |

---

## Closure log

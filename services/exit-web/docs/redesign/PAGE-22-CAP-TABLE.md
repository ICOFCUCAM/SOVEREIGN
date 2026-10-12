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
| G5 | Design: no `h1`, contrast, unnamed select, unfocusable scroll regions, name mismatch. | Rebuild on `xo`; `h1` "Cap Table". | ☑ `d093efc` |

---

## Closure log

### G5 — Design
*Closed by:* `pages/Investors.tsx` rebuilt on `xo` (`PageHeader` `h1` **"Cap Table"** — the NAV name; "Investor CRM" kept in the eyebrow; five metrics; banker's take as a page-local definition list (shared `BankerTake` no longer used here); warnings as a labelled section; cap table and stakeholder waterfall as tables with row headers inside keyboard-reachable `ScrollRegion`s; the offer selector has a label; walk-away steps as an ordered list; signatory roster as lists). The add-stakeholder dialog is the shared `Modal` (accessible since X13). Content carried over verbatim; G1–G4 follow.
*Verification:* `tsc -b`, eslint clean · Chromium (free — no plan gate) 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 12 contrast + unnamed select + 2 scroll regions), all tab stops with visible focus; add-stakeholder dialog: role dialog, focus inside, Escape closes focus back to "+ Stakeholder" — **correction:** axe found 1 colour-contrast failure inside the dialog (the shared `Field` hint "Optional", 3.78:1); this line first said axe 0 in error. Fixed as X16 below.

### X16 — Shared `Field` hint contrast (found here) — documented before the fix
`lib/ui.tsx` `Field` renders its hint as `text-white/40` — 3.78:1 on the dialog surface, below 4.5:1. Used by every form built on `Field`. *Fix:* `text-white/60`.

### X16 — Shared `Field` hint contrast
*Closed by:* `lib/ui.tsx` `Field`: hint `text-white/40` → `text-white/60`. No behaviour change.
*Verification:* `tsc -b` pass · Chromium: Cap Table add-stakeholder dialog axe 0 (was 1).

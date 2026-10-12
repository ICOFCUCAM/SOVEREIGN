# ExitOS redesign · Page 27 — Process Intelligence

| | |
|---|---|
| Route | `/console/process-intel` |
| Component | `src/pages/ProcessIntelligence.tsx` (85 lines) + `lib/process-intel.ts` |
| NAV | "Process Intelligence", founder, **Active Mandate (Pro)** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `d01b7ec`)

### Purpose
A funnel (matched → NDA → LOI → closed) with conversions and median times, and a per-buyer response table, for the founder's mandate.

### Data flow
| Element | Source | Nature |
|---|---|---|
| All figures | `mandateEventsFrom()` over the demo listing's engine matches, **`SAMPLE_NDAS` and `SAMPLE_OFFERS`** (seeded fixtures with timestamps relative to today) | **Sample data** |
| "buyer-response telemetry for the live mandate … derived from real process events" (comment); foot "Derived from the platform's own NDA and offer events … buyer-response intelligence neither a banker nor PitchBook has" | — | **Overclaim**: no process has run; the events are fixtures |
| "Matched — qualified buyers engaged" | engine matches for the demo listing | Mislabel — matched is not engaged |
| "first touch → signed / LOI" | measured from the match event | Mislabel — there is no "first touch" |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline (Active Mandate)
`h1` none · axe color-contrast ×9 (1440) · no overflow · 0 errors. Free: Upgrade page.

## Gap register — Page 27
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Sample fixtures presented as real, live process telemetry.** | Badge and line: sample NDAs and offers of the demo company; the foot says what the figures will mean once real processes run; no PitchBook claim. | ☐ |
| G2 | Mislabels ("qualified buyers engaged", "first touch"). | "Matched by the engine — not contacted"; "from match → …". | ☐ |
| G3 | Fake live tape. | `RegistryTape`. | ☐ |
| G4 | Design: no `h1`, 9 contrast failures. | Rebuild on `xo`. | ☑ G4-commit |

---

## Closure log

### G4 — Design
*Closed by:* `pages/ProcessIntelligence.tsx` rebuilt on `xo` (`PageHeader` `h1`; four metrics; the funnel as an ordered list with decorative bars; the response table with row headers in a `ScrollRegion`; stages in words with colour). Content carried over verbatim; G1–G3 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Active Mandate 1440/390: 0 errors, `h1` 1 (was 0), no overflow, axe **0** (was 9), all tab stops with visible focus.

# ExitOS redesign · Page 13 — Acquisition Intelligence (`/console/intelligence`)

| | |
|---|---|
| Route | `/console/intelligence` |
| Component | `src/pages/Intelligence.tsx` (599 lines) |
| NAV | founder: "Acquisition Radar", group Market Intelligence; buyer: "Acquisition Radar", group Marketplace; no plan gate |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `d630582`)

### Purpose
The acquisition-intelligence engine for the company: the six-layer discovery pipeline, the five buyers with the best expected realised value, hidden buyers from the co-acquisition graph, "proprietary platform signals", a radar of registry signals, provenance counts, match explanations, outcome standouts and the full ranked table (sortable by fit probability or expected outcome, filterable).

### Data flow
| Element | Source | Nature |
|---|---|---|
| Pipeline layers, ranked outcomes, hidden buyers | `runAcquisitionIntelligence` / `runBuyerDiscovery` on `SAMPLE_COMPANY` at the demo value | Engine, demo company unlabelled |
| **"Proprietary platform signals — behavioural evidence from this workspace's own process records — no external database has this"** | `computePlatformSignals()` over `SAMPLE_NDAS` and `SAMPLE_OFFERS` — seeded demo fixtures; "counterparties engaging on counters — live tension" | **Fixture data presented as recorded behaviour** |
| **"Acquisition Radar · live"** (pulsing dot), "**Outreach success +N%**", "+N%" per signal | lift = arbitrary per-row numbers (min(6, deals × 2), min(4, active), 2) summed | **Invented metric** and fake live indicator |
| "N of M matched mandates are actively deploying capital"; KPI "Active acquirers — recent-12mo activity" | `buyer.appetite === "active"` — a registry attribute | Mislabel |
| "Ranked by acquisition probability — likelihood the buyer engages and signs"; "% match" | `candidate.probability` — the engine's weighted fit score | Mislabel (as on Page 11) |
| "deals from live EDGAR/Wikidata fetch"; "ExitOS scores every buyer on live EDGAR/Wikidata signals" | registry snapshot tiers | "Live" overclaim — the registry is a dated snapshot |
| "Live data — tenant-measured close rate …" (shown when stats return) | `exit-buyer-stats` for `DEMO_TENANT_ID` — the demo tenant (D2: its rows are demo) | Demo data labelled "Live data" |
| "Strategic narrative" | template sentence ("{buyer} likely values {company} for its {sector} position …") | Generated text, unlabelled |
| Banker's take "Appetite windows close — active acquirers redeploy capital … while you wait"; "drafts the personalized intro" | — | Invented urgency, overclaim |
| "Hand it to the banker" → `/console/banker` | link; page has no plan gate | Free / Preparation founders hit the Upgrade page without warning |
| **Buyer role** | sees the same founder page: the founder's sample NDA / offer statistics, "Microsoft Industry Solutions leads the field … 68/100", and the founder CTA | **Founder process data shown to a buyer** |
| NAV | two founder sidebar items named **"Acquisition Radar"** (`/console/acquisition-radar` = Page 04, and this page) | Duplicate name for different pages |

### Baseline
Founder free/Pro and buyer: `h1` 1 · axe 0 · **overflow at 390** · 0 errors.

## Gap register — Page 13
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Fixture NDAs/offers presented as proprietary recorded behaviour.** | Title and foot say "sample process records (demo data)"; drop "no external database has this" and "live tension". | ☑ `f66e3f3` |
| G2 | **Invented "Outreach success +N%" lift** and the "live" radar. | Remove the lift figures; section becomes "Registry signals" with the snapshot date; no pulsing dot. | ☑ `5be318e` |
| G3 | Mislabels: fit probability as "likelihood … signs"; appetite as "deploying capital / recent-12mo activity"; "live" EDGAR/Wikidata; demo-tenant stats as "Live data"; narrative unlabelled. | Accurate labels: fit probability (engine fit score); appetite (registry attribute); "fetched from EDGAR/Wikidata, snapshot as of …"; "Recorded stats · demo tenant"; "template sentence". | ☑ `920ac19` |
| G4 | Banker's-take urgency and overclaim; hidden plan gate on the banker CTA. | Plain wording; `requiredEngagement` note. | ☐ |
| G5 | **Buyer role sees founder process data** and the founder CTA. | For buyers: hide the sample-process signals and the banker's take; state the page shows the buyer landscape for the demo/listed company. Route unchanged. | ☐ |
| G6 | Duplicate NAV name "Acquisition Radar". | This page becomes **"Acquisition Intelligence"** in NAV (both roles) and in its `h1`. | ☐ |
| G7 | Demo company unlabelled. | Run on `loadActiveCompany()` at its canonical value; badge. | ☐ |
| G8 | Design: overflow at 390, old primitives. | Rebuild on `xo`. | ☑ `7e81471` |

---

## Closure log

### G8 — Design
*Closed by:* `pages/Intelligence.tsx` rebuilt on `xo` (`PageHeader` `h1`; pipeline as an ordered list; ranked outcomes as a list with `h3`s and definition lists; hidden buyers and platform signals side by side; radar; banker's take as a page-local definition list (shared `BankerTake` no longer used here); provenance strip; four metrics; match explanations with `h3`/`h4`; standouts as a definition list; filter with a real `<label>` and a polite live count; sort as two `Chip` toggle buttons with `aria-pressed`; the ranked table with row headers inside a keyboard-reachable `ScrollRegion`; signal tier chips carry screen-reader words). Content carried over verbatim; G1–G7 follow.
*Verification:* `tsc -b`, eslint clean · Chromium founder 1440/390 and buyer 390: 0 errors, `h1` 1, **no overflow** (was overflowing at 390), axe 0, all tab stops with visible focus.

### G1 — Fixture NDAs/offers presented as proprietary recorded behaviour
*Closed by:* `pages/Intelligence.tsx`, `lib/platform-signals.ts` (wording only; figures unchanged). Section "Proprietary platform signals — behavioural evidence from this workspace's own process records — no external database has this" → **"Process signals · sample records" — "from the demo company's sample NDAs and offers — demo data"**, foot: "Computed from seeded sample records, not from a process run on ExitOS. With real NDAs and offers these figures would come from your own records." Detail "counterparties engaging on counters — live tension" → "N sample offers are at the counter stage". Module comment updated. (`computePlatformSignals` has no other caller.)
*Verification:* `tsc -b`, eslint clean · Chromium: 0 matches for Proprietary / no external database / live tension; new title present.

### G2 — Invented "Outreach success +N%" and the "live" radar
*Closed by:* `pages/Intelligence.tsx`. The per-signal "lift" (min(6, deals × 2), min(4, active buyers), a fixed 2) and their sum shown as "Outreach success +N%" are removed — no outreach outcome is measured anywhere. "Acquisition Radar · live" (with the pulsing dot, already gone in G8) → **"Registry signals"**, eyebrow "Snapshot · as of {market-index date}". The signal texts are unchanged.
*Verification:* `tsc -b`, eslint clean · Chromium: 0 matches for "Outreach success", "· live" or trailing "+N%"; 0 pinging elements. (Two remaining "live" words belong to G3/G4.)

### G3 — Mislabels
*Closed by:* `pages/Intelligence.tsx` (labels only).
| Before | After |
|---|---|
| "N of M matched mandates are actively deploying capital"; KPI "Active acquirers — recent-12mo activity" | "… ranked buyers have an active appetite in the registry (a profile attribute, not recent activity)"; "Active-appetite buyers — registry attribute" |
| "Ranked by acquisition probability — likelihood the buyer engages and signs"; sort "Probability"; "% match"; column "Match"; "Average match — probability × fit"; "qualifying ≥ 15% probability" | "Ranked by fit probability — the engine's weighted fit score, not a measured chance of a bid"; "Fit probability"; "fit probability"; "Fit"; "Average fit probability — engine fit score, 0–1"; "top by fit probability" |
| "… the founder's actual take-home expectation" | "… the model's expected take-home" |
| "deals from live EDGAR/Wikidata fetch" | "deals fetched from EDGAR/Wikidata (registry snapshot)" |
| "Live data — … tenant-measured …" (demo tenant) | "Recorded stats · demo tenant — … recorded for the demo tenant (demo data)" |
| "Strategic narrative" | "Strategic narrative · template sentence" |
*Verification:* `tsc -b`, eslint clean · Chromium: 0 matches for deploying capital / recent-12mo / engages and signs / live EDGAR/Wikidata fetch / Live data / "% match" · free 1440/390: 0 errors, axe 0, no overflow. (The "Recorded stats" strip appears only when the stats function returns rows — not exercised here; NOT VERIFIED in the browser.)

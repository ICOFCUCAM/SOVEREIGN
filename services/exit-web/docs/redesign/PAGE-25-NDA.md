# ExitOS redesign · Page 25 — NDA Vault / Access Requests (`/console/nda`)

| | |
|---|---|
| Route | `/console/nda` |
| Component | `src/pages/Nda.tsx` (331 lines) |
| NAV | founder: "NDA Vault", **Active Mandate**; buyer: "Access Requests", group Deals, **Pro** |
| Status | Stage A audit — gaps documented below; each closed in its own commit and marked here. |

## Stage A — Audit (baseline commit `79fe79c`)

### Purpose
The founder's NDA register: counterparties, status, a "Buyer Trust Score" from four "verification gates", NDA terms and signatures, templates, issuing a new NDA, and a sample breach notice.

### Data flow
| Element | Source | Nature |
|---|---|---|
| NDAs | `SAMPLE_NDAS` (seeded demo portfolio) + NDAs issued in this session via the engine's `issueNda()` | Demo, unlabelled; disclosing party hard-coded "Helios Freight, Inc. / Anne Kovac" |
| **"Buyer Trust Score"** — "Identity verified", "Acquisition history validated", "**Funds verified**"; tiers "Verified / Qualified / Unverified" | proxies on the NDA record: identity = a signature event exists; history = the signature names a representative; **funds = the NDA is active and has a liquidated-damages clause** | **Verification claims ExitOS does not make** — nothing checks identity, track record or funds |
| "gates data-room access automatically"; "data-room access restricted until trust clears"; "cleared for the data room" | — | **False** — there is no gated data room (Pages 12, 14) |
| "Issue NDA" → "NDA issued to {buyer} — pending countersignature"; "Generates a pending-signature NDA against the live listing" | local engine call; nothing is sent; "live listing" is the demo private listing | Implies the NDA went out |
| Sample breach notice | `generateBreachNotice` with fixed allegations and evidence references ("audit-log: data-room.session.4421", an email timestamp) | Labelled "Sample" but the evidence references look real |
| **Buyer role** | sees the **founder's NDA register**: other buyers' names, trust scores, terms and the breach notice | **Role-inappropriate content** (as Page 12 before its G3) |
| Tape | registry snapshot | Fake live (pinging) |

### Baseline
Founder Active Mandate: `h1` none · axe empty-table-header ×1 · **overflow at 390** · 0 errors. Buyer Pro: the same founder page, `h1` none.

## Gap register — Page 25
| # | Gap | Fix | Status |
|---|---|---|---|
| G1 | **Buyers see the founder's NDA register.** | Buyer role gets its own "Access Requests" view: no other counterparties; how access requests work; links to Browse Opportunities and Deal Room. | ☑ `ba6399b` |
| G2 | **Fake verification gates** ("identity / history / funds verified", "Verified" tier). | Gates named for what they check (NDA executed, signature recorded, named representative, liquidated-damages clause); "N of 4 record checks"; state that ExitOS does not verify identity, funds or track record. | ☐ |
| G3 | **False data-room gating; "issued" implies sent; sample breach evidence looks real.** | Plain wording: no data room gating exists; NDAs are drafted in this session and not sent; breach allegations and evidence references marked illustrative. | ☐ |
| G4 | Demo NDAs unlabelled. | Badge and line: sample NDA portfolio of the demo company. | ☐ |
| G5 | Design: no `h1`, overflow at 390, empty header, tape. | Rebuild on `xo`; `RegistryTape`. | ☑ `e4d0401` |

---

## Closure log

### G5 — Design and tape
*Closed by:* `pages/Nda.tsx` rebuilt on `xo` (`PageHeader` `h1` with the PDF link (announced as a new tab), Templates and Issue NDA as header actions; four metrics; banker's take as a page-local definition list (shared `BankerTake` no longer used here); the register as a table with row headers and a labelled details column in a `ScrollRegion` — Open/Close buttons carry `aria-expanded` and the counterparty name; trust gates as a list with "(met)/(not met)"; terms as a definition list; the breach notice in a scrollable region; templates and issue dialogs are the shared `Modal` (X13); pinging `MarketTape` → dated `RegistryTape`). Content carried over verbatim; G1–G4 follow.
*Verification:* `tsc -b`, eslint clean · Chromium Active Mandate 1440/390: 0 errors, `h1` 1 (was 0), **no overflow** (was overflowing at 390), axe 0 (was 1), all tab stops with visible focus; templates and issue dialogs axe 0; with an NDA opened: axe 0, no overflow.

### G1 — Buyers saw the founder's NDA register
*Closed by:* `pages/Nda.tsx`, `lib/exit-api.ts` (additive `myNdaRequests()` — lists this account's own NDA requests through the existing `listNdaRequests({ buyerAccountId })`; empty when no account is connected). For `role === "buyer"` the page renders **Access Requests**: the buyer's own requests with status ("Awaiting the founder" / "NDA signed" / "Declined") and date, loading and error states, a foot explaining the flow (request from a listing on the Acquisition Radar → founder decides → deal room), and links to the Acquisition Radar, Browse Opportunities and the Deal Room. The founder register (renamed `FounderNdaVault`) is unchanged. Route, NAV and gates unchanged.
*Verification:* `tsc -b`, eslint clean, `vitest` 204/204 · Chromium: buyer (Pro) → "Access Requests", "No access requests recorded for your account.", 0 other counterparties; founder → the register · buyer 1440/390: 0 errors, `h1` 1, no overflow, axe 0. **NOT VERIFIED:** the list with an actual request — creating one in the test session would write to the connected backend, so it was not done.

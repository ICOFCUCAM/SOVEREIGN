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
| G1 | **Buyers see the founder's NDA register.** | Buyer role gets its own "Access Requests" view: no other counterparties; how access requests work; links to Browse Opportunities and Deal Room. | ☐ |
| G2 | **Fake verification gates** ("identity / history / funds verified", "Verified" tier). | Gates named for what they check (NDA executed, signature recorded, named representative, liquidated-damages clause); "N of 4 record checks"; state that ExitOS does not verify identity, funds or track record. | ☐ |
| G3 | **False data-room gating; "issued" implies sent; sample breach evidence looks real.** | Plain wording: no data room gating exists; NDAs are drafted in this session and not sent; breach allegations and evidence references marked illustrative. | ☐ |
| G4 | Demo NDAs unlabelled. | Badge and line: sample NDA portfolio of the demo company. | ☐ |
| G5 | Design: no `h1`, overflow at 390, empty header, tape. | Rebuild on `xo`; `RegistryTape`. | ☐ |

---

## Closure log

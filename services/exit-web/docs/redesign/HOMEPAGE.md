# ExitOS redesign · Homepage (and marketing routes)

| | |
|---|---|
| Routes | `/` (`pages/Landing.tsx`, 1,098 lines), shared chrome `components/MarketingChrome.tsx`; later phase: `/platform`, `/modules`, `/pricing` |
| Skeleton | `public/index(9).html` (added to `main` in `4ef859ad`, merged into this branch in `20545a37`) |
| Owner direction | Use the `index(9).html` skeleton to rebuild the homepage, incorporating **everything** on the current homepage. "Do not throw away the colour and materials created in EXIT OS; you can only interchange them" and reposition them. "The homepage colors are good and must be locked. There should be no update in colors." Features are not replaced, only repositioned. "A high premium, non-SaaS, iconic, top-notch homepage." Master command: preserve the hero concept, routes, i18n, pricing and the auth entry points; no invented data and no fake live indicators; respect reduced motion; responsive. Phases: audit → design system → homepage → other routes → review. |
| Rule (from the console work) | Document each gap, then close it in its own commit; never claim an unexecuted test passed. |
| Status | Audit and gap register written. |

## Stage A — Audit (baseline `20545a37`)

### The skeleton (`index(9).html`)
An editorial, magazine-like page. In order:
1. **Top bar**, three columns: brand mark | small mono "topnote" | nav (3 links) | sign-in + dark CTA. A hamburger on phones.
2. **Hero**:
   - A mono topline (label left, "Issue No." right).
   - A very large serif headline set on two offset lines, with the last word as an accent.
   - A numbered deck paragraph ("01—").
   - Two square buttons.
   - A dark **artboard** instrument on the right, with a grid, rings and three deal nodes.
   - A rule with a one-line index under it.
3. **Ticker band**: a full-width accent band with a static row of mono stage words.
4. **Thesis** ("02 / The thesis"): a big serif statement with a chapter label on the left, a short paragraph and an underlined link.
5. **System** ("03 / The system"): a section head, then a 3-column capability grid divided by hairlines (number, glyph, title, text).
6. **Working environment** ("04"): a dark full-width section with copy on the left and a framed "desk" UI on the right, labelled "Illustrative UI".
7. **Final move** ("05"): a big serif CTA statement and a button.
8. **Footer**: brand, links, and a mono note saying the example items are not live data.

Materials: hairline rules instead of cards, square buttons, mono chapter labels, a numbered chapter order and generous whitespace. The skeleton's own colours (bone, red, forest) and fonts (Playfair, Manrope, DM Mono) are **not** used, per the owner.

### Locked ExitOS colours and materials (inventory of the current homepage)
| Role in the skeleton | ExitOS value used today (locked) |
|---|---|
| Page ground ("bone") | `#f6f8fb` page, `white` sections |
| Hairline rules | `slate-200` |
| Ink (text, dark buttons) | `ink-900 #0a1018`, `ink-800`, `slate-600 / 500` secondary |
| Accent (chapter labels, emphasis, links — the skeleton's red) | `blue-600 #2563eb` (eyebrows, links), `blue-300` on navy |
| Dark instrument / dark section (the skeleton's forest and terminal) | navy gradient `#06182E → #0A1F3A → #0B2547`; board `#08203B → #06182E`; bezel `#1c2c44 → #0a1626` |
| Signal colour (the skeleton's red dot and status green) | `#7CFF9F`, `#45E38A`, `emerald-500` |
| Status colours | closed `#45E38A`, announced `#FFB14A`, heat gradients (`#FF5A5A` … `#4A8CFF`) |
| Imagery | `/command-center.png` trading-hall photograph; `Vault` SVG; `WorldDots` map; `Glyph` icons; `Mark` monogram tiles; `ExchangeLockup` logo |
| Type | `font-serif` = **Sora** (display); Inter (body); `font-mono` (figures); **Source Serif 4** is already loaded in `index.css` (used for the skeleton's editorial serif headline — an existing ExitOS material, interchanged) |

### What is on the homepage today (everything must be kept, repositioned)
| # | Block | Content | Data |
|---|---|---|---|
| 1 | Proof ribbon | 4 figures: acquisitions indexed, acquirer mandates, value tracked, mandates deploying (green dot) | registry / index (real) |
| 2 | Hero | eyebrow, `h1` "INSTITUTIONAL / ACQUISITION / INFRASTRUCTURE", sub, body, **Access the Exchange** → `/console`, **Deploy a Mandate** → `/pricing`; trading-hall photo backdrop | i18n |
| 3 | Command board | Strategic Buyers (match score), Live Transactions, Acquisition Demand (sector switcher, drill-down), 5-stat bar, mandate ticker, transaction drill-down dialog | registry and history (real) plus motion |
| 4 | Trust strip | 4 cards: mandates · SOC 2 · 100% founder controlled · every action auditable | mixed |
| 5 | Lifecycle rail | 8 stages with typical weeks, "Live process" | i18n |
| 6 | Market structure | 5 counterparty types (2 with registry counts) | registry |
| 7 | Workflow | `h2`, 6 steps, Founder → Exit flow | i18n |
| 8 | Buyer intelligence | 5 registry buyer cards (appetite meter, check size, activity, focus) | registry |
| 9 | Data provenance | pipeline (4), confidence register (3 tiers), 6 signal tiles | registry / history |
| 10 | Data rooms | copy, security row, vault graphic, 6 document categories "Secured · Audit trail" | static |
| 11 | Negotiation desk | cross-bid table (Buyer A/B/C), copy, 3 features | static figures |
| 12 | Marketplace | 4 codename listings with bands and stages, "Request NDA" | static fixtures |
| 13 | Global reach | dot world map with animated arcs, top jurisdictions, 4 stats | registry plus "24/7" |
| 14 | Why founders lose millions | Traditional vs ExitOS matrix (4 rows) | medians real |
| 15 | Transaction record | 3 disclosed deals, sources line, bridge CTA "Run the valuation" | history (real) |
| 16 | Governance | 5 controls | static claims |
| 17 | Final CTA | `h2`, body, **Open Acquisition Workspace** → `/console`, **Request a Private Briefing** → `/pricing`, foot | i18n |
| — | Chrome | header (logo, Platform/Modules/Pricing, EN/FR/ES, Log in, Access the Exchange, mobile menu); footer (tagline, 3 link columns, badges, legal, locale, domain) | i18n |

### Measured baseline (Chromium, 1440 and 390, `scratchpad/tools/mkt.mjs`)
| Route | Errors | `h1` | Overflow | axe | "live" words | Animations (reduced motion on) | Page height |
|---|---|---|---|---|---|---|---|
| `/` 1440 | 0 | 1 | no | color-contrast ×111, empty-table-header, landmark-one-main, region ×155 | 6 | 8 (**10**) | 7,885 px |
| `/` 390 | 0 | 1 | no | same + scrollable-region-focusable | 4 | 9 (**7**) | **17,011 px** |
| `/platform` | 0 | 1 | no | contrast ×18, no `main`, region | 2 | 0 | 2,112 |
| `/modules` | 0 | 1 | no | contrast ×12, no `main`, region | 2 | 0 | 2,076 |
| `/pricing` | 0 | 1 | no | contrast ×31, no `main`, region | 4 | 0 | 3,986 |

### Content that is not true or not labelled (homepage and chrome)
- **Fake live indicators.**
  - "Live Market" pulsing badge; "System Status · Live" with a ping.
  - Column "Live Transactions" with a pulsing dot. These are the six most recent *disclosed historical* deals.
  - A rotating "live row" spotlight.
  - A running `SessionClock`.
  - Match scores and demand bars that **oscillate on a timer** (`liveScore`, `liveBars`), so the numbers change while nothing has happened.
  - Lifecycle "Live process" with a ping and a travelling dot.
  - `DATA_AS_OF` is **today's date**, not the data date. The index has its own `generatedAt` (`MARKET_INDEX_FMT.asOf`).
  - "live appetite"; "24/7 Market Activity"; "Live signals" (losses matrix).
- **Unverified security and compliance claims.**
  - "SOC 2" (trust strip, governance band, footer badge). There is no SOC 2 evidence in the repository.
  - "Full audit trail / every action audited / access logs / admissible process history" (trust strip, governance, data rooms, final CTA foot, footer). The console records only the user's own deal events (Page 28); there is no audit log or access log.
  - Data rooms "Secure, permissioned" and each category "Secured · Audit trail". The data room uploads to a **shared tenant** (X12, Page 14).
  - "Buyer verification — identity, track record and funds clear four gates". **False** per the Page 25 audit: ExitOS does not verify identity, funds or track record.
  - "Encrypted at rest and in transit; data residency respected" (not verified for this deployment).
- **Illustrative content shown as real.**
  - The cross-bid table (Buyer A/B/C, $172M …) is an illustration; only a code comment says so.
  - The four marketplace listings (Meridian, Basalt, Aurelia, Caldera, with stages "In diligence", "Management meetings") are fixtures.
  - "Market Heat: High" is hard-coded.
- **Overclaims in copy.**
  - "AI valuation": the engines are deterministic, with no AI (Pages 23, 35).
  - "Offer optimisation captures the premium".
  - "verified acquirer mandates": the registry is curated; verification is not evidenced.
  - "Match Score" on the board is each buyer's activity score, not a match to any company.
- **Broken link.** "How the listing protocol works" → `/marketplace`, which is not a route; the catch-all sends it to `/`.

## Gap register — Homepage
| # | Gap | Fix (colours locked; no feature removed) | Status |
|---|---|---|---|
| M1 | **Design: rebuild on the `index(9)` skeleton.** | Rebuild `Landing.tsx` and `MarketingChrome.tsx` on the skeleton's anatomy, using the locked ExitOS colours and materials mapped as above. All 17 blocks and the chrome are kept and repositioned into the skeleton's chapters (mapping below), with content carried over verbatim; M2–M9 then correct content. The hero concept (the command board as the hero instrument, beside the headline) is kept. The trading-hall photo stays in the hero. Routes, i18n keys, auth entry points (`/console`) and pricing links are unchanged. | ☐ |
| M2 | **Fake live indicators.** | Remove the pings, pulses, rotating spotlight, session clock and the timer-driven score/heat oscillation. "Live Transactions" → "Disclosed transactions"; "Live Market"/"Live" → "Registry snapshot · as of {index date}"; `DATA_AS_OF` → the index's own date; "Live process" → "Typical timeline"; "live appetite", "24/7", "Live signals" reworded to what the data is. Figures and the drill-down stay. | ☐ |
| M3 | **Unverified security and compliance claims.** | Remove "SOC 2" and the audit-trail, access-log, "secured", encryption and verification claims. Each slot is kept and states what the product does (for example "Your own actions are recorded", "NDA-gated identity: listings show a codename and bands until an NDA is signed", "Founder approval at each agent step", "Record checks on each NDA, not identity or funds verification", "Data-room uploads: read who can see them before adding files"). Owner can restore any claim with evidence (open decision). | ☐ |
| M4 | **Illustrative content shown as real.** | Visible "Illustrative" labels on the cross-bid table and the example listings; "Market Heat" shows the registry-derived heat label instead of a constant. | ☐ |
| M5 | **Overclaims in copy.** | "AI valuation" → "Deterministic valuation"; "Offer optimisation captures the premium" → "Offers compared on structure and certainty"; "verified acquirer mandates" → "curated acquirer mandates"; board "Match Score" → "Activity score". | ☐ |
| M6 | **Broken link** `/marketplace`. | Point "How the listing protocol works" to the marketplace inside the exchange (`/console/marketplace`; signed-out users see sign-in). | ☐ |
| M7 | **Accessibility.** | A `main` landmark in the chrome (all marketing pages); contrast ≥ 4.5:1 for text (locked colours kept, opacities/shade steps within the same palette adjusted); the empty table header labelled; the drill-down as a real dialog (focus, Escape, `aria-modal`); the scrolling matrix keyboard-focusable; decorative map and graphics `aria-hidden`. Target: axe 0 on `/` at 1440 and 390. | ☐ |
| M8 | **Motion ignores reduced-motion.** | All homepage animations (ticker, scan, travelling dots, SVG `animateMotion`) honour `prefers-reduced-motion: reduce` — no animation when set. | ☐ |
| M9 | **i18n.** | Every copy change above is made in EN, FR and ES together; new strings get keys in all three. | ☐ (closed with each gap) |

### M1 mapping — current blocks into the skeleton's chapters
| Skeleton slot | ExitOS content placed there |
|---|---|
| Top bar | `ExchangeLockup` · topnote = hero eyebrow "The Global Acquisition Exchange" · nav Platform / Modules / Pricing · EN/FR/ES · Log in · **Access the Exchange** (dark square CTA) · mobile menu |
| Hero topline | left: "Institutional acquisition infrastructure"; right: "Registry · as of {date}" |
| Hero headline + deck + actions | `hero.h1` in the editorial serif on offset lines, last line in the accent colour · deck "01—" = `hero.sub` + `hero.body` · **Access the Exchange**, **Deploy a Mandate** |
| Hero artboard | the **command board** (navy bezel, three columns, stat bar, mandate ticker, drill-down) |
| Hero index rule | the **proof ribbon** figures in one mono row |
| Under the hero | **trust strip** (4 cells, hairline-divided) |
| Ticker band | **lifecycle rail**: 8 stages with typical weeks, on the navy band |
| 02 / The thesis | `loss.h2` "Why founders lose millions on exit." + `loss.body` (real medians) + the **Traditional vs ExitOS matrix** |
| 03 / The system | `wf.h2` + the **6 workflow steps** as the hairline capability grid (3 × 2) + the **Founder → Exit** flow + **market structure** (5 counterparties) |
| 04 / The record | **buyer intelligence** cards · **data provenance** (pipeline, confidence register, signal tiles) · **transaction record** (3 deals, sources, "Run the valuation") |
| 05 / The working environment (dark) | **negotiation desk** (cross-bid table in the framed "desk") + **data rooms** (vault, 6 categories) |
| 06 / The market | **marketplace** listings + **global reach** (map, jurisdictions, stats) |
| 07 / Governance | the **governance** controls as a hairline row on navy |
| 08 / The next move | **final CTA** (`cta.h2`, body, both buttons, foot) |
| Footer | brand, tagline, 3 link columns, badges (as corrected), legal, locale, domain, and a mono note on what the figures are |

## Later phase — other routes (to be audited after the homepage)
`/platform`, `/modules`, `/pricing`: the same chrome (from M1), a skeleton-consistent layout, and the content audit. Known already: Pricing still carries the old tier texts ("Most selected", "NDA automation", "AI negotiation", "net-to-founder math"), to align with Upgrade (Page 41 G2); Platform says "one live exchange", "one audit trail", "Permissioned data rooms, full audit trails and access logs", "the live deal room".

---

## Closure log

---

## Open decisions for the owner
- **Security and compliance claims** (M3): restore any of SOC 2, audit trail, access logs, encryption or buyer verification only with evidence (a report, a log, a check in the code).

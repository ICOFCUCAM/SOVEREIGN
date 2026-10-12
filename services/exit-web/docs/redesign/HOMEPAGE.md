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
| M1 | **Design: rebuild on the `index(9)` skeleton.** | Rebuild `Landing.tsx` and `MarketingChrome.tsx` on the skeleton's anatomy, using the locked ExitOS colours and materials mapped as above. All 17 blocks and the chrome are kept and repositioned into the skeleton's chapters (mapping below), with content carried over verbatim; M2–M9 then correct content. The hero concept (the command board as the hero instrument, beside the headline) is kept. The trading-hall photo stays in the hero. Routes, i18n keys, auth entry points (`/console`) and pricing links are unchanged. | ☑ `dcf7bf6d` |
| M2 | **Fake live indicators.** | Remove the pings, pulses, rotating spotlight, session clock and the timer-driven score/heat oscillation. "Live Transactions" → "Disclosed transactions"; "Live Market"/"Live" → "Registry snapshot · as of {index date}"; `DATA_AS_OF` → the index's own date; "Live process" → "Typical timeline"; "live appetite", "24/7", "Live signals" reworded to what the data is. Figures and the drill-down stay. | ☑ `ce76fa8f` |
| M3 | **Unverified security and compliance claims.** | Remove "SOC 2" and the audit-trail, access-log, "secured", encryption and verification claims. Each slot is kept and states what the product does (for example "Your own actions are recorded", "NDA-gated identity: listings show a codename and bands until an NDA is signed", "Founder approval at each agent step", "Record checks on each NDA, not identity or funds verification", "Data-room uploads: read who can see them before adding files"). Owner can restore any claim with evidence (open decision). | ☑ `53ade1c7` |
| M4 | **Illustrative content shown as real.** | Visible "Illustrative" labels on the cross-bid table and the example listings; "Market Heat" shows the registry-derived heat label instead of a constant. | ☑ `d38267fd` |
| M5 | **Overclaims in copy.** | "AI valuation" → "Deterministic valuation"; "Offer optimisation captures the premium" → "Offers compared on structure and certainty"; "verified acquirer mandates" → "curated acquirer mandates"; board "Match Score" → "Activity score". | ☑ `868699d9` |
| M6 | **Broken link** `/marketplace`. | Point "How the listing protocol works" to the marketplace inside the exchange (`/console/marketplace`; signed-out users see sign-in). | ☑ `c53e38f1` |
| M7 | **Accessibility.** | A `main` landmark in the chrome (all marketing pages); contrast ≥ 4.5:1 for text (locked colours kept, opacities/shade steps within the same palette adjusted); the empty table header labelled; the drill-down as a real dialog (focus, Escape, `aria-modal`); the scrolling matrix keyboard-focusable; decorative map and graphics `aria-hidden`. Target: axe 0 on `/` at 1440 and 390. | ☑ `1fbe0c4f` |
| M8 | **Motion ignores reduced-motion.** | All homepage animations (ticker, scan, travelling dots, SVG `animateMotion`) honour `prefers-reduced-motion: reduce` — no animation when set. | ☑ `1797ccb2` |
| M9 | **i18n.** | Every copy change above is made in EN, FR and ES together; new strings get keys in all three. | ☑ with M2 `ce76fa8f`, M3 `53ade1c7`, M5 `868699d9` (EN/FR/ES changed together; M1, M4, M6–M8 changed no i18n text) |

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

## Phase 2 — Marketing routes `/platform`, `/modules`, `/pricing` (audit, baseline `1797ccb2`)
All three use the new chrome (M1) and are English-only (no i18n keys); that stays.

| Page | Blocks (all kept) | Content not true or not aligned |
|---|---|---|
| Platform (89 lines) | hero (`h1`, body, Launch ExitOS → `/console`, Explore the modules → `/modules`) · "Built like a bank" 4 pillars · "End to end" 6-step flow · CTA (Launch ExitOS, See pricing) | "one **live** exchange"; "one **audit trail**" (hero and pillar); "Institutional security — **Permissioned data rooms, full audit trails and access logs**" (X12, Page 28); "Autonomous execution — Agents **run** sourcing, outreach … and closing … the desk does the work" (a simulation; nothing is sent, Pages 07, 36); "the **live** deal room" (simulated, Page 12); "**watch** the agents work" |
| Modules (89 lines) | hero · founder modules (9 cards, 6 with `MODULE_FACTS` stats) · buyer modules (4 cards, 2 stats) · CTA | Valuation "recomputed **live**"; Outreach "**run by the banker agent**" (drafts, Page 36); Data Room "**Permissioned**" (X12); Closing Center "Signatures, escrow and filings **tracked to the wire**" (a checklist, Page 32); Acquisition Radar "**Live** sector signals" (registry snapshot); Deal Room "Gated diligence access **once trust and NDA clear**" (no gating, Pages 12, 25) |
| Pricing (303 lines) | hero · "How ExitOS gets paid" 5 steps · founder ladder (4 tiers, success-fee note) · banker vs ExitOS table (10 rows) · buyer tiers (3) · CTA | Same tier texts Upgrade corrected (Page 41 G2): "**Most selected**", "NDA **automation**", "**AI** negotiation", "**net-to-founder math**", "mandate **alerts**"; `h1` "Priced like a bank. **Paid when you close.**" ($995/mo is paid regardless; only the 2.5% fee is on close); locked teaser "**4 buyers** are a strong acquisition match" (a fixed number, not computed); table "NDA Automation — Automated", "Negotiation Engine — **AI** scoring", "Real-Time Buyer Signals — **Live** radar"; "an execution desk that **runs around the clock**". **Buyer tiers ($299, $2,499 a month) contradict Upgrade's note "Buyer pricing is not published yet"** (Page 41 G3) — an owner decision, not changed here |

Measured (Chromium, 1440/390, after M1/M7 chrome): 0 errors, `h1` 1, no overflow on all three; axe contrast — Platform 6, Modules 0, Pricing 19; "live" words — Platform 2, Modules 2, Pricing 4.

## Gap register — Marketing routes
| # | Gap | Fix (colours locked; no block removed) | Status |
|---|---|---|---|
| R1 | **Design: the three pages on the skeleton.** | Rebuild each page with the homepage system: editorial-serif `h1` (last line or word in the accent italic), mono chapter labels ("01 / …"), hairline grids instead of rounded cards, square buttons, the navy band where a page has a dark block. Content and links verbatim; `MODULE_FACTS`, prices, tiers, and every `/console`, `/pricing`, `/modules`, `/platform` entry point unchanged. | ☑ `14735c26` |
| R2 | **Platform overclaims.** | "live exchange" → "exchange"; "one audit trail" → "one record"; Institutional security pillar → "Data rooms and records — a document checklist with completeness per package, NDA-gated identity, and your deal actions recorded."; Autonomous execution → "Agents walk through sourcing, outreach, data room, negotiation and closing; each step waits for your approval, and nothing is sent for you."; "the live deal room" → "the deal room"; "watch the agents work" → "walk through the agents". | ☑ `aae3a406` |
| R3 | **Modules overclaims.** | "recomputed live" → "recomputed from your figures"; Outreach "run by the banker agent" → "drafted by the banker for you to send"; Data Room "Permissioned" → "A document checklist"; Closing Center → "The closing checklist: signatures, escrow and filings, item by item."; Radar "Live sector signals" → "Sector signals from the registry"; Deal Room "once trust and NDA clear" → "for companies that accept your NDA request". | ☑ `b5825acd` |
| R4 | **Pricing not aligned with Upgrade; fixed teaser number.** | Tier texts as Upgrade (Page 41 G2): "Recommended for a live process", "Buyer outreach drafts & NDA requests", "Rule-based negotiation (Bid Room), bid & process management", "Closing Center checklist", "Receive buyer interest in your Inbox"; `h1` → "Priced like a bank. Success fee only when you close."; teaser → "Buyers that match your company are shown once you list." (no fixed number); table "NDA requests & register", "Rule-based scoring & counters", "Buyer signals — Registry radar (snapshot)"; "runs around the clock" removed. Buyer tiers unchanged (open decision). | ☑ `ef4e6454` |
| R5 | **Contrast** on Platform (6) and Pricing (19). | Shade steps within the same palette (as M7). Target: axe 0 on all three at 1440 and 390. | ☑ `079f424b` |

---

## Closure log

### M1 — Rebuild on the `index(9)` skeleton
*Closed by:*
- **`components/MarketingChrome.tsx`.**
  - Skeleton top bar: logo, a mono topnote ("A Sovereign Infrastructure", from the footer), nav centred with an accent underline and `aria-current`, EN/FR/ES, Log in, and a square dark **Access the Exchange ↗** CTA. The mobile menu is unchanged.
  - **A `main` landmark** around every marketing page's content.
  - Footer re-laid on hairlines, with mono column heads in the accent; the same links, badges, legal text, locale switch and domain.
  - New exports `Chapter` (the "02 / …" mono label) and `Editorial` (headline lines, last line or word in the accent italic). `Glyph` gained an optional `size` (additive).
- **`tailwind.config`.** New font token `editorial` = Source Serif 4, already loaded by `index.css` (an existing ExitOS material). No colour token changed.
- **`pages/Landing.tsx`.** The page component was rewritten on the skeleton's anatomy. All 17 blocks were kept and repositioned per the mapping table:
  - Hero: mono topline; the `hero.h1` string in the editorial serif on offset lines, last line in blue-600 italic; the "01—" deck (`hero.sub`, `hero.body`); square **Access the Exchange** and **Deploy a Mandate**; the command board in its navy bezel as the artboard; the proof ribbon as the index rule; the trust strip in hairline cells; the trading-hall photo washed behind.
  - Lifecycle as the navy band.
  - Chapters 02 thesis + matrix, 03 workflow grid + flow + market structure, 04 buyers, 05 provenance, 06 record + bridge, 07–08 dark working environment (desk-framed cross-bid table, data rooms), 09 marketplace, 10 coverage, 11 governance, 12 final CTA.
  - Data constants, `CommandBoard`, `OfferTable`, `Vault` and `WorldDots` are unchanged.
  - Every text and figure was carried over verbatim (corrections follow in M2–M6). Colours are only the locked palette (`#f6f8fb`, white, `slate-*`, `ink-900/800`, `blue-600/300`, the navy gradients, the board colours, `emerald`).
  - Routes and link targets are unchanged: `/console`, `/pricing`, `/modules`, `/platform`, and the existing `/marketplace` (M6).
- No copy changed, so FR/ES are unaffected (M9 n/a).

*Verification:*
- `tsc -b`, eslint clean · `vitest` 218/218.
- Chromium `/` 1440 and 390: 0 errors, `h1` 1, no overflow.
- axe on `/`: **landmark-one-main and region ×155 gone**; colour-contrast 111 → 38 at 1440 (39 at 390, mostly the board's existing `white/40–45` labels, left for M7); empty-table-header and the 390 scrollable-region remain (M7).
- `/platform`, `/modules`, `/pricing` (shared chrome) 1440/390: 0 errors, `h1` 1, no overflow; landmark/region issues gone; contrast 18 → 14, 12 → 8, 31 → 27 (their own content; later phase).
- Page height: 1440 7,885 → 9,545 px (the skeleton's whitespace); 390 17,011 → 17,197 px.
- "live" words and animations unchanged (M2, M8).
- Screens: `scratchpad/home/m1b-*`.

### M2 — Fake live indicators (outside the command board)
*Scope change:* the owner directed, mid-gap, that the hero command board stay exactly as built ("use the same live screen which is built as a real screen. dont change it"; see Owner decisions). Board edits made during this gap were reverted before the commit; `CommandBoard`, `SessionClock`, the bezel ribbon and `DATA_AS_OF` (the board's date) are unchanged.
*Closed by:*
- `pages/Landing.tsx`:
  - Hero topline "ExitOS · data as of {today}" → "Registry snapshot · as of {index date}" (`MARKET_INDEX_FMT.asOf`).
  - Lifecycle band: the ping and the travelling dot removed. The label is now plain text.
  - Losses matrix "Live signals + parallel offers hold tension" → "Registry signals + …".
  - Signal tile "Actively Deploying — live appetite" → "appetite flagged in the registry".
  - Coverage stat "24/7 Market Activity" → "{sectors} Sectors Covered" (registry figure).
- `lib/i18n.tsx` (M9): `lifecycle.live` EN "Live process" → "Typical timeline", FR "Processus en direct" → "Calendrier type", ES "Proceso en vivo" → "Calendario típico".

*Verification:*
- `tsc -b`, eslint clean · `vitest` 218/218.
- Chromium `/` 1440/390: 0 errors, `h1` 1, no overflow.
- "live" words 6 → 3 at 1440 and 4 → 2 at 390. All remaining ones are on the command board, as directed.
- `git diff` confirms no line of `CommandBoard` or the bezel changed.

### M3 — Unverified security and compliance claims
*Closed by:* `lib/i18n.tsx` (EN, FR, ES together — M9) and `pages/Landing.tsx`. Every slot is kept, and now states what the product does:

| Slot | Was | Now |
|---|---|---|
| Trust strip, card 2 | "SOC 2 · Compliant Infrastructure · security + data residency" | "NDA · NDA-gated identity · codename and bands until an NDA is signed" |
| Trust strip, card 4 | "Every Action · Auditable · every action, every artifact" | "Your Actions · Recorded · your deal actions, listed in Deal Activity" |
| Data rooms body | "Secure, permissioned, and built for high-stakes transactions." | "Organised around the documents buyers ask for, with completeness tracked package by package." |
| Data rooms row | Permission controls · Full audit trails · Access logs | Document checklist by package · Completeness per package · Who can see uploads, stated |
| 6 data-room categories | "● Secured · Audit trail" | "Required for diligence" |
| Workflow step "Data Room" | "Secure diligence infrastructure built for M&A." | "The diligence document checklist, with completeness by package." |
| Governance "Buyer verification" | "Identity, track record and funds clear four gates before the data room." | "Record checks — Four checks on each NDA record. ExitOS does not verify identity, funds or track record." (Page 25) |
| Governance "Full audit trail" | "Every view, download and signature on the record — admissible process history." | "Recorded actions — The deal actions you take are recorded and listed in Deal Activity." (Page 28) |
| Governance "SOC 2 posture" | "Encrypted at rest and in transit; permissioned access; data residency respected." | "Nothing sent for you — Outreach and introductions are drafts for you to send. ExitOS does not contact buyers on your behalf." (Pages 30, 36) |
| Final CTA foot | "Strictly confidential. Anonymous until NDA. Every action audited." | "Anonymous until NDA. Your actions recorded. Nothing sent without you." |
| Footer badges | SOC 2 posture · Full audit trail · NDA-gated identity | Deterministic engines · Sourced market data · NDA-gated identity |

Kept: "Founder control — Eight approval gates" (Autonomous Exit's eight agent steps each wait for approval, Page 07); provenance "Auditable" (meaning every figure traces to a source); "One confidential process" and "List confidentially" (anonymous listings until NDA). "verified acquirer mandates" is M5. The command board is not touched.
*Verification:* `tsc -b`, eslint clean · `vitest` 218/218 (including `i18n.test.tsx`) · Chromium `/` in EN, FR and ES: 0 "SOC 2", 0 "secured / sécurisé / seguro", "audit" only in the provenance heading; "verif" only in the registry wording (M5), the confidence tier "Verified" (disclosed in a public filing) and the new "does not verify" line; 0 errors.

### M4 — Illustrative content shown as real
*Closed by:* `pages/Landing.tsx`:
- The negotiation desk's bar reads "Illustrative figures" (in `loi-300`, the existing caution amber) in place of a repeated "Cross-bid comparison". The table itself is unchanged.
- The marketplace grid has a mono line above it: "Example listings — illustrative, not companies on the market". Each card reads "Example listing · {region}" instead of "Anonymized listing". Codenames, bands, stages and "Request NDA" are kept.
- The signal tile "Market Heat" shows the registry-derived heat of the top sector (`SECTOR_DEMAND[0]`, today "Extreme · top sector: Enterprise SaaS") instead of the constant "High".

These strings sit beside the page's other hard-coded English data constants (the tables and cards were never in i18n), so they are English in all locales, like their neighbours. The command board is untouched.
*Verification:* `tsc -b`, eslint clean · Chromium `/` 1440/390: the three labels present; 0 errors, `h1` 1, no overflow.

### M5 — Overclaims in copy
*Closed by:*
- `pages/Landing.tsx`, losses matrix:
  - "AI valuation, comps and reservation lines up front" → "Deterministic valuation, comps and reservation lines up front".
  - "Offer optimisation captures the premium" → "Offers compared on structure and certainty, not headline alone".
- Provenance pipeline: "{n} verified acquirer mandates" → "curated".
- `lib/i18n.tsx` (EN/FR/ES, M9):
  - `ribbon.mandates` "Verified / vérifiés / verificados" → "Curated / sélectionnés / seleccionados".
  - `prov.body` "curated and verified" → "curated" (FR "sélectionnés", ES "se seleccionan").

**Not changed (owner decision):** the board's "Match Score" column stays, because the command board is kept as built. Also kept is the negotiation feature "Offer optimization — Maximise value and certainty", which describes the Bid Room's purpose rather than claiming a result.
*Verification:* `tsc -b`, eslint clean · `vitest` 218/218 · Chromium `/`: "AI" now appears only in sector names ("AI Infrastructure") and registry theses; "verified" only in the confidence tier ("Disclosed in a public filing") and the "does not verify" line, in all three locales; 0 errors.

### M6 — Broken link `/marketplace`
*Closed by:* `pages/Landing.tsx`. The "How the listing protocol works" link went to `/marketplace`, which is not a route, so the catch-all sent users back to `/`. It now uses a router `Link` to `/console/marketplace`. Signed-out users see the sign-in form at that address and land on the marketplace after signing in.
*Verification:* `tsc -b`, eslint clean · Chromium: click while signed out → `/console/marketplace` with the sign-in form; sign in as a founder → stays on `/console/marketplace`, `h1` "Exit Marketplace".

### M7 — Accessibility
*Closed by:* `pages/Landing.tsx` and `components/MarketingChrome.tsx`. The `main` landmark was already added in M1. Changes:
- **Contrast.** Secondary text on the page ground `#f6f8fb` measured 4.47:1 with `slate-500`. It now uses `slate-600`, one step in the same palette: 31 places in the page component and 5 in the chrome, plus the inactive locale buttons.
- **Confidence-tier chips** use darker steps of their own hues: Verified `#059669` → `#047857`, Reported `#2563eb` → `#1d4ed8`, Estimated `#d97706` → `#92400e`. They were 3.22, 4.35 and 2.76:1 on their tints.
- **Cross-bid table.** The empty first header is now a visually hidden "Measure" with `scope="col"` on all headers.
- **Comparison matrix.** It scrolls sideways on phones, so it is now a labelled, focusable region ("Traditional sale compared with ExitOS") with a focus ring.
- **World map** wrapped `aria-hidden` (decorative).
- **Board marker.** The board wrapper got `data-board="command"`, a non-visual attribute used to scope the checks. The board itself is unchanged.

**Not done (owner decision).** The command board's own contrast (6 labels in `white/40–45`) and its drill-down overlay are left as built. axe reports them only inside the board.
*Verification:* `tsc -b`, eslint clean · `vitest` 218/218.
- axe on `/` excluding the board, 1440 and 390: **0 violations** (was contrast ×33, empty-table-header, scrollable-region). Inside the board: contrast ×6, unchanged.
- Keyboard: 112 tab stops outside the board, all with a visible focus indicator.
- `/modules` axe 0 at both widths (shared-chrome contrast fixed). `/platform` contrast 14 → 6 and `/pricing` 27 → 19; both are their own content, for the later phase.

### M8 — Motion and reduced motion
*Closed by:* `pages/Landing.tsx`. A small `useReducedMotion` hook (`matchMedia("(prefers-reduced-motion: reduce)")`, updates if the setting changes) stops the world map's eight travelling SVG pulses (`animateMotion`) when the visitor has reduced motion on. The arcs and hubs stay. M2 already removed the other motion outside the board (the lifecycle ping and travelling dot). The `exTravel` keyframe is left in the shared style block but is now unused.

**Not done (owner decision).** The command board's own motion (ticker, scan sweep, pulses, oscillating figures, clock) is kept as built, including when reduced motion is on.
*Verification:* `tsc -b`, eslint clean · Chromium `/`:
- No preference: CSS animations outside the board 0, inside 6; SMIL map pulses 8.
- **Reduced motion: outside the board 0 and 0**; inside the board 6 (as built).
- Before this work (baseline), reduced motion still ran 10 animations at 1440.

### R1 — The three pages on the skeleton
*Closed by:*
- `components/MarketingChrome.tsx`: shared `MK` classes (wrap, section, `h1`/`h2` scale, square button, navy) and `PageHero`, which has the "01 / …" chapter, the editorial `h1` (accent on the last line or word), the "01—" deck and the actions.
- `pages/Platform.tsx`: hero; "02 / Infrastructure" with the 4 pillars as a hairline grid; "03 / End to end" with the 6-step flow on the navy band; "04 / The next move" CTA.
- `pages/Modules.tsx`: hero; "02 / Founder side" with 9 modules in a hairline 3-column grid, each stat as a mono line; "03 / Buyer side" with 4 modules on navy, plus the two buttons.
- `pages/Pricing.tsx`: hero; "02 / How ExitOS gets paid" (5 steps); "03 / The mandate ladder" with the 4 tier panels in a hairline grid (the highlighted tier keeps a blue top rule and badge) and the success-fee note; "04 / Traditional banker vs ExitOS" as a hairline table with row headers; "05 / The other side of the exchange" with 3 buyer tiers; "06 / The next move".

Every text, price, `MODULE_FACTS`/`ENGINE_COUNTS` stat and link target was carried over verbatim (R2–R4 correct content). Colours are the locked palette only.
*Verification:* `tsc -b`, eslint clean · `vitest` 218/218 · Chromium 1440/390, all three pages: 0 errors, `h1` 1, no overflow.
- axe: Platform 6 → **0**, Modules **0**, Pricing 19 → 17 (tier labels in `slate-400`, plus the table's sideways scroll on phones — R5).
- Height: Platform 2,154 → 2,559 px, Modules 2,118 → 2,374 px, Pricing 4,028 → 4,759 px at 1440; at 390 roughly unchanged.
- Screens: `scratchpad/home/r1p-*`, `r1pl-*`.

### R2 — Platform overclaims
*Closed by:* `pages/Platform.tsx` (text only):
- Pillar "one **live** exchange" → "one exchange".
- "Autonomous execution — Agents run … You approve; the desk does the work." → "Agents walk through sourcing, outreach, data room, negotiation and closing. Each step waits for your approval, and nothing is sent for you." (Pages 07, 36)
- "Institutional security — Permissioned data rooms, full audit trails and access logs. Every action and artifact is accountable." → "**Data rooms and records** — A document checklist with completeness per package, NDA-gated identity, and your deal actions recorded." (Pages 14, 28; X12)
- Flow "the **live** deal room" → "the deal room".
- Hero "one **audit trail**" → "one record".
- CTA "**watch** the agents work" → "walk through the agents".

No page section was removed.
*Verification:* `tsc -b`, eslint clean · Chromium `/platform`: 0 "live", "audit", "permission", "watch" or "security"; 1440/390: 0 errors, `h1` 1, no overflow.

### R3 — Modules overclaims
*Closed by:* `pages/Modules.tsx` (card text only; names, icons and `MODULE_FACTS` stats unchanged):
- Valuation "recomputed **live**" → "recomputed from your figures".
- Outreach "**run by the banker agent**" → "drafted by the banker for you to send" (Page 36).
- Data Room "**Permissioned**, completeness-scored …" → "A document checklist, completeness-scored …" (X12).
- Closing Center "Signatures, escrow and filings **tracked to the wire**" → "The closing checklist: signatures, escrow and filings, item by item." (Page 32).
- Acquisition Radar "**Live** sector signals" → "Sector signals from the registry".
- Deal Room "Gated diligence access **once trust and NDA clear**" → "Diligence access for companies that accept your NDA request." (Pages 12, 25).

Kept: "Access Requests — Request NDA-gated identity and packages, tracked end to end" (the buyer's own requests and statuses, Page 25).
*Verification:* `tsc -b`, eslint clean · Chromium `/modules`: 0 "live", "permissioned", "run by", "wire"; "gated" only in "NDA-gated identity" (Access Requests and the footer badge); 1440/390: 0 errors, `h1` 1, no overflow.

### R4 — Pricing aligned with Upgrade; fixed teaser number
*Closed by:* `pages/Pricing.tsx` (text only; prices, tiers, fee terms and every button target unchanged):
- **`h1`.** "Priced like a bank. **Paid when you close.**" → "Priced like a bank. Success fee only when you close." The $995 a month is paid regardless; only the 2.5% fee is on close (as Upgrade, Page 41 G2).
- **Listed Founder.** "… acquisition signals & **mandate alerts**" → "Receive buyer interest & acquisition signals in your Inbox". Teaser "**4 buyers** are a strong acquisition match for your company." (a fixed number) → "Buyers that match your company are shown once you list."
- **Active Mandate.**
  - Badge "Most selected" → "Active Mandate". The highlight now reads "Recommended for a live process", as on Upgrade.
  - Features: "Buyer outreach & NDA **automation**" → "Buyer outreach drafts & NDA requests"; "**AI** negotiation, bid management & process management" → "Rule-based negotiation (Bid Room), bid & process management"; "Closing Center — cap-table-aware **net-to-founder math**" → "Closing Center checklist".
- **Buyer Premium highlight.** The highlight label is now per tier (`highlightLabel`, additive). Buyer Premium reads "Active acquirer tier", taken from its own headline, instead of the unverified popularity claim "Most selected".
- **Comparison table.** "NDA Automation — Automated" → "NDA Requests — Request & register in one place"; "Negotiation Engine — **AI** scoring & counters" → "Rule-based scoring & counters"; "**Real-Time** Buyer Signals — **Live** radar" → "Buyer Signals — Registry radar (snapshot)".
- **Intro.** "an execution desk that **runs around the clock**" → "an execution desk".

**Not changed (open decision).** The buyer tiers ($299 and $2,499 a month) and their offers, which contradict Upgrade's "Buyer pricing is not published yet".
*Verification:* `tsc -b`, eslint clean · `vitest` 218/218 · Chromium `/pricing`: 0 "Most selected", "AI", "automation", "net-to-founder", "around the clock" or "4 buyers"; "live" only in "a live process" (a real sale process, the term Upgrade uses); 1440/390: 0 errors, `h1` 1, no overflow.

### R5 — Contrast on the marketing routes
*Closed by:*
- `pages/Pricing.tsx`:
  - Shade steps within the palette: the neutral tier badge and accent, the tier "purpose" line, the restrictions list and secondary text go from `slate-400/500` to `slate-600`; the teaser subline from `blue-600/80` to `blue-700`; the buyer chapter label from `amber-600` to `amber-700`.
  - The comparison table scrolls sideways on phones, so it is now a labelled, focusable region with a focus ring.
- `pages/Platform.tsx`, `pages/Modules.tsx`: secondary text `slate-500` → `slate-600`, as on the homepage (M7).

*Verification:* `tsc -b`, eslint clean · Chromium 1440/390:
- **axe 0** on `/platform`, `/modules` and `/pricing` (Pricing was 17, plus the scrollable region at 390).
- 0 errors, `h1` 1, no overflow.
- Keyboard: 156–157 tab stops per page, all with a visible focus indicator.

---

## Owner decisions
- **The hero command board stays exactly as built** (owner, 2026-10-12, during M2: "use the same live screen which is built as a real screen. dont change it"). The board and its bezel — "Live Market", "System Status · Live", "Live Transactions", the session clock, the moving scores and heat bars, the scan sweep and the ticker — are left unchanged by M2–M8. The data it shows is the registry snapshot and the disclosed-deal history (real records); the "live" styling is the owner's choice and is listed here so it is not mistaken for an oversight.

## Open decisions for the owner
- **Buyer pricing.** Pricing publishes Buyer Access $299/month and Premium $2,499/month; Upgrade says "Buyer pricing is not published yet" (Page 41 G3), and `access.ts` has no buyer plan. Which is right?
- **Security and compliance claims** (M3): restore any of SOC 2, audit trail, access logs, encryption or buyer verification only with evidence (a report, a log, a check in the code).

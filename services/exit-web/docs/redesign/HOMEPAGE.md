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
| M10 | **The command board was not kept as built** (owner, 2026-10-12: "i told you to use my same board without changing anything. that board is more advanced than what you design"). M1 kept `CommandBoard` itself, but it dropped the board's presentation: the 3D wall mount (`ex-bezel`, rotateY −11°/rotateX 2.5° at lg+), the rounded bezel (`rounded-[20px]`, ribbon `rounded-md`), the polished-floor reflection (`ex-reflection`), the `perspective: 2000px` stage and `lg:translate-x-16 lg:-translate-y-6` offset, the larger board column (`0.9fr / 1.3fr`), and the trading-hall environment (full-strength photo, ceiling light grid, glass-wall mullions, floor heat field, the white wash, the floor sheen and the ambient light under the board). | Restore the original hero environment and the mounted display **verbatim** from `20545a37` (bezel, ribbon, `CommandBoard`, reflection, perspective, offsets, column ratio, every hall layer). Only the headline column keeps the skeleton treatment (editorial `h1`, "01—" deck, square buttons), sized to fit the original narrower column. | ☑ `b8c60e11` |

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


## Phase 3 — Iconic upgrades (proposal, awaiting the owner's choice)
Owner direction, 2026-10-12: "propose further iconic upgrade of the homepage", then "write". Nothing below is built yet. The same rules apply as before:
- colours locked;
- the command board and its trading-hall setting untouched (M10);
- every existing block kept;
- only real or clearly labelled data;
- reduced motion respected;
- EN/FR/ES for any i18n copy;
- each item documented, then closed in its own commit.

### U1 — "Value your company in 30 seconds" (recommended)
- **What.** A strip directly under the hero. Three inputs: sector (the 12 `SECTORS`), trailing revenue ($M) and annual growth (%). Pressing **Value** shows a low–mid–high range in the editorial serif, labelled **Model estimate**. One line states the assumption: "Other inputs use typical values (gross margin 72%, EBITDA margin 10%, net retention 115% …) — refine them in Value My Company." Buttons: **Refine in Value My Company →** and **Access the Exchange**.
- **Engine.** `buildProfile({ ...DEFAULT_INTAKE, sector, ttmRevenueUsd, arrUsd, growthPct })` → `runInstitutionalValuation(profile).headline`. This is the D1 institutional value the whole console uses; no new formula.
- **Hand-off.** The three figures travel in the URL (`/console/intake?sector=…&revenue=…&growth=…`). Value My Company pre-fills them but **does not save** until the founder edits or confirms, keeping the Page 03 G1 rule: "Your intake" always means the founder's own data. Nothing is stored from the homepage.
- **Input rules.** `parseNumber` validation (revenue $0.1M–$5,000M, growth −50%–300%), with errors announced. The result sits in an `aria-live="polite"` region.
- **Weight.** The valuation engine is loaded with a dynamic `import()` on first focus, so the first paint does not grow. Bundle size before and after will be reported.
- **Files.** `pages/Landing.tsx` (new section), `pages/Intake.tsx` (read the query, pre-fill without saving), `lib/i18n.tsx` (new keys in EN/FR/ES); tests for the URL parsing and the no-save rule.
- **Verify.** Engine parity: the homepage mid for the demo inputs equals the console's figure. Intake not saved after the hand-off until an edit. axe 0 and keyboard; 1440/390.

### U2 — The broadsheet ledger (recommended)
- **What.** Chapter 06 (transaction record) becomes a financial-newspaper page:
  - a masthead row ("The ExitOS Ledger · Disclosed acquisitions · as of {index date}");
  - the three lead deals as front-page stories, with a large serif figure, acquirer, target, sector, premium versus reference, status and year;
  - beneath them, a ruled table of the next deals in the history (date, target, acquirer, sector, disclosed value, status, source).
- **Data.** `DISCLOSED_TRANSACTIONS` and the history snapshot already used. Each row names its source (EDGAR / Wikidata / press), as recorded.
- **Kept.** The sources line and the bridge CTA "Run the valuation".
- **Files.** `pages/Landing.tsx`; `lib/market-stats.ts` gains an additive export for more rows (and the source per row).
- **Verify.** Every value matches the snapshot. Table semantics (`th scope`), a scroll region on phones, axe 0.

### U3 — One giant-number statement
- **What.** A full-width moment between the hero and the lifecycle band: **6,311** (the `MARKET_INDEX_FMT.events` figure, not typed) in very large editorial numerals. Under it: "disclosed acquisitions indexed — Wikipedia · Wikidata · SEC EDGAR, as of {date}".
- **Kept.** The proof ribbon stays as is.
- **Files.** `pages/Landing.tsx`; label strings in i18n.

### U4 — Numbered source notes (recommended)
- **What.** Each figure on the page outside the board gets a small superscript (¹ ² ³ …) linking to a **Sources & method** list above the footer. The list covers: the market index (counts, date); the buyer registry (curated mandates, date); the disclosed-deal history (EDGAR / Wikidata / press); medians (method, sample size); and the valuation engine (deterministic, framework version).
- **Accessibility.** Each note is a real link with an accessible name ("Source 3"), and each source has a back-link.
- **Files.** `pages/Landing.tsx`, a small `SourceNote` component, i18n keys.

### U5 — "I'm selling / I'm buying" entrances
- **What.** Two large panels after the thesis. **Selling**: value, prepare, list, with a button to founder sign-in. **Buying**: browse, request an NDA, deal room, with a button to buyer sign-in. These mirror the console's Start-here guide (O1).
- **Change outside the homepage.** `pages/SignIn.tsx` reads `?role=buyer` to pre-select the Buyer tab. Only the initial selection changes; there is no change to auth or access.
- **Files.** `pages/Landing.tsx`, `pages/SignIn.tsx`, i18n.

### U6 — Lifecycle band that follows the scroll
- **What.** In a tall wrapper, the eight-stage band stays pinned while the visitor scrolls. The stage for the current position is highlighted, with one line on what happens and the ExitOS page that handles it (a link: Value My Company, Find Buyers, Manage NDAs, Generate Documents, Compare Offers, Prepare for Diligence, Close the Deal).
- **Reduced motion and phones.** With reduced motion on, or below 1024 px, the static band shows instead.
- **Files.** `pages/Landing.tsx`.

### U7 — Polish and speed
- **What.**
  - A drop cap and small capitals in the thesis; tabular figures in all tables.
  - The hall photo `command-center.png` (1.5 MB) re-encoded as WebP/AVIF of the same image, served with `<picture>` and a PNG fallback. The picture is identical, so the board's environment is unchanged (M10).
  - On phones, secondary chapters (provenance detail, data-room categories, governance) collapse into labelled disclosures, aiming at about 9,000 px instead of about 17,300 px.
- **Files.** `pages/Landing.tsx`, `public/`, `index.html` (preload path).
- **Verify.** The first-screen image weight before and after; LCP measured locally (Chromium, throttled); page height at 390.

### Proposed order
U1 + U2 + U4 first: a live product moment, a signature look and visible proof, with no new data. Then U3, U5, U7, U6.

### Gap register — Phase 3 (owner, 2026-10-12: "yes build" for U1, U2, U4)
| # | Upgrade | Status |
|---|---|---|
| U1 | Value your company in 30 seconds | ☑ `7e3680d0` |
| U2 | The broadsheet ledger | ☑ `8b02e07a` |
| U4 | Numbered source notes | ☑ `c5460e24` |



## Phase 4 — From well made to iconic (proposal, awaiting approval)
Owner direction, 2026-10-12:
- Asked "Do you think what you have produced is iconic and premium?"
- Answered "yes" to writing this phase up and to moving sections between pages counting as **repositioning** (features kept, not replaced).

The same locks apply: colours, the command board and its trading hall (M10), real or labelled data only, reduced motion, EN/FR/ES, and one documented commit per gap.

### Honest assessment (why this phase)
- **Length.** The homepage is 11,434 px at 1440 and 20,163 px at 390: 12 chapters plus the valuation strip, the ledger and the sources. It reads as "everything we have".
- **Two visual languages in the hero.** The editorial serif headline sits beside a glowing live-style dashboard.
- **Repetitive rhythm.** The same label → serif `h2` → hairline grid pattern appears about twelve times.
- **Too many typefaces.** Four families (Sora, Source Serif 4, Inter, mono) and many small all-caps labels.
- **Feature grids remain feature grids.**
- **Already distinctive:** the ledger (U2), the source notes (U4) and the working valuation (U1).

### Target homepage — six moments
1. **Hero.** The editorial headline and **the command board, unchanged**, then the proof ribbon.
2. **Value your company** (U1).
3. **The thesis.** One very large statement ("Why founders lose millions on exit.") with a drop-cap paragraph (the real medians) and the Traditional vs ExitOS matrix set as a broadsheet table.
4. **The ExitOS Ledger** (U2), the centrepiece, with the **confidence register** beside it as a newspaper sidebar ("How to read this record").
5. **How a sale runs.** The eight lifecycle stages on a full-bleed navy band, as large numerals with their typical weeks. This is the page's one dark moment.
6. **The next move.** The final call to action set as the broadsheet's back page.

After these: **Sources & method** (U4), then the footer.

### Where every other block goes (repositioned, not removed)
| Block (current chapter) | New home | Placed as |
|---|---|---|
| Trust strip (hero) | Platform | under the Platform hero |
| Workflow — 6 steps + Founder → Exit flow (03) | Platform | "From analysis to payout", beside the existing End-to-end flow |
| Market structure — 5 counterparties (03) | Platform | "Who trades on the exchange" |
| Data provenance — pipeline + 6 signal tiles (05) | Platform | "Sourced. Referenced. Auditable." (the confidence register stays on the homepage with the ledger) |
| Data rooms — copy, checklist row, vault, 6 categories (08) | Platform | the Infrastructure chapter |
| Governance & controls — 5 items (11) | Platform | before its final call to action |
| Coverage — map, jurisdictions, stats (10) | Platform | "Global reach" (map pulses keep M8) |
| Buyer intelligence — 5 registry cards (04) | Modules | Buyer side, after the module grid |
| Negotiation desk — illustrative cross-bid table + 3 features (07) | Modules | Founder side, beside the Negotiator module ("Illustrative figures" kept) |
| Marketplace — 4 example listings (09) | Modules | Buyer side, after the buyer cards ("Example listings" kept) |

Every moved figure keeps its source note. Platform and Modules get the **Sources & method** section for the notes they carry. Texts, i18n keys, links and labels move unchanged.

### Gap register — Phase 4
| # | Gap | Fix | Status |
|---|---|---|---|
| V1 | **Homepage too long; blocks belong elsewhere.** | Move the ten blocks above to Platform and Modules (content verbatim, source notes and "Sources & method" on those pages). Homepage keeps the six moments. Targets: homepage ≤ 6,500 px at 1440 and ≤ 11,000 px at 390. | ☑ `c9ebb10d` |
| V2 | **No signature language.** | Carry the ledger's broadsheet treatment (double rule, masthead-style chapter heads, column rules, drop cap) through the thesis and the final call to action, so the homepage reads as one publication. | ☑ `bed9a324` (with V3) |
| V3 | **Repetitive rhythm.** | Contrast of scale and ground: hero (photo + board) → compact valuation strip (white) → one giant statement on the page ground → dense ledger (white) → full-bleed navy lifecycle with large numerals → back-page call to action. No two consecutive moments share a layout. | ☑ `bed9a324` |
| V4 | **Four typefaces, label noise.** | Marketing pages use Source Serif 4 (expressive), Inter (body) and mono (figures only). Sora (`font-serif`) is removed from marketing pages; the console is unchanged. Small all-caps labels are reduced to one chapter label per moment. | ☑ `b000994b` |
| V5 | **Hero competes with the board.** | Quieter headline column: the duplicated topline removed (the eyebrow is already in the header), the deck shortened to `hero.sub` with `hero.body` below it. **The board, its bezel, its hall and its size are untouched** (M10). | ☑ `aa64ea63` |
| V6 | **Proof that nothing was lost.** | An inventory check (script plus a unit test over a block list) asserting that each of the 17 original blocks and U1, U2 and U4 renders on exactly one marketing page, every source note has a target, and all routes and entry points still resolve. Before/after heights, axe and keyboard on all four routes at 1440 and 390. | ☑ `2e4b0964` |

### Order
V1 (move) → V5 (hero) → V3 + V2 (homepage rhythm and broadsheet) → V4 (typography across the four pages) → V6 (inventory and review package).


## Phase 5 — Hero concepts (owner's choice pending)
Owner, 2026-10-12: "maintain the design of the dashboard … produce 4 hero of iconic premium design that uses this dashboard … screenshot the hero designs for me to choose".
A **development-only** page, `/hero-lab?v=1…4` (`pages/HeroLab.tsx`), renders four heroes. The route exists only when `import.meta.env.DEV` is true, so it is not in production builds. Each hero uses the homepage's own `CommandBoard` (now exported from `Landing.tsx`; nothing else in it changed) inside the same bezel and ribbon markup. Only the staging differs:
1. **The Trading Hall** — the current concept, refined: hall photograph, headline left, the 3D-mounted board right, proof figures under a rule.
2. **Night Exchange** — navy ground with the faint exchange grid and a blue glow; centred editorial headline; the board centre stage, flat and large, as the lit instrument; proof figures in large serif numerals.
3. **Front Page** — the broadsheet: masthead "The ExitOS Ledger · Registry edition", a giant headline across the page, a drop-cap column with the proof figures as a ruled list and both buttons, and the board as the front-page plate with "Fig. 1" caption and snapshot date.
4. **The Monolith** — a split page: white editorial column left, navy panel right (hall photo faint in it), the 3D board crossing the divide, proof figures as a 2 × 2 ruled grid.

The live homepage is unchanged until the owner chooses. Screens: `scratchpad/heroes/hero-{1..4}-{1440,390}.jpg`; all eight render with 0 errors and no overflow.


## Phase 6 — The big screen itself (owner's choice pending)
Owner, 2026-10-12: "when I talk of the dashboard I mean the big screen that is real. I want it iconic … no design and architecture implementation in it". Then: "take 1, 2 and 3 and build three different formats for me to choose". Three formats were added to the dev-only hero lab:
- **A — `/hero-lab?v=5`: the redesigned screen** (`components/ExchangeWall.tsx`) in the current trading-hall setting.
  - It keeps the board's data and behaviour: sector drill-down across buyers and deals, the deal detail (now a labelled dialog that closes with Escape), the ticker, the clock, the heartbeat and the spotlight row.
  - It restructures the screen into: a header strip; an **aggregate-capacity index** with four supporting figures; ranked strategic buyers; a **departures-style deal board** (date, target, acquirer, value, status lamp); **rising demand columns** that act as the sector switch; and the ticker.
- **B — `/hero-lab?v=6`: the current screen** (exchange ribbon + `CommandBoard`, unchanged) installed in a **coded trading hall** (`components/TradingHall.tsx`): back-wall stone seams, a ceiling light grid in perspective, two fluted pilasters with lit capitals and bases, a light cove, the screen in a wall frame on a plinth, and a polished perspective floor that **reflects the live screen** (CSS `box-reflect`; browsers without it show only the floor glow).
- **C — `/hero-lab?v=7`: both** — the redesigned screen inside the trading hall.

**Owner's choice (2026-10-12): Format B** — shared as a screenshot of `/hero-lab?v=6` with "this seems better".

| # | Gap | Fix | Status |
|---|---|---|---|
| W1 | **Put Format B on the live homepage.** | Replace the homepage hero's staging (hall photograph, 3D `ex-bezel` mount, floor reflection) with `TradingHall`. The headline (eyebrow, `h1`, `hero.sub` **and `hero.body`**, both buttons) sits in the hall; the screen — the exchange ribbon and `CommandBoard`, **content unchanged** — is set into the wall frame; the proof figures (with their source notes 1–3) stand on the floor. Every other homepage moment, link and i18n key is unchanged. The hall photograph is no longer used on the homepage, so its `<link rel="preload">` in `index.html` goes too (the file stays in `public/`). | ☑ `e24396ea` |

The headline and proof figures sit in the hall for B and C. `ExchangeWall` and `TradingHall` are imported only by the dev-only lab, so production is unchanged. Screens: `scratchpad/heroes/hero-{5,6,7}-{1440,390}.jpg`; all render with 0 errors and no overflow.


### W2 — Premium finish for the hall (owner, 2026-10-12: "can you make it iconic and increase its premiumization?")
| # | Gap | Fix (the screen's content stays unchanged; locked palette) | Status |
|---|---|---|---|
| W2 | **The hall reads as a stage set, not a grand space.** | `components/TradingHall.tsx` and the hero headline: - **coffered ceiling** in perspective, replacing the light lines;; **full-height pilasters** with lit capitals, rising into the ceiling;; the screen set in a **recessed stepped portal** (two frames and an inner shadow);; **volumetric light** falling from the cove onto the screen, and a faint **glass sheen** over the screen (decorative, `pointer-events: none`, above the content, not changing it);; **stone floor** seams and a vignette;; a slow **entrance** (the screen rises and fades in once, motion-safe only);; an editorial **rule before the eyebrow**. Verify: board markup identical, axe outside the screen 0, reduced motion = no entrance animation, 1440/390 screens. | ☑ `8135d22f` |


### Phase 7 — A calm hero, the hall in the body (awaiting the owner's confirmation)
Owner, 2026-10-12: asked whether the hall should move into the body with a different hero; then "go on and send me screenshot to confirm". (A reference image was mentioned but none arrived, so the options follow the brief: one statement, calm, iconic, locked colours.) Two dev-only options in the hero lab, each followed by the hall as a body section ("The exchange — The whole market, in one room."; the screen unchanged):
- **`/hero-lab?v=8` — The Mark.** On the page ground: a monumental editorial headline, a rule, `hero.sub` and both buttons, and the ExitOS mark drawn as fine line art on the right (ring, inner ring, registry ticks, emerald core; it turns slowly, motion-safe). The proof figures run along the bottom.
- **`/hero-lab?v=9` — The Horizon.** Navy: a centred headline with ruled eyebrow, `hero.sub`, both buttons and the proof figures, with the hall's light cove glowing on the horizon at the bottom, leading the eye down into the hall.

Nothing changes on the live homepage until the owner confirms. Screens: `scratchpad/heroes/hero-{8,9}-{fold,hall}-{1440,390}.jpg`.

**Owner's choice (2026-10-12): Option 9** ("ok 9").

| # | Gap | Fix | Status |
|---|---|---|---|
| X1 | **Put Option 9 on the live homepage.** | The hero becomes **The Horizon**: navy, centred editorial `h1`, ruled eyebrow, `hero.sub`, `hero.body` (kept so no content is lost), both buttons, the proof figures with source notes 1–3, and the light cove glowing on the horizon. Directly below it, the **trading hall** becomes its own section, with the label "The exchange" and the `h2` "The whole market, in one room." — new i18n keys `hall.eyebrow`, `hall.h2`, `hall.h2em` in EN/FR/ES. The screen (ribbon + `CommandBoard`) is unchanged. Every other moment keeps its order after the hall. | ☑ `58b332ae` |

---

## Phase 8 — The exchange map (owner's reference, awaiting judgement)

The owner supplied a reference: a dark exchange map with low-poly continents, a route joining process stages, a dashed survey grid, a corner tag ("Exchange map / 001") and a numbered footer ("01 / Discover the field · 02 / Trace the path"). Lab variant 10 (`/hero-lab?v=10`, dev only) translates it into the locked palette: `components/ExchangeMap.tsx`.

- Kept from the reference: the map format, low-poly land (the coverage map's own `LANDMASS` outlines, now exported), ringed stage nodes on one route, dotted cross-links, the survey grid, the corner tag, the footer labels, the accent bar.
- Changed: the red route becomes the locked blue light, turning emerald at Closing; the reference's invented stage names become the eight lifecycle stages and typical weeks already on the homepage (`lc.*`), labelled "Illustrative process topology". No figures are added.
- The live exchange screen is unchanged and sits directly below as "02 / Trace the path", in a flat framed portal.
- On a phone the map labels are too small to read, so the stages are repeated as a two-column list under the map; the corner tag is hidden.
- If approved, this map replaces the trading-hall setting of the exchange section on the homepage. The board markup stays identical either way.

### Y1 — Map and hall in one hero (owner: "both should be included in the hero")

| Gap | Close by | Status |
|---|---|---|
| Y1: the hero and the exchange are separate moments; the owner wants the exchange map and the trading hall both in the hero | One continuous hero: statement and calls to action (left/right split), the exchange map full width beneath ("01 / Discover the field"), its footer ("02 / Trace the path") leading straight into the hall with the board unchanged. Map strings move to i18n (EN/FR/ES). Board markup identical. | closed 4656593d |

### Z1 — The deal-atlas hero and first section (owner's `index(8).html`)

| Gap | Close by | Status |
|---|---|---|
| Z1: the owner wants the hero and first section of `public/index(8).html` ("The deal atlas") on the homepage, with the hall and the other sections placed in the body | Hero rebuilt on the reference's layout in the locked palette (red → blue-700/blue-600, paper → #f6f8fb/white, charcoal → navy): meta row, a split with the large two-face headline and a blue-ruled side column, the exchange map inside the page width, and a four-cell statement row that also carries the four proof figures and their notes. New section "02 / What the exchange connects" with four numbered rows to Modules. The hall with the unchanged board moves to 03; the later sections are renumbered 04–07. Our headline, copy, buttons and figures are kept; the reference's own copy is used only for the new labels and rows, with "Secure deal rooms" and "traceable" softened to match the removed security claims (M3). EN/FR/ES. || closed 49ee5ecd |

### Z2 — Z1 brought to the homepage spec (owner: "it is good. but redesign to match your spec")

| Gap | Close by | Status |
|---|---|---|
| Z2: Z1 copied the reference's own type system and broke the homepage spec: sans `h1`/`h2`/`h3` (spec: editorial serif, last line in the italic accent — M1, R1); about ten new small all-caps labels (V4: one chapter label per moment); hand-made section labels instead of `Chapter`; no broadsheet double rule (V2); blue-700 accent and new button hovers instead of the spec's blue-600 and button pair; figures in Inter (V4: mono for figures) | Headlines in Source Serif 4 semibold with the accent italic; `Chapter` for 02 and 03 (the hall's head too); the double rule opening section 02; the ticker keeps its numbers and statements but drops the four caps sub-labels; "The deal atlas" eyebrow removed (the topline already names the exchange); the connected-view line set in body type; figures in mono; buttons and accent as the rest of the page. Layout, content, links and the board unchanged. || closed 4b1c1ac6 |

### Z3 — Reference copy out, our homepage data in (owner: "remove what you can remove and employ our homepage data design and from our site")

| Gap | Close by | Status |
|---|---|---|
| Z3: the hero and section 02 still carried the reference's own copy (four ticker statements, the "connected view" line, "What the exchange connects" with its four invented rows) instead of ExitOS data | Removed all of it (keys `tk.*`, `cap.*`, `hero.index` deleted). The four-cell row shows the four proof figures in the homepage's numeral design (serif figure, label, source note). Section 02 becomes "The modules", built from the site's own catalogue (`lib/module-list.ts`, now shared with Modules): Acquisition Radar, Valuation Engine, Buyer Intelligence, Data Room, each with its Modules description and live `MODULE_FACTS` stat. Kept from the reference: the layout only. Note: the Modules copy is English-only on the Modules page as well, so section 02 is English in FR/ES. || closed 4b1c1ac6 |

## Phase 9 — Critique of the Z3 homepage, and its fixes (owner: "fix all and all criticism and cover the gaps")

Self-critique of the homepage after Z3 (1440 px: 8,839 px tall; 390 px: 12,560 px), then one gap per finding.

| # | Finding | Close by | Status |
|---|---|---|---|
| AA1 | The lifecycle is told twice: the hero map shows the eight stages with typical weeks, and section 06 repeats them as a navy grid. | The map becomes the lifecycle: its caption carries "The acquisition lifecycle · signal → closing" and the "Typical timeline" source note (6). Section 06 is removed. | closed `b96e08a9` |
| AA2 | The map implies a geography that does not exist (Signal in North America, Closing in Australia). Real regions are not available: the registry's `country` field is empty for 3,263 of 6,311 events and mixes formats, and the file (3.4 MB) is too large for the client. | Continents removed. The horizontal position becomes time: each stage sits at its typical week (square-root scale so the first weeks do not collide), in order from left to right; the vertical lanes only separate labels. | closed `01ce06c1` |
| AA3 | Three numbering systems: "No. 01" in the topline, "01 / Discover the field · 02 / Trace the path" and "/ 001" on the map, and chapters 02–07. "02 / Trace the path" and "02 / The modules" sit on one screen. | Only chapter numbers remain: "No. 01", the map's 01/02 labels and "/ 001" are removed. | closed `ce7b3cc3` |
| AA4 | The board — the real product — starts two screens down, behind an illustrative diagram and a module list. | New order: 01 hero · 02 the exchange (hall + board) · 03 value your company · 04 thesis · 05 ledger · 06 the modules · 07 back page. | closed `73cf8748` |
| AA5 | Section 02's headline is the Modules page's title, word for word. The modules shown repeat figures shown elsewhere (31 mandates, $72.5B, 61 deals). Its copy is English-only in FR/ES. | Own headline ("The desk behind the screen."), four founder modules whose stats appear nowhere else on the page (Exit Readiness, Valuation Engine, Documents, Data Room), descriptions and stats in EN/FR/ES with the numbers taken from the engines. | closed `bdb7d201` |
| AA6 | Figures repeat: 21 mandates deploying (hero + board ribbon), 31 mandates and 21 jurisdictions (hero, thesis table, board), 61 recorded deals (three times in the ledger), 6,311 events (hero + ledger footnote). | Each figure once outside the board: the hero keeps three figures (6,311 · 31 · $379.1B); the ledger keeps its masthead count and drops the two repeats; the thesis table states the run without repeating the registry counts. The sources list keeps its method figures (it is the reference). | closed `bc252d9d` |
| AA7 | "What is your company worth?" reads as an afterthought: a thin row between the hall and the thesis, and a third "Access the Exchange" button. | A full chapter (03) right after the board: chapter label, large editorial headline, the form at full width with larger fields, the result as the section's centrepiece; the duplicate "Access the Exchange" button removed (Refine remains). | closed `d3a1247d` |
| AA8 | Three navy blocks compete (map, hall, lifecycle band), two nearly back to back. | AA1 removes the band; the map is set on paper (light ground, ink lines, blue route) like a printed chart, so the hall is the page's one dark moment. Palette unchanged (interchanged only). | closed `432bda73` |
| AA9 | The ledger heading reads as centred: it sits in the right-hand column of a two-column grid while every other heading is flush left. | Chapter label above a flush-left headline, as in every other chapter. | closed `62c60936` |
| AA10 | The "Sources & method" list is long for a homepage. | Collapsed by default under its heading; it opens automatically when a source note is followed, so every note still lands on its entry. | closed `94080f60` |

## Phase 10 — Designs 10–17, adopted (owner: "15 is good … yes", 2026-10-12)

Built and judged as previews (designs 10–17), then adopted onto this branch one gap per commit. Board markup identical to the original throughout; every gap verified with tsc, eslint, vitest, build, axe at 1440/390, the keyboard sweep and the reduced-motion check.

| # | Gap | Close by | Status |
|---|---|---|---|
| BB1 | The light hero lacks the opening drama of design 6; the hall's pilasters read as glowing plastic, stand apart from the screen, and the ceiling shows stray diagonals. | Dark navy hero (same content, figures and fixes as design 9; the lifecycle chart in light lines on navy). Pilasters slimmed to matte stone hugging the portal, architrave between them only, quieter ceiling. | closed `8504d48b` |
| BB2 | Owner: "the wall looks unreal … more natural like it is in a house". | A boardroom wall: navy-stained oak slats with grain, recessed downlights washing the slats, a thin-bezel display with real shadow and backlight, a fluted credenza, a stone floor. | closed `a6cfe912` |
| BB3 | Design 11's room still read as computer-made (uniform slats and light, glowing light blobs, an empty room, an oversized screen); the valuation chapter opens on an empty form. | Timber and light variation, real downlight trims, a styled credenza (books, stone sphere, vases), the screen sized to the wall, a power-on as the screen enters view; a labelled worked example in the valuation chapter computed by the same engine. | closed `ef1aa228` |
| BB4 | Owner asked whether a drawn room belongs on an iconic site; it does not (a mockup, uncanny, shrinks the product). | The board as the instrument: large and flat on deep navy, a fine bezel, its own glow, the power-on kept (hook shared in `lib/use-power-on.ts`). | closed `7d72b399` |
| BB5 | Owner: add professional widgets to the sections. | Interactive lifecycle (stages select a panel: what happens, the module that runs it; EN/FR/ES); valuation range bar; a searchable, filterable, sortable ledger over all priced deals (`LEDGER_ALL`); a chapter index; a questions chapter (07) answered only from the Pricing and Platform pages, buyer prices left out pending the open decision; count-up hero figures. The back page becomes chapter 08. | closed `7918e5e7` |
| BB6 | Owner: "the visual presence of the newly added widgets are not felt". | Each widget given weight: a large stage panel with previous/next and a progress strip; the valuation result in a navy card with a gradient gauge, ticks and a midpoint pin; the ledger in a toolbar panel with status counts, a navy summary strip and value bars; a dark chapter rail with a progress line and a reading bar; question cards with a briefing prompt; larger hero figures with drawn rules. | closed `b64be532` |
| BB7 | Further premiumisation and iconicity. | A signature line in the right margin joining the chapters and drawing as you read; a navy bookend with the ExitOS wordmark; module rows opening to their engine structure (`MODULE_PREVIEW`: readiness weights, methodologies, formats, packages — never a sample company's scores); one chapter-reveal motion system; the hero's edition line ("Edition of {date} · from the registry's daily refresh"); typography finishing (balanced headlines, pretty paragraphs, hanging punctuation, old-style figures in serif text). | closed `f4fe56e5` |
| BB8 | Owner uploaded two videos and asked to use the good one. | `public/1.mp4` graded to the navy palette, trimmed to a seamless 4.6 s loop, compressed to 1.4 MB (MP4 + WebM, poster), played muted behind chapter 08 under a navy veil; loads only near view, pauses off-screen, never plays under reduced motion. Placeholder — pre-launch gate G1. `public/2.mp4` not used (another product's invented figures). | open |
| BB9 | `BoardRoom.tsx` (BB2–BB3) is unused since BB4. | Remove it; the hall component `TradingHall.tsx` stays for the dev-only hero lab. | open |

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

### M10 — The command board restored as built
*Closed by:* `pages/Landing.tsx`.
- **Restored verbatim from `20545a37`.**
  - The hero's trading-hall environment: full-strength photograph, ceiling light grid, glass-wall mullions, floor heat field, white wash, floor sheen and the board's ambient light.
  - The whole mounted display: the `perspective: 2000px` stage with `lg:translate-x-16 lg:-translate-y-6`, the `ex-bezel` 3D mount with its rounded bezel and shadow, the exchange ribbon, `CommandBoard` and the `ex-reflection` floor reflection.
  - The original column ratio `0.9fr / 1.3fr` with `items-center`.
- **Proof.** A script compared the restored blocks with the original source and found them identical. The `data-board` marker added in M7 is gone, so the board markup is exactly as built.
- **Headline column only.** The headline keeps the skeleton treatment, resized to fit the original narrower column (`clamp(3rem, 5vw, 5.1rem)`). The body line moves from `slate-600` to `ink-800` so it reads over the hall photo.

*Verification:*
- `tsc -b`, eslint clean · `vitest` 218/218.
- Chromium `/` 1440 and 390: 0 errors, `h1` 1, no overflow.
- axe outside the board: 0. Inside the board: contrast ×6, as built.
- Keyboard: 112 stops outside the board, all with a visible focus indicator.
- Reduced motion: 0 animations outside the board.
- Screens: `scratchpad/home/m10b-*`.

### U1 — Value your company in 30 seconds
*Closed by:*
- **`lib/quick-value.ts` (new).**
  - `quickIntake` = the intake's `DEFAULT_INTAKE` plus sector, revenue and growth. ARR is kept at the defaults' 75% of revenue.
  - `quickValue` = `runInstitutionalValuation(buildProfile(…)).headline`: the D1 institutional value, no new formula.
  - `QUICK_ASSUMPTIONS` is read from the defaults, not typed.
  - `quickQuery` / `fromQuery`: the URL hand-off, validated with `parseNumber` (revenue $0.1M–$5,000M, growth −50%–300%, sector in `SECTORS`).
- **`lib/quick-value.test.ts` (new, 4 tests).** Parity with the engine, defaults kept, URL round trip, invalid inputs rejected.
- **`components/QuickValue.tsx` (new).** Placed directly under the hero: label "Value your company · 30 seconds" and `h2` "What is your company worth?".
  - Inputs: sector select, revenue ($M), growth (%), with labels and errors tied by `aria-describedby`/`aria-invalid`.
  - Result in an `aria-live` region: the low–high range in the editorial serif, the midpoint, and a "Model estimate" tag.
  - The assumptions are listed beside the result.
  - Buttons: **Refine in Value My Company →** (`/console/intake?sector=…&revenue=…&growth=…`) and **Access the Exchange**.
  - The valuation module loads with `import()` on first focus.
- **`pages/Intake.tsx`.**
  - With no saved figures, a valid hand-off pre-fills the form. The badge reads "Homepage figures · not saved", a note explains it, and **Save these figures** keeps them. Nothing is saved until an edit or Save (Page 03 G1 rule kept).
  - With saved figures, the hand-off is not applied. The page says so and offers "Use the homepage figures instead" or "Keep mine".
- **`lib/i18n.tsx`.** 14 new `qv.*` keys in EN/FR/ES (M9 rule). Sector names and parse errors stay English, as in the console.

*Verification:*
- `tsc -b`, eslint clean · `vitest` 222/222 (+4).
- Chromium:
  - Invalid input ("abc", growth 900) shows "Use digits only, e.g. 12.5." and "Must be at most 300.".
  - Vertical SaaS / 40 / 45 gives **$112.2M – $323.2M, midpoint $182.5M**.
  - Refine → sign in → Value My Company shows **$182,541,176** (range $112,235,294 – $323,152,941), the same figures, with the "not saved" badge and nothing in `exitos.intake.v1`. Save these figures stores sector `vertical_saas`, revenue 40,000,000, growth 0.45, and the badge clears.
- axe 0 on the section with an error shown and with a result shown, at 1440 and 390; homepage axe outside the board 0; Value My Company (free) axe 0; no overflow.
- **Bundle (honest note).** The lazy chunk is only 1.4 kB because the valuation engine is already in the main bundle (the console shares it). The main bundle grew from 1,252.3 kB to 1,261.1 kB (+8.8 kB: the strings and the component).
- Homepage height: 9,585 → 9,907 px at 1440.
- Screens: `scratchpad/home/u1-*`.

### U2 — The broadsheet ledger
*Closed by:*
- **`lib/market-stats.ts`** (additive exports):
  - `LEDGER_ROWS`: the 13 newest priced history entries, in the board's order, each with the announced date, target, acquirer, sector, value, premium (when a reference exists), status, every source (SEC 8-K / 10-K, Wikidata, press release, with its reference) and the record's confidence tier.
  - `LEDGER_TIERS`: tier counts across the history.
  - `LEDGER_PRICED`: entries with a disclosed price.
- **`pages/Landing.tsx`**, chapter 06 (heading, intro, sources line and the "Run the valuation" bridge kept):
  - **Masthead** under a double rule: "Disclosed acquisitions · **The ExitOS Ledger** · Index as of {date} · 61 recorded deals, 53 priced".
  - **Front page**: the three newest deals as stories, each with sector and date, a headline whose verb follows the status ("acquired" when closed, "agreed to acquire" when announced, "ended its deal for" when terminated), the value, premium versus reference, status and first source.
  - **The ledger table** (a labelled scroll region on phones): the next 10 entries with announced date, target (row header), acquirer, sector, value, status and every source reference.
  - A line under the table states the record tier honestly: "Record tier: **61 unverified** — not re-checked against the primary filing in this build". In the engine, every history entry is tier `unverified`.
- **Correction found while building.** The existing sources line said "benchmark set: **61 priced** events", but 61 is the number of recorded deals, of which **53** carry a price. It now reads "61 recorded deals (53 priced)".
- The board is untouched (M10).

*Verification:*
- `tsc -b`, eslint clean · `vitest` 222/222.
- Chromium `/`: 3 front-page stories and 10 table rows, values matching the snapshot (for example DB Schenker $15.8B, Closed, press release + Wikidata). axe 0 on the section at 1440 and 390, and 0 outside the board page-wide; no overflow; all tab stops with visible focus.
- Height: 9,907 → 10,560 px at 1440; 17,977 → 18,868 px at 390. U7 (mobile folding) would address this if chosen.
- Screens: `scratchpad/home/u2-*`.

### U4 — Numbered source notes
*Closed by:*
- **`components/SourceNotes.tsx` (new).**
  - `Note`: a superscript link "Source n" to `#source-n`. The first citation of each source carries `id="cite-n"`.
  - `SourcesSection`: "Sources & method" above the footer, six numbered entries, each with a "↩ back" link to its first citation. The text is computed from the same data the page shows:
    1. **Market index** — 6,311 events, 1,497 buyers, Wikipedia/Wikidata/EDGAR, generated date, "a bundled snapshot — not a live feed".
    2. **Acquirer registry** — 31 curated mandates (15 strategic, 6 PE), 21 jurisdictions, 10 sectors; "curated, not independently verified".
    3. **Disclosed-deal history** — 61 recorded, 53 priced, $379.1B, the sources, "Record tier: 61 unverified".
    4. **Deal medians** — +36% premium **from 14 deals** with a reference price; 80 days **from 56 deals** with both dates.
    5. **Valuation** — the deterministic institutional framework; the homepage's typical-value defaults.
    6. **Typical timeline** — "planning assumptions for a run process, not measurements".
- **Notes placed** (21 superscripts, none inside the board) in `pages/Landing.tsx` and `components/QuickValue.tsx`:
  - proof ribbon (1, 2, 3, 2) and trust strip mandates (2);
  - quick value (5), lifecycle band (6), losses medians (4);
  - market structure (2), buyer intelligence (2);
  - confidence-register footer (3) and the six signal tiles (3 or 2 each);
  - ledger masthead (3) and sources line (1, 3);
  - coverage (2).
- `lib/i18n.tsx`: `src.title` in EN/FR/ES. The entries are data text, in English like the page's other data constants.

*Verification:*
- `tsc -b`, eslint 0 errors · `vitest` 222/222.
- Chromium `/`: 21 notes, 0 missing targets; 6 back-links, 0 missing. Clicking note 4 lands on `#source-4` (in view), and its back-link returns to `#cite-4`. 0 errors.
- axe outside the board: 0 at 1440 and 390. Keyboard: 129 tab stops, all with visible focus. No overflow.
- Height: 10,560 → 11,434 px at 1440; 18,868 → 20,163 px at 390.
- Screens: `scratchpad/home/u4-sources.jpg`.

### V1 — Sections repositioned off the homepage
*Closed by:*
- **`components/ExchangeBlocks.tsx` (new).** The ten sections moved out of `pages/Landing.tsx` verbatim (JSX, data constants, `OfferTable`, `Vault`, `WorldDots` with its reduced-motion hook): `TrustStrip`, `ExchangeSystem` (workflow, Founder → Exit flow, market structure), `DataProvenance` (pipeline and signal tiles), `NegotiationDesk`, `DataRooms`, `ExampleListings`, `GlobalReach`, `Governance`, `BuyerIntelligence`. Only the chapter number became a prop.
- **`pages/Platform.tsx`.** Trust strip under the hero, then (after Infrastructure and End to end) 04 workflow, 05 provenance, 06 data rooms, 07 global reach, 08 governance, 09 the next move, and **Sources & method** (sources 2 and 3).
- **`pages/Modules.tsx`.** After Founder side: 03 negotiation desk (navy), 04 buyer intelligence, 05 example listings, 06 Buyer side (navy, buttons), and **Sources & method** (source 2).
- **`pages/Landing.tsx`.** Hero with the board (unchanged) and proof ribbon, Value your company, lifecycle band, thesis and matrix, the ledger, and the final call to action. The **confidence register** now sits under the ledger table; V2 restyles it as the sidebar.
- **`components/SourceNotes.tsx`.**
  - `SourcesSection` takes `only` (the sources a page cites).
  - It gives the first note of each source on the page the `cite-n` id, so the back-links work on every page.

*Verification:*
- `tsc -b`, eslint 0 errors · `vitest` 222/222.
- **Inventory** (`scratchpad/tools/inventory.mjs`, Chromium): each of the 17 original blocks and U1/U2 renders on exactly one page, and U4 sources on `/`, `/platform` and `/modules`.
- Source notes: `/` 11, `/platform` 9, `/modules` 1; 0 missing targets, 0 missing back-links.
- **Heights:** `/` 11,434 → **5,823 px** at 1440 (target ≤ 6,500) and 20,163 → **9,685 px** at 390 (target ≤ 11,000). `/platform` 6,620 / 11,175; `/modules` 4,937 / 8,781.
- All four routes, 1440/390: 0 errors, `h1` 1, no overflow. axe 0 on Platform, Modules and Pricing; 0 on the homepage outside the board.

### V5 — A quieter hero column (board untouched)
*Correction to the plan:* the register said "the duplicated topline removed (the eyebrow is already in the header)". Since M1 the header's topnote reads "A Sovereign Infrastructure", so the eyebrow is not duplicated. The eyebrow stays; the clutter around it goes.
*Closed by:* `pages/Landing.tsx`, headline column only:
- The topline's right half, "Registry snapshot · as of {date}", is removed. The date stays in the ledger masthead and in Sources & method (1).
- The "01—" marker and its offset grid are removed.
- `hero.sub` moves from Sora (`font-serif`) to the editorial serif, ahead of V4.
- The deck sits in a single editorial pull-quote: blue left rule, a frosted white backing (`bg-white/80`, backdrop blur) so the two lines read over the hall photograph, at most 440 px wide.
- The buttons align with the deck.

**The board, its bezel, the reflection, the stage and every hall layer are unchanged.** A script compared them with `20545a37`: the mount, `CommandBoard` through `BoardHeader`, and the hall environment are all identical.
*Verification:* `tsc -b`, eslint clean · Chromium `/` 1440/390: 0 errors, `h1` 1, no overflow, axe 0 outside the board. Height 5,823 px at 1440 and 9,666 px at 390. Screens: `scratchpad/home/v5b-*`.

### V3 + V2 — Rhythm and the broadsheet language (closed together)
*Why one commit:* the new order (V3) and the broadsheet treatment (V2) are the same rewrite of the same three sections. Splitting them would have meant styling sections twice. Both rows point to this commit.
*Closed by:* `pages/Landing.tsx` and `lib/i18n.tsx` (`ledger.read` in EN/FR/ES). The six moments now run:
1. **Hero** (photo, board, pull-quote): unchanged by this gap.
2. **Value your company:** white, compact.
3. **02 The thesis.** On the page ground: `loss.h2` as one giant statement (`clamp(3rem, 7.4vw, 7.6rem)`), a double rule, then a drop-cap paragraph (the medians, note 4) beside the matrix. The matrix is now a real `<table>` with a hidden "Dimension" header, row headers and column rules.
4. **03 The ledger.** White. The table sits beside a **"How to read this record"** sidebar under a double rule; this is the confidence register, kept on the homepage, sticky on wide screens. Table dates no longer wrap.
5. **04 How a sale runs.** The page's one full-bleed navy moment. The label is "Typical timeline" (note 6), the `h2` is the lifecycle title, and the eight stages appear as large editorial numerals 01–08 with their names and typical weeks (4 × 2; 2 columns on phones).
6. **05 The next move.** The back page: a double rule, the giant `cta.h2`, the two buttons, then a ruled colophon row with `cta.body` and `cta.foot`.

After these: Sources & method, then the footer. Chapter labels are renumbered 02–05, one per moment; no two consecutive moments share a layout or ground.
*Verification:*
- `tsc -b`, eslint clean · `vitest` 222/222.
- Chromium `/` 1440/390: 0 errors, `h1` 1, no overflow. axe 0 outside the board (the matrix and ledger regions are labelled and focusable); 113 tab stops, all with visible focus. Reduced motion: 0 animations outside the board.
- Inventory: 0 missing blocks, notes 11/9/1 with 0 missing targets.
- **Height: 6,368 px at 1440 (target ≤ 6,500) and 10,633 px at 390 (target ≤ 11,000)**, down from 11,434 / 20,163 before Phase 4.
- Screens: `scratchpad/home/v3-*`.

### V4 — Three typefaces, less label noise
*Finding:* by V5, Sora (`font-serif`) no longer renders anywhere on the marketing pages outside the board. The only `font-serif` left is the board's drill-down title, kept as built (M10). Measured families outside the board on all four pages: **Inter, Source Serif 4 and the monospace — three**.
*Closed by:* small all-caps labels that were not chapter labels, table headers or newspaper kickers were set in sentence case (Inter, 12–13 px), and figures stay in the monospace:
- **`pages/Landing.tsx`.** Proof-ribbon labels, "Disclosed value", the ledger caption, the register header, the lifecycle weeks (mono, normal case) and `cta.foot`.
- **`components/QuickValue.tsx`.** Field labels, "Enterprise value range" and the assumptions label.
- **`components/MarketingChrome.tsx`.** "Language", the footer badges, the domain.
- **`components/ExchangeBlocks.tsx`.** The Founder → Exit flow titles, the data-room "Required for diligence" line, the example-listings notice, and the coverage stat labels.
- **`pages/Modules.tsx`.** Module stat lines (mono, normal case).
- **`pages/Pricing.tsx`.** Tier purpose line.

Kept in capitals by design: one chapter label per moment, table headers, the ledger masthead and story kickers, tier badges, the board.
*Verification:* `tsc -b`, eslint 0 errors · `vitest` 222/222.
- Small uppercase labels (≤ 12 px, outside the board): **home 70 → 40, Platform 43 → 23, Modules 46 → 33, Pricing 39 → 28**.
- All four routes 1440/390: 0 errors, `h1` 1, no overflow; axe 0 on Platform, Modules and Pricing, and 0 on the homepage outside the board.
- Homepage height 6,377 / 10,676 px.

### V6 — Proof that nothing was lost
*Closed by:* `pages/marketing-inventory.test.tsx` (new, 21 tests). It renders the four marketing pages server-side (inside `MemoryRouter` and `I18nProvider`, page content in `<main>` only) and asserts:
- each of the 17 original homepage blocks, plus Value your company and the ledger, renders on **exactly one** page;
- five moved blocks are no longer on the homepage;
- "Sources & method" is on every page that cites sources.

*Verification:*
- `tsc -b`, eslint 0 errors · **`vitest` 243/243** (37 files) · `vite build` succeeds.
- Chromium:
  - The browser inventory (`scratchpad/tools/inventory.mjs`) agrees: 0 missing blocks; source notes `/` 11, `/platform` 9, `/modules` 1, with 0 missing targets and 0 missing back-links.
  - Every internal link on the four pages (5 links, 13 in-page anchors) resolves to its own route. Buttons go to `/console`, `/pricing`, `/modules` and `/platform`, all routes in `App.tsx`.
  - Keyboard: home 113 tab stops, other pages 157 each (the sweep's cap), all with visible focus.
  - axe 0 on Platform, Modules and Pricing, and 0 on the homepage outside the board. The board keeps its 6 contrast items as built.

**Phase 4 result:**

| Route | 1440 before → after | 390 before → after |
|---|---|---|
| `/` | 11,434 → **6,377 px** | 20,163 → **10,676 px** |
| `/platform` | 2,559 → 6,626 px | 4,323 → 11,198 px |
| `/modules` | 2,374 → 4,945 px | 4,224 → 8,806 px |
| `/pricing` | unchanged (4,847 px) | unchanged (8,224 px) |

### W1 — Format B on the live homepage
*Closed by:*
- **`pages/Landing.tsx`.** The hero is now `TradingHall` (`components/TradingHall.tsx`):
  - **In the hall:** the eyebrow, the `h1` (white, last line in blue-300 italic), `hero.sub` in the editorial serif, `hero.body`, and **Access the Exchange** / **Deploy a Mandate**.
  - **The screen:** the exchange ribbon and `CommandBoard`, carried over verbatim, set into the wall frame on its plinth between the pilasters, under the light cove, above the reflecting floor. The frame wrapper carries `data-hall-screen` for test scoping.
  - **On the floor:** the proof figures, with source notes 1–3.
  - Removed from the hero: the hall photograph, the 3D `ex-bezel` mount, the floor-reflection strip and the photo wash layers. Every other homepage moment is unchanged.
- **`index.html`.** The `command-center.png` preload is gone; the image stays in `public/`.

*Verification:*
- A script compared the ribbon + board markup and the `CommandBoard` component with the original `20545a37`: both identical (export keyword aside).
- `tsc -b`, eslint clean · `vitest` 243/243.
- Chromium `/` 1440/390: 0 errors, `h1` 1, no overflow. axe 0 outside the screen. Keyboard: 113 stops, all with visible focus. Inventory: 0 missing blocks, notes 11/9/1, 0 missing targets.
- **Honest note:** axe now reports 8 contrast items inside the screen at 1440 (7 at 390), up from 6. The board's own faint labels (`white/40–45`) sit on the frame's slightly darker ground. These are the board's text, left as built.
- Height 6,664 px at 1440 and 10,710 px at 390.
- Screens: `scratchpad/home/w1-*`.

### W2 — Premium finish for the hall
*Closed by:*
- **`components/TradingHall.tsx`** (rewritten; same props):
  - a **coffered ceiling** with a downlight in every coffer, receding in perspective (replacing the light lines);
  - **full-height fluted pilasters** with stepped capitals and bases, rising above the screen;
  - a **lit architrave** spanning the capitals;
  - **volumetric light** falling from the cove onto the screen;
  - the screen set in a **recessed, stepped portal**: an outer stone frame, an inner frame with an inset shadow, the plinth below;
  - a faint **glass sheen** over the screen (decorative, `pointer-events: none`; the screen's content is unchanged);
  - **stone floor** seams with an edge vignette, plus the existing live floor reflection;
  - a slow **entrance**: the portal rises and fades in and the glow comes up, once. It runs only under `prefers-reduced-motion: no-preference`.
- **`pages/Landing.tsx`.** A hairline rule before the eyebrow, and more space between the headline and the architrave.

*Verification:*
- A script compared the ribbon + board markup and `CommandBoard` with `20545a37`: both identical.
- `tsc -b`, eslint clean · `vitest` 243/243.
- Chromium `/` 1440/390: 0 errors, `h1` 1, no overflow; axe 0 outside the screen; 113 tab stops, all with visible focus.
- Entrance animations: 3 with no motion preference, **0 with reduced motion**.
- **Honest note:** axe now reports 0 contrast items inside the screen (8 in W1). This is because the glass-sheen layer sits over the text, so axe can no longer measure it ("incomplete"). The board's faint labels are unchanged, so this is not a contrast fix.
- Height 6,772 px at 1440 and 10,751 px at 390. Screens: `scratchpad/home/w2-hero-*`.

### X1 — The Horizon hero, with the hall in the body
*Closed by:*
- **`pages/Landing.tsx`.**
  - **The hero is the Horizon:** navy, ruled eyebrow, centred editorial `h1`, `hero.sub`, `hero.body`, both buttons, the proof figures with notes 1–3, and the glowing horizon line.
  - **Below it, "The exchange" section:** `TradingHall` with the label and `h2` "The whole market, *in one room.*", the screen (ribbon + `CommandBoard`, carried over verbatim) and the keyframes.
  - The rest of the page (Value your company, thesis, ledger, how a sale runs, the next move, sources) follows unchanged.
- **`lib/i18n.tsx`.** `hall.eyebrow`, `hall.h2` and `hall.h2em` in EN ("The exchange / The whole market, / in one room."), FR ("La bourse / Tout le marché, / dans une seule salle.") and ES ("La bolsa / Todo el mercado, / en una sola sala.").

*Verification:*
- A script found the ribbon + board markup and `CommandBoard` identical to `20545a37`.
- `tsc -b`, eslint clean · `vitest` 243/243 (including the inventory test).
- Chromium `/` 1440/390: 0 errors, `h1` 1, no overflow; axe 0 outside the screen; 115 tab stops, all with visible focus; inventory 0 missing, notes 11/9/1 with 0 missing targets; the EN/FR/ES switch causes no errors.
- Height: 7,593 px at 1440 and 11,176 px at 390. The hero is now a full screen and the hall is its own section, so the page is slightly above the Phase 4 targets (6,500 / 11,000).

---

### Y1 — closed 4656593d
Hero rebuilt as statement → proof figures → exchange map → hall. Verified: tsc, eslint, vitest 243/243, build; axe 0 at 1440/390 (inside and outside the board); keyboard 115 tab stops, 0 without visible focus; reduced motion stops all motion outside the board; no overflow, 0 console errors, one h1; board ribbon, mount and CommandBoard identical to the original. Page height 7,889 px at 1440, 11,550 px at 390 (the map adds about 300 px).

### Z1 — closed 49ee5ecd
Verified: tsc, eslint, vitest 243/243 (inventory test included), build; axe 0 at 1440/390 inside and outside the board; keyboard 127 tab stops, 0 without visible focus; reduced motion stops all motion outside the board; no overflow, 0 console errors, one h1; board ribbon, mount and CommandBoard identical to the original. Page height 8,889 px at 1440, 12,743 px at 390 (the new section adds about 1,000 px at 1440).

### Z2 + Z3 — closed 4b1c1ac6 (one commit: both changed the same two sections and were built in one pass)
Verified: tsc, eslint, vitest 243/243 (inventory test included), build; axe 0 at 1440/390 inside and outside the board; keyboard 127 tab stops, 0 without visible focus; reduced motion stops all motion outside the board; no overflow, 0 console errors, one h1; board identical to the original. Page height 8,839 px at 1440, 12,560 px at 390.

### AA2 — closed 01ce06c1
Continents removed from the exchange map; stages placed by typical week on a square-root time axis with week ticks along the foot. Verified: tsc, eslint, vitest 243/243; rendered at 1440 with no overflow or errors.

### AA8 — closed 432bda73
The exchange map is set on paper (white ground, ink grid and labels, blue-600/700 route, emerald-600 close), so the trading hall is the page's one dark moment; LANDMASS returns to module scope. Verified: tsc, eslint, vitest 243/243; rendered at 1440 and 390, no overflow or errors.

### AA3 — closed ce7b3cc3
Removed the topline's "No. 01", the map's "01 / Discover the field" and "02 / Trace the path", and "/ 001" from the map tag (keys xm.discover and xm.trace deleted, EN/FR/ES); only chapter numbers remain. Verified: tsc, eslint, vitest 243/243.

### AA1 — closed b96e08a9
The map's caption is now "The acquisition lifecycle · signal → closing · Typical timeline" with source note 6 (first citation); the navy lifecycle band (former section 06), its LIFECYCLE table, the NAVY constant and the xm.note key are removed. The inventory test's lifecycle check is met by the map caption. Verified: tsc, eslint, vitest 243/243; rendered at 1440, no overflow or errors.

### AA4 — closed 73cf8748
New order: 01 hero · 02 the exchange (hall + unchanged board) · value your company · 04 thesis · 05 ledger · 06 the modules · 07 back page (value your company takes chapter 03 in AA7). The board is now the second thing on the page. Verified: tsc, eslint, vitest 243/243.

### AA5 — closed bdb7d201
Chapter 06 has its own headline ("The desk behind the screen.") and shows Exit Readiness Score, Valuation Engine, Documents and Data Room — figures that appear nowhere else on the page. Descriptions and stats are in EN/FR/ES (mods.*, mod.*); the stats interpolate MODULE_NUMS, new in lib/module-stats.ts and computed from the same engines as MODULE_FACTS. Module names stay as product names. Verified: tsc, eslint, vitest 243/243; rendered at 1440, no overflow or errors.

### AA6 — closed bc252d9d
Hero keeps three figures (6,311 · 31 · $379.1B; 21 mandates deploying stays on the board's ribbon). Ledger: "61 disclosed events on record" and the market-index footnote removed (the masthead keeps the count; the Sources list keeps the method). Thesis table: "A run across every curated acquirer mandate in the registry" instead of repeating 31 / 21. Measured on the rendered page outside the board and the sources list: 6,311 ×1, $379.1B ×1, $72.5B ×0, 31 ×1 (hero), 21 ×0, 53 ×1; 61 ×2, where the second is the separate disclosure "Record tier: 61 unverified", kept on purpose. Verified: tsc, eslint, vitest 243/243.

### AA7 — closed d3a1247d
Value your company is chapter 03, right after the board: double rule, Chapter label, a chapter-size editorial headline with the note beside it, full-width form with larger fields and button, the range at up to 6rem as the centrepiece. The duplicate "Access the Exchange" button removed (Refine remains). Same engine result as before (Vertical SaaS / $40M / 45% → $112.2M–$323.2M at 1440 and 390). Verified: tsc, eslint, vitest 243/243.

### AA9 — closed 62c60936
The ledger's chapter label now sits above a flush-left headline (with its note to the right), as in every other chapter, instead of in a narrow left column that pushed the headline toward the centre. Verified: tsc, eslint, vitest 243/243.

### AA10 — closed 94080f60
SourcesSection gains a collapsed mode, used on the homepage only: the list folds under "Sources & method · 6" (a details/summary disclosure, keyboard-operable). Following a note opens it and scrolls to the entry (hashchange and deep links #source-n). The source markup still renders server-side, so the sources test holds. Also: note anchors get scroll-mt so "↩ back" no longer lands under the sticky header. Browser-checked: closed on load; note click → open, entry in view; back → citation; /#source-4 → open, entry at 112 px. Verified: tsc, eslint, vitest 243/243.

### BB1 — closed 8504d48b
Preview design 10. Dark hero with the lifecycle chart on navy (ExchangeMap gains a dark palette); pilasters slimmed, set beside the portal, architrave between them only, quieter ceiling. tsc, vitest 243/243; axe 0 at 1440/390 and keyboard 113/0 when built as design 10.

### BB2 — closed a6cfe912
Preview design 11 (BoardRoom.tsx). tsc, vitest 243/243; axe 0, keyboard 113/0, reduced motion 0 outside the board when built.

### BB3 — closed ef1aa228
Preview design 12. Power-on verified (overlay 1 → 0 on entering view, skipped under reduced motion); example = engine result $112.2M–$323.2M for Vertical SaaS / $40M / 45%. tsc, vitest 243/243; axe 0, keyboard 113/0.

### BB4 — closed 7d72b399
Preview design 13 (Instrument.tsx, lib/use-power-on.ts). tsc, vitest 243/243; axe 0, keyboard 113/0, reduced motion 0 outside the board; height 7,418 px at 1440.

### BB5 — closed 7918e5e7
Preview design 14. Browser-checked: count-up 6,311/31/$379.1B; LOI stage → Negotiator panel; ledger Closed → 48 deals, 'salesforce' → 5; rail marks the chapter in view. tsc, vitest 243/243; axe 0, keyboard 129/0.

### BB6 — closed b64be532
Preview design 15. Same checks as BB5 plus: ledger summary (Closed: 48 · $329.7B · largest $68.7B Activision Blizzard). tsc, vitest 243/243; axe 0, keyboard 129/0, reduced motion 0 outside the board.

### BB7 — closed f4fe56e5
Preview design 16. Reveal checked: below-fold headlines hidden until reached, none hidden after a full scroll; axe 0 also after a full scroll (axe3). tsc, eslint 0 errors, vitest 243/243, build; keyboard 129/0; height 9,540 px at 1440.

## Owner decisions
- **The board, as built, includes its presentation** (owner, 2026-10-12): the mounted 3D display in the trading hall, not only the data panel. M10 restores it.
- **The hero command board stays exactly as built** (owner, 2026-10-12, during M2: "use the same live screen which is built as a real screen. dont change it"). The board and its bezel — "Live Market", "System Status · Live", "Live Transactions", the session clock, the moving scores and heat bars, the scan sweep and the ticker — are left unchanged by M2–M8. The data it shows is the registry snapshot and the disclosed-deal history (real records); the "live" styling is the owner's choice and is listed here so it is not mistaken for an oversight.

## Open decisions for the owner
- **Buyer pricing.** Pricing publishes Buyer Access $299/month and Premium $2,499/month; Upgrade says "Buyer pricing is not published yet" (Page 41 G3), and `access.ts` has no buyer plan. Which is right?
- **Security and compliance claims** (M3): restore any of SOC 2, audit trail, access logs, encryption or buyer verification only with evidence (a report, a log, a check in the code).

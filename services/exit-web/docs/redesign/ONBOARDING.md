# ExitOS redesign · Onboarding and simplicity

| | |
|---|---|
| Scope | The console frame (`components/Shell.tsx`, `LayerBar.tsx`, `LayerSubNav.tsx`), the founder home (`pages/Terminal.tsx`), the buyer home (`pages/BuyerPortal.tsx`) and new helpers in `lib/` |
| Rule | **No existing content changes.** No page text, figure, calculation, route, gate or feature is altered or removed. Everything here is added around the pages: guidance, ordering and shortcuts. |
| Owner direction | "without touching our content, is there a way to make the console simple for people to use? does it have onboarding options in some places … it seems too complex to understand." Approved order: Start-here path and shorter menu first, then plain-language terms, then page purpose and next step, then the first visit. |
| Status | Gap register written; gaps closed one commit each. |

## Audit (baseline commit `2f42f11`)

### What exists today
- **No onboarding.** A code search for a welcome, tour, getting-started, first-step or first-run hint finds none.
- **Three navigation systems on every page.**
  - The sidebar: **38 entries for founders**, in four groups (Mandate 12, Market Intelligence 11, Exchange 14, Wealth 1). Buyers see 7, admins 2, superadmins 40 (founder plus admin). *(Corrected: first written as 40 founders in seven groups and 9 buyers, before measuring `navForRole`.)*
  - The "Command Layers" bar (`LayerBar`): five layers, Executive → Banker → Market → Transaction → Buyer.
  - The layer sub-nav (`LayerSubNav`): the pages in the current layer.
  - The three use different groupings for the same pages. Example: Diligence is "Mandate" in the sidebar and "Transaction" in the layer bar.
- **No starting point.** The founder lands on the Intelligence Terminal, a dense page about the demo company. The step every other page depends on, Value My Company, is the third sidebar entry and is not pointed to.
- **Page names describe the product, not the task.** "Intelligence Terminal", "Liquidity Command", "Knowledge Graph", "Engagement Registry", "Network Intelligence".
- **Unexplained terms** across pages: IOI, LOI, EV, ARR, TTM, EBITDA, NDA, escrow, earn-out, canonical midpoint, data room, diligence.
- **No "next step".** A page does not point to the page that logically follows it.

### Real signals available (so progress is never faked)
| Signal | Source | Meaning |
|---|---|---|
| Company figures saved | `loadSavedIntake() !== null` (`lib/active-company.ts`) | The founder entered their own figures in Value My Company |
| Page opened | new: the path is recorded in this browser when the page is opened | "Opened", stated as such — not "completed" |
| Plan gate | `requiredEngagement(path, role, plan)` (`lib/access.ts`) | The step needs a paid engagement; shown before the click |

## Gap register — Onboarding
| # | Gap | Fix (additive; no content changed) | Status |
|---|---|---|---|
| O1 | **No starting point.** | A "Start here" guide at the top of the founder home: five steps in order — Value my company → Check readiness → See your value → Find buyers → Plan outreach. Step 1 is ticked only when figures are saved; steps 2–5 show "Opened" once the page has been opened in this browser. Locked steps show the engagement they need. A buyer version on Buyer Home: Browse opportunities → Acquisition intelligence → Request access → Deal Room. Can be hidden; "Show the guide" in the sidebar brings it back. Stored in this browser only. | ☑ `b336fca` |
| O2 | **38-entry menu.** | Founders see an **Essentials** list first (Home, Value My Company, Readiness, Enterprise Value, Buyer Profiles, Acquisition Radar, Anonymous Listings, Inbox), with every other entry under **All tools** (collapsed, grouped exactly as today). The choice is remembered in this browser. The current page is always visible: opening a page outside Essentials expands All tools. Buyers and operators keep the full list (7 and 2 entries; superadmins 40). No entry, label, route, lock or gate changes. | ☑ `246d218` |
| O3 | **Unexplained terms.** | A plain-language glossary (`lib/glossary.ts`) and a "Terms" panel reachable from the sidebar: one-sentence meanings for the terms listed above. Page text is not rewritten. | ☑ `1a5567b` |
| O4 | **No purpose line or next step.** | A slim bar under the layer navigation: "What this page is for" (one sentence) and "Next: <page> →". Driven by one map keyed by route, so no page file changes; can be hidden for all pages at once. | ☑ `707fc80` |
| O5 | **No first-visit welcome.** | The role is already chosen at sign-in (founder or buyer), so a "selling or buying?" question would repeat it. Instead, on the first visit the Start-here guide opens expanded with one welcome sentence; after that it stays as the user left it. | ☑ `ce468b1` |
| O6 | **Page names describe the product, not the task** (owner decision, 2026-10-12: "task style menu? yes"). | Menu entries get task-style names (table below). The current name stays visible as a small second line under each renamed entry, because page headings and page text refer to pages by those names ("Bid Room", "Acquisition Radar" …). Page headings and page text are unchanged. The guide, page tips, the layer sub-nav and the upgrade screen use the new names through `featureLabel`. Group headings, routes, roles and locks are unchanged. Operator entries (Admin Console, Calibration) keep their names. | ☐ |

Out of scope (owner decision, not changed here): renaming pages; merging or removing the Command Layers bar or sub-nav. Both would change existing content or features. Listed as open decisions below.


### O6 — names
| Route | Current name (kept as the second line) | Task-style name |
|---|---|---|
| `/console` | Intelligence Terminal | Home |
| `/console/commander` | Chief Investment Banker | Recommended Actions |
| `/console/intake` | Value My Company | *(unchanged)* |
| `/console/command` | Liquidity Command | Exit Overview |
| `/console/autopilot` | Autonomous Exit | Simulate My Exit |
| `/console/valuation` | Enterprise Value | See My Value |
| `/console/readiness` | Readiness | Check Readiness |
| `/console/diligence-ai` | Diligence | Prepare for Diligence |
| `/console/investors` | Cap Table | Manage Cap Table |
| `/console/exit-timing` | Exit Timing | Choose When to Sell |
| `/console/data-room` | Data Room | Build the Data Room |
| `/console/documents` | Documents | Generate Documents |
| `/console/buyers` | Buyer Profiles | Find Buyers |
| `/console/buyer-graph` | Buyer Graph | Search All Acquirers |
| `/console/buyer-copilot` | Buyer Intelligence | Compare Top Buyers |
| `/console/intelligence` (founder) | Acquisition Intelligence | Rank Buyers by Fit |
| `/console/acquisition-radar` (founder and buyer) | Acquisition Radar | Scan Listed Companies |
| `/console/engagement-registry` | Engagement Registry | Check Buyer Engagement |
| `/console/network` | Network Intelligence | About Our Data |
| `/console/market-map` | Market Map | Explore the Market |
| `/console/knowledge-graph` | Knowledge Graph | Search Past Deals |
| `/console/outcomes` | Outcome Intelligence | See Deal Outcomes |
| `/console/indexes` | Acquisition Indexes | Compare Sectors |
| `/console/marketplace` (founder) | Anonymous Listings | List My Company |
| `/console/banker` | Outreach | Write to Buyers |
| `/console/outreach-plan` | Outreach Plan | Plan Outreach |
| `/console/nda` (founder) | NDA Vault | Manage NDAs |
| `/console/inbox` | Inbox | *(unchanged)* |
| `/console/pipeline` | Active Processes | Track Deals |
| `/console/activity` (founder and buyer) | Deal Activity | Review Activity |
| `/console/process-intel` | Process Intelligence | Track the Buyer Funnel |
| `/console/deal-room` (founder) | Deal Room | Preview the Deal Room |
| `/console/negotiator` | Bid Room | Compare Offers |
| `/console/simulator` | Scenario Simulator | Test Scenarios |
| `/console/closing` | Closing Center | Close the Deal |
| `/console/closing#signatures` | Signatures | Track Signatures |
| `/console/closing#escrow` | Escrow | Track Escrow |
| `/console/wealth` | Liquidity & Transition | Plan After the Sale |
| `/console/buyer-portal` | Buyer Home | Home |
| `/console/marketplace` (buyer) | Browse Opportunities | *(unchanged)* |
| `/console/intelligence` (buyer) | Acquisition Intelligence | Research Acquirers |
| `/console/deal-room` (buyer) | Deal Room | Open the Deal Room |
| `/console/nda` (buyer) | Access Requests | Track Access Requests |
| `/console/admin`, `/console/calibration` | Admin Console, Calibration | *(unchanged — operators)* |

---

## Closure log

### O1 — Start-here guide
*Closed by:* `lib/onboarding.ts` (new: the steps, pages opened in this browser, hidden flag; key `exitos.guide.v1`), `components/StartHere.tsx` (new), `components/Shell.tsx` (records the opened page; a plan-gated page shows the upgrade screen instead, so it is not counted; "Show the Start-here guide" in the sidebar foot when hidden), `pages/Terminal.tsx` and `pages/BuyerPortal.tsx` (one line each: the guide under the page header). Founder steps: Value my company (Done when figures are saved) → Check readiness → See your value → Find buyers (Buyer Profiles) → Plan outreach. Buyer steps: Browse opportunities → Request an NDA or make an offer (Acquisition Radar) → Follow your requests → Work the deal. The first step not yet done or opened is marked "Next"; a step behind a plan shows "Needs <engagement>" from `requiredEngagement`. A foot line states what Done and Opened mean and that progress stays in this browser. No page text changed.
*Verification:* `tsc -b`, eslint clean · `vitest` 211/211 (5 new in `onboarding.test.ts`) · Chromium founder free: guide shown, step 1 "Next", step 5 "Needs Preparation or Active Mandate"; open Check readiness and return → step 2 "Opened"; Hide guide → gone, sidebar link shown → guide back · buyer free: four steps, steps 3–4 "Needs Active Mandate", same hide/show · Terminal (founder free/Pro) and Buyer Home (buyer free/Pro) 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus.

### O2 — Shorter founder menu
*Closed by:* `components/Shell.tsx` and `lib/onboarding.ts` (`ESSENTIALS`, the remembered open/closed state under `exitos.nav.v1`). Founders see **Essentials**: the eight existing entries Intelligence Terminal, Value My Company, Readiness, Enterprise Value, Buyer Profiles, Acquisition Radar, Anonymous Listings, Inbox, with their labels unchanged (the register's "Home" meant the Intelligence Terminal entry; it was not renamed). Below them is an **All tools (30)** button (`aria-expanded`, `aria-controls`) that shows the other 30 entries, grouped exactly as before. Opening a page that is only under All tools expands it, so the current page is always visible. Buyers (7), admins (2) and superadmins (40) keep the full list. The item markup was moved into one `renderItem` function; it is unchanged, with the same links, locks and the upgrade redirect for locked entries.
*Verification:* `tsc -b`, eslint clean · `vitest` 211/211 · Chromium founder free 1440 and 390 (drawer): 8 visible links, All tools → 38, axe 0 on the sidebar open and closed; navigating to Market Map expands All tools with the current entry visible; the state survives a reload · buyer free 1440/390: unchanged 7 links, no All tools button, axe 0 · Market Map Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

### O3 — Plain-language terms
*Closed by:* `lib/glossary.ts` (new: 25 terms in alphabetical order, each with its long name and a one-sentence meaning that matches how the console uses it: the canonical value per D1, the 2.5% success fee per Upgrade, provenance badges per `xo`, and the registry as a bundled snapshot), `components/TermsDialog.tsx` (new: the existing `Modal` with a search field and a definition list), and `components/Shell.tsx` (a "Plain-language terms" button in the sidebar foot for every role). No page text was changed. Terms were chosen by counting their use across `pages/` and `components/`. "Reservation price" was left out because it appears only on the marketing Landing page.
*Verification:* `tsc -b`, eslint clean · `vitest` 214/214 (3 new in `glossary.test.ts`) · Chromium founder 1440 and 390 (drawer), and buyer 1440: the dialog opens with focus inside and shows 25 terms; searching "letter of" finds LOI only; a search with no match says so; Escape closes it; axe 0 on the dialog.

### O4 — Page purpose and next step
*Closed by:* `lib/page-guide.ts` (new: one sentence per route on what the page is for, plus the usual next page; founder and buyer wording where a route is shared — Acquisition Radar, Deal Room, Acquisition Intelligence next step, NDA / Access Requests, Deal Activity, Marketplace; buyer profiles matched by the `/console/buyer/` prefix). The sentences were written from each page's audit and closure log, so they describe the pages as they are now: the Deal Room says simulated, Outreach Plan says nothing is sent, Diligence says checks on the profile. `components/PageTip.tsx` (new) is the bar. The next link uses the page's existing menu label, appears only when the role can open that page, and shows "(needs <engagement>)" when it is plan-gated. The bar is not shown on a gated page, where the upgrade screen renders instead. `components/Shell.tsx` renders the bar above the page content, with "Hide page tips" and a "Show page tips" button in the sidebar foot (`tipsHidden` in `exitos.guide.v1`). Upgrade has no tip. No page file changed.
*Verification:* `tsc -b`, eslint clean · `vitest` 217/217 (3 new in `page-guide.test.ts`: every menu page has a purpose for each role that sees it; every next page can be opened by that role; 40 routes covered, Upgrade excluded) · Chromium founder free: Terminal → "Next: Value My Company", Readiness → "Next: Enterprise Value", buyer profile → "Next: Outreach Plan (needs Preparation or Active Mandate)", Outreach Plan (gated) shows no tip; hide and show work · buyer free: Buyer Home → "Next: Browse Opportunities", Browse Opportunities → "Next: Acquisition Radar" · Readiness (founder free), buyer profile, and buyer Browse Opportunities at 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus.

*Follow-up:* the Deal Room purpose said "what a live process will report". It now says "a real sale process", so the console's no-live-wording rule holds; the full sweep found the word only there among the new texts.

### O5 — First-visit welcome
*Closed by:* `lib/onboarding.ts` (`welcomed` in `exitos.guide.v1`, `setWelcomed`) and `components/StartHere.tsx`. Until it is dismissed, the guide opens with one welcome line: "Welcome to ExitOS. If you are new, follow these steps in order. Start with step 1: your figures then replace the demo company on every page. Unfamiliar words? Open Plain-language terms in the menu." Buyers see the same line without the step-1 sentence. A "Got it" button dismisses it for good in this browser; the guide itself stays as the user left it. No "selling or buying?" question was added, because the role is already chosen at sign-in.
*Verification:* `tsc -b`, eslint clean · `vitest` 218/218 (1 new) · Chromium founder 1440 and 390, and buyer 1440: the welcome line is shown, axe 0 on the guide; after Got it and moving to another page and back, the line is gone and the guide stays.

---

## Owner decisions
- **Three navigation systems: keep all three** (owner, 2026-10-12: "keep all three"). No change.
- **Task-style page names: yes** (owner, 2026-10-12). Done as O6.

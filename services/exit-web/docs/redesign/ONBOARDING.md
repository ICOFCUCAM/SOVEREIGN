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
| O2 | **38-entry menu.** | Founders see an **Essentials** list first (Home, Value My Company, Readiness, Enterprise Value, Buyer Profiles, Acquisition Radar, Anonymous Listings, Inbox), with every other entry under **All tools** (collapsed, grouped exactly as today). The choice is remembered in this browser. The current page is always visible: opening a page outside Essentials expands All tools. Buyers and operators keep the full list (7 and 2 entries; superadmins 40). No entry, label, route, lock or gate changes. | ☑ O2-commit |
| O3 | **Unexplained terms.** | A plain-language glossary (`lib/glossary.ts`) and a "Terms" panel reachable from the sidebar: one-sentence meanings for the terms listed above. Page text is not rewritten. | ☐ |
| O4 | **No purpose line or next step.** | A slim bar under the layer navigation: "What this page is for" (one sentence) and "Next: <page> →". Driven by one map keyed by route, so no page file changes; can be hidden for all pages at once. | ☐ |
| O5 | **No first-visit welcome.** | The role is already chosen at sign-in (founder or buyer), so a "selling or buying?" question would repeat it. Instead, on the first visit the Start-here guide opens expanded with one welcome sentence; after that it stays as the user left it. | ☐ |

Out of scope (owner decision, not changed here): renaming pages; merging or removing the Command Layers bar or sub-nav. Both would change existing content or features. Listed as open decisions below.

---

## Closure log

### O1 — Start-here guide
*Closed by:* `lib/onboarding.ts` (new: the steps, pages opened in this browser, hidden flag; key `exitos.guide.v1`), `components/StartHere.tsx` (new), `components/Shell.tsx` (records the opened page; a plan-gated page shows the upgrade screen instead, so it is not counted; "Show the Start-here guide" in the sidebar foot when hidden), `pages/Terminal.tsx` and `pages/BuyerPortal.tsx` (one line each: the guide under the page header). Founder steps: Value my company (Done when figures are saved) → Check readiness → See your value → Find buyers (Buyer Profiles) → Plan outreach. Buyer steps: Browse opportunities → Request an NDA or make an offer (Acquisition Radar) → Follow your requests → Work the deal. The first step not yet done or opened is marked "Next"; a step behind a plan shows "Needs <engagement>" from `requiredEngagement`. A foot line states what Done and Opened mean and that progress stays in this browser. No page text changed.
*Verification:* `tsc -b`, eslint clean · `vitest` 211/211 (5 new in `onboarding.test.ts`) · Chromium founder free: guide shown, step 1 "Next", step 5 "Needs Preparation or Active Mandate"; open Check readiness and return → step 2 "Opened"; Hide guide → gone, sidebar link shown → guide back · buyer free: four steps, steps 3–4 "Needs Active Mandate", same hide/show · Terminal (founder free/Pro) and Buyer Home (buyer free/Pro) 1440/390: 0 errors, `h1` 1, no overflow, axe 0, all tab stops with visible focus.

---

## Open decisions for the owner
- **Three navigation systems.** Keep the sidebar, the Command Layers bar and the sub-nav, or drop one? Today they group the same pages differently.
- **Task-style page names.** For example, "Intelligence Terminal" → "Home", "Liquidity Command" → "Exit overview". This would change content, so it was not done.

### O2 — Shorter founder menu
*Closed by:* `components/Shell.tsx` and `lib/onboarding.ts` (`ESSENTIALS`, the remembered open/closed state under `exitos.nav.v1`). Founders see **Essentials**: the eight existing entries Intelligence Terminal, Value My Company, Readiness, Enterprise Value, Buyer Profiles, Acquisition Radar, Anonymous Listings, Inbox, with their labels unchanged (the register's "Home" meant the Intelligence Terminal entry; it was not renamed). Below them is an **All tools (30)** button (`aria-expanded`, `aria-controls`) that shows the other 30 entries, grouped exactly as before. Opening a page that is only under All tools expands it, so the current page is always visible. Buyers (7), admins (2) and superadmins (40) keep the full list. The item markup was moved into one `renderItem` function; it is unchanged, with the same links, locks and the upgrade redirect for locked entries.
*Verification:* `tsc -b`, eslint clean · `vitest` 211/211 · Chromium founder free 1440 and 390 (drawer): 8 visible links, All tools → 38, axe 0 on the sidebar open and closed; navigating to Market Map expands All tools with the current entry visible; the state survives a reload · buyer free 1440/390: unchanged 7 links, no All tools button, axe 0 · Market Map Pro 1440/390: 0 errors, `h1` 1, no overflow, axe 0.

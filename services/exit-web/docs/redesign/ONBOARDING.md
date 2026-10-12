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
  - The sidebar: **40 entries for founders**, in seven groups (Mandate 12, Market Intelligence 11, Exchange 14, Wealth 1, plus admin for operators). Buyers see 9, admins 2.
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
| O1 | **No starting point.** | A "Start here" guide at the top of the founder home: five steps in order — Value my company → Check readiness → See your value → Find buyers → Plan outreach. Step 1 is ticked only when figures are saved; steps 2–5 show "Opened" once the page has been opened in this browser. Locked steps show the engagement they need. A buyer version on Buyer Home: Browse opportunities → Acquisition intelligence → Request access → Deal Room. Can be hidden; "Show the guide" in the sidebar brings it back. Stored in this browser only. | ☐ |
| O2 | **40-entry menu.** | Founders see an **Essentials** list first (Home, Value My Company, Readiness, Enterprise Value, Buyer Profiles, Acquisition Radar, Anonymous Listings, Inbox), with every other entry under **All tools** (collapsed, grouped exactly as today). The choice is remembered in this browser. The current page is always visible: opening a page outside Essentials expands All tools. Buyers and operators keep the full list (9 and 2 entries). No entry, label, route, lock or gate changes. | ☐ |
| O3 | **Unexplained terms.** | A plain-language glossary (`lib/glossary.ts`) and a "Terms" panel reachable from the sidebar: one-sentence meanings for the terms listed above. Page text is not rewritten. | ☐ |
| O4 | **No purpose line or next step.** | A slim bar under the layer navigation: "What this page is for" (one sentence) and "Next: <page> →". Driven by one map keyed by route, so no page file changes; can be hidden for all pages at once. | ☐ |
| O5 | **No first-visit welcome.** | The role is already chosen at sign-in (founder or buyer), so a "selling or buying?" question would repeat it. Instead, on the first visit the Start-here guide opens expanded with one welcome sentence; after that it stays as the user left it. | ☐ |

Out of scope (owner decision, not changed here): renaming pages; merging or removing the Command Layers bar or sub-nav. Both would change existing content or features. Listed as open decisions below.

---

## Closure log

---

## Open decisions for the owner
- **Three navigation systems.** Keep the sidebar, the Command Layers bar and the sub-nav, or drop one? Today they group the same pages differently.
- **Task-style page names.** For example, "Intelligence Terminal" → "Home", "Liquidity Command" → "Exit overview". This would change content, so it was not done.

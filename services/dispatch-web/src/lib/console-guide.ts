// What each console page is for, in plain words: the menu's task name (the page keeps its own title,
// shown under the task name), a one-line summary for the menu's hover card and the page guide, and the
// page that usually comes next. Display only — which pages a principal may open is decided by their
// scopes, exactly as before; a "next" page is offered only when the principal holds its scope.

export interface PageGuide {
  /** Task name in the menu. */
  readonly task: string;
  /** What the page is, in one sentence. */
  readonly summary: string;
  /** The page that usually follows, and the scope it needs. */
  readonly next?: { readonly to: string; readonly scope?: string };
}

export const PAGE_GUIDE: Readonly<Record<string, PageGuide>> = {
  // ── Operations ────────────────────────────────────────────────
  "/console": { task: "My desk", summary: "What is waiting for you today, your institution's governance standing and where every record stands.", next: { to: "/console/review", scope: "dispatch:approve" } },
  "/console/create": { task: "Write a new record", summary: "Choose the record type, write it, see who must approve it and who may publish it, then submit it for governance.", next: { to: "/console/library", scope: "dispatch:read" } },
  "/console/review": { task: "Records to decide", summary: "Records waiting for your decision. Approve, return or reject each one; you can never approve a record you submitted.", next: { to: "/console/library", scope: "dispatch:read" } },
  "/console/library": { task: "Find a record", summary: "Every official record you are cleared to see, with its stage, the authority that holds it and how long it is kept.", next: { to: "/console/audit", scope: "dispatch:audit" } },
  "/console/archives": { task: "Archived records", summary: "Records that finished their lifecycle and are sealed for preservation under your retention rules.", next: { to: "/console/audit", scope: "dispatch:audit" } },
  "/console/audit": { task: "Audit trail", summary: "Every governance act on every record, in order, read-only. Use it to show who did what, and when." },
  "/console/polished": { task: "Personal documents", summary: "A separate studio for CVs, cover letters and books. It is outside the official record process." },
  // ── Administration ────────────────────────────────────────────
  "/admin/welcome": { task: "Get started", summary: "Six steps from an empty account to an institution that issues official records, each ticked off from your live set-up.", next: { to: "/admin/setup", scope: "dispatch:admin" } },
  "/admin": { task: "Overview", summary: "Your institution's account at a glance: credentials, plan, integrations and where its data lives.", next: { to: "/admin/setup", scope: "dispatch:admin" } },
  "/admin/setup": { task: "Set up your institution", summary: "A step-by-step setup: departments, offices, approval rules, people and who holds which office.", next: { to: "/admin/authority", scope: "dispatch:admin" } },
  "/admin/authority": { task: "People & offices", summary: "Your departments, the offices in them and who holds each office now, and each person's invitation to sign in. Authority belongs to the office, not the person.", next: { to: "/admin/governance", scope: "dispatch:admin" } },
  "/admin/governance": { task: "Approval rules", summary: "Who must approve each type of record, in what order, who may publish it and how long it is kept.", next: { to: "/admin/monitor", scope: "dispatch:read" } },
  "/admin/monitor": { task: "Work in progress", summary: "Every record in flight: who must act next and what is blocked.", next: { to: "/admin/intelligence", scope: "dispatch:read" } },
  "/admin/compliance": { task: "Compliance proof", summary: "Proof that each record was published and preserved as its approval rules require." },
  "/admin/intelligence": { task: "Delays & bottlenecks", summary: "Where approvals slow down, which office is the constraint, who is overloaded and what is about to breach a deadline." },
  "/admin/access": { task: "API keys & sign-in", summary: "Let your own systems use Dispatch with API keys and webhooks, and connect your institution's identity provider for single sign-on.", next: { to: "/admin/integrations" } },
  "/admin/intake": { task: "Submit by API payload", summary: "A technical intake for integrators: submit a prepared record payload directly, through the same approval process." },
  "/admin/publishing": { task: "Website content engine", summary: "The engine that writes and translates the public website's pages. It does not touch official records." },
  "/admin/integrations": { task: "Connected systems", summary: "The identity, directory, document and archive systems Dispatch is connected to, and who uses the API." },
  "/admin/trust": { task: "Trust centre", summary: "The security and assurance evidence you can show to an auditor or a procurement team." },
  "/admin/deployment": { task: "Where it runs", summary: "How and where this deployment is hosted." },
  "/admin/sovereignty": { task: "Where data lives", summary: "Where your data is stored, who holds the keys and which identity providers are trusted." },
  "/admin/resilience": { task: "Backup & recovery", summary: "Backups, recovery targets and what happens if a region fails." },
  "/admin/evidence": { task: "Evaluation pack", summary: "The documents an evaluator or procurement team needs, gathered in one place." },
  "/evaluate": { task: "Executive evaluation", summary: "The evaluation workspace for decision-makers, opened in its own window." },
};

/** The guide for a route, matching the longest registered prefix (a record file falls under the register). */
export function guideFor(pathname: string): PageGuide | undefined {
  if (/^\/console\/documents\//.test(pathname)) return { task: "Record file", summary: "One record: its content, its stage, the approvals it has and needs, and its evidence.", next: { to: "/console/audit", scope: "dispatch:audit" } };
  const path = pathname.replace(/\/+$/, "") || "/";
  if (PAGE_GUIDE[path]) return PAGE_GUIDE[path];
  const hit = Object.keys(PAGE_GUIDE).filter((k) => k !== "/console" && k !== "/admin" && path.startsWith(k + "/")).sort((a, b) => b.length - a.length)[0];
  return hit ? PAGE_GUIDE[hit] : undefined;
}

/** Each permission in plain words. Unknown permissions are shown as they are. */
export const SCOPE_MEANING: Readonly<Record<string, string>> = {
  "dispatch:read": "See official records",
  "dispatch:render": "Write records and submit them for approval",
  "dispatch:approve": "Approve, return or reject records in review",
  "dispatch:publish": "Publish approved records",
  "dispatch:audit": "Read the audit trail",
  "dispatch:validate": "Check a record before it is submitted",
  "dispatch:admin": "Administer the institution's account",
  "dispatch:platform": "Operate the platform",
};
export const scopeMeaning = (s: string): string => SCOPE_MEANING[s] ?? s;

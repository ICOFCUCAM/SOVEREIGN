// Access policy — the single source of truth for who can see what. Roles
// (founder / buyer / admin / superadmin) and subscription plans (free / pro)
// gate both the navigation and the routes. Free founders and buyers can watch
// the read-only surfaces but must upgrade to act — the high-value "do" surfaces
// (Chief Investment Banker, Autonomous Exit, negotiation, diligence, closing,
// WealthOS …) are pro-only. Admin/superadmin bypass the subscription gate.

export type Role = "founder" | "buyer" | "admin" | "superadmin";
// free  — watch the read-only surfaces
// starter ($99) — upload, get valued, get listed and run Autonomous Exit up to
//   the point buyers are found; communication + execution stay locked
// prep ($499) — full acquisition-readiness suite (documents, diligence,
//   data room, discovery) ahead of a live process; engage/close stay Pro
// pro   — the full transaction desk
export type Plan = "free" | "starter" | "prep" | "pro";

export interface NavItem {
  to: string;
  label: string;      // task-style menu name
  name?: string;      // the page's own name, shown under a renamed entry
  group: string;
  roles: Role[];     // which roles see this item
  pro?: boolean;     // requires a paid subscription (founders/buyers)
  starter?: boolean; // a pro surface that the $99 starter plan also unlocks
}

export const NAV: NavItem[] = [
  // ── Founder · Overview ─────────────────────────────────────────
  { to: "/console/commander",          label: "Recommended Actions", name: "Chief Investment Banker", group: "Mandate", roles: ["founder"], pro: true },
  { to: "/console",                    label: "Home", name: "Intelligence Terminal", group: "Mandate", roles: ["founder"] },
  { to: "/console/intake",             label: "Value My Company",     group: "Mandate", roles: ["founder"] },
  { to: "/console/company-story",      label: "Company Story",        group: "Mandate", roles: ["founder"] },
  { to: "/console/command",            label: "Exit Overview", name: "Liquidity Command",    group: "Mandate", roles: ["founder"] },
  { to: "/console/autopilot",          label: "Simulate My Exit", name: "Autonomous Exit",      group: "Mandate", roles: ["founder"], pro: true, starter: true },
  { to: "/console/buyer-graph",        label: "Search All Acquirers", name: "Buyer Graph",          group: "Market Intelligence", roles: ["founder"], pro: true, starter: true },
  { to: "/console/market-map",         label: "Explore the Market", name: "Market Map",           group: "Market Intelligence", roles: ["founder"], pro: true, starter: true },
  { to: "/console/knowledge-graph",    label: "Search Past Deals", name: "Knowledge Graph",      group: "Market Intelligence", roles: ["founder"], pro: true, starter: true },
  { to: "/console/outcomes",           label: "See Deal Outcomes", name: "Outcome Intelligence", group: "Market Intelligence", roles: ["founder"], pro: true, starter: true },
  { to: "/console/indexes",            label: "Compare Sectors", name: "Acquisition Indexes",  group: "Market Intelligence", roles: ["founder"], pro: true, starter: true },
  { to: "/console/acquisition-radar",  label: "Scan Listed Companies", name: "Acquisition Radar",    group: "Market Intelligence", roles: ["founder", "buyer"] },
  { to: "/console/engagement-registry", label: "Check Buyer Engagement", name: "Engagement Registry",  group: "Market Intelligence", roles: ["founder"], pro: true, starter: true },
  { to: "/console/network",            label: "About Our Data", name: "Network Intelligence", group: "Market Intelligence", roles: ["founder"], pro: true },

  // ── Buyer · Overview ───────────────────────────────────────────
  { to: "/console/buyer-portal",       label: "Home", name: "Buyer Home",           group: "Overview", roles: ["buyer"] },

  // ── Prepare (founder) ──────────────────────────────────────────
  { to: "/console/valuation",          label: "See My Value", name: "Enterprise Value",     group: "Mandate", roles: ["founder"] },
  { to: "/console/readiness",          label: "Check Readiness", name: "Readiness",            group: "Mandate", roles: ["founder"] },
  { to: "/console/diligence-ai",       label: "Prepare for Diligence", name: "Diligence",            group: "Mandate", roles: ["founder"], pro: true, starter: true },
  { to: "/console/investors",          label: "Manage Cap Table", name: "Cap Table",            group: "Mandate", roles: ["founder"] },
  { to: "/console/exit-timing",        label: "Choose When to Sell", name: "Exit Timing",          group: "Mandate", roles: ["founder"], pro: true },

  // ── Discover (founder) ─────────────────────────────────────────
  { to: "/console/buyer-copilot",      label: "Compare Top Buyers", name: "Buyer Intelligence",   group: "Market Intelligence", roles: ["founder"], pro: true, starter: true },
  { to: "/console/buyers",             label: "Find Buyers", name: "Buyer Profiles",       group: "Market Intelligence", roles: ["founder"] },
  { to: "/console/marketplace",        label: "List My Company", name: "Anonymous Listings",   group: "Exchange", roles: ["founder"] },
  // a counterparty's own NDA and transaction actions are free on every plan (O-17); the server decides what each party may do
  { to: "/console/deals",              label: "Your NDAs and Transactions", name: "Your Deals", group: "Exchange", roles: ["founder"] },
  { to: "/console/intelligence",       label: "Rank Buyers by Fit", name: "Acquisition Intelligence", group: "Market Intelligence", roles: ["founder"] },

  // ── Engage (founder) ───────────────────────────────────────────
  { to: "/console/banker",             label: "Write to Buyers", name: "Outreach",             group: "Exchange", roles: ["founder"], pro: true },
  { to: "/console/nda",                label: "Manage NDAs", name: "NDA Vault",            group: "Exchange", roles: ["founder"], pro: true },
  { to: "/console/inbox",              label: "Inbox",                group: "Exchange", roles: ["founder"] },
  { to: "/console/pipeline",           label: "Track Deals", name: "Active Processes",     group: "Exchange", roles: ["founder"] },
  { to: "/console/activity",           label: "Review Activity", name: "Deal Activity",        group: "Exchange", roles: ["founder", "buyer"] },
  { to: "/console/outreach-plan",      label: "Plan Outreach", name: "Outreach Plan",        group: "Exchange", roles: ["founder"], pro: true, starter: true },
  { to: "/console/process-intel",      label: "Track the Buyer Funnel", name: "Process Intelligence", group: "Exchange", roles: ["founder"], pro: true },
  { to: "/console/deal-room",          label: "Preview the Deal Room", name: "Deal Room",            group: "Exchange", roles: ["founder"], pro: true },

  // ── Negotiate (founder) ────────────────────────────────────────
  { to: "/console/negotiator",         label: "Compare Offers", name: "Bid Room",             group: "Exchange", roles: ["founder"], pro: true },
  { to: "/console/simulator",          label: "Test Scenarios", name: "Scenario Simulator",   group: "Exchange", roles: ["founder"], pro: true },

  // ── Close (founder) ────────────────────────────────────────────
  { to: "/console/closing",            label: "Close the Deal", name: "Closing Center",       group: "Exchange", roles: ["founder"], pro: true },
  { to: "/console/data-room",          label: "Build the Data Room", name: "Data Room",            group: "Mandate", roles: ["founder"], pro: true, starter: true },
  { to: "/console/documents",          label: "Generate Documents", name: "Documents",            group: "Mandate", roles: ["founder"], pro: true, starter: true },
  { to: "/console/closing#signatures", label: "Track Signatures", name: "Signatures",           group: "Exchange", roles: ["founder"], pro: true },
  { to: "/console/closing#escrow",     label: "Track Escrow", name: "Escrow",               group: "Exchange", roles: ["founder"], pro: true },

  // ── Wealth (founder) ───────────────────────────────────────────
  { to: "/console/wealth",             label: "Plan After the Sale", name: "Liquidity & Transition", group: "Wealth", roles: ["founder"], pro: true },

  // ── Buyer · Marketplace ────────────────────────────────────────
  { to: "/console/marketplace",        label: "Browse Opportunities", group: "Marketplace", roles: ["buyer"] },
  { to: "/console/intelligence",       label: "Research Acquirers", name: "Acquisition Intelligence", group: "Marketplace", roles: ["buyer"] },
  // ── Buyer · Deals ──────────────────────────────────────────────
  { to: "/console/deals",              label: "Your NDAs and Transactions", name: "Your Deals", group: "Deals", roles: ["buyer"] },
  { to: "/console/deal-room",          label: "Open the Deal Room", name: "Deal Room",            group: "Deals", roles: ["buyer"], pro: true },
  { to: "/console/nda",                label: "Track Access Requests", name: "Access Requests",      group: "Deals", roles: ["buyer"], pro: true },

  // ── Admin ──────────────────────────────────────────────────────
  { to: "/console/admin",              label: "Admin Console",        group: "Admin", roles: ["admin"] },
  { to: "/console/calibration",        label: "Calibration",          group: "Admin", roles: ["admin"] },
];

export const GROUP_ORDER = ["Mandate", "Market Intelligence", "Exchange", "Wealth", "Overview", "Marketplace", "Deals", "Admin"];

const base = (to: string): string => to.split("#")[0];

// Items shown in the sidebar for a role. Superadmin sees the founder console
// plus the admin tools (not the buyer duplicates) — a clean superset.
export function navForRole(role: Role): NavItem[] {
  if (role === "superadmin") return NAV.filter((n) => n.roles.includes("founder") || n.roles.includes("admin"));
  return NAV.filter((n) => n.roles.includes(role));
}

function entryFor(path: string, role: Role): NavItem | undefined {
  const p = base(path);
  if (role === "superadmin") return NAV.find((n) => base(n.to) === p);
  return NAV.find((n) => base(n.to) === p && n.roles.includes(role));
}

// Routes always reachable regardless of policy.
// /console/reviews: any signed-in account; the server decides who is an authorised reviewer
const OPEN_PATHS = new Set(["/console/upgrade", "/console/reviews"]);

export function canAccess(path: string, role: Role): boolean {
  if (role === "superadmin") return true;
  if (OPEN_PATHS.has(base(path))) return true;
  return !!entryFor(path, role);
}

export function needsUpgrade(path: string, role: Role, plan: Plan): boolean {
  if (role === "admin" || role === "superadmin") return false;
  if (plan === "pro") return false;
  const e = entryFor(path, role);
  if (!e?.pro) return false;
  // Starter and Prep unlock the prepare/list/discover surfaces; the
  // engage/negotiate/close surfaces stay Pro-only.
  if ((plan === "starter" || plan === "prep") && e.starter) return false;
  return true;
}

// Institutional engagement ladder. The gating keys (free/starter/prep/pro)
// are unchanged; these are the founder-facing labels — prep backs
// "Preparation", pro backs "Active Mandate". starter is a retired key folded
// into the free "Listed Founder" entry point.
export const PLAN_LABEL: Record<Plan, string> = { free: "Listed Founder", starter: "Listed Founder", prep: "Preparation", pro: "Active Mandate" };
export const PLAN_PRICE: Record<Plan, string> = { free: "$0", starter: "$0", prep: "$995 one-time", pro: "$995/mo + 2.5%" };

export function featureLabel(path: string, role: Role): string | undefined {
  const p = base(path);
  const e = NAV.find((n) => base(n.to) === p && (role === "superadmin" || n.roles.includes(role)));
  return e?.label;
}

export function homeFor(role: Role): string {
  switch (role) {
    case "buyer": return "/console/buyer-portal";
    case "admin": return "/console/admin";
    default: return "/console";
  }
}

export const ROLE_LABEL: Record<Role, string> = {
  founder: "Founder", buyer: "Buyer", admin: "Admin", superadmin: "Superadmin",
};

/** The engagement a destination requires for this role/plan, in founder-
 *  facing words — or null when it is already open. Display only: the route
 *  Guard still enforces access. */
export function requiredEngagement(path: string, role: Role, plan: Plan): string | null {
  if (!needsUpgrade(path, role, plan)) return null;
  const p = base(path);
  const e = NAV.find((n) => base(n.to) === p && (role === "superadmin" || n.roles.includes(role)));
  return e?.starter ? `${PLAN_LABEL.prep} or ${PLAN_LABEL.pro}` : PLAN_LABEL.pro;
}

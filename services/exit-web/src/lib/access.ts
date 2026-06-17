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
  label: string;
  group: string;
  roles: Role[];     // which roles see this item
  pro?: boolean;     // requires a paid subscription (founders/buyers)
  starter?: boolean; // a pro surface that the $99 starter plan also unlocks
}

export const NAV: NavItem[] = [
  // ── Founder · Overview ─────────────────────────────────────────
  { to: "/console/commander",          label: "Chief Investment Banker", group: "Mandate", roles: ["founder"], pro: true },
  { to: "/console",                    label: "Intelligence Terminal", group: "Mandate", roles: ["founder"] },
  { to: "/console/command",            label: "Liquidity Command",    group: "Mandate", roles: ["founder"] },
  { to: "/console/autopilot",          label: "Autonomous Exit",      group: "Mandate", roles: ["founder"], pro: true, starter: true },
  { to: "/console/buyer-graph",        label: "Buyer Graph",          group: "Market Intelligence", roles: ["founder"], pro: true, starter: true },
  { to: "/console/market-map",         label: "Market Map",           group: "Market Intelligence", roles: ["founder"], pro: true, starter: true },
  { to: "/console/knowledge-graph",    label: "Knowledge Graph",      group: "Market Intelligence", roles: ["founder"], pro: true, starter: true },
  { to: "/console/network",            label: "Network Intelligence", group: "Market Intelligence", roles: ["founder"], pro: true },

  // ── Buyer · Overview ───────────────────────────────────────────
  { to: "/console/buyer-portal",       label: "Buyer Home",           group: "Overview", roles: ["buyer"] },

  // ── Prepare (founder) ──────────────────────────────────────────
  { to: "/console/valuation",          label: "Enterprise Value",     group: "Mandate", roles: ["founder"] },
  { to: "/console/readiness",          label: "Readiness",            group: "Mandate", roles: ["founder"] },
  { to: "/console/diligence-ai",       label: "Diligence",            group: "Mandate", roles: ["founder"], pro: true, starter: true },
  { to: "/console/investors",          label: "Cap Table",            group: "Mandate", roles: ["founder"] },
  { to: "/console/exit-timing",        label: "Exit Timing",          group: "Mandate", roles: ["founder"], pro: true },

  // ── Discover (founder) ─────────────────────────────────────────
  { to: "/console/buyer-copilot",      label: "Buyer Intelligence",   group: "Market Intelligence", roles: ["founder"], pro: true, starter: true },
  { to: "/console/buyers",             label: "Buyer Profiles",       group: "Market Intelligence", roles: ["founder"] },
  { to: "/console/marketplace",        label: "Anonymous Listings",   group: "Exchange", roles: ["founder"] },
  { to: "/console/intelligence",       label: "Acquisition Radar",    group: "Market Intelligence", roles: ["founder"] },

  // ── Engage (founder) ───────────────────────────────────────────
  { to: "/console/banker",             label: "Outreach",             group: "Exchange", roles: ["founder"], pro: true },
  { to: "/console/nda",                label: "NDA Vault",            group: "Exchange", roles: ["founder"], pro: true },
  { to: "/console/pipeline",           label: "Active Processes",     group: "Exchange", roles: ["founder"] },
  { to: "/console/deal-room",          label: "Live Deal Room",       group: "Exchange", roles: ["founder"], pro: true },

  // ── Negotiate (founder) ────────────────────────────────────────
  { to: "/console/negotiator",         label: "Bid Room",             group: "Exchange", roles: ["founder"], pro: true },
  { to: "/console/simulator",          label: "Scenario Simulator",   group: "Exchange", roles: ["founder"], pro: true },

  // ── Close (founder) ────────────────────────────────────────────
  { to: "/console/closing",            label: "Closing Center",       group: "Exchange", roles: ["founder"], pro: true },
  { to: "/console/data-room",          label: "Data Room",            group: "Mandate", roles: ["founder"], pro: true, starter: true },
  { to: "/console/documents",          label: "Documents",            group: "Mandate", roles: ["founder"], pro: true, starter: true },
  { to: "/console/closing#signatures", label: "Signatures",           group: "Exchange", roles: ["founder"], pro: true },
  { to: "/console/closing#escrow",     label: "Escrow",               group: "Exchange", roles: ["founder"], pro: true },

  // ── Wealth (founder) ───────────────────────────────────────────
  { to: "/console/wealth",             label: "Liquidity & Transition", group: "Wealth", roles: ["founder"], pro: true },

  // ── Buyer · Marketplace ────────────────────────────────────────
  { to: "/console/marketplace",        label: "Browse Opportunities", group: "Marketplace", roles: ["buyer"] },
  { to: "/console/intelligence",       label: "Acquisition Radar",    group: "Marketplace", roles: ["buyer"] },
  // ── Buyer · Deals ──────────────────────────────────────────────
  { to: "/console/deal-room",          label: "Deal Room",            group: "Deals", roles: ["buyer"], pro: true },
  { to: "/console/nda",                label: "Access Requests",      group: "Deals", roles: ["buyer"], pro: true },

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
const OPEN_PATHS = new Set(["/console/upgrade"]);

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

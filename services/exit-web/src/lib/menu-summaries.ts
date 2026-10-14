import { requiredEngagement, type Role } from "./access";
import { pageGuide } from "./page-guide";

// ── MENU SUMMARIES ──────────────────────────────────────────────────
// What a menu entry is for, shown when the pointer rests on it (or it takes keyboard focus, or its ⓘ is
// tapped on a touch screen): one line on what it does, whether what it shows is real, a preview or a
// simulation, and the plan it needs. The five desks people mix up have their own summaries; every other
// entry uses the page's own one-line purpose from the page guide.

export type SummaryKind = "Real" | "Preview" | "Simulation" | "Planning";

export interface MenuSummary {
  readonly what: string;
  readonly kind?: SummaryKind;
  /** the plan that opens it, in the product's own plan names */
  readonly plan: string;
}

const DESKS: Record<string, { what: string | { founder: string; buyer: string }; kind: SummaryKind }> = {
  "/console/journey": {
    what: {
      founder: "Your map: every step of the sale, in order, with Back and Next on every page. A step is ticked only when it has really happened.",
      buyer: "Your map: every step of buying a company, in order, with Back and Next on every page. A step is ticked only when it has really happened.",
    },
    kind: "Real" },
  "/console/commander": {
    what: "Your adviser's briefing: what the company is worth, the odds of a sale, which buyers are circling, and the one next thing to do.",
    kind: "Real" },
  "/console/autopilot": {
    what: "A rehearsal of the whole sale: eight specialists prepare valuation, buyers, outreach, data room, diligence, negotiation, closing and wealth, and you approve one decision at a time.",
    kind: "Simulation" },
  "/console/banker": {
    what: "Your outreach desk: ranks buyers, drafts the teaser and warm introductions, and tracks who has been approached. Send introduction opens the draft in your e-mail app.",
    kind: "Preview" },
  "/console/wealth": {
    what: "After the money arrives: proceeds after tax, trusts, family office and reinvesting.",
    kind: "Planning" },
};

const base = (to: string): string => to.split("#")[0]!;

export function menuSummary(to: string, role: Role): MenuSummary | null {
  const path = base(to);
  const side = role === "buyer" ? "buyer" : "founder";
  const plan = requiredEngagement(path, role, "free") ?? "Free";
  const desk = DESKS[path];
  if (desk) return { what: typeof desk.what === "string" ? desk.what : desk.what[side], kind: desk.kind, plan };
  const g = pageGuide(path, role);
  return g ? { what: g.purpose, plan } : null;
}

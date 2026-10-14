import type { Role } from "./access";

// ── PAGE GUIDE ──────────────────────────────────────────────────────
// One plain sentence per console page saying what it is for, and the page
// that usually comes next. Shown in a slim bar above each page; the pages'
// own text is unchanged. Founder and buyer read differently where a route is
// shared.

type ByRole = string | { founder: string; buyer: string };
interface Guide { purpose: ByRole; next?: ByRole }

const G: Record<string, Guide> = {
  "/console": { purpose: "Your company at a glance: its value, likely buyers, readiness and the recommended next action.", next: "/console/intake" },
  "/console/command": { purpose: "Your exit position on one screen: value now and after fixes, how likely a sale is, interested buyers and the process stage.", next: "/console/readiness" },
  "/console/journey": {
    purpose: { founder: "Every step of selling your company, in order, with what is already done.", buyer: "Every step of buying a company, in order, with what is already done." },
    next: { founder: "/console/intake", buyer: "/console/acquisition-radar" } },
  "/console/intake": { purpose: "Enter your company's figures. Every page then uses your company instead of the demo.", next: "/console/company-story" },
  "/console/company-story": { purpose: "Your company's history, products, customers, people, ownership and sources — what a CIM is written from, each figure with its basis.", next: "/console/documents" },
  "/console/acquisition-radar": {
    purpose: { founder: "Listed companies scored against an acquisition mandate: the market as a buyer sees it.", buyer: "Set what you want to buy, see listed companies scored against it, and request an NDA or make an offer." },
    next: { founder: "/console/marketplace", buyer: "/console/nda" } },
  "/console/commander": { purpose: "The mandate overview: value, odds, who is circling and the recommended instruction.", next: "/console/autopilot" },
  "/console/network": { purpose: "What ExitOS's acquisition data covers, and the figures behind it." },
  "/console/autopilot": { purpose: "A guided simulation of a full exit, step by step, with each work product for you to review. Nothing is sent.", next: "/console/readiness" },
  "/console/readiness": { purpose: "How ready your company is for a sale, and which fixes add the most value.", next: "/console/valuation" },
  "/console/exit-timing": { purpose: "When to sell: the recommended window and what waiting is worth.", next: "/console/valuation" },
  "/console/wealth": { purpose: "What you take home after the sale, and when each part is paid." },
  "/console/buyer-copilot": { purpose: "A short file on each top-ranked buyer, and who to approach first.", next: "/console/outreach-plan" },
  "/console/deal-room": {
    purpose: { founder: "Simulated buyer activity in a data room, showing what a real sale process will report.", buyer: "What a deal room will hold, and how access is granted." },
    next: { founder: "/console/negotiator", buyer: "/console/nda" } },
  "/console/intelligence": {
    purpose: "Every ranked acquirer and the evidence behind each ranking.",
    next: { founder: "/console/outreach-plan", buyer: "/console/acquisition-radar" } },
  "/console/data-room": { purpose: "The documents buyers will ask for, what is missing, and uploads. Read who can see uploads before adding files.", next: "/console/diligence-ai" },
  "/console/buyers": { purpose: "Profiles of the buyers most likely to buy your company, with an introduction draft for each.", next: "/console/outreach-plan" },
  "/console/buyer-graph": { purpose: "The acquirer index: who is most likely to buy you, and similar deals in your sector.", next: "/console/buyers" },
  "/console/buyer/": { purpose: "One buyer's record, and how likely it is to buy your company.", next: "/console/outreach-plan" },
  "/console/market-map": { purpose: "Where acquisitions happen across the market, by sector and region. Not specific to your company.", next: "/console/indexes" },
  "/console/knowledge-graph": { purpose: "Search the acquisition index by sector, region, value and year." },
  "/console/outcomes": { purpose: "Which buyers pay the highest premiums and close fastest, and which sectors get the best multiples.", next: "/console/buyer-graph" },
  "/console/indexes": { purpose: "Acquisition activity for each sector: volume, trend, buyers and deal size.", next: "/console/outcomes" },
  "/console/investors": { purpose: "Who owns the company, and what each holder receives from an offer.", next: "/console/wealth" },
  "/console/negotiator": { purpose: "Compare offers, see the recommended response and prepare a counteroffer.", next: "/console/closing" },
  "/console/documents": { purpose: "Generate the sale documents (CIM, teaser and more) from your figures, and check them.", next: "/console/data-room" },
  "/console/nda": {
    purpose: { founder: "Your NDAs with buyers: status, terms and signatures.", buyer: "Your access requests, and whether each was accepted." },
    next: { founder: "/console/data-room", buyer: "/console/deal-room" } },
  "/console/pipeline": { purpose: "Your deals by stage, with each one's estimated chance of closing.", next: "/console/negotiator" },
  "/console/process-intel": { purpose: "How buyers move from first match to NDA, LOI and close.", next: "/console/pipeline" },
  "/console/activity": {
    purpose: "A record of the deal actions taken in ExitOS on this account.",
    next: { founder: "/console/inbox", buyer: "/console/nda" } },
  "/console/inbox": { purpose: "Buyer interest in your listing: NDA requests to sign and offers to accept or decline.", next: "/console/nda" },
  "/console/outreach-plan": { purpose: "Who to approach first, in three waves. A suggested plan: nothing is sent.", next: "/console/banker" },
  "/console/engagement-registry": { purpose: "How likely each indexed buyer is to engage, based on its past behaviour.", next: "/console/outreach-plan" },
  "/console/deals": {
    purpose: "Your NDAs and transactions, free on every plan: sign or verify an NDA, open the files it grants, and work the transaction to completion.",
    next: { founder: "/console/closing", buyer: "/console/marketplace" } },
  "/console/closing": { purpose: "The closing checklist: track each item through to signing.", next: "/console/wealth" },
  "/console/marketplace": {
    purpose: { founder: "List your company anonymously and prepare the pack buyers see.", buyer: "Companies listed for sale, shown anonymously." },
    next: { founder: "/console/inbox", buyer: "/console/acquisition-radar" } },
  "/console/valuation": { purpose: "Your company's value: the range, how it is built, and comparable deals.", next: "/console/buyers" },
  "/console/diligence-ai": { purpose: "Checks on your company profile that a buyer's diligence would raise, with their estimated effect on price.", next: "/console/negotiator" },
  "/console/banker": { purpose: "Your outreach desk: buyer introductions, the teaser and drafts to send yourself.", next: "/console/inbox" },
  "/console/buyer-portal": { purpose: "Your buyer home: your requests and deals, and a demo seat showing the workstation.", next: "/console/marketplace" },
  "/console/calibration": { purpose: "How past valuation predictions compared with real closing prices." },
  "/console/simulator": { purpose: "Set a target and deal terms, then compare scenarios against the expected path.", next: "/console/negotiator" },
  "/console/admin": { purpose: "Platform settings and the user roster." },
};

const pick = (v: ByRole | undefined, role: Role): string | undefined =>
  v === undefined ? undefined : typeof v === "string" ? v : role === "buyer" ? v.buyer : v.founder;

/** The purpose and next page for a path, or null when the page has none. */
export function pageGuide(path: string, role: Role): { purpose: string; next?: string } | null {
  const g = G[path] ?? (path.startsWith("/console/buyer/") ? G["/console/buyer/"] : undefined);
  if (!g) return null;
  return { purpose: pick(g.purpose, role)!, next: pick(g.next, role) };
}

export const PAGE_GUIDE_PATHS: readonly string[] = Object.keys(G);

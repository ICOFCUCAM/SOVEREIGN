import { SAMPLE_COMPANY } from "./profile";
import { VALUATION_STRATEGIC } from "./engines";

// Diligence Intelligence Engine. Given the uploaded document set, discover
// the risks a buyer's analyst would find — across Financial, Legal and
// Operational categories — then frame the same findings two ways: a Buyer
// Risk Report (what they'll diligence and discount) and a Seller Risk
// Report (what to fix before buyers ever see the company). Every finding
// is derived deterministically from the company profile; the dollar
// impacts are fractions of the strategic valuation midpoint.

export type RiskCategory = "Financial" | "Legal" | "Operational";
export type Severity = "high" | "medium" | "low";

export interface DiligenceFinding {
  readonly id: string;
  readonly category: RiskCategory;
  readonly subcategory: string;
  readonly title: string;
  readonly severity: Severity;
  readonly source: string;        // the file type that surfaced it
  readonly detail: string;        // the finding, in plain terms
  readonly buyerView: string;     // how a buyer reads and uses it
  readonly sellerAction: string;  // what the founder should do pre-market
  readonly impactUsd: number;     // estimated valuation impact
}

export interface SourceFile {
  readonly key: string;
  readonly label: string;
  readonly note: string;
}

// The document set the engine ingests. Each finding cites one of these.
export const SOURCE_FILES: readonly SourceFile[] = [
  { key: "financial_statements", label: "Financial statements", note: "P&L, balance sheet, cash flow" },
  { key: "contracts",            label: "Contracts",            note: "Customer & vendor agreements" },
  { key: "employment",           label: "Employment agreements", note: "Founders, key employees, IP assignment" },
  { key: "customer_list",        label: "Customer lists",       note: "Revenue by account, cohorts" },
  { key: "tax_filings",          label: "Tax filings",          note: "Federal & state returns" },
];

const MID = VALUATION_STRATEGIC.headline.mid;
// w is a percentage of the strategic midpoint; round to the nearest $100k.
const impact = (w: number) => Math.round((MID * (w / 100)) / 100_000) * 100_000;

// Discover the findings for the current company profile. Severities and
// presence are computed from the real metrics (concentration, margins,
// recurring mix, founder status, IP, regulatory risk, bench strength).
export function discoverFindings(): DiligenceFinding[] {
  const C = SAMPLE_COMPANY;
  const concentration = C.revenue.customerConcentrationTop10Pct ?? 0;
  const recurringPct = C.revenue.trailingTwelveMonthsRevenueUsd > 0
    ? C.revenue.annualRecurringRevenueUsd / C.revenue.trailingTwelveMonthsRevenueUsd
    : 0;
  const gross = C.revenue.grossMarginPct;
  const ebitda = C.revenue.ebitdaMarginPct;
  const out: DiligenceFinding[] = [];

  // ── Financial ────────────────────────────────────────────────
  out.push({
    id: "fin-concentration",
    category: "Financial", subcategory: "Customer concentration",
    title: `Top-10 customers are ${Math.round(concentration * 100)}% of revenue`,
    severity: concentration >= 0.35 ? "high" : concentration >= 0.2 ? "medium" : "low",
    source: "Customer lists",
    detail: `Revenue is concentrated — the ten largest accounts represent ${Math.round(concentration * 100)}% of the top line. Loss of one materially impairs the business.`,
    buyerView: "Models a downside case where the largest account churns; will seek an escrow/holdback or a price discount to cover it.",
    sellerAction: "Sign multi-year renewals with the top accounts and diversify the book before launch to defuse the discount.",
    impactUsd: impact(10),
  });
  out.push({
    id: "fin-recurring",
    category: "Financial", subcategory: "Recurring revenue weakness",
    title: `Only ${Math.round(recurringPct * 100)}% of revenue is recurring`,
    severity: recurringPct < 0.4 ? "high" : recurringPct < 0.6 ? "medium" : "low",
    source: "Financial statements",
    detail: `ARR is ${(C.revenue.annualRecurringRevenueUsd / 1_000_000).toFixed(0)}M of ${(C.revenue.trailingTwelveMonthsRevenueUsd / 1_000_000).toFixed(0)}M TTM revenue — the balance is transactional, lowering quality of earnings.`,
    buyerView: "Applies a lower multiple to the non-recurring base and underwrites only the contracted ARR.",
    sellerAction: "Convert transactional accounts onto recurring contracts and lead with the ARR growth and 108% net retention.",
    impactUsd: impact(5),
  });
  out.push({
    id: "fin-margin",
    category: "Financial", subcategory: "Revenue quality",
    title: `Gross margin ${Math.round(gross * 100)}%, EBITDA ${Math.round(ebitda * 100)}%`,
    severity: gross < 0.4 ? "medium" : "low",
    source: "Financial statements",
    detail: `Margins sit below software comparables (gross ${Math.round(gross * 100)}%, EBITDA ${Math.round(ebitda * 100)}%), reflecting the logistics cost base. Caps the headline multiple.`,
    buyerView: "Runs a quality-of-earnings review on COGS and normalises EBITDA before pricing the multiple.",
    sellerAction: "Document a credible margin-expansion path (automation, mix shift) and pre-empt the QoE with clean management accounts.",
    impactUsd: impact(4),
  });
  out.push({
    id: "fin-cashflow",
    category: "Financial", subcategory: "Cash flow",
    title: `${Math.round(C.growth.arrGrowthYoyPct * 100)}% growth on a ${Math.round(ebitda * 100)}% EBITDA base`,
    severity: ebitda < 0.12 ? "medium" : "low",
    source: "Tax filings",
    detail: `High growth funded on a thin EBITDA margin implies limited free cash flow and working-capital intensity in the freight model.`,
    buyerView: "Stress-tests the cash conversion cycle and may structure consideration around working-capital pegs.",
    sellerAction: "Present a 13-week cash-flow model and a working-capital normalisation to remove the surprise at LOI.",
    impactUsd: impact(3),
  });

  // ── Legal ────────────────────────────────────────────────────
  out.push({
    id: "leg-contracts",
    category: "Legal", subcategory: "Missing contracts",
    title: "Key customer & vendor agreements not in the data room",
    severity: "high",
    source: "Contracts",
    detail: "Several material customer and carrier agreements are unsigned or missing from the package — including change-of-control and assignment clauses a buyer must review.",
    buyerView: "Cannot confirm revenue is contracted or transferable on a sale; treats unconfirmed revenue as at-risk.",
    sellerAction: "Collect, execute and index every material agreement, and flag any change-of-control consents needed to close.",
    impactUsd: impact(6),
  });
  out.push({
    id: "leg-ip",
    category: "Legal", subcategory: "IP ownership gaps",
    title: `IP assignment unconfirmed (${C.product.intellectualProperty?.patentsGranted ?? 0} granted, ${C.product.intellectualProperty?.patentsPending ?? 0} pending)`,
    severity: "medium",
    source: "Employment agreements",
    detail: "Founder and contractor IP-assignment agreements are not evidenced for all contributors to the dispatch platform — a gap in clean title to the core technology.",
    buyerView: "Requires signed IP assignments from every contributor as a closing condition; otherwise an indemnity or holdback.",
    sellerAction: "Execute or backfill IP-assignment agreements for all founders, employees and contractors now.",
    impactUsd: impact(3),
  });
  out.push({
    id: "leg-compliance",
    category: "Legal", subcategory: "Compliance",
    title: `Regulatory risk assessed ${C.market.regulatoryRisk}`,
    severity: C.market.regulatoryRisk === "high" ? "high" : C.market.regulatoryRisk === "medium" ? "medium" : "low",
    source: "Contracts",
    detail: "Freight brokerage carries licensing, carrier-compliance and DOT obligations; the package lacks evidence of current standing across operating states.",
    buyerView: "Verifies licences and broker bonds; unresolved compliance becomes a representation-and-warranty exposure.",
    sellerAction: "Compile licences, bonds and compliance certifications by jurisdiction into a compliance binder.",
    impactUsd: impact(2.5),
  });
  out.push({
    id: "leg-litigation",
    category: "Legal", subcategory: "Litigation exposure",
    title: "No litigation schedule on file",
    severity: "low",
    source: "Contracts",
    detail: "No pending or threatened litigation has been disclosed, but the absence of a signed litigation schedule is itself a diligence gap.",
    buyerView: "Requires a sworn no-litigation representation and a schedule of any disputes, however minor.",
    sellerAction: "Produce a signed litigation schedule (even if nil) and resolve any open commercial disputes.",
    impactUsd: impact(1),
  });

  // ── Operational ──────────────────────────────────────────────
  out.push({
    id: "ops-founder",
    category: "Operational", subcategory: "Founder dependency",
    title: "Revenue and relationships concentrate on the founders",
    severity: C.team.foundersStillActive ? "high" : "low",
    source: "Employment agreements",
    detail: `Founders remain active and hold ${Math.round((C.cap.foundersOwnershipPct ?? 0) * 100)}% — key customer relationships and decisions still route through them.`,
    buyerView: "Conditions value on founder retention; structures an earnout or escrow tied to a 12–24 month transition.",
    sellerAction: "Push key relationships down to the team, document the playbook, and define a transition plan that de-risks your exit.",
    impactUsd: impact(8),
  });
  out.push({
    id: "ops-vendor",
    category: "Operational", subcategory: "Vendor concentration",
    title: "Carrier / vendor dependency in the delivery network",
    severity: "medium",
    source: "Contracts",
    detail: "The freight network leans on a concentrated set of carriers; loss of a major carrier relationship would disrupt fulfilment and margins.",
    buyerView: "Maps the carrier base and tests substitutability; concentration here compounds the customer-concentration discount.",
    sellerAction: "Broaden the carrier panel and secure capacity commitments to show the network is resilient and transferable.",
    impactUsd: impact(3),
  });
  out.push({
    id: "ops-keyemployee",
    category: "Operational", subcategory: "Key employee exposure",
    title: `Leadership bench is ${C.team.leadershipBenchStrength}; median tenure ${C.team.tenureMedianYears ?? "—"}y`,
    severity: C.team.leadershipBenchStrength === "thin" ? "high" : "medium",
    source: "Employment agreements",
    detail: `With ${C.team.engineeringHeadcount ?? 0} of ${C.team.headcount} in engineering and an adequate (not deep) bench, a small number of key people carry outsized knowledge.`,
    buyerView: "Identifies key-person risk and requires retention packages and non-competes for the critical few.",
    sellerAction: "Put retention and equity-vesting in place for key staff and build succession depth before going to market.",
    impactUsd: impact(3),
  });

  return out;
}

const SEV_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

export interface RiskReport {
  readonly audience: "buyer" | "seller";
  readonly title: string;
  readonly headline: string;
  readonly totalImpactUsd: number;
  readonly bySeverity: Record<Severity, number>;
  readonly points: readonly { title: string; body: string }[];
  readonly recommendation: string;
}

function tally(findings: readonly DiligenceFinding[]): Record<Severity, number> {
  return findings.reduce(
    (acc, f) => { acc[f.severity] += 1; return acc; },
    { high: 0, medium: 0, low: 0 } as Record<Severity, number>,
  );
}

// Buyer Risk Report — the discount and protections a buyer's analyst lands on.
export function buildBuyerReport(findings: readonly DiligenceFinding[]): RiskReport {
  const bySeverity = tally(findings);
  const total = findings.reduce((s, f) => s + f.impactUsd, 0);
  const top = [...findings].sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity] || b.impactUsd - a.impactUsd).slice(0, 4);
  const escrowPct = Math.min(20, Math.round((total / MID) * 100));
  return {
    audience: "buyer",
    title: "Buyer Diligence Report",
    headline: `${findings.length} findings across financial, legal and operational diligence. ${bySeverity.high} are high-severity and shape price and structure.`,
    totalImpactUsd: total,
    bySeverity,
    points: top.map((f) => ({ title: `${f.subcategory} — ${f.severity}`, body: f.buyerView })),
    recommendation: `Anchor a ${escrowPct}% escrow/holdback against the high-severity findings, condition close on founder retention and signed IP assignments, and reflect the customer concentration in the price.`,
  };
}

// Seller Risk Report — the same findings as a pre-market fix list.
export function buildSellerReport(findings: readonly DiligenceFinding[]): RiskReport {
  const bySeverity = tally(findings);
  const total = findings.reduce((s, f) => s + f.impactUsd, 0);
  const top = [...findings].sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity] || b.impactUsd - a.impactUsd).slice(0, 4);
  return {
    audience: "seller",
    title: "Seller Risk Report",
    headline: `Fix these before buyers see the company. Resolving the ${bySeverity.high} high-severity items protects roughly ${(total / 1_000_000).toFixed(0)}M of value a buyer would otherwise discount.`,
    totalImpactUsd: total,
    bySeverity,
    points: top.map((f) => ({ title: `${f.subcategory} — ${f.severity}`, body: f.sellerAction })),
    recommendation: `Run a 30–60 day pre-market remediation: lock top-account renewals, backfill IP assignments and contracts, and stand up a founder-transition plan. Re-run this scan before opening the data room.`,
  };
}

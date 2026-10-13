import { isKnown } from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile";
import { VALUATION_CANONICAL } from "./engines";
import type { CompanyProfile } from "@exit/engines";

// Diligence checks. From the company profile (no document is read), surface
// the risks a buyer's analyst would probe — across Financial, Legal and
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

// The documents a buyer would use to test each check. Each finding names
// one; none of them is uploaded or read by this module.
export const SOURCE_FILES: readonly SourceFile[] = [
  { key: "financial_statements", label: "Financial statements", note: "P&L, balance sheet, cash flow" },
  { key: "contracts",            label: "Contracts",            note: "Customer & vendor agreements" },
  { key: "employment",           label: "Employment agreements", note: "Founders, key employees, IP assignment" },
  { key: "customer_list",        label: "Customer lists",       note: "Revenue by account, cohorts" },
  { key: "tax_filings",          label: "Tax filings",          note: "Federal & state returns" },
];

const MID = VALUATION_CANONICAL.headline.mid;
// Illustrative rule: each finding carries a fixed share (w %) of the
// canonical midpoint, whatever its severity; rounded to the nearest $100k.

// Discover the findings for the current company profile. Severities and
// presence are computed from the real metrics (concentration, margins,
// recurring mix, founder status, IP, regulatory risk, bench strength).
export function discoverFindings(C: CompanyProfile = SAMPLE_COMPANY, mid: number = MID): DiligenceFinding[] {
  const impact = (w: number): number => Math.round((mid * (w / 100)) / 100_000) * 100_000;
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
    sellerAction: `Convert transactional accounts onto recurring contracts and lead with the ARR growth${C.revenue.netRetentionPct != null ? ` and ${Math.round(C.revenue.netRetentionPct * 100)}% net retention` : ""}.`,
    impactUsd: impact(5),
  });
  out.push({
    id: "fin-margin",
    category: "Financial", subcategory: "Revenue quality",
    title: `Gross margin ${Math.round(gross * 100)}%, EBITDA ${Math.round(ebitda * 100)}%`,
    severity: gross < 0.4 ? "medium" : "low",
    source: "Financial statements",
    detail: `Gross margin ${Math.round(gross * 100)}% and EBITDA margin ${Math.round(ebitda * 100)}% — a buyer will compare them with sector peers before setting the multiple.`,
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
    detail: `Growth of ${Math.round(C.growth.arrGrowthYoyPct * 100)}% on a ${Math.round(ebitda * 100)}% EBITDA margin can mean limited free cash flow and working-capital needs — a buyer will test cash conversion.`,
    buyerView: "Stress-tests the cash conversion cycle and may structure consideration around working-capital pegs.",
    sellerAction: "Present a 13-week cash-flow model and a working-capital normalisation to remove the surprise at LOI.",
    impactUsd: impact(3),
  });

  // ── Legal ────────────────────────────────────────────────────
  out.push({
    id: "leg-contracts",
    category: "Legal", subcategory: "Contract coverage",
    title: "Confirm key customer & vendor agreements are in the data room",
    severity: "high",
    source: "Contracts",
    detail: "ExitOS does not check the data room. A buyer will review every material customer and vendor agreement, including change-of-control and assignment clauses; unsigned or missing agreements are a common gap.",
    buyerView: "Cannot confirm revenue is contracted or transferable on a sale; treats unconfirmed revenue as at-risk.",
    sellerAction: "Collect, execute and index every material agreement, and flag any change-of-control consents needed to close.",
    impactUsd: impact(6),
  });
  out.push({
    id: "leg-ip",
    category: "Legal", subcategory: "IP ownership",
    title: `IP assignment unconfirmed (${C.product.intellectualProperty?.patentsGranted ?? 0} granted, ${C.product.intellectualProperty?.patentsPending ?? 0} pending)`,
    severity: "medium",
    source: "Employment agreements",
    detail: "ExitOS cannot see your IP-assignment agreements. A buyer will want signed assignments from every founder, employee and contractor who contributed to the core technology — clean title is a closing condition.",
    buyerView: "Requires signed IP assignments from every contributor as a closing condition; otherwise an indemnity or holdback.",
    sellerAction: "Execute or backfill IP-assignment agreements for all founders, employees and contractors now.",
    impactUsd: impact(3),
  });
  out.push({
    id: "leg-compliance",
    category: "Legal", subcategory: "Compliance",
    title: isKnown(C, "market.regulatoryRisk") ? `Regulatory risk assessed ${C.market.regulatoryRisk}` : "Regulatory standing not yet documented",
    severity: !isKnown(C, "market.regulatoryRisk") ? "medium" : C.market.regulatoryRisk === "high" ? "high" : C.market.regulatoryRisk === "medium" ? "medium" : "low",
    source: "Contracts",
    detail: `${isKnown(C, "market.regulatoryRisk") ? `The company rates its regulatory risk ${C.market.regulatoryRisk}.` : "The company has not yet described its regulatory exposure."} A buyer will verify licences and regulatory standing in every operating jurisdiction; ExitOS holds no evidence of current standing.`,
    buyerView: "Verifies licences and broker bonds; unresolved compliance becomes a representation-and-warranty exposure.",
    sellerAction: "Compile licences, bonds and compliance certifications by jurisdiction into a compliance binder.",
    impactUsd: impact(2.5),
  });
  out.push({
    id: "leg-litigation",
    category: "Legal", subcategory: "Litigation exposure",
    title: "Prepare a litigation schedule",
    severity: "low",
    source: "Contracts",
    detail: "ExitOS holds no litigation information. A buyer will ask for a signed schedule of pending or threatened disputes, even if it is nil.",
    buyerView: "Requires a sworn no-litigation representation and a schedule of any disputes, however minor.",
    sellerAction: "Produce a signed litigation schedule (even if nil) and resolve any open commercial disputes.",
    impactUsd: impact(1),
  });

  // ── Operational ──────────────────────────────────────────────
  out.push({
    id: "ops-founder",
    category: "Operational", subcategory: "Founder dependency",
    title: isKnown(C, "team.foundersStillActive") ? "Revenue and relationships concentrate on the founders" : "Founder dependency not yet assessed",
    severity: !isKnown(C, "team.foundersStillActive") ? "medium" : C.team.foundersStillActive ? "high" : "low",
    source: "Employment agreements",
    detail: isKnown(C, "team.foundersStillActive")
      ? `Founders ${C.team.foundersStillActive ? "remain active" : "are no longer active"}${isKnown(C, "cap") ? ` and hold ${Math.round((C.cap.foundersOwnershipPct ?? 0) * 100)}%` : ""}${C.team.foundersStillActive ? " — a buyer will test how far customer relationships and decisions route through them." : "."}`
      : "The company has not yet said who leads it or what the founders' roles are; a buyer will test how far customer relationships and decisions route through them.",
    buyerView: "Conditions value on founder retention; structures an earnout or escrow tied to a 12–24 month transition.",
    sellerAction: "Push key relationships down to the team, document the playbook, and define a transition plan that de-risks your exit.",
    impactUsd: impact(8),
  });
  if (C.sector.startsWith("logistics")) out.push({
    id: "ops-vendor",
    category: "Operational", subcategory: "Vendor concentration",
    title: "Check carrier / vendor dependency in the delivery network",
    severity: "medium",
    source: "Contracts",
    detail: "For a freight business, a buyer will test whether the network leans on a concentrated set of carriers — losing a major carrier would disrupt fulfilment and margins. ExitOS does not hold carrier data.",
    buyerView: "Maps the carrier base and tests substitutability; concentration here compounds the customer-concentration discount.",
    sellerAction: "Broaden the carrier panel and secure capacity commitments to show the network is resilient and transferable.",
    impactUsd: impact(3),
  });
  out.push({
    id: "ops-keyemployee",
    category: "Operational", subcategory: "Key employee exposure",
    title: isKnown(C, "team.leadershipBenchStrength") ? `Leadership bench is ${C.team.leadershipBenchStrength}${C.team.tenureMedianYears != null ? `; median tenure ${C.team.tenureMedianYears}y` : ""}` : "Key people not yet identified",
    severity: isKnown(C, "team.leadershipBenchStrength") && C.team.leadershipBenchStrength === "thin" ? "high" : "medium",
    source: "Employment agreements",
    detail: `${isKnown(C, "team.headcount") ? `With ${C.team.headcount} people${C.team.engineeringHeadcount != null ? `, ${C.team.engineeringHeadcount} of them in engineering` : ""}` : "The company has not yet supplied its headcount or leadership team"}; a buyer will look for key people who carry outsized knowledge.`,
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
export function buildBuyerReport(findings: readonly DiligenceFinding[], mid: number = MID): RiskReport {
  const bySeverity = tally(findings);
  const total = findings.reduce((s, f) => s + f.impactUsd, 0);
  const top = [...findings].sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity] || b.impactUsd - a.impactUsd).slice(0, 4);
  const escrowPct = Math.min(20, Math.round((total / mid) * 100));
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

// The six named reports a bank + law firm would produce, all from the same checks.
export interface NamedReport {
  key: string;
  title: string;
  headline: string;
  metric: string;
  points: readonly { title: string; body: string }[];
  recommendation: string;
  accent: "buyer" | "seller";
}

const m1 = (n: number): string => `$${(n / 1_000_000).toFixed(1)}M`;

export function allReports(findings: readonly DiligenceFinding[], mid: number = MID): NamedReport[] {
  const buyer = buildBuyerReport(findings, mid);
  const seller = buildSellerReport(findings);
  const high = findings.filter((f) => f.severity === "high");
  const legal = findings.filter((f) => f.category === "Legal");
  const total = findings.reduce((s, f) => s + f.impactUsd, 0);
  const byImpact = [...findings].sort((a, b) => b.impactUsd - a.impactUsd);
  const readyPct = findings.length ? Math.round((1 - high.length / findings.length) * 100) : 100;

  return [
    { key: "buyer", title: "Buyer Diligence Report", accent: "buyer", metric: `${m1(total)} illustrative`,
      headline: buyer.headline, points: buyer.points, recommendation: buyer.recommendation },
    { key: "seller", title: "Seller Risk Report", accent: "seller", metric: `${m1(total)} illustrative`,
      headline: seller.headline, points: seller.points, recommendation: seller.recommendation },
    { key: "readiness", title: "Deal Readiness Report", accent: "seller", metric: `${readyPct}% ready`,
      headline: `${high.length} gating item${high.length === 1 ? "" : "s"} and ${findings.length - high.length} secondary. ${high.length === 0 ? "Clear to open the room." : "Resolve the gating items before buyer access."}`,
      points: high.map((f) => ({ title: `${f.subcategory} — gating`, body: f.sellerAction })),
      recommendation: "Open the data room once the gating items are resolved; the rest can be disclosed with mitigations attached." },
    { key: "redflag", title: "Red Flag Report", accent: "buyer", metric: `${high.length} red flags`,
      headline: `${high.length} red flag${high.length === 1 ? "" : "s"} a buyer's analyst will raise first.`,
      points: high.map((f) => ({ title: `${f.subcategory} — ${f.severity}`, body: f.detail })),
      recommendation: "Get ahead of every red flag with a disclosure and a mitigation in the CIM before buyers find them." },
    { key: "valuation", title: "Valuation Impact Report", accent: "buyer", metric: `-${m1(total)}`,
      headline: `The illustrative rule assigns ${m1(total)} across all findings — fixed shares of the headline, whatever their severity. Not an estimate of what a buyer would deduct.`,
      points: byImpact.slice(0, 5).map((f) => ({ title: `${f.subcategory} · illustrative -${m1(f.impactUsd)}`, body: f.buyerView })),
      recommendation: "Fix the highest-impact items first — each one closes part of the discount a buyer would otherwise take." },
    { key: "legal", title: "Legal Exposure Report", accent: "seller", metric: `${legal.length} items`,
      headline: `${legal.length} legal item${legal.length === 1 ? "" : "s"} shape the reps, indemnity cap and escrow.`,
      points: legal.map((f) => ({ title: f.subcategory, body: f.sellerAction })),
      recommendation: "Backfill IP assignments and missing contracts now to shrink the indemnity and escrow ask at close." },
  ];
}

// Seller Risk Report — the same findings as a pre-market fix list.
export function buildSellerReport(findings: readonly DiligenceFinding[]): RiskReport {
  const bySeverity = tally(findings);
  const total = findings.reduce((s, f) => s + f.impactUsd, 0);
  const top = [...findings].sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity] || b.impactUsd - a.impactUsd).slice(0, 4);
  return {
    audience: "seller",
    title: "Seller Risk Report",
    headline: `Fix these before buyers see the company, starting with the ${bySeverity.high} high-severity items.`,
    totalImpactUsd: total,
    bySeverity,
    points: top.map((f) => ({ title: `${f.subcategory} — ${f.severity}`, body: f.sellerAction })),
    recommendation: `Run a 30–60 day pre-market remediation: lock top-account renewals, backfill IP assignments and contracts, and stand up a founder-transition plan. Update your intake and review these findings again before opening the data room.`,
  };
}

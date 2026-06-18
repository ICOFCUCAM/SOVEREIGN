import { runInstitutionalValuation, runReadiness, runReadinessAnalysis, type CompanyProfile } from "@exit/engines";
import type {
  MethodologyView, PremiumEvidence, LikelyBuyer, ComparableAnalysis, VariableRecord,
} from "@exit/engines";

// ── INSTITUTIONAL REPORT MODEL ──────────────────────────────────────
// The separation real banks use: the engines emit structured data; THIS
// builds the typed report model; the renderer (pages/Report) turns it into a
// board-ready document. No markdown, no presentation here — pure data, every
// figure already carrying its source through the valuation constitution.

export interface ReportComparable { target: string; buyer: string; date: string | null; premiumPct: number | null; priceUsd: number | null }
export interface SensitivityRow { premiumPct: number; evUsd: number; delta: number }
export interface RiskRow { dimension: string; recommendation: string; impactUsd: number; effort: string }

export interface ValuationReportModel {
  meta: { title: string; company: string; preparedFor: string; preparedBy: string; date: string; frameworkVersion: string };
  exec: {
    evMid: number; evLow: number; evHigh: number;
    confidencePct: number; confidenceTier: string;
    qualifiedBuyers: number; scoredBuyers: number;
    medianPremiumPct: number | null; appliedPremiumPct: number;
    closeLowDays: number; closeHighDays: number;
    baselineMid: number; comparablesUsed: number;
    leadBuyer: string | null; leadProbabilityPct: number | null;
    thesis: string;
  };
  overview: { sector: string; arrUsd: number; ttmUsd: number; growthPct: number; ebitdaPct: number; grossMarginPct: number; netRetentionPct: number | null; customers: number | null };
  methodologies: readonly MethodologyView[];
  comparables: ReportComparable[];
  comparablesAnalysis: ComparableAnalysis;
  buyerUniverse: { qualified: number; scored: number; registry: number; strategic: number; financial: number; sovereign: number; family_office: number };
  mostLikelyBuyers: readonly LikelyBuyer[];
  premium: PremiumEvidence;
  sensitivity: SensitivityRow[];
  risks: RiskRow[];
  variables: { company: readonly VariableRecord[]; market: readonly VariableRecord[]; buyer: readonly VariableRecord[]; execution: readonly VariableRecord[] };
  provenance: { totalFigures: number; bySource: Readonly<Record<string, number>>; mostRecentDataDate?: string; note: string };
  disclaimer: string;
}

const SECTOR_LABEL: Record<string, string> = {
  enterprise_saas: "Enterprise SaaS", vertical_saas: "Vertical SaaS", b2b_marketplace: "B2B Marketplace",
  consumer_marketplace: "Consumer Marketplace", fintech_payments: "Fintech · Payments", logistics_freight: "Logistics · Freight",
  mobility: "Mobility", ai_infra: "AI Infrastructure", developer_tools: "Developer Tools", media_content: "Media · Content", other: "Diversified",
};

export function buildValuationReport(company: CompanyProfile, preparedFor = "Board of Directors"): ValuationReportModel {
  const INST = runInstitutionalValuation(company);
  const ra = runReadinessAnalysis(company, runReadiness(company));

  // sensitivity: EV across the evidence-based premium band (honest — it is the
  // financial baseline uplifted by the observed-premium range, nothing new).
  const lo = INST.premium.rangeLowPct, hi = INST.premium.rangeHighPct, base = INST.financialBaseline.mid;
  const steps = 5;
  const sensitivity: SensitivityRow[] = Array.from({ length: steps }, (_, i) => {
    const p = lo + ((hi - lo) * i) / (steps - 1);
    const ev = base * (1 + p);
    return { premiumPct: p, evUsd: ev, delta: ev - INST.headline.mid };
  });

  const risks: RiskRow[] = [...ra.weaknesses]
    .sort((a, b) => b.valuationUpliftUsd - a.valuationUpliftUsd)
    .slice(0, 6)
    .map((w) => ({ dimension: w.dimension, recommendation: w.recommendation, impactUsd: w.valuationUpliftUsd, effort: w.effort }));

  const lead = INST.mostLikelyBuyers[0];

  return {
    meta: {
      title: "Institutional Valuation Report",
      company: company.name,
      preparedFor,
      preparedBy: "ExitOS Advisory",
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      frameworkVersion: INST.frameworkVersion,
    },
    exec: {
      evMid: INST.headline.mid, evLow: INST.headline.low, evHigh: INST.headline.high,
      confidencePct: INST.confidence.score, confidenceTier: INST.confidence.tier,
      qualifiedBuyers: INST.buyerUniverse.qualified, scoredBuyers: INST.buyerUniverse.scored,
      medianPremiumPct: INST.comparablesAnalysis.medianPremiumPct ?? null, appliedPremiumPct: INST.premium.appliedPct,
      closeLowDays: INST.timeToClose.lowDays, closeHighDays: INST.timeToClose.highDays,
      baselineMid: INST.financialBaseline.mid, comparablesUsed: INST.comparablesUsed,
      leadBuyer: lead?.name ?? null, leadProbabilityPct: lead?.probabilityPct ?? null,
      thesis: INST.strategicRationale[0] ?? INST.premium.note,
    },
    overview: {
      sector: SECTOR_LABEL[company.sector] ?? company.sector,
      arrUsd: company.revenue.annualRecurringRevenueUsd,
      ttmUsd: company.revenue.trailingTwelveMonthsRevenueUsd,
      growthPct: company.growth.arrGrowthYoyPct,
      ebitdaPct: company.revenue.ebitdaMarginPct,
      grossMarginPct: company.revenue.grossMarginPct,
      netRetentionPct: company.revenue.netRetentionPct ?? null,
      customers: company.users?.totalCustomers ?? null,
    },
    methodologies: INST.methodologies,
    comparables: INST.comparableTransactions.slice(0, 12).map((c) => ({ target: c.target, buyer: c.buyer, date: c.date ?? null, premiumPct: c.premiumPct ?? null, priceUsd: c.priceUsd ?? null })),
    comparablesAnalysis: INST.comparablesAnalysis,
    buyerUniverse: INST.buyerUniverse,
    mostLikelyBuyers: INST.mostLikelyBuyers,
    premium: INST.premium,
    sensitivity,
    risks,
    variables: INST.variables,
    provenance: { totalFigures: INST.provenanceSummary.totalFigures, bySource: INST.provenanceSummary.bySource, mostRecentDataDate: INST.provenanceSummary.mostRecentDataDate, note: INST.provenanceSummary.note },
    disclaimer: INST.disclaimer,
  };
}

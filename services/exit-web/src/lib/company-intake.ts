import type { CompanyProfile } from "@exit/engines";
import { SAMPLE_COMPANY } from "./profile";

// ── COMPANY INTAKE ──────────────────────────────────────────────────
// Maps a small set of founder inputs to a full CompanyProfile so the
// institutional engines (valuation, buyer universe, comparables, expected
// outcome) can run on ANY company — the "enter your data, get the report"
// path. Unspecified fields take sensible, neutral defaults derived from the
// few that matter to the valuation; nothing is fabricated about the buyer
// or market data — that comes from the registry, parameterized by sector.

export type Sector = CompanyProfile["sector"];
export const SECTORS: readonly Sector[] = [
  "enterprise_saas", "vertical_saas", "b2b_marketplace", "consumer_marketplace",
  "fintech_payments", "logistics_freight", "mobility", "ai_infra",
  "developer_tools", "media_content", "other",
];

const MODEL_FOR: Record<Sector, CompanyProfile["businessModel"]> = {
  enterprise_saas: "saas", vertical_saas: "saas", developer_tools: "saas",
  ai_infra: "ai_platform", fintech_payments: "fintech",
  b2b_marketplace: "marketplace", consumer_marketplace: "commerce",
  logistics_freight: "logistics", mobility: "mobility", media_content: "media", other: "other",
};

export interface IntakeInputs {
  name: string;
  jurisdiction: string;            // ISO country
  sector: Sector;
  foundedYear: number;
  ttmRevenueUsd: number;
  arrUsd: number;                  // 0 if not recurring-revenue
  growthPct: number;               // 0..N (e.g. 0.42)
  grossMarginPct: number;          // 0..1
  ebitdaMarginPct: number;         // -1..1
  netRetentionPct: number;         // e.g. 1.08 (1.0 if n/a)
  customerConcentrationPct: number;// 0..1 (top-10)
  totalCustomers: number;
  hasNetworkEffects: boolean;
  hasDataMoat: boolean;
}

export const DEFAULT_INTAKE: IntakeInputs = {
  name: "Your Company",
  jurisdiction: "US",
  sector: "vertical_saas",
  foundedYear: 2018,
  ttmRevenueUsd: 40_000_000,
  arrUsd: 30_000_000,
  growthPct: 0.45,
  grossMarginPct: 0.72,
  ebitdaMarginPct: 0.1,
  netRetentionPct: 1.15,
  customerConcentrationPct: 0.25,
  totalCustomers: 600,
  hasNetworkEffects: false,
  hasDataMoat: false,
};

/** Build a full, engine-ready CompanyProfile from the founder's inputs. */
export function buildProfile(i: IntakeInputs): CompanyProfile {
  const rule40 = i.growthPct + i.ebitdaMarginPct;
  return {
    id: "intake",
    name: i.name.trim() || "Your Company",
    jurisdiction: (i.jurisdiction || "US").toUpperCase(),
    businessModel: MODEL_FOR[i.sector],
    sector: i.sector,
    foundedYear: i.foundedYear,
    revenue: {
      annualRecurringRevenueUsd: Math.max(0, i.arrUsd),
      trailingTwelveMonthsRevenueUsd: Math.max(0, i.ttmRevenueUsd),
      grossMarginPct: clamp(i.grossMarginPct, 0, 1),
      ebitdaMarginPct: clamp(i.ebitdaMarginPct, -1, 1),
      netRetentionPct: i.netRetentionPct,
      grossRetentionPct: Math.min(1, Math.max(0.7, i.netRetentionPct - 0.1)),
      customerConcentrationTop10Pct: clamp(i.customerConcentrationPct, 0, 1),
    },
    growth: {
      arrGrowthYoyPct: i.growthPct,
      customerGrowthYoyPct: i.growthPct * 0.7,
      rule40,
    },
    users: {
      totalCustomers: Math.max(1, Math.round(i.totalCustomers)),
      averageRevenuePerCustomerUsd: i.totalCustomers > 0 ? Math.round(i.ttmRevenueUsd / i.totalCustomers) : undefined,
    },
    market: {
      // a neutral TAM derived from revenue when the founder doesn't supply one,
      // sized so the valuation's market checks neither inflate nor penalize
      addressableMarketUsd: Math.max(1_000_000_000, i.ttmRevenueUsd * 200),
      competitiveDensity: "medium",
      marketGrowthPct: 0.12,
      regulatoryRisk: "low",
    },
    product: {
      defensibility: i.hasDataMoat || i.hasNetworkEffects ? "high" : "medium",
      differentiation: "leader",
      technicalArchitecture: "modular_monolith",
      ...(i.hasNetworkEffects ? { hasNetworkEffects: true } : {}),
      ...(i.hasDataMoat ? { hasDataMoat: true } : {}),
    },
    team: {
      headcount: Math.max(5, Math.round(i.ttmRevenueUsd / 350_000)),
      foundersStillActive: true,
      leadershipBenchStrength: "adequate",
    },
    cap: {
      fullyDilutedShares: 10_000_000,
      foundersOwnershipPct: 0.4,
      investorOwnershipPct: 0.45,
      esopOwnershipPct: 0.15,
    },
  };
}

function clamp(x: number, lo: number, hi: number): number {
  return Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : lo;
}

// Seed the form from the demo company so the founder sees a worked example.
export const SAMPLE_INTAKE: IntakeInputs = {
  name: SAMPLE_COMPANY.name,
  jurisdiction: SAMPLE_COMPANY.jurisdiction,
  sector: SAMPLE_COMPANY.sector,
  foundedYear: SAMPLE_COMPANY.foundedYear,
  ttmRevenueUsd: SAMPLE_COMPANY.revenue.trailingTwelveMonthsRevenueUsd,
  arrUsd: SAMPLE_COMPANY.revenue.annualRecurringRevenueUsd,
  growthPct: SAMPLE_COMPANY.growth.arrGrowthYoyPct,
  grossMarginPct: SAMPLE_COMPANY.revenue.grossMarginPct,
  ebitdaMarginPct: SAMPLE_COMPANY.revenue.ebitdaMarginPct,
  netRetentionPct: SAMPLE_COMPANY.revenue.netRetentionPct ?? 1,
  customerConcentrationPct: SAMPLE_COMPANY.revenue.customerConcentrationTop10Pct ?? 0.25,
  totalCustomers: SAMPLE_COMPANY.users.totalCustomers,
  hasNetworkEffects: !!SAMPLE_COMPANY.product.hasNetworkEffects,
  hasDataMoat: !!SAMPLE_COMPANY.product.hasDataMoat,
};

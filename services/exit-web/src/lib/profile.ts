import type { CompanyProfile } from "@exit/engines";

// Sample CompanyProfile used by the ExitOS console in demo mode. When
// the production exit-api is wired, the profile is loaded per workspace
// from /v1/companies/{id}; until then every page reads this same input.

export const SAMPLE_COMPANY: CompanyProfile = {
  id: "demo-helios",
  name: "Helios Freight",
  jurisdiction: "US",
  businessModel: "logistics",
  sector: "logistics_freight",
  foundedYear: 2017,
  revenue: {
    annualRecurringRevenueUsd: 18_000_000,
    trailingTwelveMonthsRevenueUsd: 62_000_000,
    grossMarginPct: 0.34,
    ebitdaMarginPct: 0.09,
    netRetentionPct: 1.08,
    grossRetentionPct: 0.91,
    customerConcentrationTop10Pct: 0.40,
  },
  growth: {
    arrGrowthYoyPct: 0.42,
    customerGrowthYoyPct: 0.30,
    netNewArrUsd: 5_300_000,
  },
  users: {
    totalCustomers: 1_240,
    activeMonthly: 980,
    paidCustomers: 1_240,
    averageRevenuePerCustomerUsd: 50_000,
    churnAnnualizedPct: 0.07,
  },
  market: {
    addressableMarketUsd: 280_000_000_000,
    serviceableMarketUsd: 40_000_000_000,
    competitiveDensity: "high",
    marketGrowthPct: 0.06,
    regulatoryRisk: "medium",
  },
  product: {
    defensibility: "medium",
    differentiation: "leader",
    intellectualProperty: { patentsGranted: 1, patentsPending: 3 },
    technicalArchitecture: "modular_monolith",
    aiNative: true,
    hasNetworkEffects: true,
    hasDataMoat: true,
  },
  team: {
    headcount: 220,
    foundersStillActive: true,
    leadershipBenchStrength: "adequate",
    engineeringHeadcount: 48,
    tenureMedianYears: 3.1,
  },
  cap: {
    fullyDilutedShares: 18_000_000,
    foundersOwnershipPct: 0.28,
    investorOwnershipPct: 0.55,
    esopOwnershipPct: 0.17,
    preferenceStackUsd: 32_000_000,
    priorRoundsValuationUsd: 110_000_000,
  },
  drivers: [
    { name: "Net new ARR", weight: 0.30, trend: "improving" },
    { name: "Gross margin", weight: 0.25, trend: "stable" },
    { name: "Customer concentration", weight: 0.20, trend: "stable" },
  ],
  narrative: "Helios Freight is a tech-enabled freight brokerage operating an AI-native dispatch substrate across North American long-haul corridors.",
};

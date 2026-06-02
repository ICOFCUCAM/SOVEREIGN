// Canonical company profile that every ExitOS engine consumes. The
// shape is wide enough to support valuation, readiness, buyer
// discovery, memorandum and diligence outputs from a single input.

export type BusinessModel =
  | 'saas'
  | 'marketplace'
  | 'logistics'
  | 'mobility'
  | 'ai_platform'
  | 'fintech'
  | 'commerce'
  | 'media'
  | 'services'
  | 'other';

export type SectorTag =
  | 'enterprise_saas'
  | 'vertical_saas'
  | 'b2b_marketplace'
  | 'consumer_marketplace'
  | 'fintech_payments'
  | 'logistics_freight'
  | 'mobility'
  | 'ai_infra'
  | 'developer_tools'
  | 'media_content'
  | 'other';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'BRL' | 'MXN' | 'JPY' | 'CNY' | 'INR' | 'AED';

export interface Money { readonly amount: number; readonly currency: Currency }

export interface RevenueProfile {
  readonly annualRecurringRevenueUsd: number;
  readonly trailingTwelveMonthsRevenueUsd: number;
  readonly grossMarginPct: number;          // 0..1
  readonly ebitdaMarginPct: number;         // -1..1
  readonly contributionMarginPct?: number;  // 0..1
  readonly grossRetentionPct?: number;      // 0..1 (saas)
  readonly netRetentionPct?: number;        // 0..2 (saas, can exceed 1)
  readonly grossMerchandiseValueUsd?: number; // marketplace
  readonly takeRatePct?: number;            // marketplace
  readonly customerConcentrationTop10Pct?: number; // 0..1
}

export interface GrowthMetrics {
  readonly arrGrowthYoyPct: number;         // -1..N
  readonly arrGrowthMomPct?: number;        // -1..N
  readonly customerGrowthYoyPct?: number;
  readonly logoGrowthYoyPct?: number;
  readonly netNewArrUsd?: number;
  readonly rule40?: number;                 // pre-computed if available
}

export interface UserMetrics {
  readonly totalCustomers: number;
  readonly activeMonthly?: number;
  readonly activeDaily?: number;
  readonly paidCustomers?: number;
  readonly averageRevenuePerCustomerUsd?: number;
  readonly churnAnnualizedPct?: number;
}

export interface MarketProfile {
  readonly addressableMarketUsd: number;    // TAM
  readonly serviceableMarketUsd?: number;   // SAM
  readonly competitiveDensity: 'low' | 'medium' | 'high';
  readonly marketGrowthPct: number;         // CAGR
  readonly regulatoryRisk: 'low' | 'medium' | 'high';
}

export interface ProductProfile {
  readonly defensibility: 'low' | 'medium' | 'high';
  readonly differentiation: 'commodity' | 'parity' | 'leader' | 'monopolist';
  readonly intellectualProperty?: { readonly patentsGranted?: number; readonly patentsPending?: number };
  readonly technicalArchitecture: 'monolith' | 'modular_monolith' | 'microservices' | 'unknown';
  readonly aiNative?: boolean;
  readonly hasNetworkEffects?: boolean;
  readonly hasDataMoat?: boolean;
}

export interface TeamProfile {
  readonly headcount: number;
  readonly foundersStillActive: boolean;
  readonly leadershipBenchStrength: 'thin' | 'adequate' | 'strong';
  readonly engineeringHeadcount?: number;
  readonly tenureMedianYears?: number;
}

export interface CapTable {
  readonly fullyDilutedShares: number;
  readonly foundersOwnershipPct: number;      // 0..1
  readonly investorOwnershipPct: number;      // 0..1
  readonly esopOwnershipPct: number;          // 0..1
  readonly preferenceStackUsd?: number;       // liquidation preference floor
  readonly priorRoundsValuationUsd?: number;
}

export interface DriverProfile {
  readonly name: string;
  readonly weight: number;                    // 0..1, contributes to value
  readonly trend: 'declining' | 'stable' | 'improving';
}

export interface CompanyProfile {
  readonly id?: string;
  readonly name: string;
  readonly jurisdiction: string;              // ISO country
  readonly businessModel: BusinessModel;
  readonly sector: SectorTag;
  readonly foundedYear: number;
  readonly revenue: RevenueProfile;
  readonly growth: GrowthMetrics;
  readonly users: UserMetrics;
  readonly market: MarketProfile;
  readonly product: ProductProfile;
  readonly team: TeamProfile;
  readonly cap: CapTable;
  readonly drivers?: readonly DriverProfile[];
  readonly narrative?: string;                // free-text founder framing
}

export interface Citation { readonly source: string; readonly fact: string }

export interface EngineMeta {
  readonly engine: string;
  readonly version: string;
  readonly runAt: string;
  readonly inputs?: Readonly<Record<string, unknown>>;
}

export function isCompanyProfile(v: unknown): v is CompanyProfile {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return typeof c.name === 'string'
    && typeof c.jurisdiction === 'string'
    && typeof c.businessModel === 'string'
    && typeof c.sector === 'string'
    && typeof c.foundedYear === 'number'
    && !!c.revenue
    && !!c.growth
    && !!c.users
    && !!c.market
    && !!c.product
    && !!c.team
    && !!c.cap;
}

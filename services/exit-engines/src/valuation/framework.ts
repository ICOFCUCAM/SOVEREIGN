// ── THE VALUATION CONSTITUTION ──────────────────────────────────────
// A single, frozen configuration object that defines HOW ExitOS values a
// company. No report, CIM, teaser, board pack or market update may invent
// its own valuation logic: they all inherit these rules through
// runValuationConstitution(). Change a number here and every generated
// document changes with it — that is the point.
//
// If a figure isn't governed by this framework, it doesn't belong in a
// valuation-bearing document.

export const VALUATION_FRAMEWORK_VERSION = '1.0.0';

// Methodology weight priors — the reliability weight each method carries
// before normalization. The base valuation engine reads these; nothing
// else defines a weight. Weights are normalized to sum to 100% at render.
export const METHODOLOGY_WEIGHTS = {
  'ARR multiple': 0.50,
  'Revenue multiple (TTM)': 0.30,
  'EBITDA multiple': 0.20,
  'GMV multiple': 0.25,
  'Replacement cost': 0.60,
  'Opportunity cost (foregone revenue)': 0.40,
} as const;

export interface ValuationFrameworkConfig {
  readonly version: string;

  readonly methodology: {
    readonly weightingRule: string;
    readonly normalizeToPct: number;          // weights are scaled to sum to this
    readonly weights: Readonly<Record<string, number>>;
  };

  // Strategic premium is NEVER fixed — it is computed from observed
  // precedent transactions. These rules govern that computation.
  readonly premium: {
    readonly source: 'observed_precedent_transactions';
    readonly applied: 'mean_of_observed';
    readonly requirePositive: boolean;        // ignore non-positive / undisclosed premiums
    readonly excludeStatuses: readonly string[];
    readonly inSectorMinSample: number;       // ≥ this ⇒ use in-sector evidence
    readonly marketFallback: boolean;         // else fall back to market-wide precedent
    readonly neutralPriorPct: number;         // last resort when no precedent has a reference price
  };

  // Confidence is a 0–100 composite of five drivers with these weights and
  // tier thresholds. Driver weights must sum to 1.
  readonly confidence: {
    readonly driverWeights: {
      readonly dataCompleteness: number;
      readonly comparableDepth: number;
      readonly sectorMaturity: number;
      readonly financialQuality: number;
      readonly dataFreshness: number;
    };
    readonly comparableFullCount: number;     // comps at/above this ⇒ full depth credit
    readonly sectorMatureBuyers: number;      // active buyers at/above this ⇒ mature sector
    readonly freshnessFullDays: number;       // most-recent comp newer than this ⇒ full freshness
    readonly freshnessZeroDays: number;       // older than this ⇒ no freshness credit
    readonly tierThresholds: { readonly high: number; readonly moderate: number };
    readonly labels: { readonly high: string; readonly moderate: string; readonly low: string };
  };

  // No valuation conclusion without transaction evidence — these are the
  // selection rules for the comparable set.
  readonly comparables: {
    readonly sameSectorOnly: boolean;
    readonly excludeStatuses: readonly string[];
    readonly maxCount: number;
    readonly minForConclusion: number;        // below this, the report is flagged unsupported
  };

  readonly buyerUniverse: {
    readonly qualifiedProbabilityBar: number; // probability ≥ this ⇒ "qualified"
    readonly scoredPoolLimit: number;
    readonly mostLikelyCount: number;
  };

  // Heuristic strategic premium — used ONLY as a fallback when no precedent
  // evidence is available to drive the premium. Evidence always wins.
  readonly strategicHeuristic: {
    readonly basePct: number;
    readonly networkEffectsUpliftPct: number;
    readonly dataMoatUpliftPct: number;
  };

  // Customer-concentration discount applied to the financial baseline.
  readonly concentrationDiscount: {
    readonly thresholdPct: number;
    readonly discountPct: number;
  };

  // Asset-replacement (cost-to-rebuild) method parameters.
  readonly assetReplacement: {
    readonly fullyLoadedEngCostUsd: number;
    readonly patentValueUsd: number;
    readonly arrOpportunityMultiple: number;
    readonly engRatioOfHeadcount: number;
    readonly minYearsToBuild: number;
    readonly yearsToBuildFactor: number;
    readonly replacementLowBand: number;
    readonly replacementHighBand: number;
    readonly opportunityLowBand: number;
    readonly opportunityHighBand: number;
  };

  // Discounted-cash-flow method parameters (interactive on the surface,
  // but bounded and defaulted here).
  readonly dcf: {
    readonly years: number;
    readonly terminalGrowthPct: number;
    readonly defaultDiscountPct: number;
  };

  // Execution-variable neutral priors — used when a buyer has no track
  // record. Every fallback the platform uses is named here.
  readonly executionNeutrals: {
    readonly premiumPct: number;
    readonly closeRatePct: number;
    readonly daysToCash: number;
    readonly retradePct: number;
  };

  // Per-buyer-type premium priors — the ONLY place a buyer-type default
  // premium may be defined. Surfaces that show a premium without an
  // observed figure must read it from here, never inline.
  readonly buyerTypePremiumPriors: Readonly<Record<string, number>>;

  // Every figure shown must carry these provenance fields.
  readonly provenance: {
    readonly requiredFields: readonly string[];
  };

  // The full variable set every valuation must source (or explicitly mark
  // absent). Documents inherit this contract; missing variables lower the
  // completeness score rather than being silently omitted.
  readonly requiredVariables: {
    readonly company: readonly string[];
    readonly market: readonly string[];
    readonly buyer: readonly string[];
    readonly execution: readonly string[];
  };

  // Every valuation-bearing document must surface all of these.
  readonly mandatoryOutputs: readonly string[];

  readonly disclaimer: string;
}

// Deep-freeze so the constitution is immutable all the way down — no
// surface can quietly re-set a nested prior at runtime.
function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object') {
    for (const v of Object.values(o)) deepFreeze(v);
    Object.freeze(o);
  }
  return o;
}

export const VALUATION_FRAMEWORK: ValuationFrameworkConfig = deepFreeze({
  version: VALUATION_FRAMEWORK_VERSION,

  methodology: {
    weightingRule: 'reliability-weighted, normalized to 100%',
    normalizeToPct: 100,
    weights: METHODOLOGY_WEIGHTS,
  },

  premium: {
    source: 'observed_precedent_transactions' as const,
    applied: 'mean_of_observed' as const,
    requirePositive: true,
    excludeStatuses: ['lost_bid'],
    inSectorMinSample: 1,
    marketFallback: true,
    neutralPriorPct: 0.20,
  },

  confidence: {
    driverWeights: {
      dataCompleteness: 0.25,
      comparableDepth: 0.25,
      sectorMaturity: 0.15,
      financialQuality: 0.20,
      dataFreshness: 0.15,
    },
    comparableFullCount: 8,
    sectorMatureBuyers: 10,
    freshnessFullDays: 365,
    freshnessZeroDays: 365 * 6,
    tierThresholds: { high: 75, moderate: 50 },
    labels: { high: 'High', moderate: 'Moderate', low: 'Low' },
  },

  comparables: {
    sameSectorOnly: true,
    excludeStatuses: ['lost_bid'],
    maxCount: 12,
    minForConclusion: 1,
  },

  buyerUniverse: {
    qualifiedProbabilityBar: 0.5,
    scoredPoolLimit: 100,
    mostLikelyCount: 5,
  },

  strategicHeuristic: {
    basePct: 0.30,
    networkEffectsUpliftPct: 0.10,
    dataMoatUpliftPct: 0.10,
  },

  concentrationDiscount: {
    thresholdPct: 0.5,
    discountPct: -0.20,
  },

  assetReplacement: {
    fullyLoadedEngCostUsd: 280_000,
    patentValueUsd: 500_000,
    arrOpportunityMultiple: 1.5,
    engRatioOfHeadcount: 0.35,
    minYearsToBuild: 2,
    yearsToBuildFactor: 0.6,
    replacementLowBand: 0.7,
    replacementHighBand: 1.4,
    opportunityLowBand: 0.8,
    opportunityHighBand: 1.3,
  },

  dcf: {
    years: 5,
    terminalGrowthPct: 0.03,
    defaultDiscountPct: 0.18,
  },

  executionNeutrals: {
    premiumPct: 0.20,
    closeRatePct: 0.55,
    daysToCash: 150,
    retradePct: 0,
  },

  buyerTypePremiumPriors: {
    strategic: 0.28,
    pe: 0.12,
    private_equity: 0.12,
    vc: 0.18,
    family_office: 0.15,
    sponsor: 0.10,
    sovereign_fund: 0.15,
  },

  provenance: {
    requiredFields: ['source', 'source_url', 'confidence', 'verification_status', 'last_updated', 'methodology'],
  },

  requiredVariables: {
    company: [
      'revenue_ttm', 'revenue_growth', 'gross_margin', 'ebitda', 'ebitda_margin',
      'customer_count', 'geography', 'sector', 'subsector', 'ownership_type', 'funding_history',
    ],
    market: [
      'comparable_transactions', 'comparable_public_companies', 'sector_multiples',
      'market_cycle', 'interest_rate_environment',
    ],
    buyer: [
      'buyer_universe_size', 'strategic_buyers', 'financial_buyers', 'sovereign_buyers',
      'acquisition_history', 'acquisition_frequency', 'historical_premiums',
    ],
    execution: [
      'expected_close_rate', 'expected_time_to_close', 'diligence_risk', 'retrade_risk',
    ],
  },

  mandatoryOutputs: [
    'enterprise_value_range',
    'midpoint_valuation',
    'confidence_score',
    'valuation_methodologies',
    'methodology_weighting',
    'comparable_transaction_count',
    'strategic_premium_basis',
    'buyer_universe_size',
    'expected_time_to_close',
    'data_provenance_summary',
  ],

  disclaimer:
    'This valuation has been prepared by ExitOS under its Valuation Framework v' + VALUATION_FRAMEWORK_VERSION +
    ' from information provided by the Company and from sources believed to be reliable, including public ' +
    'acquisition registries (Wikipedia, Wikidata, SEC EDGAR). No representation or warranty, express or implied, ' +
    'is made as to its accuracy or completeness. Multiples, premiums and comparable transactions are reference ' +
    'estimates subject to due diligence and definitive documentation; they do not constitute investment, legal or ' +
    'tax advice. All figures are traceable to a stated source, confidence and date; figures without provenance are ' +
    'not shown. Distribution or reproduction without prior written consent is prohibited.',
});

import type { CompanyProfile } from '../types.js';
import { runAcquisitionIntelligence } from './intelligence.js';
import { VALUATION_FRAMEWORK } from '../valuation/framework.js';
import { BUYER_REGISTRY } from './registry.js';

// ── ENGINE 1 · THE BUYER INTELLIGENCE ENGINE ────────────────────────
// A single named entrypoint over the buyer graph, acquisition registry,
// intent and outcome engines. It emits the seven outputs the institution
// asks for — Qualified Buyers, Buyer DNA, Acquisition History, Acquisition
// Appetite, Expected Interest, Historical Premiums, Close Probability —
// for every ranked buyer, each figure carrying provenance. It computes
// nothing new; it composes the existing engines into one contract so the
// Reporting Engine consumes ONE buyer-intelligence object, not seven calls.

export interface BuyerIntelligenceProfile {
  readonly name: string;
  readonly buyerType: string;
  readonly qualified: boolean;                 // clears the framework probability bar
  readonly closeProbabilityPct: number;        // acquisition probability, 0–100
  readonly dna: {
    readonly appetite: string;                 // intent tier
    readonly sectorsActive: readonly string[];
    readonly dealsOnRecord: number;
    readonly lastTarget?: string;
  };
  readonly acquisitionHistory: { readonly totalDeals: number; readonly lastTarget?: string; readonly closeRatePct?: number };
  readonly acquisitionAppetite: string;        // active | selective | low — from intent
  readonly expectedInterest: { readonly score: number; readonly tier: string }; // intent
  readonly historicalPremiumPct?: number;      // observed avg premium (undefined when unproven)
  readonly expectedDaysToClose: number;
  readonly whyRanked: readonly string[];
  readonly source: string;
}

export interface BuyerIntelligenceReport {
  readonly company: string;
  readonly qualifiedCount: number;             // buyers above the qualification bar
  readonly scoredCount: number;
  readonly registrySize: number;
  readonly profiles: readonly BuyerIntelligenceProfile[];
  readonly summary: string;
  readonly source: string;
  readonly generatedAt: string;
}

export interface BuyerIntelligenceOptions {
  readonly impliedPriceUsd?: number;
  readonly limit?: number;
}

/** Engine 1 — one call, the seven buyer-intelligence outputs per buyer. */
export function runBuyerIntelligenceEngine(
  company: CompanyProfile,
  opts: BuyerIntelligenceOptions = {},
): BuyerIntelligenceReport {
  const bar = VALUATION_FRAMEWORK.buyerUniverse.qualifiedProbabilityBar;
  const intel = runAcquisitionIntelligence(company, {
    ...(opts.impliedPriceUsd != null ? { impliedPriceUsd: opts.impliedPriceUsd } : {}),
    limit: opts.limit ?? 12,
  });

  const profiles: BuyerIntelligenceProfile[] = intel.ranked.map((r) => {
    const c = r.candidate;
    const o = c.outcomes;
    return {
      name: c.buyer.name,
      buyerType: c.buyer.buyerType,
      qualified: c.probability >= bar,
      closeProbabilityPct: Math.round(c.probability * 100),
      dna: {
        appetite: r.intent.tier,
        sectorsActive: c.buyer.sectorsActive,
        dealsOnRecord: c.history.totalDeals,
        ...(c.history.lastTargetName ? { lastTarget: c.history.lastTargetName } : {}),
      },
      acquisitionHistory: {
        totalDeals: c.history.totalDeals,
        ...(c.history.lastTargetName ? { lastTarget: c.history.lastTargetName } : {}),
        ...(o.closeRatePct != null ? { closeRatePct: Math.round(o.closeRatePct * 100) } : {}),
      },
      acquisitionAppetite: c.buyer.appetite,
      expectedInterest: { score: r.intent.score, tier: r.intent.tier },
      ...(o.avgPremiumPct != null ? { historicalPremiumPct: Math.round(o.avgPremiumPct * 100) } : {}),
      expectedDaysToClose: Math.round(c.expectedOutcome.expectedDaysToCash),
      whyRanked: r.whyRanked,
      source: 'ExitOS Buyer Graph · Acquisition Registry (EDGAR · Wikidata · public disclosures)',
    };
  });

  const qualifiedCount = profiles.filter((p) => p.qualified).length;

  return {
    company: company.name,
    qualifiedCount,
    scoredCount: profiles.length,
    registrySize: BUYER_REGISTRY.length,
    profiles,
    summary: intel.summary,
    source: 'ExitOS Buyer Intelligence Engine',
    generatedAt: new Date().toISOString(),
  };
}

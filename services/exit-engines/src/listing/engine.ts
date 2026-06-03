import type { CompanyProfile, EngineMeta } from '../types.js';
import { runValuation } from '../valuation/engine.js';
import { runReadiness } from '../readiness/engine.js';
import { runBuyerDiscovery } from '../buyers/engine.js';
import type { BuyerCandidate } from '../buyers/engine.js';

const ENGINE = 'listing';
const VERSION = '0.1.0';

// Exit Marketplace listing engine — converts a CompanyProfile into a
// marketplace listing (anonymized public-facing + non-anonymized
// inquiry-facing) and matches buyer interest from the curated registry.

export type ListingVisibility = 'public_anonymized' | 'private_full' | 'unlisted';

export interface MarketplaceListing {
  readonly listingId: string;
  readonly title: string;                      // anonymized headline
  readonly fullName?: string;                  // present when visibility === 'private_full'
  readonly visibility: ListingVisibility;
  readonly sector: string;
  readonly businessModel: string;
  readonly jurisdiction: string;
  readonly foundedYear: number;
  readonly headline: {
    readonly arrUsd?: number;
    readonly ttmRevenueUsd?: number;
    readonly grossMarginPct: number;
    readonly arrGrowthYoyPct: number;
    readonly ebitdaMarginPct: number;
  };
  readonly askingPriceUsd: { readonly low: number; readonly mid: number; readonly high: number };
  readonly readinessScore: number;
  readonly readinessBand: string;
  readonly highlights: readonly string[];
  readonly idealBuyerProfile: {
    readonly preferredTypes: readonly string[];
    readonly checkSizeUsd: { readonly low: number; readonly high: number };
    readonly geography: readonly string[];
  };
  readonly meta: EngineMeta;
}

export interface BuyerMatch {
  readonly buyerName: string;
  readonly buyerType: string;
  readonly matchScore: number;
  readonly rationale: string;
  readonly suggestedOutreach: 'cold_intro' | 'banker_intro' | 'warm_referral' | 'direct';
}

export interface ListingMatches {
  readonly listingId: string;
  readonly matches: readonly BuyerMatch[];
  readonly summary: string;
}

export interface CreateListingOptions {
  readonly visibility?: ListingVisibility;
  readonly highlightLimit?: number;
}

function anonymizedTitle(company: CompanyProfile): string {
  const sector = company.sector.replace(/_/g, ' ');
  const arrM = company.revenue.annualRecurringRevenueUsd / 1_000_000;
  if (arrM >= 1) return `${sector.replace(/\b\w/g, (c) => c.toUpperCase())} platform · ~$${arrM.toFixed(0)}M ARR`;
  return `${sector.replace(/\b\w/g, (c) => c.toUpperCase())} platform`;
}

function buildHighlights(company: CompanyProfile, limit: number): readonly string[] {
  const out: string[] = [];
  if (company.revenue.netRetentionPct != null && company.revenue.netRetentionPct >= 1.15) out.push(`Net retention ${(company.revenue.netRetentionPct * 100).toFixed(0)}%`);
  if (company.revenue.grossMarginPct >= 0.7) out.push(`Gross margin ${(company.revenue.grossMarginPct * 100).toFixed(0)}%`);
  if (company.growth.arrGrowthYoyPct >= 0.4) out.push(`ARR growth ${(company.growth.arrGrowthYoyPct * 100).toFixed(0)}% YoY`);
  if (company.product.hasNetworkEffects) out.push('Network effects');
  if (company.product.hasDataMoat)       out.push('Data moat');
  if (company.product.aiNative)          out.push('AI-native architecture');
  if (company.product.intellectualProperty?.patentsGranted) out.push(`${company.product.intellectualProperty.patentsGranted} granted patent(s)`);
  if (company.market.marketGrowthPct >= 0.15) out.push(`Market growing ${(company.market.marketGrowthPct * 100).toFixed(0)}% CAGR`);
  if (company.revenue.ebitdaMarginPct >= 0.15) out.push(`EBITDA margin ${(company.revenue.ebitdaMarginPct * 100).toFixed(0)}%`);
  return out.slice(0, limit);
}

export function createListing(company: CompanyProfile, options: CreateListingOptions = {}): MarketplaceListing {
  const visibility = options.visibility ?? 'public_anonymized';
  const valuation = runValuation(company, { reportType: 'strategic' });
  const readiness = runReadiness(company);

  return {
    listingId: `lst-${company.id ?? 'demo'}-${Date.now().toString(36)}`,
    title: anonymizedTitle(company),
    ...(visibility === 'private_full' ? { fullName: company.name } : {}),
    visibility,
    sector: company.sector,
    businessModel: company.businessModel,
    jurisdiction: visibility === 'public_anonymized' ? 'redacted' : company.jurisdiction,
    foundedYear: company.foundedYear,
    headline: {
      ...(visibility === 'private_full' ? { arrUsd: company.revenue.annualRecurringRevenueUsd } : {}),
      ...(visibility === 'private_full' ? { ttmRevenueUsd: company.revenue.trailingTwelveMonthsRevenueUsd } : {}),
      grossMarginPct: company.revenue.grossMarginPct,
      arrGrowthYoyPct: company.growth.arrGrowthYoyPct,
      ebitdaMarginPct: company.revenue.ebitdaMarginPct,
    },
    askingPriceUsd: {
      low:  valuation.headline.low,
      mid:  valuation.headline.mid,
      high: valuation.headline.high,
    },
    readinessScore: readiness.overallScore,
    readinessBand: readiness.band,
    highlights: buildHighlights(company, options.highlightLimit ?? 6),
    idealBuyerProfile: {
      preferredTypes: company.product.hasNetworkEffects || company.product.hasDataMoat
        ? ['strategic', 'pe', 'vc']
        : ['pe', 'family_office', 'strategic'],
      checkSizeUsd: { low: valuation.headline.low, high: valuation.headline.high },
      geography: ['US', 'CA', 'GB'],
    },
    meta: { engine: ENGINE, version: VERSION, runAt: new Date().toISOString() },
  };
}

function suggestOutreach(score: number, candidateType: string): BuyerMatch['suggestedOutreach'] {
  if (score >= 0.85)                                return 'direct';
  if (score >= 0.65 && candidateType === 'strategic') return 'banker_intro';
  if (score >= 0.65)                                return 'warm_referral';
  return 'cold_intro';
}

function rationaleFor(c: BuyerCandidate): string {
  const parts: string[] = [];
  if (c.fitDimensions.sectorFit === 1) parts.push('exact sector fit');
  else if (c.fitDimensions.sectorFit > 0) parts.push('adjacent sector activity');
  if (c.fitDimensions.checkFit === 1) parts.push('check size inside band');
  if (c.fitDimensions.geographyFit === 1) parts.push('strong geography fit');
  if (c.buyer.appetite === 'active') parts.push('active acquirer in last 12 months');
  return parts.length > 0 ? parts.join(' · ') : c.buyer.thesis;
}

export function matchBuyersToListing(
  listing: MarketplaceListing,
  company: CompanyProfile,
  options: { readonly limit?: number; readonly minScore?: number } = {},
): ListingMatches {
  const limit    = options.limit    ?? 20;
  const minScore = options.minScore ?? 0.20;

  const buyers = runBuyerDiscovery(company, {
    impliedPriceUsd: listing.askingPriceUsd.mid,
    limit,
    minProbability: minScore,
  });

  const matches: BuyerMatch[] = buyers.candidates.map((c) => ({
    buyerName: c.buyer.name,
    buyerType: c.buyer.buyerType,
    matchScore: c.probability,
    rationale: rationaleFor(c),
    suggestedOutreach: suggestOutreach(c.probability, c.buyer.buyerType),
  }));

  const summary = matches.length === 0
    ? 'No buyer matches against the current criteria. Broaden the ideal buyer profile or update the listing.'
    : `${matches.length} candidate match${matches.length === 1 ? '' : 'es'} ranked. Top: ${matches[0]!.buyerName} (${(matches[0]!.matchScore * 100).toFixed(0)}%).`;

  return { listingId: listing.listingId, matches, summary };
}

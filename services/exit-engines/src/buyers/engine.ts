import type { CompanyProfile, EngineMeta } from '../types.js';
import type { BuyerEntry, BuyerType } from './registry.js';
import { BUYER_REGISTRY } from './registry.js';
import type { BuyerHistoryRollup, ConfidenceTier } from './history-types.js';
import { rollupBuyerHistory } from './history-rollup.js';

export interface BuyerSignal {
  readonly text: string;
  // 'derived' = computed from the static registry (always reliable).
  // 'verified' / 'unverified' / 'estimated' = sourced from
  // ACQUISITION_HISTORY at that confidence tier.
  // 'caution' = a negative signal (terminated deals, etc.).
  readonly kind: 'derived' | 'verified' | 'unverified' | 'estimated' | 'caution';
}

export interface BuyerCandidate {
  readonly buyer: BuyerEntry;
  readonly probability: number;              // 0..1 acquisition probability
  readonly rationale: string;
  readonly signals: readonly BuyerSignal[];
  readonly estimatedCheck: { readonly low: number; readonly high: number; readonly currency: 'USD' };
  readonly fitDimensions: {
    readonly sectorFit: number;
    readonly modelFit: number;
    readonly checkFit: number;
    readonly geographyFit: number;
    readonly activityFit: number;
    readonly historyFit: number;             // evidence-weighted M&A track record fit
  };
  readonly history: BuyerHistoryRollup;
}

function tierToKind(t: ConfidenceTier | undefined): 'verified' | 'unverified' | 'estimated' {
  if (t === 'verified') return 'verified';
  if (t === 'estimated') return 'estimated';
  return 'unverified';
}

export interface BuyerDiscoveryReport {
  readonly meta: EngineMeta;
  readonly companyHeadlineUsd: number;       // implied price the buyer ranks against
  readonly candidates: readonly BuyerCandidate[];
  readonly byType: Readonly<Record<BuyerType, number>>;
  readonly summary: string;
}

const ENGINE = 'buyers';
const VERSION = '0.1.0';

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }

function sectorFit(buyer: BuyerEntry, company: CompanyProfile): number {
  if (buyer.sectorsActive.includes(company.sector)) return 1;
  // adjacent sectors get partial credit
  const adj: Record<string, readonly string[]> = {
    enterprise_saas:      ['vertical_saas','ai_infra','developer_tools'],
    vertical_saas:        ['enterprise_saas','b2b_marketplace'],
    b2b_marketplace:      ['vertical_saas','consumer_marketplace'],
    consumer_marketplace: ['b2b_marketplace','media_content'],
    fintech_payments:     ['enterprise_saas'],
    logistics_freight:    ['mobility','b2b_marketplace'],
    mobility:             ['logistics_freight','consumer_marketplace'],
    ai_infra:             ['enterprise_saas','developer_tools'],
    developer_tools:      ['enterprise_saas','ai_infra'],
    media_content:        ['consumer_marketplace'],
    other:                [],
  };
  const adjacent = adj[company.sector] ?? [];
  for (const a of adjacent) {
    if (buyer.sectorsActive.includes(a as (typeof buyer.sectorsActive)[number])) return 0.5;
  }
  return 0;
}

function modelFit(buyer: BuyerEntry, company: CompanyProfile): number {
  return buyer.modelsActive.includes(company.businessModel) ? 1 : 0.3;
}

function checkFit(buyer: BuyerEntry, impliedPriceUsd: number): number {
  if (impliedPriceUsd <= 0) return 0;
  if (impliedPriceUsd >= buyer.checkSizeLowUsd && impliedPriceUsd <= buyer.checkSizeHighUsd) return 1;
  // graceful falloff outside the band
  const distance = impliedPriceUsd < buyer.checkSizeLowUsd
    ? (buyer.checkSizeLowUsd - impliedPriceUsd) / buyer.checkSizeLowUsd
    : (impliedPriceUsd - buyer.checkSizeHighUsd) / buyer.checkSizeHighUsd;
  return clamp01(1 - distance);
}

function geographyFit(buyer: BuyerEntry, company: CompanyProfile): number {
  if (buyer.geographyPreferred.length === 0) return 0.85; // global mandate
  if (buyer.geographyPreferred.includes(company.jurisdiction.toUpperCase())) return 1;
  return 0.3;
}

function activityFit(buyer: BuyerEntry): number {
  const base = buyer.recentActivityScore;
  const appBonus = buyer.appetite === 'active' ? 0.1 : buyer.appetite === 'warm' ? 0 : -0.25;
  return clamp01(base + appBonus);
}

// historyFit rewards an acquirer whose recent disclosed deals match the
// seller's sector and check-size band. Evidence-weighted: a buyer with
// no recorded history gets 0.35 (mild skepticism, not neutral) so real
// track record always beats absence. Check-size proximity is asymmetric
// — a buyer with a much larger median deal isn't disqualified (they
// can go down-market), but a buyer whose ceiling is below the implied
// price gets penalized hard (they can't write the check).
function historyFit(
  history: BuyerHistoryRollup,
  company: CompanyProfile,
  impliedPriceUsd: number,
): number {
  if (history.totalDeals === 0) return 0.35;
  const sectorMatches  = history.sectorMix[company.sector] ?? 0;
  const sectorWeight   = Math.min(1, sectorMatches / 2) * 0.45;
  const recencyWeight  = Math.min(1, history.dealsLast3Years / 4) * 0.30;
  // Asymmetric check fit: only penalize when median << implied (can't write the check).
  // When median >> implied (oversized buyer for the target), apply only a 25% discount.
  let checkProximity = 0.7;
  if (history.medianDisclosedCheckUsd && history.medianDisclosedCheckUsd > 0 && impliedPriceUsd > 0) {
    const ratio = history.medianDisclosedCheckUsd / impliedPriceUsd;
    if (ratio >= 0.5 && ratio <= 4) checkProximity = 1.0;          // sweet spot
    else if (ratio > 4) checkProximity = 0.75;                       // oversized
    else checkProximity = clamp01(ratio * 1.5);                      // undersized → linear penalty
  }
  const checkWeight    = checkProximity * 0.20;
  const terminationPenalty = Math.min(0.15, history.terminatedDeals * 0.05);
  return clamp01(sectorWeight + recencyWeight + checkWeight + 0.05 - terminationPenalty);
}

export interface RunOptions {
  readonly impliedPriceUsd?: number;          // expected headline; if omitted we derive from ARR
  readonly minProbability?: number;           // filter
  readonly limit?: number;                    // top-N
}

export function runBuyerDiscovery(company: CompanyProfile, opts: RunOptions = {}): BuyerDiscoveryReport {
  const implied = opts.impliedPriceUsd ?? Math.max(
    company.revenue.annualRecurringRevenueUsd * 6,
    company.revenue.trailingTwelveMonthsRevenueUsd * 3,
    20_000_000,
  );
  const minProb = opts.minProbability ?? 0.15;
  const limit   = opts.limit ?? 20;

  const candidates: BuyerCandidate[] = [];
  for (const buyer of BUYER_REGISTRY) {
    const history = rollupBuyerHistory(buyer.name);
    const dims = {
      sectorFit:     sectorFit(buyer, company),
      modelFit:      modelFit(buyer, company),
      checkFit:      checkFit(buyer, implied),
      geographyFit:  geographyFit(buyer, company),
      activityFit:   activityFit(buyer),
      historyFit:    historyFit(history, company, implied),
    };
    // Weighted probability
    const prob = clamp01(
      dims.sectorFit    * 0.25 +
      dims.modelFit     * 0.10 +
      dims.checkFit     * 0.20 +
      dims.geographyFit * 0.08 +
      dims.activityFit  * 0.15 +
      dims.historyFit   * 0.22,
    );
    if (prob < minProb) continue;

    const signals: BuyerSignal[] = [];
    if (dims.sectorFit === 1)       signals.push({ text: `Active in ${company.sector}`, kind: 'derived' });
    else if (dims.sectorFit > 0)    signals.push({ text: `Adjacent sector activity`, kind: 'derived' });
    if (dims.checkFit === 1)        signals.push({ text: `Implied price $${(implied / 1_000_000).toFixed(0)}M sits inside check-size band`, kind: 'derived' });
    if (buyer.appetite === 'active') signals.push({ text: `Acquirer appetite: active in last 12 months`, kind: 'derived' });
    if (dims.geographyFit === 1)    signals.push({ text: `Strong geography fit (${company.jurisdiction})`, kind: 'derived' });
    if (company.product.hasDataMoat && buyer.sectorsActive.includes('ai_infra'))
      signals.push({ text: `Data moat aligns with AI-infra thesis`, kind: 'derived' });

    // Evidence-grade history signals — tier inherited from the underlying data.
    const histKind = tierToKind(history.aggregateTier);
    if (history.lastTargetName && history.lastAcquiredAt) {
      const year = history.lastAcquiredAt.slice(0, 4);
      const priceTag = history.largestDealUsd ? ` ($${(history.largestDealUsd / 1_000_000_000).toFixed(1)}B largest)` : '';
      // Specific deal inherits its own confidence, not the aggregate's.
      signals.push({
        text: `Last deal: ${history.lastTargetName} (${year})${priceTag}`,
        kind: tierToKind(history.lastTargetConfidence),
      });
    }
    if (history.dealsLast3Years > 0) {
      signals.push({
        text: `${history.dealsLast3Years} disclosed deal${history.dealsLast3Years === 1 ? '' : 's'} in last 3 years`,
        kind: histKind,
      });
    }
    const sectorMatches = history.sectorMix[company.sector] ?? 0;
    if (sectorMatches > 0) {
      signals.push({
        text: `${sectorMatches} prior acquisition${sectorMatches === 1 ? '' : 's'} in ${company.sector}`,
        kind: histKind,
      });
    }
    if (history.terminatedDeals > 0) {
      signals.push({
        text: `Caution: ${history.terminatedDeals} terminated deal${history.terminatedDeals === 1 ? '' : 's'} on record`,
        kind: 'caution',
      });
    }

    candidates.push({
      buyer,
      probability: prob,
      rationale: buyer.thesis,
      signals,
      estimatedCheck: { low: buyer.checkSizeLowUsd, high: buyer.checkSizeHighUsd, currency: 'USD' },
      fitDimensions: dims,
      history,
    });
  }

  candidates.sort((a, b) => b.probability - a.probability);
  const top = candidates.slice(0, limit);

  const byType = top.reduce<Record<BuyerType, number>>((acc, c) => {
    acc[c.buyer.buyerType] = (acc[c.buyer.buyerType] ?? 0) + 1;
    return acc;
  }, { strategic: 0, pe: 0, vc: 0, family_office: 0, sponsor: 0 });

  const summary = top.length === 0
    ? 'No qualifying buyers — refine company profile or expand criteria.'
    : `${top.length} qualifying buyer${top.length === 1 ? '' : 's'} ranked — ${byType.strategic} strategic, ${byType.pe} PE, ${byType.vc} VC, ${byType.family_office} family office.`;

  return {
    meta: { engine: ENGINE, version: VERSION, runAt: new Date().toISOString(), inputs: { impliedPriceUsd: implied, sector: company.sector } },
    companyHeadlineUsd: implied,
    candidates: top,
    byType,
    summary,
  };
}

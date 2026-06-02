import type { CompanyProfile, EngineMeta } from '../types.js';
import type { BuyerEntry, BuyerType } from './registry.js';
import { BUYER_REGISTRY } from './registry.js';

export interface BuyerCandidate {
  readonly buyer: BuyerEntry;
  readonly probability: number;              // 0..1 acquisition probability
  readonly rationale: string;
  readonly signals: readonly string[];
  readonly estimatedCheck: { readonly low: number; readonly high: number; readonly currency: 'USD' };
  readonly fitDimensions: {
    readonly sectorFit: number;
    readonly modelFit: number;
    readonly checkFit: number;
    readonly geographyFit: number;
    readonly activityFit: number;
  };
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
    const dims = {
      sectorFit:     sectorFit(buyer, company),
      modelFit:      modelFit(buyer, company),
      checkFit:      checkFit(buyer, implied),
      geographyFit:  geographyFit(buyer, company),
      activityFit:   activityFit(buyer),
    };
    // Weighted probability
    const prob = clamp01(
      dims.sectorFit    * 0.30 +
      dims.modelFit     * 0.15 +
      dims.checkFit     * 0.25 +
      dims.geographyFit * 0.10 +
      dims.activityFit  * 0.20,
    );
    if (prob < minProb) continue;

    const signals: string[] = [];
    if (dims.sectorFit === 1) signals.push(`Active in ${company.sector}`);
    else if (dims.sectorFit > 0) signals.push(`Adjacent sector activity`);
    if (dims.checkFit === 1) signals.push(`Implied price $${(implied / 1_000_000).toFixed(0)}M sits inside check-size band`);
    if (buyer.appetite === 'active') signals.push(`Acquirer appetite: active in last 12 months`);
    if (dims.geographyFit === 1) signals.push(`Strong geography fit (${company.jurisdiction})`);
    if (company.product.hasDataMoat && buyer.sectorsActive.includes('ai_infra')) signals.push(`Data moat aligns with AI-infra thesis`);

    candidates.push({
      buyer,
      probability: prob,
      rationale: buyer.thesis,
      signals,
      estimatedCheck: { low: buyer.checkSizeLowUsd, high: buyer.checkSizeHighUsd, currency: 'USD' },
      fitDimensions: dims,
    });
  }

  candidates.sort((a, b) => b.probability - a.probability);
  const top = candidates.slice(0, limit);

  const byType = top.reduce<Record<BuyerType, number>>((acc, c) => {
    acc[c.buyer.buyerType] = (acc[c.buyer.buyerType] ?? 0) + 1;
    return acc;
  }, { strategic: 0, pe: 0, family_office: 0, sponsor: 0 });

  const summary = top.length === 0
    ? 'No qualifying buyers — refine company profile or expand criteria.'
    : `${top.length} qualifying buyer${top.length === 1 ? '' : 's'} ranked — ${byType.strategic} strategic, ${byType.pe} PE, ${byType.family_office} family office.`;

  return {
    meta: { engine: ENGINE, version: VERSION, runAt: new Date().toISOString(), inputs: { impliedPriceUsd: implied, sector: company.sector } },
    companyHeadlineUsd: implied,
    candidates: top,
    byType,
    summary,
  };
}

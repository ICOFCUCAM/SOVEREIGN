import type { SectorTag } from '../types.js';
import type { AcquisitionEvent, BuyerHistoryRollup, ConfidenceTier } from './history-types.js';
import { ACQUISITION_HISTORY } from './history.js';

const MS_PER_DAY = 86_400_000;

const TIER_RANK: Record<ConfidenceTier, number> = {
  verified: 4, unverified: 3, estimated: 2, synthetic: 1,
};

function meetsTier(event: AcquisitionEvent, minTier: ConfidenceTier): boolean {
  return TIER_RANK[event.confidence] >= TIER_RANK[minTier];
}

export interface RollupOptions {
  // Aggregates roll up only events at or above this tier. Defaults to
  // 'unverified' — the floor for what a curated record is worth showing.
  // Switch to 'verified' once the EDGAR/Wikidata refresh has run and
  // the snapshot is auditor-grade.
  readonly minTier?: ConfidenceTier;
  readonly asOfIso?: string;
}

export function rollupBuyerHistory(
  buyerName: string,
  optsOrAsOf: RollupOptions | string = {},
  history: readonly AcquisitionEvent[] = ACQUISITION_HISTORY,
): BuyerHistoryRollup {
  // Backwards-compat: callers that pass an ISO string get the legacy shape.
  const opts: RollupOptions = typeof optsOrAsOf === 'string'
    ? { asOfIso: optsOrAsOf }
    : optsOrAsOf;
  const minTier = opts.minTier ?? 'unverified';
  const asOfIso = opts.asOfIso ?? new Date().toISOString();

  const allBuyerEvents = history.filter((e) => e.buyerName === buyerName);
  const events = allBuyerEvents.filter((e) => meetsTier(e, minTier));
  const closedOrAnnounced = events.filter((e) => e.status === 'closed' || e.status === 'announced');
  const terminated = events.filter((e) => e.status === 'terminated').length;
  const asOf = new Date(asOfIso).getTime();

  const within = (e: AcquisitionEvent, days: number): boolean =>
    asOf - new Date(e.announcedDate).getTime() <= days * MS_PER_DAY;

  const last12 = closedOrAnnounced.filter((e) => within(e, 365)).length;
  const last3y = closedOrAnnounced.filter((e) => within(e, 365 * 3)).length;

  // Disclosed prices: include only events whose priceConfidence (or
  // event confidence as fallback) meets the tier requirement. Refuses
  // to mix estimated prices into a verified aggregate.
  const disclosed = closedOrAnnounced
    .filter((e) => e.headlinePriceUsd != null && e.headlinePriceUsd > 0)
    .filter((e) => TIER_RANK[e.priceConfidence ?? e.confidence] >= TIER_RANK[minTier])
    .map((e) => e.headlinePriceUsd!)
    .sort((a, b) => a - b);

  const avg    = disclosed.length > 0 ? disclosed.reduce((a, b) => a + b, 0) / disclosed.length : undefined;
  const median = disclosed.length > 0 ? disclosed[Math.floor(disclosed.length / 2)] : undefined;
  const largest = disclosed.length > 0 ? disclosed[disclosed.length - 1] : undefined;

  const sortedRecent = [...closedOrAnnounced].sort(
    (a, b) => new Date(b.announcedDate).getTime() - new Date(a.announcedDate).getTime(),
  );
  const last = sortedRecent[0];

  const sectorMix: Partial<Record<SectorTag, number>> = {};
  for (const e of closedOrAnnounced) {
    if (e.sector) sectorMix[e.sector] = (sectorMix[e.sector] ?? 0) + 1;
  }
  const geographyMix: Record<string, number> = {};
  for (const e of closedOrAnnounced) {
    if (e.targetGeography) geographyMix[e.targetGeography] = (geographyMix[e.targetGeography] ?? 0) + 1;
  }

  const coverageByTier: Record<ConfidenceTier, number> = {
    verified: 0, unverified: 0, estimated: 0, synthetic: 0,
  };
  for (const e of allBuyerEvents) coverageByTier[e.confidence]++;

  return {
    buyerName,
    aggregateTier: minTier,
    totalDeals: closedOrAnnounced.length,
    dealsLast12Months: last12,
    dealsLast3Years: last3y,
    ...(avg     != null ? { avgDisclosedCheckUsd:    Math.round(avg) } : {}),
    ...(median  != null ? { medianDisclosedCheckUsd: median } : {}),
    ...(largest != null ? { largestDealUsd:          largest } : {}),
    ...(last    != null ? {
      lastAcquiredAt: last.announcedDate,
      lastTargetName: last.targetName,
      lastTargetConfidence: last.confidence,
    } : {}),
    sectorMix,
    geographyMix,
    terminatedDeals: terminated,
    coverageByTier,
  };
}

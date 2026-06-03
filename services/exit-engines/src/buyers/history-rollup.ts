import type { SectorTag } from '../types.js';
import type { AcquisitionEvent, BuyerHistoryRollup } from './history-types.js';
import { ACQUISITION_HISTORY } from './history.js';

const MS_PER_DAY = 86_400_000;

export function rollupBuyerHistory(
  buyerName: string,
  asOfIso: string = new Date().toISOString(),
  history: readonly AcquisitionEvent[] = ACQUISITION_HISTORY,
): BuyerHistoryRollup {
  const events = history.filter((e) => e.buyerName === buyerName);
  const closedOrAnnounced = events.filter((e) => e.status === 'closed' || e.status === 'announced');
  const terminated = events.filter((e) => e.status === 'terminated').length;
  const asOf = new Date(asOfIso).getTime();

  const within = (e: AcquisitionEvent, days: number): boolean =>
    asOf - new Date(e.announcedDate).getTime() <= days * MS_PER_DAY;

  const last12 = closedOrAnnounced.filter((e) => within(e, 365)).length;
  const last3y = closedOrAnnounced.filter((e) => within(e, 365 * 3)).length;

  const disclosed = closedOrAnnounced
    .map((e) => e.headlinePriceUsd)
    .filter((p): p is number => p != null && p > 0)
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

  return {
    buyerName,
    totalDeals: closedOrAnnounced.length,
    dealsLast12Months: last12,
    dealsLast3Years: last3y,
    ...(avg     != null ? { avgDisclosedCheckUsd:    Math.round(avg) } : {}),
    ...(median  != null ? { medianDisclosedCheckUsd: median } : {}),
    ...(largest != null ? { largestDealUsd:          largest } : {}),
    ...(last    != null ? { lastAcquiredAt:          last.announcedDate, lastTargetName: last.targetName } : {}),
    sectorMix,
    geographyMix,
    terminatedDeals: terminated,
  };
}

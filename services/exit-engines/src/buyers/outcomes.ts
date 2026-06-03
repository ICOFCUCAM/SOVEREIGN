import type { AcquisitionEvent, ConfidenceTier } from './history-types.js';
import { ACQUISITION_HISTORY } from './history.js';

// Deal outcome engine. Rolls up a buyer's M&A track record into the
// stats corporate-development teams actually quote:
//
//   closeRate         — completed deals / (completed + lost + withdrawn)
//   avgCloseDays      — announced → closed duration on completed deals
//   medianCloseDays   — median of the above (more robust to outliers)
//   avgPremiumPct     — (headline - prior) / prior, on disclosed deals
//
// "Vista pays more but closes slower" becomes a JOIN, not a research
// project. Inherits the same provenance rails as rollupBuyerHistory:
// minTier governs which events count and the output carries the tier
// the numbers were computed at.

const MS_PER_DAY = 86_400_000;

const TIER_RANK: Record<ConfidenceTier, number> = {
  verified: 4, unverified: 3, estimated: 2, synthetic: 1,
};

function meetsTier(event: AcquisitionEvent, minTier: ConfidenceTier): boolean {
  return TIER_RANK[event.confidence] >= TIER_RANK[minTier];
}

function priceTierMeets(event: AcquisitionEvent, minTier: ConfidenceTier): boolean {
  return TIER_RANK[event.priceConfidence ?? event.confidence] >= TIER_RANK[minTier];
}

export function closeDurationDays(event: AcquisitionEvent): number | undefined {
  if (!event.closedDate) return undefined;
  const announced = new Date(event.announcedDate).getTime();
  const closed = new Date(event.closedDate).getTime();
  if (Number.isNaN(announced) || Number.isNaN(closed) || closed < announced) return undefined;
  return Math.round((closed - announced) / MS_PER_DAY);
}

export function premiumPct(event: AcquisitionEvent): number | undefined {
  if (event.headlinePriceUsd == null || event.priorReferencePriceUsd == null) return undefined;
  if (event.priorReferencePriceUsd <= 0) return undefined;
  return (event.headlinePriceUsd - event.priorReferencePriceUsd) / event.priorReferencePriceUsd;
}

export interface BuyerDealOutcomeRollup {
  readonly buyerName: string;
  readonly aggregateTier: ConfidenceTier;
  // Counts (all events that meet the tier).
  readonly loiCount:         number;     // total attempts — closed + lost_bid + withdrawn + pending + announced
  readonly closedCount:      number;     // status='closed' — buyer completed the deal
  readonly lostCount:        number;     // status='lost_bid' — rival won
  readonly withdrawnCount:   number;     // status='terminated'
  readonly pendingCount:     number;     // status='pending' | 'announced' (not yet closed)
  // Win rate over resolved attempts (closed + lost + withdrawn).
  // Undefined when no resolved attempts.
  readonly closeRatePct?:    number;
  // Duration stats on closed deals only.
  readonly avgCloseDays?:    number;
  readonly medianCloseDays?: number;
  readonly fastestCloseDays?: number;
  readonly slowestCloseDays?: number;
  // Premium stats on closed deals with prior reference price disclosed.
  readonly avgPremiumPct?:    number;
  readonly medianPremiumPct?: number;
  readonly premiumSampleSize: number;    // how many deals had a computable premium
  // Recent loss to a rival, for the UI to flag.
  readonly mostRecentLoss?:  { readonly targetName: string; readonly winningBuyerName: string; readonly announcedDate: string };
}

export interface OutcomeOptions {
  readonly minTier?: ConfidenceTier;
}

export function rollupBuyerOutcomes(
  buyerName: string,
  opts: OutcomeOptions = {},
  history: readonly AcquisitionEvent[] = ACQUISITION_HISTORY,
): BuyerDealOutcomeRollup {
  const minTier = opts.minTier ?? 'unverified';
  const events = history
    .filter((e) => e.buyerName === buyerName)
    .filter((e) => meetsTier(e, minTier));

  let closedCount    = 0;
  let lostCount      = 0;
  let withdrawnCount = 0;
  let pendingCount   = 0;

  const closeDays:   number[] = [];
  const premiums:    number[] = [];

  for (const ev of events) {
    if (ev.status === 'closed')     closedCount++;
    else if (ev.status === 'lost_bid')  lostCount++;
    else if (ev.status === 'terminated') withdrawnCount++;
    else                                 pendingCount++;       // 'pending' | 'announced'

    if (ev.status === 'closed') {
      const days = closeDurationDays(ev);
      if (days != null) closeDays.push(days);
      if (priceTierMeets(ev, minTier)) {
        const pct = premiumPct(ev);
        if (pct != null) premiums.push(pct);
      }
    }
  }

  closeDays.sort((a, b) => a - b);
  premiums.sort((a, b) => a - b);

  const loiCount  = closedCount + lostCount + withdrawnCount + pendingCount;
  const resolved  = closedCount + lostCount + withdrawnCount;
  const closeRate = resolved > 0 ? closedCount / resolved : undefined;

  const avg = (arr: number[]): number | undefined =>
    arr.length === 0 ? undefined : arr.reduce((a, b) => a + b, 0) / arr.length;

  const median = (sorted: number[]): number | undefined =>
    sorted.length === 0 ? undefined : sorted[Math.floor(sorted.length / 2)];

  // Find most recent lost bid for the UI flag.
  const losses = events
    .filter((e) => e.status === 'lost_bid' && e.winningBuyerName)
    .sort((a, b) => new Date(b.announcedDate).getTime() - new Date(a.announcedDate).getTime());
  const mostRecentLoss = losses[0]
    ? { targetName: losses[0].targetName, winningBuyerName: losses[0].winningBuyerName!, announcedDate: losses[0].announcedDate }
    : undefined;

  const avgCloseDays    = avg(closeDays);
  const medianClose     = median(closeDays);
  const avgPremium      = avg(premiums);
  const medianPremium   = median(premiums);
  const fastest         = closeDays[0];
  const slowest         = closeDays[closeDays.length - 1];

  return {
    buyerName,
    aggregateTier: minTier,
    loiCount,
    closedCount,
    lostCount,
    withdrawnCount,
    pendingCount,
    ...(closeRate != null ? { closeRatePct: closeRate } : {}),
    ...(avgCloseDays    != null ? { avgCloseDays:    Math.round(avgCloseDays) } : {}),
    ...(medianClose     != null ? { medianCloseDays: medianClose } : {}),
    ...(fastest         != null ? { fastestCloseDays: fastest } : {}),
    ...(slowest         != null ? { slowestCloseDays: slowest } : {}),
    ...(avgPremium      != null ? { avgPremiumPct:    avgPremium } : {}),
    ...(medianPremium   != null ? { medianPremiumPct: medianPremium } : {}),
    premiumSampleSize:  premiums.length,
    ...(mostRecentLoss ? { mostRecentLoss } : {}),
  };
}

// Comparative headline — given a roster of buyers, return a short
// natural-language summary of the standouts. Powers the "Vista pays
// more but closes slower" surface on the UI.
export interface OutcomeStandouts {
  readonly fastestCloser?:  { buyerName: string; medianCloseDays: number };
  readonly highestPremium?: { buyerName: string; avgPremiumPct: number };
  readonly bestCloseRate?:  { buyerName: string; closeRatePct: number; resolved: number };
}

export function compareOutcomes(rollups: readonly BuyerDealOutcomeRollup[]): OutcomeStandouts {
  let fastestCloser:  OutcomeStandouts['fastestCloser']  = undefined;
  let highestPremium: OutcomeStandouts['highestPremium'] = undefined;
  let bestCloseRate:  OutcomeStandouts['bestCloseRate']  = undefined;

  for (const r of rollups) {
    if (r.medianCloseDays != null && (fastestCloser == null || r.medianCloseDays < fastestCloser.medianCloseDays)) {
      fastestCloser = { buyerName: r.buyerName, medianCloseDays: r.medianCloseDays };
    }
    if (r.avgPremiumPct != null && (highestPremium == null || r.avgPremiumPct > highestPremium.avgPremiumPct)) {
      highestPremium = { buyerName: r.buyerName, avgPremiumPct: r.avgPremiumPct };
    }
    if (r.closeRatePct != null) {
      const resolved = r.closedCount + r.lostCount + r.withdrawnCount;
      if (resolved >= 2 && (bestCloseRate == null || r.closeRatePct > bestCloseRate.closeRatePct)) {
        bestCloseRate = { buyerName: r.buyerName, closeRatePct: r.closeRatePct, resolved };
      }
    }
  }

  return {
    ...(fastestCloser  ? { fastestCloser }  : {}),
    ...(highestPremium ? { highestPremium } : {}),
    ...(bestCloseRate  ? { bestCloseRate }  : {}),
  };
}

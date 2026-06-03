import type { BuyerEntry } from './registry.js';
import type { BuyerDealOutcomeRollup } from './outcomes.js';

// Expected Outcome Engine. Ranks buyers by the value the founder
// actually receives — not the headline price, not the probability of
// engagement, but the probability-weighted expected closing value:
//
//   expectedHeadline = impliedPrice × (1 + avgPremium)        // what they'd offer
//   expectedClosing  = expectedHeadline × closeRate           // what they'd close
//
// When premium / close-rate data is thin, the engine falls back to
// the implied price and a sector-neutral close-rate prior so the
// ranking still works for buyers with no track record — but the
// confidence chip drops to 'experimental' or 'low' so the UI can
// caveat the recommendation honestly.
//
// "Sample size is as important as the number itself." Every output
// carries the n that backs it.

export type StatConfidence = 'experimental' | 'low' | 'medium' | 'high';

export interface ConfidenceLabel {
  readonly tier: StatConfidence;
  readonly sample: number;             // backing observation count
  readonly note: string;               // human-readable explanation
}

// Map sample size → confidence tier. Calibrated against the M&A
// world's small-n reality: a single closed deal is barely a signal,
// 3-9 is informative, 10+ approaches "trust this number".
export function confidenceFromSample(n: number, label = 'observations'): ConfidenceLabel {
  if (n === 0)  return { tier: 'experimental', sample: 0, note: `no ${label} — sector-neutral prior` };
  if (n <= 2)   return { tier: 'low',          sample: n, note: `n=${n} ${label} — thin sample` };
  if (n <= 9)   return { tier: 'medium',       sample: n, note: `n=${n} ${label}` };
  return        { tier: 'high',                sample: n, note: `n=${n} ${label}` };
}

// Neutral defaults used when a buyer has no track record. These are
// sector-blind priors; once exit_close_events accrues real data, the
// orchestration layer can swap these for tenant-aggregated values.
const NEUTRAL_PREMIUM = 0.20;        // public-market M&A premiums historically cluster around 20-30%
const NEUTRAL_CLOSE_RATE = 0.55;     // mid-range close rate for non-PE acquirers

export interface ExpectedOutcome {
  readonly impliedPriceUsd:    number;
  readonly expectedHeadlineUsd: number;
  readonly expectedClosingUsd:  number;          // probability-weighted
  readonly premiumPct:         number;            // applied
  readonly closeRatePct:       number;            // applied
  readonly premiumConfidence:  ConfidenceLabel;
  readonly closeRateConfidence: ConfidenceLabel;
  readonly overallConfidence:  ConfidenceLabel;   // floor of premium + closeRate
  readonly usedFallback:       boolean;           // true when any input was a neutral prior
}

const TIER_RANK: Record<StatConfidence, number> = {
  experimental: 0, low: 1, medium: 2, high: 3,
};

function lowerTier(a: ConfidenceLabel, b: ConfidenceLabel): ConfidenceLabel {
  return TIER_RANK[a.tier] <= TIER_RANK[b.tier] ? a : b;
}

export function computeExpectedOutcome(
  _buyer: BuyerEntry,
  outcomes: BuyerDealOutcomeRollup,
  impliedPriceUsd: number,
): ExpectedOutcome {
  let usedFallback = false;

  let premium = outcomes.avgPremiumPct;
  let premiumN = outcomes.premiumSampleSize;
  if (premium == null) { premium = NEUTRAL_PREMIUM; premiumN = 0; usedFallback = true; }
  const premiumConfidence = confidenceFromSample(premiumN, 'priced deals');

  let closeRate = outcomes.closeRatePct;
  const resolved = outcomes.closedCount + outcomes.lostCount + outcomes.withdrawnCount;
  let closeN = resolved;
  if (closeRate == null) { closeRate = NEUTRAL_CLOSE_RATE; closeN = 0; usedFallback = true; }
  const closeRateConfidence = confidenceFromSample(closeN, 'resolved LOIs');

  const expectedHeadline = impliedPriceUsd * (1 + premium);
  const expectedClosing  = expectedHeadline * closeRate;

  return {
    impliedPriceUsd,
    expectedHeadlineUsd: expectedHeadline,
    expectedClosingUsd:  expectedClosing,
    premiumPct: premium,
    closeRatePct: closeRate,
    premiumConfidence,
    closeRateConfidence,
    overallConfidence: lowerTier(premiumConfidence, closeRateConfidence),
    usedFallback,
  };
}

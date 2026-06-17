import type { BuyerEntry } from './registry.js';
import type { BuyerDealOutcomeRollup } from './outcomes.js';
import { VALUATION_FRAMEWORK } from '../valuation/framework.js';

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

// Neutral defaults used when a buyer has no track record. Sourced from the
// Valuation Constitution's execution neutrals — the single home for every
// fallback prior the platform uses.
const NEUTRAL_PREMIUM       = VALUATION_FRAMEWORK.executionNeutrals.premiumPct;
const NEUTRAL_CLOSE_RATE    = VALUATION_FRAMEWORK.executionNeutrals.closeRatePct;
const NEUTRAL_DAYS_TO_CASH  = VALUATION_FRAMEWORK.executionNeutrals.daysToCash;
const NEUTRAL_RETRADE       = VALUATION_FRAMEWORK.executionNeutrals.retradePct;

export interface ExpectedOutcome {
  readonly impliedPriceUsd:    number;
  readonly expectedHeadlineUsd: number;          // what they'd offer (LOI)
  readonly expectedClosingUsd:  number;          // probability-weighted final cash to founders
  readonly expectedDaysToCash:  number;          // median announced → closed
  readonly premiumPct:         number;            // applied
  readonly closeRatePct:       number;            // applied
  readonly retradePct:         number;            // applied (negative = drop from LOI to close)
  readonly premiumConfidence:  ConfidenceLabel;
  readonly closeRateConfidence: ConfidenceLabel;
  readonly retradeConfidence:  ConfidenceLabel;
  readonly daysToCashConfidence: ConfidenceLabel;
  readonly overallConfidence:  ConfidenceLabel;   // floor of all inputs
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

  let retrade = outcomes.avgRetradePct;
  let retradeN = outcomes.retradeSampleSize;
  if (retrade == null) { retrade = NEUTRAL_RETRADE; retradeN = 0; usedFallback = true; }
  const retradeConfidence = confidenceFromSample(retradeN, 'LOI→close pairs');

  let daysToCash = outcomes.medianCloseDays ?? outcomes.avgCloseDays;
  let daysN = outcomes.closedCount;
  if (daysToCash == null) { daysToCash = NEUTRAL_DAYS_TO_CASH; daysN = 0; usedFallback = true; }
  const daysToCashConfidence = confidenceFromSample(daysN, 'closed deals');

  // expectedHeadline = the LOI we'd expect.
  // expectedClosing  = LOI × (1 + retrade) × closeRate.
  // Retrade is typically negative — buyer cuts price between LOI and signing.
  const expectedHeadline = impliedPriceUsd * (1 + premium);
  const expectedClosing  = expectedHeadline * (1 + retrade) * closeRate;

  const overallConfidence = [premiumConfidence, closeRateConfidence, retradeConfidence, daysToCashConfidence]
    .reduce(lowerTier);

  return {
    impliedPriceUsd,
    expectedHeadlineUsd: expectedHeadline,
    expectedClosingUsd:  expectedClosing,
    expectedDaysToCash:  Math.round(daysToCash),
    premiumPct: premium,
    closeRatePct: closeRate,
    retradePct: retrade,
    premiumConfidence,
    closeRateConfidence,
    retradeConfidence,
    daysToCashConfidence,
    overallConfidence,
    usedFallback,
  };
}

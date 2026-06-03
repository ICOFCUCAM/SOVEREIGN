import type { CompanyProfile } from '../types.js';
import type { BuyerType } from './registry.js';
import type { BuyerCandidate } from './engine.js';
import { runBuyerDiscovery } from './engine.js';

// Strategy Simulator. Inverts the One-Click Exit: instead of "here
// is your company, what's the universe of buyers", the founder
// specifies the exit they want and the engine plans the path to it.
//
// Input:  constraints (target value, min cash, max earnout, max
//         timeline, preferred buyer type).
// Output: a recommended buyer set (filtered + ranked by expected
//         outcome that respects the constraints), with aggregate
//         expected metrics and a recommended process structure.
//
// "At least one closes" probability uses 1 - prod(1 - p_i) on the
// per-buyer close rates (independence assumption — buyers don't
// coordinate). Conservative when fewer buyers; reasonable enough at
// 3-7 to drive recommendations.

export interface StrategyConstraints {
  readonly targetValueUsd:        number;     // founder's target headline / realized
  readonly minCashPct?:           number;     // 0..1 — minimum cash at close
  readonly maxEarnoutPct?:        number;     // 0..1 — maximum earnout exposure
  readonly maxTimelineDays?:      number;     // founder wants to be done by
  readonly preferredBuyerType?:   BuyerType | 'any';
  // Required confidence floor — drop buyers whose expectedOutcome
  // is below this tier (e.g. 'low' = exclude experimental).
  readonly minConfidence?:        'experimental' | 'low' | 'medium' | 'high';
  // How many buyers to engage in the recommended process. Defaults to
  // 5 (conventional "narrow process"). Engine caps at the filtered
  // pool size.
  readonly targetBuyersToEngage?: number;
}

export interface StrategyOutput {
  readonly recommendedBuyers:           readonly BuyerCandidate[];
  readonly expectedCloseProbability:    number;       // P(≥1 closes)
  readonly expectedTimeToCashDays:      number;       // median across recommended
  readonly expectedRealizedValueUsd:    number;       // max of expectedClosingUsd in set
  readonly expectedHeadlineUsd:         number;       // max of expectedHeadlineUsd in set
  readonly recommendedProcessStructure: ProcessStructure;
  readonly droppedByConstraint: {
    readonly tooLong:        number;     // dropped: avgCloseDays > maxTimelineDays
    readonly wrongBuyerType: number;     // dropped: type mismatch
    readonly belowTarget:    number;     // dropped: expectedClosing < targetValue × 0.85
    readonly belowConfidence: number;
  };
  readonly summary: string;             // natural-language headline
}

export interface ProcessStructure {
  readonly buyersToEngage:       number;
  readonly recommendedTimelineDays: number;
  readonly recommendedCashFloorPct: number;    // suggested negotiation floor
  readonly recommendedEarnoutCeilingPct: number;
  readonly rationale:            readonly string[];
}

const TIER_RANK: Record<NonNullable<StrategyConstraints['minConfidence']>, number> = {
  experimental: 0, low: 1, medium: 2, high: 3,
};

export function runStrategySimulator(
  company: CompanyProfile,
  constraints: StrategyConstraints,
): StrategyOutput {
  // Run the discovery engine against the founder's target as the
  // implied price — the buyer pool gets ranked relative to where the
  // founder wants to land, not where the valuation engine says.
  const report = runBuyerDiscovery(company, {
    impliedPriceUsd: constraints.targetValueUsd,
    limit: 30,
    sortBy: 'expected_outcome',
  });

  const tooLong:         BuyerCandidate[] = [];
  const wrongBuyerType:  BuyerCandidate[] = [];
  const belowTarget:     BuyerCandidate[] = [];
  const belowConfidence: BuyerCandidate[] = [];
  const survivors:       BuyerCandidate[] = [];

  const tgtFloor = constraints.targetValueUsd * 0.85;       // accept if within 15% of target
  const minTier = constraints.minConfidence ? TIER_RANK[constraints.minConfidence] : -1;
  const preferred = constraints.preferredBuyerType ?? 'any';

  for (const c of report.candidates) {
    if (preferred !== 'any' && c.buyer.buyerType !== preferred) {
      wrongBuyerType.push(c);
      continue;
    }
    if (constraints.maxTimelineDays != null && c.expectedOutcome.expectedDaysToCash > constraints.maxTimelineDays) {
      tooLong.push(c);
      continue;
    }
    if (c.expectedOutcome.expectedClosingUsd < tgtFloor) {
      belowTarget.push(c);
      continue;
    }
    if (minTier >= 0 && TIER_RANK[c.expectedOutcome.overallConfidence.tier] < minTier) {
      belowConfidence.push(c);
      continue;
    }
    survivors.push(c);
  }

  const targetBuyersToEngage = constraints.targetBuyersToEngage ?? 5;
  const recommended = survivors.slice(0, targetBuyersToEngage);

  // P(≥1 closes) = 1 - prod(1 - p_i), independence assumption.
  const expectedCloseProbability = recommended.length === 0
    ? 0
    : 1 - recommended.reduce((acc, c) => acc * (1 - c.expectedOutcome.closeRatePct), 1);

  const expectedTimeToCashDays = recommended.length === 0
    ? 0
    : median(recommended.map((c) => c.expectedOutcome.expectedDaysToCash));

  const expectedRealizedValueUsd = recommended.length === 0
    ? 0
    : Math.max(...recommended.map((c) => c.expectedOutcome.expectedClosingUsd));

  const expectedHeadlineUsd = recommended.length === 0
    ? 0
    : Math.max(...recommended.map((c) => c.expectedOutcome.expectedHeadlineUsd));

  const recommendedProcessStructure = planProcessStructure(recommended, constraints);

  const summary = buildSummary(recommended, expectedCloseProbability, expectedRealizedValueUsd, constraints);

  return {
    recommendedBuyers: recommended,
    expectedCloseProbability,
    expectedTimeToCashDays,
    expectedRealizedValueUsd,
    expectedHeadlineUsd,
    recommendedProcessStructure,
    droppedByConstraint: {
      tooLong: tooLong.length,
      wrongBuyerType: wrongBuyerType.length,
      belowTarget: belowTarget.length,
      belowConfidence: belowConfidence.length,
    },
    summary,
  };
}

function median(arr: readonly number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

function planProcessStructure(
  recommended: readonly BuyerCandidate[],
  constraints: StrategyConstraints,
): ProcessStructure {
  const rationale: string[] = [];
  if (recommended.length === 0) {
    return {
      buyersToEngage: 0,
      recommendedTimelineDays: constraints.maxTimelineDays ?? 180,
      recommendedCashFloorPct: constraints.minCashPct ?? 0.65,
      recommendedEarnoutCeilingPct: constraints.maxEarnoutPct ?? 0.15,
      rationale: ['No buyers survived the constraints — relax target / timeline or expand buyer type.'],
    };
  }

  // Timeline = the slowest of the recommended median close days,
  // rounded up to a 30-day boundary, plus a 30-day buffer for outreach.
  const slowestDays = Math.max(...recommended.map((c) => c.expectedOutcome.expectedDaysToCash));
  const recommendedTimelineDays = Math.ceil((slowestDays + 30) / 30) * 30;

  // Cash floor: max of (founder's min) and (the more cash-favoring
  // historic mix the buyer types tend toward). Strategics typically
  // accept higher cash; PE buyers structure more earnouts.
  const hasPE = recommended.some((c) => c.buyer.buyerType === 'pe');
  const hasStrategic = recommended.some((c) => c.buyer.buyerType === 'strategic');
  let cashFloor = constraints.minCashPct ?? 0.65;
  if (hasStrategic && !hasPE) cashFloor = Math.max(cashFloor, 0.75);
  if (hasPE && !hasStrategic) cashFloor = Math.max(cashFloor, 0.55);
  const earnoutCeiling = constraints.maxEarnoutPct ?? 0.15;

  if (recommended.length >= 5) rationale.push(`Engaging ${recommended.length} buyers in parallel creates leverage — best LOI typically lands 15-25% above first.`);
  else if (recommended.length >= 3) rationale.push(`${recommended.length}-buyer process is the sweet spot for high-signal targets — narrower than auction, wider than bilateral.`);
  else rationale.push(`Thin pool (${recommended.length} buyer${recommended.length === 1 ? '' : 's'}) — consider relaxing constraints to add optionality.`);

  if (hasStrategic) rationale.push('Strategic acquirers in the set — cash-heavy structure achievable; protect against retrade with reverse-break fee.');
  if (hasPE) rationale.push('PE buyer in the set — expect more earnout pressure; insist on clear, measurable milestones with shorter periods.');
  rationale.push(`Expected timeline ${recommendedTimelineDays} days assumes parallel processes and no regulatory drag.`);

  return {
    buyersToEngage: recommended.length,
    recommendedTimelineDays,
    recommendedCashFloorPct: cashFloor,
    recommendedEarnoutCeilingPct: earnoutCeiling,
    rationale,
  };
}

function buildSummary(
  recommended: readonly BuyerCandidate[],
  closeProb: number,
  realizedUsd: number,
  constraints: StrategyConstraints,
): string {
  if (recommended.length === 0) {
    return `No buyers in the pool meet your constraints (target $${(constraints.targetValueUsd / 1_000_000).toFixed(0)}M, timeline ${constraints.maxTimelineDays ?? '∞'}d). Relax the target or expand the buyer type.`;
  }
  const realizedM = (realizedUsd / 1_000_000).toFixed(0);
  const tgtM = (constraints.targetValueUsd / 1_000_000).toFixed(0);
  return `${recommended.length} buyer${recommended.length === 1 ? '' : 's'} matched. P(close)=${(closeProb * 100).toFixed(0)}% over the set. Best expected realized $${realizedM}M against target $${tgtM}M.`;
}

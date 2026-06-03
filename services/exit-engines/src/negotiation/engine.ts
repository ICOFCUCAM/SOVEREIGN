import type { CompanyProfile, EngineMeta } from '../types.js';
import type { ValuationReport } from '../valuation/engine.js';
import type {
  Offer, OfferEvaluation, OfferComparison, NegotiationState,
  ReservationLines, OfferConflict,
} from './types.js';

const ENGINE = 'negotiation';
const VERSION = '0.1.0';

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function numericTerm(offer: Offer, label: string): number | undefined {
  const t = offer.terms.find((x) => x.label.toLowerCase().includes(label.toLowerCase()));
  return t?.numeric;
}

function rangeScore(value: number, low: number, high: number): number {
  if (high === low) return value >= low ? 100 : 0;
  if (value <= low) return 0;
  if (value >= high) return 100;
  return ((value - low) / (high - low)) * 100;
}

function scorePrice(offer: Offer, valuation: ValuationReport, reserve: ReservationLines): number {
  const ref = valuation.headline;
  if (offer.headlinePriceUsd < reserve.minHeadlinePriceUsd) return 0;
  return rangeScore(offer.headlinePriceUsd, ref.low, ref.high);
}

function scoreConsideration(offer: Offer, reserve: ReservationLines): number {
  // Cash is gold; stock is reasonable when buyer is strong; earnout discounted.
  const cashScore   = rangeScore(offer.cashPct,   reserve.minCashPct, 1) * 0.6;
  const stockScore  = (1 - Math.abs(offer.stockPct - 0.20)) * 25;  // sweet-spot ~20% stock
  const earnoutPenalty = offer.earnoutPct > reserve.maxEarnoutPct
    ? -25 * ((offer.earnoutPct - reserve.maxEarnoutPct) / Math.max(0.01, 1 - reserve.maxEarnoutPct))
    : 0;
  return clamp(cashScore + stockScore + 15 + earnoutPenalty);
}

function scoreDownsideRisk(offer: Offer, reserve: ReservationLines): number {
  let s = 60;
  const escrow = numericTerm(offer, 'escrow');
  if (escrow != null && reserve.maxEscrowPct != null) {
    if (escrow > reserve.maxEscrowPct) s -= 20 * ((escrow - reserve.maxEscrowPct) / Math.max(0.01, reserve.maxEscrowPct));
    else s += 10;
  }
  const indemnity = numericTerm(offer, 'indemnity cap');
  if (indemnity != null && reserve.maxIndemnityCapPct != null) {
    if (indemnity > reserve.maxIndemnityCapPct) s -= 20 * ((indemnity - reserve.maxIndemnityCapPct) / Math.max(0.01, reserve.maxIndemnityCapPct));
    else s += 10;
  }
  return clamp(s);
}

function scoreFounderImpact(offer: Offer, reserve: ReservationLines): number {
  let s = 60;
  const retention = numericTerm(offer, 'retention');
  if (retention != null && reserve.maxRetentionMonths != null) {
    if (retention > reserve.maxRetentionMonths) s -= 15 * ((retention - reserve.maxRetentionMonths) / Math.max(1, reserve.maxRetentionMonths));
    else s += 10;
  }
  const nonCompete = offer.terms.find((t) => t.category === 'non_compete');
  if (nonCompete && reserve.maxNonCompeteScope) {
    const scopeOrder = ['local', 'national', 'continental', 'worldwide'];
    const v = nonCompete.value.toLowerCase();
    const offered = scopeOrder.findIndex((x) => v.includes(x));
    const reserveIdx = scopeOrder.indexOf(reserve.maxNonCompeteScope);
    if (offered > reserveIdx) s -= 15;
    else s += 5;
  }
  return clamp(s);
}

function detectConflicts(offer: Offer, reserve: ReservationLines): readonly OfferConflict[] {
  const out: OfferConflict[] = [];

  if (offer.headlinePriceUsd < reserve.minHeadlinePriceUsd) {
    out.push({
      term: 'Headline price',
      severity: 'hard',
      reason: `Offer ($${(offer.headlinePriceUsd / 1_000_000).toFixed(1)}M) below floor ($${(reserve.minHeadlinePriceUsd / 1_000_000).toFixed(1)}M).`,
      counterProposal: `Counter at $${(reserve.minHeadlinePriceUsd * 1.08 / 1_000_000).toFixed(1)}M with a clear synergy thesis.`,
    });
  }
  if (offer.cashPct < reserve.minCashPct) {
    out.push({
      term: 'Cash consideration',
      severity: offer.cashPct < reserve.minCashPct - 0.20 ? 'hard' : 'soft',
      reason: `Cash ${(offer.cashPct * 100).toFixed(0)}% below minimum ${(reserve.minCashPct * 100).toFixed(0)}%.`,
      counterProposal: `Re-mix to ${(reserve.minCashPct * 100).toFixed(0)}% cash. Trade earnout for cash at agreed haircut.`,
    });
  }
  if (offer.earnoutPct > reserve.maxEarnoutPct) {
    out.push({
      term: 'Earnout',
      severity: offer.earnoutPct > reserve.maxEarnoutPct + 0.10 ? 'hard' : 'soft',
      reason: `Earnout ${(offer.earnoutPct * 100).toFixed(0)}% above acceptable ${(reserve.maxEarnoutPct * 100).toFixed(0)}%.`,
      counterProposal: `Cap earnout at ${(reserve.maxEarnoutPct * 100).toFixed(0)}% with clear, founder-controllable milestones.`,
    });
  }

  const escrow = numericTerm(offer, 'escrow');
  if (escrow != null && reserve.maxEscrowPct != null && escrow > reserve.maxEscrowPct) {
    out.push({
      term: 'Escrow',
      severity: 'soft',
      reason: `Escrow ${(escrow * 100).toFixed(0)}% exceeds ${(reserve.maxEscrowPct * 100).toFixed(0)}% ceiling.`,
      counterProposal: `Cap escrow at ${(reserve.maxEscrowPct * 100).toFixed(0)}%. Substitute representations & warranties insurance.`,
    });
  }
  return out;
}

export interface EvaluateOptions {
  readonly weights?: Partial<{ price: number; consideration: number; downsideRisk: number; founderImpact: number }>;
}

export function evaluateOffer(
  offer: Offer,
  company: CompanyProfile,
  valuation: ValuationReport,
  reserve: ReservationLines,
  opts: EvaluateOptions = {},
): OfferEvaluation {
  const W = {
    price:         opts.weights?.price         ?? 0.40,
    consideration: opts.weights?.consideration ?? 0.25,
    downsideRisk:  opts.weights?.downsideRisk  ?? 0.20,
    founderImpact: opts.weights?.founderImpact ?? 0.15,
  };

  const priceScore   = scorePrice(offer, valuation, reserve);
  const considScore  = scoreConsideration(offer, reserve);
  const downsideScore = scoreDownsideRisk(offer, reserve);
  const founderScore = scoreFounderImpact(offer, reserve);

  const totalW = W.price + W.consideration + W.downsideRisk + W.founderImpact;
  const score = clamp(
    (priceScore   * W.price        +
     considScore  * W.consideration +
     downsideScore * W.downsideRisk +
     founderScore  * W.founderImpact) / totalW,
  );

  const conflicts = detectConflicts(offer, reserve);
  const hard = conflicts.filter((c) => c.severity === 'hard').length;
  const soft = conflicts.length - hard;

  let recommendation: OfferEvaluation['recommendation'];
  if (hard > 0)                    recommendation = 'decline';
  else if (score >= 75)            recommendation = 'accept';
  else if (score >= 55 || soft > 0) recommendation = 'counter';
  else                             recommendation = 'engage';

  const counterMoves: string[] = [];
  for (const c of conflicts) if (c.counterProposal) counterMoves.push(c.counterProposal);
  if (offer.headlinePriceUsd < valuation.headline.mid) {
    counterMoves.push(`Counter at $${(valuation.headline.mid / 1_000_000).toFixed(1)}M referencing the strategic methodology.`);
  }
  if (offer.cashPct < 0.7) counterMoves.push('Drive cash share above 70% to lock value at signing.');

  const foundersShare = company.cap.foundersOwnershipPct;
  const stockNetPct = 0.85;            // 15% illiquidity discount on stock consideration
  const earnoutNetPct = 0.55;          // 45% discount on earnout (probability + time value)
  const grossToFounders = offer.headlinePriceUsd * foundersShare;
  const impliedNet =
    grossToFounders * offer.cashPct +
    grossToFounders * offer.stockPct   * stockNetPct +
    grossToFounders * offer.earnoutPct * earnoutNetPct;

  return {
    offer,
    score,
    dimensions: {
      price:         { score: priceScore,    weight: W.price,        comment: `Within band ${(valuation.headline.low / 1_000_000).toFixed(0)}–${(valuation.headline.high / 1_000_000).toFixed(0)}M.` },
      consideration: { score: considScore,   weight: W.consideration, comment: `${(offer.cashPct * 100).toFixed(0)}% cash · ${(offer.stockPct * 100).toFixed(0)}% stock · ${(offer.earnoutPct * 100).toFixed(0)}% earnout.` },
      downsideRisk:  { score: downsideScore, weight: W.downsideRisk,  comment: 'Escrow + indemnity exposure.' },
      founderImpact: { score: founderScore,  weight: W.founderImpact, comment: 'Retention + non-compete scope.' },
    },
    conflicts,
    recommendation,
    counterMoves,
    impliedNetToFoundersUsd: impliedNet,
  };
}

export function compareOffers(
  offers: readonly Offer[],
  company: CompanyProfile,
  valuation: ValuationReport,
  reserve: ReservationLines,
): OfferComparison {
  const evals = offers.map((o) => evaluateOffer(o, company, valuation, reserve));
  evals.sort((a, b) => b.score - a.score);
  const leader = evals[0];

  const delta: Array<{ term: string; notes: string }> = [];
  if (evals.length >= 2) {
    const priceSpread = evals[0]!.offer.headlinePriceUsd - evals[evals.length - 1]!.offer.headlinePriceUsd;
    delta.push({ term: 'Price spread', notes: `$${(priceSpread / 1_000_000).toFixed(1)}M across the field.` });
    const cashSpread = Math.max(...evals.map((e) => e.offer.cashPct)) - Math.min(...evals.map((e) => e.offer.cashPct));
    delta.push({ term: 'Cash mix range', notes: `${(cashSpread * 100).toFixed(0)} percentage-point spread on cash share.` });
    const earnoutHigh = Math.max(...evals.map((e) => e.offer.earnoutPct));
    if (earnoutHigh > 0.20) delta.push({ term: 'Earnout exposure', notes: `One or more bids exceed 20% earnout — engineer toward cash conversion.` });
  }

  const summary = leader
    ? `${leader.offer.buyerName} leads at ${leader.score.toFixed(0)}/100 (${leader.recommendation}). Net to founders ~$${(leader.impliedNetToFoundersUsd / 1_000_000).toFixed(1)}M.`
    : 'No offers received.';

  return {
    offers: evals,
    ...(leader ? { leader: leader.offer.offerId } : {}),
    delta,
    summary,
  };
}

// Negotiation state machine — derive leverage + next move from the
// active negotiation history. Inputs: count of active offers, the
// leading buyer, days since last counter, deal stage.
export interface DeriveStateInput {
  readonly stage: NegotiationState['stage'];
  readonly activeOffers: number;
  readonly leadingBuyer?: string;
  readonly daysSinceLastMove?: number;
  readonly hasExclusivity?: boolean;
}

export function deriveNegotiationState(input: DeriveStateInput): NegotiationState {
  const { stage, activeOffers, daysSinceLastMove, hasExclusivity } = input;

  // Leverage heuristic
  let leverage: NegotiationState['leverage'] = 'medium';
  if (activeOffers >= 3 && !hasExclusivity) leverage = 'high';
  else if (activeOffers <= 1 || hasExclusivity) leverage = 'low';

  // Next-move heuristic
  let nextMove = 'Maintain cadence; respond to outstanding diligence within 24h.';
  if (stage === 'sourcing') nextMove = 'Increase top-of-funnel outreach; aim for ≥ 5 engaged candidates.';
  if (stage === 'engaged') nextMove = 'Push toward LOI: management presentation + price expectation conversation.';
  if (stage === 'diligence' && daysSinceLastMove != null && daysSinceLastMove > 7) {
    nextMove = 'Diligence has stalled. Send a deadline reminder; surface alternative bidders if you have them.';
  }
  if (stage === 'loi' && !hasExclusivity) nextMove = 'You hold leverage — counter to anchor the price before exclusivity.';
  if (stage === 'loi' && hasExclusivity) nextMove = 'Under exclusivity — execute clean. Tight diligence response cadence.';
  if (stage === 'signed') nextMove = 'Drive to close. Closing checklist is the priority surface.';

  const recommendations: string[] = [];
  if (leverage === 'high') recommendations.push('Run the auction. Set an LOI deadline; equal terms to all qualifying bidders.');
  if (leverage === 'low')  recommendations.push('Re-energise the field. Bring 3+ qualified buyers to the table before agreeing exclusivity.');
  if (activeOffers === 0)  recommendations.push('No active offers. Trigger Acquisition Intelligence + Buyer Marketplace outreach.');
  if (daysSinceLastMove != null && daysSinceLastMove > 14 && stage !== 'sourcing') {
    recommendations.push('Negotiation has gone cold. Move it forward or move on.');
  }

  return {
    activeOffers,
    ...(input.leadingBuyer != null ? { leadingBuyer: input.leadingBuyer } : {}),
    stage,
    ...(daysSinceLastMove != null ? { daysSinceLastMove } : {}),
    nextMove,
    leverage,
    recommendations,
  };
}

// Convenience meta wrapper for engine introspection.
export function negotiationEngineMeta(): EngineMeta {
  return { engine: ENGINE, version: VERSION, runAt: new Date().toISOString() };
}

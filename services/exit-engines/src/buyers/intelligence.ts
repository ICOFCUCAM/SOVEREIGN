import type { CompanyProfile } from '../types.js';
import { runBuyerDiscovery, type BuyerCandidate } from './engine.js';
import { BUYER_REGISTRY } from './registry.js';
import { assessIntent, type BuyerIntent } from './intent.js';
import { discoverAdjacentBuyers, type AdjacentBuyer } from './graph.js';

// ── ACQUISITION INTELLIGENCE PIPELINE ───────────────────────────────
// The orchestrator that turns "search buyers" into a layered engine:
//
//   L1 Registry        the full curated mandate universe
//   L2 Strategic fit   sector × model × check × geography × activity
//   L3 Pattern         evidence-weighted M&A track record
//   L4 Intent          is the buyer buying RIGHT NOW?
//   L5 Outcome         do they close, retrade, pay premiums?
//   L6 Expected result probability-weighted realized value — the ranking
//   L7 Network         graph-adjacent buyers a directory would miss
//
// The ranking is NOT "best match". It is "best expected result":
// expectedClosingUsd = offer potential × close rate − retrade drag,
// already computed per-candidate by the expected-outcome engine.

export interface PipelineLayer {
  readonly id: string;
  readonly name: string;
  readonly pool: number;          // candidates remaining after this layer
  readonly note: string;
}

export interface RankedOutcome {
  readonly rank: number;
  readonly candidate: BuyerCandidate;
  readonly intent: BuyerIntent;
  /** probability × expected realized value — the number the list is ranked by.
   *  A rich-history buyer with weak fit must not outrank a strong-fit buyer:
   *  the expected result only exists if THIS buyer transacts with THIS company. */
  readonly fitAdjustedUsd: number;
  readonly whyRanked: readonly string[];
}

export interface AcquisitionIntelligenceReport {
  readonly layers: readonly PipelineLayer[];
  readonly ranked: readonly RankedOutcome[];
  readonly hidden: readonly AdjacentBuyer[];
  readonly summary: string;
}

const pct = (x: number): string => `${Math.round(x * 100)}%`;

function whyRanked(c: BuyerCandidate, intent: BuyerIntent): string[] {
  const out: string[] = [];
  const sectorDeals = Object.values(c.history.sectorMix).reduce((s, n) => s + (n ?? 0), 0);
  if (sectorDeals > 0) out.push(`Acquired ${c.history.totalDeals} compan${c.history.totalDeals === 1 ? 'y' : 'ies'} on record${c.history.lastTargetName ? `, most recently ${c.history.lastTargetName}` : ''}`);
  if (intent.tier !== 'low') out.push(`${intent.tier === 'high' ? 'Active' : 'Selective'} acquisition strategy — intent ${intent.score}/100`);
  if (c.fitDimensions.geographyFit >= 0.6) out.push('Geographic overlap with your operating footprint');
  if ((c.outcomes.avgPremiumPct ?? 0) > 0.05) out.push(`Historical premium payer (${pct(c.outcomes.avgPremiumPct!)} avg over reference)`);
  if ((c.outcomes.closeRatePct ?? 0) >= 0.7) out.push(`Strong close history (${pct(c.outcomes.closeRatePct!)} of announced deals closed)`);
  if (c.fitDimensions.sectorFit >= 0.9) out.push('Direct sector mandate match');
  if (c.fitDimensions.checkFit >= 0.7) out.push('Your valuation sits inside their demonstrated check range');
  if (out.length === 0) out.push(c.rationale);
  return out.slice(0, 6);
}

export interface IntelligenceOptions {
  readonly impliedPriceUsd?: number;
  readonly limit?: number;          // ranked outcomes returned (default 8)
  readonly minIntentScore?: number; // L4 screen (default 20)
}

export function runAcquisitionIntelligence(
  company: CompanyProfile,
  opts: IntelligenceOptions = {},
): AcquisitionIntelligenceReport {
  const limit = opts.limit ?? 8;
  const minIntent = opts.minIntentScore ?? 20;

  // L1–L3 + L5–L6 run inside discovery (fit, pattern, outcomes, expected
  // outcome). Pull a generous pool so the intent screen has room to cut.
  const discovery = runBuyerDiscovery(company, {
    ...(opts.impliedPriceUsd != null ? { impliedPriceUsd: opts.impliedPriceUsd } : {}),
    limit: Math.max(limit * 3, 18),
    sortBy: 'expected_outcome',
  });

  const withIntent = discovery.candidates.map((candidate) => ({
    candidate,
    intent: assessIntent(candidate.buyer, candidate.history),
  }));

  // L4 — intent screen
  const screened = withIntent.filter((x) => x.intent.score >= minIntent);

  // L6 — rank by fit-adjusted expected value: acquisition probability ×
  // expected realized value. Raw expected value alone would let a deep-
  // pocketed, poor-fit buyer (the "Thoma Bravo for a freight marketplace"
  // case) outrank the buyer most likely to actually transact.
  const fitAdjusted = (x: { candidate: BuyerCandidate }): number =>
    x.candidate.probability * x.candidate.expectedOutcome.expectedClosingUsd;
  const ranked: RankedOutcome[] = [...screened]
    .sort((a, b) => fitAdjusted(b) - fitAdjusted(a))
    .slice(0, limit)
    .map((x, i) => ({ rank: i + 1, candidate: x.candidate, intent: x.intent, fitAdjustedUsd: Math.round(fitAdjusted(x)), whyRanked: whyRanked(x.candidate, x.intent) }));

  // L7 — network discovery beyond the direct-mandate pool
  const hidden = discoverAdjacentBuyers(company.sector, 5);

  const layers: PipelineLayer[] = [
    { id: 'registry', name: 'Registry', pool: BUYER_REGISTRY.length, note: 'curated, verified mandates' },
    { id: 'fit', name: 'Strategic fit', pool: discovery.candidates.length, note: 'sector × model × check × geography' },
    { id: 'pattern', name: 'Acquisition pattern', pool: discovery.candidates.filter((c) => c.history.totalDeals > 0).length, note: 'evidence-weighted track record' },
    { id: 'intent', name: 'Buyer intent', pool: screened.length, note: `buying now (intent ≥ ${minIntent})` },
    { id: 'outcome', name: 'Outcome record', pool: screened.filter((x) => x.candidate.outcomes.closeRatePct != null || x.candidate.outcomes.avgPremiumPct != null).length, note: 'close rate · premium · retrade' },
    { id: 'expected', name: 'Expected result', pool: ranked.length, note: 'ranked by probability-weighted value' },
  ];

  const top = ranked[0];
  const summary = top
    ? `${top.candidate.buyer.name} leads on fit-adjusted expected value — not headline price: ` +
      `$${(top.candidate.expectedOutcome.expectedClosingUsd / 1e6).toFixed(0)}M expected at ` +
      `${pct(top.candidate.expectedOutcome.closeRatePct)} close probability, ~${Math.round(top.candidate.expectedOutcome.expectedDaysToCash)} days to cash.`
    : 'No candidate cleared the intent screen — widen the pool or lower the threshold.';

  return { layers, ranked, hidden, summary };
}

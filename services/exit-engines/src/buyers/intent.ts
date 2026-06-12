import type { BuyerEntry } from './registry.js';
import type { BuyerHistoryRollup } from './history-types.js';

// ── LAYER 4 · BUYER INTENT ──────────────────────────────────────────
// Fit answers "would this buyer want this company?". Intent answers a
// different question: "is this buyer buying RIGHT NOW?". The two are
// scored separately so a perfect-fit dormant acquirer doesn't outrank
// a good-fit buyer in an active deployment cycle.
//
// Intent is computed only from measurable inputs: acquisition cadence
// and recency from the source-referenced history, plus the registry's
// curated appetite/activity assessment. Signals we cannot yet observe
// (fund raises, public statements, corp-dev hiring, earnings-call
// language) are carried as explicit `observed: false` slots — the
// engine is honest about what it knows and extensible for the feeds
// that fill the rest in.

export type IntentSignalKind =
  | 'cadence'        // deals in the last 12 months
  | 'recency'        // time since the last closed acquisition
  | 'appetite'       // curated mandate appetite
  | 'activity'       // registry activity score (rolling 12m)
  | 'capital_raised' // new fund / balance-sheet capacity (feed not wired)
  | 'statements'     // public acquisition statements (feed not wired)
  | 'hiring';        // corp-dev hiring (feed not wired)

export interface IntentSignal {
  readonly kind: IntentSignalKind;
  readonly detail: string;
  readonly contribution: number;   // 0..1 share of the observed score
  readonly observed: boolean;      // false ⇒ no data feed on record yet
}

export interface BuyerIntent {
  readonly score: number;          // 0..100
  readonly tier: 'high' | 'medium' | 'low';
  readonly signals: readonly IntentSignal[];
  readonly observedSignals: number;
  readonly headline: string;
}

function daysSince(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return undefined;
  return Math.round((Date.now() - t) / 86_400_000);
}

export function assessIntent(buyer: BuyerEntry, history: BuyerHistoryRollup): BuyerIntent {
  const signals: IntentSignal[] = [];

  // cadence — deals in the trailing 12 months (weight 0.35)
  const cadence = Math.min(1, history.dealsLast12Months / 3);
  signals.push({
    kind: 'cadence',
    detail: history.dealsLast12Months > 0
      ? `${history.dealsLast12Months} acquisition${history.dealsLast12Months === 1 ? '' : 's'} closed in the last 12 months`
      : `no closed acquisition in the last 12 months (${history.totalDeals} on record)`,
    contribution: cadence * 0.35,
    observed: true,
  });

  // recency — how recently the buyer last closed (weight 0.20)
  const dSince = daysSince(history.lastAcquiredAt);
  const recency = dSince == null ? 0 : Math.max(0, 1 - dSince / 1095); // 3y decay
  signals.push({
    kind: 'recency',
    detail: history.lastTargetName && dSince != null
      ? `last closed ${history.lastTargetName} ${Math.round(dSince / 30)} months ago`
      : 'no dated acquisition on record',
    contribution: recency * 0.20,
    observed: dSince != null,
  });

  // appetite — curated mandate state (weight 0.25)
  const appetite = buyer.appetite === 'active' ? 1 : buyer.appetite === 'warm' ? 0.5 : 0.1;
  signals.push({
    kind: 'appetite',
    detail: `mandate appetite assessed ${buyer.appetite}`,
    contribution: appetite * 0.25,
    observed: true,
  });

  // activity — registry rolling activity score (weight 0.20)
  signals.push({
    kind: 'activity',
    detail: `recent market activity ${Math.round(buyer.recentActivityScore * 100)}/100`,
    contribution: buyer.recentActivityScore * 0.20,
    observed: true,
  });

  // future feeds — explicit, honest placeholders
  for (const kind of ['capital_raised', 'statements', 'hiring'] as const) {
    signals.push({ kind, detail: 'no data feed on record', contribution: 0, observed: false });
  }

  const score = Math.round(signals.reduce((s, x) => s + x.contribution, 0) * 100);
  const tier = score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low';
  const observedSignals = signals.filter((s) => s.observed).length;
  const headline =
    tier === 'high' ? 'In an active deployment cycle — engage now'
    : tier === 'medium' ? 'Buying selectively — a strong angle is required'
    : 'No current buying evidence — deprioritize for outreach';

  return { score, tier, signals, observedSignals, headline };
}

/**
 * Investor & marketplace intelligence — deterministic ranking signals derived
 * from registry + telemetry data. Pure functions; no network, no randomness.
 */
import type { Domain, AnalyticsEvent } from './types';

/** Events per domain within the trailing window — the momentum signal. */
export function momentumMap(events: AnalyticsEvent[], days = 7): Record<string, number> {
  const cutoff = Date.now() - days * 86_400_000;
  const m: Record<string, number> = {};
  for (const e of events) {
    if (!e.domain_id) continue;
    if (new Date(e.created_at).getTime() < cutoff) continue;
    m[e.domain_id] = (m[e.domain_id] || 0) + 1;
  }
  return m;
}

/**
 * AI opportunity score (0–100): blends asset quality, demand, recent momentum,
 * and scarcity into a single investment-attractiveness signal.
 */
export function opportunityScore(d: Domain, momentum = 0): number {
  const quality = d.valuation_score || 0;
  const demand = Math.min(100, (d.view_count || 0) * 0.8 + (d.inquiry_count || 0) * 12);
  const mom = Math.min(100, momentum * 15);
  const scarcity = Math.min(100, (d.is_premium ? 60 : 30) + (d.is_featured ? 40 : 0));
  const score = Math.round(quality * 0.45 + demand * 0.2 + mom * 0.2 + scarcity * 0.15);
  return Math.max(1, Math.min(100, score));
}

export interface Confidence {
  score: number;
  level: 'Exceptional' | 'High' | 'Moderate' | 'Speculative';
  color: string;
}

/** Acquisition-confidence indicator: quality + verification + demand. */
export function acquisitionConfidence(d: Domain): Confidence {
  const verif = (d.ssl_verified ? 5 : 0) + (d.ownership_verified ? 5 : 0);
  const demandBoost = Math.min(10, (d.inquiry_count || 0) * 3);
  const score = Math.max(0, Math.min(100, (d.valuation_score || 0) + verif + demandBoost));
  if (score >= 90) return { score, level: 'Exceptional', color: '#10B981' };
  if (score >= 78) return { score, level: 'High', color: '#00D9FF' };
  if (score >= 65) return { score, level: 'Moderate', color: '#F59E0B' };
  return { score, level: 'Speculative', color: '#94A3B8' };
}

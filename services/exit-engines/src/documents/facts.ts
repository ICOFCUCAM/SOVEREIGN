import type { ValuationConstitution } from '../valuation/institutional.js';
import { figure, type Figure } from './figure.js';

// ── THE VALUATION FACT SHEET ────────────────────────────────────────
// The intelligence layer's canonical output, as Figures. This is the
// institutional tear sheet every document draws its numbers from — value,
// confidence, methodology and provenance for each headline metric. No
// document computes these; they read them here.

const dayAge = (isoDate?: string): number | undefined => {
  if (!isoDate) return undefined;
  const t = new Date(isoDate).getTime();
  if (Number.isNaN(t)) return undefined;
  return Math.max(0, Math.round((Date.now() - t) / 86_400_000));
};

export function valuationFacts(c: ValuationConstitution): Figure[] {
  const runDate = c.meta.runAt.slice(0, 10);
  const fw = `ExitOS Valuation Framework v${c.frameworkVersion}`;
  const pPct = (x: number): string => `${Math.round(x * 100)}%`;
  const usd = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);
  const freshAge = dayAge(c.provenanceSummary.mostRecentDataDate);

  return [
    figure({
      key: 'enterprise_value', label: 'Enterprise Value (midpoint)',
      value: usd(c.headline.mid),
      source: fw, confidence: `${c.confidence.score}%`, last_updated: runDate,
      methodology: 'Financial baseline (reliability-weighted multiples) × (1 + applied strategic premium)',
    }),
    figure({
      key: 'enterprise_value_range', label: 'Enterprise Value range',
      value: `${usd(c.headline.low)}–${usd(c.headline.high)}`,
      source: fw, confidence: `${c.confidence.score}%`, last_updated: runDate,
      methodology: 'Low/high of the weighted methodology bands with the strategic premium applied',
    }),
    figure({
      key: 'confidence', label: 'Confidence',
      value: `${c.confidence.score}%`,
      source: fw, confidence: c.confidence.tier, last_updated: runDate,
      methodology: 'Composite: data completeness, comparable depth, sector maturity, financial quality, data freshness',
    }),
    figure({
      key: 'methods_used', label: 'Methods used',
      value: String(c.methodologies.length),
      source: fw, confidence: 'exact', last_updated: runDate,
      methodology: 'Count of weighted valuation methodologies that fired for this profile',
    }),
    figure({
      key: 'comparable_transactions', label: 'Comparable transactions',
      value: String(c.comparablesUsed),
      source: 'ExitOS Acquisition Registry', confidence: c.premium.confidence.tier, last_updated: c.provenanceSummary.mostRecentDataDate ?? runDate,
      methodology: 'Same-sector, source-referenced precedent transactions (lost bids excluded)',
    }),
    figure({
      key: 'qualified_buyers', label: 'Qualified buyers',
      value: String(c.buyerUniverse.qualified),
      source: 'ExitOS Buyer Graph', confidence: `${c.buyerUniverse.scored} scored`, last_updated: runDate,
      methodology: `Buyers above the ${pPct(0.5)} acquisition-probability bar, from a ${c.buyerUniverse.registry}-mandate registry`,
    }),
    figure({
      key: 'expected_close_time', label: 'Expected close time',
      value: `${c.timeToClose.lowDays}–${c.timeToClose.highDays} days`,
      source: 'ExitOS Outcome Engine', confidence: c.premium.confidence.tier, last_updated: runDate,
      methodology: 'Announced→closed span across the ranked likely acquirers',
    }),
    figure({
      key: 'observed_premium_range', label: 'Observed premium range',
      value: `${pPct(c.premium.rangeLowPct)}–${pPct(c.premium.rangeHighPct)}`,
      source: 'ExitOS Acquisition Registry', confidence: c.premium.confidence.tier, last_updated: c.provenanceSummary.mostRecentDataDate ?? runDate,
      methodology: `Premiums over disclosed reference price across ${c.premium.observedPremiums.length} precedent(s) (${c.premium.basis.replace(/_/g, ' ')})`,
    }),
    figure({
      key: 'applied_premium', label: 'Applied premium',
      value: pPct(c.premium.appliedPct),
      source: 'ExitOS Acquisition Registry', confidence: c.premium.confidence.tier, last_updated: runDate,
      methodology: 'Mean of observed precedent premiums (never a fixed assumption)',
    }),
    figure({
      key: 'data_freshness', label: 'Data freshness',
      value: freshAge != null ? `${freshAge} days` : 'n/a',
      source: 'ExitOS Acquisition Registry', confidence: `${Math.round(c.confidence.drivers.dataFreshness * 100)}%`, last_updated: c.provenanceSummary.mostRecentDataDate ?? runDate,
      methodology: 'Age of the most recent comparable transaction on record',
    }),
  ];
}

/** Fast lookup by key. */
export function factMap(facts: readonly Figure[]): Map<string, Figure> {
  return new Map(facts.map((f) => [f.key, f]));
}

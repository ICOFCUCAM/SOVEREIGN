import type { AcquisitionEvent } from '../buyers/history-types.js';
import { ACQUISITION_HISTORY } from '../buyers/history.js';
import type { MarketConditions, MarketVariable, MarketFeedInput } from './types.js';

// ── MARKET DATA ENGINE ──────────────────────────────────────────────
// Pure (no network, no fs) so it runs in the browser alongside the
// valuation engine. The M&A market cycle is DERIVED from the acquisition
// registry's own deal-flow trend — a real, traceable number available now.
// Public comparables, the rate environment and retrade risk come from
// injected external feeds when provided, and are honestly absent otherwise.

const DAY = 86_400_000;
const WINDOW_DAYS = 730;             // 24-month trailing windows

const absent = (name: string, methodology: string, runAt: string): MarketVariable => ({
  name, present: false, value: '— absent',
  source: 'not_provided', source_url: null, confidence: 'none',
  last_updated: runAt, methodology,
});

/** M&A cycle from trailing-24m deal volume vs the prior 24m, anchored on the
 *  registry's own most-recent event so the signal reflects the data, not the
 *  wall clock. Real and source-referenced. */
export function marketCycle(history: readonly AcquisitionEvent[] = ACQUISITION_HISTORY): MarketVariable {
  const dates = history
    .map((e) => new Date(e.announcedDate).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  if (dates.length < 8) {
    return absent('market_cycle', 'insufficient dated events in the registry to assess a cycle', new Date().toISOString());
  }
  const anchor = dates[dates.length - 1]!;
  const recent = dates.filter((t) => t > anchor - WINDOW_DAYS * DAY).length;
  const prior = dates.filter((t) => t <= anchor - WINDOW_DAYS * DAY && t > anchor - 2 * WINDOW_DAYS * DAY).length;
  const ratio = prior > 0 ? recent / prior : 1;
  const label = ratio >= 1.15 ? 'Expansion' : ratio <= 0.85 ? 'Contraction' : 'Neutral';
  const asOf = new Date(anchor).toISOString().slice(0, 10);

  return {
    name: 'market_cycle',
    present: true,
    value: `${label} (${ratio.toFixed(2)}× trailing deal volume)`,
    source: 'ExitOS Acquisition Registry',
    source_url: 'https://en.wikipedia.org/wiki/Lists_of_corporate_mergers_and_acquisitions',
    confidence: recent + prior >= 20 ? 'medium' : 'low',
    last_updated: asOf,
    methodology: `Trailing 24-month deal volume (${recent}) vs prior 24 months (${prior}) across ${dates.length} dated registry events`,
  };
}

export function assessMarketConditions(
  feed: MarketFeedInput = {},
  history: readonly AcquisitionEvent[] = ACQUISITION_HISTORY,
): MarketConditions {
  const runAt = new Date().toISOString();

  const comparable_public_companies: MarketVariable = feed.public_companies
    ? {
        name: 'comparable_public_companies',
        present: true,
        value: `${feed.public_companies.count} peers${feed.public_companies.medianEvToRevenue != null ? `, median ${feed.public_companies.medianEvToRevenue.toFixed(1)}× EV/Rev` : ''}`,
        source: feed.public_companies.source,
        source_url: feed.public_companies.source_url,
        confidence: 'reported',
        last_updated: feed.public_companies.as_of,
        methodology: 'Injected public-comparables feed (trading multiples of sector peers)',
      }
    : absent('comparable_public_companies', 'public-comparables feed not connected', runAt);

  const interest_rate_environment: MarketVariable = feed.interest_rate
    ? {
        name: 'interest_rate_environment',
        present: true,
        value: feed.interest_rate.label,
        source: feed.interest_rate.source,
        source_url: feed.interest_rate.source_url,
        confidence: 'reported',
        last_updated: feed.interest_rate.as_of,
        methodology: 'Injected rate-environment feed',
      }
    : absent('interest_rate_environment', 'rate feed not connected', runAt);

  const retrade_risk: MarketVariable = feed.retrade
    ? {
        name: 'retrade_risk',
        present: true,
        value: `${(feed.retrade.avgRetradePct * 100).toFixed(0)}% avg LOI→close (n=${feed.retrade.sample})`,
        source: feed.retrade.source,
        source_url: feed.retrade.source_url,
        confidence: feed.retrade.sample >= 10 ? 'medium' : 'low',
        last_updated: feed.retrade.as_of,
        methodology: 'Injected retrade feed: average price change between LOI and close',
      }
    : absent('retrade_risk', 'LOI→close pairs not in static snapshot', runAt);

  return {
    comparable_public_companies,
    market_cycle: marketCycle(history),
    interest_rate_environment,
    retrade_risk,
  };
}

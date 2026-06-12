import type { CompanyProfile } from '../types.js';
import { ACQUISITION_HISTORY } from './history.js';
import { closeDurationDays, premiumPct } from './outcomes.js';
import { confidenceFromSample } from './expected-outcome.js';
import { runAcquisitionIntelligence } from './intelligence.js';

// ── PHASE 5 · SIMILAR TRANSACTION ENGINE ────────────────────────────
// For a founder company: the companies like it that actually sold, who
// bought them, what was paid over reference, how long close took — and
// the buyers most likely to repeat the pattern. Every comparable is a
// source-referenced event from the curated history; the likely-buyer
// list is the intelligence pipeline's fit-adjusted ranking; confidence
// is derived from the comparable sample size, never asserted.

export interface SimilarExit {
  readonly target: string;
  readonly buyer: string;
  readonly date?: string;
  readonly priceUsd?: number;
  readonly premiumPct?: number;
  readonly closeDays?: number;
  readonly status: string;
  readonly rationale: string;            // why it is comparable
  readonly sourceRef: string;
}

export interface SimilarTransactionsReport {
  readonly sector: string;
  readonly similarExits: readonly SimilarExit[];
  readonly likelyBuyers: ReadonlyArray<{ name: string; fitAdjustedUsd: number; probabilityPct: number }>;
  readonly medians: { premiumPct?: number; closeDays?: number; priceUsd?: number };
  readonly confidence: { tier: string; sample: number; note: string };
  readonly summary: string;
}

const median = (xs: number[]): number | undefined => {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1]! + s[m]!) / 2;
};

export function runSimilarTransactions(company: CompanyProfile, limit = 8): SimilarTransactionsReport {
  const sector = company.sector;

  // comparables: same-sector events from the source-referenced history
  const comps = ACQUISITION_HISTORY
    .filter((e) => e.sector === sector && e.status !== 'lost_bid')
    .sort((a, b) => (b.announcedDate || '').localeCompare(a.announcedDate || ''))
    .slice(0, limit);

  const similarExits: SimilarExit[] = comps.map((e) => {
    const prem = premiumPct(e);
    const days = closeDurationDays(e);
    return {
      target: e.targetName,
      buyer: e.buyerName,
      ...(e.announcedDate ? { date: e.announcedDate } : {}),
      ...(e.headlinePriceUsd ? { priceUsd: e.headlinePriceUsd } : {}),
      ...(prem != null ? { premiumPct: prem } : {}),
      ...(days != null ? { closeDays: days } : {}),
      status: e.status,
      rationale: `Same sector (${sector.replace(/_/g, ' ')})${e.targetGeography === company.jurisdiction ? ' and same jurisdiction' : ''}${e.status === 'closed' ? ' · completed transaction' : ''}`,
      sourceRef: e.sourceRefs[0] ? `${e.sourceRefs[0].kind}:${e.sourceRefs[0].ref}` : 'manual',
    };
  });

  // who repeats the pattern: the pipeline's fit-adjusted ranking
  const intel = runAcquisitionIntelligence(company, { limit: 5 });
  const likelyBuyers = intel.ranked.map((r) => ({
    name: r.candidate.buyer.name,
    fitAdjustedUsd: r.fitAdjustedUsd,
    probabilityPct: Math.round(r.candidate.probability * 100),
  }));

  const medians = {
    ...(median(similarExits.map((s) => s.premiumPct!).filter((x) => x != null)) != null
      ? { premiumPct: median(similarExits.map((s) => s.premiumPct!).filter((x) => x != null))! } : {}),
    ...(median(similarExits.map((s) => s.closeDays!).filter((x) => x != null)) != null
      ? { closeDays: median(similarExits.map((s) => s.closeDays!).filter((x) => x != null))! } : {}),
    ...(median(similarExits.map((s) => s.priceUsd!).filter((x) => x != null)) != null
      ? { priceUsd: median(similarExits.map((s) => s.priceUsd!).filter((x) => x != null))! } : {}),
  };

  const conf = confidenceFromSample(similarExits.length, 'comparable transactions');
  const top = likelyBuyers[0];
  const summary = similarExits.length
    ? `${similarExits.length} comparable ${sector.replace(/_/g, ' ')} exits on record` +
      (medians.premiumPct != null ? `, median premium ${(medians.premiumPct * 100).toFixed(0)}%` : '') +
      (medians.closeDays != null ? `, median ${Math.round(medians.closeDays)} days to close` : '') +
      (top ? `. ${top.name} is the most likely repeat buyer.` : '.')
    : `No same-sector comparables indexed yet for ${sector.replace(/_/g, ' ')} — the radar widens this with every ingest run.`;

  return {
    sector,
    similarExits,
    likelyBuyers,
    medians,
    confidence: { tier: conf.tier, sample: conf.sample, note: conf.note },
    summary,
  };
}

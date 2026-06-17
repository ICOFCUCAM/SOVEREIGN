import { mapToExitOs } from '../scripts/ingest/taxonomy.js';

// ── EXITOS ACQUISITION INDEXES (Stage 8) ────────────────────────────
// Bloomberg has indexes; ExitOS has acquisition indexes. For each ExitOS
// sector, the aggregate the whole network produces: acquisition volume and
// its trend, active buyers, disclosed deal sizes and value. Pure and
// testable — computed from verified registry events, nothing modelled.
// This is the figure set that strengthens with every event ingested.

export interface IndexEventInput {
  readonly buyer_id: string;
  readonly announced_date?: string;
  readonly value_usd?: number;
  readonly industry?: string;
}

export interface SectorIndex {
  readonly sector: string;            // ExitOS taxonomy sector
  readonly volume: number;            // total indexed acquisitions
  readonly volume12m: number;         // trailing 12 months (anchored on latest event)
  readonly volumePrior12m: number;    // the 12 months before that
  readonly trendPct: number | null;   // (12m − prior) / prior
  readonly activeBuyers: number;      // distinct acquirers
  readonly disclosedDeals: number;
  readonly medianDealUsd: number | null;
  readonly totalDisclosedUsd: number;
}

const YEAR_MS = 365 * 86_400_000;
const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2);
};

interface Acc {
  volume: number; v12: number; vPrior: number;
  buyers: Set<string>; values: number[]; disclosedUsd: number;
}

export function sectorIndexes(events: readonly IndexEventInput[]): SectorIndex[] {
  // anchor the trailing windows on the most recent dated event in the data
  let anchor = 0;
  for (const e of events) {
    const t = e.announced_date ? new Date(e.announced_date).getTime() : NaN;
    if (!Number.isNaN(t) && t > anchor) anchor = t;
  }

  const acc = new Map<string, Acc>();
  for (const e of events) {
    const sectors = mapToExitOs(e.industry);
    if (!sectors.length) continue;
    const t = e.announced_date ? new Date(e.announced_date).getTime() : NaN;
    for (const sector of sectors) {
      const a = acc.get(sector) ?? { volume: 0, v12: 0, vPrior: 0, buyers: new Set<string>(), values: [], disclosedUsd: 0 };
      a.volume++;
      a.buyers.add(e.buyer_id);
      if (e.value_usd) { a.values.push(e.value_usd); a.disclosedUsd += e.value_usd; }
      if (!Number.isNaN(t) && anchor) {
        if (t > anchor - YEAR_MS) a.v12++;
        else if (t > anchor - 2 * YEAR_MS) a.vPrior++;
      }
      acc.set(sector, a);
    }
  }

  return [...acc.entries()]
    .map(([sector, a]) => ({
      sector,
      volume: a.volume,
      volume12m: a.v12,
      volumePrior12m: a.vPrior,
      trendPct: a.vPrior > 0 ? (a.v12 - a.vPrior) / a.vPrior : null,
      activeBuyers: a.buyers.size,
      disclosedDeals: a.values.length,
      medianDealUsd: median(a.values),
      totalDisclosedUsd: a.disclosedUsd,
    }))
    .sort((x, y) => y.volume - x.volume);
}

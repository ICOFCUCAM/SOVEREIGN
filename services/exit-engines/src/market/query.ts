import type { AcquisitionIndex, IndexEvent } from './types.js';
import type { Region } from './regions.js';

// ── KNOWLEDGE GRAPH QUERY ───────────────────────────────────────────
// "Show me every buyer that acquired freight-tech in Europe between $10M
// and $500M in the last 5 years." A pure filter over the source-tagged
// event index — every result row carries its provenance. No fabrication:
// it only ever returns real indexed events.

export interface GraphQuery {
  readonly sector?: string;       // industry / sector token (substring, case-insensitive)
  readonly region?: Region;
  readonly country?: string;      // substring match on target country
  readonly minUsd?: number;
  readonly maxUsd?: number;
  readonly sinceYear?: number;
  readonly buyer?: string;        // buyer name substring
  readonly limit?: number;
}

export interface BuyerRollup { readonly buyer_id: string; readonly name: string; readonly deals: number; readonly disclosedUsd: number }

export interface GraphResult {
  readonly query: GraphQuery;
  readonly events: readonly IndexEvent[];
  readonly buyers: readonly BuyerRollup[];   // distinct buyers, ranked by deal count
  readonly totalMatched: number;
  readonly disclosedUsd: number;
  readonly note: string;
}

export function queryAcquisitions(index: AcquisitionIndex, q: GraphQuery): GraphResult {
  const sector = q.sector?.toLowerCase().trim();
  const country = q.country?.toLowerCase().trim();
  const buyer = q.buyer?.toLowerCase().trim();

  const matched = index.events.filter((e) => {
    if (sector && !(e.i ?? '').toLowerCase().includes(sector)) return false;
    if (q.region && e.r !== q.region) return false;
    if (country && !(e.c ?? '').toLowerCase().includes(country)) return false;
    if (buyer && !e.b.toLowerCase().includes(buyer)) return false;
    if (q.minUsd != null && !(e.v != null && e.v >= q.minUsd)) return false;
    if (q.maxUsd != null && !(e.v != null && e.v <= q.maxUsd)) return false;
    if (q.sinceYear != null) {
      const y = e.d ? Number(e.d.slice(0, 4)) : NaN;
      if (!(y >= q.sinceYear)) return false;
    }
    return true;
  });

  // distinct buyers, ranked by how many matching deals they did
  const byBuyer = new Map<string, BuyerRollup>();
  for (const e of matched) {
    const cur = byBuyer.get(e.bid) ?? { buyer_id: e.bid, name: e.b, deals: 0, disclosedUsd: 0 };
    byBuyer.set(e.bid, { ...cur, deals: cur.deals + 1, disclosedUsd: cur.disclosedUsd + (e.v ?? 0) });
  }
  const buyers = [...byBuyer.values()].sort((a, b) => b.deals - a.deals);

  const limit = q.limit ?? 200;
  const disclosedUsd = matched.reduce((s, e) => s + (e.v ?? 0), 0);
  const bits: string[] = [];
  if (sector) bits.push(`sector "${q.sector}"`);
  if (q.region) bits.push(`in ${q.region}`);
  if (country) bits.push(`in ${q.country}`);
  if (q.minUsd != null || q.maxUsd != null) bits.push(`${q.minUsd != null ? `≥$${(q.minUsd / 1e6).toFixed(0)}M` : ''}${q.minUsd != null && q.maxUsd != null ? '–' : ''}${q.maxUsd != null ? `≤$${(q.maxUsd / 1e6).toFixed(0)}M` : ''}`);
  if (q.sinceYear != null) bits.push(`since ${q.sinceYear}`);

  return {
    query: q,
    events: matched.slice(0, limit),
    buyers,
    totalMatched: matched.length,
    disclosedUsd,
    note: `${matched.length} acquisition(s) by ${buyers.length} buyer(s)${bits.length ? ` — ${bits.join(', ')}` : ''}. Every row is a source-tagged registry event.`,
  };
}

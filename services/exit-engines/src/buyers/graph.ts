import type { SectorTag } from '../types.js';
import { ACQUISITION_HISTORY } from './history.js';
import { BUYER_REGISTRY, type BuyerEntry } from './registry.js';

// ── LAYER 7 · NETWORK DISCOVERY ─────────────────────────────────────
// A directory asks "who buys logistics companies?". The graph asks the
// second-order question: "who buys alongside the buyers who buy
// logistics companies?" — and surfaces acquirers a founder would never
// have shortlisted directly.
//
// Construction (entirely from the source-referenced history):
//   node  = buyer
//   edge  = two buyers have closed acquisitions in the same sector
//   weight = number of shared sectors, weighted by each buyer's deal
//            count in those sectors
// A "hidden buyer" for sector S is a registry mandate with NO direct S
// coverage that is graph-adjacent to buyers who do acquire in S — the
// adjacency is the evidence that they hunt in neighbouring territory.

export interface GraphEdge {
  readonly a: string;
  readonly b: string;
  readonly sharedSectors: readonly SectorTag[];
  readonly weight: number;
}

export interface AdjacentBuyer {
  readonly buyer: BuyerEntry;
  readonly via: string;                 // the sector-active buyer that links them
  readonly sharedSectors: readonly SectorTag[];
  readonly weight: number;
  readonly reason: string;
}

function sectorsByBuyer(): Map<string, Map<SectorTag, number>> {
  const m = new Map<string, Map<SectorTag, number>>();
  for (const e of ACQUISITION_HISTORY) {
    if (!e.sector || e.status === 'terminated' || e.status === 'lost_bid') continue;
    const inner = m.get(e.buyerName) ?? new Map<SectorTag, number>();
    inner.set(e.sector, (inner.get(e.sector) ?? 0) + 1);
    m.set(e.buyerName, inner);
  }
  return m;
}

/** The co-acquisition graph over every buyer with history on record. */
export function buildAcquisitionGraph(): readonly GraphEdge[] {
  const by = sectorsByBuyer();
  const names = [...by.keys()];
  const edges: GraphEdge[] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const nameA = names[i]!;
      const nameB = names[j]!;
      const a = by.get(nameA)!;
      const b = by.get(nameB)!;
      const shared: SectorTag[] = [];
      let weight = 0;
      for (const [sector, n] of a) {
        const m = b.get(sector);
        if (m) { shared.push(sector); weight += Math.min(n, m); }
      }
      if (shared.length > 0) edges.push({ a: nameA, b: nameB, sharedSectors: shared, weight });
    }
  }
  return edges.sort((x, y) => y.weight - x.weight);
}

/** Hidden buyers for a sector: registry mandates with no direct sector
 *  coverage, reached through the co-acquisition graph. */
export function discoverAdjacentBuyers(sector: SectorTag, limit = 5): readonly AdjacentBuyer[] {
  const by = sectorsByBuyer();
  const edges = buildAcquisitionGraph();

  // buyers with closed deals in the target sector
  const inSector = new Set([...by.entries()].filter(([, s]) => (s.get(sector) ?? 0) > 0).map(([n]) => n));

  // registry mandates that do NOT list the sector (the directory would skip them)
  const candidates = BUYER_REGISTRY.filter((b) => !b.sectorsActive.includes(sector));

  const out: AdjacentBuyer[] = [];
  for (const cand of candidates) {
    let best: GraphEdge | undefined;
    let via = '';
    for (const e of edges) {
      const other = e.a === cand.name ? e.b : e.b === cand.name ? e.a : undefined;
      if (!other || !inSector.has(other)) continue;
      if (!best || e.weight > best.weight) { best = e; via = other; }
    }
    if (best) {
      out.push({
        buyer: cand,
        via,
        sharedSectors: best.sharedSectors,
        weight: best.weight,
        reason: `Acquires in ${best.sharedSectors.map((s) => s.replace(/_/g, ' ')).join(', ')} alongside ${via}, a proven ${sector.replace(/_/g, ' ')} acquirer — adjacent territory, not on a direct ${sector.replace(/_/g, ' ')} mandate`,
      });
    }
  }
  return out.sort((x, y) => y.weight - x.weight).slice(0, limit);
}

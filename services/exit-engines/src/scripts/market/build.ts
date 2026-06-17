// ── MARKET INTELLIGENCE BUILDER (node-only) ─────────────────────────
// Distills acquisition_events.json (the full 1.9 MB registry, node-side)
// into two compact, web-bundleable extracts:
//   data/acquisition_index.json    — the Knowledge Graph query index
//   data/market_intelligence.json  — pre-computed market-map aggregations
// Every figure is a real, source-tagged registry event. No fabrication.
//
// Run: npm run market   (after ingest)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { regionOf } from '../../market/regions.js';
import type {
  IndexEvent, AcquisitionIndex, MarketIntelligence,
  SectorHeat, GeoDensity, Corridor, ActiveAcquirer,
} from '../../market/types.js';

interface RawEvent {
  buyer_id: string; buyer_name: string; target_name: string;
  announced_date?: string; value_usd?: number; industry?: string; country?: string;
  source: string; source_url: string;
}

const DATA = join(process.cwd(), 'data');
const tokenize = (s: string): string[] =>
  s.toLowerCase().split(/[,;/·&()]| and /).map((x) => x.trim()).filter((x) => x.length > 3 && !/^\d+$/.test(x));

function build(): { index: AcquisitionIndex; intel: MarketIntelligence } {
  if (!existsSync(join(DATA, 'acquisition_events.json'))) {
    throw new Error('acquisition_events.json not found — run `npm run ingest` first');
  }
  const events = JSON.parse(readFileSync(join(DATA, 'acquisition_events.json'), 'utf8')) as RawEvent[];
  const manifest = JSON.parse(readFileSync(join(DATA, 'ingest_manifest.json'), 'utf8')) as { generated_at: string };
  const asOf = manifest.generated_at;
  const nowYear = new Date(asOf).getFullYear();

  // ── index: only events with a queryable dimension (date or country or
  //    industry) and not the 8-K placeholder rows — keeps the extract lean.
  const indexEvents: IndexEvent[] = [];
  for (const e of events) {
    if (e.target_name.startsWith('[8-K')) continue;
    if (!e.announced_date && !e.country && !e.industry) continue;
    indexEvents.push({
      bid: e.buyer_id, b: e.buyer_name, t: e.target_name,
      ...(e.announced_date ? { d: e.announced_date } : {}),
      ...(e.value_usd ? { v: e.value_usd } : {}),
      ...(e.industry ? { i: e.industry.slice(0, 40) } : {}),
      ...(e.country ? { c: e.country.slice(0, 24) } : {}),
      r: regionOf(e.country),
      s: e.source,
    });
  }

  // ── aggregations ─────────────────────────────────────────────────
  const sectorMap = new Map<string, { deals: number; usd: number }>();
  const geoMap = new Map<string, { deals: number; usd: number }>();
  const corridorMap = new Map<string, number>();
  const acquirerMap = new Map<string, { name: string; deals: number; recent: number; last?: string }>();
  const buyerRegion = new Map<string, string>();

  const buyers = JSON.parse(readFileSync(join(DATA, 'buyer_registry.json'), 'utf8')) as Array<{ buyer_id: string; country?: string }>;
  for (const b of buyers) if (b.country) buyerRegion.set(b.buyer_id, regionOf(b.country));

  let disclosedEvents = 0, totalDisclosedUsd = 0;
  for (const e of indexEvents) {
    if (e.v) { disclosedEvents++; totalDisclosedUsd += e.v; }
    // sector heat
    if (e.i) for (const tok of tokenize(e.i)) {
      const s = sectorMap.get(tok) ?? { deals: 0, usd: 0 };
      s.deals++; s.usd += e.v ?? 0; sectorMap.set(tok, s);
    }
    // geo density (target region)
    const g = geoMap.get(e.r) ?? { deals: 0, usd: 0 };
    g.deals++; g.usd += e.v ?? 0; geoMap.set(e.r, g);
    // corridor: buyer region → target region
    const from = buyerRegion.get(e.bid);
    if (from && e.r) { const k = `${from}→${e.r}`; corridorMap.set(k, (corridorMap.get(k) ?? 0) + 1); }
    // active acquirers
    const a = acquirerMap.get(e.bid) ?? { name: e.b, deals: 0, recent: 0 };
    a.deals++;
    if (e.d) {
      if (!a.last || e.d > a.last) a.last = e.d;
      if (Number(e.d.slice(0, 4)) >= nowYear - 3) a.recent++;
    }
    acquirerMap.set(e.bid, a);
  }

  const sectorHeat: SectorHeat[] = [...sectorMap.entries()]
    .map(([token, v]) => ({ token, deals: v.deals, disclosedUsd: v.usd }))
    .sort((a, b) => b.deals - a.deals).slice(0, 40);
  const geoDensity: GeoDensity[] = [...geoMap.entries()]
    .map(([region, v]) => ({ region: region as GeoDensity['region'], deals: v.deals, disclosedUsd: v.usd }))
    .sort((a, b) => b.deals - a.deals);
  const corridors: Corridor[] = [...corridorMap.entries()]
    .map(([k, deals]) => { const [from, to] = k.split('→'); return { from: from as Corridor['from'], to: to as Corridor['to'], deals }; })
    .sort((a, b) => b.deals - a.deals).slice(0, 25);
  const topAcquirers: ActiveAcquirer[] = [...acquirerMap.entries()]
    .map(([buyer_id, v]) => ({ buyer_id, name: v.name, deals: v.deals, recentDeals: v.recent, ...(v.last ? { lastDate: v.last } : {}) }))
    .sort((a, b) => b.deals - a.deals).slice(0, 40);

  return {
    index: { as_of: asOf, count: indexEvents.length, events: indexEvents },
    intel: {
      as_of: asOf, totalEvents: indexEvents.length, disclosedEvents, totalDisclosedUsd,
      sectorHeat, geoDensity, corridors, topAcquirers,
      source: 'ExitOS Acquisition Registry (Wikipedia · Wikidata · SEC EDGAR)',
    },
  };
}

const isMain = process.argv[1]?.endsWith('build.js');
if (isMain) {
  const { index, intel } = build();
  writeFileSync(join(DATA, 'acquisition_index.json'), JSON.stringify(index));
  writeFileSync(join(DATA, 'market_intelligence.json'), JSON.stringify(intel, null, 1));
  console.log(`acquisition_index.json: ${index.count} queryable events`);
  console.log(`market_intelligence.json: ${intel.sectorHeat.length} sectors, ${intel.geoDensity.length} regions, ${intel.corridors.length} corridors, ${intel.topAcquirers.length} acquirers`);
  console.log(`disclosed: ${intel.disclosedEvents} events, $${(intel.totalDisclosedUsd / 1e9).toFixed(1)}B`);
}

export { build };

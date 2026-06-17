import type { Region } from './regions.js';

// ── KNOWLEDGE GRAPH · the queryable event index ─────────────────────
// A compact, web-bundleable projection of acquisition_events.json. Every
// row is a real, source-tagged acquisition. Keys are short to keep the
// extract small; every field traces to the registry.
export interface IndexEvent {
  readonly bid: string;          // buyer_id (links to the buyer profile)
  readonly b: string;            // buyer name
  readonly t: string;            // target name
  readonly d?: string;           // announced date (ISO)
  readonly v?: number;           // disclosed value USD
  readonly i?: string;           // industry / sector text
  readonly c?: string;           // target country
  readonly r: Region;            // derived region
  readonly s: string;            // source kind (wikipedia | wikidata | sec_edgar) — full
                                 // source_url lives on the buyer profile (link via bid)
}

export interface AcquisitionIndex {
  readonly as_of: string;
  readonly count: number;
  readonly events: readonly IndexEvent[];
}

// ── MARKET INTELLIGENCE · pre-computed aggregations ─────────────────
export interface SectorHeat { readonly token: string; readonly deals: number; readonly disclosedUsd: number }
export interface GeoDensity { readonly region: Region; readonly deals: number; readonly disclosedUsd: number }
export interface Corridor { readonly from: Region; readonly to: Region; readonly deals: number }
export interface ActiveAcquirer { readonly buyer_id: string; readonly name: string; readonly deals: number; readonly recentDeals: number; readonly lastDate?: string }

export interface MarketIntelligence {
  readonly as_of: string;
  readonly totalEvents: number;
  readonly disclosedEvents: number;
  readonly totalDisclosedUsd: number;
  readonly sectorHeat: readonly SectorHeat[];
  readonly geoDensity: readonly GeoDensity[];
  readonly corridors: readonly Corridor[];
  readonly topAcquirers: readonly ActiveAcquirer[];
  readonly source: string;
}

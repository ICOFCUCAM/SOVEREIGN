// ── MARKET INDEX — the ingested acquisition registries ─────────────
// Live counts from the real ingestion run (Wikipedia acquisition lists,
// Wikidata ownership statements, SEC EDGAR 8-K item 2.01 filings). Only
// the small manifest + per-buyer rollups are bundled; the full 4k-row
// event file stays server/engine-side. Every underlying record carries
// source, source_url, confidence, verification_status, last_updated —
// enforced by the pipeline's provenance contract and validator.

import manifest from "../../../exit-engines/data/ingest_manifest.json";
import rollups from "../../../exit-engines/data/acquisition_registry.json";

interface Rollup {
  buyer_id: string;
  buyer_name: string;
  total_acquisitions: number;
  disclosed_value_usd: number;
  first_date: string | null;
  last_date: string | null;
  source_url: string;
}

const counts = manifest.counts as { buyers: number; acquisition_events: number; rollups: number; graph_edges: number };

export const MARKET_INDEX = {
  /** row-level acquisition events ingested from primary sources */
  events: counts.acquisition_events,
  /** named buyers in the ingested registry (corporates + PE + sovereign funds) */
  buyers: counts.buyers,
  /** per-buyer rollups */
  rollups: counts.rollups,
  /** co-acquisition graph edges */
  graphEdges: counts.graph_edges,
  generatedAt: manifest.generated_at as string,
  hosts: manifest.hosts_used as readonly string[],
} as const;

export const MARKET_INDEX_FMT = {
  events: MARKET_INDEX.events.toLocaleString("en-US"),
  buyers: MARKET_INDEX.buyers.toLocaleString("en-US"),
  graphEdges: MARKET_INDEX.graphEdges.toLocaleString("en-US"),
  asOf: new Date(MARKET_INDEX.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
} as const;

/** Most-active acquirers in the ingested index, by tracked acquisition count. */
export const TOP_INDEXED_ACQUIRERS: ReadonlyArray<{ name: string; deals: number; disclosedUsd: number }> =
  (rollups as Rollup[])
    .slice()
    .sort((a, b) => b.total_acquisitions - a.total_acquisitions)
    .slice(0, 8)
    .map((r) => ({ name: r.buyer_name, deals: r.total_acquisitions, disclosedUsd: r.disclosed_value_usd }));

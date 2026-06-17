// Market Intelligence — pre-computed aggregations distilled from the full
// acquisition registry (node-side) into a 9 KB extract. Powers the Market
// Map and sector heat. The large queryable event index is imported only by
// the Knowledge Graph route, so it never weighs on the rest of the app.
import intelFile from "../../../exit-engines/data/market_intelligence.json";
import indexesFile from "../../../exit-engines/data/acquisition_indexes.json";
import type { MarketIntelligence, SectorIndex } from "@exit/engines";

export const MARKET_INTEL = intelFile as unknown as MarketIntelligence;
export const ACQ_INDEXES = indexesFile as unknown as { as_of: string; source: string; indexes: SectorIndex[] };

export const fmtUsd = (n: number): string =>
  n >= 1e12 ? `$${(n / 1e12).toFixed(1)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${n.toLocaleString()}`;

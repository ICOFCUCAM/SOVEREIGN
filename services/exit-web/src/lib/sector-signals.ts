import type { SectorIndex } from "@exit/engines";
import { ACQ_INDEXES } from "./market-intel";

// ── SECTOR SIGNALS ──────────────────────────────────────────────────
// The Terminal's market-signal rail, read from the acquisition indexes
// (a registry snapshot). Company sectors (intake keys) are mapped to the
// index taxonomy explicitly so the mapping is reviewable; a sector with no
// mapping simply shows the market-wide movers. Counts are always returned
// with trends because the 12-month samples are small.

export const SECTOR_INDEX_MAP: Readonly<Record<string, readonly string[]>> = {
  enterprise_saas: ["Software", "Cloud Infrastructure"],
  vertical_saas: ["Software"],
  b2b_marketplace: ["Marketplace", "Ecommerce"],
  consumer_marketplace: ["Marketplace", "Consumer", "Ecommerce"],
  fintech_payments: ["Fintech", "Payments"],
  logistics_freight: ["Logistics", "Supply Chain", "Transportation"],
  mobility: ["Transportation"],
  ai_infra: ["AI", "Cloud Infrastructure"],
  developer_tools: ["Developer Tools", "Software"],
  media_content: ["Media", "Gaming"],
};

export interface SectorSignal extends SectorIndex { readonly yours: boolean }

export function sectorSignals(companySector: string, movers = 4, indexes: readonly SectorIndex[] = ACQ_INDEXES.indexes): SectorSignal[] {
  const mine = new Set(SECTOR_INDEX_MAP[companySector] ?? []);
  const own = indexes.filter((i) => mine.has(i.sector)).map((i) => ({ ...i, yours: true }));
  const others = indexes
    .filter((i) => !mine.has(i.sector) && i.volume12m > 0)
    .sort((a, b) => b.volume12m - a.volume12m || (b.trendPct ?? 0) - (a.trendPct ?? 0))
    .slice(0, movers)
    .map((i) => ({ ...i, yours: false }));
  return [...own, ...others];
}

export const SECTOR_INDEX_AS_OF: string = ACQ_INDEXES.as_of;
export const SECTOR_INDEX_SOURCE: string = ACQ_INDEXES.source;

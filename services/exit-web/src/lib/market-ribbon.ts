import { ACQ_INDEXES, MARKET_INTEL } from "./market-intel";
import { MARKET, DEAL_INTEL_FMT, HISTORY_STATS, HISTORY_FMT } from "./market-stats";
import { DNA_PROFILES } from "./buyer-dna";

// ── INSTITUTIONAL RIBBON ────────────────────────────────────────────
// The persistent status ribbon that sits above every workstation — the
// market vitals a desk keeps in its peripheral vision: market status, buyer
// activity, deal velocity, sector liquidity, acquisition volume. Every
// figure is computed from real data (sector indexes, the buyer registry, the
// source-referenced acquisition history) at module load. Nothing invented.

export interface RibbonSegment {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly sub?: string;
  readonly dir?: "up" | "down" | null;
}

const idx = ACQ_INDEXES.indexes;
const withTrend = idx.filter((i) => i.trendPct != null);
const expanding = withTrend.filter((i) => (i.trendPct ?? 0) > 0).length;
const marketUp = expanding * 2 >= withTrend.length;
const activeAcquirers = DNA_PROFILES.filter((p) => p.events_indexed > 0).length;

/** The five persistent market vitals. Stable per session (registry-derived),
 *  refreshed whenever the underlying indexes are rebuilt. */
export const RIBBON: readonly RibbonSegment[] = [
  { key: "MKT", label: "Market Status", value: marketUp ? "Expanding" : "Mixed", sub: `${expanding}/${withTrend.length} sectors ↑`, dir: marketUp ? "up" : null },
  { key: "BUY", label: "Buyer Activity", value: String(MARKET.activeMandates), sub: `active · ${activeAcquirers} acquirers`, dir: "up" },
  { key: "VEL", label: "Deal Velocity", value: DEAL_INTEL_FMT.medianClose, sub: "median close" },
  { key: "LIQ", label: "Sector Liquidity", value: HISTORY_FMT.disclosedValue, sub: `${HISTORY_STATS.events} events` },
  { key: "VOL", label: "Acquisition Volume", value: MARKET_INTEL.totalEvents.toLocaleString(), sub: "indexed" },
];

// Market statistics derived from the real buyer registry — the numbers the
// marketing surfaces display. Nothing here is invented: every figure is
// computed from @exit/engines BUYER_REGISTRY at module load, so the landing
// page, exchange board and ecosystem strip always reflect the actual
// acquirer network the matching engine runs against.

import { buyers } from "@exit/engines";
import type { BuyerEntry } from "@exit/engines";

const REGISTRY: readonly BuyerEntry[] = buyers.BUYER_REGISTRY;

const usd = (n: number): string =>
  n >= 1e12 ? `$${(n / 1e12).toFixed(1)}T`
  : n >= 1e9 ? `$${(n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1)}B`
  : n >= 1e6 ? `$${Math.round(n / 1e6)}M`
  : `$${n.toLocaleString()}`;

const count = (pred: (b: BuyerEntry) => boolean): number => REGISTRY.filter(pred).length;

export const MARKET = {
  /** Curated acquirers in the live matching registry. */
  buyers: REGISTRY.length,
  /** Mandates the engine treats as actively deploying capital. */
  activeMandates: count((b) => b.appetite === "active"),
  warmMandates: count((b) => b.appetite === "warm"),
  strategic: count((b) => b.buyerType === "strategic"),
  privateEquity: count((b) => b.buyerType === "pe"),
  /** Combined upper-bound check capacity across all mandates. */
  appetiteUsd: REGISTRY.reduce((s, b) => s + b.checkSizeHighUsd, 0),
  sectors: new Set(REGISTRY.flatMap((b) => [...b.sectorsActive])).size,
  geographies: new Set(REGISTRY.flatMap((b) => [...b.geographyPreferred])).size,
} as const;

export const MARKET_FMT = {
  buyers: `${MARKET.buyers}`,
  activeMandates: `${MARKET.activeMandates}`,
  strategic: `${MARKET.strategic}`,
  privateEquity: `${MARKET.privateEquity}`,
  appetite: usd(MARKET.appetiteUsd),
  sectors: `${MARKET.sectors}`,
  geographies: `${MARKET.geographies}`,
} as const;

export interface MandateLine {
  readonly text: string;
  readonly meta: string;
  readonly color: string;
}

const APPETITE_COLOR: Record<BuyerEntry["appetite"], string> = {
  active: "#45E38A",
  warm: "#FFB14A",
  dormant: "#8AA0B8",
};

/** Live mandate ticker — the most active real registry entries, honestly
 *  labelled as mandates (not fabricated transactions). */
export const MANDATE_ACTIVITY: readonly MandateLine[] = [...REGISTRY]
  .sort((a, b) => b.recentActivityScore - a.recentActivityScore)
  .slice(0, 8)
  .map((b) => ({
    text: `${b.name} — ${b.appetite === "active" ? "deploying" : "monitoring"} · ${b.thesis}`,
    meta: `${usd(b.checkSizeLowUsd)}–${usd(b.checkSizeHighUsd)} check`,
    color: APPETITE_COLOR[b.appetite],
  }));

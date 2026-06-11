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

// ── Disclosed-transaction board ─────────────────────────────────────────
// Rows for the hero exchange board, drawn from the curated snapshot of
// publicly-disclosed M&A events that drives the buyer engine's history
// dimension. Source-referenced (EDGAR / Wikidata / press), not invented.

const HISTORY = buyers.ACQUISITION_HISTORY;

const SECTOR_LABEL: Record<string, string> = {
  enterprise_saas: "Enterprise SaaS",
  vertical_saas: "Vertical SaaS",
  ai_infra: "AI Infrastructure",
  developer_tools: "Developer Tools",
  fintech_payments: "Fintech / Payments",
  logistics_freight: "Logistics / Freight",
  mobility: "Mobility",
  media_content: "Media & Content",
  consumer_marketplace: "Consumer Marketplace",
  healthcare: "Healthcare",
  cybersecurity: "Cybersecurity",
};
export const sectorLabel = (s: string): string =>
  SECTOR_LABEL[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const shortBuyer = (name: string): string =>
  name.replace(/ (Acquisition Office|Industry Solutions|Strategic|Workflow Acquisitions|Enterprise Software Bolt-On|Software Buy-out|Growth|Acquisitions|Bolt-on)$/i, "");

export interface BoardTx {
  readonly company: string;
  readonly industry: string;
  readonly buyer: string;
  readonly match: string;
  readonly offer: string;
  readonly premium: string;
  readonly status: string;
  readonly color: string;
  readonly age: string;
}

const STATUS_COLOR: Record<string, string> = {
  closed: "#45E38A",
  announced: "#FFB14A",
  terminated: "rgba(255,255,255,.55)",
};

export const DISCLOSED_TRANSACTIONS: readonly BoardTx[] = [...HISTORY]
  .filter((e) => typeof e.headlinePriceUsd === "number" && e.headlinePriceUsd > 0)
  .sort((a, b) => (b.announcedDate || "").localeCompare(a.announcedDate || ""))
  .slice(0, 6)
  .map((e) => {
    const headline = e.headlinePriceUsd as number;
    const premium = e.priorReferencePriceUsd
      ? `+${Math.round(((headline - e.priorReferencePriceUsd) / e.priorReferencePriceUsd) * 100)}% vs reference`
      : "disclosed";
    return {
      company: e.targetName,
      industry: sectorLabel(e.sector ?? ""),
      buyer: shortBuyer(e.buyerName),
      match: sectorLabel(e.sector ?? ""),
      offer: usd(headline),
      premium,
      status: e.status === "closed" ? "Closed" : e.status === "terminated" ? "Terminated" : "Announced",
      color: STATUS_COLOR[e.status] ?? "#58C6FF",
      age: (e.closedDate || e.announcedDate || "").slice(0, 4),
    };
  });

/** Top registry mandates for the Strategic Buyers column. */
export const STRATEGIC_BOARD: ReadonlyArray<[string, string, number, string]> = [...REGISTRY]
  .sort((a, b) => b.recentActivityScore - a.recentActivityScore)
  .slice(0, 6)
  .map((b) => [
    shortBuyer(b.name),
    sectorLabel(b.sectorsActive[0]),
    Math.round(b.recentActivityScore * 100),
    b.appetite === "active" ? "Very High" : b.appetite === "warm" ? "High" : "Medium",
  ]);

/** Sector demand heat, from mandate coverage across the registry. */
export const SECTOR_DEMAND: ReadonlyArray<[string, string, number]> = (() => {
  const freq = new Map<string, number>();
  for (const b of REGISTRY) for (const s of b.sectorsActive) freq.set(s, (freq.get(s) || 0) + 1);
  const max = Math.max(...freq.values());
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([s, n]) => {
      const bars = Math.max(3, Math.round((n / max) * 10));
      const label = bars >= 9 ? "Extreme" : bars >= 8 ? "Very High" : bars >= 6 ? "High" : "Medium";
      return [sectorLabel(s), label, bars] as [string, string, number];
    });
})();

/** Buyer spotlight cards — real mandates with their actual check ranges. */
export const REGISTRY_CARDS = [...REGISTRY]
  .sort((a, b) => b.recentActivityScore - a.recentActivityScore)
  .slice(0, 5)
  .map((b) => ({
    name: shortBuyer(b.name),
    kind: sectorLabel(b.sectorsActive[0]),
    appetite: Math.round(b.recentActivityScore * 100),
    rows: [
      ["Check Size", `${usd(b.checkSizeLowUsd)} – ${usd(b.checkSizeHighUsd)}`],
      ["Activity Score", `${Math.round(b.recentActivityScore * 100)}/100`],
      ["Focus Areas", b.sectorsActive.slice(0, 3).map(sectorLabel).join(", ")],
    ] as Array<[string, string]>,
  }));

export const HISTORY_STATS = {
  events: HISTORY.length,
  closed: HISTORY.filter((e) => e.status === "closed").length,
  pending: HISTORY.filter((e) => e.status !== "closed" && e.status !== "terminated").length,
  disclosedValueUsd: HISTORY.reduce((s, e) => s + (e.headlinePriceUsd || 0), 0),
} as const;

export const HISTORY_FMT = {
  events: `${HISTORY_STATS.events}`,
  closed: `${HISTORY_STATS.closed}`,
  pending: `${HISTORY_STATS.pending}`,
  disclosedValue: usd(HISTORY_STATS.disclosedValueUsd),
} as const;

import type { BuyerCandidate } from "@exit/engines";
import { MARKET } from "./market-stats";

// ── LIQUIDITY COMMAND — page-level derivations ──────────────────────
// Moved verbatim from components/DashboardModules.tsx and JourneyMap.tsx
// (Page 02 redesign) so the formulas stay identical and are testable.
// Several are heuristics, not measurements; the page labels them so.

/** Market liquidity index: 70 + 4 per active buyer, capped at 98. */
export const liquidityIndex = (activeBuyers: number): number => Math.min(98, 70 + activeBuyers * 4);

/** Fixed multiplier for the "12 months" scenario (fixes + an assumed year of growth). */
export const TWELVE_MONTH_MULTIPLIER = 1.27;

export interface Scenario { readonly key: "today" | "six" | "twelve"; readonly label: string; readonly value: number; readonly basis: string }
export const scenariosFor = (current: number, potential: number): Scenario[] => [
  { key: "today", label: "Sell today", value: current, basis: "current strategic mid" },
  { key: "six", label: "Optimize 6 months", value: potential, basis: "after the readiness fixes" },
  { key: "twelve", label: "Optimize 12 months", value: Math.round(potential * TWELVE_MONTH_MULTIPLIER), basis: "fixes + a year of growth" },
];

/** Demand by geography: each matched buyer counts toward its preferred geographies; top 5, scaled to 100. */
export function heatFor(buyers: readonly BuyerCandidate[]): { country: string; buyers: number; score: number }[] {
  const tally = new Map<string, number>();
  for (const c of buyers) for (const g of c.buyer.geographyPreferred) tally.set(g, (tally.get(g) || 0) + 1);
  const max = Math.max(1, ...tally.values());
  return [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([country, n]) => ({ country, buyers: n, score: Math.round((n / max) * 100) }));
}

export interface FunnelStage { readonly label: string; readonly n: number; readonly sample: boolean }
/** Registry → matched come from the engines; NDA/offer stages come from demo fixtures. */
export const funnelFor = (matched: number, sampleNdas: number, sampleOffers: number, hasLeader: boolean): FunnelStage[] => [
  { label: "Registry mandates", n: MARKET.buyers, sample: false },  // curated buyer registry
  { label: "Matched", n: matched, sample: false },
  { label: "Under NDA", n: sampleNdas, sample: true },
  { label: "Offers in hand", n: sampleOffers, sample: true },
  { label: "Leading bid", n: hasLeader ? 1 : 0, sample: true },
];

/** The founder's own funnel: NDA requests signed and offers received on their listing (recorded records, not samples). */
export const ownFunnelFor = (matched: number, signedNdas: number, offers: number): FunnelStage[] => [
  { label: "Registry mandates", n: MARKET.buyers, sample: false },
  { label: "Matched", n: matched, sample: false },
  { label: "NDAs signed", n: signedNdas, sample: false },
  { label: "Offers received", n: offers, sample: false },
];

export interface LifecycleStage { readonly key: string; readonly index: string; readonly label: string; readonly to?: string }
export const LIFECYCLE: readonly LifecycleStage[] = [
  { key: "build", index: "01", label: "Position" },
  { key: "monitor", index: "02", label: "Monitor", to: "/console/readiness" },
  { key: "find", index: "03", label: "Market", to: "/console/intelligence" },
  { key: "run", index: "04", label: "Solicit", to: "/console/banker" },
  { key: "negotiate", index: "05", label: "Negotiate", to: "/console/negotiator" },
  { key: "close", index: "06", label: "Execute", to: "/console/closing" },
  { key: "wealth", index: "07", label: "Transition", to: "/console/wealth" },
];

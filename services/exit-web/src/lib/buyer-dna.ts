// ── ACQUISITION DNA — the founder-facing buyer intelligence layer ────
// Profiles derived from the ingested registries (4k+ real events from
// Wikipedia / Wikidata / SEC EDGAR), never raw lists. The 87 KB DNA file
// bundles fine; the 1.9 MB event file never ships to the browser.

import dnaFile from "../../../exit-engines/data/buyer_dna.json";
import sectorFile from "../../../exit-engines/data/sector_transactions.json";
import { SAMPLE_COMPANY } from "./profile.js";

export interface DnaProfile {
  buyer_id: string;
  name: string;
  buyer_type: string;
  country?: string;
  events_indexed: number;
  disclosed_events: number;
  last_acquisition?: { date: string; target: string };
  max_deal?: { usd: number; target: string };
  avg_deal_usd?: number;
  deals_12m: number;
  deals_3y: number;
  appetite: "high" | "medium" | "low" | "no_events";
  sector_tokens: Array<{ token: string; count: number }>;
  verified_events: number;
  // DNA v2 — Phase 3/4 derivations (present when the sample supports them)
  frequency_per_year?: number;
  preferred_geography?: Array<{ country: string; count: number }>;
  premium_pct?: number;
  close_rate?: number;
  median_close_days?: number;
  currently_seeking?: string[];
  source_url: string;
}

export interface SectorTransaction {
  buyer: string;
  target: string;
  date: string | null;
  value_usd: number | null;
  industry: string;
  source: string;
  source_url: string;
  verification_status: string;
}

export const DNA_AS_OF: string = (dnaFile as { as_of: string }).as_of;
export const DNA_PROFILES: readonly DnaProfile[] = (dnaFile as { profiles: DnaProfile[] }).profiles;

export const SECTOR_TRANSACTIONS: readonly SectorTransaction[] =
  (sectorFile as { transactions: SectorTransaction[] }).transactions;

// ── company overlap — measured token intersection, not a vibe ───────
// The working company's sector vocabulary; overlap = share of a buyer's
// indexed acquisition activity that falls on these tokens.
const COMPANY_TOKENS = [
  "logistic", "freight", "transport", "supply chain", "fleet", "shipping",
  "delivery", "trucking", "marketplace", SAMPLE_COMPANY.sector.replace(/_/g, " "),
];

export function sectorOverlap(p: DnaProfile): { pct: number; matched: string[] } {
  const total = p.sector_tokens.reduce((s, t) => s + t.count, 0);
  if (total === 0) return { pct: 0, matched: [] };
  const matchedTokens = p.sector_tokens.filter((t) => COMPANY_TOKENS.some((c) => t.token.includes(c)));
  const matched = matchedTokens.reduce((s, t) => s + t.count, 0);
  return { pct: Math.round((matched / total) * 100), matched: matchedTokens.map((t) => t.token).slice(0, 3) };
}

/** Recommended action from measured appetite × overlap — stated as desk guidance. */
export function recommendedAction(p: DnaProfile): string {
  const { pct } = sectorOverlap(p);
  if (p.appetite === "high" && pct > 0) return "Initiate NDA outreach";
  if (p.appetite === "high") return "Monitor — active acquirer, no sector evidence yet";
  if (p.appetite === "medium" && pct > 0) return "Warm introduction via the banker";
  if (p.appetite === "no_events") return "No acquisition events indexed — registry presence only";
  return "Deprioritize for active outreach";
}

export const fmtUsdShort = (n?: number | null): string => {
  if (n == null) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
};

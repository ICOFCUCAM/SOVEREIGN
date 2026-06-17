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
  min_deal?: { usd: number; target: string };
  median_deal_usd?: number;
  check_size_band?: { low_usd: number; high_usd: number };
  industry_official?: string;
  sector_exitos?: string[];
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

// ── Acquisition Probability — the crown-jewel ranking ───────────────
// For the founder's company, how likely is each indexed buyer to acquire
// one like it? A transparent composite of measured signals: appetite,
// sector overlap with the founder, acquisition velocity and recency. Every
// input is a real DNA figure — no opaque model.
const monthsSince = (iso?: string): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (30.4 * 86_400_000);
};

export interface ProbabilityBreakdown {
  readonly pct: number;                 // 0–100
  readonly appetite: number;
  readonly overlap: number;
  readonly velocity: number;
  readonly recency: number;
  readonly rationale: string;
}

export function acquisitionProbability(p: DnaProfile): ProbabilityBreakdown {
  const appetiteBase = p.appetite === "high" ? 50 : p.appetite === "medium" ? 32 : p.appetite === "low" ? 14 : 2;
  const { pct: overlapPct, matched } = sectorOverlap(p);
  const overlap = Math.min(34, overlapPct * 0.34);
  const velocity = Math.min(14, (p.frequency_per_year ?? 0) * 2.5);
  const ageM = monthsSince(p.last_acquisition?.date);
  const recency = ageM == null ? 0 : ageM <= 18 ? 10 : ageM <= 36 ? 5 : ageM <= 60 ? 2 : 0;
  const pct = Math.max(0, Math.min(100, Math.round(appetiteBase + overlap + velocity + recency)));

  const bits: string[] = [];
  bits.push(`${p.appetite.replace("_", " ")} appetite`);
  if (overlapPct > 0) bits.push(`${overlapPct}% sector overlap${matched.length ? ` (${matched.join(", ")})` : ""}`);
  if (p.frequency_per_year) bits.push(`${p.frequency_per_year}/yr cadence`);
  if (ageM != null && ageM <= 36) bits.push(`active in the last ${Math.round(ageM)}mo`);
  return { pct, appetite: Math.round(appetiteBase), overlap: Math.round(overlap), velocity: Math.round(velocity), recency, rationale: bits.join(" · ") };
}

export interface RankedBuyer { readonly profile: DnaProfile; readonly probability: ProbabilityBreakdown }

/** Buyers with indexed activity, ranked by acquisition probability for the
 *  founder's company — the "who is most likely to buy me" list. */
export function rankedBuyers(limit = 25): RankedBuyer[] {
  return DNA_PROFILES
    .filter((p) => p.events_indexed > 0)
    .map((p) => ({ profile: p, probability: acquisitionProbability(p) }))
    .sort((a, b) => b.probability.pct - a.probability.pct)
    .slice(0, limit);
}

// ── Acquisition-Readiness Signals (Priority 5) ──────────────────────
// Derived signals are computed from the registry and are real. External
// signals (hiring, cash, executive changes, new divisions) require feeds
// not yet connected — they are listed honestly as such, never invented.
export interface BuyerSignal {
  readonly label: string;
  readonly active: boolean;
  readonly detail: string;
  readonly source: "derived" | "feed";
}

export function acquisitionSignals(p: DnaProfile): { signals: readonly BuyerSignal[]; activeCount: number } {
  const ageM = monthsSince(p.last_acquisition?.date);
  const accelerating = p.deals_12m >= 2 || (p.deals_3y > 0 && p.deals_12m > p.deals_3y / 3);
  const derived: BuyerSignal[] = [
    { label: "Acquisition acceleration", active: accelerating, detail: `${p.deals_12m} in 12mo vs ${p.deals_3y} in 3yr`, source: "derived" },
    { label: "Recent activity", active: ageM != null && ageM <= 18, detail: p.last_acquisition ? `last: ${p.last_acquisition.target}` : "no dated activity", source: "derived" },
    { label: "High velocity", active: (p.frequency_per_year ?? 0) >= 3, detail: `${p.frequency_per_year ?? 0} deals/year`, source: "derived" },
    { label: "Premium payer", active: p.premium_pct != null && p.premium_pct >= 0.2, detail: p.premium_pct != null ? `${Math.round(p.premium_pct * 100)}% avg premium` : "premium undisclosed", source: "derived" },
    { label: "Reliable closer", active: p.close_rate != null && p.close_rate >= 0.8, detail: p.close_rate != null ? `${Math.round(p.close_rate * 100)}% close rate` : "close rate undisclosed", source: "derived" },
    { label: "Active strategic themes", active: (p.currently_seeking?.length ?? 0) > 0, detail: p.currently_seeking?.slice(0, 3).join(", ") || "none indexed", source: "derived" },
    { label: "Multi-region buyer", active: (p.preferred_geography?.length ?? 0) >= 3, detail: `${p.preferred_geography?.length ?? 0} regions`, source: "derived" },
  ];
  const feeds: BuyerSignal[] = [
    { label: "Hiring spike", active: false, detail: "job-postings feed not connected", source: "feed" },
    { label: "Cash accumulation", active: false, detail: "filings feed not connected", source: "feed" },
    { label: "Executive changes", active: false, detail: "leadership feed not connected", source: "feed" },
    { label: "New division launch", active: false, detail: "press feed not connected", source: "feed" },
  ];
  const signals = [...derived, ...feeds];
  return { signals, activeCount: derived.filter((s) => s.active).length };
}

export const buyerById = (id: string): DnaProfile | undefined => DNA_PROFILES.find((p) => p.buyer_id === id);

// Same-sector / similar acquisitions a buyer has made (from the bundled
// sector-transaction extract) — "similar companies acquired".
export function similarAcquisitionsBy(name: string): readonly SectorTransaction[] {
  const norm = name.toLowerCase().split(" ")[0];
  return SECTOR_TRANSACTIONS.filter((t) => t.buyer.toLowerCase().includes(norm)).slice(0, 8);
}

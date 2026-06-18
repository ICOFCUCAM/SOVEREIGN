import type { DnaProfile } from "./buyer-dna";

// ── BUYER ENGAGEMENT INTELLIGENCE ───────────────────────────────────
// The move from "who is likely to buy" into "how to approach them" — the
// banker's targeted path to ~20 qualified buyers for one company, NOT a
// cold-email engine. Hard rule: ExitOS NEVER fabricates personal contact
// data (no invented emails, names or LinkedIn profiles). It surfaces:
//   · the typical DECISION-MAKER ROLE for the buyer type (desk knowledge),
//   · deterministic RESEARCH links to find the public corp-dev contact,
//   · real engagement metrics we can source,
// and marks process telemetry (response rate, time-to-NDA/LOI) as "not yet
// observed" until real platform transactions populate it.

export const ENGAGEMENT_DISCLAIMER =
  "ExitOS does not store, scrape or send to personal contacts. It surfaces the most-likely buyers, the typical " +
  "decision-maker role, and a public research path — for a targeted, banker-style approach, not mass outreach.";

// Typical decision-maker role by buyer type — a role, never a named person.
function bestContactRole(buyerType: string): string {
  const t = buyerType.toLowerCase();
  if (/private_equity|pe\b|sponsor|growth/.test(t)) return "Partner / Deal Team";
  if (/sovereign/.test(t)) return "Head of Direct Investments";
  if (/family/.test(t)) return "Principal / Head of Acquisitions";
  if (/venture|vc/.test(t)) return "Partner / Corp Dev";
  return "Director / VP, Corporate Development";
}

export interface ResearchLink { readonly label: string; readonly url: string }
export interface EngagementProfile {
  readonly bestContactRole: string;
  readonly priorSimilarAcquisitions: number;   // real — indexed deals in the founder's space
  readonly medianTimeToCloseDays: number | null;
  // process telemetry — populated from real platform deals, not invented
  readonly responseRatePct: number | null;
  readonly medianTimeToNdaDays: number | null;
  readonly medianTimeToLoiDays: number | null;
  readonly research: readonly ResearchLink[];
  readonly sourceUrl: string;
  readonly telemetryConnected: boolean;
}

const q = (s: string): string => encodeURIComponent(s);

export function buyerEngagement(p: DnaProfile, founderTokens: readonly string[]): EngagementProfile {
  // prior similar acquisitions = indexed deals whose industry tokens fall in
  // the founder's sector vocabulary (real counts from the DNA token index)
  const priorSimilar = p.sector_tokens
    .filter((t) => founderTokens.some((c) => c.length > 0 && t.token.includes(c)))
    .reduce((s, t) => s + t.count, 0);

  return {
    bestContactRole: bestContactRole(p.buyer_type),
    priorSimilarAcquisitions: priorSimilar,
    medianTimeToCloseDays: p.median_close_days ?? null,
    responseRatePct: null,          // requires platform outreach telemetry
    medianTimeToNdaDays: null,      // requires executed NDAs on the platform
    medianTimeToLoiDays: null,      // requires issued LOIs on the platform
    research: [
      { label: "Find corp-dev on LinkedIn", url: `https://www.linkedin.com/search/results/people/?keywords=${q(`${p.name} corporate development`)}` },
      { label: "Acquisitions / corp-dev page", url: `https://www.google.com/search?q=${q(`${p.name} corporate development acquisitions contact`)}` },
    ],
    sourceUrl: p.source_url,
    telemetryConnected: false,
  };
}

import {
  DNA_PROFILES, acquisitionAppetiteScore, type DnaProfile,
} from "./buyer-dna";
import {
  buyerContactRegistry, type ContactChannel,
} from "./buyer-contact";
import { BUYER_RESPONSES } from "./process-intel";

// ── BUYER ENGAGEMENT REGISTRY ───────────────────────────────────────
// NOT a cold-email database. One consolidated record per buyer that unifies
// acquisition DNA, strategic intent, history, the outreach path, public
// contact channels, and — where real processes have run — response history,
// NDA/LOI conversion and close rate. It answers three questions: who to
// contact, why, and how likely they are to ENGAGE (distinct from how likely
// they are to acquire). Every figure is real or honestly absent.

const norm = (s: string): string => s.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");
// telemetry is keyed by the platform's own process buyers; we join by name
const RESPONSE_BY_BUYER = new Map(BUYER_RESPONSES.map((r) => [norm(r.buyerName), r]));

export interface EngagementLikelihood {
  readonly score: number;            // 0–100
  readonly tier: "High" | "Moderate" | "Low";
  readonly basis: string;            // what the score rests on (honest)
}

export interface BuyerEngagementRecord {
  readonly buyerId: string;
  readonly buyerName: string;
  readonly buyerType: string;
  // who / why
  readonly acquisitionDna: { appetite: string; dealsIndexed: number; frequencyPerYear: number | null; lastTarget: string | null };
  readonly strategicIntent: readonly string[];
  readonly acquisitionHistory: { total: number; last12m: number; last3y: number };
  // how to contact
  readonly outreachPath: string;
  readonly contactChannels: readonly ContactChannel[];
  readonly contactConfidence: "High" | "Medium" | "Low";
  // response history (real processes only — null until they run)
  readonly processesRun: number;
  readonly ndaConversionPct: number | null;
  readonly loiConversionPct: number | null;
  readonly closeRatePct: number | null;
  // how likely to ENGAGE
  readonly engagementLikelihood: EngagementLikelihood;
  readonly sourceUrl: string;
}

const CONFIDENCE_FACTOR: Record<string, number> = { High: 1, Medium: 0.85, Low: 0.6 };

function engagementLikelihood(p: DnaProfile, confidence: "High" | "Medium" | "Low", responseRate: number | null): EngagementLikelihood {
  const appetite = acquisitionAppetiteScore(p).score;     // active acquirers engage more
  let score: number;
  let basis: string;
  if (responseRate != null) {
    // real outreach history dominates when we have it
    score = Math.round(0.6 * responseRate + 0.4 * appetite);
    basis = "observed outreach response history + acquisition appetite";
  } else {
    // honest prior: acquisitiveness, discounted by how reachable they are
    score = Math.round(appetite * (CONFIDENCE_FACTOR[confidence] ?? 0.8));
    basis = "acquisition-appetite estimate — no outreach history yet (sharpens with real processes)";
  }
  score = Math.max(0, Math.min(100, score));
  const tier = score >= 65 ? "High" : score >= 40 ? "Moderate" : "Low";
  return { score, tier, basis };
}

export function buyerEngagementRecord(p: DnaProfile, founderTokens: readonly string[]): BuyerEngagementRecord {
  const reg = buyerContactRegistry(p, founderTokens);
  const resp = RESPONSE_BY_BUYER.get(norm(p.name));
  const responseRate = resp ? (resp.ndaSigned || resp.loiIssued ? 100 : 0) : null;

  return {
    buyerId: p.buyer_id,
    buyerName: p.name,
    buyerType: p.buyer_type,
    acquisitionDna: {
      appetite: p.appetite,
      dealsIndexed: p.events_indexed,
      frequencyPerYear: p.frequency_per_year ?? null,
      lastTarget: p.last_acquisition?.target ?? null,
    },
    strategicIntent: p.currently_seeking ?? [],
    acquisitionHistory: { total: p.events_indexed, last12m: p.deals_12m, last3y: p.deals_3y },
    outreachPath: reg.outreachPaths[0]?.channel ?? reg.bestContactRole,
    contactChannels: reg.channels,
    contactConfidence: reg.confidence.tier,
    processesRun: resp ? 1 : 0,
    ndaConversionPct: resp ? (resp.ndaSigned ? 100 : 0) : null,
    loiConversionPct: resp ? (resp.loiIssued ? 100 : 0) : null,
    closeRatePct: reg.engagement.closeRatePct,
    engagementLikelihood: engagementLikelihood(p, reg.confidence.tier, responseRate),
    sourceUrl: reg.sourceUrl,
  };
}

/** The consolidated registry — every indexed buyer, ranked by how likely
 *  they are to engage for the founder's company. */
export function engagementRegistry(founderTokens: readonly string[], limit = 40): BuyerEngagementRecord[] {
  return DNA_PROFILES
    .filter((p) => p.events_indexed > 0)
    .map((p) => buyerEngagementRecord(p, founderTokens))
    .sort((a, b) => b.engagementLikelihood.score - a.engagementLikelihood.score)
    .slice(0, limit);
}

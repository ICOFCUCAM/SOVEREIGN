import type { DnaProfile } from "./buyer-dna";

// ── BUYER CONTACT INTELLIGENCE ──────────────────────────────────────
// Not a ZoomInfo clone, and never fabricated contact data. The moat is
// buyer + intent + CONTACT PATH + response history + acquisition DNA. This
// module builds, for every registry buyer:
//   · public discovery channels (as research links, never asserted URLs),
//   · a contact-confidence score from real acquisition depth,
//   · the ordered outreach PATHS bankers actually use,
//   · an engagement score wired to real response history (telemetry),
// and an explicit enrichment-provider integration point (Apollo / ZoomInfo
// / RocketReach / Lusha) that stays "not connected" until a key is supplied.

export const ENGAGEMENT_DISCLAIMER =
  "ExitOS does not store, scrape, guess or send to personal contacts. It surfaces public corporate-development " +
  "channels, the typical decision-maker role and the outreach path — for a targeted, banker-style approach. " +
  "Verified individual contacts come only from a connected enrichment provider, never from inference.";

const q = (s: string): string => encodeURIComponent(s);
const linkedin = (s: string): string => `https://www.linkedin.com/search/results/people/?keywords=${q(s)}`;
const search = (s: string): string => `https://www.google.com/search?q=${q(s)}`;

// Typical decision-maker role by buyer type — a role, never a named person.
export function bestContactRole(buyerType: string): string {
  const t = buyerType.toLowerCase();
  if (/private_equity|pe\b|sponsor|growth/.test(t)) return "Investment Team / Partner";
  if (/sovereign/.test(t)) return "Head of Direct Investments";
  if (/family/.test(t)) return "Principal / Head of Acquisitions";
  if (/venture|vc/.test(t)) return "Partner / Corp Dev";
  return "Director / VP, Corporate Development";
}

// ── contact confidence ──────────────────────────────────────────────
export interface ContactConfidence { readonly tier: "High" | "Medium" | "Low"; readonly reason: string }
export function contactConfidence(p: DnaProfile): ContactConfidence {
  if (p.events_indexed >= 40) return { tier: "High", reason: `Serial acquirer (${p.events_indexed} indexed deals) — a dedicated corporate-development function is almost certainly reachable.` };
  if (p.events_indexed >= 8) return { tier: "Medium", reason: `Active acquirer (${p.events_indexed} indexed deals) — corp-dev or BD channel likely public.` };
  return { tier: "Low", reason: "Thin acquisition record — route via investor relations or an executive referral." };
}

// ── outreach paths (ordered, how deals actually originate) ──────────
export interface OutreachPath { readonly rank: number; readonly channel: string; readonly rationale: string; readonly discoveryUrl?: string }
export function outreachPaths(p: DnaProfile): OutreachPath[] {
  const role = bestContactRole(p.buyer_type);
  return [
    { rank: 1, channel: role, rationale: "Primary path — the team that owns acquisitions.", discoveryUrl: linkedin(`${p.name} corporate development`) },
    { rank: 2, channel: "Business Development / Partnerships", rationale: "Inbound M&A frequently routes through BD.", discoveryUrl: linkedin(`${p.name} business development`) },
    { rank: 3, channel: "Investor Relations", rationale: "For public acquirers — IR forwards to corp dev.", discoveryUrl: search(`${p.name} investor relations contact`) },
    { rank: 4, channel: "Executive Referral", rationale: "Warm intro to a relevant exec through your network.", discoveryUrl: linkedin(`${p.name} M&A`) },
    { rank: 5, channel: "ExitOS Partner Network", rationale: "Banker-led, anonymized introduction through ExitOS." },
  ];
}

// ── engagement score (wired to real response history) ───────────────
export interface EngagementScore {
  readonly closeRatePct: number | null;       // from the acquisition registry (real where disclosed)
  readonly medianTimeToCloseDays: number | null;
  // populated from the platform's own outreach + process telemetry:
  readonly responsivenessPct: number | null;
  readonly ndaRatePct: number | null;
  readonly loiRatePct: number | null;
  readonly medianResponseDays: number | null;
}
export function buyerEngagementScore(p: DnaProfile): EngagementScore {
  return {
    closeRatePct: p.close_rate != null ? Math.round(p.close_rate * 100) : null,
    medianTimeToCloseDays: p.median_close_days ?? null,
    responsivenessPct: null,        // needs ExitOS outreach history
    ndaRatePct: null,               // needs executed NDAs on the platform
    loiRatePct: null,               // needs issued LOIs on the platform
    medianResponseDays: null,
  };
}

// ── enrichment provider integration point ───────────────────────────
export interface EnrichmentProvider { readonly name: string; readonly connected: boolean }
export const ENRICHMENT_PROVIDERS: readonly EnrichmentProvider[] = [
  { name: "Apollo.io", connected: false },
  { name: "ZoomInfo", connected: false },
  { name: "RocketReach", connected: false },
  { name: "Lusha", connected: false },
];

// ── the registry record ─────────────────────────────────────────────
export interface ContactChannel { readonly label: string; readonly discoveryUrl: string }
export interface BuyerContactRegistry {
  readonly buyerId: string;
  readonly buyerName: string;
  readonly channels: readonly ContactChannel[];   // public discovery links, never asserted URLs
  readonly bestContactRole: string;
  readonly confidence: ContactConfidence;
  readonly outreachPaths: readonly OutreachPath[];
  readonly engagement: EngagementScore;
  readonly priorSimilarAcquisitions: number;
  readonly sourceUrl: string;
}

export function buyerContactRegistry(p: DnaProfile, founderTokens: readonly string[]): BuyerContactRegistry {
  const priorSimilar = p.sector_tokens
    .filter((t) => founderTokens.some((c) => c.length > 0 && t.token.includes(c)))
    .reduce((s, t) => s + t.count, 0);
  return {
    buyerId: p.buyer_id,
    buyerName: p.name,
    channels: [
      { label: "Corporate website", discoveryUrl: search(`${p.name} official website`) },
      { label: "Corporate development page", discoveryUrl: search(`${p.name} corporate development acquisitions`) },
      { label: "Investor relations", discoveryUrl: search(`${p.name} investor relations`) },
      { label: "Acquisition / submit-a-deal page", discoveryUrl: search(`${p.name} submit acquisition opportunity`) },
      { label: "LinkedIn company", discoveryUrl: search(`${p.name} site:linkedin.com/company`) },
    ],
    bestContactRole: bestContactRole(p.buyer_type),
    confidence: contactConfidence(p),
    outreachPaths: outreachPaths(p),
    engagement: buyerEngagementScore(p),
    priorSimilarAcquisitions: priorSimilar,
    sourceUrl: p.source_url,
  };
}

import { rankedBuyers, expectedOutcomeFor, fmtUsdShort } from "./buyer-dna";
import { buyerContactRegistry } from "./buyer-contact";

// ── BUYER OUTREACH PLAN — the banker's target program ───────────────
// Not a mass mailer. The disciplined ~20-qualified-buyers process a banker
// runs: rank the buyers most likely to acquire this company, group them into
// sequenced waves that build competitive tension, and attach each one's
// contact path and expected value. Every figure is engine-derived; the plan
// is an ordered list of WHO to approach, in WHAT order, through WHICH path.

export interface PlanBuyer {
  readonly buyerId: string;
  readonly name: string;
  readonly probabilityPct: number;
  readonly expectedValueUsd: number;
  readonly contactPath: string;
  readonly confidence: "High" | "Medium" | "Low";
  readonly why: string;
}

export interface OutreachWave {
  readonly tier: 1 | 2 | 3;
  readonly label: string;
  readonly timing: string;
  readonly rationale: string;
  readonly buyers: readonly PlanBuyer[];
}

export interface OutreachPlan {
  readonly waves: readonly OutreachWave[];
  readonly totalBuyers: number;
  readonly summary: string;
}

export function buildOutreachPlan(baselineUsd: number, tokens: readonly string[], limit = 20): OutreachPlan {
  const ranked = rankedBuyers(limit, tokens);
  const buyers: PlanBuyer[] = ranked.map((r) => {
    const reg = buyerContactRegistry(r.profile, tokens);
    return {
      buyerId: r.profile.buyer_id,
      name: r.profile.name,
      probabilityPct: r.probability.pct,
      expectedValueUsd: expectedOutcomeFor(r.profile, baselineUsd).expectedClose,
      contactPath: reg.outreachPaths[0]?.channel ?? reg.bestContactRole,
      confidence: reg.confidence.tier,
      why: r.probability.rationale,
    };
  });

  // sequence into waves: lead with the highest-probability anchors, run the
  // core set in parallel to create tension, hold expansion in reserve
  const lead = buyers.slice(0, 4);
  const core = buyers.slice(4, 12);
  const expand = buyers.slice(12, limit);

  const waves: OutreachWave[] = ([
    { tier: 1, label: "Lead bidders", timing: "Week 1", rationale: "Highest-probability acquirers — approach first to anchor the process and set the valuation reference.", buyers: lead },
    { tier: 2, label: "Competitive set", timing: "Week 2", rationale: "Run in parallel to create competitive tension before any single party gains leverage.", buyers: core },
    { tier: 3, label: "Expansion", timing: "Week 3 · contingent", rationale: "Adjacency and lower-probability fits — engage only if the lead waves need broadening.", buyers: expand },
  ] as const).filter((w) => w.buyers.length > 0).map((w) => ({ ...w }));

  const top = buyers[0];
  const summary = top
    ? `${buyers.length} qualified buyers across ${waves.length} sequenced waves. Lead with ${top.name} (${top.probabilityPct}%, exp. ${fmtUsdShort(top.expectedValueUsd)}); run the competitive set in parallel to hold leverage.`
    : "No qualified buyers for this profile yet.";

  return { waves, totalBuyers: buyers.length, summary };
}

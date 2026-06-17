// ── CHIEF INVESTMENT BANKER · MORNING BRIEFING (Stage 5) ────────────
// The move from "founder reads a dashboard" to "an advisor tells the
// founder what changed and what to do." Synthesized from the radar deltas
// (real registry changes detected since the last cycle), the buyer ranking
// and the valuation framework. Every figure is sourced; the value-at-stake
// is the strategic premium the framework already computed — never a
// fabricated impact number.
import radarFile from "../../../exit-engines/data/radar_deltas.json";
import { VALUATION_INSTITUTIONAL } from "./engines";
import { rankedBuyers, expectedOutcomeFor, buyerRationale, buyerById, fmtUsdShort } from "./buyer-dna";

interface RadarDelta {
  buyer_id: string; name: string;
  kind: "appetite_change" | "new_acquisition" | "cadence_shift" | "new_buyer";
  before: string; after: string; detail: string; detected_at: string;
}
const RADAR = radarFile as unknown as { detected_at: string; count: number; deltas: RadarDelta[] };

export interface BriefingMovement { readonly name: string; readonly buyerId?: string; readonly kind: string; readonly detail: string }
export interface BriefingAction { readonly name: string; readonly buyerId: string; readonly probabilityPct: number; readonly why: string; readonly expectedValueUsd: number }

export interface MorningBriefingReport {
  readonly asOf: string;
  readonly headline: string;
  readonly activeAcquirers: number;
  readonly movements: readonly BriefingMovement[];
  readonly actions: readonly BriefingAction[];
  readonly valueAtStakeUsd: number;       // strategic premium over the financial baseline
}

const KIND_LABEL: Record<string, string> = {
  new_acquisition: "completed an acquisition",
  cadence_shift: "shifted acquisition cadence",
  appetite_change: "changed acquisition appetite",
  new_buyer: "entered the index",
};

export function morningBriefing(): MorningBriefingReport {
  const baseline = VALUATION_INSTITUTIONAL.financialBaseline.mid;
  const valueAtStakeUsd = Math.max(0, VALUATION_INSTITUTIONAL.headline.mid - baseline);

  // movements — real registry changes, deduped by buyer, most recent first
  const seen = new Set<string>();
  const movements: BriefingMovement[] = [];
  for (const d of RADAR.deltas) {
    if (seen.has(d.buyer_id)) continue;
    seen.add(d.buyer_id);
    movements.push({
      name: d.name,
      ...(buyerById(d.buyer_id) ? { buyerId: d.buyer_id } : {}),
      kind: KIND_LABEL[d.kind] ?? d.kind,
      detail: d.detail,
    });
  }
  const newAcquirers = RADAR.deltas.filter((d) => d.kind === "new_acquisition").length;

  // recommended actions — the buyers most likely to acquire this founder
  const actions: BriefingAction[] = rankedBuyers(3).map((r) => ({
    name: r.profile.name,
    buyerId: r.profile.buyer_id,
    probabilityPct: r.probability.pct,
    why: buyerRationale(r.profile, baseline).points[0]?.detail ?? buyerRationale(r.profile, baseline).thesis,
    expectedValueUsd: expectedOutcomeFor(r.profile, baseline).expectedClose,
  }));

  const lead = actions[0];
  const headline = movements.length
    ? `${movements.length} acquirer${movements.length === 1 ? "" : "s"} moved since the last cycle${newAcquirers ? ` — ${newAcquirers} completed a deal` : ""}. ${lead ? `${lead.name} leads your buyer set at ${lead.probabilityPct}%; recommend opening outreach.` : "Review your ranked buyers."}`
    : lead
      ? `${lead.name} leads your buyer set at ${lead.probabilityPct}%. The buyer environment is stable — a good window to begin outreach.`
      : "No buyer activity to report this cycle.";

  const shown = movements.slice(0, 6);
  return { asOf: RADAR.detected_at, headline, activeAcquirers: shown.length, movements: shown, actions, valueAtStakeUsd };
}

export { fmtUsdShort };

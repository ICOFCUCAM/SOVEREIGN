import React from "react";
import { fmtMoney } from "../lib/ui";
import { Panel, Frame, CommandHeader } from "../lib/workstation";
import { VALUATION_STRATEGIC } from "../lib/engines";
import { DEAL_BUYERS } from "../lib/deal-context";
import BankerTake from "../components/BankerTake";
import { type BuyerCandidate, VALUATION_FRAMEWORK } from "@exit/engines";

// Buyer Copilot — buyer intelligence, not a directory. For every acquirer it
// computes the things a founder could never see: acquisition likelihood, the
// expected price range, time to close, deal risk, strategic synergy, how many
// similar deals they've done, and the offer to open with. All derived from the
// buyer-discovery engine's expected-outcome model and the acquirer's history.

interface Dossier {
  likelihood: number;
  rangeLow: number;
  rangeHigh: number;
  days: number;
  risk: "Low" | "Medium" | "High";
  synergy: "High" | "Medium" | "Low";
  priorDeals: number;
  recommendedOpen: number;
}

function dossier(c: BuyerCandidate): Dossier {
  const likelihood = Math.round(c.probability * 100);
  // Price the range off the strategic valuation band with a capped, type-aware
  // premium — keeps figures credible and consistent with the rest of the
  // console rather than tracking the raw historical-premium multiplier.
  const base = VALUATION_STRATEGIC.headline;
  const isStrategic = c.buyer.buyerType === "strategic";
  const round100k = (n: number): number => Math.round(n / 100_000) * 100_000;
  const prem = Math.min(0.2, Math.max(0, c.outcomes.avgPremiumPct ?? (isStrategic ? 0.12 : 0.04)));
  const rangeHigh = round100k(base.mid * (1 + prem));
  const rangeLow = round100k(base.mid * (0.82 + 0.12 * c.probability));
  const days = c.expectedOutcome.expectedDaysToCash;

  const retrade = c.outcomes.avgRetradePct ?? 0;
  const tier = c.expectedOutcome.overallConfidence.tier;
  const risk: Dossier["risk"] = retrade < -0.05 ? "High"
    : (tier === "high" || tier === "medium") && retrade > -0.03 ? "Low" : "Medium";

  const synScore = (c.fitDimensions.sectorFit + c.fitDimensions.modelFit + c.fitDimensions.historyFit) / 3;
  const synergy: Dossier["synergy"] = c.buyer.buyerType === "strategic" && synScore >= 0.55 ? "High"
    : synScore >= 0.4 ? "Medium" : "Low";

  const priorDeals = c.history.totalDeals;
  // open ~10% above the top of the expected range to anchor the negotiation
  const recommendedOpen = round100k(rangeHigh * 1.1);
  return { likelihood, rangeLow, rangeHigh, days, risk, synergy, priorDeals, recommendedOpen };
}

// Buyer DNA — the behavioral profile a founder could never assemble alone:
// how this acquirer treats founders, prices, structures and integrates.
interface BuyerDNA {
  founderFriendly: number;     // 0..100
  typicalPremiumPct: number;
  earnoutUsage: "Low" | "Medium" | "High";
  negotiationStyle: string;
  integration: string;
  legalAggression: "Low" | "Moderate" | "High";
  decisionMakers: string;
}

const DNA_BY_TYPE: Record<string, Omit<BuyerDNA, "founderFriendly" | "typicalPremiumPct">> = {
  strategic:     { earnoutUsage: "Low",    negotiationStyle: "Collaborative · synergy-led", integration: "Full integration",   legalAggression: "Moderate", decisionMakers: "Corp dev → BU GM → CFO" },
  pe:            { earnoutUsage: "High",   negotiationStyle: "Disciplined · price-led",     integration: "Standalone platform", legalAggression: "High",     decisionMakers: "Deal partner → Investment committee" },
  vc:            { earnoutUsage: "Medium", negotiationStyle: "Speed-led · founder-aligned", integration: "Light-touch",         legalAggression: "Low",      decisionMakers: "Partner → Fund principals" },
  family_office: { earnoutUsage: "Low",    negotiationStyle: "Relationship-led · patient",  integration: "Hands-off / hold",    legalAggression: "Low",      decisionMakers: "Principal → Family board" },
  sponsor:       { earnoutUsage: "High",   negotiationStyle: "Structured · returns-led",    integration: "Buy-and-build",       legalAggression: "High",     decisionMakers: "Operating partner → IC" },
};

function buyerDNA(c: BuyerCandidate): BuyerDNA {
  const t = c.buyer.buyerType;
  const baseFriendly: Record<string, number> = { strategic: 78, pe: 64, vc: 80, family_office: 90, sponsor: 60 };
  const retrade = c.outcomes.avgRetradePct ?? 0;
  const founderFriendly = Math.max(35, Math.min(96, Math.round((baseFriendly[t] ?? 70) + (retrade >= 0 ? 8 : retrade < -0.05 ? -16 : -6))));
  // buyer-type premium priors are owned by the Valuation Constitution
  const priorPct = Math.round((VALUATION_FRAMEWORK.buyerTypePremiumPriors[t] ?? VALUATION_FRAMEWORK.executionNeutrals.premiumPct) * 100);
  const typicalPremiumPct = c.outcomes.avgPremiumPct != null ? Math.round(Math.min(0.4, c.outcomes.avgPremiumPct) * 100) : priorPct;
  const rest = DNA_BY_TYPE[t] ?? DNA_BY_TYPE.strategic;
  return { founderFriendly, typicalPremiumPct, ...rest };
}

const RISK_COLOR: Record<string, string> = { Low: "#34d399", Medium: "#fbbf24", High: "#f87171" };
const SYN_COLOR: Record<string, string> = { High: "#34d399", Medium: "#fbbf24", Low: "#94a3b8" };
const TYPE_STYLE: Record<string, string> = {
  strategic: "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  pe: "bg-loi-500/15 text-loi-400 ring-loi-400/40",
  family_office: "bg-stage-engaged/15 text-stage-engaged ring-stage-engaged/40",
  sponsor: "bg-white/5 text-white/65 ring-white/15",
};

const BuyerCopilot: React.FC = () => {
  const candidates = DEAL_BUYERS.slice(0, 8);
  const top = candidates[0];
  const topD = top ? dossier(top) : null;

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="Find Buyers"
        title="Buyer Copilot"
        tag="Buyer intelligence"
        metrics={[
          { k: "Acquirers scored", v: String(candidates.length), sub: "ranked by likelihood" },
          { k: "Top likelihood", v: topD ? `${topD.likelihood}%` : "—", accent: true, sub: top?.buyer.name },
          { k: "Expected range", v: topD ? `${fmtMoney(topD.rangeLow)}–${fmtMoney(topD.rangeHigh)}` : "—", sub: "lead buyer" },
          { k: "Recommended open", v: topD ? fmtMoney(topD.recommendedOpen) : "—", accent: true, sub: "anchor above headline" },
        ]}
      />


      {top && topD && (
        <BankerTake
          next={<>Open a conversation with <span className="text-white">{top.buyer.name}</span> — highest acquisition likelihood at {topD.likelihood}%.</>}
          stake={<>Open at <span className="font-mono font-bold text-deal-300">{fmtMoney(topD.recommendedOpen)}</span> · expected range {fmtMoney(topD.rangeLow)}–{fmtMoney(topD.rangeHigh)}.</>}
          inaction={<>Acquisition windows close — {top.buyer.name} redeploys into the next target while you wait.</>}
          buyer={<><span className="text-white">{top.buyer.name}</span> — {topD.likelihood}% likelihood, {topD.synergy.toLowerCase()} synergy, {topD.risk.toLowerCase()} risk.</>}
          automate={<>ExitOS scores likelihood, timing, risk and synergy for every buyer from their measured deal history.</>}
          impact={<>{fmtMoney(topD.recommendedOpen)}</>}
          cta={{ label: "Draft outreach", to: "/console/banker" }}
        />
      )}

      <Frame>
        <Panel title="Acquirer dossiers · scored" className="lg:col-span-12">
          <div className="grid grid-cols-1 gap-px bg-white/10 lg:grid-cols-2">
            {candidates.map((c) => {
              const d = dossier(c);
              const dna = buyerDNA(c);
              return (
                <div key={c.buyer.name} className="bg-ink-900 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-mono text-[15px] font-bold text-white">{c.buyer.name}</h3>
                      <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ${TYPE_STYLE[c.buyer.buyerType] ?? "bg-white/5 text-white/60 ring-white/15"}`}>{c.buyer.buyerType.replace(/_/g, " ")}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-semibold uppercase tracking-[0.18em] text-white/40">Likelihood</div>
                      <div className="font-mono text-2xl font-bold text-deal-300">{d.likelihood}%</div>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-white/55">{c.buyer.thesis}</p>
                  <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2 border-t border-white/10 pt-2 text-[10.5px]">
                    <Metric label="Exp. range" value={`${fmtMoney(d.rangeLow)}–${fmtMoney(d.rangeHigh)}`} />
                    <Metric label="To close" value={`${d.days}d`} />
                    <Metric label="Prior deals" value={String(d.priorDeals)} />
                    <Metric label="Risk" value={d.risk} color={RISK_COLOR[d.risk]} />
                    <Metric label="Synergy" value={d.synergy} color={SYN_COLOR[d.synergy]} />
                    <Metric label="Close rate" value={`${Math.round(c.expectedOutcome.closeRatePct * 100)}%`} />
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded border border-deal-500/30 bg-deal-600/[0.07] px-3 py-1.5">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-deal-300">Recommended open</div>
                    <div className="font-mono text-[15px] font-bold text-deal-300">{fmtMoney(d.recommendedOpen)}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2 border-t border-white/10 pt-2 text-[10.5px]">
                    <Metric label="Founder-friendly" value={`${dna.founderFriendly}%`} color="#34d399" />
                    <Metric label="Typ. premium" value={`+${dna.typicalPremiumPct}%`} color="#34d399" />
                    <Metric label="Earnout" value={dna.earnoutUsage} />
                    <Metric label="Negotiation" value={dna.negotiationStyle} />
                    <Metric label="Integration" value={dna.integration} />
                    <Metric label="Legal" value={dna.legalAggression} />
                  </div>
                  <div className="mt-1.5 text-[10px] text-white/45">Decision makers: <span className="text-white/70">{dna.decisionMakers}</span></div>
                </div>
              );
            })}
          </div>
        </Panel>
      </Frame>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
    <div className="mt-0.5 font-semibold" style={color ? { color } : undefined}>{value}</div>
  </div>
);

export default BuyerCopilot;

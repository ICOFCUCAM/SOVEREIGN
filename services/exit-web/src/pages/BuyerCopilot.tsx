import React from "react";
import { Card, SectionHeader, fmtMoney } from "../lib/ui";
import { VALUATION_STRATEGIC } from "../lib/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import BankerTake from "../components/BankerTake";
import { runBuyerDiscovery, type BuyerCandidate } from "@exit/engines";

// Anchor the buyer pool to the strategic valuation so the expected ranges and
// opening offers line up with the rest of the console (rather than the engine's
// raw ARR-derived implied price).
const REPORT = runBuyerDiscovery(SAMPLE_COMPANY, {
  impliedPriceUsd: VALUATION_STRATEGIC.headline.mid,
  limit: 8,
  sortBy: "expected_outcome",
});

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

const RISK_COLOR: Record<string, string> = { Low: "#34d399", Medium: "#fbbf24", High: "#f87171" };
const SYN_COLOR: Record<string, string> = { High: "#34d399", Medium: "#fbbf24", Low: "#94a3b8" };
const TYPE_STYLE: Record<string, string> = {
  strategic: "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  pe: "bg-loi-500/15 text-loi-400 ring-loi-400/40",
  family_office: "bg-stage-engaged/15 text-stage-engaged ring-stage-engaged/40",
  sponsor: "bg-white/5 text-white/65 ring-white/15",
};

const BuyerCopilot: React.FC = () => {
  const candidates = REPORT.candidates.slice(0, 8);
  const top = candidates[0];
  const topD = top ? dossier(top) : null;

  return (
    <div>
      <SectionHeader
        kicker="Find Buyers · Buyer intelligence"
        title="Buyer Copilot"
        description="Every acquirer, scored on the intelligence no banker can give you: likelihood to acquire, expected price range, time to close, deal risk, strategic synergy, prior similar acquisitions, and the offer to open with."
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

      <div className="grid gap-4 lg:grid-cols-2">
        {candidates.map((c) => {
          const d = dossier(c);
          return (
            <Card key={c.buyer.name} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">{c.buyer.name}</h3>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${TYPE_STYLE[c.buyer.buyerType] ?? "bg-white/5 text-white/60 ring-white/15"}`}>
                    {c.buyer.buyerType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Likelihood</div>
                  <div className="font-mono text-3xl font-bold text-deal-300">{d.likelihood}%</div>
                </div>
              </div>

              <p className="mt-3 text-[12px] leading-snug text-white/55">{c.buyer.thesis}</p>

              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 pt-4 text-[12px] sm:grid-cols-3">
                <Metric label="Expected range" value={`${fmtMoney(d.rangeLow)}–${fmtMoney(d.rangeHigh)}`} />
                <Metric label="Time to close" value={`${d.days} days`} />
                <Metric label="Prior similar deals" value={String(d.priorDeals)} />
                <Metric label="Risk" value={d.risk} color={RISK_COLOR[d.risk]} />
                <Metric label="Synergy" value={d.synergy} color={SYN_COLOR[d.synergy]} />
                <Metric label="Close rate" value={`${Math.round(c.expectedOutcome.closeRatePct * 100)}%`} />
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-deal-500/30 bg-deal-600/[0.07] px-4 py-3">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-deal-300">Recommended opening offer</div>
                  <div className="text-[11px] text-white/45">anchors above expected headline</div>
                </div>
                <div className="font-mono text-xl font-bold text-deal-300">{fmtMoney(d.recommendedOpen)}</div>
              </div>
            </Card>
          );
        })}
      </div>
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

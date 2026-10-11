import React, { useMemo } from "react";
import { fmtMoney } from "../lib/ui";
import { MarketTape } from "../lib/workstation";
import { PageHeader, Section, Metric as XMetric } from "../components/xo";
import { Link } from "react-router-dom";
import { buildMarketTape } from "../lib/market-tape";
import { VALUATION_CANONICAL } from "../lib/engines";
import { DEAL_BUYERS } from "../lib/deal-context";
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
  const base = VALUATION_CANONICAL.headline;
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

// Typical premium — the buyer's disclosed average (capped at 40%) when the
// registry has one, else the Valuation Constitution's prior for its type.
// Other behavioural traits (founder-friendliness, earnout use, negotiation
// style, integration, legal posture) are not measured per buyer, so none are
// shown.
function typicalPremium(c: BuyerCandidate): { pct: number; source: "disclosed" | "prior" } {
  if (c.outcomes.avgPremiumPct != null) return { pct: Math.round(Math.min(0.4, c.outcomes.avgPremiumPct) * 100), source: "disclosed" };
  const t = c.buyer.buyerType;
  return { pct: Math.round((VALUATION_FRAMEWORK.buyerTypePremiumPriors[t] ?? VALUATION_FRAMEWORK.executionNeutrals.premiumPct) * 100), source: "prior" };
}

const RISK_CLS: Record<string, string> = { Low: "text-xo-verified", Medium: "text-xo-caution", High: "text-xo-risk" };
const SYN_CLS: Record<string, string> = { High: "text-xo-verified", Medium: "text-xo-caution", Low: "text-xo-muted" };

const BuyerCopilot: React.FC = () => {
  const candidates = DEAL_BUYERS.slice(0, 8);
  const top = candidates[0];
  const topD = top ? dossier(top) : null;
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="buyer-intelligence" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Find Buyers" title="Buyer Intelligence"
        badge={<span className="text-[12px] text-xo-muted">Buyer Copilot · buyer intelligence</span>} />

      <section aria-label="Buyer summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><XMetric label="Buyers shown" value={String(candidates.length)} sub="top ranked by expected outcome" /></div>
        <div className="bg-xo-panel"><XMetric label="Fit probability · #1" emphasis value={topD ? `${topD.likelihood}%` : "—"} sub={top?.buyer.name} /></div>
        <div className="bg-xo-panel"><XMetric label="Indicative range · #1" value={topD ? `${fmtMoney(topD.rangeLow)}–${fmtMoney(topD.rangeHigh)}` : "—"} sub="heuristic, see below" /></div>
        <div className="bg-xo-panel"><XMetric label="Opening ask (rule) · #1" value={topD ? fmtMoney(topD.recommendedOpen) : "—"} sub="10% above the indicative high" /></div>
      </section>

      <MarketTape items={tape} />

      {top && topD && (
        <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
          right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">{fmtMoney(topD.recommendedOpen)}</span>}>
          <div className="px-4 py-3">
            <p className="text-[14px] leading-relaxed">Open a conversation with <span className="font-semibold">{top.buyer.name}</span> — ranked first by expected outcome (fit probability {topD.likelihood}%).</p>
            <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
              <TakeCell k="At stake">Opening ask (rule) <span className="font-mono font-semibold text-xo-verified">{fmtMoney(topD.recommendedOpen)}</span> · indicative range {fmtMoney(topD.rangeLow)}–{fmtMoney(topD.rangeHigh)}.</TakeCell>
              <TakeCell k="If you wait">Acquisition windows close — {top.buyer.name} redeploys into the next target while you wait.</TakeCell>
              <TakeCell k="Pursue">{top.buyer.name} — fit probability {topD.likelihood}%, {topD.synergy.toLowerCase()} synergy, {topD.risk.toLowerCase()} risk (rules below).</TakeCell>
              <TakeCell k="ExitOS does it">ExitOS scores likelihood, timing, risk and synergy for every buyer from their measured deal history.</TakeCell>
            </dl>
            <Link to="/console/banker" className="mt-3 inline-block rounded-sm bg-deal-700 px-4 py-2 text-[13px] font-semibold text-white hover:bg-deal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Draft outreach →</Link>
          </div>
        </Section>
      )}

      <Section title="Acquirer dossiers · scored" className="border border-xo-line"
        foot="Fit probability is the discovery engine's weighted fit score — not a measured chance of a bid. Indicative range: low = enterprise value × (0.82 + 0.12 × fit), high = enterprise value × (1 + premium), premium being the buyer's disclosed average or 12% for strategics and 4% otherwise, capped at 20%. Opening ask: 10% above the high. Risk: high if the buyer's average retrade is worse than −5%; low if model confidence is medium or high and retrade is better than −3%; otherwise medium. Synergy: mean of sector, model and history fit — high for strategics at 0.55 or more, medium at 0.40 or more. Typical premium is the buyer's disclosed average (capped at 40%) or, where none is disclosed, the framework prior for its type. Founder-friendliness, earnout use, negotiation style, integration and legal posture are not measured for individual buyers, so they are not shown.">
        <ol className="grid grid-cols-1 gap-px bg-xo-line lg:grid-cols-2">
          {candidates.map((c, i) => {
            const d = dossier(c);
            const prem = typicalPremium(c);
            return (
              <li key={c.buyer.name} className="bg-xo-panel px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold"><span className="sr-only">Rank {i + 1}: </span>{c.buyer.name}</h3>
                    <span className="mt-0.5 inline-block text-[11px] font-medium capitalize text-xo-muted">{c.buyer.buyerType.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-xo-faint">Fit probability</div>
                    <div className="font-mono text-[22px] font-semibold tabular-nums text-xo-verified">{d.likelihood}%</div>
                  </div>
                </div>
                <p className="mt-1.5 text-[12px] leading-snug text-xo-muted">{c.buyer.thesis}</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-xo-line pt-2 sm:grid-cols-3">
                  <Fact label="Indicative range" value={`${fmtMoney(d.rangeLow)}–${fmtMoney(d.rangeHigh)}`} />
                  <Fact label="To close" value={`${d.days}d`} />
                  <Fact label="Prior deals" value={String(d.priorDeals)} />
                  <Fact label="Risk (rule)" value={d.risk} cls={RISK_CLS[d.risk]} />
                  <Fact label="Synergy (rule)" value={d.synergy} cls={SYN_CLS[d.synergy]} />
                  <Fact label="Close rate" value={`${Math.round(c.expectedOutcome.closeRatePct * 100)}%`} />
                </dl>
                <div className="mt-2 flex items-center justify-between border border-xo-line px-3 py-1.5">
                  <div className="text-[11px] font-medium text-xo-muted">Opening ask (rule)</div>
                  <div className="font-mono text-[15px] font-semibold tabular-nums text-xo-verified">{fmtMoney(d.recommendedOpen)}</div>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-xo-line pt-2 sm:grid-cols-3">
                  <Fact label={prem.source === "disclosed" ? "Typ. premium (disclosed avg)" : "Typ. premium (type prior)"} value={`+${prem.pct}%`} />
                </dl>
              </li>
            );
          })}
        </ol>
      </Section>
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

const Fact: React.FC<{ label: string; value: string; cls?: string }> = ({ label, value, cls }) => (
  <div className="min-w-0">
    <dt className="text-[11px] text-xo-faint">{label}</dt>
    <dd className={`mt-0.5 text-[13px] font-semibold ${cls ?? "text-xo-text"}`}>{value}</dd>
  </div>
);

export default BuyerCopilot;

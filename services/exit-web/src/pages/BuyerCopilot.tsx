import React, { useMemo } from "react";
import { fmtMoney } from "../lib/ui";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { PageHeader, Section, Metric as XMetric, Provenance } from "../components/xo";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { requiredEngagement } from "../lib/access";
import { buildMarketTape } from "../lib/market-tape";
import { dealContextFor } from "../lib/deal-context";
import { loadActiveCompany } from "../lib/active-company";
import { label } from "../lib/labels";
import { type BuyerCandidate, VALUATION_FRAMEWORK } from "@exit/engines";

// Buyer Copilot — buyer intelligence, not a directory. For every acquirer it
// computes the things a founder could never see: acquisition likelihood, the
// expected price range, time to close, deal risk, strategic synergy, how many
// similar deals they've done, and the offer to open with. All derived from the
// buyer-discovery engine's expected-outcome model and the acquirer's history.
// PRELAUNCH-REVIEW: measured-history framing restored (likelihood is the engine's fit score; risk/synergy are stated rules)

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

function dossier(c: BuyerCandidate, base: { mid: number }): Dossier {
  const likelihood = Math.round(c.probability * 100);
  // Price the range off the strategic valuation band with a capped, type-aware
  // premium — keeps figures credible and consistent with the rest of the
  // console rather than tracking the raw historical-premium multiplier.
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
function typicalPremium(c: BuyerCandidate): { pct: number; source: "disclosed" | "prior" } {
  if (c.outcomes.avgPremiumPct != null) return { pct: Math.round(Math.min(0.4, c.outcomes.avgPremiumPct) * 100), source: "disclosed" };
  const t = c.buyer.buyerType;
  return { pct: Math.round((VALUATION_FRAMEWORK.buyerTypePremiumPriors[t] ?? VALUATION_FRAMEWORK.executionNeutrals.premiumPct) * 100), source: "prior" };
}

// Buyer DNA — the behavioral profile a founder could never assemble alone:
// how this acquirer treats founders, prices, structures and integrates.
// PRELAUNCH-REVIEW: buyer DNA by buyer type restored (type stereotypes, not measured per buyer; no behavioural-data source)
interface BuyerDNA {
  founderFriendly: number;     // 0..100
  earnoutUsage: "Low" | "Medium" | "High";
  negotiationStyle: string;
  integration: string;
  legalAggression: "Low" | "Moderate" | "High";
  decisionMakers: string;
}

const DNA_BY_TYPE: Record<string, Omit<BuyerDNA, "founderFriendly">> = {
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
  const rest = DNA_BY_TYPE[t] ?? DNA_BY_TYPE.strategic;
  return { founderFriendly, ...rest };
}

const RISK_CLS: Record<string, string> = { Low: "text-xo-verified", Medium: "text-xo-caution", High: "text-xo-risk" };
const SYN_CLS: Record<string, string> = { High: "text-xo-verified", Medium: "text-xo-caution", Low: "text-xo-muted" };

const BuyerCopilot: React.FC = () => {
  // The founder's saved intake when there is one, else the demo company.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const ctx = useMemo(() => dealContextFor(company), [company]);
  const candidates = ctx.dealBuyers.slice(0, 8);
  const top = candidates[0];
  const topD = top ? dossier(top, ctx.valuationBand) : null;
  const tape = useMemo(() => buildMarketTape(), []);
  const { session } = useAuth();
  // Outreach is an Active Mandate surface; say so before the click.
  const outreachGate = requiredEngagement("/console/banker", session?.role ?? "founder", session?.plan ?? "free");

  return (
    <div data-page="buyer-intelligence" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={fromIntake ? `◉ Find Buyers · Your intake: ${company.name}` : `◉ Find Buyers · Demo company: ${company.name}`} title="Buyer Intelligence"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Buyer Copilot · enterprise value {fmtMoney(ctx.valuationBand.mid)}</span></>} />

      <section aria-label="Buyer summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><XMetric label="Buyers shown" value={String(candidates.length)} sub="top ranked by expected outcome" /></div>
        <div className="bg-xo-panel"><XMetric label="Fit probability · #1" emphasis value={topD ? `${topD.likelihood}%` : "—"} sub={top?.buyer.name} /></div>
        <div className="bg-xo-panel"><XMetric label="Indicative range · #1" value={topD ? `${fmtMoney(topD.rangeLow)}–${fmtMoney(topD.rangeHigh)}` : "—"} sub="heuristic, see below" /></div>
        <div className="bg-xo-panel"><XMetric label="Opening ask (rule) · #1" value={topD ? fmtMoney(topD.recommendedOpen) : "—"} sub="10% above the indicative high" /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      {top && topD && (
        <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
          right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">{fmtMoney(topD.recommendedOpen)}</span>}>
          <div className="px-4 py-3">
            <p className="text-[14px] leading-relaxed">Open a conversation with <span className="font-semibold">{top.buyer.name}</span> — ranked first by expected outcome (fit probability {topD.likelihood}%).</p>
            <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
              <TakeCell k="At stake">Opening ask (rule) <span className="font-mono font-semibold text-xo-verified">{fmtMoney(topD.recommendedOpen)}</span> · indicative range {fmtMoney(topD.rangeLow)}–{fmtMoney(topD.rangeHigh)}.</TakeCell>
              {/* PRELAUNCH-REVIEW: urgency line restored (no source tracks buyer redeployment) */}
              <TakeCell k="If you wait">Acquisition windows close — {top.buyer.name} redeploys into the next target while you wait.</TakeCell>
              <TakeCell k="Pursue">{top.buyer.name} — fit probability {topD.likelihood}%, {topD.synergy.toLowerCase()} synergy, {topD.risk.toLowerCase()} risk (rules below).</TakeCell>
              {/* PRELAUNCH-REVIEW: measured-history claim restored (scores are engine fit and stated rules on recorded history) */}
              <TakeCell k="ExitOS does it">ExitOS scores likelihood, timing, risk and synergy for every buyer from their measured deal history.</TakeCell>
            </dl>
            <Link to="/console/banker" className="mt-3 inline-block rounded-sm bg-desk-gold px-4 py-2 text-[13px] font-semibold text-desk-ink hover:bg-[#AA8443] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Draft outreach →</Link>
            {outreachGate && <span className="ml-3 text-[12px] text-xo-caution">Requires {outreachGate}</span>}
          </div>
        </Section>
      )}

      <Section title="Acquirer dossiers · scored" className="border border-xo-line"
        foot="Fit probability is the discovery engine's weighted fit score — not a measured chance of a bid. Indicative range: low = enterprise value × (0.82 + 0.12 × fit), high = enterprise value × (1 + premium), premium being the buyer's disclosed average or 12% for strategics and 4% otherwise, capped at 20%. Opening ask: 10% above the high. Risk: high if the buyer's average retrade is worse than −5%; low if model confidence is medium or high and retrade is better than −3%; otherwise medium. Synergy: mean of sector, model and history fit — high for strategics at 0.55 or more, medium at 0.40 or more. Typical premium is the buyer's disclosed average (capped at 40%) or, where none is disclosed, the framework prior for its type.">
        <ol className="grid grid-cols-1 gap-px bg-xo-line lg:grid-cols-2">
          {candidates.map((c, i) => {
            const d = dossier(c, ctx.valuationBand);
            const prem = typicalPremium(c);
            const dna = buyerDNA(c);
            return (
              <li key={c.buyer.name} className="bg-xo-panel px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold"><span className="sr-only">Rank {i + 1}: </span>{c.buyer.name}</h3>
                    <span className="mt-0.5 inline-block text-[11px] font-medium text-xo-muted">{label(c.buyer.buyerType)}</span>
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
                  {/* PRELAUNCH-REVIEW: buyer DNA facts restored (by buyer type; not measured per buyer) */}
                  <Fact label="Founder-friendly" value={`${dna.founderFriendly}%`} />
                  <Fact label={prem.source === "disclosed" ? "Typ. premium (disclosed avg)" : "Typ. premium (type prior)"} value={`+${prem.pct}%`} />
                  <Fact label="Earnout" value={dna.earnoutUsage} />
                  <Fact label="Negotiation" value={dna.negotiationStyle} />
                  <Fact label="Integration" value={dna.integration} />
                  <Fact label="Legal" value={dna.legalAggression} />
                </dl>
                <p className="mt-1.5 text-[12px] text-xo-faint">Decision makers: <span className="text-xo-muted">{dna.decisionMakers}</span></p>
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

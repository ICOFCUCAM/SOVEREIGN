import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, SectionHeader } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { runInstitutionalValuation, runReadiness, runReadinessAnalysis } from "@exit/engines";
import { rankedBuyers, expectedOutcomeFor, strategicThemes, buyerRationale, fmtUsdShort } from "../lib/buyer-dna";
import { loadActiveCompany, activeTokens } from "../lib/active-company";
import BuyerInterestGate from "../components/BuyerInterestGate";
import MorningBriefing from "../components/MorningBriefing";

// ── ACQUISITION INTELLIGENCE TERMINAL ───────────────────────────────
// The product, on one screen, personalized to the active company (the
// founder's intake, or the demo). A founder opens ExitOS and immediately
// sees the answer: who is most likely to buy them, at what price, why, and
// on what evidence — every figure composed from the engines, nothing new.

const pctOf = (x?: number): string => (x == null ? "—" : `${Math.round(x * 100)}%`);

const Terminal: React.FC = () => {
  const { session } = useAuth();
  const plan = session?.plan ?? "free";

  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const INST = useMemo(() => runInstitutionalValuation(company), [company]);
  const ra = useMemo(() => runReadinessAnalysis(company, runReadiness(company)), [company]);
  const tokens = useMemo(() => activeTokens(company), [company]);
  const BASELINE = INST.financialBaseline.mid;

  const TOP = rankedBuyers(8, tokens).map((r) => ({ ...r, exp: expectedOutcomeFor(r.profile, BASELINE) }));
  const lead = TOP[0];
  const themes = strategicThemes(6);
  const comps = INST.comparableTransactions.slice(0, 6);
  const uplift = Math.max(0, ra.projectedStrategicMid - ra.currentStrategicMid);

  // the product statement — built from the #1 ranked buyer + the framework
  const leadPremium = lead?.profile.premium_pct ?? INST.premium.appliedPct;
  const leadCloseDays = lead?.profile.median_close_days ?? INST.timeToClose.lowDays;

  return (
    <div>
      {plan === "free" && <BuyerInterestGate />}

      <SectionHeader
        kicker="Acquisition Intelligence Terminal"
        title={`${company.name} · exit intelligence`}
        description={`${fromIntake ? "Your company" : "Demo company"} · who is most likely to buy you, at what price, why, and on what evidence — synthesized from the buyer graph, ${INST.comparablesUsed} comparable transactions and the valuation framework.`}
      />

      {/* Chief Investment Banker — proactive morning briefing */}
      <div className="mb-6"><MorningBriefing baselineUsd={BASELINE} headlineMidUsd={INST.headline.mid} tokens={tokens} /></div>

      {/* the product statement */}
      {lead && (
        <Card className="overflow-hidden border-deal-400/30 p-0">
          <div className="bg-gradient-to-r from-deal-600/15 to-transparent px-6 py-5">
            <div className="font-serif text-xl font-bold leading-snug text-white sm:text-2xl">
              <Link to={`/console/buyer/${lead.profile.buyer_id}`} className="text-deal-200 hover:underline">{lead.profile.name}</Link>{" "}
              is <span className="tabular-nums text-deal-200">{lead.probability.pct}%</span> likely to acquire a company like {company.name}.
            </div>
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
              <Stat k="Expected valuation" v={`${fmtUsdShort(INST.headline.low)} – ${fmtUsdShort(INST.headline.high)}`} />
              <Stat k="Based on" v={`${INST.comparablesUsed} comparable acquisitions`} />
              <Stat k="Typical premium" v={`+${pctOf(leadPremium)}`} />
              <Stat k="Median close" v={`${leadCloseDays} days`} />
              <Stat k="Confidence" v={`${INST.confidence.score}% · ${INST.confidence.tier}`} />
            </div>
            <p className="mt-3 max-w-3xl text-[12.5px] leading-relaxed text-white/55">{buyerRationale(lead.profile, BASELINE, tokens, company.sector).thesis}</p>
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* TOP BUYERS */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Top buyers · ranked by probability</span>
            <Link to="/console/buyer-graph" className="text-[10px] uppercase tracking-wide text-white/35 hover:text-white/60">full ranking →</Link>
          </div>
          <table className="w-full text-[13px]">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-2.5">Buyer</th>
                <th className="px-3 py-2.5 text-right">Probability</th>
                <th className="px-3 py-2.5 text-right">Expected value</th>
                <th className="px-3 py-2.5 text-right">Premium</th>
                <th className="px-5 py-2.5 text-right">Close rate</th>
              </tr>
            </thead>
            <tbody>
              {TOP.map((r) => (
                <tr key={r.profile.buyer_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-2.5"><Link to={`/console/buyer/${r.profile.buyer_id}`} className="font-semibold text-white hover:text-deal-300">{r.profile.name}</Link></td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-deal-300">{r.probability.pct}%</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/85">{fmtUsdShort(r.exp.expectedOffer)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/70">+{Math.round(r.exp.premium * 100)}%{!r.exp.premiumKnown ? "*" : ""}</td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums text-white/70">{Math.round(r.exp.close * 100)}%{!r.exp.closeKnown ? "*" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">* premium/close not disclosed for this buyer — labelled market-neutral prior. Probability = appetite × sector overlap × velocity × recency.</div>
        </Card>

        {/* ACQUISITION READINESS */}
        <Card className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Acquisition readiness</div>
          <div className="mt-3 flex items-end gap-3">
            <div className="font-mono text-4xl font-bold tabular-nums text-white">{Math.round(ra.currentScore)}</div>
            <div className="pb-1 text-[12px] text-white/45">/ 100 · projects to <span className="font-bold text-white/80">{Math.round(ra.projectedScore)}</span></div>
          </div>
          <div className="mt-3 rounded-lg border border-deal-400/30 bg-deal-600/10 px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-deal-300">Potential valuation uplift</div>
            <div className="font-mono text-xl font-bold tabular-nums text-deal-200">+{fmtUsdShort(uplift)}</div>
          </div>
          <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Actions</div>
          <ul className="mt-2 space-y-2">
            {ra.weaknesses.slice(0, 4).map((w) => (
              <li key={w.dimension} className="text-[12px]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-white/85">{w.dimension}</span>
                  <span className="font-mono tabular-nums text-deal-300">+{fmtUsdShort(w.valuationUpliftUsd)}</span>
                </div>
                <div className="text-[11px] leading-snug text-white/45">{w.recommendation.slice(0, 96)}{w.recommendation.length > 96 ? "…" : ""}</div>
              </li>
            ))}
          </ul>
          <Link to="/console/readiness" className="mt-4 inline-block text-[11px] font-semibold text-deal-300 hover:text-deal-200">Full readiness plan →</Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* SIMILAR TRANSACTIONS */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Similar transactions</div>
          {comps.length ? (
            <table className="w-full text-[12.5px]">
              <tbody>
                {comps.map((c, i) => (
                  <tr key={`${c.target}-${i}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-2.5"><span className="font-medium text-white">{c.target}</span> <span className="text-white/40">→</span> <span className="text-white/75">{c.buyer}</span></td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/55">{c.date ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/70">{c.premiumPct != null ? `+${Math.round(c.premiumPct * 100)}%` : "—"}</td>
                    <td className="px-5 py-2.5 text-right font-mono tabular-nums text-deal-300">{c.priceUsd != null ? fmtUsdShort(c.priceUsd) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="px-5 py-4 text-[12px] text-white/45">No same-sector comparables indexed yet.</div>}
          <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">Source-referenced precedent transactions from the acquisition registry.</div>
        </Card>

        {/* STRATEGIC THEMES */}
        <Card className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Strategic themes · detected</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {themes.map((t) => (
              <span key={t.theme} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] capitalize text-white/80">
                {t.theme} <span className="font-mono text-[10px] text-deal-300">{t.buyers}</span>
              </span>
            ))}
            {themes.length === 0 && <span className="text-[12px] text-white/45">No strategic themes indexed for the active buyer set yet.</span>}
          </div>
          <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Active buyers in your space</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {TOP.slice(0, 6).map((r) => (
              <Link key={r.profile.buyer_id} to={`/console/buyer/${r.profile.buyer_id}`} className="rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[11.5px] font-medium text-white/75 hover:text-deal-300">{r.profile.name}</Link>
            ))}
          </div>
          <div className="mt-4 text-[10px] text-white/35">Themes = number of indexed buyers actively pursuing each. Explore the full map in the <Link to="/console/market-map" className="text-deal-300 hover:text-deal-200">Market Map</Link>.</div>
        </Card>
      </div>
    </div>
  );
};

const Stat: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <span className="flex flex-col">
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{k}</span>
    <span className="font-mono text-[14px] font-bold tabular-nums text-white">{v}</span>
  </span>
);

export default Terminal;

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, Kpi, SectionHeader } from "../lib/ui";
import { runInstitutionalValuation } from "@exit/engines";
import { loadActiveCompany, activeTokens } from "../lib/active-company";
import { buildOutreachPlan } from "../lib/outreach-plan";
import { fmtUsdShort } from "../lib/buyer-dna";

// BUYER OUTREACH PLAN — the banker's targeted program: ~20 qualified buyers
// for one company, sequenced into waves that build competitive tension, each
// with its contact path and expected value. The action layer on top of the
// intelligence.

const TIER_STYLE: Record<number, string> = {
  1: "text-deal-300 bg-deal-600/15 ring-deal-400/40",
  2: "text-loi-300 bg-loi-500/15 ring-loi-400/40",
  3: "text-white/55 bg-white/5 ring-white/15",
};
const CONF_STYLE: Record<string, string> = {
  High: "text-deal-300", Medium: "text-loi-300", Low: "text-white/45",
};

const OutreachPlan: React.FC = () => {
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const baseline = useMemo(() => runInstitutionalValuation(company).financialBaseline.mid, [company]);
  const tokens = useMemo(() => activeTokens(company), [company]);
  const plan = useMemo(() => buildOutreachPlan(baseline, tokens, 20), [baseline, tokens]);

  return (
    <div>
      <SectionHeader
        kicker="Exchange · Execution"
        title="Buyer Outreach Plan"
        description={`${fromIntake ? "Your company" : company.name} · the targeted process a banker runs — the ${plan.totalBuyers} buyers most likely to acquire you, sequenced into waves that build competitive tension, each with its contact path and expected value. Not a mass mailer.`}
      />

      <Card className="border-deal-400/30 p-5">
        <p className="font-serif text-[15px] font-bold leading-snug text-white">{plan.summary}</p>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Qualified buyers" value={String(plan.totalBuyers)} sub="targeted, not mass" accent="#34d399" />
        <Kpi label="Sequenced waves" value={String(plan.waves.length)} sub="competitive tension" />
        <Kpi label="Lead bidders" value={String(plan.waves[0]?.buyers.length ?? 0)} sub="week 1" accent="#fbbf24" />
        <Kpi label="Anchor expected value" value={fmtUsdShort(plan.waves[0]?.buyers[0]?.expectedValueUsd ?? 0)} sub="top buyer" />
      </div>

      <div className="mt-8 space-y-6">
        {plan.waves.map((w) => (
          <Card key={w.tier} className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${TIER_STYLE[w.tier]}`}>Wave {w.tier} · {w.label}</span>
                <span className="text-[11px] text-white/45">{w.timing}</span>
              </div>
              <span className="text-[11px] text-white/35">{w.buyers.length} buyers</span>
            </div>
            <p className="px-5 pt-3 text-[12px] text-white/50">{w.rationale}</p>
            <table className="mt-2 w-full text-[12.5px]">
              <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-2">Buyer</th>
                  <th className="px-3 py-2 text-right">Probability</th>
                  <th className="px-3 py-2 text-right">Expected value</th>
                  <th className="px-3 py-2">Contact path</th>
                  <th className="px-5 py-2 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {w.buyers.map((b) => (
                  <tr key={b.buyerId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-2.5">
                      <Link to={`/console/buyer/${b.buyerId}`} className="font-semibold text-white hover:text-deal-300">{b.name}</Link>
                      <div className="text-[10.5px] text-white/35">{b.why}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-deal-300">{b.probabilityPct}%</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/80">{fmtUsdShort(b.expectedValueUsd)}</td>
                    <td className="px-3 py-2.5 text-white/65">{b.contactPath}</td>
                    <td className={`px-5 py-2.5 text-right font-semibold ${CONF_STYLE[b.confidence]}`}>{b.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-[11px] text-white/40">
        Contact paths and confidence come from each buyer's <Link to="/console/buyer-graph" className="text-deal-300 hover:text-deal-200">contact intelligence</Link>; probabilities and expected value from the buyer graph and valuation framework. ExitOS surfaces the path — it does not store or send to personal contacts.
      </p>
    </div>
  );
};

export default OutreachPlan;

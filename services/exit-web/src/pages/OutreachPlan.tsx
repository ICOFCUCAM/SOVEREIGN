import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Panel, Frame, CommandHeader } from "../lib/workstation";
import { runInstitutionalValuation } from "@exit/engines";
import { loadActiveCompany, activeTokens } from "../lib/active-company";
import { buildOutreachPlan } from "../lib/outreach-plan";
import { fmtUsdShort } from "../lib/buyer-dna";

// BUYER OUTREACH PLAN — the banker's targeted program: ~20 qualified buyers
// for one company, sequenced into waves that build competitive tension, each
// with its contact path and expected value. The action layer on top of the
// intelligence.

const CONF_STYLE: Record<string, string> = {
  High: "text-deal-300", Medium: "text-loi-300", Low: "text-white/45",
};

const OutreachPlan: React.FC = () => {
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const baseline = useMemo(() => runInstitutionalValuation(company).financialBaseline.mid, [company]);
  const tokens = useMemo(() => activeTokens(company), [company]);
  const plan = useMemo(() => buildOutreachPlan(baseline, tokens, 20), [baseline, tokens]);

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="Exchange · Execution"
        title="Buyer Outreach Plan"
        tag={fromIntake ? "Your mandate" : company.name}
        status="Sequenced"
        metrics={[
          { k: "Qualified buyers", v: String(plan.totalBuyers), accent: true, sub: "targeted, not mass" },
          { k: "Sequenced waves", v: String(plan.waves.length), sub: "competitive tension" },
          { k: "Lead bidders", v: String(plan.waves[0]?.buyers.length ?? 0), sub: "week 1" },
          { k: "Anchor expected value", v: fmtUsdShort(plan.waves[0]?.buyers[0]?.expectedValueUsd ?? 0), accent: true, sub: "top buyer" },
        ]}
        note={<span className="text-white/70">{plan.summary}</span>}
      />


      <Frame>
        {plan.waves.map((w) => (
          <Panel key={w.tier} title={`Wave ${w.tier} · ${w.label}`} className="lg:col-span-12"
            right={<span className="text-[9px] uppercase tracking-wide text-white/35">{w.timing} · {w.buyers.length} buyers</span>}
            foot={w.rationale}>
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
                <tr className="border-b border-white/10">
                  <th className="px-3 py-1.5">Buyer</th>
                  <th className="px-2 py-1.5 text-right">Prob</th>
                  <th className="px-2 py-1.5 text-right">Expected value</th>
                  <th className="px-2 py-1.5">Contact path</th>
                  <th className="px-3 py-1.5 text-right">Conf</th>
                </tr>
              </thead>
              <tbody>
                {w.buyers.map((b) => (
                  <tr key={b.buyerId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-3 py-1.5">
                      <Link to={`/console/buyer/${b.buyerId}`} className="font-semibold text-white hover:text-deal-300">{b.name}</Link>
                      <div className="text-[10px] text-white/35">{b.why}</div>
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono font-bold tabular-nums text-deal-300">{b.probabilityPct}%</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/80">{fmtUsdShort(b.expectedValueUsd)}</td>
                    <td className="px-2 py-1.5 text-white/65">{b.contactPath}</td>
                    <td className={`px-3 py-1.5 text-right font-semibold ${CONF_STYLE[b.confidence]}`}>{b.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ))}
      </Frame>

      <p className="px-1 text-[10px] text-white/40">
        Contact paths and confidence come from each buyer's <Link to="/console/buyer-graph" className="text-deal-300 hover:text-deal-200">contact intelligence</Link>; probabilities and expected value from the buyer graph and valuation framework. ExitOS surfaces the path — it does not store or send to personal contacts.
      </p>
    </div>
  );
};

export default OutreachPlan;

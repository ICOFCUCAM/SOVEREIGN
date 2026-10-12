import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Section, Metric, ScrollRegion, Provenance } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { runInstitutionalValuation } from "@exit/engines";
import { loadActiveCompany, activeTokens } from "../lib/active-company";
import { buildOutreachPlan } from "../lib/outreach-plan";
import { fmtUsdShort, DNA_AS_OF } from "../lib/buyer-dna";
import { RegistryTape } from "../components/xo/RegistryTape";

// BUYER OUTREACH PLAN — the banker's targeted program: ~20 qualified buyers
// for one company, sequenced into waves that build competitive tension, each
// with its contact path and expected value. The action layer on top of the
// intelligence.

// A neutral assumption, named in words (as on the Terminal).
const PriorTag: React.FC = () => (
  <span className="ml-1 align-middle font-sans text-[9px] font-semibold uppercase tracking-wide text-xo-caution" title="Not disclosed by this buyer — a labelled neutral assumption">prior</span>
);

const CONF_STYLE: Record<string, string> = {
  High: "text-xo-verified", Medium: "text-xo-caution", Low: "text-xo-muted",
};

const OutreachPlan: React.FC = () => {
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const baseline = useMemo(() => runInstitutionalValuation(company).financialBaseline.mid, [company]);
  const tokens = useMemo(() => activeTokens(company), [company]);
  const plan = useMemo(() => buildOutreachPlan(baseline, tokens, 20), [baseline, tokens]);
  const tape = useMemo(() => buildMarketTape(), []);
  const all = plan.waves.flatMap((w) => w.buyers);
  const priors = all.filter((b) => !b.premiumKnown || !b.closeKnown).length;
  const noOverlap = all.filter((b) => b.sectorOverlapPts === 0).length;

  return (
    <div data-page="outreach-plan" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Exchange · Execution · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`} title="Buyer Outreach Plan"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Suggested plan · nothing sent</span></>}
        description={<>{plan.summary} This is a suggested plan: ExitOS has not contacted any of these buyers, and nothing is sent or scheduled. Week labels are suggested timing from the day you start. {fromIntake ? `Built for ${company.name} from your saved intake.` : `Built for the demo company (${company.name}); save an intake to build it for your company.`}</>} />

      <section aria-label="Plan summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Ranked buyers" emphasis value={String(plan.totalBuyers)} sub="top 20 by likelihood score" /></div>
        <div className="bg-xo-panel"><Metric label="Suggested waves" value={String(plan.waves.length)} sub="to build competitive tension" /></div>
        <div className="bg-xo-panel"><Metric label="Lead wave" value={String(plan.waves[0]?.buyers.length ?? 0)} sub="buyers · suggested week 1" /></div>
        <div className="bg-xo-panel"><Metric label="Lead buyer · close-weighted" emphasis value={<>{fmtUsdShort(plan.waves[0]?.buyers[0]?.expectedValueUsd ?? 0)}{plan.waves[0]?.buyers[0] && (!plan.waves[0].buyers[0].premiumKnown || !plan.waves[0].buyers[0].closeKnown) && <PriorTag />}</>} sub={`${plan.waves[0]?.buyers[0]?.name ?? "—"} · expected offer × close rate`} /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <p role="note" className="border border-xo-line bg-xo-panel px-4 py-2.5 text-[12px] text-xo-muted">
        Buyers are ranked by <span className="font-semibold text-xo-text">likelihood score</span> — a composite of acquisition appetite, sector overlap with {company.name}, deal cadence and recency (0–100), not a probability.
        {" "}Close-weighted value = financial baseline {fmtUsdShort(baseline)} × (1 + the buyer's premium) × its close rate — the Terminal's rule. <span className="font-semibold text-xo-caution">PRIOR</span> marks {priors} of {all.length} buyers that have not disclosed a premium or close rate, so a neutral assumption (premium 20%, close rate 55%) is used.
        {noOverlap > 0 && <> <span className="font-semibold text-xo-caution">{noOverlap} of {all.length}</span> have no sector overlap with this company and rank on appetite, cadence and recency alone.</>}
      </p>

      {plan.waves.map((w) => (
        <Section key={w.tier} title={`Wave ${w.tier} · ${w.label}`} className="border border-xo-line"
          right={<span className="text-[11px] text-xo-muted">Suggested {w.timing.toLowerCase()} · {w.buyers.length} buyers</span>}
          foot={w.rationale}>
          <ScrollRegion label={`Wave ${w.tier} buyers`}>
            <table className="w-full min-w-[640px] text-[12px]">
              <thead className="text-left text-[11px] text-xo-muted">
                <tr className="border-b border-xo-line">
                  <th scope="col" className="px-4 py-2 font-medium">Buyer</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Likelihood score</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Close-weighted value</th>
                  <th scope="col" className="px-2 py-2 font-medium">Typical contact role</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Contact confidence</th>
                </tr>
              </thead>
              <tbody>
                {w.buyers.map((b) => (
                  <tr key={b.buyerId} className="border-b border-xo-line last:border-0">
                    <th scope="row" className="px-4 py-2 text-left font-normal">
                      <Link to={`/console/buyer/${b.buyerId}`} className="font-semibold text-xo-text hover:text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{b.name}</Link>
                      <div className="text-[11px] text-xo-faint">{b.why}{b.sectorOverlapPts === 0 && <span className="text-xo-caution"> · no sector overlap</span>}</div>
                    </th>
                    <td className="px-2 py-2 text-right font-mono font-semibold tabular-nums">{b.probabilityPct}<span className="text-[11px] font-normal text-xo-muted">/100</span></td>
                    <td className="px-2 py-2 text-right font-mono tabular-nums">{fmtUsdShort(b.expectedValueUsd)}{(!b.premiumKnown || !b.closeKnown) && <PriorTag />}</td>
                    <td className="px-2 py-2 text-xo-muted">{b.contactPath}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${CONF_STYLE[b.confidence]}`}>{b.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>
      ))}

      <p className="px-1 text-[11px] text-xo-faint">
        Contact role and confidence come from each buyer's <Link to="/console/buyer-graph" className="font-medium text-xo-action underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">contact intelligence</Link>: the role is the one typical for the buyer type, never a named person; confidence is a rule on the buyer's indexed deals — High at 40 or more, Medium at 8 or more, otherwise Low — and most indexed deals are unverified registry entries. Likelihood scores and close-weighted values come from the buyer graph and valuation framework. ExitOS does not store or send to personal contacts.
      </p>
    </div>
  );
};

export default OutreachPlan;

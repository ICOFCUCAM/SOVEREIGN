import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { buildBuyerIntelReport, type BuyerIntelReport } from "../lib/report-docs";
import { ReportFrame, Cover, Contents, Section, Exhibit, StatGrid, Stat, Lead, Note } from "../lib/report-ui";
import { BuyerRankingChart, BuyerUniverse } from "../lib/report-charts";

const SECTIONS = ["Executive Summary", "Acquirer Scorecards", "Buyer Universe", "Methodology & Provenance"];

const ReportBuyers: React.FC = () => {
  const { company } = useMemo(() => loadActiveCompany(), []);
  const r: BuyerIntelReport = useMemo(() => buildBuyerIntelReport(company), [company]);

  return (
    <ReportFrame docType={r.meta.title} company={company.name} frameworkVersion={r.meta.frameworkVersion}>
      <Cover docType={r.meta.title} company={company.name} preparedFor={r.meta.preparedFor} preparedBy={r.meta.preparedBy} date={r.meta.date} frameworkVersion={r.meta.frameworkVersion} />
      <Contents items={SECTIONS} />

      <Section n={1} title="Executive Summary">
        <StatGrid cols={4}>
          <Stat label="Qualified Acquirers" value={String(r.summary.qualified)} hero />
          <Stat label="Universe Scored" value={String(r.summary.scored)} />
          <Stat label="Top Probability" value={`${r.summary.topProbability}%`} />
          <Stat label="Median Comp Premium" value={r.summary.medianPremium} />
        </StatGrid>
        <Lead>
          {r.summary.qualified} of {r.summary.scored} scored acquirers qualify for {company.name}. Each scorecard that follows
          is built from the buyer's measured acquisition history — appetite, cadence, sector overlap, check size and close
          behaviour — not from a contact list.
        </Lead>
      </Section>

      <Section n={2} title="Acquirer Scorecards">
        <div className="space-y-4">
          {r.scorecards.map((b, i) => (
            <div key={b.buyerId} className="avoid-break rounded-sm border border-[#d8dee8]">
              <div className="flex items-baseline justify-between border-b border-[#e3e8ef] bg-[#fafbfc] px-4 py-2.5">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[12px] text-[#9aa3b0]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[15px] font-bold text-[#0b1220]">{b.name}</span>
                  <span className="text-[10px] uppercase tracking-wide text-[#5b6675]">{b.type}</span>
                  <a href={`/report/buyer/${b.buyerId}`} target="_blank" rel="noopener noreferrer" className="no-print text-[10px] font-semibold uppercase tracking-wide text-[#0e7a4f] hover:underline">Briefing →</a>
                </div>
                <div className="text-right">
                  <span className="tnum font-mono text-[20px] font-bold text-[#0e7a4f]">{b.probabilityPct}%</span>
                  <span className="ml-1 text-[10px] uppercase tracking-wide text-[#9aa3b0]">probability</span>
                </div>
              </div>
              <p className="border-b border-[#f0f2f6] px-4 py-2.5 text-[12px] leading-relaxed text-[#2b3543]">{b.thesis}</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 px-4 py-3 sm:grid-cols-4">
                {([
                  ["Expected value", b.expectedValue], ["Typical check", b.typicalCheck],
                  ["Median close", b.medianCloseDays], ["Activity", b.activity],
                  ["Strategic fit", `${b.strategicFitPct}%`], ["Recent acquisition", b.recentAcquisition],
                  ["Confidence", b.confidence],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9aa3b0]">{k}</div>
                    <div className="tnum mt-0.5 font-mono text-[12.5px] font-medium text-[#0b1220]">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section n={3} title="Buyer Universe">
        <Exhibit n="III-A" title="Acquirer ranking — fit-adjusted probability">
          <BuyerRankingChart buyers={r.scorecards.map((b) => ({ name: b.name, probabilityPct: b.probabilityPct }))} />
        </Exhibit>
        <Exhibit n="III-B" title="Universe distribution by acquirer type">
          <BuyerUniverse strategic={r.universe.strategic} financial={r.universe.financial} sovereign={r.universe.sovereign} familyOffice={r.universe.family_office} />
          <Note>{r.universe.qualified} qualified of {r.universe.scored} scored, from a registry of {r.universe.registry} indexed acquirers.</Note>
        </Exhibit>
      </Section>

      <Section n={4} title="Methodology & Provenance">
        <Lead>
          Acquisition probability is the product of four measured factors: acquisition appetite (cadence and recency of deals),
          sector overlap (the acquirer's stated and revealed sector preferences against the company's), deal velocity, and the
          recency of activity. Expected value is the close-weighted band from the acquirer's premium and close-rate history.
        </Lead>
        <Note>
          Every figure derives from the indexed acquisition registry (Wikipedia · Wikidata · SEC EDGAR) and the ExitOS buyer
          DNA engine. ExitOS surfaces acquisition paths and decision-maker roles, never stored personal contact data.
        </Note>
      </Section>
    </ReportFrame>
  );
};

export default ReportBuyers;

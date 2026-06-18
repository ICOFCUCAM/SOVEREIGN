import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { buildReadinessReport, type ReadinessReport } from "../lib/report-docs";
import { ReportFrame, Cover, Contents, Section, Exhibit, BankTable, StatGrid, Stat, Lead, Note } from "../lib/report-ui";
import { ValuationBridge } from "../lib/report-charts";

const SECTIONS = ["Executive Summary", "Value Impact", "Readiness Scorecard", "Recommended Actions"];

const SEV: Record<string, string> = { high: "text-[#b4453a]", medium: "text-[#b8902f]", low: "text-[#0e7a4f]" };

const ReportReadiness: React.FC = () => {
  const { company } = useMemo(() => loadActiveCompany(), []);
  const r: ReadinessReport = useMemo(() => buildReadinessReport(company), [company]);
  const cur = r.summary.currentValue, pot = r.summary.potentialValue;

  return (
    <ReportFrame docType={r.meta.title} company={company.name} frameworkVersion={r.meta.frameworkVersion}>
      <Cover docType={r.meta.title} company={company.name} preparedFor={r.meta.preparedFor} preparedBy={r.meta.preparedBy} date={r.meta.date} frameworkVersion={r.meta.frameworkVersion} />
      <Contents items={SECTIONS} />

      <Section n={1} title="Executive Summary">
        <StatGrid cols={5}>
          <Stat label="Readiness" value={`${r.summary.score}/100`} hero sub={r.summary.band} />
          <Stat label="Current Value" value={cur} />
          <Stat label="Potential Value" value={pot} />
          <Stat label="Value Uplift" value={`+${r.summary.uplift}`} />
          <Stat label="Upside" value={`+${r.summary.upliftPct}%`} sub="if gaps close" />
        </StatGrid>
        <Lead>
          {company.name} scores <strong className="text-[#0b1220]">{r.summary.score}/100</strong> on acquisition readiness
          ({r.summary.band}). Closing the gaps below would lift the strategic-buyer value from {cur} to{" "}
          <strong>{pot}</strong> — an unclaimed <strong>+{r.summary.uplift}</strong> ({r.summary.upliftPct}%).
        </Lead>
      </Section>

      <Section n={2} title="Value Impact">
        <Exhibit n="II-A" title="Readiness value bridge">
          <ValuationBridge baseline={r.summary.currentUsd} premiumUsd={r.summary.upliftUsd} final={r.summary.potentialUsd} />
        </Exhibit>
        <Note>Current strategic value, the priced uplift from closing readiness gaps, and the projected value at full readiness.</Note>
      </Section>

      <Section n={3} title="Readiness Scorecard">
        <Lead>The factors a buyer underwrites, ranked by the value at stake in each.</Lead>
        <Exhibit n="III-A" title="Readiness gaps, by value impact">
          <BankTable
            columns={[{ key: "d", label: "Dimension" }, { key: "s", label: "Severity", align: "center" }, { key: "w", label: "Gap" }, { key: "e", label: "Effort", align: "center" }, { key: "i", label: "Value impact", align: "right" }]}
            rows={r.categories.map((c) => ({
              d: c.dimension,
              s: <span className={`font-semibold uppercase ${SEV[c.severity] ?? "text-[#5b6675]"}`}>{c.severity}</span>,
              w: c.weakness,
              e: c.effort,
              i: <span className="text-[#0e7a4f]">+{c.impact}</span>,
            }))}
          />
        </Exhibit>
      </Section>

      <Section n={4} title="Recommended Actions">
        <ol className="space-y-3">
          {r.categories.map((c, i) => (
            <li key={c.dimension} className="avoid-break border-l-2 border-[#0e7a4f] pl-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold text-[#0b1220]">{i + 1}. {c.dimension}</span>
                <span className="tnum font-mono text-[12.5px] font-semibold text-[#0e7a4f]">+{c.impact}</span>
              </div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-[#5b6675]">{c.recommendation} <span className="text-[#9aa3b0]">· {c.effort}</span></p>
            </li>
          ))}
          {r.categories.length === 0 && <li className="text-[12.5px] text-[#9aa3b0]">No material readiness gaps identified.</li>}
        </ol>
      </Section>
    </ReportFrame>
  );
};

export default ReportReadiness;

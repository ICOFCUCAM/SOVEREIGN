import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { buildDiligenceReport, type DiligenceReportModel } from "../lib/report-docs";
import { ReportFrame, Cover, Contents, ListOfExhibits, Section, Exhibit, BankTable, StatGrid, Stat, Lead, Note } from "../lib/report-ui";

const SECTIONS = [
  "Executive Summary", "Findings Register", "Buyer's View", "Seller Remediation",
  "Red Flags", "Valuation Impact", "Legal Exposure", "Methodology & Provenance",
];

const SEV: Record<string, string> = { high: "text-[#b4453a]", medium: "text-[#b8902f]", low: "text-[#0e7a4f]" };

const ReportDiligence: React.FC = () => {
  const { company } = useMemo(() => loadActiveCompany(), []);
  const r: DiligenceReportModel = useMemo(() => buildDiligenceReport(company), [company]);
  const find = (k: string): DiligenceReportModel["reports"][number] | undefined => r.reports.find((x) => x.key === k);
  const redflag = find("redflag"), valuation = find("valuation"), legal = find("legal"), buyer = find("buyer"), seller = find("seller");

  return (
    <ReportFrame docType={r.meta.title} company={company.name} frameworkVersion={r.meta.frameworkVersion}>
      <Cover docType="Due-Diligence Report" company={company.name} preparedFor="Board of Directors" preparedBy={r.meta.preparedBy} date={r.meta.date} frameworkVersion={r.meta.frameworkVersion} />
      <Contents items={SECTIONS} />
      <ListOfExhibits items={[
        { n: "II-A", title: "Findings register, by value at stake" },
        { n: "VI-A", title: "Valuation impact by finding" },
        { n: "VIII-A", title: "Source documents reviewed" },
      ]} />

      <Section n={1} title="Executive Summary">
        <StatGrid cols={4}>
          <Stat label="Findings" value={String(r.summary.findings)} hero />
          <Stat label="High-Severity" value={String(r.summary.high)} sub="gating items" />
          <Stat label="Value at Stake" value={r.summary.totalImpact} />
          <Stat label="Deal Readiness" value={`${r.summary.readinessPct}%`} />
        </StatGrid>
        <Lead>
          A pre-market diligence scan of {company.name} surfaced <strong className="text-[#0b1220]">{r.summary.findings} findings</strong>{" "}
          ({r.summary.high} high-severity, {r.summary.medium} medium, {r.summary.low} low), carrying{" "}
          <strong>{r.summary.totalImpact}</strong> of value a buyer's analyst could otherwise extract in diligence. Resolving the
          gating items first lifts deal readiness from its current {r.summary.readinessPct}%.
        </Lead>
      </Section>

      <Section n={2} title="Findings Register">
        <Lead>Every finding a buyer's analyst would surface, ranked by the value at stake.</Lead>
        <Exhibit n="II-A" title="Findings register, by value at stake" source="ExitOS diligence engine">
          <BankTable
            columns={[
              { key: "c", label: "Category" }, { key: "f", label: "Finding" }, { key: "s", label: "Severity", align: "center" },
              { key: "src", label: "Source" }, { key: "i", label: "Value at stake", align: "right" },
            ]}
            rows={r.findings.map((f) => ({
              c: f.category,
              f: f.title,
              s: <span className={`font-semibold uppercase ${SEV[f.severity] ?? ""}`}>{f.severity}</span>,
              src: f.source,
              i: <span className="text-[#0e7a4f]">{f.impact}</span>,
            }))}
            footnote={`${r.summary.findings} findings · ${r.summary.totalImpact} aggregate value at stake.`}
          />
        </Exhibit>
      </Section>

      <Section n={3} title="Buyer's View">
        <Lead>{buyer?.headline}</Lead>
        <ul className="space-y-2.5">
          {(buyer?.points ?? []).map((p, i) => (
            <li key={i} className="avoid-break flex gap-2 text-[13px] leading-relaxed text-[#2b3543]"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#b4453a]" /><span><strong className="text-[#0b1220]">{p.title}.</strong> {p.body}</span></li>
          ))}
        </ul>
        {buyer && <Note>{buyer.recommendation}</Note>}
      </Section>

      <Section n={4} title="Seller Remediation">
        <Lead>{seller?.headline}</Lead>
        <ul className="space-y-2.5">
          {(seller?.points ?? []).map((p, i) => (
            <li key={i} className="avoid-break flex gap-2 text-[13px] leading-relaxed text-[#2b3543]"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#0e7a4f]" /><span><strong className="text-[#0b1220]">{p.title}.</strong> {p.body}</span></li>
          ))}
        </ul>
        {seller && <Note>{seller.recommendation}</Note>}
      </Section>

      <Section n={5} title="Red Flags">
        <Lead>{redflag?.headline}</Lead>
        <BankTable
          columns={[{ key: "t", label: "Red flag" }, { key: "b", label: "What a buyer infers" }]}
          rows={(redflag?.points ?? []).map((p) => ({ t: p.title, b: p.body }))}
        />
        {redflag && <Note>{redflag.recommendation}</Note>}
      </Section>

      <Section n={6} title="Valuation Impact">
        <Exhibit n="VI-A" title="Valuation impact by finding" source="ExitOS diligence engine">
          <BankTable
            columns={[{ key: "c", label: "Category" }, { key: "f", label: "Finding" }, { key: "i", label: "Value at stake", align: "right" }]}
            rows={r.findings.slice(0, 8).map((f) => ({ c: f.category, f: f.title, i: <span className="text-[#0e7a4f]">{f.impact}</span> }))}
            footnote={valuation?.recommendation}
          />
        </Exhibit>
      </Section>

      <Section n={7} title="Legal Exposure">
        <Lead>{legal?.headline}</Lead>
        <BankTable
          columns={[{ key: "t", label: "Exposure" }, { key: "a", label: "Pre-market action" }]}
          rows={(legal?.points ?? []).map((p) => ({ t: p.title, a: p.body }))}
        />
        {legal && <Note>{legal.recommendation}</Note>}
      </Section>

      <Section n={8} title="Methodology & Provenance">
        <Lead>Findings are derived from the uploaded document set; each is mapped to the source that surfaced it.</Lead>
        <Exhibit n="VIII-A" title="Source documents reviewed">
          <BankTable
            columns={[{ key: "s", label: "Document set" }, { key: "n", label: "Detail" }, { key: "c", label: "Findings", align: "right" }]}
            rows={r.sources.map((s) => ({ s: s.label, n: s.note, c: String(s.count) }))}
          />
        </Exhibit>
        <Note>Every finding traces to a source document and carries an estimated valuation impact from the ExitOS diligence engine. Nothing is asserted without a source.</Note>
      </Section>
    </ReportFrame>
  );
};

export default ReportDiligence;

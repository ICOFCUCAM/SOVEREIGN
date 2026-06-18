import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { buildBoardMemo, type BoardMemo } from "../lib/report-docs";
import { ReportFrame, Cover, Contents, Section, Exhibit, BankTable, Lead, Note } from "../lib/report-ui";

const SECTIONS = ["Recommendation", "Decision Summary", "Investment Highlights", "Risk Factors", "Approval"];

const ReportBoard: React.FC = () => {
  const { company } = useMemo(() => loadActiveCompany(), []);
  const r: BoardMemo = useMemo(() => buildBoardMemo(company), [company]);

  return (
    <ReportFrame docType={r.meta.title} company={company.name} frameworkVersion={r.meta.frameworkVersion}>
      <Cover docType={r.meta.title} company={company.name} preparedFor="Board of Directors" preparedBy={r.meta.preparedBy} date={r.meta.date} frameworkVersion={r.meta.frameworkVersion} />
      <Contents items={SECTIONS} />

      <Section n={1} title="Recommendation">
        <div className="rounded-sm border-l-4 border-[#0e7a4f] bg-[#f6faf8] p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0e7a4f]">Resolved</div>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#0b1220]">{r.recommendation}</p>
        </div>
        <Note>This memorandum is submitted for the Board's consideration and approval. Figures are derived from the ExitOS Valuation Framework and source-referenced market data.</Note>
      </Section>

      <Section n={2} title="Decision Summary">
        <Exhibit n="II-A" title="Transaction parameters">
          <BankTable columns={[{ key: "k", label: "Parameter" }, { key: "v", label: "Detail", align: "right" }]} rows={r.decision.map((d) => ({ k: d.k, v: d.v }))} />
        </Exhibit>
      </Section>

      <Section n={3} title="Investment Highlights">
        <ol className="space-y-3">
          {r.highlights.map((h, i) => (
            <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-[#2b3543]">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-[#0e7a4f]/10 font-mono text-[11px] font-bold text-[#0e7a4f]">{i + 1}</span>
              <span>{h}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section n={4} title="Risk Factors">
        <Lead>The factors most likely to be probed in diligence, with the value at stake in each.</Lead>
        <BankTable
          columns={[{ key: "d", label: "Risk factor" }, { key: "i", label: "Value at stake", align: "right" }]}
          rows={r.risks.map((rk) => ({ d: rk.dimension, i: <span className="text-[#0e7a4f]">{rk.impact}</span> }))}
        />
      </Section>

      <Section n={5} title="Approval">
        <Lead>The Board's approval is requested to proceed with the recommended process.</Lead>
        <div className="mt-8 grid grid-cols-2 gap-x-12 gap-y-12">
          {["Chair of the Board", "Chief Executive Officer", "Chief Financial Officer", "Lead Independent Director"].map((role) => (
            <div key={role}>
              <div className="h-10 border-b border-[#0b1220]" />
              <div className="mt-2 text-[12px] font-semibold text-[#0b1220]">{role}</div>
              <div className="text-[10px] uppercase tracking-wide text-[#9aa3b0]">Signature · Date</div>
            </div>
          ))}
        </div>
      </Section>
    </ReportFrame>
  );
};

export default ReportBoard;

import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { buildMarketReport } from "../lib/report-docs";
import { fmtUsd } from "../lib/market-intel";
import { ReportFrame, Cover, Contents, ListOfExhibits, Section, Exhibit, BankTable, Lead } from "../lib/report-ui";
import { useMemorandum } from "../lib/engines";
import { memorandumInputs } from "../lib/documents/memorandum-inputs";
import { DEFAULT_PROCESS_TIMELINE, weeksLabel } from "@exit/engines";

// The CIM's print view. Its sections and text are the engine CIM's — the same
// document the Document Generator downloads and Dispatch renders — with the
// engine's tables and two exhibits (market data, the process timeline). There is
// one CIM, and it states no price.
const heading = (h: string): string => h.replace(/^\d+[.)]\s+/, "");

const ReportCIM: React.FC = () => {
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const inputs = useMemo(() => memorandumInputs(company, fromIntake), [company, fromIntake]);
  const doc = useMemorandum("cim", inputs);
  const mk = useMemo(() => buildMarketReport(company), [company]);
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // The CIM goes to buyers: it carries no valuation, price guidance or buyer
  // targeting — those stay in the valuation report and board materials.
  const exhibitsFor = (title: string): React.ReactNode => {
    if (/^market/i.test(title)) return (
      <Exhibit n="A" title="Sector acquisition indexes (ExitOS market data)">
        <BankTable columns={[{ key: "s", label: "Sector" }, { key: "v", label: "Volume", align: "right" }, { key: "t", label: "12m trend", align: "right" }, { key: "b", label: "Active buyers", align: "right" }, { key: "m", label: "Median deal", align: "right" }]}
          rows={mk.indexes.slice(0, 8).map((i) => ({ s: <span className="capitalize">{i.sector}</span>, v: i.volume.toLocaleString(), t: i.trendPct == null ? "—" : `${i.trendPct >= 0 ? "+" : ""}${Math.round(i.trendPct * 100)}%`, b: String(i.activeBuyers), m: i.medianDealUsd != null ? fmtUsd(i.medianDealUsd) : "—" }))} />
      </Exhibit>);
    if (/process|timing/i.test(title)) return (
      <Exhibit n="B" title="Process timeline (planning assumption)">
        <BankTable columns={[{ key: "w", label: "When" }, { key: "m", label: "Milestone" }, { key: "d", label: "What happens" }]}
          rows={DEFAULT_PROCESS_TIMELINE.milestones.map((m) => ({ w: weeksLabel(m), m: m.label, d: m.description }))} />
      </Exhibit>);
    return null;
  };

  const titles = doc ? doc.sections.map((s) => heading(s.heading)) : [];
  return (
    <ReportFrame docType="Confidential Information Memorandum" company={company.name}>
      <Cover docType="Confidential Information Memorandum" company={company.name} preparedFor="Prospective Acquirers (under NDA)" preparedBy="ExitOS Advisory" date={date} />
      <Contents items={titles} />
      <ListOfExhibits items={[{ n: "A", title: "Sector acquisition indexes" }, { n: "B", title: "Process timeline" }]} />
      {!doc && <p className="px-2 py-6 text-[12px] text-[#5b6675]">Composing the memorandum…</p>}
      {doc?.sections.map((s, i) => (
        <Section key={s.heading} n={i + 1} title={heading(s.heading)}>
          <Lead>{s.body}</Lead>
          {s.bullets && s.bullets.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] leading-relaxed text-[#1f2a37]">{s.bullets.map((x) => <li key={x}>{x}</li>)}</ul>}
          {/* the engine's own tables: the same content Dispatch renders */}
          {(s.tables ?? []).map((t, k) => (
            <div key={k} className="mt-3">
              {t.caption && <div className="mb-1 text-[11px] font-semibold text-[#5b6675]">{t.caption}</div>}
              <BankTable columns={t.headers.map((h, c) => ({ key: `c${c}`, label: h || " " }))}
                rows={t.rows.map((r) => Object.fromEntries(t.headers.map((_, c) => [`c${c}`, r[c] ?? ""])))} />
            </div>
          ))}
          {exhibitsFor(heading(s.heading))}
        </Section>
      ))}
    </ReportFrame>
  );
};

export default ReportCIM;

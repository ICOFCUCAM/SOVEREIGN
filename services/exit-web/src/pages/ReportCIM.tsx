import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { buildValuationReport } from "../lib/report-model";
import { buildBuyerIntelReport, buildMarketReport } from "../lib/report-docs";
import { fmtMoney } from "../lib/ui";
import { fmtUsd } from "../lib/market-intel";
import { ReportFrame, Cover, Contents, ListOfExhibits, Section, Exhibit, BankTable, Lead, Note } from "../lib/report-ui";
import { FootballField, ValuationBridge, BuyerRankingChart, BuyerUniverse } from "../lib/report-charts";
import { useMemorandum } from "../lib/engines";
import { memorandumInputs } from "../lib/documents/memorandum-inputs";
import { DEFAULT_PROCESS_TIMELINE, weeksLabel } from "@exit/engines";

const pct = (x: number | null | undefined): string => (x == null ? "—" : `${Math.round(x * 100)}%`);

// The CIM's print view. Its sections and text are the engine CIM's — the same
// document the Document Generator downloads and Dispatch renders — with the
// report's exhibits attached to the section they illustrate. There is one CIM.
const heading = (h: string): string => h.replace(/^\d+[.)]\s+/, "");

const ReportCIM: React.FC = () => {
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const inputs = useMemo(() => memorandumInputs(company, fromIntake), [company, fromIntake]);
  const doc = useMemorandum("cim", inputs);
  const v = useMemo(() => buildValuationReport(company), [company]);
  const b = useMemo(() => buildBuyerIntelReport(company), [company]);
  const mk = useMemo(() => buildMarketReport(company), [company]);

  // exhibits for the engine section they illustrate
  const exhibitsFor = (title: string): React.ReactNode => {
    if (/financial/i.test(title)) return (
      <Exhibit n="A" title="Headline financials">
        <BankTable columns={[{ key: "k", label: "Metric" }, { key: "v", label: "Value", align: "right" }]}
          rows={[
            { k: "Annual recurring revenue", v: fmtMoney(v.overview.arrUsd) },
            { k: "Trailing twelve-month revenue", v: fmtMoney(v.overview.ttmUsd) },
            { k: "Revenue growth (YoY)", v: pct(v.overview.growthPct) },
            { k: "Gross margin", v: pct(v.overview.grossMarginPct) },
            { k: "EBITDA margin", v: pct(v.overview.ebitdaPct) },
          ]} />
      </Exhibit>);
    if (/^market/i.test(title)) return (
      <Exhibit n="B" title="Sector acquisition indexes">
        <BankTable columns={[{ key: "s", label: "Sector" }, { key: "v", label: "Volume", align: "right" }, { key: "t", label: "12m trend", align: "right" }, { key: "b", label: "Active buyers", align: "right" }, { key: "m", label: "Median deal", align: "right" }]}
          rows={mk.indexes.slice(0, 8).map((i) => ({ s: <span className="capitalize">{i.sector}</span>, v: i.volume.toLocaleString(), t: i.trendPct == null ? "—" : `${i.trendPct >= 0 ? "+" : ""}${Math.round(i.trendPct * 100)}%`, b: String(i.activeBuyers), m: i.medianDealUsd != null ? fmtUsd(i.medianDealUsd) : "—" }))} />
      </Exhibit>);
    if (/valuation/i.test(title)) return (<>
      <Exhibit n="C" title="Valuation football field">
        <FootballField methods={v.methodologies.map((mt) => ({ label: mt.name, low: mt.band.low, mid: mt.band.mid, high: mt.band.high }))} finalLow={v.exec.evLow} finalMid={v.exec.evMid} finalHigh={v.exec.evHigh} />
      </Exhibit>
      <Exhibit n="D" title="Valuation bridge">
        <ValuationBridge baseline={v.exec.baselineMid} premiumUsd={v.premiumUsd} final={v.exec.evMid} />
      </Exhibit></>);
    if (/buyer/i.test(title)) return (<>
      <Exhibit n="E" title="Acquirer ranking">
        <BuyerRankingChart buyers={b.scorecards.map((s) => ({ name: s.name, probabilityPct: s.probabilityPct }))} />
      </Exhibit>
      <Exhibit n="F" title="Universe distribution">
        <BuyerUniverse strategic={b.universe.strategic} financial={b.universe.financial} sovereign={b.universe.sovereign} familyOffice={b.universe.family_office} />
      </Exhibit></>);
    if (/process|timing/i.test(title)) return (
      <Exhibit n="G" title="Process timeline (planning assumption)">
        <BankTable columns={[{ key: "w", label: "When" }, { key: "m", label: "Milestone" }, { key: "d", label: "What happens" }]}
          rows={DEFAULT_PROCESS_TIMELINE.milestones.map((m) => ({ w: weeksLabel(m), m: m.label, d: m.description }))} />
      </Exhibit>);
    return null;
  };

  const titles = doc ? doc.sections.map((s) => heading(s.heading)) : [];
  return (
    <ReportFrame docType="Confidential Information Memorandum" company={company.name} frameworkVersion={v.meta.frameworkVersion}>
      <Cover docType="Confidential Information Memorandum" company={company.name} preparedFor="Prospective Acquirers (under NDA)" preparedBy={v.meta.preparedBy} date={v.meta.date} frameworkVersion={v.meta.frameworkVersion} />
      <Contents items={[...titles, "Confidentiality & Provenance"]} />
      <ListOfExhibits items={[
        { n: "A", title: "Headline financials" }, { n: "B", title: "Sector acquisition indexes" },
        { n: "C", title: "Valuation football field" }, { n: "D", title: "Valuation bridge" },
        { n: "E", title: "Acquirer ranking" }, { n: "F", title: "Universe distribution" },
        { n: "G", title: "Process timeline" },
      ]} />
      {!doc && <p className="px-2 py-6 text-[12px] text-[#5b6675]">Composing the memorandum…</p>}
      {doc?.sections.map((s, i) => (
        <Section key={s.heading} n={i + 1} title={heading(s.heading)}>
          <Lead>{s.body}</Lead>
          {s.bullets && s.bullets.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] leading-relaxed text-[#1f2a37]">{s.bullets.map((x) => <li key={x}>{x}</li>)}</ul>}
          {exhibitsFor(heading(s.heading))}
        </Section>
      ))}
      <Section n={(doc?.sections.length ?? 0) + 1} title="Confidentiality & Provenance">
        <p className="text-[11.5px] leading-relaxed text-[#5b6675]">
          This Confidential Information Memorandum is furnished solely to enable the recipient to evaluate a possible
          transaction with {company.name} and is subject to the terms of an executed non-disclosure agreement. It may not be
          reproduced or distributed. The information herein is derived from the ExitOS Valuation Framework and source-referenced
          market data; recipients must conduct their own due diligence. Process dates are a planning assumption.
        </p>
        <Note>{v.disclaimer}</Note>
      </Section>
    </ReportFrame>
  );
};

export default ReportCIM;

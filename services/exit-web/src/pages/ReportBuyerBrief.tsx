import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { loadActiveCompany } from "../lib/active-company";
import { buildBuyerBriefing, type BuyerBriefing } from "../lib/report-docs";
import { ReportFrame, Cover, Contents, Section, Exhibit, BankTable, StatGrid, Stat, Lead, Note } from "../lib/report-ui";
import { ConfidenceDrivers } from "../lib/report-charts";

const SECTIONS = [
  "Executive Summary", "Acquisition Thesis", "Probability Assessment",
  "Acquirer Profile", "Demonstrated Pattern", "Acquisition Signals", "Provenance",
];

const ReportBuyerBrief: React.FC = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { company } = useMemo(() => loadActiveCompany(), []);
  const r: BuyerBriefing = useMemo(() => buildBuyerBriefing(company, id), [company, id]);

  return (
    <ReportFrame docType="Buyer Briefing Book" company={r.header.name} frameworkVersion={r.meta.frameworkVersion}>
      <Cover docType={`Buyer Briefing Book · ${company.name}`} company={r.header.name} preparedFor={r.meta.preparedFor} preparedBy={r.meta.preparedBy} date={r.meta.date} frameworkVersion={r.meta.frameworkVersion} />
      <Contents items={SECTIONS} />

      <Section n={1} title="Executive Summary">
        <StatGrid cols={5}>
          <Stat label="Acquisition Probability" value={`${r.summary.probabilityPct}%`} hero />
          <Stat label="Expected Value" value={r.summary.expectedValue} />
          <Stat label="Appetite" value={`${r.summary.appetiteScore}/100`} sub={r.summary.appetiteTier} />
          <Stat label="Strategic Fit" value={`${r.summary.strategicFitPct}%`} />
          <Stat label="Confidence" value={r.header.confidence} />
        </StatGrid>
        <Lead>
          <strong className="text-[#0b1220]">{r.header.name}</strong> ({r.header.type}
          {r.header.country !== "—" ? `, ${r.header.country}` : ""}) is assessed at a{" "}
          <strong>{r.summary.probabilityPct}%</strong> probability of acquiring {company.name}, with an expected
          transaction value of <strong>{r.summary.expectedValue}</strong>. {r.thesis}
        </Lead>
      </Section>

      <Section n={2} title="Acquisition Thesis">
        <Lead>{r.thesis}</Lead>
        {r.rationale.length > 0 ? (
          <ol className="space-y-3">
            {r.rationale.map((pt, i) => (
              <li key={i} className="avoid-break flex gap-3 text-[13px] leading-relaxed text-[#2b3543]">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-[#0e7a4f]/10 font-mono text-[11px] font-bold text-[#0e7a4f]">{i + 1}</span>
                <span><strong className="text-[#0b1220]">{pt.label}.</strong> {pt.detail}</span>
              </li>
            ))}
          </ol>
        ) : (
          <Note>No evidence-backed rationale points are available for this acquirer at the current registry coverage.</Note>
        )}
      </Section>

      <Section n={3} title="Probability Assessment">
        <Lead>
          Acquisition probability is a transparent composite of four measured signals. Each bar shows this acquirer's
          contribution as a share of the maximum that factor can contribute.
        </Lead>
        <Exhibit n="III-A" title="Probability drivers">
          <ConfidenceDrivers drivers={r.probabilityDrivers} />
        </Exhibit>
        <Note>Drivers: acquisition appetite (cadence and recency), sector overlap with {company.name}, deal velocity, and recency of activity. No factor is modelled — each is a measured DNA quantity.</Note>
      </Section>

      <Section n={4} title="Acquirer Profile">
        <Exhibit n="IV-A" title="Indexed acquisition profile">
          <BankTable
            columns={[{ key: "k", label: "Attribute" }, { key: "v", label: "Detail", align: "right" }]}
            rows={r.profile.map((p) => ({ k: p.k, v: p.v }))}
            footnote="Disclosed figures are drawn from the indexed registry; “undisclosed” denotes no figure on the public record — never an estimate."
          />
        </Exhibit>
      </Section>

      <Section n={5} title="Demonstrated Pattern">
        <Lead>Similar acquisitions this buyer has made, from the indexed sector-transaction registry.</Lead>
        <Exhibit n="V-A" title="Comparable acquisitions by this buyer">
          <BankTable
            columns={[{ key: "t", label: "Target" }, { key: "i", label: "Industry" }, { key: "d", label: "Date", align: "right" }, { key: "v", label: "Value", align: "right" }]}
            rows={r.similar.map((s) => ({ t: s.target, i: <span className="capitalize">{s.industry}</span>, d: s.date, v: s.value }))}
          />
        </Exhibit>
      </Section>

      <Section n={6} title="Acquisition Signals">
        <Lead>Behavioural indicators derived from the registry. External feeds, where not yet connected, are listed honestly as pending rather than asserted.</Lead>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {r.signals.map((s, i) => (
            <div key={i} className="avoid-break flex items-start justify-between gap-3 rounded-sm border border-[#e3e8ef] px-3.5 py-2.5">
              <div>
                <div className="text-[12.5px] font-semibold text-[#0b1220]">{s.label}</div>
                <div className="text-[11px] text-[#5b6675]">{s.detail}</div>
              </div>
              <span className={`shrink-0 rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                s.status === "Active" ? "bg-[#0e7a4f]/10 text-[#0e7a4f]"
                : s.status === "Feed pending" ? "bg-[#9aa3b0]/12 text-[#9aa3b0]"
                : "bg-[#b4453a]/10 text-[#b4453a]"
              }`}>{s.status}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section n={7} title="Provenance">
        <Lead>
          Every figure in this briefing derives from the indexed acquisition registry (Wikipedia · Wikidata · SEC EDGAR) and
          the ExitOS buyer DNA engine. Acquisition probability, expected value and appetite are computed by the engine, not
          asserted here.
        </Lead>
        <Note>ExitOS surfaces acquisition paths and decision-maker roles, never stored personal contact data. This document is furnished to {company.name}'s board under the ExitOS engagement and may not be reproduced or distributed.</Note>
      </Section>
    </ReportFrame>
  );
};

export default ReportBuyerBrief;

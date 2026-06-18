import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { buildMarketReport, type MarketReport } from "../lib/report-docs";
import { fmtUsd } from "../lib/market-intel";
import { ReportFrame, Cover, Contents, Section, Exhibit, BankTable, StatGrid, Stat, Lead, Note } from "../lib/report-ui";

const SECTIONS = ["Executive Summary", "Sector Indexes", "Most Active Acquirers", "Methodology & Provenance"];

const ReportMarket: React.FC = () => {
  const { company } = useMemo(() => loadActiveCompany(), []);
  const r: MarketReport = useMemo(() => buildMarketReport(company), [company]);

  return (
    <ReportFrame docType={r.meta.title} company={r.meta.company} frameworkVersion={r.meta.frameworkVersion}>
      <Cover docType={r.meta.title} company={r.meta.company} preparedFor="Investment Committee" preparedBy={r.meta.preparedBy} date={r.meta.date} frameworkVersion={r.meta.frameworkVersion} classification="Confidential" />
      <Contents items={SECTIONS} />

      <Section n={1} title="Executive Summary">
        <StatGrid cols={4}>
          <Stat label="Indexed Acquisitions" value={r.summary.events} hero />
          <Stat label="Disclosed Value" value={r.summary.disclosed} />
          <Stat label="Acquirers Indexed" value={r.summary.buyers} />
          <Stat label="Active Sectors" value={String(r.summary.sectors)} />
        </StatGrid>
        <Lead>
          Acquisition activity aggregated from the verified registry. {r.summary.events} indexed transactions across{" "}
          {r.summary.sectors} sectors, {r.summary.disclosed} in disclosed value, against {r.summary.buyers} indexed acquirers.
        </Lead>
      </Section>

      <Section n={2} title="Sector Indexes">
        <Exhibit n="II-A" title="Acquisition indexes by sector">
          <BankTable
            columns={[{ key: "s", label: "Sector" }, { key: "v", label: "Volume", align: "right" }, { key: "t", label: "12m trend", align: "right" }, { key: "b", label: "Active buyers", align: "right" }, { key: "m", label: "Median deal", align: "right" }]}
            rows={r.indexes.map((i) => ({
              s: <span className="capitalize">{i.sector}</span>,
              v: i.volume.toLocaleString(),
              t: i.trendPct == null ? "—" : <span className={i.trendPct >= 0 ? "text-[#0e7a4f]" : "text-[#b4453a]"}>{i.trendPct >= 0 ? "+" : ""}{Math.round(i.trendPct * 100)}%</span>,
              b: String(i.activeBuyers),
              m: i.medianDealUsd != null ? fmtUsd(i.medianDealUsd) : "—",
            }))}
          />
        </Exhibit>
      </Section>

      <Section n={3} title="Most Active Acquirers">
        <Exhibit n="III-A" title="Top acquirers by indexed deal count">
          <BankTable
            columns={[{ key: "n", label: "Acquirer" }, { key: "d", label: "Total deals", align: "right" }, { key: "r", label: "Last 3 years", align: "right" }]}
            rows={r.acquirers.map((a) => ({ n: a.name, d: String(a.deals), r: `${a.recentDeals}` }))}
          />
        </Exhibit>
      </Section>

      <Section n={4} title="Methodology & Provenance">
        <Lead>
          Volume counts indexed acquisitions mapped to the ExitOS sector taxonomy; the 12-month trend compares the trailing
          twelve months against the prior twelve; median deal size is computed from disclosed values only.
        </Lead>
        <Note>Every figure aggregates source-tagged acquisition events (Wikipedia · Wikidata · SEC EDGAR). Nothing is modelled or estimated.</Note>
      </Section>
    </ReportFrame>
  );
};

export default ReportMarket;

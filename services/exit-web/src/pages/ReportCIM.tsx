import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { buildValuationReport } from "../lib/report-model";
import { buildBuyerIntelReport, buildMarketReport } from "../lib/report-docs";
import { fmtMoney } from "../lib/ui";
import { fmtUsd } from "../lib/market-intel";
import { ReportFrame, Cover, Contents, Section, Exhibit, BankTable, StatGrid, Stat, Lead, Note } from "../lib/report-ui";
import { FootballField, ValuationBridge, BuyerRankingChart, BuyerUniverse, TransactionTimeline } from "../lib/report-charts";

const pct = (x: number | null | undefined): string => (x == null ? "—" : `${Math.round(x * 100)}%`);
const short = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);

const SECTIONS = [
  "Executive Summary", "Company Overview", "Financial Summary", "Market Opportunity",
  "Valuation Analysis", "Strategic Buyer Universe", "Indicative Process", "Confidentiality & Provenance",
];

const ReportCIM: React.FC = () => {
  const { company } = useMemo(() => loadActiveCompany(), []);
  const v = useMemo(() => buildValuationReport(company), [company]);
  const b = useMemo(() => buildBuyerIntelReport(company), [company]);
  const mk = useMemo(() => buildMarketReport(company), [company]);

  return (
    <ReportFrame docType="Confidential Information Memorandum" company={company.name} frameworkVersion={v.meta.frameworkVersion}>
      <Cover docType="Confidential Information Memorandum" company={company.name} preparedFor="Prospective Acquirers (under NDA)" preparedBy={v.meta.preparedBy} date={v.meta.date} frameworkVersion={v.meta.frameworkVersion} />
      <Contents items={SECTIONS} />

      <Section n={1} title="Executive Summary">
        <StatGrid cols={4}>
          <Stat label="Enterprise Value" value={fmtMoney(v.exec.evMid)} hero />
          <Stat label="Valuation Range" value={`${short(v.exec.evLow)}–${short(v.exec.evHigh)}`} />
          <Stat label="ARR" value={short(v.overview.arrUsd)} sub={`${pct(v.overview.growthPct)} growth`} />
          <Stat label="Qualified Buyers" value={String(v.exec.qualifiedBuyers)} />
        </StatGrid>
        <Lead>
          {company.name} is a {v.overview.sector.toLowerCase()} business with {short(v.overview.arrUsd)} of annual recurring
          revenue growing {pct(v.overview.growthPct)} year-on-year at a {pct(v.overview.grossMarginPct)} gross margin. On a
          strategic-buyer basis its enterprise value is <strong className="text-[#0b1220]">{fmtMoney(v.exec.evMid)}</strong>{" "}
          ({fmtMoney(v.exec.evLow)}–{fmtMoney(v.exec.evHigh)}). This memorandum is furnished to prospective acquirers under an
          executed non-disclosure agreement.
        </Lead>
      </Section>

      <Section n={2} title="Company Overview">
        <BankTable
          columns={[{ key: "k", label: "Attribute" }, { key: "v", label: "Detail", align: "right" }]}
          rows={[
            { k: "Sector", v: v.overview.sector },
            { k: "Annual recurring revenue", v: fmtMoney(v.overview.arrUsd) },
            { k: "Revenue growth (YoY)", v: pct(v.overview.growthPct) },
            { k: "Customers", v: v.overview.customers != null ? v.overview.customers.toLocaleString() : "—" },
            { k: "Net revenue retention", v: v.overview.netRetentionPct != null ? pct(v.overview.netRetentionPct) : "—" },
          ]}
        />
      </Section>

      <Section n={3} title="Financial Summary">
        <Exhibit n="III-A" title="Headline financials">
          <BankTable
            columns={[{ key: "k", label: "Metric" }, { key: "v", label: "Value", align: "right" }]}
            rows={[
              { k: "Annual recurring revenue", v: fmtMoney(v.overview.arrUsd) },
              { k: "Trailing twelve-month revenue", v: fmtMoney(v.overview.ttmUsd) },
              { k: "Revenue growth (YoY)", v: pct(v.overview.growthPct) },
              { k: "Gross margin", v: pct(v.overview.grossMarginPct) },
              { k: "EBITDA margin", v: pct(v.overview.ebitdaPct) },
            ]}
          />
        </Exhibit>
      </Section>

      <Section n={4} title="Market Opportunity">
        <Lead>Acquisition activity in the company's and adjacent sectors, from the verified registry.</Lead>
        <Exhibit n="IV-A" title="Sector acquisition indexes">
          <BankTable
            columns={[{ key: "s", label: "Sector" }, { key: "v", label: "Volume", align: "right" }, { key: "t", label: "12m trend", align: "right" }, { key: "b", label: "Active buyers", align: "right" }, { key: "m", label: "Median deal", align: "right" }]}
            rows={mk.indexes.slice(0, 8).map((i) => ({ s: <span className="capitalize">{i.sector}</span>, v: i.volume.toLocaleString(), t: i.trendPct == null ? "—" : `${i.trendPct >= 0 ? "+" : ""}${Math.round(i.trendPct * 100)}%`, b: String(i.activeBuyers), m: i.medianDealUsd != null ? fmtUsd(i.medianDealUsd) : "—" }))}
          />
        </Exhibit>
      </Section>

      <Section n={5} title="Valuation Analysis">
        <Exhibit n="V-A" title="Valuation football field">
          <FootballField methods={v.methodologies.map((mt) => ({ label: mt.name, low: mt.band.low, mid: mt.band.mid, high: mt.band.high }))} finalLow={v.exec.evLow} finalMid={v.exec.evMid} finalHigh={v.exec.evHigh} />
        </Exhibit>
        <Exhibit n="V-B" title="Valuation bridge">
          <ValuationBridge baseline={v.exec.baselineMid} premiumUsd={v.premiumUsd} final={v.exec.evMid} />
        </Exhibit>
      </Section>

      <Section n={6} title="Strategic Buyer Universe">
        <Exhibit n="VI-A" title="Acquirer ranking">
          <BuyerRankingChart buyers={b.scorecards.map((s) => ({ name: s.name, probabilityPct: s.probabilityPct }))} />
        </Exhibit>
        <Exhibit n="VI-B" title="Universe distribution">
          <BuyerUniverse strategic={b.universe.strategic} financial={b.universe.financial} sovereign={b.universe.sovereign} familyOffice={b.universe.family_office} />
        </Exhibit>
      </Section>

      <Section n={7} title="Indicative Process">
        <Lead>An indicative path to close of {v.exec.closeLowDays}–{v.exec.closeHighDays} days.</Lead>
        <Exhibit n="VII-A" title="Transaction timeline">
          <TransactionTimeline closeHighDays={v.exec.closeHighDays} />
        </Exhibit>
      </Section>

      <Section n={8} title="Confidentiality & Provenance">
        <p className="text-[11.5px] leading-relaxed text-[#5b6675]">
          This Confidential Information Memorandum is furnished solely to enable the recipient to evaluate a possible
          transaction with {company.name} and is subject to the terms of an executed non-disclosure agreement. It may not be
          reproduced or distributed. The information herein is derived from the ExitOS Valuation Framework and source-referenced
          market data; recipients must conduct their own due diligence.
        </p>
        <Note>{v.disclaimer}</Note>
      </Section>
    </ReportFrame>
  );
};

export default ReportCIM;

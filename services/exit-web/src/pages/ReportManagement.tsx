import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { buildValuationReport } from "../lib/report-model";
import { buildBuyerIntelReport, buildMarketReport, buildReadinessReport } from "../lib/report-docs";
import { fmtMoney } from "../lib/ui";
import { fmtUsd } from "../lib/market-intel";
import { ReportFrame, Cover, Contents, ListOfExhibits, Section, Exhibit, BankTable, StatGrid, Stat, Lead, Note } from "../lib/report-ui";
import { FootballField, BuyerRankingChart, BuyerUniverse, ValuationBridge, TransactionTimeline } from "../lib/report-charts";

const pct = (x: number | null | undefined): string => (x == null ? "—" : `${Math.round(x * 100)}%`);
const short = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);

const SECTIONS = [
  "The Opportunity", "Company at a Glance", "Financial Highlights", "Market Opportunity",
  "Investment Highlights", "Valuation Summary", "Buyer Landscape", "Value Creation",
  "Process & Timeline", "The Ask",
];

const ReportManagement: React.FC = () => {
  const { company } = useMemo(() => loadActiveCompany(), []);
  const v = useMemo(() => buildValuationReport(company), [company]);
  const b = useMemo(() => buildBuyerIntelReport(company), [company]);
  const mk = useMemo(() => buildMarketReport(company), [company]);
  const rd = useMemo(() => buildReadinessReport(company), [company]);

  return (
    <ReportFrame docType="Management Presentation" company={company.name} frameworkVersion={v.meta.frameworkVersion}>
      <Cover docType="Management Presentation" company={company.name} preparedFor="Prospective Acquirers & Investment Committee" preparedBy={v.meta.preparedBy} date={v.meta.date} frameworkVersion={v.meta.frameworkVersion} />
      <Contents items={SECTIONS} />
      <ListOfExhibits items={[
        { n: "III-A", title: "Headline financials" },
        { n: "IV-A", title: "Sector acquisition indexes" },
        { n: "VI-A", title: "Valuation football field" },
        { n: "VII-A", title: "Acquirer ranking" },
        { n: "VII-B", title: "Universe distribution" },
        { n: "VIII-A", title: "Value creation bridge" },
        { n: "IX-A", title: "Transaction timeline" },
      ]} />

      <Section n={1} title="The Opportunity">
        <StatGrid cols={4}>
          <Stat label="Enterprise Value" value={fmtMoney(v.exec.evMid)} hero />
          <Stat label="Range" value={`${short(v.exec.evLow)}–${short(v.exec.evHigh)}`} />
          <Stat label="Qualified Buyers" value={String(v.exec.qualifiedBuyers)} />
          <Stat label="Strategic Premium" value={`+${pct(v.exec.appliedPremiumPct)}`} />
        </StatGrid>
        <Lead>{v.exec.thesis}</Lead>
      </Section>

      <Section n={2} title="Company at a Glance">
        <BankTable
          columns={[{ key: "k", label: "Attribute" }, { key: "v", label: "Detail", align: "right" }]}
          rows={[
            { k: "Sector", v: v.overview.sector },
            { k: "Annual recurring revenue", v: fmtMoney(v.overview.arrUsd) },
            { k: "Revenue growth (YoY)", v: pct(v.overview.growthPct) },
            { k: "Gross margin", v: pct(v.overview.grossMarginPct) },
            { k: "Customers", v: v.overview.customers != null ? v.overview.customers.toLocaleString() : "—" },
            { k: "Net revenue retention", v: v.overview.netRetentionPct != null ? pct(v.overview.netRetentionPct) : "—" },
          ]}
        />
      </Section>

      <Section n={3} title="Financial Highlights">
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
        <Lead>Acquisition activity across the company's and adjacent sectors, from the verified registry.</Lead>
        <Exhibit n="IV-A" title="Sector acquisition indexes">
          <BankTable
            columns={[{ key: "s", label: "Sector" }, { key: "v", label: "Volume", align: "right" }, { key: "t", label: "12m trend", align: "right" }, { key: "b", label: "Active buyers", align: "right" }, { key: "m", label: "Median deal", align: "right" }]}
            rows={mk.indexes.slice(0, 8).map((i) => ({ s: <span className="capitalize">{i.sector}</span>, v: i.volume.toLocaleString(), t: i.trendPct == null ? "—" : `${i.trendPct >= 0 ? "+" : ""}${Math.round(i.trendPct * 100)}%`, b: String(i.activeBuyers), m: i.medianDealUsd != null ? fmtUsd(i.medianDealUsd) : "—" }))}
          />
        </Exhibit>
      </Section>

      <Section n={5} title="Investment Highlights">
        <ol className="space-y-3">
          {v.highlights.map((h, i) => (
            <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-[#2b3543]">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-[#0e7a4f]/10 font-mono text-[11px] font-bold text-[#0e7a4f]">{i + 1}</span>
              <span>{h}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section n={6} title="Valuation Summary">
        <Exhibit n="VI-A" title="Valuation football field">
          <FootballField methods={v.methodologies.map((mt) => ({ label: mt.name, low: mt.band.low, mid: mt.band.mid, high: mt.band.high }))} finalLow={v.exec.evLow} finalMid={v.exec.evMid} finalHigh={v.exec.evHigh} />
        </Exhibit>
      </Section>

      <Section n={7} title="Buyer Landscape">
        <Exhibit n="VII-A" title="Acquirer ranking">
          <BuyerRankingChart buyers={b.scorecards.map((s) => ({ name: s.name, probabilityPct: s.probabilityPct }))} />
        </Exhibit>
        <Exhibit n="VII-B" title="Universe distribution">
          <BuyerUniverse strategic={b.universe.strategic} financial={b.universe.financial} sovereign={b.universe.sovereign} familyOffice={b.universe.family_office} />
        </Exhibit>
      </Section>

      <Section n={8} title="Value Creation">
        <Lead>
          {company.name} scores <strong className="text-[#0b1220]">{rd.summary.score}/100</strong> on acquisition readiness.
          Closing the identified gaps would lift strategic value from {rd.summary.currentValue} to {rd.summary.potentialValue}.
        </Lead>
        <Exhibit n="VIII-A" title="Value creation bridge">
          <ValuationBridge baseline={rd.summary.currentUsd} premiumUsd={rd.summary.upliftUsd} final={rd.summary.potentialUsd} />
        </Exhibit>
      </Section>

      <Section n={9} title="Process & Timeline">
        <Lead>An indicative path to close of {v.exec.closeLowDays}–{v.exec.closeHighDays} days.</Lead>
        <Exhibit n="IX-A" title="Transaction timeline">
          <TransactionTimeline closeHighDays={v.exec.closeHighDays} />
        </Exhibit>
      </Section>

      <Section n={10} title="The Ask">
        <div className="rounded-sm border-l-4 border-[#0e7a4f] bg-[#f6faf8] p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0e7a4f]">Invitation</div>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#0b1220]">
            Qualified acquirers are invited to execute a non-disclosure agreement and enter the data room toward an indicative
            offer at or above {fmtMoney(v.exec.evMid)}.
          </p>
        </div>
        <Note>{v.disclaimer}</Note>
      </Section>
    </ReportFrame>
  );
};

export default ReportManagement;

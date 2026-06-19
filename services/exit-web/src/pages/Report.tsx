import React, { useMemo } from "react";
import { loadActiveCompany } from "../lib/active-company";
import { buildValuationReport, type ValuationReportModel } from "../lib/report-model";
import { fmtMoney } from "../lib/ui";
import {
  ReportFrame, Cover, Contents, ListOfExhibits, ExhibitRef, Section, Exhibit, BankTable, StatGrid, Stat, Lead, Note,
} from "../lib/report-ui";
import {
  FootballField, ValuationBridge, BuyerRankingChart, BuyerUniverse, ConfidenceDrivers, TransactionTimeline,
} from "../lib/report-charts";

// THE INSTITUTIONAL VALUATION REPORT — composed from the report model with the
// shared publishing layer. Board-level acquisition memorandum: cover, twelve
// numbered sections, lettered exhibits, banking tables, vector charts.

const pct = (x: number | null | undefined, d = 0): string => (x == null ? "—" : `${(x * 100).toFixed(d)}%`);
const m$ = (n: number): string => fmtMoney(n);
const short = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);

const SECTIONS = [
  "Executive Summary", "Investment Highlights", "Transaction Overview", "Valuation Analysis",
  "Comparable Transactions", "Buyer Intelligence", "Strategic Rationale", "Confidence Assessment",
  "Data Provenance", "Framework Compliance", "Legal Notices", "Appendices",
];

const EXHIBITS = [
  { n: "IV-A", title: "Valuation football field" },
  { n: "IV-B", title: "Valuation bridge — baseline to concluded value" },
  { n: "IV-C", title: "Methodology weighting" },
  { n: "IV-D", title: "Premium sensitivity" },
  { n: "V-A", title: "Precedent transaction matrix" },
  { n: "VI-A", title: "Strategic acquirer ranking — fit-adjusted probability" },
  { n: "VI-B", title: "Buyer universe distribution" },
  { n: "VII-A", title: "Indicative path to close" },
  { n: "VIII-A", title: "Confidence drivers" },
  { n: "VIII-B", title: "Risk factors and value at stake" },
  { n: "IX-A", title: "Figures by source" },
  { n: "XII-A", title: "Valuation variables and sources" },
];

const Report: React.FC = () => {
  const { company } = useMemo(() => loadActiveCompany(), []);
  const r: ValuationReportModel = useMemo(() => buildValuationReport(company), [company]);

  return (
    <ReportFrame docType={r.meta.title} company={r.meta.company} frameworkVersion={r.meta.frameworkVersion}>
      <Cover docType={r.meta.title} company={r.meta.company} preparedFor={r.meta.preparedFor} preparedBy={r.meta.preparedBy} date={r.meta.date} frameworkVersion={r.meta.frameworkVersion} />
      <Contents items={SECTIONS} />
      <ListOfExhibits items={EXHIBITS} />

      {/* I · EXECUTIVE SUMMARY */}
      <Section n={1} title="Executive Summary">
        <StatGrid cols={5}>
          <Stat label="Enterprise Value" value={m$(r.exec.evMid)} hero />
          <Stat label="Valuation Range" value={`${short(r.exec.evLow)}–${short(r.exec.evHigh)}`} />
          <Stat label="Confidence" value={`${r.exec.confidencePct}%`} sub={r.exec.confidenceTier} />
          <Stat label="Qualified Buyers" value={String(r.exec.qualifiedBuyers)} sub={`of ${r.exec.scoredBuyers} scored`} />
          <Stat label="Expected Close" value={`${r.exec.closeLowDays}–${r.exec.closeHighDays}d`} />
          <Stat label="Strategic Premium" value={`+${pct(r.exec.appliedPremiumPct)}`} sub={r.exec.medianPremiumPct != null ? `${pct(r.exec.medianPremiumPct)} median comp` : "evidence-based"} />
          <Stat label="Comparables" value={String(r.exec.comparablesUsed)} sub="source-referenced" />
          <Stat label="Acquisition Readiness" value={`${r.exec.readinessScore}/100`} />
          <Stat label="Most Likely Buyer" value={r.exec.leadBuyer ?? "—"} sub={r.exec.leadProbabilityPct != null ? `${r.exec.leadProbabilityPct}% probability` : undefined} />
          <Stat label="Valuation Uplift" value={`+${short(r.exec.upliftUsd)}`} sub="if readiness gaps close" />
        </StatGrid>
        <p className="mt-6 text-[13.5px] leading-relaxed text-[#2b3543]">
          On a strategic-buyer basis, {r.meta.company} carries an enterprise value of{" "}
          <strong className="text-[#0b1220]">{m$(r.exec.evMid)}</strong> (range {m$(r.exec.evLow)}–{m$(r.exec.evHigh)}). The
          midpoint is the financial baseline of <strong>{m$(r.exec.baselineMid)}</strong> uplifted by an evidence-based
          strategic premium of <strong>+{pct(r.exec.appliedPremiumPct)}</strong> — the mean of {r.premium.observedPremiums.length} observed
          precedent transactions, not a flat assumption. {r.exec.leadBuyer ? <>The most probable acquirer is <strong>{r.exec.leadBuyer}</strong> ({r.exec.leadProbabilityPct}%).</> : null}
        </p>
        <Note>{r.exec.thesis}</Note>
      </Section>

      {/* II · INVESTMENT HIGHLIGHTS */}
      <Section n={2} title="Investment Highlights">
        <ol className="space-y-3">
          {r.highlights.map((h, i) => (
            <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-[#2b3543]">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-[#0e7a4f]/10 font-mono text-[11px] font-bold text-[#0e7a4f]">{i + 1}</span>
              <span>{h}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* III · TRANSACTION OVERVIEW */}
      <Section n={3} title="Transaction Overview">
        <Lead>This report presents an institutional view of the enterprise value of {r.meta.company} on a strategic-buyer basis, the qualified acquirer universe, and an indicative path to a transaction.</Lead>
        <BankTable
          columns={[{ key: "k", label: "Parameter" }, { key: "v", label: "Detail", align: "right" }]}
          emphasizeFirst
          rows={[
            { k: "Company", v: r.meta.company },
            { k: "Sector", v: r.overview.sector },
            { k: "Annual recurring revenue", v: m$(r.overview.arrUsd) },
            { k: "Trailing twelve-month revenue", v: m$(r.overview.ttmUsd) },
            { k: "Revenue growth (YoY)", v: pct(r.overview.growthPct) },
            { k: "Gross margin", v: pct(r.overview.grossMarginPct) },
            { k: "EBITDA margin", v: pct(r.overview.ebitdaPct) },
            { k: "Net revenue retention", v: r.overview.netRetentionPct != null ? pct(r.overview.netRetentionPct) : "—" },
            { k: "Basis of value", v: "Strategic-buyer enterprise value" },
            { k: "Expected time to close", v: `${r.exec.closeLowDays}–${r.exec.closeHighDays} days` },
          ]}
        />
      </Section>

      {/* IV · VALUATION ANALYSIS */}
      <Section n={4} title="Valuation Analysis">
        <Lead>Enterprise value is triangulated across the methodologies below (<ExhibitRef n="IV-C" />), each derived from reported figures and source-referenced market data, then weighted to a single institutional view. The concluded range and the premium that drives it are set out in <ExhibitRef n="IV-A" /> and <ExhibitRef n="IV-B" />.</Lead>
        <Exhibit n="IV-A" title="Valuation football field" source="ExitOS Valuation Framework">
          <FootballField
            methods={r.methodologies.map((mt) => ({ label: mt.name, low: mt.band.low, mid: mt.band.mid, high: mt.band.high }))}
            finalLow={r.exec.evLow} finalMid={r.exec.evMid} finalHigh={r.exec.evHigh}
          />
        </Exhibit>
        <Exhibit n="IV-B" title="Valuation bridge — baseline to concluded value">
          <ValuationBridge baseline={r.exec.baselineMid} premiumUsd={r.premiumUsd} final={r.exec.evMid} />
        </Exhibit>
        <Exhibit n="IV-C" title="Methodology weighting">
          <BankTable
            columns={[{ key: "m", label: "Methodology" }, { key: "b", label: "Basis" }, { key: "w", label: "Weight", align: "right" }, { key: "v", label: "Midpoint", align: "right" }]}
            rows={r.methodologies.map((mt) => ({ m: mt.name, b: mt.basis, w: `${mt.weightPct}%`, v: m$(mt.band.mid) }))}
          />
        </Exhibit>
        <Exhibit n="IV-D" title="Premium sensitivity" source="ExitOS Valuation Framework — observed-premium band">
          <BankTable
            columns={[{ key: "p", label: "Applied premium" }, { key: "v", label: "Enterprise value", align: "right" }, { key: "d", label: "Δ vs. concluded", align: "right" }]}
            rows={r.sensitivity.map((s) => ({
              p: `+${pct(s.premiumPct)}`,
              v: m$(s.evUsd),
              d: <span className={s.delta === 0 ? "text-[#5b6675]" : s.delta > 0 ? "text-[#0e7a4f]" : "text-[#b4453a]"}>{s.delta === 0 ? "— concluded" : `${s.delta > 0 ? "+" : ""}${short(s.delta)}`}</span>,
            }))}
            footnote="Enterprise value across the observed-premium range — the financial baseline uplifted by the precedent-transaction band, not a hypothetical sweep."
          />
        </Exhibit>
      </Section>

      {/* V · COMPARABLE TRANSACTIONS */}
      <Section n={5} title="Comparable Transactions">
        <Lead>Precedent transactions in the sector, with disclosed premiums where available (<ExhibitRef n="V-A" />). The applied premium is anchored to this set.</Lead>
        <Exhibit n="V-A" title="Precedent transaction matrix" source={r.comparablesAnalysis.note}>
          <BankTable
            columns={[{ key: "t", label: "Target" }, { key: "a", label: "Acquirer" }, { key: "d", label: "Date", align: "right" }, { key: "p", label: "Premium", align: "right" }, { key: "v", label: "Value", align: "right" }]}
            rows={r.comparables.map((c) => ({ t: c.target, a: c.buyer, d: c.date ?? "—", p: c.premiumPct != null ? `+${pct(c.premiumPct)}` : "—", v: c.priceUsd != null ? short(c.priceUsd) : "undisc." }))}
            footnote={`${r.comparablesAnalysis.count} transactions indexed${r.comparablesAnalysis.medianPremiumPct != null ? ` · ${pct(r.comparablesAnalysis.medianPremiumPct)} median premium` : ""}.`}
          />
        </Exhibit>
      </Section>

      {/* VI · BUYER INTELLIGENCE */}
      <Section n={6} title="Buyer Intelligence">
        <Lead>{r.buyerUniverse.qualified} of {r.buyerUniverse.scored} scored acquirers (registry of {r.buyerUniverse.registry}) qualify against the company's sector, scale and growth.</Lead>
        <Exhibit n="VI-A" title="Strategic acquirer ranking — fit-adjusted probability">
          <BuyerRankingChart buyers={r.mostLikelyBuyers.map((b) => ({ name: b.name, probabilityPct: b.probabilityPct, expectedDaysToCash: b.expectedDaysToCash }))} />
          <Note>Probability = acquisition appetite × sector overlap × deal velocity × recency. Expected days-to-cash from each acquirer's measured close history.</Note>
        </Exhibit>
        <Exhibit n="VI-B" title="Buyer universe distribution">
          <BuyerUniverse strategic={r.buyerUniverse.strategic} financial={r.buyerUniverse.financial} sovereign={r.buyerUniverse.sovereign} familyOffice={r.buyerUniverse.family_office} />
        </Exhibit>
      </Section>

      {/* VII · STRATEGIC RATIONALE */}
      <Section n={7} title="Strategic Rationale">
        <Lead>Why a strategic acquirer pays the premium.</Lead>
        <ul className="space-y-2.5">
          {r.strategicRationale.map((s) => (
            <li key={s} className="flex gap-2 text-[13px] leading-relaxed text-[#2b3543]"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#0e7a4f]" />{s}</li>
          ))}
        </ul>
        <Exhibit n="VII-A" title="Indicative path to close" source="Observed timelines, qualified acquirer set">
          <TransactionTimeline closeHighDays={r.exec.closeHighDays} />
        </Exhibit>
      </Section>

      {/* VIII · CONFIDENCE ASSESSMENT */}
      <Section n={8} title="Confidence Assessment">
        <Lead>Every figure in this report carries a composite confidence of <strong className="text-[#0b1220]">{r.exec.confidencePct}%</strong> ({r.exec.confidenceTier}), built from five measured drivers.</Lead>
        <Exhibit n="VIII-A" title="Confidence drivers">
          <ConfidenceDrivers drivers={r.confidenceDrivers} />
        </Exhibit>
        <Exhibit n="VIII-B" title="Risk factors and value at stake" source="ExitOS readiness analysis">
          <BankTable
            columns={[{ key: "d", label: "Risk factor" }, { key: "r", label: "Mitigant" }, { key: "e", label: "Effort", align: "center" }, { key: "i", label: "Value at stake", align: "right" }]}
            rows={r.risks.map((rk) => ({ d: rk.dimension, r: rk.recommendation, e: rk.effort, i: <span className="text-[#0e7a4f]">+{short(rk.impactUsd)}</span> }))}
            footnote="The factors a buyer is most likely to probe in diligence, each with the value a mitigant would protect or unlock."
          />
        </Exhibit>
      </Section>

      {/* IX · DATA PROVENANCE */}
      <Section n={9} title="Data Provenance">
        <Lead>Every figure traces to a source. {r.provenance.totalFigures} variables underpin the analysis{r.provenance.mostRecentDataDate ? `, most recent data as of ${r.provenance.mostRecentDataDate}` : ""}.</Lead>
        <Exhibit n="IX-A" title="Figures by source">
          <BankTable
            columns={[{ key: "s", label: "Source" }, { key: "n", label: "Figures", align: "right" }]}
            rows={Object.entries(r.provenance.bySource).map(([s, n]) => ({ s, n: String(n) }))}
            footnote={r.provenance.note}
          />
        </Exhibit>
      </Section>

      {/* X · FRAMEWORK COMPLIANCE */}
      <Section n={10} title="Framework Compliance">
        <Lead>The ten mandatory outputs of the ExitOS Valuation Framework, each present and sourced.</Lead>
        <BankTable
          columns={[{ key: "k", label: "Mandatory output" }, { key: "v", label: "Value", align: "right" }]}
          rows={r.compliance.map((c) => ({ k: c.label, v: c.value }))}
        />
      </Section>

      {/* XI · LEGAL NOTICES */}
      <Section n={11} title="Legal Notices">
        <p className="text-[11.5px] leading-relaxed text-[#5b6675]">{r.disclaimer}</p>
        <p className="mt-3 text-[11.5px] leading-relaxed text-[#5b6675]">
          This document is strictly private and confidential, prepared by ExitOS Advisory for the named recipient. It does not
          constitute an offer, a solicitation, investment advice, or a fairness opinion. Figures are estimates derived from the
          ExitOS Valuation Framework and source-referenced market data; actual transaction outcomes may differ materially.
          Recipients should conduct their own due diligence and seek independent professional advice.
        </p>
      </Section>

      {/* XII · APPENDICES */}
      <Section n={12} title="Appendices">
        <Exhibit n="XII-A" title="Valuation variables and sources">
          <BankTable
            columns={[{ key: "n", label: "Variable" }, { key: "v", label: "Value" }, { key: "s", label: "Source" }, { key: "c", label: "Confidence" }]}
            rows={[...r.variables.company, ...r.variables.market, ...r.variables.buyer].filter((v) => v.present).slice(0, 20)
              .map((v) => ({ n: v.name, v: v.value, s: `${v.source}${v.last_updated ? ` · ${v.last_updated}` : ""}`, c: v.confidence }))}
          />
        </Exhibit>
      </Section>
    </ReportFrame>
  );
};

export default Report;

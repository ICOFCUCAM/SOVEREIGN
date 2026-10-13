import React, { useMemo } from "react";
import { DEFAULT_PROCESS_TIMELINE, milestone, weeksLabel } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { buildMarketReport } from "../lib/report-docs";
import { fmtUsd } from "../lib/market-intel";
import { useMemorandum } from "../lib/engines";
import { memorandumInputs } from "../lib/documents/memorandum-inputs";
import { ReportFrame, Cover, Contents, ListOfExhibits, Section, Exhibit, BankTable, Lead, Note } from "../lib/report-ui";

// The management presentation's print view. It goes to buyers, so its content
// is the engine's investor deck — the buyer-safe deck the Document Generator
// produces — with two exhibits. It states no valuation, no price guidance, no
// buyer ranking and no readiness advice: those stay in the valuation report and
// board materials.
const title = (h: string): string => h.replace(/^Slide \d+ · /, "");

const ReportManagement: React.FC = () => {
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const inputs = useMemo(() => memorandumInputs(company, fromIntake), [company, fromIntake]);
  const deck = useMemorandum("investor_deck", inputs);
  const mk = useMemo(() => buildMarketReport(company), [company]);
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const slides = (deck?.sections ?? []).filter((s) => !/title|contact/i.test(s.heading));
  const ioi = weeksLabel(milestone(DEFAULT_PROCESS_TIMELINE, "ioi")).toLowerCase();

  return (
    <ReportFrame docType="Management Presentation" company={company.name}>
      <Cover docType="Management Presentation" company={company.name} preparedFor="Prospective Acquirers (under NDA)" preparedBy="ExitOS Advisory" date={date} />
      <Contents items={[...slides.map((s) => title(s.heading)), "Next Steps"]} />
      <ListOfExhibits items={[{ n: "A", title: "Sector acquisition indexes" }, { n: "B", title: "Process timeline" }]} />
      {!deck && <p className="px-2 py-6 text-[12px] text-[#5b6675]">Composing the presentation…</p>}
      {slides.map((s, i) => (
        <Section key={s.heading} n={i + 1} title={title(s.heading)}>
          <Lead>{s.body}</Lead>
          {s.bullets && s.bullets.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] leading-relaxed text-[#1f2a37]">{s.bullets.map((x) => <li key={x}>{x}</li>)}</ul>}
          {/opportunity|market/i.test(s.heading) && i === slides.findIndex((x) => /opportunity|market/i.test(x.heading)) && (
            <Exhibit n="A" title="Sector acquisition indexes (ExitOS market data)">
              <BankTable columns={[{ key: "s", label: "Sector" }, { key: "v", label: "Volume", align: "right" }, { key: "t", label: "12m trend", align: "right" }, { key: "m", label: "Median deal", align: "right" }]}
                rows={mk.indexes.slice(0, 8).map((x) => ({ s: <span className="capitalize">{x.sector}</span>, v: x.volume.toLocaleString(), t: x.trendPct == null ? "—" : `${x.trendPct >= 0 ? "+" : ""}${Math.round(x.trendPct * 100)}%`, m: x.medianDealUsd != null ? fmtUsd(x.medianDealUsd) : "—" }))} />
            </Exhibit>
          )}
          {/process/i.test(s.heading) && (
            <Exhibit n="B" title="Process timeline (planning assumption)">
              <BankTable columns={[{ key: "w", label: "When" }, { key: "m", label: "Milestone" }, { key: "d", label: "What happens" }]}
                rows={DEFAULT_PROCESS_TIMELINE.milestones.map((m) => ({ w: weeksLabel(m), m: m.label, d: m.description }))} />
            </Exhibit>
          )}
        </Section>
      ))}
      <Section n={slides.length + 1} title="Next Steps">
        <div className="rounded-sm border-l-4 border-[#0e7a4f] bg-[#f6faf8] p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0e7a4f]">Invitation</div>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#0b1220]">
            Parties who have signed the confidentiality agreement are invited to review the data room and submit a non-binding
            indication of interest in {ioi} of the process. All enquiries go through the process coordinator.
          </p>
        </div>
        <Note>Figures are supplied by the Company and unaudited. This presentation is not an offer; any transaction is governed only by a definitive agreement.</Note>
      </Section>
    </ReportFrame>
  );
};

export default ReportManagement;

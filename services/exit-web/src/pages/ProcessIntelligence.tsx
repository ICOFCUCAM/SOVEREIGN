import React, { useMemo } from "react";
import { DemoExample } from "../components/DemoExample";
import { loadActiveCompany } from "../lib/active-company";
import { Link } from "react-router-dom";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { PageHeader, Section, Metric, ScrollRegion, Provenance } from "../components/xo";
import { SAMPLE_COMPANY } from "../lib/profile";
import { buildMarketTape } from "../lib/market-tape";
import { BUYER_RESPONSES, PROCESS_FUNNEL } from "../lib/process-intel";

// PROCESS INTELLIGENCE — the buyer-response funnel (matched → NDA → LOI →
// close) with conversions and timings. Today it runs on the demo company's
// sample NDAs and offers; the page labels it as such.

const F = PROCESS_FUNNEL;
const stages: ReadonlyArray<{ label: string; n: number; note: string }> = [
  { label: "Matched", n: F.matched, note: "matched by the engine — not contacted" },
  { label: "NDA signed", n: F.ndaSigned, note: F.ndaConversionPct != null ? `${F.ndaConversionPct}% of matched` : "—" },
  { label: "LOI issued", n: F.loiIssued, note: F.loiConversionPct != null ? `${F.loiConversionPct}% of NDAs` : "—" },
  { label: "Closed", n: F.closed, note: "definitive" },
];

const ProcessIntelligenceDemo: React.FC = () => {
  const max = Math.max(F.matched, 1);
  const tape = useMemo(() => buildMarketTape(), []);
  return (
    <div data-page="process-intelligence" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Exchange · Execution" title="Process Intelligence"
        badge={<><Provenance kind="demo" /><span className="text-[12px] text-xo-muted">Buyer-response funnel</span></>}
        description={`Built from the demo company's sample NDAs and offers (${SAMPLE_COMPANY.name}) — no real process has run yet. Saved intakes hold no NDAs or offers.`} />

      <section aria-label="Process summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Median time to NDA" emphasis value={F.medianTimeToNdaDays != null ? `${F.medianTimeToNdaDays}d` : "—"} sub="from match → signed" /></div>
        <div className="bg-xo-panel"><Metric label="Median time to LOI" value={F.medianTimeToLoiDays != null ? `${F.medianTimeToLoiDays}d` : "—"} sub="from match → LOI" /></div>
        <div className="bg-xo-panel"><Metric label="NDA conversion" value={F.ndaConversionPct != null ? `${F.ndaConversionPct}%` : "—"} sub="matched → signed" /></div>
        <div className="bg-xo-panel"><Metric label="Walk-aways" value={String(F.walkedAway)} sub="declined / lapsed" /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Process funnel" className="lg:col-span-4">
          <ol className="space-y-3 px-4 py-3">
            {stages.map((s) => (
              <li key={s.label}>
                <div className="flex items-baseline justify-between gap-2 text-[12px]">
                  <span className="font-semibold">{s.label} <span className="font-normal text-xo-muted">· {s.note}</span></span>
                  <span className="font-mono tabular-nums">{s.n}</span>
                </div>
                <div aria-hidden className="mt-0.5 h-2 overflow-hidden rounded-full bg-xo-line"><div className="h-full rounded-full bg-xo-action" style={{ width: `${(s.n / max) * 100}%` }} /></div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Buyer response · this mandate" className="lg:col-span-8"
          foot="Derived from the sample NDA and offer records and their timestamps. Once real processes run on ExitOS, the same table will show measured response times per buyer.">
          <ScrollRegion label="Buyer response table">
            <table className="w-full min-w-[520px] text-[12px]">
              <thead className="text-left text-[11px] text-xo-faint">
                <tr className="border-b border-xo-line">
                  <th scope="col" className="px-3 py-2 font-medium">Buyer</th><th scope="col" className="px-2 py-2 font-medium">Stage</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">To NDA</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">To LOI</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">To close</th>
                </tr>
              </thead>
              <tbody>
                {BUYER_RESPONSES.map((b) => {
                  const stage = b.closed ? "Closed" : b.loiIssued ? "LOI" : b.walkedAway ? "Walked away" : b.ndaSigned ? "NDA signed" : "Matched";
                  const tone = b.closed ? "text-xo-verified" : b.walkedAway ? "text-xo-risk" : b.loiIssued ? "text-xo-caution" : "text-xo-muted";
                  return (
                    <tr key={b.buyerId} className="border-b border-xo-line last:border-0">
                      <th scope="row" className="px-3 py-1.5 text-left font-medium">{b.buyerName}</th>
                      <td className={`px-2 py-1.5 font-semibold ${tone}`}>{stage}</td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{b.timeToNdaDays != null ? `${b.timeToNdaDays}d` : "—"}</td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{b.timeToLoiDays != null ? `${b.timeToLoiDays}d` : "—"}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums text-xo-muted">{b.timeToCloseDays != null ? `${b.timeToCloseDays}d` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>
      </div>
    </div>
  );
};

// With a saved intake the founder's own records are shown (none yet), and the
// demo company's example only on request.
const ProcessIntelligence: React.FC = () => {
  const { fromIntake } = useMemo(() => loadActiveCompany(), []);
  return (
    <DemoExample fromIntake={fromIntake} page={{ id: "process-intel", eyebrow: "◉ Founder · Buyer funnel", title: "Process Intelligence" }}
      title="No process data recorded for your company" demo={<ProcessIntelligenceDemo />}>
      <>The funnel is built from NDAs and offers, and none are recorded for your company yet. Activity on your listing is in your <Link to="/console/inbox" className="font-medium text-xo-action underline">Inbox</Link>.</>
    </DemoExample>
  );
};

export default ProcessIntelligence;

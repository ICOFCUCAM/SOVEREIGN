import React from "react";
import { Panel, Frame, CommandHeader } from "../lib/workstation";
import { BUYER_RESPONSES, PROCESS_FUNNEL } from "../lib/process-intel";

// PROCESS INTELLIGENCE — buyer-response telemetry for the live mandate.
// Matched → NDA → LOI → Close, with observed conversions and timings, all
// derived from real process events. The moat that grows with every deal.

const F = PROCESS_FUNNEL;
const stages: ReadonlyArray<{ label: string; n: number; note: string }> = [
  { label: "Matched", n: F.matched, note: "qualified buyers engaged" },
  { label: "NDA signed", n: F.ndaSigned, note: F.ndaConversionPct != null ? `${F.ndaConversionPct}% of matched` : "—" },
  { label: "LOI issued", n: F.loiIssued, note: F.loiConversionPct != null ? `${F.loiConversionPct}% of NDAs` : "—" },
  { label: "Closed", n: F.closed, note: "definitive" },
];

const ProcessIntelligence: React.FC = () => {
  const max = Math.max(F.matched, 1);
  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Exchange · Execution"
        title="Process Intelligence"
        tag="Buyer-response moat"
        metrics={[
          { k: "Median time to NDA", v: F.medianTimeToNdaDays != null ? `${F.medianTimeToNdaDays}d` : "—", accent: true, sub: "first touch → signed" },
          { k: "Median time to LOI", v: F.medianTimeToLoiDays != null ? `${F.medianTimeToLoiDays}d` : "—", sub: "first touch → LOI" },
          { k: "NDA conversion", v: F.ndaConversionPct != null ? `${F.ndaConversionPct}%` : "—", accent: true, sub: "matched → signed" },
          { k: "Walk-aways", v: String(F.walkedAway), sub: "declined / lapsed" },
        ]}
      />


      <Frame>
        <Panel title="Process funnel" className="lg:col-span-4">
          <div className="space-y-3 p-3">
            {stages.map((s) => (
              <div key={s.label}>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-semibold text-white">{s.label} <span className="text-white/40">· {s.note}</span></span>
                  <span className="font-mono tabular-nums text-white/80">{s.n}</span>
                </div>
                <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-deal-500" style={{ width: `${(s.n / max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Buyer response · this mandate" className="lg:col-span-8"
          foot="Derived from the platform's own NDA and offer events. As real processes run across the network, these times aggregate per buyer — buyer-response intelligence neither a banker nor PitchBook has.">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-3 py-1.5">Buyer</th><th className="px-2 py-1.5">Stage</th>
                <th className="px-2 py-1.5 text-right">To NDA</th>
                <th className="px-2 py-1.5 text-right">To LOI</th>
                <th className="px-3 py-1.5 text-right">To close</th>
              </tr>
            </thead>
            <tbody>
              {BUYER_RESPONSES.map((b) => {
                const stage = b.closed ? "Closed" : b.loiIssued ? "LOI" : b.walkedAway ? "Walked away" : b.ndaSigned ? "NDA signed" : "Matched";
                const tone = b.closed ? "text-deal-300" : b.walkedAway ? "text-red-300" : b.loiIssued ? "text-loi-300" : "text-white/70";
                return (
                  <tr key={b.buyerId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-3 py-1.5 font-medium text-white">{b.buyerName}</td>
                    <td className={`px-2 py-1.5 font-semibold ${tone}`}>{stage}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/60">{b.timeToNdaDays != null ? `${b.timeToNdaDays}d` : "—"}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/60">{b.timeToLoiDays != null ? `${b.timeToLoiDays}d` : "—"}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-white/60">{b.timeToCloseDays != null ? `${b.timeToCloseDays}d` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </Frame>
    </div>
  );
};

export default ProcessIntelligence;

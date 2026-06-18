import React from "react";
import { Card, Kpi, SectionHeader } from "../lib/ui";
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
    <div>
      <SectionHeader
        kicker="Exchange · Execution"
        title="Process Intelligence"
        description="Buyer-response telemetry for your live mandate — who signs NDAs, issues LOIs and closes, with the conversions and timings observed. Every figure is a real process event; the dataset becomes the network's buyer-response moat as more deals run."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Median time to NDA" value={F.medianTimeToNdaDays != null ? `${F.medianTimeToNdaDays}d` : "—"} sub="first touch → signed" accent="#34d399" />
        <Kpi label="Median time to LOI" value={F.medianTimeToLoiDays != null ? `${F.medianTimeToLoiDays}d` : "—"} sub="first touch → LOI" />
        <Kpi label="NDA conversion" value={F.ndaConversionPct != null ? `${F.ndaConversionPct}%` : "—"} sub="matched → signed" accent="#fbbf24" />
        <Kpi label="Walk-aways" value={String(F.walkedAway)} sub="declined / lapsed" />
      </div>

      {/* funnel */}
      <Card className="mt-8 p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Process funnel</div>
        <div className="mt-4 space-y-3">
          {stages.map((s) => (
            <div key={s.label}>
              <div className="flex items-baseline justify-between text-[12.5px]">
                <span className="font-semibold text-white">{s.label} <span className="text-white/40">· {s.note}</span></span>
                <span className="font-mono tabular-nums text-white/80">{s.n}</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-deal-500" style={{ width: `${(s.n / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* per-buyer response */}
      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Buyer response · this mandate</div>
        <table className="w-full text-[12.5px]">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-2.5">Buyer</th><th className="px-3 py-2.5">Stage</th>
              <th className="px-3 py-2.5 text-right">Time to NDA</th>
              <th className="px-3 py-2.5 text-right">Time to LOI</th>
              <th className="px-5 py-2.5 text-right">Time to close</th>
            </tr>
          </thead>
          <tbody>
            {BUYER_RESPONSES.map((b) => {
              const stage = b.closed ? "Closed" : b.loiIssued ? "LOI" : b.walkedAway ? "Walked away" : b.ndaSigned ? "NDA signed" : "Matched";
              const tone = b.closed ? "text-deal-300" : b.walkedAway ? "text-red-300" : b.loiIssued ? "text-loi-300" : "text-white/70";
              return (
                <tr key={b.buyerId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-2.5 font-medium text-white">{b.buyerName}</td>
                  <td className={`px-3 py-2.5 font-semibold ${tone}`}>{stage}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/60">{b.timeToNdaDays != null ? `${b.timeToNdaDays}d` : "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/60">{b.timeToLoiDays != null ? `${b.timeToLoiDays}d` : "—"}</td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums text-white/60">{b.timeToCloseDays != null ? `${b.timeToCloseDays}d` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">
          Derived from the platform's own NDA and offer events. As real processes run across the network, these times aggregate per buyer — the buyer-response intelligence neither a banker nor PitchBook has.
        </div>
      </Card>
    </div>
  );
};

export default ProcessIntelligence;

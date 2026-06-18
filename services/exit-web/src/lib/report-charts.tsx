import React from "react";

// ── INVESTMENT-BANK EXHIBIT CHARTS ──────────────────────────────────
// Vector exhibits driven entirely by the report model — football field,
// valuation bridge, buyer ranking, buyer universe, confidence drivers and
// the transaction timeline. Light, print-safe, selectable. No data created.

const GREEN = "#0e7a4f", NAVY = "#16314f", LINE = "#eef1f5", INK = "#0b1220", MUTE = "#5b6675";
const usd = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);

/** Football field — a horizontal band per method, plus the concluded range. */
export const FootballField: React.FC<{ methods: { label: string; low: number; mid: number; high: number }[]; finalLow: number; finalMid: number; finalHigh: number }> = ({ methods, finalLow, finalMid, finalHigh }) => {
  const max = Math.max(finalHigh, ...methods.map((m) => m.high)) * 1.06;
  const sc = (n: number): number => (n / max) * 100;
  const Row: React.FC<{ label: string; low: number; mid: number; high: number; bold?: boolean }> = ({ label, low, mid, high, bold }) => (
    <div className="flex items-center gap-3 text-[11.5px]">
      <span className={`w-40 shrink-0 ${bold ? "font-semibold text-[#0b1220]" : "text-[#2b3543]"}`}>{label}</span>
      <span className="relative h-5 flex-1">
        <span className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-sm" style={{ left: `${sc(low)}%`, width: `${sc(high) - sc(low)}%`, background: bold ? GREEN : "rgba(14,122,79,0.28)" }} />
        <span className="absolute top-1/2 h-3.5 w-[2px] -translate-y-1/2" style={{ left: `${sc(mid)}%`, background: INK }} />
      </span>
      <span className="tnum w-28 text-right font-mono text-[#0b1220]">{usd(low)}–{usd(high)}</span>
    </div>
  );
  return (
    <div className="space-y-2.5">
      {methods.map((m) => <Row key={m.label} label={m.label} low={m.low} mid={m.mid} high={m.high} />)}
      <div className="border-t border-[#e3e8ef] pt-2.5"><Row label="Concluded enterprise value" low={finalLow} mid={finalMid} high={finalHigh} bold /></div>
    </div>
  );
};

/** Valuation bridge — baseline → strategic premium → concluded value. */
export const ValuationBridge: React.FC<{ baseline: number; premiumUsd: number; final: number }> = ({ baseline, premiumUsd, final }) => {
  const max = final * 1.12;
  const h = (n: number): number => (n / max) * 130;
  const bars = [
    { label: "Financial baseline", val: baseline, bottom: 0, fill: NAVY },
    { label: "Strategic premium", val: premiumUsd, bottom: baseline, fill: GREEN },
    { label: "Concluded value", val: final, bottom: 0, fill: INK },
  ];
  return (
    <div className="flex items-end justify-around gap-6" style={{ height: 170 }}>
      {bars.map((b) => (
        <div key={b.label} className="flex flex-1 flex-col items-center justify-end" style={{ height: 150 }}>
          <span className="tnum mb-1 font-mono text-[11px] font-semibold text-[#0b1220]">{b.label === "Strategic premium" ? "+" : ""}{usd(b.val)}</span>
          <div className="relative w-3/4" style={{ height: 130 }}>
            <div className="absolute bottom-0 w-full rounded-t-sm" style={{ height: h(b.val), marginBottom: h(b.bottom), background: b.fill, opacity: b.label === "Strategic premium" ? 0.85 : 1 }} />
          </div>
          <span className="mt-1.5 text-center text-[10px] uppercase tracking-wide text-[#5b6675]">{b.label}</span>
        </div>
      ))}
    </div>
  );
};

/** Buyer ranking — probability bars, ranked. */
export const BuyerRankingChart: React.FC<{ buyers: { name: string; probabilityPct: number; expectedDaysToCash?: number }[] }> = ({ buyers }) => {
  const max = Math.max(...buyers.map((b) => b.probabilityPct), 1);
  return (
    <div className="space-y-2">
      {buyers.map((b, i) => (
        <div key={b.name} className="flex items-center gap-3 text-[12px]">
          <span className="w-4 font-mono text-[#9aa3b0]">{i + 1}</span>
          <span className="w-44 shrink-0 font-medium text-[#0b1220]">{b.name}</span>
          <span className="relative h-4 flex-1 rounded-sm" style={{ background: LINE }}>
            <span className="absolute left-0 top-0 h-full rounded-sm" style={{ width: `${(b.probabilityPct / max) * 100}%`, background: GREEN, opacity: 0.8 }} />
          </span>
          <span className="tnum w-10 text-right font-mono font-semibold" style={{ color: GREEN }}>{b.probabilityPct}%</span>
          {b.expectedDaysToCash != null && <span className="tnum w-14 text-right font-mono text-[#9aa3b0]">{b.expectedDaysToCash}d</span>}
        </div>
      ))}
    </div>
  );
};

/** Buyer universe distribution — proportional segmented bar. */
export const BuyerUniverse: React.FC<{ strategic: number; financial: number; sovereign: number; familyOffice: number }> = ({ strategic, financial, sovereign, familyOffice }) => {
  const segs = [
    { label: "Strategic", n: strategic, fill: GREEN },
    { label: "Financial / PE", n: financial, fill: NAVY },
    { label: "Sovereign", n: sovereign, fill: "#7a8aa0" },
    { label: "Family Office", n: familyOffice, fill: "#c9b08a" },
  ].filter((s) => s.n > 0);
  const total = segs.reduce((s, x) => s + x.n, 0) || 1;
  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-sm">
        {segs.map((s) => <div key={s.label} className="flex items-center justify-center text-[9px] font-semibold text-white" style={{ width: `${(s.n / total) * 100}%`, background: s.fill }}>{(s.n / total) >= 0.1 ? s.n : ""}</div>)}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[10.5px]">
        {segs.map((s) => <span key={s.label} className="flex items-center gap-1.5 text-[#5b6675]"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.fill }} />{s.label} · <span className="tnum font-mono text-[#0b1220]">{s.n}</span></span>)}
      </div>
    </div>
  );
};

/** Confidence drivers — horizontal bars. */
export const ConfidenceDrivers: React.FC<{ drivers: { label: string; pct: number }[] }> = ({ drivers }) => (
  <div className="space-y-2.5">
    {drivers.map((d) => (
      <div key={d.label} className="flex items-center gap-3 text-[11.5px]">
        <span className="w-44 shrink-0 text-[#2b3543]">{d.label}</span>
        <span className="relative h-3.5 flex-1 rounded-sm" style={{ background: LINE }}>
          <span className="absolute left-0 top-0 h-full rounded-sm" style={{ width: `${d.pct}%`, background: d.pct >= 70 ? GREEN : d.pct >= 50 ? "#b8902f" : "#b4453a" }} />
        </span>
        <span className="tnum w-10 text-right font-mono text-[#0b1220]">{d.pct}%</span>
      </div>
    ))}
  </div>
);

/** Transaction timeline — phases to close across the day range. */
export const TransactionTimeline: React.FC<{ closeHighDays: number }> = ({ closeHighDays }) => {
  const phases = [
    { label: "Preparation", w: 18 }, { label: "Buyer Outreach", w: 18 }, { label: "NDA", w: 10 },
    { label: "LOI", w: 14 }, { label: "Due Diligence", w: 28 }, { label: "Close", w: 12 },
  ];
  let acc = 0;
  return (
    <div>
      <div className="flex h-9 w-full overflow-hidden rounded-sm">
        {phases.map((p, i) => (
          <div key={p.label} className="flex items-center justify-center border-r border-white/40 text-[10px] font-semibold text-white last:border-0"
            style={{ width: `${p.w}%`, background: `rgba(14,122,79,${0.42 + i * 0.1})` }}>{p.w >= 12 ? p.label : ""}</div>
        ))}
      </div>
      <div className="tnum mt-1.5 flex justify-between font-mono text-[10.5px] text-[#5b6675]">
        <span>Day 0</span>
        {phases.slice(0, -1).map((p) => { acc += p.w; return <span key={p.label}>{Math.round((acc / 100) * closeHighDays)}d</span>; })}
        <span className="font-semibold" style={{ color: GREEN }}>Close · {closeHighDays}d</span>
      </div>
    </div>
  );
};

export const reportUsd = usd;

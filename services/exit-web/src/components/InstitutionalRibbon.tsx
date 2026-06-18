import React, { useEffect, useState } from "react";
import { RIBBON } from "../lib/market-ribbon";
import { ACQ_INDEXES } from "../lib/market-intel";

// A live micro-reactor: one sparkbar per sector, height/colour by its real
// 12-month trend. The market's shape, in the corner of the eye.
const SPARK = [...ACQ_INDEXES.indexes]
  .filter((i) => i.trendPct != null)
  .sort((a, b) => b.volume - a.volume)
  .slice(0, 16)
  .map((i) => ({ t: i.trendPct ?? 0, sector: i.sector }));
const SPARK_MAX = Math.max(...SPARK.map((s) => Math.abs(s.t)), 0.01);

const RibbonSpark: React.FC = () => (
  <span className="hidden items-end gap-[1.5px] md:flex" title="Sector 12-month trend">
    {SPARK.map((s) => {
      const h = 3 + (Math.abs(s.t) / SPARK_MAX) * 11;
      return <span key={s.sector} className={`w-[2px] rounded-sm ${s.t >= 0 ? "bg-deal-400/80" : "bg-red-400/70"}`} style={{ height: h }} />;
    })}
  </span>
);

// The persistent institutional ribbon — a Bloomberg-style status bar pinned
// above every workstation. Market vitals on the left of the eye, a live UTC
// clock and session pulse on the far right. The clock and pulse are the only
// live elements; the vitals are registry-derived and honest.

const Clock: React.FC = () => {
  const [t, setT] = useState<string>(() => new Date().toISOString().slice(11, 19));
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toISOString().slice(11, 19)), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono tabular-nums text-white/55">{t} UTC</span>;
};

const InstitutionalRibbon: React.FC = () => (
  <div className="flex items-stretch overflow-x-auto border-b border-white/10 bg-ink-950/92 backdrop-blur-sm">
    <div className="flex shrink-0 items-center gap-1.5 border-r border-white/10 px-3">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-deal-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-deal-400" />
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-deal-300">ExitOS</span>
      <span className="text-[8.5px] font-semibold uppercase tracking-[0.2em] text-white/35">Live</span>
    </div>

    {RIBBON.map((s) => (
      <div key={s.key} className="flex shrink-0 items-center gap-2 border-r border-white/[0.07] px-3 py-1">
        <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/35">{s.label}</span>
        <span className={`font-mono text-[12px] font-bold tabular-nums ${s.dir === "up" ? "text-deal-300" : s.dir === "down" ? "text-red-300" : "text-white/90"}`}>
          {s.dir === "up" ? "▲" : s.dir === "down" ? "▼" : ""}{s.value}
        </span>
        {s.sub && <span className="hidden text-[9px] text-white/35 lg:inline">{s.sub}</span>}
      </div>
    ))}

    <div className="ml-auto flex shrink-0 items-center gap-3 border-l border-white/10 px-3 text-[10px]">
      <RibbonSpark />
      <Clock />
    </div>
  </div>
);

export default InstitutionalRibbon;

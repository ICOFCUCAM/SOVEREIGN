import React from "react";
import { ACQ_INDEXES, fmtUsd } from "../lib/market-intel";

// ── TRANSACTION HEATFIELD ───────────────────────────────────────────
// A spatial field of acquisition activity: one column per sector, height by
// acquisition volume, heat (colour intensity) by disclosed transaction value.
// A layered grid sits behind for depth. Every column is real index data; on
// hover it discloses its figures. No motion — a spatial instrument.

export const TransactionHeatfield: React.FC<{ height?: number }> = ({ height = 200 }) => {
  const data = [...ACQ_INDEXES.indexes].sort((a, b) => b.volume - a.volume).slice(0, 18);
  const maxVol = Math.max(...data.map((d) => d.volume), 1);
  const maxDisc = Math.max(...data.map((d) => d.totalDisclosedUsd), 1);

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      {/* layered grid backdrop — depth */}
      <div className="pointer-events-none absolute inset-0" aria-hidden
        style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 25%)" }} />
      <div className="absolute inset-x-0 bottom-6 top-3 flex items-end gap-[3px] px-3">
        {data.map((d) => {
          const h = Math.max(3, (d.volume / maxVol) * 100);
          const heat = d.totalDisclosedUsd / maxDisc;           // 0..1 disclosed intensity
          const up = (d.trendPct ?? 0) >= 0;
          return (
            <div key={d.sector} className="group relative flex h-full flex-1 items-end" title={`${d.sector} · ${d.volume.toLocaleString()} acquisitions · ${fmtUsd(d.totalDisclosedUsd)} disclosed${d.trendPct != null ? ` · ${up ? "+" : ""}${Math.round((d.trendPct ?? 0) * 100)}% 12m` : ""}`}>
              <div className="w-full rounded-t-sm ring-1 ring-inset ring-white/5 transition group-hover:ring-deal-400/50"
                style={{ height: `${h}%`, background: `linear-gradient(to top, rgba(56,130,246,${(0.22 + heat * 0.6).toFixed(2)}), rgba(88,198,255,${(0.4 + heat * 0.5).toFixed(2)}))` }} />
              <span className="absolute -bottom-[18px] left-1/2 hidden w-12 -translate-x-1/2 truncate text-center text-[7.5px] uppercase tracking-wide text-white/35 md:block">{d.sector}</span>
              {/* heat cap — disclosed-value marker */}
              <span className="absolute left-1/2 -translate-x-1/2 h-[2px] w-full rounded" style={{ bottom: `calc(${h}% - 1px)`, background: up ? "#45E38A" : "#f87171", opacity: 0.5 + heat * 0.5 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

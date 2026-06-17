import React, { useState } from "react";
import { Card, Kpi, SectionHeader } from "../lib/ui";
import { ACQ_INDEXES, fmtUsd } from "../lib/market-intel";

// EXITOS ACQUISITION INDEXES (Stage 8) — Bloomberg has indexes; so does
// ExitOS. Per ExitOS sector, the aggregate the whole network produces:
// acquisition volume and its trend, active buyers, deal size and disclosed
// value — every figure from verified registry events. As the network
// ingests more deals, the indexes sharpen for everyone.

const { indexes, as_of } = ACQ_INDEXES;
const totalVol = indexes.reduce((s, i) => s + i.volume, 0);
const totalDisclosed = indexes.reduce((s, i) => s + i.totalDisclosedUsd, 0);

const Trend: React.FC<{ pct: number | null }> = ({ pct }) => {
  if (pct == null) return <span className="text-white/30">—</span>;
  const up = pct >= 0;
  return <span className={`font-mono tabular-nums ${up ? "text-deal-300" : "text-red-300"}`}>{up ? "▲" : "▼"} {Math.abs(Math.round(pct * 100))}%</span>;
};

const Indexes: React.FC = () => {
  const [sort, setSort] = useState<"volume" | "trend" | "size" | "buyers">("volume");
  const rows = [...indexes].sort((a, b) =>
    sort === "trend" ? (b.trendPct ?? -1) - (a.trendPct ?? -1)
    : sort === "size" ? (b.medianDealUsd ?? 0) - (a.medianDealUsd ?? 0)
    : sort === "buyers" ? b.activeBuyers - a.activeBuyers
    : b.volume - a.volume);
  const maxVol = Math.max(...indexes.map((i) => i.volume), 1);

  return (
    <div>
      <SectionHeader
        kicker="Market Intelligence · Indexes"
        title="ExitOS Acquisition Indexes"
        description={`Acquisition activity by sector — volume, trend, active buyers and deal size — aggregated from verified registry events as of ${as_of.slice(0, 10)}. The index strengthens with every acquisition the network ingests.`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Sector indexes" value={String(indexes.length)} />
        <Kpi label="Indexed acquisitions" value={totalVol.toLocaleString()} sub="across sectors" accent="#34d399" />
        <Kpi label="Disclosed value" value={fmtUsd(totalDisclosed)} sub="priced deals" />
        <Kpi label="Hottest sector" value={[...indexes].sort((a, b) => (b.trendPct ?? -1) - (a.trendPct ?? -1))[0]?.sector ?? "—"} sub="by 12m trend" accent="#fbbf24" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {([["volume", "Volume"], ["trend", "Trend"], ["size", "Deal size"], ["buyers", "Active buyers"]] as [typeof sort, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setSort(k)}
            className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${sort === k ? "bg-deal-600/20 text-white ring-1 ring-deal-400/40" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
            Sort · {l}
          </button>
        ))}
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        <table className="w-full text-[12.5px]">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3">Index</th>
              <th className="px-3 py-3 text-right">Volume</th>
              <th className="px-3 py-3 text-right">12m trend</th>
              <th className="px-3 py-3 text-right">Active buyers</th>
              <th className="px-3 py-3 text-right">Median deal</th>
              <th className="px-5 py-3 text-right">Disclosed value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.sector} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-2.5">
                  <div className="font-semibold capitalize text-white">{i.sector} Acquisition Index</div>
                  <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-deal-500" style={{ width: `${(i.volume / maxVol) * 100}%` }} /></div>
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/85">{i.volume.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right"><Trend pct={i.trendPct} /></td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/70">{i.activeBuyers}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/70">{i.medianDealUsd != null ? fmtUsd(i.medianDealUsd) : "—"}</td>
                <td className="px-5 py-2.5 text-right font-mono tabular-nums text-deal-300">{i.totalDisclosedUsd > 0 ? fmtUsd(i.totalDisclosedUsd) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">
          {ACQ_INDEXES.source}. Volume = indexed acquisitions mapped to the ExitOS sector taxonomy; trend = trailing-12-month vs prior-12-month volume; median deal from disclosed values only. Premium & close-rate tables live in Outcome Intelligence.
        </div>
      </Card>
    </div>
  );
};

export default Indexes;

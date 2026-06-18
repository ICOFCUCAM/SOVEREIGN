import React, { useState } from "react";
import { Panel, Frame, CommandHeader } from "../lib/workstation";
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
  const hottest = [...indexes].sort((a, b) => (b.trendPct ?? -1) - (a.trendPct ?? -1))[0];

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="Market Intelligence"
        title="Acquisition Indexes"
        tag="Sector tape"
        status={`As of ${as_of.slice(0, 10)}`}
        meta={[{ k: "SOURCE", v: ACQ_INDEXES.source.slice(0, 28) }]}
        metrics={[
          { k: "Sector indexes", v: String(indexes.length) },
          { k: "Indexed acquisitions", v: totalVol.toLocaleString(), accent: true, sub: "across sectors" },
          { k: "Disclosed value", v: fmtUsd(totalDisclosed), sub: "priced deals" },
          { k: "Hottest sector", v: hottest?.sector ?? "—", accent: true, sub: hottest?.trendPct != null ? `${hottest.trendPct >= 0 ? "+" : ""}${Math.round(hottest.trendPct * 100)}% 12m` : undefined },
        ]}
      />


      <Frame>
        <Panel title="ExitOS Acquisition Indexes" className="lg:col-span-12"
          right={
            <div className="flex flex-wrap gap-1">
              {([["volume", "Vol"], ["trend", "Trend"], ["size", "Size"], ["buyers", "Buyers"]] as [typeof sort, string][]).map(([k, l]) => (
                <button key={k} onClick={() => setSort(k)} className={`rounded px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide transition ${sort === k ? "bg-deal-600/20 text-white ring-1 ring-deal-400/40" : "text-white/45 hover:text-white"}`}>{l}</button>
              ))}
            </div>
          }
          foot={`${ACQ_INDEXES.source}. Volume = indexed acquisitions mapped to the ExitOS taxonomy; trend = trailing-12m vs prior-12m; median deal from disclosed values only.`}>
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-3 py-1.5">Index</th>
                <th className="px-2 py-1.5 text-right">Volume</th>
                <th className="px-2 py-1.5 text-right">12m trend</th>
                <th className="px-2 py-1.5 text-right">Active buyers</th>
                <th className="px-2 py-1.5 text-right">Median deal</th>
                <th className="px-3 py-1.5 text-right">Disclosed value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.sector} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5">
                    <span className="font-semibold capitalize text-white">{i.sector}</span>
                    <span className="ml-2 inline-block h-1 w-20 overflow-hidden rounded-full bg-white/10 align-middle"><span className="block h-full rounded-full bg-deal-500" style={{ width: `${(i.volume / maxVol) * 100}%` }} /></span>
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/85">{i.volume.toLocaleString()}</td>
                  <td className="px-2 py-1.5 text-right"><Trend pct={i.trendPct} /></td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/70">{i.activeBuyers}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/70">{i.medianDealUsd != null ? fmtUsd(i.medianDealUsd) : "—"}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-deal-300">{i.totalDisclosedUsd > 0 ? fmtUsd(i.totalDisclosedUsd) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </Frame>
    </div>
  );
};

export default Indexes;

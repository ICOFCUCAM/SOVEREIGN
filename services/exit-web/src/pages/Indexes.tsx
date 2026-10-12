import React, { useMemo, useState } from "react";
import { RegistryTape } from "../components/xo/RegistryTape";
import { PageHeader, Section, Metric, ScrollRegion, Chip } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { AcquisitionReactor } from "../components/Reactor";
import { TransactionHeatfield } from "../components/Heatfield";
import { ACQ_INDEXES, fmtUsd } from "../lib/market-intel";

// EXITOS ACQUISITION INDEXES (Stage 8) — Bloomberg has indexes; so does
// ExitOS. Per ExitOS sector, the aggregate the whole network produces:
// acquisition volume and its trend, distinct acquirers, deal size and
// disclosed value — every figure from the registry snapshot (mostly
// source-cited, unverified entries; see the Market Map).

const { indexes, as_of } = ACQ_INDEXES;
const totalVol = indexes.reduce((s, i) => s + i.volume, 0);
const totalDisclosed = indexes.reduce((s, i) => s + i.totalDisclosedUsd, 0);

// Trends on small windows swing wildly (3 → 5 deals is +67%), so the counts
// are always shown and windows under 10 deals are marked.
const SMALL = 10;
const Trend: React.FC<{ pct: number | null; now: number; prior: number }> = ({ pct, now, prior }) => {
  const counts = <span className="ml-1 text-[11px] text-xo-faint">({now} vs {prior}{now < SMALL && prior < SMALL ? ", small sample" : ""})</span>;
  if (pct == null) return <span className="text-xo-faint">—{counts}</span>;
  const up = pct >= 0;
  return <span className={`font-mono tabular-nums ${up ? "text-xo-verified" : "text-xo-risk"}`}><span aria-hidden>{up ? "▲" : "▼"} </span><span className="sr-only">{up ? "up " : "down "}</span>{Math.abs(Math.round(pct * 100))}%{counts}</span>;
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
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="acquisition-indexes" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Market Intelligence" title="Acquisition Indexes"
        badge={<span className="text-[12px] text-xo-muted">Sector tape · as of {as_of.slice(0, 10)}</span>}
        description={`Source: ${ACQ_INDEXES.source} — mostly source-cited entries that are not yet verified.`} />

      <section aria-label="Index totals" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Sector indexes" value={String(indexes.length)} /></div>
        <div className="bg-xo-panel"><Metric label="Indexed acquisitions" emphasis value={totalVol.toLocaleString()} sub="across sectors" /></div>
        <div className="bg-xo-panel"><Metric label="Disclosed value" value={fmtUsd(totalDisclosed)} sub="priced deals" /></div>
        <div className="bg-xo-panel"><Metric label="Largest 12-month change" value={<span className="capitalize">{hottest?.sector ?? "—"}</span>} sub={hottest?.trendPct != null ? `${hottest.trendPct >= 0 ? "+" : ""}${Math.round(hottest.trendPct * 100)}% 12m · ${hottest.volume12m} vs ${hottest.volumePrior12m} deals${hottest.volume12m < SMALL && hottest.volumePrior12m < SMALL ? " (small sample)" : ""}` : undefined} /></div>
      </section>

      <RegistryTape items={tape} asOf={as_of.slice(0, 10)} />

      <Section title="Transaction heatfield · volume × disclosed value" className="border border-xo-line"
        foot="Column height = acquisition volume · heat = disclosed value · cap colour = 12-month trend. The same figures are in the index table below.">
        <div aria-hidden><TransactionHeatfield height={200} /></div>
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Acquisition reactor" className="lg:col-span-4"
          foot="Orbital field of sector acquisition volume — node size ∝ √volume, colour = 12-month trend.">
          <div aria-hidden><AcquisitionReactor height={240} /></div>
        </Section>
        <Section title="ExitOS Acquisition Indexes" className="lg:col-span-8"
          right={<div role="group" aria-label="Sort by" className="flex flex-wrap gap-1.5">
            {([["volume", "Volume"], ["trend", "Trend"], ["size", "Size"], ["buyers", "Buyers"]] as [typeof sort, string][]).map(([k, l]) => (
              <Chip key={k} pressed={sort === k} onToggle={() => setSort(k)}>{l}</Chip>
            ))}
          </div>}
          foot={`${ACQ_INDEXES.source}. Volume = indexed acquisitions mapped to the ExitOS taxonomy; trend = trailing-12m vs prior-12m deal count (both counts shown; under 10 deals in both windows is marked small sample); median deal from disclosed values only.`}>
          <ScrollRegion label="Acquisition indexes table">
            <table className="w-full min-w-[760px] text-[12px]">
              <thead className="text-left text-[11px] text-xo-faint">
                <tr className="border-b border-xo-line">
                  <th scope="col" className="px-3 py-2 font-medium">Index</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Volume</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">12m trend (deals vs prior 12m)</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Distinct acquirers (all years)</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Median deal</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Disclosed value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.sector} className="border-b border-xo-line last:border-0">
                    <th scope="row" className="px-3 py-1.5 text-left font-normal">
                      <span className="font-semibold capitalize">{i.sector}</span>
                      <span aria-hidden className="ml-2 inline-block h-1 w-20 overflow-hidden rounded-full bg-xo-line align-middle"><span className="block h-full rounded-full bg-xo-action" style={{ width: `${(i.volume / maxVol) * 100}%` }} /></span>
                    </th>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">{i.volume.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right"><Trend pct={i.trendPct} now={i.volume12m} prior={i.volumePrior12m} /></td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{i.activeBuyers}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{i.medianDealUsd != null ? fmtUsd(i.medianDealUsd) : "—"}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-xo-verified">{i.totalDisclosedUsd > 0 ? fmtUsd(i.totalDisclosedUsd) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>
      </div>
    </div>
  );
};

export default Indexes;

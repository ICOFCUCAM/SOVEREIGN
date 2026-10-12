import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MarketTape } from "../lib/workstation";
import { buildMarketTape } from "../lib/market-tape";
import { LiquidityReactor } from "../components/Reactor";
import { TransactionHeatfield } from "../components/Heatfield";
import { PageHeader, Section, Metric, ScrollRegion, Disclosure } from "../components/xo";
import { MARKET_INTEL, ACQ_INDEXES, fmtUsd } from "../lib/market-intel";

// GLOBAL ACQUISITION MARKET INTELLIGENCE (Phase 4) — the visual signature.
// Sector heat, regional deal density, cross-border corridors and the most
// active acquirers, every figure aggregated from the acquisition registry
// snapshot (Wikipedia · Wikidata · SEC EDGAR). Most events are source-cited
// list entries not yet verified; the page says so.

const MarketMap: React.FC = () => {
  const m = MARKET_INTEL;
  const sectorMax = Math.max(...m.sectorHeat.map((s) => s.deals), 1);
  const geoMax = Math.max(...m.geoDensity.map((g) => g.deals), 1);
  const acquirerMax = Math.max(...m.topAcquirers.map((a) => a.deals), 1);
  // Heat ramp on the sector cells; the text colour flips to dark ink on the
  // brightest cells so the numbers keep contrast.
  const heat = (frac: number): string => `rgba(56, 132, 255, ${(0.12 + frac * 0.78).toFixed(2)})`;
  const heatData = useMemo(() => [...ACQ_INDEXES.indexes].sort((a, b) => b.volume - a.volume).slice(0, 18), []);
  const [showHeatData, setShowHeatData] = useState(false);

  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="market-map" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Market Intelligence" title="Global Acquisition Activity"
        badge={<span className="text-[12px] text-xo-muted">The map · as of {m.as_of.slice(0, 10)} · {m.geoDensity.length} regions</span>}
        description={`Source: ${m.source}. Most events are source-cited entries from Wikipedia acquisition lists that are not yet verified; a minority are verified against SEC EDGAR or Wikidata. Values are as disclosed in those sources.`}
        actions={<a href="/report/market" target="_blank" rel="noopener noreferrer" className="rounded-sm border border-xo-action/50 px-3 py-1.5 text-[12px] font-medium text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Market Intelligence Report (PDF) →<span className="sr-only"> (opens in a new tab)</span></a>} />

      <section aria-label="Registry totals" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Indexed acquisitions" emphasis value={m.totalEvents.toLocaleString()} sub="queryable events" /></div>
        <div className="bg-xo-panel"><Metric label="Disclosed value" value={<span className="text-xo-verified">{fmtUsd(m.totalDisclosedUsd)}</span>} sub={`${m.disclosedEvents.toLocaleString()} priced deals`} /></div>
        <div className="bg-xo-panel"><Metric label="Active sectors" value={String(m.sectorHeat.length)} sub="by deal volume" /></div>
        <div className="bg-xo-panel"><Metric label="Active acquirers" value={String(m.topAcquirers.length)} sub="top of registry" /></div>
      </section>

      <MarketTape items={tape} />

      <Section title="Transaction heatfield · where capital is moving" className="border border-xo-line"
        foot="Column height = acquisition volume · heat = disclosed value · cap = trend. Aggregated from the registry snapshot (mostly unverified, source-cited entries)."
        right={<Disclosure open={showHeatData} onToggle={() => setShowHeatData(!showHeatData)} controls="heat-data">{showHeatData ? "Hide data" : "Show data"}</Disclosure>}>
        <div aria-hidden><TransactionHeatfield height={190} /></div>
        {showHeatData && (
          <ScrollRegion label="Heatfield data" className="border-t border-xo-line">
            <table id="heat-data" className="w-full min-w-[520px] text-[12px]">
              <thead className="text-left text-[11px] text-xo-faint">
                <tr className="border-b border-xo-line"><th scope="col" className="px-4 py-2 font-medium">Sector</th><th scope="col" className="px-4 py-2 text-right font-medium">Acquisitions</th><th scope="col" className="px-4 py-2 text-right font-medium">Disclosed</th><th scope="col" className="px-4 py-2 text-right font-medium">12-month trend</th></tr>
              </thead>
              <tbody>
                {heatData.map((d) => (
                  <tr key={d.sector} className="border-b border-xo-line last:border-0">
                    <th scope="row" className="px-4 py-1.5 text-left font-medium capitalize">{d.sector}</th>
                    <td className="px-4 py-1.5 text-right font-mono tabular-nums">{d.volume.toLocaleString()}</td>
                    <td className="px-4 py-1.5 text-right font-mono tabular-nums">{fmtUsd(d.totalDisclosedUsd)}</td>
                    <td className="px-4 py-1.5 text-right font-mono tabular-nums">{d.trendPct != null ? `${d.trendPct >= 0 ? "+" : ""}${Math.round(d.trendPct * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Liquidity reactor · disclosed capital" className="lg:col-span-4"
          foot="Concentric wells of disclosed deal value per sector — arc length ∝ disclosed value.">
          <div aria-hidden><LiquidityReactor height={210} /></div>
        </Section>
        <Section title="Sector heat · deal volume" className="lg:col-span-4" foot="Colour intensity = deal volume. Hover for disclosed value.">
          <ul className="grid grid-cols-3 gap-px bg-xo-line sm:grid-cols-4">
            {m.sectorHeat.slice(0, 24).map((s) => {
              const f = s.deals / sectorMax;
              return (
                <li key={s.token} className="min-w-0 p-2" style={{ background: heat(f) }} title={`${s.deals} deals · ${fmtUsd(s.disclosedUsd)} disclosed`}>
                  <div className={`truncate text-[11px] font-semibold capitalize ${f > 0.6 ? "text-xo-ink" : "text-xo-text"}`}>{s.token}</div>
                  <div className={`font-mono text-[12px] tabular-nums ${f > 0.6 ? "text-xo-ink" : "text-xo-text"}`}>{s.deals}</div>
                </li>
              );
            })}
          </ul>
        </Section>
        <Section title="Regional deal density" className="lg:col-span-4">
          <ul className="space-y-2 px-4 py-3">
            {m.geoDensity.map((g) => (
              <li key={g.region}>
                <div className="flex items-baseline justify-between gap-2 text-[12px]">
                  <span className="font-medium">{g.region}</span>
                  <span className="font-mono tabular-nums text-xo-muted">{g.deals.toLocaleString()} · {fmtUsd(g.disclosedUsd)}</span>
                </div>
                <div aria-hidden className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-xo-line"><div className="h-full rounded-full bg-xo-action" style={{ width: `${(g.deals / geoMax) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Cross-border corridors" className="lg:col-span-4">
          {m.corridors.length ? (
            <ul className="space-y-1.5 px-4 py-3">
              {m.corridors.map((c) => (
                <li key={`${c.from}-${c.to}`} className="flex items-center justify-between border border-xo-line px-2.5 py-1.5 text-[12px]">
                  <span>{c.from} <span aria-hidden className="text-xo-verified">→</span><span className="sr-only"> to </span> {c.to}</span>
                  <span className="font-mono tabular-nums text-xo-muted">{c.deals}</span>
                </li>
              ))}
            </ul>
          ) : <p className="px-4 py-3 text-[12px] text-xo-muted">Corridors require buyer-country coverage, still thin — they fill in as enrichment grows. No corridor shown without both endpoints sourced.</p>}
        </Section>

        <Section title="Most active acquirers" className="lg:col-span-8"
          foot={<>Source: {m.source}. Counts of recorded events — not modelled, but mostly unverified list entries. Query precisely in the <Link to="/console/knowledge-graph" className="text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Knowledge Graph</Link>.</>}>
          <ScrollRegion label="Most active acquirers table">
            <table className="w-full min-w-[520px] text-[12px]">
              <thead className="text-left text-[11px] text-xo-faint">
                <tr className="border-b border-xo-line"><th scope="col" className="px-3 py-2 font-medium">#</th><th scope="col" className="px-2 py-2 font-medium">Acquirer</th><th scope="col" className="px-2 py-2 font-medium"><span className="sr-only">Relative volume</span></th><th scope="col" className="px-2 py-2 text-right font-medium">Deals</th><th scope="col" className="px-3 py-2 text-right font-medium">Last 3 years</th></tr>
              </thead>
              <tbody>
                {m.topAcquirers.slice(0, 25).map((a, i) => (
                  <tr key={a.buyer_id} className="border-b border-xo-line last:border-0">
                    <td className="px-3 py-1.5 font-mono text-xo-faint">{i + 1}</td>
                    <th scope="row" className="px-2 py-1.5 text-left font-normal"><Link to={`/console/buyer/${a.buyer_id}`} className="font-semibold hover:text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{a.name}</Link></th>
                    <td className="px-2 py-1.5"><div aria-hidden className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-xo-line"><div className="h-full rounded-full bg-xo-action" style={{ width: `${(a.deals / acquirerMax) * 100}%` }} /></div></td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">{a.deals}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-xo-verified">{a.recentDeals}</td>
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

export default MarketMap;

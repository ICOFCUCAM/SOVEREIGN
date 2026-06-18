import React from "react";
import { Link } from "react-router-dom";
import { Panel, Frame, CommandHeader } from "../lib/workstation";
import { MARKET_INTEL, fmtUsd } from "../lib/market-intel";

// GLOBAL ACQUISITION MARKET INTELLIGENCE (Phase 4) — the visual signature.
// Sector heat, regional deal density, cross-border corridors and the most
// active acquirers, every figure aggregated from the verified registry
// (Wikipedia · Wikidata · SEC EDGAR). No estimates — pure deal data.

const MarketMap: React.FC = () => {
  const m = MARKET_INTEL;
  const sectorMax = Math.max(...m.sectorHeat.map((s) => s.deals), 1);
  const geoMax = Math.max(...m.geoDensity.map((g) => g.deals), 1);
  const acquirerMax = Math.max(...m.topAcquirers.map((a) => a.deals), 1);
  const heat = (frac: number): string => {
    // monochrome→blue heat ramp
    const a = 0.12 + frac * 0.78;
    return `rgba(56, 132, 255, ${a.toFixed(2)})`;
  };


  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Market Intelligence"
        title="Global Acquisition Activity"
        tag="The map"
        status={`As of ${m.as_of.slice(0, 10)}`}
        meta={[{ k: "REGIONS", v: m.geoDensity.length }, { k: "SOURCE", v: m.source.slice(0, 24) }]}
        metrics={[
          { k: "Indexed acquisitions", v: m.totalEvents.toLocaleString(), sub: "queryable events" },
          { k: "Disclosed value", v: fmtUsd(m.totalDisclosedUsd), accent: true, sub: `${m.disclosedEvents.toLocaleString()} priced deals` },
          { k: "Active sectors", v: String(m.sectorHeat.length), sub: "by deal volume" },
          { k: "Active acquirers", v: String(m.topAcquirers.length), accent: true, sub: "top of registry" },
        ]}
      />


      <Frame>
        <Panel title="Sector heat · deal volume" className="lg:col-span-6" foot="Colour intensity = deal volume. Hover for disclosed value.">
          <div className="grid grid-cols-4 gap-px bg-white/10 sm:grid-cols-5">
            {m.sectorHeat.slice(0, 25).map((s) => (
              <div key={s.token} className="p-2" style={{ background: heat(s.deals / sectorMax) }} title={`${s.deals} deals · ${fmtUsd(s.disclosedUsd)} disclosed`}>
                <div className="truncate text-[10px] font-semibold capitalize text-white">{s.token}</div>
                <div className="font-mono text-[11px] tabular-nums text-white/85">{s.deals}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Regional deal density" className="lg:col-span-6">
          <div className="space-y-2 p-3">
            {m.geoDensity.map((g) => (
              <div key={g.region}>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-medium text-white/85">{g.region}</span>
                  <span className="font-mono tabular-nums text-white/60">{g.deals.toLocaleString()} · {fmtUsd(g.disclosedUsd)}</span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-500" style={{ width: `${(g.deals / geoMax) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>
      </Frame>

      <Frame>
        <Panel title="Cross-border corridors" className="lg:col-span-4">
          {m.corridors.length ? (
            <div className="space-y-1.5 p-3">
              {m.corridors.map((c) => (
                <div key={`${c.from}-${c.to}`} className="flex items-center justify-between rounded border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-[12px]">
                  <span className="text-white/80">{c.from} <span className="text-deal-300">→</span> {c.to}</span>
                  <span className="font-mono tabular-nums text-white/60">{c.deals}</span>
                </div>
              ))}
            </div>
          ) : <div className="p-3 text-[11.5px] text-white/45">Corridors require buyer-country coverage, still thin — they fill in as enrichment grows. No corridor shown without both endpoints sourced.</div>}
        </Panel>

        <Panel title="Most active acquirers" className="lg:col-span-8"
          foot={<>Source: {m.source}. Nothing modelled or estimated. Query precisely in the <Link to="/console/knowledge-graph" className="text-deal-300 hover:text-deal-200">Knowledge Graph</Link>.</>}>
          <table className="w-full text-[12px]">
            <tbody>
              {m.topAcquirers.slice(0, 25).map((a, i) => (
                <tr key={a.buyer_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5 font-mono text-white/35">{i + 1}</td>
                  <td className="px-2 py-1.5"><Link to={`/console/buyer/${a.buyer_id}`} className="font-semibold text-white hover:text-deal-300">{a.name}</Link></td>
                  <td className="px-2 py-1.5 text-right"><div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-deal-500" style={{ width: `${(a.deals / acquirerMax) * 100}%` }} /></div></td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/70">{a.deals}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-deal-300" title="acquisitions in the last 3 years">{a.recentDeals}↑</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </Frame>
    </div>
  );
};

export default MarketMap;

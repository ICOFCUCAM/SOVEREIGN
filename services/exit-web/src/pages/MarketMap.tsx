import React from "react";
import { Link } from "react-router-dom";
import { Card, Kpi, SectionHeader } from "../lib/ui";
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
    <div>
      <SectionHeader
        kicker="Market Intelligence · The map"
        title="Global Acquisition Activity"
        description={`Where capital is moving. ${m.totalEvents.toLocaleString()} indexed acquisitions across ${m.geoDensity.length} regions — sector heat, deal density, cross-border corridors and the most active acquirers, aggregated from verified registry data as of ${m.as_of.slice(0, 10)}.`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Indexed acquisitions" value={m.totalEvents.toLocaleString()} sub="queryable events" />
        <Kpi label="Disclosed value" value={fmtUsd(m.totalDisclosedUsd)} sub={`${m.disclosedEvents.toLocaleString()} priced deals`} accent="#34d399" />
        <Kpi label="Active sectors" value={String(m.sectorHeat.length)} sub="ranked by deal volume" />
        <Kpi label="Active acquirers" value={String(m.topAcquirers.length)} sub="top of the registry" accent="#fbbf24" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* sector heat map */}
        <Card className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Sector heat — deal volume</div>
          <div className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-5">
            {m.sectorHeat.slice(0, 25).map((s) => (
              <div key={s.token} className="rounded-md p-2" style={{ background: heat(s.deals / sectorMax) }} title={`${s.deals} deals · ${fmtUsd(s.disclosedUsd)} disclosed`}>
                <div className="truncate text-[10px] font-semibold capitalize text-white">{s.token}</div>
                <div className="font-mono text-[11px] tabular-nums text-white/85">{s.deals}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-white/35">Tile size is uniform; colour intensity = deal volume. Hover for disclosed value.</div>
        </Card>

        {/* regional density */}
        <Card className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Regional deal density</div>
          <div className="mt-4 space-y-2.5">
            {m.geoDensity.map((g) => (
              <div key={g.region}>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-medium text-white/85">{g.region}</span>
                  <span className="font-mono tabular-nums text-white/60">{g.deals.toLocaleString()} · {fmtUsd(g.disclosedUsd)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${(g.deals / geoMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* corridors */}
        <Card className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Cross-border corridors</div>
          {m.corridors.length ? (
            <div className="mt-4 space-y-2">
              {m.corridors.map((c) => (
                <div key={`${c.from}-${c.to}`} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px]">
                  <span className="text-white/80">{c.from} <span className="text-deal-300">→</span> {c.to}</span>
                  <span className="font-mono tabular-nums text-white/60">{c.deals} deals</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-[12px] text-white/45">Corridors require buyer-country coverage in the registry, which is still thin — they fill in as enrichment grows. No corridor is shown without both endpoints sourced.</div>
          )}
        </Card>

        {/* most active acquirers */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Most active acquirers</div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-[12.5px]">
              <tbody>
                {m.topAcquirers.slice(0, 25).map((a, i) => (
                  <tr key={a.buyer_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-2 font-mono text-white/40">{i + 1}</td>
                    <td className="px-5 py-2"><Link to={`/console/buyer/${a.buyer_id}`} className="font-semibold text-white hover:text-deal-300">{a.name}</Link></td>
                    <td className="px-3 py-2 text-right">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-deal-500" style={{ width: `${(a.deals / acquirerMax) * 100}%` }} />
                      </div>
                    </td>
                    <td className="px-5 py-2 text-right font-mono tabular-nums text-white/70">{a.deals}</td>
                    <td className="px-5 py-2 text-right font-mono tabular-nums text-deal-300" title="acquisitions in the last 3 years">{a.recentDeals}↑</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <p className="mt-6 text-[11px] text-white/35">
        Source: {m.source}. Every figure aggregates source-tagged acquisition events; nothing is modelled or estimated.
        Explore any buyer's full DNA from its profile, or run a precise query in the <Link to="/console/knowledge-graph" className="text-deal-300 hover:text-deal-200">Knowledge Graph</Link>.
      </p>
    </div>
  );
};

export default MarketMap;

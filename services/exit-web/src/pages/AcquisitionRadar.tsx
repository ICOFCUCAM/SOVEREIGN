import React, { useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Card, Kpi, SectionHeader, Field, inputCls } from "../lib/ui";
import { ACQ_INDEXES, fmtUsd } from "../lib/market-intel";
import { matchCompanyToCriteria, type AcquisitionCriteria } from "../lib/acquirer";
import { allListings, subscribeListings } from "../lib/listings";
import { captureDealEvent } from "../lib/deal-events";
import type { Region } from "@exit/engines";

// BUYER ACQUISITION COMMAND CENTER — the other side of the exchange. A buyer
// configures an acquisition mandate; ExitOS scores listed companies against
// it (Buyer → Company) and surfaces the sector intelligence for their space.
// Honest about the seed stage: opportunities = the live listings today, and
// the matching is earned on real company figures, not asserted.

const REGIONS: readonly Region[] = ["North America", "Europe", "Asia", "Middle East", "Oceania", "Latin America", "Africa", "Other"];
const SECTOR_OPTIONS = ACQ_INDEXES.indexes.map((i) => i.sector);

const AcquisitionRadar: React.FC = () => {
  const [sectors, setSectors] = useState<string[]>(["AI", "Software", "Developer Tools"]);
  const [minRevM, setMinRevM] = useState(5);
  const [maxRevM, setMaxRevM] = useState(500);
  const [regions, setRegions] = useState<Region[]>(["North America", "Europe"]);
  const [minGrowth, setMinGrowth] = useState(20);
  const [requested, setRequested] = useState<Record<string, boolean>>({});

  const criteria: AcquisitionCriteria = useMemo(() => ({
    sectors, minRevUsd: minRevM * 1e6, maxRevUsd: maxRevM * 1e6, regions, minGrowthPct: minGrowth / 100,
  }), [sectors, minRevM, maxRevM, regions, minGrowth]);

  // the live listing pool — every company founders have listed (anonymized).
  // matching scores the buyer's mandate against the whole pool.
  const listings = useSyncExternalStore(subscribeListings, allListings, allListings);
  const scored = useMemo(() => listings
    .map((l) => ({ listing: l, match: matchCompanyToCriteria(l.profile, criteria) }))
    .sort((a, b) => b.match.score - a.match.score), [listings, criteria]);
  const qualified = scored.filter((s) => s.match.qualified);

  // buyer-lens market intelligence: the indexes for the buyer's sectors
  const watch = ACQ_INDEXES.indexes.filter((i) => sectors.includes(i.sector));
  const watchVolume = watch.reduce((s, i) => s + i.volume, 0);
  const watchBuyers = new Set<string>(); watch.forEach((i) => { for (let k = 0; k < i.activeBuyers; k++) watchBuyers.add(`${i.sector}-${k}`); });

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void): void => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div>
      <SectionHeader
        kicker="Buyer Console · The other side"
        title="Acquisition Command Center"
        description="Configure your acquisition mandate and ExitOS continuously scans the network — scoring listed companies against your criteria and surfacing the sector intelligence in your space."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Target sectors" value={String(sectors.length)} sub="in your mandate" />
        <Kpi label="Sector deal volume" value={watchVolume.toLocaleString()} sub="indexed acquisitions" accent="#34d399" />
        <Kpi label="Active acquirers · your space" value={String(watch.reduce((m, i) => Math.max(m, i.activeBuyers), 0))} sub="competition" accent="#fbbf24" />
        <Kpi label="Qualified opportunities" value={String(qualified.length)} sub={`of ${listings.length} live listings`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* mandate config */}
        <Card className="space-y-4 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Acquisition mandate</div>
          <div>
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Sectors</span>
            <div className="flex flex-wrap gap-1.5">
              {SECTOR_OPTIONS.map((s) => (
                <button key={s} onClick={() => toggle(sectors, s, setSectors)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${sectors.includes(s) ? "bg-deal-600/25 text-white ring-1 ring-deal-400/40" : "bg-white/[0.03] text-white/50 hover:text-white"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min revenue ($M)"><input className={inputCls} inputMode="numeric" value={minRevM} onChange={(e) => setMinRevM(+e.target.value || 0)} /></Field>
            <Field label="Max revenue ($M)"><input className={inputCls} inputMode="numeric" value={maxRevM} onChange={(e) => setMaxRevM(+e.target.value || 0)} /></Field>
          </div>
          <Field label={`Min growth · ${minGrowth}%`}>
            <input type="range" min={0} max={100} value={minGrowth} onChange={(e) => setMinGrowth(+e.target.value)} className="w-full accent-deal-500" />
          </Field>
          <div>
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Regions</span>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((r) => (
                <button key={r} onClick={() => toggle(regions, r, setRegions)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${regions.includes(r) ? "bg-deal-600/25 text-white ring-1 ring-deal-400/40" : "bg-white/[0.03] text-white/50 hover:text-white"}`}>{r}</button>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {/* matched opportunities — the scored pool, anonymized */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Opportunities · scored against your mandate</span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-white/35">{listings.length} live listings</span>
            </div>
            {scored.map(({ listing: l, match }) => (
              <div key={l.id} className="border-b border-white/5 px-5 py-4 last:border-0">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="font-serif text-[17px] font-bold text-white">
                    {l.code} <span className="text-[12px] font-normal text-white/40">· {l.publicView.sector} · {l.publicView.region}</span>
                    {match.qualified && <span className="ml-2 rounded-full bg-deal-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-deal-300 ring-1 ring-deal-400/40">Qualified</span>}
                  </div>
                  <div className="font-mono text-2xl font-bold tabular-nums text-deal-300">{match.score}%</div>
                </div>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {match.reasons.map((r) => (
                    <div key={r.label} className="flex items-baseline gap-2 text-[11.5px]">
                      <span className={r.ok ? "text-deal-300" : "text-white/30"}>{r.ok ? "✓" : "✗"}</span>
                      <span><span className="font-semibold text-white/80">{r.label}.</span> <span className="text-white/50">{r.detail}</span></span>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11.5px] text-white/55">
                  <span>Revenue {fmtUsd(l.publicView.revenueUsd)}</span>
                  <span>· Growth {Math.round(l.publicView.growthPct * 100)}%</span>
                  <button
                    onClick={() => {
                      // a single buyer action emits two events the founder sees
                      // on their listing: the interest signal, then the NDA ask.
                      captureDealEvent({ actorRole: "buyer", kind: "expressed_interest", subjectType: "listing", subjectId: l.id, subjectName: l.code });
                      captureDealEvent({ actorRole: "buyer", kind: "nda_requested", subjectType: "listing", subjectId: l.id, subjectName: l.code });
                      setRequested((s) => ({ ...s, [l.id]: true }));
                    }}
                    className="ml-auto rounded-md bg-deal-500/90 px-3 py-1 text-[11px] font-semibold text-ink-950 transition hover:bg-deal-400 disabled:opacity-60"
                    disabled={!!requested[l.id]}>{requested[l.id] ? "✓ NDA requested" : "Express interest (request NDA)"}</button>
                </div>
              </div>
            ))}
            <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">
              Identities are withheld until NDA — buyers see sector, region, revenue band and growth. The pool grows as founders list; matching is the same engine at any scale.
            </div>
          </Card>

          {/* sector watch — buyer-lens intelligence */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Sector watch · your space</div>
            {watch.length ? (
              <table className="w-full text-[12.5px]">
                <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  <tr className="border-b border-white/10"><th className="px-5 py-2.5">Sector</th><th className="px-3 py-2.5 text-right">Volume</th><th className="px-3 py-2.5 text-right">12m trend</th><th className="px-3 py-2.5 text-right">Active buyers</th><th className="px-5 py-2.5 text-right">Median deal</th></tr>
                </thead>
                <tbody>
                  {watch.map((i) => (
                    <tr key={i.sector} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 font-medium text-white">{i.sector}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/75">{i.volume.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums">{i.trendPct == null ? <span className="text-white/30">—</span> : <span className={i.trendPct >= 0 ? "text-deal-300" : "text-red-300"}>{i.trendPct >= 0 ? "▲" : "▼"} {Math.abs(Math.round(i.trendPct * 100))}%</span>}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/70">{i.activeBuyers}</td>
                      <td className="px-5 py-2.5 text-right font-mono tabular-nums text-white/70">{i.medianDealUsd != null ? fmtUsd(i.medianDealUsd) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="px-5 py-4 text-[12px] text-white/45">Select target sectors to see their acquisition indexes.</div>}
            <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">Live ExitOS Acquisition Indexes for your mandate. Full set in <Link to="/console/indexes" className="text-deal-300 hover:text-deal-200">Acquisition Indexes</Link>.</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AcquisitionRadar;

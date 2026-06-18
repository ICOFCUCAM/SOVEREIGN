import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Field, inputCls, Button, notify } from "../lib/ui";
import { Panel, Frame, Rail, CommandHeader, CommandState } from "../lib/workstation";
import { ACQ_INDEXES, fmtUsd } from "../lib/market-intel";
import { matchCompanyToCriteria, type AcquisitionCriteria } from "../lib/acquirer";
import { allListings, subscribeListings } from "../lib/listings";
import { captureDealEvent } from "../lib/deal-events";
import { requestNda, submitOffer, startDeal, advanceDeal, saveMandate, myMandate } from "../lib/exit-api";
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
  const [themes, setThemes] = useState("");                 // strategic themes, comma-separated
  const [requested, setRequested] = useState<Record<string, boolean>>({});
  const [offerInput, setOfferInput] = useState<Record<string, string>>({});
  const [offered, setOffered] = useState<Record<string, boolean>>({});
  const [watched, setWatched] = useState<Record<string, boolean>>({});
  const [savedMandate, setSavedMandate] = useState(false);

  // hydrate the form from the buyer's persisted mandate, if one exists
  useEffect(() => {
    void myMandate().then((m) => {
      if (!m) return;
      setSectors([...m.sectors]); setRegions([...m.regions] as Region[]);
      setMinRevM(Math.round(m.minCheckUsd / 1e6)); setMaxRevM(Math.round(m.maxCheckUsd / 1e6));
      setMinGrowth(Math.round(m.minGrowthPct * 100)); setThemes(m.strategicThemes.join(", "));
      setSavedMandate(true);
    });
  }, []);

  const persistMandate = (): void => {
    void saveMandate({
      name: "Acquisition mandate",
      sectors, regions,
      minCheckUsd: minRevM * 1e6, maxCheckUsd: maxRevM * 1e6,
      minGrowthPct: minGrowth / 100,
      strategicThemes: themes.split(",").map((t) => t.trim()).filter(Boolean),
    }).then((m) => { if (m) { setSavedMandate(true); notify("Mandate published — founders can now match it"); } });
  };

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
  const maxActiveBuyers = watch.reduce((m, i) => Math.max(m, i.activeBuyers), 0);

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="Buyer Console"
        title="Acquisition Command Center"
        tag="Mandate"
        meta={[
          { k: "SECTORS", v: sectors.length },
          { k: "REGIONS", v: regions.length },
          { k: "REV BAND", v: `$${minRevM}–${maxRevM}M` },
          { k: "MIN GROWTH", v: `${minGrowth}%` },
        ]}
        metrics={[
          { k: "Target sectors", v: String(sectors.length), sub: "in your mandate" },
          { k: "Sector deal volume", v: watchVolume.toLocaleString(), accent: true, sub: "indexed acquisitions" },
          { k: "Active acquirers", v: String(maxActiveBuyers), sub: "competition · your space" },
          { k: "Qualified opportunities", v: String(qualified.length), accent: true, sub: `of ${listings.length} live listings` },
        ]}
      />


      <CommandState
        current={<><span className="font-mono text-white">{sectors.length}</span> target sectors · {listings.length} live listings · {regions.length} regions</>}
        changes={<>{watchVolume.toLocaleString()} indexed acquisitions in your space · {maxActiveBuyers} competing acquirers</>}
        action={qualified[0] ? <>Express interest in <span className="font-semibold text-white">{qualified[0].listing.code}</span> — {qualified[0].match.score}% match</> : <>Widen the mandate — no qualified listings yet</>}
        outcome={<><span className="font-mono text-white">{qualified.length}</span> qualified opportunities · identities reveal on NDA</>}
      />

      <Frame>
        {/* mandate config + nested intelligence rail */}
        <Rail className="lg:col-span-4">
        <Panel title="Acquisition mandate">
          <div className="space-y-3.5 p-3">
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Sector preferences</span>
              <div className="flex flex-wrap gap-1.5">
                {SECTOR_OPTIONS.map((s) => (
                  <button key={s} onClick={() => { toggle(sectors, s, setSectors); setSavedMandate(false); }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${sectors.includes(s) ? "bg-deal-600/25 text-white ring-1 ring-deal-400/40" : "bg-white/[0.03] text-white/50 hover:text-white"}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min check ($M)"><input className={inputCls} inputMode="numeric" value={minRevM} onChange={(e) => { setMinRevM(+e.target.value || 0); setSavedMandate(false); }} /></Field>
              <Field label="Max check ($M)"><input className={inputCls} inputMode="numeric" value={maxRevM} onChange={(e) => { setMaxRevM(+e.target.value || 0); setSavedMandate(false); }} /></Field>
            </div>
            <Field label={`Min growth · ${minGrowth}%`}>
              <input type="range" min={0} max={100} value={minGrowth} onChange={(e) => { setMinGrowth(+e.target.value); setSavedMandate(false); }} className="w-full accent-deal-500" />
            </Field>
            <div>
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Geography</span>
              <div className="flex flex-wrap gap-1.5">
                {REGIONS.map((r) => (
                  <button key={r} onClick={() => { toggle(regions, r, setRegions); setSavedMandate(false); }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${regions.includes(r) ? "bg-deal-600/25 text-white ring-1 ring-deal-400/40" : "bg-white/[0.03] text-white/50 hover:text-white"}`}>{r}</button>
                ))}
              </div>
            </div>
            <Field label="Strategic themes"><input className={inputCls} placeholder="ai infra, payments, vertical saas…" value={themes} onChange={(e) => { setThemes(e.target.value); setSavedMandate(false); }} /></Field>
            <div className="flex items-center gap-2 border-t border-white/10 pt-3">
              <Button onClick={persistMandate} className="!px-3 !py-1.5 !text-[12px]">{savedMandate ? "✓ Mandate published" : "Publish mandate"}</Button>
              {savedMandate && <span className="text-[10px] text-white/40">matchable by founders</span>}
            </div>
          </div>
        </Panel>
        </Rail>

        {/* matched opportunities — the scored pool, anonymized */}
        <Panel title="Opportunities · scored against your mandate" className="lg:col-span-8"
          right={<span className="font-mono text-[9px] uppercase tracking-wide text-white/35">{listings.length} live listings</span>}
          foot="Identities withheld until NDA — buyers see sector, region, revenue band and growth. The pool grows as founders list; matching is the same engine at any scale.">
          {scored.map(({ listing: l, match }) => (
              <div key={l.id} className="border-b border-white/5 px-4 py-3 last:border-0">
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
                      captureDealEvent({ actorRole: "buyer", kind: "added_to_outreach", subjectType: "listing", subjectId: l.id, subjectName: l.code });
                      setWatched((s) => ({ ...s, [l.id]: !s[l.id] }));
                    }}
                    className="rounded-md px-2 py-1 text-[11px] font-semibold text-white/60 ring-1 ring-white/10 transition hover:text-white">{watched[l.id] ? "★ Following" : "☆ Follow"}</button>
                  <button
                    onClick={() => {
                      // a single buyer action: captured telemetry the founder
                      // sees on their listing, AND a first-class NDA request
                      // record the founder resolves in their inbox.
                      captureDealEvent({ actorRole: "buyer", kind: "expressed_interest", subjectType: "listing", subjectId: l.id, subjectName: l.code });
                      captureDealEvent({ actorRole: "buyer", kind: "nda_requested", subjectType: "listing", subjectId: l.id, subjectName: l.code });
                      void requestNda(l.id);
                      void startDeal(l.id, "nda_requested");   // open the transaction
                      setRequested((s) => ({ ...s, [l.id]: true }));
                    }}
                    className="ml-auto rounded-md bg-deal-500/90 px-3 py-1 text-[11px] font-semibold text-ink-950 transition hover:bg-deal-400 disabled:opacity-60"
                    disabled={!!requested[l.id]}>{requested[l.id] ? "✓ NDA requested" : "Express interest (request NDA)"}</button>
                </div>
                {/* indicative offer — a first-class record the founder resolves */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px]">
                  <span className="text-white/40">Indicative offer</span>
                  <span className="text-white/30">$</span>
                  <input
                    className={`${inputCls} h-7 w-24 py-0`} inputMode="decimal" placeholder="M"
                    value={offerInput[l.id] ?? ""} onChange={(e) => setOfferInput((s) => ({ ...s, [l.id]: e.target.value }))} />
                  <span className="text-white/40">M</span>
                  <button
                    onClick={() => {
                      const m = parseFloat(offerInput[l.id] ?? ""); if (!m) return;
                      void submitOffer(l.id, m * 1e6);
                      // open (or fetch) the deal and advance it to IOI — emits the loi telemetry
                      void startDeal(l.id).then((d) => { if (d) void advanceDeal(d, "ioi", "buyer", l.code); });
                      setOffered((s) => ({ ...s, [l.id]: true }));
                    }}
                    className="rounded-md bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10 disabled:opacity-60"
                    disabled={!!offered[l.id]}>{offered[l.id] ? "✓ Offer submitted" : "Submit offer"}</button>
                </div>
              </div>
            ))}
        </Panel>
      </Frame>

      {/* sector watch — buyer-lens intelligence */}
      <Frame>
        <Panel title="Sector watch · your space" className="lg:col-span-12"
          foot={<>Live ExitOS Acquisition Indexes for your mandate. Full set in <Link to="/console/indexes" className="text-deal-300 hover:text-deal-200">Acquisition Indexes</Link>.</>}>
          {watch.length ? (
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
                <tr className="border-b border-white/10"><th className="px-3 py-1.5">Sector</th><th className="px-2 py-1.5 text-right">Volume</th><th className="px-2 py-1.5 text-right">12m trend</th><th className="px-2 py-1.5 text-right">Active buyers</th><th className="px-3 py-1.5 text-right">Median deal</th></tr>
              </thead>
              <tbody>
                {watch.map((i) => (
                  <tr key={i.sector} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-3 py-1.5 font-medium text-white">{i.sector}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/75">{i.volume.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums">{i.trendPct == null ? <span className="text-white/30">—</span> : <span className={i.trendPct >= 0 ? "text-deal-300" : "text-red-300"}>{i.trendPct >= 0 ? "▲" : "▼"} {Math.abs(Math.round(i.trendPct * 100))}%</span>}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/70">{i.activeBuyers}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-white/70">{i.medianDealUsd != null ? fmtUsd(i.medianDealUsd) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="px-3 py-3 text-[12px] text-white/45">Select target sectors to see their acquisition indexes.</div>}
        </Panel>
      </Frame>
    </div>
  );
};

export default AcquisitionRadar;

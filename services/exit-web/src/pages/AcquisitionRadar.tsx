import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Button, notify } from "../lib/ui";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { buildMarketTape } from "../lib/market-tape";
import { AcquisitionReactor, ReactorTelemetry } from "../components/Reactor";
import { ACQ_INDEXES, fmtUsd } from "../lib/market-intel";
import { matchCompanyToCriteria, type AcquisitionCriteria } from "../lib/acquirer";
import { allListings, subscribeListings, listingOrigin, type Listing } from "../lib/listings";
import { captureDealEvent } from "../lib/deal-events";
import { requestNda, submitOffer, startDeal, advanceDeal, saveMandate, myMandate } from "../lib/exit-api";
import PublishComposer from "../components/PublishComposer";
import type { Region } from "@exit/engines";
import { PageHeader, Section, Metric, ScrollRegion, ActionLink, Chip, Provenance, XO_INPUT, XO_LABEL } from "../components/xo";

// ── ACQUISITION RADAR · BUYER COMMAND CENTER ────────────────────────
// Page 04 of the ExitOS institutional redesign (docs/redesign/PAGE-04-
// ACQUISITION-RADAR.md). A buyer sets an acquisition mandate (left); listed
// companies are scored against it (centre) and can be followed, published,
// asked for an NDA or offered on; sector intelligence for the mandate's
// sectors follows. Matching is earned on real company figures.

const REGIONS: readonly Region[] = ["North America", "Europe", "Asia", "Middle East", "Oceania", "Latin America", "Africa", "Other"];
const SECTOR_OPTIONS = ACQ_INDEXES.indexes.map((i) => i.sector);
const AS_OF = DNA_AS_OF.slice(0, 10);   // registry snapshot date (not a live feed)
const SMALL_BTN = "rounded-sm border px-2.5 py-1 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";

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
  const [publish, setPublish] = useState<Listing | null>(null);

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
  const founderCount = listings.filter((l) => listingOrigin(l) === "founder").length;
  const seedCount = listings.length - founderCount;

  // buyer-lens market intelligence: the indexes for the buyer's sectors
  const watch = ACQ_INDEXES.indexes.filter((i) => sectors.includes(i.sector));
  const watchVolume = watch.reduce((s, i) => s + i.volume, 0);

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void): void => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const maxActiveBuyers = watch.reduce((m, i) => Math.max(m, i.activeBuyers), 0);
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="acquisition-radar" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Buyer Console" title="Acquisition Command Center"
        description="Set an acquisition mandate; every listed company is scored against it. Identities stay withheld until an NDA is signed.">
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-xo-line pt-2">
          {([["Sectors", sectors.length], ["Regions", regions.length], ["Revenue band", `$${minRevM}–${maxRevM}M`], ["Min growth", `${minGrowth}%`]] as const).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5"><dt className="text-[11px] text-xo-faint">{k}</dt><dd className="font-mono text-[12px] font-semibold tabular-nums">{v}</dd></div>
          ))}
        </dl>
      </PageHeader>

      <section aria-label="Mandate summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Target sectors" value={String(sectors.length)} sub="in your mandate" /></div>
        <div className="bg-xo-panel"><Metric label="Sector deal volume" value={watchVolume.toLocaleString()} sub="indexed acquisitions" /></div>
        <div className="bg-xo-panel"><Metric label="Active acquirers" value={String(maxActiveBuyers)} sub="competition · your space" /></div>
        <div className="bg-xo-panel"><Metric label="Qualified opportunities" value={String(qualified.length)} sub={`of ${listings.length} listings · ${founderCount} from founders, ${seedCount} demo/catalog`} /></div>
      </section>

      <RegistryTape items={tape} asOf={AS_OF} />

      <section aria-label="Decision brief" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line md:grid-cols-2 xl:grid-cols-4">
        {[
          { k: "Current state", body: <><span className="font-mono text-xo-text">{sectors.length}</span> target sectors · {listings.length} listings · {regions.length} regions</> },
          { k: "Recent changes", body: <>{watchVolume.toLocaleString()} indexed acquisitions in your space · {maxActiveBuyers} competing acquirers</> },
          { k: "Recommended action", body: qualified[0] ? <>Express interest in <span className="font-semibold text-xo-text">{qualified[0].listing.code}</span> — {qualified[0].match.score}% match</> : <>Widen the mandate — no qualified listings yet</> },
          { k: "Expected outcome", body: <><span className="font-mono text-xo-text">{qualified.length}</span> qualified opportunities · identities reveal on NDA</> },
        ].map((c) => (
          <div key={c.k} className="bg-xo-panel px-4 py-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-xo-faint">{c.k}</h2>
            <p className="mt-1 text-[13px] leading-snug text-xo-muted">{c.body}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ── mandate ──────────────────────────────────────────────── */}
        <div className="space-y-3 self-start">
          <Section title="Acquisition mandate" eyebrow="Your criteria" className="border border-xo-line">
            <div className="space-y-4 px-4 py-4">
              <fieldset>
                <legend className={XO_LABEL}>Sector preferences</legend>
                <div className="flex flex-wrap gap-1.5">
                  {SECTOR_OPTIONS.map((x) => <Chip key={x} pressed={sectors.includes(x)} onToggle={() => { toggle(sectors, x, setSectors); setSavedMandate(false); }}>{x}</Chip>)}
                </div>
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="radar-min" className={XO_LABEL}>Min check ($M)</label><input id="radar-min" className={`${XO_INPUT} font-mono`} inputMode="numeric" value={minRevM} onChange={(e) => { setMinRevM(+e.target.value || 0); setSavedMandate(false); }} /></div>
                <div><label htmlFor="radar-max" className={XO_LABEL}>Max check ($M)</label><input id="radar-max" className={`${XO_INPUT} font-mono`} inputMode="numeric" value={maxRevM} onChange={(e) => { setMaxRevM(+e.target.value || 0); setSavedMandate(false); }} /></div>
              </div>
              <div>
                <label htmlFor="radar-growth" className={XO_LABEL}>Min growth · <span className="font-mono">{minGrowth}%</span></label>
                <input id="radar-growth" type="range" min={0} max={100} value={minGrowth} onChange={(e) => { setMinGrowth(+e.target.value); setSavedMandate(false); }} className="w-full accent-emerald-500" />
              </div>
              <fieldset>
                <legend className={XO_LABEL}>Geography</legend>
                <div className="flex flex-wrap gap-1.5">
                  {REGIONS.map((r) => <Chip key={r} pressed={regions.includes(r)} onToggle={() => { toggle(regions, r, setRegions); setSavedMandate(false); }}>{r}</Chip>)}
                </div>
              </fieldset>
              <div><label htmlFor="radar-themes" className={XO_LABEL}>Strategic themes</label><input id="radar-themes" className={XO_INPUT} placeholder="ai infra, payments, vertical saas…" value={themes} onChange={(e) => { setThemes(e.target.value); setSavedMandate(false); }} /></div>
              <div className="flex flex-wrap items-center gap-2 border-t border-xo-line pt-3">
                <Button onClick={persistMandate}>{savedMandate ? "✓ Mandate published" : "Publish mandate"}</Button>
                {savedMandate && <span className="text-[12px] text-xo-faint">matchable by founders</span>}
              </div>
            </div>
          </Section>
          <Section title="Registry extremes" eyebrow={`Snapshot · as of ${AS_OF}`} className="border border-xo-line"><ReactorTelemetry /></Section>
        </div>

        {/* ── opportunities ────────────────────────────────────────── */}
        <Section title="Opportunities · scored against your mandate" eyebrow={`${listings.length} listings`} className="min-w-0 self-start border border-xo-line"
          foot={`Identities withheld until NDA — buyers see sector, region, revenue and growth. ${founderCount} of ${listings.length} listings come from founders; the rest are the bundled demo company and Sovereign product-catalog entries, labelled on each card.`}>
          <ol className="divide-y divide-xo-line">
            {scored.map(({ listing: l, match }) => (
              <li key={l.id} className="px-4 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-[16px] font-semibold">
                    {l.code} <span className="text-[12px] font-normal text-xo-muted">· {l.publicView.sector} · {l.publicView.region}</span>
                    {l.productMeta && <span className="ml-2 border border-xo-line px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] text-xo-muted">{l.productMeta.category}</span>}
                    {listingOrigin(l) === "demo" && <Provenance kind="demo" className="ml-2">Demo listing</Provenance>}
                    {listingOrigin(l) === "catalog" && <Provenance kind="registry" className="ml-2">Product catalog</Provenance>}
                    {match.qualified && <span className="ml-2 border border-xo-verified/50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] text-xo-verified">Qualified</span>}
                  </h3>
                  <span className="font-mono text-[22px] font-semibold tabular-nums text-xo-verified">{match.score}%<span className="sr-only"> match</span></span>
                </div>
                {l.productMeta && (
                  <>
                    <p className="mt-2 max-w-[75ch] text-[13px] leading-snug text-xo-muted">{l.productMeta.capability}</p>
                    {l.productMeta.coverage && l.productMeta.coverage.length > 0 && <p className="mt-1 text-[12px] text-xo-faint">Coverage · {l.productMeta.coverage.join(" · ")}</p>}
                    {l.productMeta.tags && l.productMeta.tags.length > 0 && (
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">{l.productMeta.tags.map((t) => <li key={t} className="border border-xo-line px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.06em] text-xo-muted">{t}</li>)}</ul>
                    )}
                  </>
                )}
                <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {match.reasons.map((r) => (
                    <li key={r.label} className="flex items-baseline gap-2 text-[12px]">
                      <span aria-hidden className={r.ok ? "text-xo-verified" : "text-xo-faint"}>{r.ok ? "✓" : "✗"}</span>
                      <span><span className="sr-only">{r.ok ? "Meets: " : "Does not meet: "}</span><span className="font-semibold text-xo-text">{r.label}.</span> <span className="text-xo-muted">{r.detail}</span></span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-xo-muted">
                  {l.productMeta
                    ? <>
                        {l.productMeta.valueText
                          ? <span>{l.productMeta.valueLabel ?? "Value"} <span className="font-mono font-semibold text-xo-text">{l.productMeta.valueText}</span></span>
                          : <span>Value on request</span>}
                        {l.productMeta.acquisitionReadyText && <span className="border border-xo-caution/50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.06em] text-xo-caution">Acquisition-ready · {l.productMeta.acquisitionReadyText}</span>}
                      </>
                    : l.publicView.disclosed === false
                      ? <span>Financials under NDA</span>
                      : <span className="font-mono tabular-nums">Revenue {fmtUsd(l.publicView.revenueUsd)} · Growth {Math.round(l.publicView.growthPct * 100)}%</span>}
                  <button type="button" aria-pressed={!!watched[l.id]}
                    onClick={() => {
                      captureDealEvent({ actorRole: "buyer", kind: "added_to_outreach", subjectType: "listing", subjectId: l.id, subjectName: l.code });
                      setWatched((st) => ({ ...st, [l.id]: !st[l.id] }));
                    }}
                    className={`${SMALL_BTN} border-xo-line text-xo-muted hover:text-xo-text`}>{watched[l.id] ? "★ Following" : "☆ Follow"}</button>
                  <button type="button" onClick={() => setPublish(l)} className={`${SMALL_BTN} border-xo-action/50 text-xo-action`}>↗ Publish</button>
                  <button type="button"
                    onClick={() => {
                      // a single buyer action: captured telemetry the founder
                      // sees on their listing, AND a first-class NDA request
                      // record the founder resolves in their inbox.
                      captureDealEvent({ actorRole: "buyer", kind: "expressed_interest", subjectType: "listing", subjectId: l.id, subjectName: l.code });
                      captureDealEvent({ actorRole: "buyer", kind: "nda_requested", subjectType: "listing", subjectId: l.id, subjectName: l.code });
                      void requestNda(l.id);
                      void startDeal(l.id, "nda_requested");   // open the transaction
                      setRequested((st) => ({ ...st, [l.id]: true }));
                    }}
                    className={`${SMALL_BTN} ml-auto border-xo-verified bg-xo-verified/90 text-ink-950 hover:bg-xo-verified`}
                    disabled={!!requested[l.id]}>{requested[l.id] ? "✓ NDA requested" : "Express interest (request NDA)"}</button>
                </div>
                {/* indicative offer — a first-class record the founder resolves */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                  <label htmlFor={`offer-${l.id}`} className="text-xo-muted">Indicative offer ($M)</label>
                  <input id={`offer-${l.id}`} className={`${XO_INPUT} w-28 py-1 font-mono`} inputMode="decimal" placeholder="M"
                    value={offerInput[l.id] ?? ""} onChange={(e) => setOfferInput((st) => ({ ...st, [l.id]: e.target.value }))} />
                  <button type="button"
                    onClick={() => {
                      const m = parseFloat(offerInput[l.id] ?? ""); if (!m) return;
                      void submitOffer(l.id, m * 1e6);
                      // open (or fetch) the deal and advance it to IOI — emits the loi telemetry
                      void startDeal(l.id).then((d) => { if (d) void advanceDeal(d, "ioi", "buyer", l.code); });
                      setOffered((st) => ({ ...st, [l.id]: true }));
                    }}
                    className={`${SMALL_BTN} border-xo-line text-xo-text hover:bg-xo-raise`}
                    disabled={!!offered[l.id]}>{offered[l.id] ? "✓ Offer submitted" : "Submit offer"}</button>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      {/* ── sector watch ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Acquisition reactor · your sectors" eyebrow="Sector volume" className="lg:col-span-4"
          foot={`Sector acquisition volume in the indexed registry (snapshot as of ${AS_OF}) — node size ∝ √volume, colour = 12-month trend. Rotation is decorative.`}>
          <AcquisitionReactor height={208} />
        </Section>
        <Section title="Sector watch · your space" eyebrow="Acquisition indexes" className="lg:col-span-8"
          foot={<>ExitOS Acquisition Indexes for your mandate's sectors, snapshot as of {AS_OF}. Full set in <ActionLink to="/console/indexes">Acquisition Indexes</ActionLink>.</>}>
          {watch.length ? (
            <ScrollRegion label="Sector watch table">
              <table className="w-full min-w-[520px] text-[13px]">
                <thead className="text-left text-[11px] text-xo-faint">
                  <tr className="border-b border-xo-line"><th scope="col" className="px-4 py-2 font-medium">Sector</th><th scope="col" className="px-2 py-2 text-right font-medium">Volume</th><th scope="col" className="px-2 py-2 text-right font-medium">12m trend</th><th scope="col" className="px-2 py-2 text-right font-medium">Active buyers</th><th scope="col" className="px-4 py-2 text-right font-medium">Median deal</th></tr>
                </thead>
                <tbody>
                  {watch.map((i) => (
                    <tr key={i.sector} className="border-b border-xo-line/60 last:border-0">
                      <th scope="row" className="px-4 py-2 text-left font-medium">{i.sector}</th>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{i.volume.toLocaleString()}</td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums">{i.trendPct == null ? <span className="text-xo-faint">—</span> : <span className={i.trendPct >= 0 ? "text-xo-verified" : "text-xo-risk"}>{i.trendPct >= 0 ? "▲" : "▼"} {Math.abs(Math.round(i.trendPct * 100))}%</span>}</td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{i.activeBuyers}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-xo-muted">{i.medianDealUsd != null ? fmtUsd(i.medianDealUsd) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          ) : <p className="px-4 py-3 text-[13px] text-xo-muted">Select target sectors to see their acquisition indexes.</p>}
        </Section>
      </div>

      <PublishComposer listing={publish ?? undefined} open={!!publish} onClose={() => setPublish(null)} />
    </div>
  );
};

export default AcquisitionRadar;

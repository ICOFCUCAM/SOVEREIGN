import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { IoiTermsFields, toTerms, EMPTY_IOI, type IoiDraft } from "../components/IoiTerms";
import { Button, notify } from "../lib/ui";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { buildMarketTape } from "../lib/market-tape";
import { AcquisitionReactor, ReactorTelemetry } from "../components/Reactor";
import { ACQ_INDEXES, fmtUsd } from "../lib/market-intel";
import { matchListingToCriteria, type AcquisitionCriteria } from "../lib/acquirer";
import { allListings, subscribeListings, listingOrigin, type Listing } from "../lib/listings";
import { captureDealEvent } from "../lib/deal-events";
import { requestNda, submitOffer, startDeal, advanceDeal, saveMandate, myMandate } from "../lib/exit-api";
import PublishComposer from "../components/PublishComposer";
import { ListingFactsView, ListingFactsStrip } from "../components/ListingFacts";
import { providerLabel } from "../lib/identity";
import type { Region } from "@exit/engines";
import { parseNumber } from "../lib/intake-fields";
import { plural } from "../lib/labels";
import { PageHeader, Section, ScrollRegion, ActionLink, Chip, Provenance, XO_INPUT, XO_LABEL } from "../components/xo";

// ── ACQUISITION RADAR · BUYER COMMAND CENTER ────────────────────────
// Page 04 of the ExitOS institutional redesign (docs/redesign/PAGE-04-
// ACQUISITION-RADAR.md). A buyer sets an acquisition mandate (left); listed
// companies are scored against it (centre) and can be followed, published,
// asked for an NDA or offered on; sector intelligence for the mandate's
// sectors follows. Matching is earned on real company figures.

const REGIONS: readonly Region[] = ["North America", "Europe", "Asia", "Middle East", "Oceania", "Latin America", "Africa", "Other"];
const SECTOR_OPTIONS = ACQ_INDEXES.indexes.map((i) => i.sector);
const AS_OF = DNA_AS_OF.slice(0, 10);   // registry snapshot date (not a live feed)
const SMALL_BTN = "rounded-[6px] border px-3 py-1.5 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";

// small line icons for the command center, drawn in the console's bronze
const ICON = {
  target: <><circle cx="10" cy="10" r="7" /><circle cx="10" cy="10" r="3.5" /><path d="M10 10l5-5M13 5h2v2" /></>,
  database: <><ellipse cx="10" cy="5" rx="6" ry="2.5" /><path d="M4 5v10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5M4 10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" /></>,
  people: <><circle cx="7.5" cy="7" r="2.6" /><circle cx="13.5" cy="7.8" r="2.1" /><path d="M2.8 16c.6-2.8 2.4-4.3 4.7-4.3s4.1 1.5 4.7 4.3M12.4 12.3c1.9-.2 3.6 1 4.2 3.7" /></>,
  diamond: <><path d="M5 3.5h10l3 4-8 9-8-9 3-4Z" /><path d="M2 7.5h16M8 3.5 7 7.5l3 9 3-9-1-4" /></>,
  layers: <><circle cx="7" cy="7" r="3" /><circle cx="13" cy="7" r="3" /><circle cx="10" cy="12.5" r="3" /></>,
  pulse: <><path d="M2 10h3.5l2-5 3 10 2.5-7 1.5 2H18" /></>,
  flag: <><path d="M5 17.5V3" /><path d="M5 3.5h9l-2 3.5 2 3.5H5" /></>,
  bulb: <><path d="M7 14h6M8 17h4M10 2.5a5 5 0 0 0-3 9c.6.5 1 1.2 1 2V14h4v-.5c0-.8.4-1.5 1-2a5 5 0 0 0-3-9Z" /></>,
  grid: <><rect x="3" y="3" width="5.5" height="5.5" rx="1" /><rect x="11.5" y="3" width="5.5" height="5.5" rx="1" /><rect x="3" y="11.5" width="5.5" height="5.5" rx="1" /><rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1" /></>,
  list: <><path d="M7 5h10M7 10h10M7 15h10" /><circle cx="3.5" cy="5" r=".8" /><circle cx="3.5" cy="10" r=".8" /><circle cx="3.5" cy="15" r=".8" /></>,
  filter: <><path d="M3 4h14l-5.5 6.5V16l-3 1.5v-7L3 4Z" /></>,
  sort: <><path d="M6 3v14M6 3 3 6M6 3l3 3M14 17V3M14 17l-3-3M14 17l3-3" /></>,
} as const;
const Ico: React.FC<{ name: keyof typeof ICON; size?: number; className?: string }> = ({ name, size = 20, className = "" }) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className}>{ICON[name]}</svg>
);

/** A small bar chart of real values (the tile's number broken down); the numbers are in the tile's title. */
const MiniBars: React.FC<{ values: readonly number[]; title: string }> = ({ values, title }) => {
  const max = Math.max(1, ...values);
  if (!values.length) return null;
  return (
    <span title={title} className="flex h-14 shrink-0 items-end gap-[4px]">
      <span className="sr-only">{title}</span>
      {values.slice(0, 10).map((v, i) => <span key={i} aria-hidden className={`${values.length < 5 ? "w-[8px]" : "w-[6px]"} rounded-t-[2px] bg-gradient-to-t from-[#9A7536] to-[#E2C07F]`} style={{ height: `${Math.max(10, (v / max) * 100)}%` }} />)}
    </span>
  );
};

/** A headline figure with its icon and the breakdown behind it. */
const KpiTile: React.FC<{ icon: keyof typeof ICON; label: string; value: string; sub: React.ReactNode; bars: readonly number[]; barsTitle: string }> = ({ icon, label, value, sub, bars, barsTitle }) => (
  <div className="flex items-center gap-4 rounded-[6px] border border-xo-line bg-xo-panel px-4 py-4">
    <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-xo-action/10 text-xo-action"><Ico name={icon} size={24} /></span>
    <div className="min-w-0 flex-1">
      <div className="text-[12px] text-xo-muted">{label}</div>
      <div className="mt-1 font-mono text-[24px] font-semibold leading-none tabular-nums text-xo-text">{value}</div>
      <div className="mt-1.5 truncate text-[11.5px] text-xo-faint" title={typeof sub === "string" ? sub : undefined}>{sub}</div>
    </div>
    <MiniBars values={bars} title={barsTitle} />
  </div>
);

type View = "list" | "grid";
type SortKey = "match" | "newest" | "name";
const SORT_LABEL: Record<SortKey, string> = { match: "Best match", newest: "Newest", name: "Name" };

const AcquisitionRadar: React.FC = () => {
  const [sectors, setSectors] = useState<string[]>(["AI", "Software", "Developer Tools"]);
  const [minRevM, setMinRevM] = useState(5);
  const [maxRevM, setMaxRevM] = useState(500);
  const [regions, setRegions] = useState<Region[]>(["North America", "Europe"]);
  const [minGrowth, setMinGrowth] = useState(20);
  // revenue band fields keep the typed text; only valid numbers apply
  const [revText, setRevText] = useState<{ min: string; max: string }>({ min: "5", max: "500" });
  const [offerError, setOfferError] = useState<Record<string, string>>({});
  // consequential actions ask first, then report what really happened
  const [pending, setPending] = useState<Record<string, "nda" | "offer" | undefined>>({});
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});
  const NOT_SENT = "Not sent — this session isn't connected to the deal backend, so nothing reached the founder.";
  const [themes, setThemes] = useState("");                 // strategic themes, comma-separated
  const [requested, setRequested] = useState<Record<string, boolean>>({});
  const [offerInput, setOfferInput] = useState<Record<string, string>>({});
  const [offered, setOffered] = useState<Record<string, boolean>>({});
  const [ioi, setIoi] = useState<Record<string, IoiDraft>>({});
  const [showTerms, setShowTerms] = useState<Record<string, boolean>>({});
  // each card opens on demand: folded, it shows the essentials; open, the full profile and the offer form
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [watched, setWatched] = useState<Record<string, boolean>>({});
  const [savedMandate, setSavedMandate] = useState(false);
  const [publish, setPublish] = useState<Listing | null>(null);
  const [view, setView] = useState<View>("list");
  const [sortBy, setSortBy] = useState<SortKey>("match");
  const [only, setOnly] = useState({ qualified: false, founders: false, hideDemo: false });

  // hydrate the form from the buyer's persisted mandate, if one exists
  useEffect(() => {
    void myMandate().then((m) => {
      if (!m) return;
      setSectors([...m.sectors]); setRegions([...m.regions] as Region[]);
      setMinRevM(m.minCheckUsd / 1e6); setMaxRevM(m.maxCheckUsd / 1e6);
      setRevText({ min: String(m.minCheckUsd / 1e6), max: String(m.maxCheckUsd / 1e6) });
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
    }).then((m) => { if (m) { setSavedMandate(true); notify("Mandate saved to your account"); } });
  };

  const criteria: AcquisitionCriteria = useMemo(() => ({
    sectors, minRevUsd: minRevM * 1e6, maxRevUsd: maxRevM * 1e6, regions, minGrowthPct: minGrowth / 100,
  }), [sectors, minRevM, maxRevM, regions, minGrowth]);

  // the live listing pool — every company founders have listed (anonymized).
  // matching scores the buyer's mandate against the whole pool.
  const listings = useSyncExternalStore(subscribeListings, allListings, allListings);
  const scored = useMemo(() => listings
    .map((l) => ({ listing: l, match: matchListingToCriteria(l.publicView, criteria) }))
    .sort((a, b) => b.match.score - a.match.score), [listings, criteria]);
  const qualified = scored.filter((s) => s.match.qualified);
  // what the listing column shows: the buyer's filters and sort over the scored pool
  const shown = useMemo(() => {
    const xs = scored.filter((s) => (!only.qualified || s.match.qualified) && (!only.founders || listingOrigin(s.listing) === "founder") && (!only.hideDemo || listingOrigin(s.listing) !== "demo"));
    if (sortBy === "newest") return [...xs].sort((a, b) => Date.parse(b.listing.listedAt) - Date.parse(a.listing.listedAt));
    if (sortBy === "name") return [...xs].sort((a, b) => a.listing.code.localeCompare(b.listing.code));
    return xs;
  }, [scored, only, sortBy]);
  const filterCount = Number(only.qualified) + Number(only.founders) + Number(only.hideDemo);
  const founderCount = listings.filter((l) => listingOrigin(l) === "founder").length;
  const seedCount = listings.length - founderCount;

  // buyer-lens market intelligence: the indexes for the buyer's sectors
  const watch = ACQ_INDEXES.indexes.filter((i) => sectors.includes(i.sector));
  const watchVolume = watch.reduce((s, i) => s + i.volume, 0);

  const REV = { min: 0, max: 100_000 };
  const minRes = parseNumber(revText.min, REV), maxRes = parseNumber(revText.max, REV);
  const bandError = minRes.ok && maxRes.ok && minRes.value > maxRes.value ? "Minimum is above maximum." : null;
  const typeRev = (which: "min" | "max", text: string): void => {
    const next = { ...revText, [which]: text };
    setRevText(next); setSavedMandate(false);
    const a = parseNumber(next.min, REV), b = parseNumber(next.max, REV);
    if (a.ok && b.ok && a.value <= b.value) { setMinRevM(a.value); setMaxRevM(b.value); }
  };
  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void): void => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const maxActiveBuyers = watch.reduce((m, i) => Math.max(m, i.activeBuyers), 0);
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="acquisition-radar" className="space-y-3 text-xo-text">
      <PageHeader serif eyebrow="◉ Buyer Console" title="Acquisition Command Center"
        description="Set an acquisition mandate; every listed company is scored against it. Identities stay withheld until an NDA is signed.">
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-xo-line pt-2">
          {([["Sectors", sectors.length], ["Regions", regions.length], ["Target revenue", `$${minRevM}–${maxRevM}M`], ["Min growth", `${minGrowth}%`]] as const).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5"><dt className="text-[11px] text-xo-faint">{k}</dt><dd className="font-mono text-[12px] font-semibold tabular-nums">{v}</dd></div>
          ))}
        </dl>
      </PageHeader>

      <section aria-label="Mandate summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile icon="target" label="Target sectors" value={String(sectors.length)} sub="in your mandate"
          bars={watch.map((i) => i.volume)} barsTitle={`Indexed acquisitions per target sector: ${watch.map((i) => `${i.sector} ${i.volume}`).join(", ") || "none"}`} />
        <KpiTile icon="database" label="Sector deal volume" value={watchVolume.toLocaleString()} sub="indexed acquisitions"
          bars={watch.flatMap((i) => [i.volumePrior12m, i.volume12m])} barsTitle={`Prior 12 months and last 12 months per sector: ${watch.map((i) => `${i.sector} ${i.volumePrior12m} → ${i.volume12m}`).join(", ") || "none"}`} />
        <KpiTile icon="people" label="Active acquirers" value={String(maxActiveBuyers)} sub="competition · your space"
          bars={watch.map((i) => i.activeBuyers)} barsTitle={`Distinct acquirers per sector: ${watch.map((i) => `${i.sector} ${i.activeBuyers}`).join(", ") || "none"}`} />
        <KpiTile icon="diamond" label="Qualified opportunities" value={String(qualified.length)} sub={`of ${plural(listings.length, "listing")} · ${founderCount} from founders, ${seedCount} demo/catalog`}
          bars={scored.slice(0, 10).map((x) => x.match.score)} barsTitle={`Best ten match scores: ${scored.slice(0, 10).map((x) => `${x.match.score}%`).join(", ")}`} />
      </section>

      <RegistryTape items={tape} asOf={AS_OF} />

      <section aria-label="Decision brief" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {([
          { icon: "layers", k: "Current state", body: <><span className="font-mono text-xo-text">{sectors.length}</span> target sectors · {plural(listings.length, "listing")} · {plural(regions.length, "region")}</> },
          { icon: "pulse", k: "Recent changes", body: <>{watchVolume.toLocaleString()} indexed acquisitions in your space · {maxActiveBuyers} competing acquirers</> },
          { icon: "flag", k: "Recommended action", body: qualified[0] ? <>Express interest in <span className="font-semibold text-xo-text">{qualified[0].listing.code}</span> — {qualified[0].match.score}% match</> : <>Widen the mandate — no qualified listings yet</> },
          { icon: "bulb", k: "Expected outcome", body: <><span className="font-mono text-xo-text">{qualified.length}</span> qualified opportunities · identities reveal on NDA</> },
        ] as Array<{ icon: keyof typeof ICON; k: string; body: React.ReactNode }>).map((c) => (
          <div key={c.k} className="flex items-start gap-3 rounded-[6px] border border-xo-line bg-xo-panel px-4 py-3">
            <Ico name={c.icon} size={26} className="mt-0.5 shrink-0 text-xo-action" />
            <div className="min-w-0">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-xo-faint">{c.k}</h2>
              <p className="mt-1 text-[13px] leading-snug text-xo-muted">{c.body}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ── mandate ──────────────────────────────────────────────── */}
        <div className="space-y-3 self-start">
          <Section title="Acquisition mandate" eyebrow="Your criteria" icon={<Ico name="target" size={26} />} className="rounded-[6px] border border-xo-line">
            <div className="space-y-4 px-4 py-4">
              <fieldset>
                <legend className={XO_LABEL}>Sector preferences</legend>
                <div className="flex flex-wrap gap-1.5">
                  {SECTOR_OPTIONS.map((x) => <Chip key={x} pressed={sectors.includes(x)} onToggle={() => { toggle(sectors, x, setSectors); setSavedMandate(false); }}>{x}</Chip>)}
                </div>
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
                {(["min", "max"] as const).map((w) => {
                  const res = w === "min" ? minRes : maxRes;
                  const err = !res.ok ? res.error : w === "max" ? bandError : null;
                  return (
                    <div key={w}>
                      <label htmlFor={`radar-${w}`} className={XO_LABEL}>Target revenue {w} ($M)</label>
                      <input id={`radar-${w}`} className={`${XO_INPUT} font-mono ${err ? "!border-xo-risk" : ""}`} inputMode="decimal" value={revText[w]}
                        onChange={(e) => typeRev(w, e.target.value)} aria-invalid={err ? true : undefined} aria-describedby={`radar-${w}-msg`} />
                      <span id={`radar-${w}-msg`} className={`mt-1 block text-[11px] ${err ? "text-xo-risk" : "text-xo-faint"}`}>{err ?? (w === "min" ? "Listed company's TTM revenue." : "Scoring uses the last valid band.")}</span>
                    </div>
                  );
                })}
              </div>
              <div>
                <label htmlFor="radar-growth" className={XO_LABEL}>Min growth · <span className="font-mono">{minGrowth}%</span></label>
                <input id="radar-growth" type="range" min={0} max={100} value={minGrowth} onChange={(e) => { setMinGrowth(+e.target.value); setSavedMandate(false); }} className="w-full accent-[#7E5E2E]" />
              </div>
              <fieldset>
                <legend className={XO_LABEL}>Geography</legend>
                <div className="flex flex-wrap gap-1.5">
                  {REGIONS.map((r) => <Chip key={r} pressed={regions.includes(r)} onToggle={() => { toggle(regions, r, setRegions); setSavedMandate(false); }}>{r}</Chip>)}
                </div>
              </fieldset>
              <div><label htmlFor="radar-themes" className={XO_LABEL}>Strategic themes</label><input id="radar-themes" className={XO_INPUT} placeholder="ai infra, payments, vertical saas…" value={themes} onChange={(e) => { setThemes(e.target.value); setSavedMandate(false); }} /></div>
              <div className="flex flex-wrap items-center gap-2 border-t border-xo-line pt-3">
                <Button onClick={persistMandate}>{savedMandate ? "✓ Mandate saved" : "Save mandate"}</Button>
                <span className="text-[12px] text-xo-faint">Saved to your account and used for scoring here. Founders don't see buyer mandates yet.</span>
              </div>
            </div>
          </Section>
          <Section title="Registry extremes" eyebrow={`Snapshot · as of ${AS_OF}`} className="rounded-[6px] border border-xo-line"><ReactorTelemetry /></Section>
        </div>

        {/* ── opportunities ────────────────────────────────────────── */}
        <Section title="Opportunities · scored against your mandate" eyebrow={plural(listings.length, "listing")} icon={<Ico name="target" size={24} />} className="min-w-0 self-start rounded-[6px] border border-xo-line"
          right={<div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Layout" className="flex overflow-hidden rounded-[6px] border border-xo-line">
              {(["grid", "list"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} title={v === "grid" ? "Grid" : "List"}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xo-action ${view === v ? "bg-xo-raise text-xo-text" : "text-xo-muted hover:text-xo-text"}`}>
                  <Ico name={v} size={15} />{v === "list" ? "List" : <span className="sr-only">Grid</span>}
                </button>
              ))}
            </div>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-[6px] border border-xo-line px-2.5 py-1.5 text-[12px] font-medium text-xo-text hover:bg-xo-raise [&::-webkit-details-marker]:hidden">
                <Ico name="filter" size={15} />Filters{filterCount > 0 && <span className="rounded-full bg-xo-action px-1.5 text-[10px] text-xo-panel">{filterCount}</span>}
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-60 space-y-2 rounded-[8px] border border-xo-line bg-xo-panel p-3 text-[12.5px] shadow-[0_16px_36px_-18px_rgba(40,30,15,0.45)]">
                {([["qualified", "Qualified only"], ["founders", "From founders only"], ["hideDemo", "Hide the demo listing"]] as const).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={only[k]} onChange={(e) => setOnly((o) => ({ ...o, [k]: e.target.checked }))} className="accent-[#7E5E2E]" />{label}</label>
                ))}
              </div>
            </details>
            <label className="flex items-center gap-1.5 rounded-[6px] border border-xo-line px-2.5 py-1 text-[12px] font-medium text-xo-text">
              <Ico name="sort" size={15} /><span className="sr-only">Sort by</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="bg-transparent py-0.5 focus-visible:outline-none">
                {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => <option key={k} value={k}>Sort: {SORT_LABEL[k]}</option>)}
              </select>
            </label>
          </div>}
          foot={`Identities withheld until NDA — buyers see what each business does, its stage, what is for sale, its model, stack, markets and asking price, with revenue and growth as brackets. ${founderCount} of ${plural(listings.length, "listing")} come from founders; the rest are the bundled demo company and Sovereign product-catalog entries, labelled on each card.`}>
          {shown.length === 0 && <p role="status" className="px-4 py-8 text-center text-[13px] text-xo-muted">No listing matches these filters.</p>}
          <ol className={view === "grid" ? "grid gap-px bg-xo-line sm:grid-cols-2" : "divide-y divide-xo-line"}>
            {shown.map(({ listing: l, match }) => (
              <li key={l.id} className={`bg-xo-panel px-4 py-4 ${view === "grid" ? "" : "sm:flex sm:gap-4"}`}>
                {/* the product's own logo when it has one; anonymous founder listings never show one */}
                {l.productMeta?.logoUrl && (
                  <span className={`mb-3 grid shrink-0 place-items-center overflow-hidden rounded-[8px] border border-xo-line bg-white p-2 sm:mb-0 ${view === "grid" ? "h-16 w-16" : "h-[72px] w-[72px]"}`}>
                    <img src={l.productMeta.logoUrl} alt={`${l.productMeta.productLine} logo`} loading="lazy" className="max-h-full max-w-full object-contain" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-[16px] font-semibold">
                    {l.code} <span className="text-[12px] font-normal text-xo-muted">· {l.publicView.sector} · {l.publicView.region === "Other" && l.facts ? "Global" : l.publicView.region}</span>
                    {l.productMeta && <span className="ml-2 border border-xo-line px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] text-xo-muted">{l.productMeta.category}</span>}
                    {listingOrigin(l) === "demo" && <Provenance kind="demo" className="ml-2">Demo listing</Provenance>}
                    {listingOrigin(l) === "catalog" && <Provenance kind="registry" className="ml-2">Product catalog</Provenance>}
                    {l.verification && <span title={`Owner's identity verified with ${providerLabel(l.verification.provider)} on ${new Date(l.verification.verifiedAt).toLocaleDateString()}`} className="ml-2 border border-xo-verified/50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] text-xo-verified">✓ Verified seller · {providerLabel(l.verification.provider)}</span>}
                    {match.qualified && <span className="ml-2 border border-xo-verified/50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] text-xo-verified">Qualified</span>}
                  </h3>
                  <span className="flex items-center gap-1">
                    <span className="font-mono text-[24px] font-semibold tabular-nums text-xo-verified">{match.score}%<span className="sr-only"> match</span></span>
                    <details className="relative">
                      <summary aria-label={`More actions for ${l.code}`} className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-full text-xo-muted hover:bg-xo-raise hover:text-xo-text [&::-webkit-details-marker]:hidden">
                        <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="3" r="1.4" /><circle cx="8" cy="8" r="1.4" /><circle cx="8" cy="13" r="1.4" /></svg>
                      </summary>
                      <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-[8px] border border-xo-line bg-xo-panel py-1 text-[12.5px] shadow-[0_16px_36px_-18px_rgba(40,30,15,0.45)]">
                        <button type="button" className="block w-full px-3 py-2 text-left hover:bg-xo-raise" onClick={(e) => { setOpen((st) => ({ ...st, [l.id]: !st[l.id] })); (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; }}>{open[l.id] ? "Hide details" : "View details"}</button>
                        <button type="button" className="block w-full px-3 py-2 text-left hover:bg-xo-raise" onClick={(e) => { setPublish(l); (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; }}>Publish</button>
                        <button type="button" className="block w-full px-3 py-2 text-left hover:bg-xo-raise" onClick={(e) => { void navigator.clipboard?.writeText(l.code).then(() => notify(`Copied ${l.code}`)); (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; }}>Copy listing code</button>
                      </div>
                    </details>
                  </span>
                </div>
                {(() => { const summary = l.facts?.summary ?? l.productMeta?.capability; return summary && (
                  <p className={`mt-2 max-w-[80ch] text-[13px] leading-relaxed text-xo-muted ${open[l.id] ? "" : "line-clamp-2"}`}>{summary}</p>
                ); })()}
                {l.facts && !open[l.id] && <ListingFactsStrip facts={l.facts} className="mt-2" />}
                {open[l.id] && (
                  <div id={`details-${l.id}`} className="mt-3 space-y-3 border-l-2 border-xo-action/40 pl-3">
                    {l.facts && <ListingFactsView facts={l.facts} showSummary={false} />}
                    {!l.facts && l.productMeta?.coverage && l.productMeta.coverage.length > 0 && <p className="text-[12px] text-xo-faint">Coverage · {l.productMeta.coverage.join(" · ")}</p>}
                    {l.productMeta?.tags && l.productMeta.tags.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">{l.productMeta.tags.map((t) => <li key={t} className="border border-xo-line px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.06em] text-xo-muted">{t}</li>)}</ul>
                    )}
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-xo-faint">Fit against your mandate</h4>
                      <ul className="mt-1 grid gap-1.5 sm:grid-cols-2">
                        {match.reasons.map((r) => (
                          <li key={r.label} className="flex items-baseline gap-2 text-[12px]">
                            <span aria-hidden className={r.ok ? "text-xo-verified" : "text-xo-faint"}>{r.ok ? "✓" : "✗"}</span>
                            <span><span className="sr-only">{r.ok ? "Meets: " : "Does not meet: "}</span><span className="font-semibold text-xo-text">{r.label}.</span> <span className="text-xo-muted">{r.detail}</span></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
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
                      : <span className="font-mono tabular-nums">Revenue {l.publicView.revenueBand?.label ?? "—"} · Growth {l.publicView.growthBand?.label ?? "—"}</span>}
                  <button type="button" aria-pressed={!!watched[l.id]}
                    onClick={() => {
                      // record the follow once, not again when unfollowing
                      if (!watched[l.id]) captureDealEvent({ actorRole: "buyer", kind: "added_to_outreach", subjectType: "listing", subjectId: l.id, subjectName: l.code });
                      setWatched((st) => ({ ...st, [l.id]: !st[l.id] }));
                    }}
                    className={`${SMALL_BTN} border-xo-line text-xo-muted hover:text-xo-text`}>{watched[l.id] ? "★ Following" : "☆ Follow"}</button>
                  <button type="button" onClick={() => setPublish(l)} className={`${SMALL_BTN} border-xo-action/50 text-xo-action`}>↗ Publish</button>
                  <button type="button" aria-expanded={!!open[l.id]} aria-controls={`details-${l.id}`} onClick={() => setOpen((st) => ({ ...st, [l.id]: !st[l.id] }))}
                    className={`${SMALL_BTN} border-xo-line text-xo-text hover:bg-xo-raise`}>{open[l.id] ? "Hide details ▴" : "View details ▾"}</button>
                  <button type="button" onClick={() => setPending((st) => ({ ...st, [l.id]: "nda" }))}
                    aria-expanded={pending[l.id] === "nda"} aria-controls={`confirm-${l.id}`}
                    className={`${SMALL_BTN} ml-auto rounded-[6px] border-xo-verified bg-xo-verified px-4 py-2 text-[12.5px] text-white hover:bg-xo-verified/90`}
                    disabled={!!requested[l.id]}>{requested[l.id] ? "✓ NDA requested" : "Express interest (request NDA)"}</button>
                </div>
                {/* indicative offer — a first-class record the founder resolves (in the open card) */}
                {(open[l.id] || offered[l.id]) && <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                  <label htmlFor={`offer-${l.id}`} className="text-xo-muted">Indicative offer ($M)</label>
                  <input id={`offer-${l.id}`} className={`${XO_INPUT} w-28 py-1 font-mono`} inputMode="decimal" placeholder="M"
                    value={offerInput[l.id] ?? ""} onChange={(e) => { setOfferInput((st) => ({ ...st, [l.id]: e.target.value })); setOfferError((st) => ({ ...st, [l.id]: "" })); }}
                    aria-invalid={offerError[l.id] ? true : undefined} aria-describedby={`offer-${l.id}-msg`} />
                  <button type="button"
                    onClick={() => {
                      const res = parseNumber(offerInput[l.id] ?? "", { min: 0.01, max: 1_000_000 });
                      if (!res.ok) { setOfferError((st) => ({ ...st, [l.id]: res.error.startsWith("Must be at least") || res.error.startsWith("Cannot") ? "Enter an amount above zero." : res.error })); return; }
                      setPending((st) => ({ ...st, [l.id]: "offer" }));
                    }}
                    className={`${SMALL_BTN} border-xo-line text-xo-text hover:bg-xo-raise`}
                    disabled={!!offered[l.id]}>{offered[l.id] ? "✓ Offer submitted" : "Submit offer"}</button>
                  <span id={`offer-${l.id}-msg`} role={offerError[l.id] ? "alert" : undefined} className="text-[11px] text-xo-risk">{offerError[l.id]}</span>
                  {!offered[l.id] && <button type="button" className="text-[11px] font-semibold text-xo-action hover:underline" aria-expanded={!!showTerms[l.id]} onClick={() => setShowTerms((st) => ({ ...st, [l.id]: !st[l.id] }))}>{showTerms[l.id] ? "Hide terms" : "Add terms (structured IOI)"}</button>}
                </div>}
                {open[l.id] && showTerms[l.id] && !offered[l.id] && <IoiTermsFields id={`ioi-${l.id}`} value={ioi[l.id] ?? EMPTY_IOI} onChange={(d) => setIoi((st) => ({ ...st, [l.id]: d }))} />}
                {pending[l.id] && (
                  <div id={`confirm-${l.id}`} role="group" aria-label="Confirm action" className="mt-3 border border-xo-caution/50 bg-xo-ink px-3 py-2 text-[12px]">
                    <p className="text-xo-text">{pending[l.id] === "nda"
                      ? <>This sends an NDA request for <span className="font-mono">{l.code}</span> to its founder and opens a deal record they can see. ExitOS does not reveal the company's identity; the founder shares it once an NDA is in place.</>
                      : <>This records an indicative offer of <span className="font-mono">${offerInput[l.id]}M</span> on <span className="font-mono">{l.code}</span> and moves the deal to indication of interest. The founder sees it in their inbox; it is not a binding offer.</>}</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" className={`${SMALL_BTN} border-xo-verified bg-xo-verified text-white`}
                        onClick={async () => {
                          const kind = pending[l.id];
                          setPending((st) => ({ ...st, [l.id]: undefined }));
                          if (kind === "nda") {
                            const req = await requestNda(l.id);
                            if (!req) { setActionMsg((st) => ({ ...st, [l.id]: NOT_SENT })); return; }
                            // a single buyer action: telemetry the founder sees on
                            // their listing, AND the NDA request record above.
                            captureDealEvent({ actorRole: "buyer", kind: "expressed_interest", subjectType: "listing", subjectId: l.id, subjectName: l.code });
                            captureDealEvent({ actorRole: "buyer", kind: "nda_requested", subjectType: "listing", subjectId: l.id, subjectName: l.code });
                            void startDeal(l.id, "nda_requested");   // open the transaction
                            setRequested((st) => ({ ...st, [l.id]: true }));
                            setActionMsg((st) => ({ ...st, [l.id]: "NDA request sent to the founder." }));
                          } else {
                            const res = parseNumber(offerInput[l.id] ?? "", { min: 0.01, max: 1_000_000 });
                            if (!res.ok) return;
                            const terms = toTerms(ioi[l.id] ?? EMPTY_IOI);
                            const offer = await submitOffer(l.id, res.value * 1e6, undefined, Object.keys(terms).length ? terms : undefined);
                            if (!offer) { setActionMsg((st) => ({ ...st, [l.id]: NOT_SENT })); return; }
                            // open (or fetch) the deal and advance it to IOI — emits the loi telemetry
                            void startDeal(l.id).then((d) => { if (d) void advanceDeal(d, "ioi", "buyer", l.code); });
                            setOffered((st) => ({ ...st, [l.id]: true }));
                            setActionMsg((st) => ({ ...st, [l.id]: "Indicative offer recorded and sent to the founder." }));
                          }
                        }}>{pending[l.id] === "nda" ? "Send NDA request" : "Submit offer"}</button>
                      <button type="button" className={`${SMALL_BTN} border-xo-line text-xo-muted`} onClick={() => setPending((st) => ({ ...st, [l.id]: undefined }))}>Cancel</button>
                    </div>
                  </div>
                )}
                {actionMsg[l.id] && <p role="status" className={`mt-2 text-[12px] ${actionMsg[l.id] === NOT_SENT ? "text-xo-caution" : "text-xo-verified"}`}>{actionMsg[l.id]}</p>}
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

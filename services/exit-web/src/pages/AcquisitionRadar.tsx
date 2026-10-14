import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { IoiTermsFields, toTerms, EMPTY_IOI, type IoiDraft } from "../components/IoiTerms";
import { Button, Modal, notify } from "../lib/ui";
import { useDocumentRemote } from "../lib/documents/remote";
import * as ws from "../lib/buyer-workspace";
import { STAGE_LABEL, FOR_SALE_LABEL, MODEL_LABEL, askingText } from "../lib/listing-facts";
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

// line icons for the panel headers and the listing toolbar
const ICON = {
  target: <><circle cx="10" cy="10" r="7" /><circle cx="10" cy="10" r="3.5" /><path d="M10 10l5-5M13 5h2v2" /></>,
  grid: <><rect x="3" y="3" width="5.5" height="5.5" rx="1" /><rect x="11.5" y="3" width="5.5" height="5.5" rx="1" /><rect x="3" y="11.5" width="5.5" height="5.5" rx="1" /><rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1" /></>,
  list: <><path d="M7 5h10M7 10h10M7 15h10" /><circle cx="3.5" cy="5" r=".8" /><circle cx="3.5" cy="10" r=".8" /><circle cx="3.5" cy="15" r=".8" /></>,
  filter: <><path d="M3 4h14l-5.5 6.5V16l-3 1.5v-7L3 4Z" /></>,
  sort: <><path d="M6 3v14M6 3 3 6M6 3l3 3M14 17V3M14 17l-3-3M14 17l3-3" /></>,
} as const;
const Ico: React.FC<{ name: keyof typeof ICON; size?: number }> = ({ name, size = 18 }) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{ICON[name]}</svg>
);

type View = "list" | "grid";
type SortKey = "match" | "newest" | "name";
const SORT_LABEL: Record<SortKey, string> = { match: "Best match", newest: "Newest", name: "Name" };
const FILTERS = [["qualified", "Qualified only"], ["founders", "From founders only"], ["hideDemo", "Hide the demo listing"]] as const;
type FilterKey = (typeof FILTERS)[number][0];
// the layout and sort are this viewer's preference, remembered in this browser
const PREF_KEY = "exitos.radar-view.v1";
const loadPref = (): { view: View; sort: SortKey } => {
  try { const p = JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}") as { view?: View; sort?: SortKey }; return { view: p.view === "grid" ? "grid" : "list", sort: p.sort && p.sort in SORT_LABEL ? p.sort : "match" }; } catch { return { view: "list", sort: "match" }; }
};

// saved views and the shortlist are this viewer's own, kept in this browser
interface SavedView { readonly name: string; readonly view: View; readonly sort: SortKey; readonly only: Record<FilterKey, boolean>; readonly tab: "all" | "shortlist" }
const VIEWS_KEY = "exitos.radar-saved-views.v1";
const SHORTLIST_KEY = "exitos.radar-shortlist.v1";
const readJson = <T,>(key: string, fallback: T): T => { try { return (JSON.parse(localStorage.getItem(key) ?? "null") as T | null) ?? fallback; } catch { return fallback; } };
const writeJson = (key: string, v: unknown): void => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* kept for this visit */ } };
// a score's colour by tier: strong green, middling bronze, weak grey
const scoreTone = (n: number): string => n >= 70 ? "text-[#2F6B3F] decoration-[#2F6B3F]/40" : n >= 40 ? "text-[#9A6A12] decoration-[#9A6A12]/40" : "text-[#756E63] decoration-[#756E63]/40";
const COMPARE_MAX = 3;

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
  // the shortlist: listings this buyer follows, each with an optional private note
  const [watched, setWatched] = useState<Record<string, boolean>>(() => readJson<{ watched?: Record<string, boolean> }>(SHORTLIST_KEY, {}).watched ?? {});
  const [notes, setNotes] = useState<Record<string, string>>(() => readJson<{ notes?: Record<string, string> }>(SHORTLIST_KEY, {}).notes ?? {});
  // signed in to a server account: the shortlist and views live on the account (and follow the buyer
  // across devices); otherwise they stay in this browser
  const remote = useDocumentRemote();
  const [synced, setSynced] = useState(false);
  useEffect(() => { if (!remote) writeJson(SHORTLIST_KEY, { watched, notes }); }, [remote, watched, notes]);
  useEffect(() => {
    if (!remote) { setSynced(false); return; }
    let live = true;
    void (async () => {
      try {
        const server = await ws.loadWorkspace<Omit<SavedView, "name">>(remote);
        // anything kept in this browser before the account existed moves up once, then is cleared here
        const local = { ...readJson<{ watched?: Record<string, boolean>; notes?: Record<string, string> }>(SHORTLIST_KEY, {}), views: readJson<SavedView[]>(VIEWS_KEY, []) };
        const up = ws.toUpload({ watched: local.watched ?? {}, notes: local.notes ?? {}, views: local.views }, server);
        await Promise.all([...up.shortlist.map((x) => ws.saveNote(remote, x.listing_id, x.note)), ...up.views.map(({ name, ...config }) => ws.saveView(remote, name, config))]);
        if (up.shortlist.length || up.views.length) { try { localStorage.removeItem(SHORTLIST_KEY); localStorage.removeItem(VIEWS_KEY); } catch { /* ignore */ } }
        if (!live) return;
        const all = [...server.shortlist, ...up.shortlist];
        setWatched(Object.fromEntries(all.map((x) => [x.listing_id, true])));
        setNotes(Object.fromEntries(all.filter((x) => x.note).map((x) => [x.listing_id, x.note])));
        setViews([...server.views.map((v) => ({ ...(v.config as Omit<SavedView, "name">), name: v.name })), ...up.views]);
        setSynced(true);
      } catch (e) { notify((e as Error).message); }
    })();
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per account
  }, [remote?.accessToken]);
  // a note is saved to the account a moment after typing stops
  const noteTimers = React.useRef<Record<string, number>>({});
  const editNote = (id: string, text: string): void => {
    setNotes((n) => ({ ...n, [id]: text }));
    if (!remote) return;
    window.clearTimeout(noteTimers.current[id]);
    noteTimers.current[id] = window.setTimeout(() => { void ws.saveNote(remote, id, text).catch((e: Error) => notify(e.message)); }, 600);
  };
  const toggleFollow = (id: string, on: boolean): void => {
    setWatched((st) => ({ ...st, [id]: on }));
    if (remote) void (on ? ws.follow(remote, id) : ws.unfollow(remote, id)).catch((e: Error) => { notify(e.message); setWatched((st) => ({ ...st, [id]: !on })); });
  };
  const [tab, setTab] = useState<"all" | "shortlist">("all");
  const [compare, setCompare] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [views, setViews] = useState<SavedView[]>(() => readJson<SavedView[]>(VIEWS_KEY, []));
  const [viewName, setViewName] = useState("");
  const [savedMandate, setSavedMandate] = useState(false);
  const [publish, setPublish] = useState<Listing | null>(null);
  const [view, setViewState] = useState<View>(() => loadPref().view);
  const [sortBy, setSortState] = useState<SortKey>(() => loadPref().sort);
  const savePref = (v: View, s: SortKey): void => { try { localStorage.setItem(PREF_KEY, JSON.stringify({ view: v, sort: s })); } catch { /* kept for this visit */ } };
  const setView = (v: View): void => { setViewState(v); savePref(v, sortBy); };
  const setSortBy = (s: SortKey): void => { setSortState(s); savePref(view, s); };
  const [only, setOnly] = useState<Record<FilterKey, boolean>>({ qualified: false, founders: false, hideDemo: false });

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
    const xs = scored.filter((s) => (tab === "all" || watched[s.listing.id]) && (!only.qualified || s.match.qualified) && (!only.founders || listingOrigin(s.listing) === "founder") && (!only.hideDemo || listingOrigin(s.listing) !== "demo"));
    if (sortBy === "newest") return [...xs].sort((a, b) => Date.parse(b.listing.listedAt) - Date.parse(a.listing.listedAt));
    if (sortBy === "name") return [...xs].sort((a, b) => a.listing.code.localeCompare(b.listing.code));
    return xs;
  }, [scored, only, sortBy, tab, watched]);
  const shortlistCount = scored.filter((s) => watched[s.listing.id]).length;
  const saveView = (): void => {
    const name = viewName.trim(); if (!name) return;
    const next = [...views.filter((v) => v.name !== name), { name, view, sort: sortBy, only, tab }];
    setViews(next); setViewName("");
    if (remote) void ws.saveView(remote, name, { view, sort: sortBy, only, tab }).then(() => notify(`View saved to your account · ${name}`), (e: Error) => notify(e.message));
    else { writeJson(VIEWS_KEY, next); notify(`View saved in this browser · ${name}`); }
  };
  const applyView = (v: SavedView): void => { setView(v.view); setSortBy(v.sort); setOnly(v.only); setTab(v.tab); notify(`View applied · ${v.name}`); };
  const deleteView = (name: string): void => {
    const next = views.filter((v) => v.name !== name); setViews(next);
    if (remote) void ws.deleteView(remote, name).catch((e: Error) => notify(e.message)); else writeJson(VIEWS_KEY, next);
  };
  const toggleCompare = (id: string): void => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= COMPARE_MAX ? c : [...c, id]));
  const compared = compare.map((id) => scored.find((s) => s.listing.id === id)).filter((x): x is (typeof scored)[number] => !!x);
  const activeFilters = FILTERS.filter(([k]) => only[k]);
  // menus close on a click elsewhere or on Escape, as menus do
  useEffect(() => {
    const close = (e: Event): void => {
      document.querySelectorAll<HTMLDetailsElement>("details[data-autoclose][open]").forEach((d) => {
        if (e.type === "keydown" ? (e as KeyboardEvent).key === "Escape" : !d.contains(e.target as Node)) d.open = false;
      });
    };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, []);
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
      <PageHeader eyebrow="◉ Buyer Console" title="Acquisition Command Center"
        description="Set an acquisition mandate; every listed company is scored against it. Identities stay withheld until an NDA is signed.">
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-xo-line pt-2">
          {([["Sectors", sectors.length], ["Regions", regions.length], ["Target revenue", `$${minRevM}–${maxRevM}M`], ["Min growth", `${minGrowth}%`]] as const).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5"><dt className="text-[11px] text-xo-faint">{k}</dt><dd className="font-mono text-[12px] font-semibold tabular-nums">{v}</dd></div>
          ))}
        </dl>
      </PageHeader>

      <section aria-label="Mandate summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="xo-tile bg-xo-panel"><Metric label="Target sectors" value={String(sectors.length)} sub="in your mandate" /></div>
        <div className="xo-tile bg-xo-panel"><Metric label="Sector deal volume" value={watchVolume.toLocaleString()} sub="indexed acquisitions" /></div>
        <div className="xo-tile bg-xo-panel"><Metric label="Active acquirers" value={String(maxActiveBuyers)} sub="competition · your space" /></div>
        <div className="xo-tile bg-xo-panel"><Metric label="Qualified opportunities" value={String(qualified.length)} sub={`of ${plural(listings.length, "listing")} · ${founderCount} from founders, ${seedCount} demo/catalog`} /></div>
      </section>

      <RegistryTape items={tape} asOf={AS_OF} />

      <section aria-label="Decision brief" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line md:grid-cols-2 xl:grid-cols-4">
        {[
          { k: "Current state", body: <><span className="font-mono text-xo-text">{sectors.length}</span> target sectors · {plural(listings.length, "listing")} · {plural(regions.length, "region")}</> },
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
          <Section title="Acquisition mandate" eyebrow="Your criteria" icon={<Ico name="target" size={20} />} className="border border-xo-line">
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
                <Button onClick={persistMandate}>{savedMandate ? "✓ Mandate saved" : "Save mandate"}</Button>
                <span className="text-[12px] text-xo-faint">Saved to your account and used for scoring here. Founders don't see buyer mandates yet.</span>
              </div>
            </div>
          </Section>
          <Section title="Registry extremes" eyebrow={`Snapshot · as of ${AS_OF}`} className="border border-xo-line"><ReactorTelemetry /></Section>
        </div>

        {/* ── opportunities ────────────────────────────────────────── */}
        <Section title="Opportunities · scored against your mandate" eyebrow={plural(listings.length, "listing")} icon={<Ico name="target" size={20} />} className="min-w-0 self-start border border-xo-line"
          right={<div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Layout" className="flex overflow-hidden rounded-[6px] border border-xo-line">
              {(["grid", "list"] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} title={v === "grid" ? "Grid" : "List"}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xo-action ${view === v ? "bg-xo-raise text-xo-text" : "text-xo-muted hover:text-xo-text"}`}>
                  <Ico name={v} size={15} />{v === "list" ? "List" : <span className="sr-only">Grid</span>}
                </button>
              ))}
            </div>
            <details data-autoclose className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-[6px] border border-xo-line px-2.5 py-1.5 text-[12px] font-medium text-xo-text hover:bg-xo-raise [&::-webkit-details-marker]:hidden">
                <svg aria-hidden width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><path d="M5 3h10v14l-5-3.5L5 17V3Z" /></svg>Views{views.length > 0 && <span className="text-xo-faint">{views.length}</span>}
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-72 rounded-[8px] border border-xo-line bg-xo-panel p-3 text-[12.5px] shadow-[0_16px_36px_-18px_rgba(40,30,15,0.45)]">
                {views.length === 0 ? <p className="text-xo-faint">No saved views yet. Set the layout, filters and sort, then save them here.</p> : (
                  <ul className="space-y-1">{views.map((v) => (
                    <li key={v.name} className="flex items-center gap-2">
                      <button type="button" onClick={() => applyView(v)} className="min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left hover:bg-xo-raise" title={`${v.tab === "shortlist" ? "Shortlist · " : ""}${SORT_LABEL[v.sort]} · ${v.view}${FILTERS.filter(([k]) => v.only[k]).map(([, l]) => ` · ${l}`).join("")}`}>{v.name}</button>
                      <button type="button" onClick={() => deleteView(v.name)} aria-label={`Delete view ${v.name}`} className="rounded px-1 text-xo-faint hover:text-xo-risk">✕</button>
                    </li>
                  ))}</ul>
                )}
                <p className="mt-3 border-t border-xo-line pt-2 text-[11px] text-xo-faint">{remote ? (synced ? "Saved to your account · on every device you sign in on" : "Connecting to your account…") : "Kept in this browser · sign in with an account to use them on every device"}</p>
                <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); saveView(); }}>
                  <label className="sr-only" htmlFor="radar-view-name">Name this view</label>
                  <input id="radar-view-name" className={`${XO_INPUT} py-1`} placeholder="Name this view" maxLength={40} value={viewName} onChange={(e) => setViewName(e.target.value)} />
                  <button type="submit" disabled={!viewName.trim()} className={`${SMALL_BTN} border-xo-action/50 text-xo-action`}>Save</button>
                </form>
              </div>
            </details>
            <details data-autoclose className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-[6px] border border-xo-line px-2.5 py-1.5 text-[12px] font-medium text-xo-text hover:bg-xo-raise [&::-webkit-details-marker]:hidden">
                <Ico name="filter" size={15} />Filters{activeFilters.length > 0 && <span className="rounded-full bg-xo-action px-1.5 text-[10px] text-xo-panel">{activeFilters.length}</span>}
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-60 space-y-2 rounded-[8px] border border-xo-line bg-xo-panel p-3 text-[12.5px] shadow-[0_16px_36px_-18px_rgba(40,30,15,0.45)]">
                {FILTERS.map(([k, label]) => (
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
          {/* what is on screen, and each active filter as a removable chip */}
          <div className="flex flex-wrap items-center gap-2 border-b border-xo-line px-4 py-2 text-[12px] text-xo-muted" aria-live="polite">
            <div role="tablist" aria-label="Which listings" className="mr-2 flex overflow-hidden rounded-[6px] border border-xo-line">
              {(["all", "shortlist"] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                  className={`px-2.5 py-1 font-medium transition ${tab === t ? "bg-xo-raise text-xo-text" : "text-xo-muted hover:text-xo-text"}`}>
                  {t === "all" ? "All listings" : <>Shortlist <span className="font-mono">{shortlistCount}</span></>}
                </button>
              ))}
            </div>
            <span>Showing <span className="font-mono text-xo-text">{shown.length}</span> of {plural(listings.length, "listing")} · {SORT_LABEL[sortBy].toLowerCase()}</span>
            {activeFilters.map(([k, label]) => (
              <button key={k} type="button" onClick={() => setOnly((o) => ({ ...o, [k]: false }))} aria-label={`Remove filter: ${label}`}
                className="inline-flex items-center gap-1 rounded-full border border-xo-action/40 bg-xo-action/10 px-2 py-0.5 text-[11.5px] text-xo-text hover:border-xo-action">
                {label} <span aria-hidden>✕</span>
              </button>
            ))}
            {activeFilters.length > 1 && <button type="button" onClick={() => setOnly({ qualified: false, founders: false, hideDemo: false })} className="text-[11.5px] font-medium text-xo-action hover:underline">Clear all</button>}
          </div>
          {shown.length === 0 && <p role="status" className="px-4 py-8 text-center text-[13px] text-xo-muted">{tab === "shortlist" && shortlistCount === 0 ? "Your shortlist is empty. Follow a listing to keep it here, with your own notes." : "No listing matches these filters."}</p>}
          <ol className={view === "grid" ? "grid gap-px bg-xo-line sm:grid-cols-2" : "divide-y divide-xo-line"}>
            {shown.map(({ listing: l, match }) => (
              <li key={l.id} className="bg-xo-panel px-4 py-4 transition-colors hover:bg-[#FBF6EC]">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="text-[16px] font-semibold">
                    {l.code} <span className="text-[12px] font-normal text-xo-muted">· {l.publicView.sector} · {l.publicView.region === "Other" && l.facts ? "Global" : l.publicView.region}</span>
                    {l.productMeta && <span className="ml-2 border border-xo-line px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] text-xo-muted">{l.productMeta.category}</span>}
                    {listingOrigin(l) === "demo" && <Provenance kind="demo" className="ml-2">Demo listing</Provenance>}
                    {listingOrigin(l) === "catalog" && <Provenance kind="registry" className="ml-2">Product catalog</Provenance>}
                    {l.verification && <span title={`Owner's identity verified with ${providerLabel(l.verification.provider)} on ${new Date(l.verification.verifiedAt).toLocaleDateString()}`} className="ml-2 border border-xo-verified/50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] text-xo-verified">✓ Verified seller · {providerLabel(l.verification.provider)}</span>}
                    {match.qualified && <span className="ml-2 border border-xo-verified/50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] text-xo-verified">Qualified</span>}
                  </h3>
                  <span className="group/score relative">
                    <button type="button" aria-describedby={`why-${l.id}`} className={`rounded font-mono text-[22px] font-semibold tabular-nums underline decoration-dotted underline-offset-4 ${scoreTone(match.score)} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action`}>
                      {match.score}%<span className="sr-only"> match</span>
                    </button>
                    <span id={`why-${l.id}`} role="tooltip" className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden w-72 rounded-[8px] border border-xo-line bg-xo-panel p-3 text-left text-[12px] shadow-[0_16px_36px_-18px_rgba(40,30,15,0.45)] group-hover/score:block group-focus-within/score:block">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-xo-faint">Why {match.score}% · {match.reasons.filter((r) => r.ok).length} of {match.reasons.length} criteria met</span>
                      {match.reasons.map((r) => (
                        <span key={r.label} className="mt-1.5 flex items-baseline gap-2">
                          <span aria-hidden className={r.ok ? "text-xo-verified" : "text-xo-risk"}>{r.ok ? "✓" : "✗"}</span>
                          <span><span className="sr-only">{r.ok ? "Meets: " : "Does not meet: "}</span><span className="font-semibold text-xo-text">{r.label}</span> <span className="text-xo-muted">{r.detail}</span></span>
                        </span>
                      ))}
                    </span>
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
                      toggleFollow(l.id, !watched[l.id]);
                    }}
                    className={`${SMALL_BTN} border-xo-line text-xo-muted hover:text-xo-text`}>{watched[l.id] ? "★ Following" : "☆ Follow"}</button>
                  <button type="button" onClick={() => setPublish(l)} className={`${SMALL_BTN} border-xo-action/50 text-xo-action`}>↗ Publish</button>
                  <button type="button" aria-expanded={!!open[l.id]} aria-controls={`details-${l.id}`} onClick={() => setOpen((st) => ({ ...st, [l.id]: !st[l.id] }))}
                    className={`${SMALL_BTN} border-xo-line text-xo-text hover:bg-xo-raise`}>{open[l.id] ? "Hide details ▴" : "View details ▾"}</button>
                  <label className={`flex items-center gap-1.5 ${!compare.includes(l.id) && compare.length >= COMPARE_MAX ? "opacity-50" : ""}`} title={!compare.includes(l.id) && compare.length >= COMPARE_MAX ? `Compare up to ${COMPARE_MAX} at a time` : undefined}>
                    <input type="checkbox" checked={compare.includes(l.id)} disabled={!compare.includes(l.id) && compare.length >= COMPARE_MAX} onChange={() => toggleCompare(l.id)} className="accent-[#7E5E2E]" />Compare
                  </label>
                  <button type="button" onClick={() => setPending((st) => ({ ...st, [l.id]: "nda" }))}
                    aria-expanded={pending[l.id] === "nda"} aria-controls={`confirm-${l.id}`}
                    className={`${SMALL_BTN} ml-auto border-xo-verified bg-xo-verified/90 text-ink-950 hover:bg-xo-verified`}
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
                      <button type="button" className={`${SMALL_BTN} border-xo-verified bg-xo-verified/90 text-ink-950`}
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
                {tab === "shortlist" && watched[l.id] && (
                  <div className="mt-3">
                    <label htmlFor={`note-${l.id}`} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-xo-faint">Your note · private, {remote ? "saved to your account" : "kept in this browser"}</label>
                    <textarea id={`note-${l.id}`} rows={2} maxLength={600} value={notes[l.id] ?? ""} onChange={(e) => editNote(l.id, e.target.value)}
                      placeholder="Why it is on your shortlist, questions for the founder, next step…" className={`${XO_INPUT} mt-1 resize-y`} />
                  </div>
                )}
                {actionMsg[l.id] && <p role="status" className={`mt-2 text-[12px] ${actionMsg[l.id] === NOT_SENT ? "text-xo-caution" : "text-xo-verified"}`}>{actionMsg[l.id]}</p>}
              </li>
            ))}
          </ol>
          {compare.length > 0 && (
            <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t border-xo-line bg-xo-panel/95 px-4 py-2.5 text-[12.5px] backdrop-blur">
              <span className="text-xo-muted">Comparing <span className="font-mono text-xo-text">{compare.length}</span> of {COMPARE_MAX}: {compared.map((x) => x.listing.code).join(" · ")}</span>
              <button type="button" onClick={() => setCompare([])} className="text-xo-action hover:underline">Clear</button>
              <Button className="ml-auto" disabled={compare.length < 2} onClick={() => setComparing(true)}>{compare.length < 2 ? "Pick one more to compare" : "Compare side by side →"}</Button>
            </div>
          )}
        </Section>
      </div>
      <Modal open={comparing && compared.length >= 2} onClose={() => setComparing(false)} title="Compare listings" subtitle="Side by side, as buyers see them before an NDA" size="xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[12.5px]">
            <thead><tr className="border-b border-xo-line">
              <th className="w-44 py-2 pr-3 font-medium text-xo-faint"><span className="sr-only">Fact</span></th>
              {compared.map((x) => <th key={x.listing.id} scope="col" className="py-2 pr-3 text-[14px] font-semibold text-xo-text">{x.listing.code}</th>)}
            </tr></thead>
            <tbody>
              {([
                ["Match", (x) => <span className={`font-mono font-semibold ${scoreTone(x.match.score).split(" ")[0]}`}>{x.match.score}%</span>],
                ["Criteria met", (x) => `${x.match.reasons.filter((r) => r.ok).length} of ${x.match.reasons.length}`],
                ["Sector · region", (x) => `${x.listing.publicView.sector} · ${x.listing.publicView.region === "Other" && x.listing.facts ? "Global" : x.listing.publicView.region}`],
                ["Stage", (x) => (x.listing.facts?.stage ? STAGE_LABEL[x.listing.facts.stage] : "—")],
                ["Revenue · growth", (x) => (x.listing.publicView.disclosed === false ? "Under NDA" : `${x.listing.publicView.revenueBand?.label ?? "—"} · ${x.listing.publicView.growthBand?.label ?? "—"}`)],
                ["Asking", (x) => (x.listing.facts ? askingText(x.listing.facts) : x.listing.productMeta?.valueText ?? "On request")],
                ["How it makes money", (x) => x.listing.facts?.models.map((m) => MODEL_LABEL[m]).join(" · ") || "—"],
                ["What is for sale", (x) => x.listing.facts?.forSale.map((f) => FOR_SALE_LABEL[f]).join(" · ") || "—"],
                ["Based in", (x) => x.listing.facts?.basedIn || "—"],
                ["Origin", (x) => ({ founder: "Founder listing", demo: "Demo listing", catalog: "Product catalog" } as Record<string, string>)[listingOrigin(x.listing)] ?? "—"],
              ] as Array<[string, (x: (typeof compared)[number]) => React.ReactNode]>).map(([k, f]) => (
                <tr key={k} className="border-b border-xo-line align-top">
                  <th scope="row" className="py-2 pr-3 font-medium text-xo-faint">{k}</th>
                  {compared.map((x) => <td key={x.listing.id} className="py-2 pr-3 text-xo-text">{f(x)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

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

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { listDocuments, type DocListItem, type Lifecycle, humanError } from "../lib/api";
import { recordTypeLabel } from "../lib/recordTypes";
import { timeAgo } from "../lib/ui";
import { fmtDate, recordNo, waited } from "../lib/format";
import { Alert, Button, ClassificationMark, EmptyState, Highlight, LifecycleStatus, PageHeader, Panel, Segmented, SkeletonRows, controlCls, cx, lifecycleMeta, postureText, selectCls, useDensity, useHotkeys } from "../components/console/ds";
import { Icon } from "../components/console/icons";

const STATES: (Lifecycle | "")[] = ["", "in_review", "approved", "rendered", "published", "withdrawn", "archived", "rejected", "draft"];
const LIMIT = 200;

type SortKey = "updated" | "title" | "status" | "retention" | "waiting";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "updated", label: "Last updated" },
  { value: "title", label: "Title (A–Z)" },
  { value: "status", label: "Lifecycle stage" },
  { value: "waiting", label: "Longest waiting" },
  { value: "retention", label: "Retention until" },
];
const STAGE_ORDER: Lifecycle[] = ["draft", "submitted", "in_review", "approved", "rendered", "published", "withdrawn", "archived", "rejected"];
const ts = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0);

// Retention is a disposal obligation: flag horizons that have passed or fall
// within 30 days, in words as well as colour.
const Retention: React.FC<{ iso?: string | null }> = ({ iso }) => {
  if (!iso) return <span className="text-sd-text3">—</span>;
  const days = Math.floor((ts(iso) - Date.now()) / 86_400_000);
  if (days < 0) return <span className="text-sd-bad">{fmtDate(iso)}<span className="block font-sans text-[11px] font-semibold">Retention ended</span></span>;
  if (days <= 30) return <span className="text-sd-warn">{fmtDate(iso)}<span className="block font-sans text-[11px] font-semibold">{days === 0 ? "Ends today" : `Ends in ${days} day${days === 1 ? "" : "s"}`}</span></span>;
  return <span className="text-sd-text2">{fmtDate(iso)}</span>;
};

// A column header that sorts the register. Each column has one fixed direction
// (the one the Sort menu describes); aria-sort reports it to assistive tech.
const SortTh: React.FC<{ label: string; k: SortKey; sort: SortKey; setSort: (k: SortKey) => void }> = ({ label, k, sort, setSort }) => (
  <th scope="col" aria-sort={sort === k ? "ascending" : undefined}>
    <button type="button" onClick={() => setSort(sort === k ? "updated" : k)} className={cx("inline-flex items-center gap-1 uppercase tracking-[inherit] hover:text-sd-text", sort === k && "text-sd-text")}
      title={sort === k ? "Sorted — click to return to last updated" : `Sort by ${label.toLowerCase()}`}>
      {label}<Icon.chevronDown className={cx("h-3 w-3", sort === k ? "opacity-100" : "opacity-30")} />
    </button>
  </th>
);

// The governance facts for a record, adapted to where it lives in its life. The
// same facts the previous card layout showed — now in scannable columns.
function authorityCell(d: DocListItem): { primary: React.ReactNode; secondary?: React.ReactNode } {
  const lc = d.lifecycle;
  if (lc === "in_review" || lc === "submitted")
    return { primary: d.currentAuthority ?? "Under review", secondary: d.nextAuthority ? <>then {d.nextAuthority}</> : undefined };
  if (lc === "approved") return { primary: "Approved · clearing render" };
  if (lc === "rendered") return { primary: d.publicationAuthority ?? "Awaiting publication", secondary: d.publicationAuthority ? "publication authority" : undefined };
  if (lc === "published") return { primary: d.publicationAuthority ?? "Published", secondary: d.publicationAuthority ? "published by" : undefined };
  if (lc === "archived") return { primary: "Sealed for preservation" };
  return { primary: <span className="text-sd-text3">—</span> };
}

// The Register — every official record with the authority that holds it, the
// policy that governs it and its retention horizon. Clearance scoping happens
// server-side (under-cleared records simply don't appear). `fixedState` reframes
// the page (Preservation = the register pinned to archived records). Filters are
// in the URL so a filtered view can be bookmarked or shared.
const Library: React.FC<{ fixedState?: Lifecycle; title?: string; blurb?: string }> = ({ fixedState, title, blurb }) => {
  const [params, setParams] = useSearchParams();
  const urlState = (params.get("state") ?? "") as Lifecycle | "";
  const state: Lifecycle | "" = fixedState ?? (STATES.includes(urlState) ? urlState : "");
  const q = params.get("q") ?? "";
  const [draftQ, setDraftQ] = useState(q);
  const [items, setItems] = useState<DocListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const urlSort = params.get("sort") as SortKey | null;
  const sort: SortKey = urlSort && SORTS.some((x) => x.value === urlSort) ? urlSort : "updated";
  const [density, setDensity] = useDensity("register");
  const [cursor, setCursor] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { setItems((await listDocuments({ state: state || undefined, q: q || undefined, limit: LIMIT })).items); }
    catch (e) { setErr(humanError(e, "The register could not be loaded.")); }
    finally { setLoading(false); }
  }, [state, q]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setDraftQ(q); }, [q]);
  useEffect(() => { setCursor(-1); }, [items, sort]);

  const setSort = (v: SortKey) => setParam("sort", v === "updated" ? "" : v);
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => {
    const r = [...items];
    const by: Record<SortKey, (a: DocListItem, b: DocListItem) => number> = {
      updated: (a, b) => ts(b.updatedAt ?? b.createdAt) - ts(a.updatedAt ?? a.createdAt),
      title: (a, b) => (a.title || "").localeCompare(b.title || ""),
      status: (a, b) => STAGE_ORDER.indexOf(a.lifecycle) - STAGE_ORDER.indexOf(b.lifecycle),
      waiting: (a, b) => (ts(a.waitingSince ?? a.submittedAt) || Infinity) - (ts(b.waitingSince ?? b.submittedAt) || Infinity),
      retention: (a, b) => (ts(a.retentionUntil) || Infinity) - (ts(b.retentionUntil) || Infinity),
    };
    return r.sort(by[sort]);
  }, [items, sort]);

  useHotkeys({
    "/": () => searchRef.current?.focus(),
    j: () => setCursor((c) => Math.min(rows.length - 1, c + 1)),
    k: () => setCursor((c) => Math.max(0, c - 1)),
    Enter: () => { if (cursor >= 0 && rows[cursor]) nav(`/console/documents/${rows[cursor].documentId}`); },
  });
  useEffect(() => { if (cursor >= 0) document.getElementById(`reg-row-${cursor}`)?.scrollIntoView({ block: "nearest" }); }, [cursor]);

  const filtered = !!(q || (!fixedState && state));
  const counts = useMemo(() => items.reduce<Record<string, number>>((m, d) => { m[d.lifecycle] = (m[d.lifecycle] ?? 0) + 1; return m; }, {}), [items]);

  return (
    <div>
      <PageHeader
        eyebrow={fixedState ? "Permanent preservation" : "The register"}
        title={title ?? "Official records"}
        description={blurb ?? "The institutional record — every official record, the authority that holds it, the policy that governs it, and the retention horizon you are cleared to see."}
        meta={<>
          <span>{fixedState ? "Archives · retention" : "Official records · tenant scope"}</span>
          {!loading && <span className="text-sd-text2">{items.length}{items.length >= LIMIT ? "+" : ""} record{items.length === 1 ? "" : "s"}</span>}
        </>}
      />

      {/* toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form role="search" onSubmit={(e) => { e.preventDefault(); setParam("q", draftQ.trim()); }} className="relative min-w-[220px] flex-1">
          <label htmlFor="reg-search" className="sr-only">Search the register by title</label>
          <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sd-text3" />
          <input id="reg-search" ref={searchRef} type="search" className={cx(controlCls, "h-9 pl-8 pr-16")} value={draftQ} onChange={(e) => setDraftQ(e.target.value)} placeholder="Search by title… (press Enter)"
            onKeyDown={(e) => { if (e.key === "Escape") { if (draftQ || q) { e.preventDefault(); setDraftQ(""); setParam("q", ""); } else searchRef.current?.blur(); } }} />
          <span className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 text-[11px] text-sd-faint sm:block">/ to focus</span>
        </form>
        {!fixedState && (
          <>
            <label htmlFor="reg-state" className="sr-only">Lifecycle state</label>
            <select id="reg-state" className={cx(selectCls, "h-9")} value={state} onChange={(e) => setParam("state", e.target.value)}>
              {STATES.map((s) => <option key={s} value={s}>{s === "" ? "All lifecycle states" : lifecycleMeta(s).label}</option>)}
            </select>
          </>
        )}
        <label htmlFor="reg-sort" className="sr-only">Sort</label>
        <select id="reg-sort" className={cx(selectCls, "h-9")} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
        </select>
        <span className="hidden md:inline-flex"><Segmented label="Row density" value={density} onChange={setDensity} options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]} /></span>
        {filtered && <Button variant="ghost" icon={<Icon.close />} onClick={() => { setDraftQ(""); const keep = new URLSearchParams(); if (params.get("sort")) keep.set("sort", params.get("sort")!); setParams(keep, { replace: true }); }}>Clear filters</Button>}
        <Button variant="ghost" icon={<Icon.refresh />} onClick={load} loading={loading} aria-label="Reload the register" />
      </div>

      {/* state distribution of the loaded result — a quick scan, never a fabricated total */}
      {!loading && !fixedState && !state && items.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Loaded records by lifecycle state">
          {STAGE_ORDER.filter((s) => counts[s]).map((s) => (
            <button key={s} onClick={() => setParam("state", s)} className="inline-flex items-center gap-1.5 rounded-md border border-sd-line bg-sd-panel px-2 py-1 text-[11.5px] text-sd-text2 hover:border-sd-accent/40 hover:text-sd-text">
              <span aria-hidden className="text-[10px] text-sd-text3">{lifecycleMeta(s).glyph}</span>{lifecycleMeta(s).label}<span className="font-mono text-sd-text">{counts[s]}</span>
            </button>
          ))}
        </div>
      )}

      {err && <Alert tone="bad" title="Register unavailable" className="mb-3" action={<Button size="sm" onClick={load}>Try again</Button>}>{err}</Alert>}

      <Panel padded={false} className="overflow-hidden">
        {loading ? <SkeletonRows rows={7} label="Loading the register" />
          : items.length === 0 ? (
            filtered
              ? <EmptyState icon={<Icon.search />} title="No records match these filters" action={<Button onClick={() => { setDraftQ(""); const keep = new URLSearchParams(); if (params.get("sort")) keep.set("sort", params.get("sort")!); setParams(keep, { replace: true }); }}>Clear filters</Button>}>Search matches record titles. Records above your clearance are never listed.</EmptyState>
              : <EmptyState icon={fixedState ? <Icon.archive /> : <Icon.register />} title={fixedState ? "No records preserved yet" : "The register is empty"}>
                  {fixedState ? "Published records appear here once the publication authority preserves them for the record." : "Official records appear here once they are submitted for governance."}
                </EmptyState>
          ) : (
            <>
              {/* desktop / tablet: dense register table */}
              <div className="hidden relative max-h-[calc(100vh-300px)] min-h-[240px] overflow-auto md:block">
                <table className="sd-table" data-density={density}>
                  <caption className="sr-only">{title ?? "Official records"} — {rows.length} records. Use j and k to move, Enter to open.</caption>
                  <thead>
                    <tr>
                      <SortTh label="Record" k="title" sort={sort} setSort={setSort} />
                      <th scope="col">Classification</th>
                      <SortTh label="Lifecycle" k="status" sort={sort} setSort={setSort} />
                      <th scope="col">Authority</th>
                      <th scope="col">Policy</th>
                      <SortTh label={fixedState ? "Published" : "Waiting / published"} k="waiting" sort={sort} setSort={setSort} />
                      <SortTh label="Retention until" k="retention" sort={sort} setSort={setSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((d, i) => {
                      const a = authorityCell(d);
                      const inReview = d.lifecycle === "in_review" || d.lifecycle === "submitted";
                      return (
                        <tr key={d.documentId} id={`reg-row-${i}`} aria-selected={cursor === i} className="cursor-pointer" onClick={() => nav(`/console/documents/${d.documentId}`)}>
                          <td className="min-w-[220px] max-w-[380px]">
                            <Link to={`/console/documents/${d.documentId}`} onClick={(e) => e.stopPropagation()} className="block truncate font-serif text-[14px] font-semibold text-sd-text hover:underline"><Highlight text={d.title || "(untitled)"} term={q} /></Link>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-sd-text3">
                              <span className="font-mono text-sd-text2" title="Register reference derived from the document ID. The allocated official record ID is shown on the record file.">{recordNo(d.documentId, d.createdAt)}</span>
                              <span aria-hidden>·</span><span>{recordTypeLabel(d.docType)}</span>
                              <span aria-hidden>·</span><span>v{d.version}</span>
                              {d.updatedAt && <><span aria-hidden>·</span><span title={`Updated ${fmtDate(d.updatedAt)}`}>updated {timeAgo(d.updatedAt)}</span></>}
                            </div>
                          </td>
                          <td><ClassificationMark level={d.classification?.level} scheme={d.classification?.scheme} /></td>
                          <td>
                            <LifecycleStatus state={d.lifecycle} />
                            {(() => { const t = postureText(d.lifecycle, d.status); return t && t !== lifecycleMeta(d.lifecycle).label ? <div className="mt-1 max-w-[180px] text-[11.5px] leading-snug text-sd-text3">{t}</div> : null; })()}
                          </td>
                          <td className="max-w-[190px]"><div className="truncate text-sd-text">{a.primary}</div>{a.secondary && <div className="truncate text-[11.5px] text-sd-text3">{a.secondary}</div>}</td>
                          <td className="max-w-[170px]">{d.policyName ? <><div className="truncate text-sd-text2">{d.policyName}</div>{d.policyVersion ? <div className="font-mono text-[11px] text-sd-text3">v{d.policyVersion}</div> : null}</> : <span className="text-sd-text3">—</span>}</td>
                          <td className="whitespace-nowrap font-mono text-[12px]">
                            {inReview ? <span className="text-sd-warn" title="Time with the current authority">{waited(d.waitingSince ?? d.submittedAt)}</span>
                              : d.publishedAt ? <span className="text-sd-text2">{fmtDate(d.publishedAt)}</span> : <span className="text-sd-text3">—</span>}
                          </td>
                          <td className="whitespace-nowrap font-mono text-[12px]"><Retention iso={d.retentionUntil} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* mobile: stacked records — same facts, no horizontal scrolling */}
              <ul className="divide-y divide-sd-soft md:hidden">
                {rows.map((d) => {
                  const a = authorityCell(d);
                  return (
                    <li key={d.documentId}>
                      <Link to={`/console/documents/${d.documentId}`} className="block px-4 py-3 hover:bg-sd-raised">
                        <div className="flex items-start justify-between gap-3">
                          <ClassificationMark level={d.classification?.level} scheme={d.classification?.scheme} />
                          <LifecycleStatus state={d.lifecycle} />
                        </div>
                        <div className="mt-1.5 font-serif text-[15px] font-semibold leading-snug text-sd-text"><Highlight text={d.title || "(untitled)"} term={q} /></div>
                        <div className="mt-0.5 text-[11.5px] text-sd-text3"><span className="font-mono text-sd-text2">{recordNo(d.documentId, d.createdAt)}</span> · {recordTypeLabel(d.docType)} · v{d.version}</div>
                        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                          <div><dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-sd-text3">Authority</dt><dd className="text-sd-text2">{a.primary}</dd></div>
                          <div><dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-sd-text3">Policy</dt><dd className="text-sd-text2">{d.policyName ?? "—"}{d.policyVersion ? ` v${d.policyVersion}` : ""}</dd></div>
                          {(d.lifecycle === "in_review" || d.lifecycle === "submitted") && <div><dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-sd-text3">Waiting</dt><dd className="font-mono text-sd-warn">{waited(d.waitingSince ?? d.submittedAt)}</dd></div>}
                          {d.publishedAt && <div><dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-sd-text3">Published</dt><dd className="font-mono text-sd-text2">{fmtDate(d.publishedAt)}</dd></div>}
                          {d.retentionUntil && <div><dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-sd-text3">Retention until</dt><dd className="font-mono"><Retention iso={d.retentionUntil} /></dd></div>}
                        </dl>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {items.length >= LIMIT && <div className="border-t border-sd-soft px-4 py-2 text-[12px] text-sd-text3">Showing the first {LIMIT} records. Narrow the search or lifecycle filter to see others.</div>}
            </>
          )}
      </Panel>
      <p className="mt-2 hidden text-[11.5px] text-sd-text3 md:block">Sorting applies to the loaded records. Keyboard: <span className="font-mono">/</span> search · <span className="font-mono">j</span>/<span className="font-mono">k</span> move · <span className="font-mono">Enter</span> open.</p>
    </div>
  );
};

export default Library;

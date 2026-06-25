import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDocuments, type DocListItem, type Lifecycle, humanError } from "../lib/api";
import { Card, ClassBadge, inputCls } from "../lib/ui";
import { recordTypeLabel } from "../lib/recordTypes";

const STATES: (Lifecycle | "")[] = ["", "in_review", "approved", "rendered", "published", "withdrawn", "archived", "rejected"];

// Records show absolute dates for publication + retention (not relative): an
// official record's release and disposal dates are facts, not "3d ago".
const fmtDate = (iso?: string | null): string => (iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");

// Precise institutional waiting time — "2h 13m", "3d 4h" — not a vague "3d ago".
// A record's time-in-authority is a governance fact an operator is accountable for.
const waited = (iso?: string | null): string => {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m`;
  return "just now";
};

// A stable, official-looking record number derived from the document id — the
// same derivation the record detail uses, so a row and its file agree.
const recordNo = (id: string, createdAt?: string): string => {
  const n = parseInt(id.replace(/[^0-9a-f]/gi, "").slice(0, 8), 16) % 1_000_000;
  const yr = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  return `SD-${yr}-${String(n).padStart(6, "0")}`;
};

// Status colour discipline — monochrome by default, colour only where the record
// is owed an action or has reached a terminal seal. amber = awaiting a person ·
// seal = in motion · emerald = preserved · red = returned · white = settled.
const DOT: Record<Lifecycle, string> = {
  draft: "bg-white/30", submitted: "bg-amber-400", in_review: "bg-amber-400",
  approved: "bg-seal-light", rendered: "bg-seal-light", published: "bg-white",
  withdrawn: "bg-white/30", archived: "bg-emerald-400", rejected: "bg-red-400",
};
const STATUS_FALLBACK: Record<Lifecycle, string> = {
  draft: "Draft", submitted: "Awaiting review", in_review: "Awaiting review",
  approved: "Approved · clearing render", rendered: "Awaiting publication",
  published: "Published", withdrawn: "Withdrawn", archived: "Preserved", rejected: "Returned for revision",
};

const StatusChip: React.FC<{ d: DocListItem }> = ({ d }) => (
  <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-ink-900/50 px-3 py-1">
    <span className={`h-1.5 w-1.5 rounded-full ${DOT[d.lifecycle] ?? "bg-white/40"}`} />
    <span className="whitespace-nowrap text-[12px] font-semibold text-white/85">{d.status || STATUS_FALLBACK[d.lifecycle] || d.lifecycle}</span>
  </span>
);

const Fact: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) =>
  value == null || value === "" ? null : (
    <div className="leading-tight">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-0.5 text-[12.5px] text-white/80">{value}</div>
    </div>
  );

// The Register — every record presented as an institutional file, not a database
// row. It answers the operator's real question ("who holds my document, who is
// next, under what policy, for how long"), translating governance state into
// institutional fact. Clearance scoping happens server-side — under-cleared
// records simply don't appear (no existence leak). `fixedState` reframes the
// page (Preservation = the register pinned to archived records).
const Library: React.FC<{ fixedState?: Lifecycle; title?: string; blurb?: string }> = ({ fixedState, title, blurb }) => {
  const [items, setItems] = useState<DocListItem[]>([]);
  const [state, setState] = useState<Lifecycle | "">(fixedState ?? "");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (search: string) => {
    setLoading(true); setErr(null);
    try { setItems((await listDocuments({ state: state || undefined, q: search || undefined, limit: 200 })).items); }
    catch (e) { setErr(humanError(e, "load failed")); }
    finally { setLoading(false); }
  }, [state]);
  useEffect(() => { load(q); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [load]);

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-seal-light">{fixedState ? "Preservation" : "The Register"}</div>
        <h1 className="mt-1.5 font-serif text-[2rem] font-bold leading-tight tracking-tight text-white">{title ?? "Official Records"}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/50">{blurb ?? "The institutional record — every official record, the authority that holds it, the policy that governs it, and the retention horizon you are cleared to see."}</p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        {!fixedState && (
          <select className={`${inputCls} w-44`} value={state} onChange={(e) => setState(e.target.value as Lifecycle | "")}>
            {STATES.map((s) => <option key={s} value={s}>{s === "" ? "All records" : (STATUS_FALLBACK[s as Lifecycle] ?? s)}</option>)}
          </select>
        )}
        <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="flex flex-1 gap-2">
          <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the register by title…" />
        </form>
        {!loading && <div className="font-mono text-[12px] tabular-nums text-white/35">{items.length} record{items.length === 1 ? "" : "s"}</div>}
      </div>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <Card className="overflow-hidden">
        {loading ? <p className="px-5 py-8 text-sm text-white/40">Loading the register…</p>
          : items.length === 0 ? <p className="px-5 py-12 text-center text-sm text-white/30">No records in the register match.</p>
          : (
            <ul className="divide-y divide-white/[0.06]">
              {items.map((d) => {
                const lc = d.lifecycle;
                const inReview = lc === "in_review" || lc === "submitted";
                return (
                  <li key={d.documentId}>
                    <Link to={`/console/documents/${d.documentId}`} className="block px-5 py-4 transition hover:bg-white/[0.03]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <ClassBadge level={d.classification?.level} scheme={d.classification?.scheme} />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Official Record</span>
                            <span className="font-mono text-[10.5px] tabular-nums text-white/30">{recordNo(d.documentId, d.createdAt)}</span>
                          </div>
                          <div className="mt-1.5 truncate font-serif text-[1.1rem] font-semibold tracking-tight text-white">{d.title || "(untitled)"}</div>
                          <div className="mt-0.5 text-[12px] text-white/45">
                            {recordTypeLabel(d.docType)}
                            {d.policyName && <> · <span className="text-white/60">{d.policyName}</span>{d.policyVersion ? <span className="text-white/35"> v{d.policyVersion}</span> : null}</>}
                          </div>
                        </div>
                        <StatusChip d={d} />
                      </div>

                      {/* governance facts — adapt to where the record lives in its life */}
                      <div className="mt-3.5 flex flex-wrap gap-x-9 gap-y-2 border-t border-white/[0.05] pt-3">
                        {inReview && <>
                          <Fact label="Current authority" value={d.currentAuthority ?? <span className="text-white/40">Under review</span>} />
                          <Fact label="Next step" value={d.nextAuthority} />
                          <Fact label="Waiting" value={waited(d.waitingSince ?? d.submittedAt)} />
                        </>}
                        {lc === "approved" && <Fact label="Stage" value="Approved · clearing render" />}
                        {lc === "rendered" && <>
                          <Fact label="Stage" value="Cleared — awaiting publication" />
                          <Fact label="Publication authority" value={d.publicationAuthority} />
                        </>}
                        {lc === "published" && <>
                          <Fact label="Published" value={fmtDate(d.publishedAt)} />
                          <Fact label="Publication authority" value={d.publicationAuthority} />
                          <Fact label="Retention until" value={fmtDate(d.retentionUntil)} />
                        </>}
                        {lc === "archived" && <>
                          <Fact label="Status" value="Sealed for preservation" />
                          <Fact label="Retention until" value={fmtDate(d.retentionUntil)} />
                        </>}
                        {(lc === "rejected" || lc === "withdrawn" || lc === "draft") && <Fact label="Governance" value={d.policyName ?? "—"} />}
                        <div className="ml-auto self-center text-[11px] font-semibold text-seal-light opacity-0 transition group-hover:opacity-100">Open file →</div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
      </Card>
    </div>
  );
};

export default Library;

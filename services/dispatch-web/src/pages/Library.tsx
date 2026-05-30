import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDocuments, type DocListItem, type Lifecycle } from "../lib/api";
import { Card, ClassBadge, LifecycleBadge, inputCls, timeAgo } from "../lib/ui";

const STATES: (Lifecycle | "")[] = ["", "in_review", "approved", "rendered", "published", "withdrawn", "archived", "rejected"];

// The library / archive: every document the viewer is cleared to see, filtered
// by lifecycle state, type and title. Clearance scoping happens server-side —
// under-cleared documents simply don't appear (no existence leak).
const Library: React.FC = () => {
  const [items, setItems] = useState<DocListItem[]>([]);
  const [state, setState] = useState<Lifecycle | "">("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (search: string) => {
    setLoading(true); setErr(null);
    try { setItems((await listDocuments({ state: state || undefined, q: search || undefined, limit: 200 })).items); }
    catch (e) { setErr(e instanceof Error ? e.message : "load failed"); }
    finally { setLoading(false); }
  }, [state]);
  // Reload when the state filter changes; the search box submits explicitly.
  useEffect(() => { load(q); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [load]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Library</h1>
        <p className="text-sm text-white/50">Published and archived documents, versions and artifacts.</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className={`${inputCls} w-44`} value={state} onChange={(e) => setState(e.target.value as Lifecycle | "")}>
          {STATES.map((s) => <option key={s} value={s}>{s === "" ? "All states" : s.replace(/_/g, " ")}</option>)}
        </select>
        <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="flex flex-1 gap-2">
          <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title…" />
        </form>
      </div>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <Card>
        {loading ? <p className="px-4 py-6 text-sm text-white/40">Loading…</p>
          : items.length === 0 ? <p className="px-4 py-10 text-center text-sm text-white/30">No documents match.</p>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/40">
                  <th className="px-4 py-2 font-semibold">Classification</th>
                  <th className="px-4 py-2 font-semibold">Title</th>
                  <th className="px-4 py-2 font-semibold">Type</th>
                  <th className="px-4 py-2 font-semibold">State</th>
                  <th className="px-4 py-2 text-right font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((d) => (
                  <tr key={d.documentId} className="hover:bg-white/5">
                    <td className="px-4 py-2.5"><ClassBadge level={d.classification?.level} scheme={d.classification?.scheme} /></td>
                    <td className="px-4 py-2.5"><Link to={`/console/documents/${d.documentId}`} className="font-medium text-white hover:text-seal-light">{d.title || "(untitled)"}</Link></td>
                    <td className="px-4 py-2.5 text-white/50">{d.docType}</td>
                    <td className="px-4 py-2.5"><LifecycleBadge state={d.lifecycle} /></td>
                    <td className="px-4 py-2.5 text-right text-xs text-white/40">{timeAgo(d.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </Card>
    </div>
  );
};

export default Library;

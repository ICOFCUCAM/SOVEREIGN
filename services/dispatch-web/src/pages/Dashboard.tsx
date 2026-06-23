import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDocuments, type DocListItem, type Lifecycle } from "../lib/api";
import { Card, ClassBadge, LifecycleBadge, timeAgo } from "../lib/ui";
import { useAuth } from "../lib/auth";

// Operations Command Center. The console's landing surface is operational, not a
// report: the publication pipeline is visualised stage-by-stage with LIVE counts,
// and "needs my action" queues are surfaced first. Every number here is a real
// query against the document store — no fabricated metrics.

// Pipeline stages, in lifecycle order. Each is a live queue keyed by state.
const PIPELINE: { state: Lifecycle; label: string }[] = [
  { state: "in_review", label: "In Review" },
  { state: "approved", label: "Approved" },
  { state: "rendered", label: "Rendering · Ready" },
  { state: "published", label: "Published" },
];
// Secondary states worth surfacing but off the happy path.
const ASIDE: { state: Lifecycle; label: string }[] = [
  { state: "rejected", label: "Returned · Rejected" },
  { state: "archived", label: "Archived" },
];
const ALL = [...PIPELINE, ...ASIDE];

const Dashboard: React.FC = () => {
  const { has } = useAuth();
  const [counts, setCounts] = useState<Record<string, DocListItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const entries = await Promise.all(
          ALL.map(async (s) => [s.state, (await listDocuments({ state: s.state, limit: 100 })).items] as const),
        );
        if (live) setCounts(Object.fromEntries(entries));
      } catch (e) { if (live) setErr(e instanceof Error ? e.message : "load failed"); }
      finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, []);

  const n = (s: string) => counts[s]?.length ?? 0;
  const inPipeline = PIPELINE.reduce((a, s) => a + n(s.state), 0);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Operations</h1>
          <p className="text-sm text-white/50">Submit → Govern → Approve → Render → Publish → Retrieve</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums text-white">{loading ? "·" : inPipeline}</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">In pipeline</div>
        </div>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {/* ── pipeline visualization ──────────────────────────────── */}
      <Card className="mb-8 p-6">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Publication pipeline</div>
        <div className="flex items-stretch gap-2 overflow-x-auto">
          {PIPELINE.map((s, i) => (
            <React.Fragment key={s.state}>
              <div className="min-w-[110px] flex-1 rounded-lg border border-white/10 bg-ink-900/50 px-4 py-3">
                <div className="text-2xl font-bold tabular-nums text-white">{loading ? "·" : n(s.state)}</div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-white/45">{s.label}</div>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className="flex items-center text-white/20" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
          {ASIDE.map((s) => (
            <div key={s.state} className="text-[11px] text-white/40">
              <span className="font-bold tabular-nums text-white/70">{loading ? "·" : n(s.state)}</span>{" "}
              <span className="uppercase tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {has("dispatch:approve") && (
        <Queue title="Needs your review" items={counts["in_review"] ?? []} empty="Nothing awaiting review." cta={{ to: "/console/review", label: "Open review queue →" }} />
      )}
      <Queue title="Ready to publish" items={counts["rendered"] ?? []} empty="Nothing waiting to publish." />
      <Queue title="Recently published" items={counts["published"] ?? []} empty="No published documents yet." />
    </div>
  );
};

const Queue: React.FC<{ title: string; items: DocListItem[]; empty: string; cta?: { to: string; label: string } }> = ({ title, items, empty, cta }) => (
  <section className="mb-8">
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">{title}</h2>
      {cta && <Link to={cta.to} className="text-xs font-semibold text-seal-light hover:underline">{cta.label}</Link>}
    </div>
    {items.length === 0 ? (
      <p className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/30">{empty}</p>
    ) : (
      <Card>
        <ul className="divide-y divide-white/5">
          {items.slice(0, 6).map((d) => (
            <li key={d.documentId}>
              <Link to={`/console/documents/${d.documentId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5">
                <ClassBadge level={d.classification?.level} scheme={d.classification?.scheme} />
                <span className="flex-1 truncate text-sm font-medium text-white">{d.title || "(untitled)"}</span>
                <span className="hidden text-xs text-white/40 sm:inline">{d.docType}</span>
                <LifecycleBadge state={d.lifecycle} />
                <span className="w-16 text-right text-xs text-white/30">{timeAgo(d.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    )}
  </section>
);

export default Dashboard;

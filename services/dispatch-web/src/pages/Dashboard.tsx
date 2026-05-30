import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDocuments, type DocListItem, type Lifecycle } from "../lib/api";
import { Card, ClassBadge, LifecycleBadge, timeAgo } from "../lib/ui";
import { useAuth } from "../lib/auth";

// The dashboard is organised around the lifecycle pipeline, not a file list:
// each stage is a queue, and "needs my action" is surfaced first.
const STAGES: { state: Lifecycle; label: string }[] = [
  { state: "in_review", label: "Awaiting review" },
  { state: "approved", label: "Approved · rendering" },
  { state: "rendered", label: "Rendered · to publish" },
  { state: "published", label: "Published" },
];

const Dashboard: React.FC = () => {
  const { has } = useAuth();
  const [counts, setCounts] = useState<Record<string, DocListItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const entries = await Promise.all(STAGES.map(async (s) => [s.state, (await listDocuments({ state: s.state, limit: 100 })).items] as const));
        if (live) setCounts(Object.fromEntries(entries));
      } catch (e) { if (live) setErr(e instanceof Error ? e.message : "load failed"); }
      finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/50">Submit → Govern → Approve → Render → Publish → Retrieve</p>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STAGES.map((s) => (
          <Card key={s.state} className="p-4">
            <div className="text-3xl font-bold tabular-nums text-white">{loading ? "·" : counts[s.state]?.length ?? 0}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-white/45">{s.label}</div>
          </Card>
        ))}
      </div>

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

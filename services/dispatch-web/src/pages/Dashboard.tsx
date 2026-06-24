import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listDocuments, audit, getStats, type DocListItem, type AuditEvent, type Lifecycle, type Stats , humanError} from "../lib/api";
import { Card, ClassBadge, LifecycleBadge, timeAgo } from "../lib/ui";
import { useBilling, UsageBanner } from "../lib/upsell";
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
  const nav = useNavigate();
  const [counts, setCounts] = useState<Record<string, DocListItem[]>>({});
  const [activity, setActivity] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const { billing } = useBilling();

  useEffect(() => {
    let live = true;
    getStats().then((s) => { if (live) setStats(s); }).catch(() => {});
    (async () => {
      try {
        const entries = await Promise.all(
          ALL.map(async (s) => [s.state, (await listDocuments({ state: s.state, limit: 100 })).items] as const),
        );
        if (live) setCounts(Object.fromEntries(entries));
      } catch (e) { if (live) setErr(humanError(e, "load failed")); }
      finally { if (live) setLoading(false); }
    })();
    // Recent activity feed — only for principals with the audit scope.
    if (has("dispatch:audit")) {
      audit({ limit: 12 }).then((r) => { if (live) setActivity(r.events); }).catch(() => {});
    }
    return () => { live = false; };
  }, [has]);

  const n = (s: string) => counts[s]?.length ?? 0;
  const inPipeline = PIPELINE.reduce((a, s) => a + n(s.state), 0);
  const totalDocs = ALL.reduce((a, s) => a + n(s.state), 0);
  // A first-run institution lands on an empty store. Rather than a wall of
  // zeros and "nothing here" queues, give them a guided path to their first
  // official record — onboarding, not an empty database view.
  const firstRun = !loading && !err && totalDocs === 0;

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

      {billing && <UsageBanner b={billing} onUpgrade={() => nav("/console/access")} className="mb-6" />}

      {/* ── institutional outcomes ───────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Official records created", stats?.officialRecords],
          ["Artifacts generated", stats?.artifactsGenerated],
          ["Approval decisions", stats?.approvalDecisions],
          ["Audit events", stats?.auditEvents],
        ].map(([label, val]) => (
          <Card key={label as string} className="p-5">
            <div className="text-3xl font-bold tabular-nums text-white">{val === undefined ? "·" : (val as number)}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</div>
          </Card>
        ))}
      </div>

      {firstRun ? <FirstRun canAuthor={has("dispatch:render")} /> : <>
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

      <div className={`grid gap-8 ${has("dispatch:audit") ? "lg:grid-cols-3" : ""}`}>
        <div className={`space-y-8 ${has("dispatch:audit") ? "lg:col-span-2" : ""}`}>
          {has("dispatch:approve") && (
            <Queue title="Needs your review" items={counts["in_review"] ?? []} empty="Nothing awaiting review." cta={{ to: "/console/review", label: "Open review queue →" }} />
          )}
          <Queue title="Recently approved" items={counts["approved"] ?? []} empty="No documents awaiting render." />
          <Queue title="Ready to publish" items={counts["rendered"] ?? []} empty="Nothing waiting to publish." />
          <Queue title="Recently published" items={counts["published"] ?? []} empty="No published documents yet." />
        </div>
        {has("dispatch:audit") && <ActivityTimeline events={activity} />}
      </div>
      </>}
    </div>
  );
};

// Guided first-run: the institution has signed up but produced nothing yet.
// Three governance steps and a single clear call to action.
const FirstRun: React.FC<{ canAuthor: boolean }> = ({ canAuthor }) => {
  const steps = [
    { n: 1, t: "Compose a document", d: "Author an executive briefing, board report, or policy paper from a structured template." },
    { n: 2, t: "Submit for governance", d: "It enters the approval chain — reviewed and approved before anything is produced." },
    { n: 3, t: "Approve & publish", d: "On approval it is rendered to an official record you can preserve and retrieve." },
  ];
  return (
    <Card className="mb-8 p-8">
      <div className="max-w-xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">Welcome to Dispatch</div>
        <h2 className="mt-2 text-xl font-bold text-white">Create your first official record</h2>
        <p className="mt-1 text-sm text-white/55">Your evaluation includes three official records. Here is how the governed pipeline works.</p>
      </div>
      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="rounded-lg border border-white/10 bg-ink-900/50 p-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-seal/30 text-sm font-bold text-seal-light ring-1 ring-seal-light/40">{s.n}</div>
            <div className="mt-3 text-sm font-semibold text-white">{s.t}</div>
            <div className="mt-1 text-[12.5px] leading-snug text-white/50">{s.d}</div>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {canAuthor && <Link to="/console/create" className="inline-flex items-center justify-center gap-2 rounded-md bg-seal px-4 py-2 text-sm font-semibold text-white transition hover:bg-seal-light">Compose a document →</Link>}
        <Link to="/console/access" className="text-sm font-semibold text-white/50 hover:text-white">Manage credentials</Link>
      </div>
    </Card>
  );
};

// Live activity feed from the append-only audit trail (auditor scope only).
const ActivityTimeline: React.FC<{ events: AuditEvent[] }> = ({ events }) => (
  <aside>
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">Recent activity</h2>
      <Link to="/console/audit" className="text-xs font-semibold text-seal-light hover:underline">Audit Center →</Link>
    </div>
    <Card className="p-4">
      {events.length === 0 ? (
        <p className="py-4 text-center text-sm text-white/30">No recorded events yet.</p>
      ) : (
        <ol className="space-y-0">
          {events.map((e, i) => (
            <li key={e.eventId} className="relative flex gap-3 pb-4 last:pb-0">
              {i < events.length - 1 && <span className="absolute left-[5px] top-3.5 h-full w-px bg-white/8" aria-hidden />}
              <span className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-emerald-400/60 bg-emerald-400/20" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[12px] text-white/80">{e.action}</div>
                <div className="text-[11px] text-white/40">{e.actor} · {timeAgo(e.ts)}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  </aside>
);

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

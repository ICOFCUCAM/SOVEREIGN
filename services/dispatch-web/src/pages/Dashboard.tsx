import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDocuments, audit, getStats, getGovernanceOverview, type DocListItem, type AuditEvent, type Lifecycle, type Stats, type GovOverview, humanError } from "../lib/api";
import { Card, ClassBadge, LifecycleBadge, timeAgo } from "../lib/ui";
import { useBilling, UsageBanner, UpgradeModal } from "../lib/upsell";
import { useAuth } from "../lib/auth";

// Operations COMMAND — the platform is about GOVERNANCE, so the surface leads
// with a governance-health verdict, not a record count. Every signal is derived
// from LIVE state (the governance overview + the document store); where there is
// no data to assert a problem it says so honestly. Order of authority:
//   1. Governance Status (the verdict + the few numbers that matter)
//   2. Official Record Lifecycle (the centerpiece)
//   3. Requires action  ·  4. Recent records  ·  5. Statistics  ·  6. Activity

const ALL: Lifecycle[] = ["in_review", "approved", "rendered", "published", "rejected", "archived"];

const Dashboard: React.FC = () => {
  const { has } = useAuth();
  const [counts, setCounts] = useState<Record<string, DocListItem[]>>({});
  const [activity, setActivity] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [gov, setGov] = useState<GovOverview | null>(null);
  const { billing, setBilling } = useBilling();
  const [upgrade, setUpgrade] = useState(false);

  useEffect(() => {
    let live = true;
    getStats().then((s) => { if (live) setStats(s); }).catch(() => {});
    getGovernanceOverview().then((g) => { if (live) setGov(g); }).catch(() => {});
    (async () => {
      try {
        const entries = await Promise.all(
          ALL.map(async (s) => [s, (await listDocuments({ state: s, limit: 100 })).items] as const),
        );
        if (live) setCounts(Object.fromEntries(entries));
      } catch (e) { if (live) setErr(humanError(e, "load failed")); }
      finally { if (live) setLoading(false); }
    })();
    if (has("dispatch:audit")) {
      audit({ limit: 12 }).then((r) => { if (live) setActivity(r.events); }).catch(() => {});
    }
    return () => { live = false; };
  }, [has]);

  const n = (s: string) => counts[s]?.length ?? 0;
  const inReview = n("in_review"), approved = n("approved"), rendered = n("rendered"), published = n("published"), preserved = n("archived"), returned = n("rejected");
  const inPipeline = inReview + approved + rendered + published;
  const totalDocs = inPipeline + preserved + returned;
  const firstRun = !loading && !err && totalDocs === 0;

  // Governance health — derived from real compliance signals. A violation is a
  // governed publication that does NOT carry a compliant certificate; expired
  // authorities are delegations past their window. Healthy = neither exists.
  const c = gov?.compliance;
  const violations = c ? Math.max(0, c.governed - c.compliant) : 0;
  const expired = c?.expiredAuthorities ?? 0;

  return (
    <div>
      {upgrade && <UpgradeModal open reason="quota" onClose={() => setUpgrade(false)} onSubscribed={(b) => { setBilling(b); setUpgrade(false); }} />}
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-seal-light">Operations Command</div>

      {firstRun ? <FirstRun canAuthor={has("dispatch:render")} /> : (
        <>
          {/* ── 1 · GOVERNANCE STATUS — the verdict ── */}
          <GovernanceStatus loading={loading} hasGov={!!c} violations={violations} expired={expired}
            governed={c?.governed ?? 0} compliant={c?.compliant ?? 0} awaitingPublication={rendered}
            canPublish={has("dispatch:publish")} />

          {billing && <UsageBanner b={billing} onUpgrade={() => setUpgrade(true)} className="mt-4" />}

          {/* ── 2 · OFFICIAL RECORD LIFECYCLE — the centerpiece ── */}
          <Lifecycle loading={loading} inReview={inReview} approved={approved} rendered={rendered}
            published={published} preserved={preserved} returned={returned} />

          {/* ── 3 · REQUIRES ACTION ── */}
          <div className="mt-8">
            <SectionTitle>Requires action</SectionTitle>
            <div className="grid gap-5 lg:grid-cols-2">
              {has("dispatch:approve") && (
                <Queue title="Awaiting approval" items={counts["in_review"] ?? []}
                  empty="No records awaiting approval — the governance queue is clear."
                  cta={{ to: "/console/review", label: "Open review queue →" }} />
              )}
              <Queue title="Ready for publication" items={counts["rendered"] ?? []}
                empty="Nothing ready to publish. No publication backlog."
                cta={rendered > 0 ? { to: "/console/library", label: "View records →" } : undefined} />
              {returned > 0 && (
                <Queue title="Returned for revision" items={counts["rejected"] ?? []} empty="Nothing returned." tone="warn" />
              )}
            </div>
          </div>

          {/* ── 4 · RECENT RECORDS ── */}
          <div className="mt-8">
            <SectionTitle>Recent records</SectionTitle>
            <div className="grid gap-5 lg:grid-cols-2">
              <Queue title="Recently published" items={counts["published"] ?? []}
                empty="No records published yet." cta={{ to: "/console/library", label: "Records →" }} />
              <Queue title="Recently preserved" items={counts["archived"] ?? []}
                empty="No records preserved yet." cta={{ to: "/console/archives", label: "Archives →" }} />
            </div>
          </div>

          {/* ── 5 · INSTITUTION STATISTICS ── */}
          <div className="mt-8">
            <SectionTitle>Institution statistics</SectionTitle>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Official records" value={stats?.officialRecords} sub="Created to date" />
              <Stat label="Governance certificates" value={c?.compliant} sub="Compliant publications" />
              <Stat label="Records preserved" value={preserved} sub="Sealed for permanence" />
              <Stat label="Evidence events" value={stats?.auditEvents} sub="Hash-stamped to the trail" />
            </div>
          </div>

          {/* ── 6 · RECENT ACTIVITY (secondary) ── */}
          {has("dispatch:audit") && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <SectionTitle>Recent activity</SectionTitle>
                <Link to="/console/audit" className="text-xs font-semibold text-seal-light hover:underline">Evidence trail →</Link>
              </div>
              <ActivityTimeline events={activity} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── 1 · GOVERNANCE STATUS ─────────────────────────────────────────────────────
const GovernanceStatus: React.FC<{
  loading: boolean; hasGov: boolean; violations: number; expired: number;
  governed: number; compliant: number; awaitingPublication: number; canPublish: boolean;
}> = ({ loading, hasGov, violations, expired, governed, compliant, awaitingPublication, canPublish }) => {
  const healthy = hasGov && violations === 0 && expired === 0;
  const tone = loading || !hasGov ? "unknown" : healthy ? "healthy" : "attention";
  const STY = {
    healthy:   { ring: "border-emerald-500/30 from-emerald-500/[0.09]", dot: "bg-emerald-400", chip: "bg-emerald-500/15 text-emerald-300", label: "Healthy" },
    attention: { ring: "border-amber-500/30 from-amber-500/[0.09]",     dot: "bg-amber-400",   chip: "bg-amber-500/15 text-amber-300",     label: "Attention" },
    unknown:   { ring: "border-white/12 from-white/[0.04]",             dot: "bg-white/40",    chip: "bg-white/10 text-white/55",          label: "—" },
  }[tone];

  const headline = loading ? "Assessing governance…"
    : !hasGov ? "Governance status unavailable"
    : healthy ? "Governance Healthy"
    : "Governance — attention required";

  const issues: string[] = [];
  if (violations > 0) issues.push(`${violations} publication${violations > 1 ? "s" : ""} without a compliant certificate`);
  if (expired > 0) issues.push(`${expired} expired authorit${expired > 1 ? "ies" : "y"}`);
  const sub = loading ? ""
    : !hasGov ? "Live governance metrics are not available for this credential."
    : healthy
      ? (governed > 0
          ? `All governance policies satisfied · ${compliant}/${governed} governed publications carry a compliant certificate · no expired authorities.`
          : "No records under an enforced policy yet · no governance violations or expired authorities.")
      : issues.join(" · ");

  return (
    <div className={`overflow-hidden rounded-2xl border bg-gradient-to-r to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${STY.ring}`}>
      <div className="flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {!loading && tone !== "unknown" && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${STY.dot}`} />}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${STY.dot}`} />
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/35">Institution Status — Governance</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STY.chip}`}>{STY.label}</span>
          </div>
          <h1 className="mt-3 font-serif text-[2rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[2.3rem]">{headline}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{sub}</p>
        </div>

        {/* the few numbers that matter — governance signals, not engineering metrics */}
        <div className="grid shrink-0 grid-cols-3 gap-3 lg:w-[420px]">
          <Signal label="Awaiting publication" value={loading ? "·" : awaitingPublication} tone={awaitingPublication > 0 ? "info" : "ok"} />
          <Signal label="Governance violations" value={loading ? "·" : violations} tone={violations > 0 ? "bad" : "ok"} />
          <Signal label="Expired authorities" value={loading ? "·" : expired} tone={expired > 0 ? "warn" : "ok"} />
        </div>
      </div>
      {canPublish && awaitingPublication > 0 && (
        <Link to="/console/library" className="block border-t border-white/[0.07] bg-white/[0.02] px-6 py-2.5 text-[12.5px] font-semibold text-seal-light transition hover:bg-white/[0.05] sm:px-7">
          {awaitingPublication} record{awaitingPublication > 1 ? "s" : ""} ready for your publication →
        </Link>
      )}
    </div>
  );
};

const Signal: React.FC<{ label: string; value: React.ReactNode; tone: "ok" | "info" | "warn" | "bad" }> = ({ label, value, tone }) => {
  const color = { ok: "text-emerald-300", info: "text-seal-light", warn: "text-amber-300", bad: "text-red-300" }[tone];
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/40 px-3 py-3 text-center">
      <div className={`font-mono text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-wide text-white/40">{label}</div>
    </div>
  );
};

// ── 2 · OFFICIAL RECORD LIFECYCLE ─────────────────────────────────────────────
const Lifecycle: React.FC<{ loading: boolean; inReview: number; approved: number; rendered: number; published: number; preserved: number; returned: number }> = ({ loading, inReview, approved, rendered, published, preserved, returned }) => {
  const stages = [
    { label: "In Review", sub: "awaiting approval", n: inReview },
    { label: "Approved", sub: "clearing render", n: approved },
    { label: "Ready", sub: "to publish", n: rendered },
    { label: "Published", sub: "released to record", n: published },
    { label: "Preserved", sub: "sealed · certificate", n: preserved },
  ];
  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <SectionTitle>Official Record Lifecycle</SectionTitle>
        <span className="text-[11px] uppercase tracking-[0.16em] text-white/30">Submit → Govern → Approve → Render → Publish → Preserve</span>
      </div>
      <Card className="p-6">
        <div className="flex items-stretch gap-3 overflow-x-auto">
          {stages.map((st, i) => (
            <React.Fragment key={st.label}>
              <div className="min-w-[140px] flex-1 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className={`font-mono text-4xl font-bold tabular-nums ${st.n > 0 ? "text-seal-light" : "text-white/25"}`}>{loading ? "·" : st.n}</div>
                <div className="mt-2 text-[12.5px] font-bold uppercase tracking-wide text-white/70">{st.label}</div>
                <div className="text-[11px] text-white/35">{st.sub}</div>
              </div>
              {i < stages.length - 1 && (
                <div className="flex items-center text-white/20" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {returned > 0 && (
          <div className="mt-4 border-t border-white/[0.06] pt-3 text-[12px] text-amber-300/80">
            <span className="font-bold tabular-nums">{returned}</span> returned for revision · off the publication path.
          </div>
        )}
      </Card>
    </div>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/45">{children}</h2>
);

const Stat: React.FC<{ label: string; value?: number; sub: string }> = ({ label, value, sub }) => (
  <Card className="p-5">
    <div className="font-mono text-3xl font-bold tabular-nums text-white">{value === undefined ? "·" : value}</div>
    <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{label}</div>
    <div className="text-[11px] text-white/35">{sub}</div>
  </Card>
);

const FirstRun: React.FC<{ canAuthor: boolean }> = ({ canAuthor }) => {
  const steps = [
    { n: 1, t: "Compose a record", d: "Author an executive briefing, board report, or policy paper from a structured template." },
    { n: 2, t: "Submit for governance", d: "It enters the approval chain — reviewed and approved before anything is produced." },
    { n: 3, t: "Approve, publish, preserve", d: "On approval it is rendered, published as an official record, and sealed for preservation." },
  ];
  return (
    <Card className="mt-4 p-8">
      <div className="max-w-xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">Welcome to Dispatch</div>
        <h2 className="mt-2 font-serif text-2xl font-bold text-white">Your institution has no records yet</h2>
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
        {canAuthor && <Link to="/console/create" className="inline-flex items-center justify-center gap-2 rounded-md bg-seal px-4 py-2 text-sm font-semibold text-white transition hover:bg-seal-light">Create your first record →</Link>}
        <Link to="/console/library" className="text-sm font-semibold text-white/50 hover:text-white">Browse records</Link>
      </div>
    </Card>
  );
};

const ActivityTimeline: React.FC<{ events: AuditEvent[] }> = ({ events }) => (
  <Card className="p-4">
    {events.length === 0 ? (
      <p className="py-6 text-center text-sm text-white/30">No recorded events yet — activity appears here as records move through governance.</p>
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
);

const Queue: React.FC<{ title: string; items: DocListItem[]; empty: string; cta?: { to: string; label: string }; tone?: "default" | "warn" }> = ({ title, items, empty, cta, tone = "default" }) => (
  <section>
    <div className="mb-2 flex items-center justify-between">
      <h3 className={`text-[13px] font-semibold ${tone === "warn" ? "text-amber-300/90" : "text-white/70"}`}>{title}<span className="ml-2 font-mono text-[11px] text-white/35">{items.length}</span></h3>
      {cta && <Link to={cta.to} className="text-xs font-semibold text-seal-light hover:underline">{cta.label}</Link>}
    </div>
    {items.length === 0 ? (
      <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-white/10 px-4 py-5 text-sm text-white/40">
        <span className="text-emerald-400/70" aria-hidden>✓</span>{empty}
      </div>
    ) : (
      <Card>
        <ul className="divide-y divide-white/5">
          {items.slice(0, 5).map((d) => (
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

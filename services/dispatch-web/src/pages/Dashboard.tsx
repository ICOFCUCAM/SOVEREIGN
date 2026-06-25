import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDocuments, getStats, getGovernanceOverview, type DocListItem, type Lifecycle, type Stats, type GovOverview, humanError } from "../lib/api";
import { ClassBadge, LifecycleBadge, timeAgo } from "../lib/ui";
import { useBilling, UsageBanner, UpgradeModal } from "../lib/upsell";
import { useAuth } from "../lib/auth";

// OPERATIONS COMMAND — the command center of a sovereign institution, not an
// enterprise dashboard. It leads with a GOVERNANCE verdict, makes the Official
// Record Lifecycle the centerpiece, presents records as official instruments,
// and favours whitespace and rhythm over density. The screen reads top to bottom
// as a narrative: Status → Lifecycle → Requires Action → Recently Published →
// Recently Preserved → Statistics. Every signal is derived from live state.

const ALL: Lifecycle[] = ["in_review", "approved", "rendered", "published", "rejected", "archived"];

const Dashboard: React.FC = () => {
  const { has } = useAuth();
  const [counts, setCounts] = useState<Record<string, DocListItem[]>>({});
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
        const entries = await Promise.all(ALL.map(async (s) => [s, (await listDocuments({ state: s, limit: 100 })).items] as const));
        if (live) setCounts(Object.fromEntries(entries));
      } catch (e) { if (live) setErr(humanError(e, "load failed")); }
      finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [has]);

  const n = (s: string) => counts[s]?.length ?? 0;
  const inReview = n("in_review"), approved = n("approved"), rendered = n("rendered"), published = n("published"), preserved = n("archived"), returned = n("rejected");
  const totalDocs = inReview + approved + rendered + published + preserved + returned;
  const firstRun = !loading && !err && totalDocs === 0;

  const c = gov?.compliance;
  const violations = c ? Math.max(0, c.governed - c.compliant) : 0;
  const expired = c?.expiredAuthorities ?? 0;

  return (
    <div className="mx-auto max-w-5xl">
      {upgrade && <UpgradeModal open reason="quota" onClose={() => setUpgrade(false)} onSubscribed={(b) => { setBilling(b); setUpgrade(false); }} />}
      {err && <div className="mb-6 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {firstRun ? <FirstRun canAuthor={has("dispatch:render")} /> : (
        <>
          {/* ── INSTITUTION STATUS — dominant ── */}
          <GovernanceStatus loading={loading} hasGov={!!c} violations={violations} expired={expired}
            governed={c?.governed ?? 0} awaitingPublication={rendered} />

          {billing && <UsageBanner b={billing} onUpgrade={() => setUpgrade(true)} className="mt-6" />}

          {/* ── OFFICIAL RECORD LIFECYCLE — the centerpiece ── */}
          <Lifecycle loading={loading} inReview={inReview} approved={approved + rendered} published={published} preserved={preserved} />

          {/* ── REQUIRES ACTION ── */}
          <Section title="Requires Action">
            {has("dispatch:approve") && (
              <Instruments title="Awaiting approval" items={counts["in_review"] ?? []}
                empty="No records awaiting approval — the governance queue is clear."
                cta={{ to: "/console/review", label: "Open Governance" }} />
            )}
            <Instruments title="Ready for publication" items={counts["rendered"] ?? []}
              empty="Nothing ready to publish — no publication backlog."
              cta={rendered > 0 ? { to: "/console/library", label: "Open Records" } : undefined} />
            {returned > 0 && (
              <Instruments title="Returned for revision" items={counts["rejected"] ?? []} empty="" tone="warn" />
            )}
          </Section>

          {/* ── RECENTLY PUBLISHED ── */}
          <Section title="Recently Published">
            <Instruments title="" items={counts["published"] ?? []} empty="No records published yet."
              cta={{ to: "/console/library", label: "Official Records" }} />
          </Section>

          {/* ── RECENTLY PRESERVED ── */}
          <Section title="Recently Preserved">
            <Instruments title="" items={counts["archived"] ?? []} empty="No records preserved yet."
              cta={{ to: "/console/archives", label: "Preservation" }} />
          </Section>

          {/* ── INSTITUTION STATISTICS — quiet, borderless ── */}
          <Section title="Institution Statistics">
            <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-4">
              <Stat label="Official records" value={stats?.officialRecords} />
              <Stat label="Governance certificates" value={c?.compliant} />
              <Stat label="Records preserved" value={preserved} />
              <Stat label="Evidence events" value={stats?.auditEvents} />
            </div>
          </Section>
        </>
      )}
    </div>
  );
};

// ── INSTITUTION STATUS — the verdict, the dominant element ────────────────────
const GovernanceStatus: React.FC<{
  loading: boolean; hasGov: boolean; violations: number; expired: number;
  governed: number; awaitingPublication: number;
}> = ({ loading, hasGov, violations, expired, governed, awaitingPublication }) => {
  const healthy = hasGov && violations === 0 && expired === 0;
  const tone: "healthy" | "attention" | "unknown" = loading || !hasGov ? "unknown" : healthy ? "healthy" : "attention";
  const accent = { healthy: "border-emerald-400/70", attention: "border-amber-400/70", unknown: "border-white/20" }[tone];
  const dot = { healthy: "bg-emerald-400", attention: "bg-amber-400", unknown: "bg-white/40" }[tone];

  const verdict = loading ? "Assessing governance" : !hasGov ? "Governance status unavailable" : healthy ? "Governance Healthy" : "Governance — Attention Required";
  const issues: string[] = [];
  if (violations > 0) issues.push(`${violations} publication${violations > 1 ? "s" : ""} not compliant`);
  if (expired > 0) issues.push(`${expired} expired authorit${expired > 1 ? "ies" : "y"}`);
  const sub = loading ? " "
    : !hasGov ? "Live governance metrics are not available for this credential."
    : healthy ? (governed > 0 ? "All governed publications are compliant. No overdue approvals, no evidence anomalies." : "No records are under an enforced policy yet. No violations, no expired authorities.")
    : issues.join(" · ");

  return (
    <section className={`rounded-2xl border-l-[3px] bg-gradient-to-b from-white/[0.04] to-transparent px-7 py-9 sm:px-10 sm:py-12 ${accent}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">Institution Status</div>
      <div className="mt-5 flex items-center gap-4">
        <span className="relative flex h-3 w-3">
          {tone !== "unknown" && !loading && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${dot}`} />}
          <span className={`relative inline-flex h-3 w-3 rounded-full ${dot}`} />
        </span>
        <h1 className="font-serif text-[2.4rem] font-bold leading-none tracking-tight text-white sm:text-[3rem]">{verdict}</h1>
      </div>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/55">{sub}</p>

      {/* the few numbers that matter — borderless, calm */}
      <div className="mt-9 flex flex-wrap gap-x-14 gap-y-6">
        <Signal n={loading ? "·" : awaitingPublication} label="Awaiting publication" muted={awaitingPublication === 0} />
        <Signal n={loading ? "·" : violations} label="Policy violations" bad={violations > 0} />
        <Signal n={loading ? "·" : expired} label="Expired authorities" warn={expired > 0} />
      </div>
    </section>
  );
};

const Signal: React.FC<{ n: React.ReactNode; label: string; muted?: boolean; bad?: boolean; warn?: boolean }> = ({ n, label, muted, bad, warn }) => (
  <div>
    <div className={`font-mono text-[2rem] font-bold leading-none tabular-nums ${bad ? "text-red-300" : warn ? "text-amber-300" : muted ? "text-white/70" : "text-white"}`}>{n}</div>
    <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">{label}</div>
  </div>
);

// ── OFFICIAL RECORD LIFECYCLE — monumental centerpiece ────────────────────────
const Lifecycle: React.FC<{ loading: boolean; inReview: number; approved: number; published: number; preserved: number }> = ({ loading, inReview, approved, published, preserved }) => {
  const stages: { name: string; n: number | null }[] = [
    { name: "Submit", n: null },
    { name: "Govern", n: inReview },
    { name: "Approve", n: approved },
    { name: "Publish", n: published },
    { name: "Preserve", n: preserved },
  ];
  return (
    <Section title="Official Record Lifecycle">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.012] px-4 py-10 sm:px-10">
        <div className="flex items-center justify-between gap-1 overflow-x-auto">
          {stages.map((s, i) => (
            <React.Fragment key={s.name}>
              <div className="min-w-[88px] flex-1 text-center">
                <div className={`font-mono text-3xl font-bold tabular-nums sm:text-4xl ${s.n === null ? "text-white/15" : s.n > 0 ? "text-seal-light" : "text-white/25"}`}>
                  {s.n === null ? "—" : loading ? "·" : s.n}
                </div>
                <div className="mt-3 font-serif text-base font-semibold tracking-tight text-white/85 sm:text-lg">{s.name}</div>
              </div>
              {i < stages.length - 1 && (
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" className="shrink-0 text-white/15" aria-hidden><path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Section>
  );
};

// ── section wrapper — generous rhythm, a single quiet kicker ───────────────────
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-14">
    <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">{title}</div>
    <div className="space-y-6">{children}</div>
  </section>
);

const Stat: React.FC<{ label: string; value?: number }> = ({ label, value }) => (
  <div>
    <div className="font-mono text-[2rem] font-bold leading-none tabular-nums text-white">{value === undefined ? "·" : value}</div>
    <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">{label}</div>
  </div>
);

// ── records as OFFICIAL INSTRUMENTS — not work items ──────────────────────────
const Instruments: React.FC<{ title: string; items: DocListItem[]; empty: string; cta?: { to: string; label: string }; tone?: "default" | "warn" }> = ({ title, items, empty, cta, tone = "default" }) => (
  <div>
    {(title || cta) && (
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className={`text-[13px] font-semibold ${tone === "warn" ? "text-amber-300/90" : "text-white/65"}`}>
          {title}{items.length > 0 && <span className="ml-2 font-mono text-[11px] text-white/30">{items.length}</span>}
        </h3>
        {cta && items.length > 0 && <Link to={cta.to} className="text-[12px] font-semibold text-seal-light transition hover:text-white">{cta.label} →</Link>}
      </div>
    )}
    {items.length === 0 ? (
      empty ? <p className="flex items-center gap-2.5 py-3 text-[13.5px] text-white/40"><span className="text-emerald-400/60" aria-hidden>✓</span>{empty}</p> : null
    ) : (
      <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.012]">
        {items.slice(0, 5).map((d) => (
          <li key={d.documentId}>
            <Link to={`/console/documents/${d.documentId}`} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.025]">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Official Record</div>
                <div className="mt-1 truncate font-serif text-[16px] font-semibold tracking-tight text-white">{d.title || "Untitled record"}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[11px] text-white/40">
                  <ClassBadge level={d.classification?.level} scheme={d.classification?.scheme} />
                  <span className="capitalize">{d.docType.replace(/_/g, " ")}</span>
                  {d.version != null && <span>· v{d.version}</span>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <LifecycleBadge state={d.lifecycle} />
                <div className="mt-1.5 text-[11px] text-white/30">{timeAgo(d.updatedAt)}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const FirstRun: React.FC<{ canAuthor: boolean }> = ({ canAuthor }) => {
  const steps = [
    { n: "I", t: "Compose a record", d: "Author a briefing, report, or policy paper from a structured template." },
    { n: "II", t: "Submit for governance", d: "It enters the approval chain — reviewed and approved before anything is produced." },
    { n: "III", t: "Publish & preserve", d: "On approval it is rendered, published as an official record, and sealed for preservation." },
  ];
  return (
    <div className="py-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-seal-light">Welcome to Dispatch</div>
      <h1 className="mt-3 font-serif text-[2.2rem] font-bold leading-tight tracking-tight text-white">Your institution holds no records yet</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/55">Your evaluation includes three official records. This is how the governed pipeline works.</p>
      <ol className="mt-9 space-y-6">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-5">
            <div className="font-serif text-lg font-bold text-seal-light/70">{s.n}</div>
            <div>
              <div className="text-[15px] font-semibold text-white">{s.t}</div>
              <div className="mt-1 max-w-md text-[13.5px] leading-relaxed text-white/50">{s.d}</div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-wrap items-center gap-5">
        {canAuthor && <Link to="/console/create" className="inline-flex items-center gap-2 rounded-md bg-seal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-seal-light">Create your first record →</Link>}
        <Link to="/console/library" className="text-sm font-semibold text-white/50 transition hover:text-white">Browse records</Link>
      </div>
    </div>
  );
};

export default Dashboard;

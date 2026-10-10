import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDocuments, audit, getStats, getGovernanceOverview, type DocListItem, type AuditEvent, type Lifecycle, type Stats, type GovOverview, humanError } from "../lib/api";
import { timeAgo } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { recordTypeLabel } from "../lib/recordTypes";
import { actorName, fmtDateTime, waited } from "../lib/format";
import OfficeHome from "../components/OfficeHome";
import { Alert, Badge, Button, ClassificationMark, EmptyState, LifecycleStatus, Metric, PageHeader, Panel, Section, Skeleton, cx, lifecycleMeta } from "../components/console/ds";
import { Icon } from "../components/console/icons";

// Operations COMMAND — the platform is about GOVERNANCE, so the surface leads
// with a governance-health verdict, not a record count. Every signal is derived
// from LIVE state (the governance overview + the document store); where there is
// no data to assert a problem it says so honestly. Order of authority:
//   0. Masthead  ·  Office home (the operator's own authority)
//   1. Governance status (the verdict + the few numbers that matter)
//   2. Official record lifecycle (the centerpiece; every stage links to the register)
//   3. Requires action  ·  4. The record  ·  5. Ledger  ·  6. Activity
// Colour is reserved for meaning: blue = wayfinding/actionable, amber/red =
// exceptions, gold = preserved/sealed evidence. A healthy institution reads calm.

// "draft" is fetched so records RETURNED for revision (the engine moves them to
// draft) are visible here — previously they vanished from the command surface.
const ALL: Lifecycle[] = ["in_review", "approved", "rendered", "published", "rejected", "archived", "draft", "withdrawn"];
const LIMIT = 100; // per-state page size; counts at the limit are shown as "100+"

const Dashboard: React.FC = () => {
  const { has, session } = useAuth();
  const [counts, setCounts] = useState<Record<string, DocListItem[]>>({});
  const [activity, setActivity] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [gov, setGov] = useState<GovOverview | null>(null);
  const [evaluatedAt, setEvaluatedAt] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true); setErr(null);
    getStats().then((s) => { if (live) setStats(s); }).catch(() => {});
    getGovernanceOverview().then((g) => { if (live) setGov(g); }).catch(() => {});
    (async () => {
      try {
        const entries = await Promise.all(
          ALL.map(async (s) => [s, (await listDocuments({ state: s, limit: LIMIT })).items] as const),
        );
        if (live) { setCounts(Object.fromEntries(entries)); setEvaluatedAt(new Date()); }
      } catch (e) { if (live) setErr(humanError(e, "The command overview could not be loaded.")); }
      finally { if (live) setLoading(false); }
    })();
    if (has("dispatch:audit")) {
      audit({ limit: 12 }).then((r) => { if (live) setActivity(r.events); }).catch(() => {});
    }
    return () => { live = false; };
  }, [has, tick]);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  // Returning to the tab after a while re-evaluates, so the command surface is
  // never silently stale; the "Evaluated hh:mm" stamp always states the age.
  useEffect(() => {
    const h = () => { if (document.visibilityState === "visible" && evaluatedAt && Date.now() - evaluatedAt.getTime() > 60_000) refresh(); };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [evaluatedAt, refresh]);

  const n = (s: string) => counts[s]?.length ?? 0;
  const capped = (s: string) => n(s) >= LIMIT;
  const inReview = n("in_review"), approved = n("approved"), rendered = n("rendered"), published = n("published"), preserved = n("archived"), rejected = n("rejected"), drafts = n("draft"), withdrawn = n("withdrawn");
  const totalDocs = inReview + approved + rendered + published + preserved + rejected + drafts + withdrawn;
  const firstRun = !loading && !err && totalDocs === 0;

  // Governance health — derived from real compliance signals. A violation is a
  // governed publication that does NOT carry a compliant certificate; expired
  // authorities are delegations past their window. Healthy = neither exists.
  const c = gov?.compliance;
  const violations = c ? Math.max(0, c.governed - c.compliant) : 0;
  const expired = c?.expiredAuthorities ?? 0;
  const fmtN = (s: string) => (capped(s) ? `${LIMIT}+` : n(s));

  return (
    <div>
      <PageHeader
        eyebrow="Operations command"
        title="Command centre"
        description="The official record lifecycle, governance standing, outstanding decisions and evidence trail for your institution — read from the live API under your credential's scope."
        meta={<>
          <span className="text-sd-text2">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
          <span className="flex items-center gap-1.5">{loading ? "Evaluating…" : evaluatedAt ? <><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sd-ok" />Evaluated {evaluatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</> : "Not evaluated"}</span>
          {session?.tenantId && <span>Inst. {session.tenantId.slice(0, 8)}</span>}
        </>}
        actions={<>
          <Button variant="ghost" icon={<Icon.refresh />} onClick={refresh} loading={loading} aria-label="Refresh command overview">Refresh</Button>
          <Link to="/console/library" className="inline-flex h-9 items-center gap-2 rounded-lg border border-sd-line bg-sd-raised px-3.5 text-[13px] font-semibold text-sd-text hover:bg-sd-hover"><Icon.register />Browse records</Link>
          {has("dispatch:render") && <Link to="/console/create" className="inline-flex h-9 items-center gap-2 rounded-lg bg-sd-accentbg px-3.5 text-[13px] font-semibold text-sd-accentink hover:bg-white"><Icon.plus />Create official record</Link>}
        </>}
      />

      {err && <Alert tone="bad" title="Overview unavailable" className="mb-5" action={<Button size="sm" onClick={refresh}>Try again</Button>}>{err}</Alert>}

      <OfficeHome subject={session?.subject} refreshKey={tick} />

      {firstRun ? <FirstRun canAuthor={has("dispatch:render")} /> : (
        <>
          <GovernanceStatus loading={loading} hasGov={!!c} violations={violations} expired={expired}
            governed={c?.governed ?? 0} compliant={c?.compliant ?? 0} awaitingPublication={rendered} awaitingLabel={fmtN("rendered")}
            canPublish={has("dispatch:publish")} />

          <Section title="Official record lifecycle" aside="Submit → Govern → Approve → Render → Publish → Preserve">
            <LifecycleStrip loading={loading} stages={[
              { state: "in_review", n: fmtN("in_review"), sub: "Awaiting a decision" },
              { state: "approved", n: fmtN("approved"), sub: "Clearing render" },
              { state: "rendered", n: fmtN("rendered"), sub: "Awaiting publication" },
              { state: "published", n: fmtN("published"), sub: "Released to record" },
              { state: "archived", n: fmtN("archived"), sub: "Sealed · certificate" },
            ]} offPath={[
              { state: "rejected", n: fmtN("rejected"), sub: "Off the publication path" },
              { state: "draft", n: fmtN("draft"), sub: "Returned or not submitted" },
              { state: "withdrawn", n: fmtN("withdrawn"), sub: "Withdrawn from publication" },
            ]} />
            <p className="mt-2 text-[12px] text-sd-text3">Approval does not itself publish a record; publication follows the governing policy and is released only by the publication authority. Counts are per state, up to {LIMIT} each.</p>
          </Section>

          <Section title="Requires action">
            <div className="grid gap-4 lg:grid-cols-2">
              {has("dispatch:approve") && (
                <Queue title="Awaiting approval" items={counts["in_review"] ?? []} loading={loading} oldestFirst
                  empty="No records awaiting approval — the governance queue is clear."
                  cta={{ to: "/console/review", label: "Open review queue" }} />
              )}
              <Queue title="Ready for publication" items={counts["rendered"] ?? []} loading={loading} oldestFirst
                empty="Nothing ready to publish. No publication backlog."
                cta={rendered > 0 ? { to: "/console/library?state=rendered", label: "View records" } : undefined} />
              {rejected > 0 && (
                <Queue title="Rejected" items={counts["rejected"] ?? []} loading={loading} empty="Nothing rejected." tone="bad"
                  cta={{ to: "/console/library?state=rejected", label: "View rejected" }} />
              )}
              {drafts > 0 && (
                <Queue title="Draft · returned for revision or not submitted" items={counts["draft"] ?? []} loading={loading} empty="No drafts." tone="warn" />
              )}
            </div>
          </Section>

          <Section title="The record">
            <div className="grid gap-4 lg:grid-cols-2">
              <Queue title="Published" items={counts["published"] ?? []} loading={loading}
                empty="No records published yet." cta={{ to: "/console/library?state=published", label: "Official records" }} />
              <Queue title="Preserved" items={counts["archived"] ?? []} loading={loading}
                empty="No records preserved yet." cta={{ to: "/console/archives", label: "Preservation" }} />
            </div>
          </Section>

          <Section title="Institution ledger" aside="Authoritative totals from the API">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-sd-line bg-sd-line lg:grid-cols-4">
              {[
                { v: stats?.officialRecords, l: "Official records", s: "Created to date" },
                { v: c?.compliant, l: "Governance certificates", s: "Compliant publications" },
                { v: loading ? undefined : fmtN("archived"), l: "Records preserved", s: "Sealed for permanence" },
                { v: stats?.auditEvents, l: "Evidence events", s: "Recorded to the append-only trail" },
              ].map((m) => <div key={m.l} className="bg-sd-panel p-4"><Metric value={m.v} label={m.l} sub={m.s} loading={loading && m.v === undefined} /></div>)}
            </div>
          </Section>

          {has("dispatch:audit") && (
            <Section title="Recent activity" aside={<Link to="/console/audit" className="font-semibold text-sd-accent hover:underline">Evidence chain →</Link>}>
              <ActivityList events={activity} />
            </Section>
          )}
        </>
      )}
    </div>
  );
};

// ── 1 · GOVERNANCE STATUS ─────────────────────────────────────────────────────
const GovernanceStatus: React.FC<{
  loading: boolean; hasGov: boolean; violations: number; expired: number;
  governed: number; compliant: number; awaitingPublication: number; awaitingLabel: React.ReactNode; canPublish: boolean;
}> = ({ loading, hasGov, violations, expired, governed, compliant, awaitingPublication, awaitingLabel, canPublish }) => {
  const healthy = hasGov && violations === 0 && expired === 0;
  const tone = loading || !hasGov ? "unknown" : healthy ? "healthy" : "attention";
  const headline = loading ? "Assessing governance…"
    : !hasGov ? "Governance status unavailable"
    : healthy ? "Governance healthy"
    : "Governance — attention required";

  const issues: string[] = [];
  if (violations > 0) issues.push(`${violations} publication${violations > 1 ? "s" : ""} without a compliant certificate`);
  if (expired > 0) issues.push(`${expired} expired authorit${expired > 1 ? "ies" : "y"}`);
  const sub = loading ? "Reading the governance overview…"
    : !hasGov ? "Live governance metrics are not available for this credential. No compliance result is asserted."
    : healthy
      ? (governed > 0
          ? `All governance policies satisfied · ${compliant}/${governed} governed publications carry a compliant certificate · no expired authorities.`
          : "No records under an enforced policy yet · no governance violations or expired authorities.")
      : issues.join(" · ");

  return (
    <Panel tone={tone === "attention" ? "warn" : "default"} padded={false}
      footer={canPublish && awaitingPublication > 0 ? (
        <Link to="/console/library?state=rendered" className="flex items-center gap-1.5 text-[12.5px] font-semibold text-sd-accent hover:underline">
          {awaitingLabel} record{awaitingPublication > 1 ? "s" : ""} ready for your publication <Icon.arrowRight className="h-3.5 w-3.5" />
        </Link>) : undefined}>
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-sd-text3">Institution status · governance</span>
            {tone === "healthy" && <Badge tone="ok" glyph="●">Healthy</Badge>}
            {tone === "attention" && <Badge tone="warn" glyph="▲">Attention</Badge>}
            {tone === "unknown" && <Badge tone="neutral">{loading ? "Evaluating" : "Unavailable"}</Badge>}
          </div>
          <h2 className="mt-2 font-serif text-[22px] font-semibold leading-tight tracking-[-0.01em] text-sd-text">{headline}</h2>
          <p className="mt-1 max-w-[70ch] text-[13px] leading-relaxed text-sd-text2">{sub}</p>
        </div>
        <dl className="grid shrink-0 grid-cols-3 divide-x divide-sd-soft rounded-lg border border-sd-line bg-sd-sunken lg:w-[440px]">
          <Signal label="Awaiting publication" value={loading ? null : awaitingLabel} tone={awaitingPublication > 0 ? "info" : "ok"} />
          <Signal label="Governance violations" value={loading ? null : violations} tone={violations > 0 ? "bad" : "ok"} />
          <Signal label="Expired authorities" value={loading ? null : expired} tone={expired > 0 ? "warn" : "ok"} />
        </dl>
      </div>
    </Panel>
  );
};

const Signal: React.FC<{ label: string; value: React.ReactNode | null; tone: "ok" | "info" | "warn" | "bad" }> = ({ label, value, tone }) => {
  const color = { ok: "text-sd-text", info: "text-sd-accent", warn: "text-sd-warn", bad: "text-sd-bad" }[tone];
  return (
    <div className="px-3 py-3 text-center">
      <dd className={cx("font-mono text-[24px] font-semibold leading-none tabular-nums", color)}>{value === null ? <Skeleton className="mx-auto h-6 w-8" /> : value}</dd>
      <dt className="mt-1.5 text-[11px] font-semibold leading-tight text-sd-text3">{label}</dt>
    </div>
  );
};

// ── 2 · OFFICIAL RECORD LIFECYCLE ─────────────────────────────────────────────
type Stage = { state: Lifecycle; n: React.ReactNode; sub: string };
const LifecycleStrip: React.FC<{ loading: boolean; stages: Stage[]; offPath: Stage[] }> = ({ loading, stages, offPath }) => {
  const cell = (s: Stage, i: number, arrow: boolean) => {
    const m = lifecycleMeta(s.state);
    const zero = s.n === 0;
    return (
      <li key={s.state} className="relative min-w-0">
        <Link to={s.state === "archived" ? "/console/archives" : `/console/library?state=${s.state}`}
          className="block h-full bg-sd-panel px-4 py-3.5 transition-colors hover:bg-sd-raised">
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-sd-text2"><span aria-hidden className="text-[10px] text-sd-text3">{m.glyph}</span>{m.label}</div>
          <div className={cx("mt-2 font-mono text-[28px] font-semibold leading-none tabular-nums", zero ? "text-sd-faint" : s.state === "rejected" ? "text-sd-bad" : s.state === "archived" ? "text-sd-gold" : "text-sd-text")}>
            {loading ? <Skeleton className="h-7 w-10" /> : s.n}
          </div>
          <div className="mt-1.5 text-[11.5px] text-sd-text3">{s.sub}</div>
        </Link>
        {arrow && i < stages.length - 1 && <span aria-hidden className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-sd-line bg-sd-bg p-0.5 text-sd-text3 md:block"><Icon.chevronRight className="h-3 w-3" /></span>}
      </li>
    );
  };
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
      <ol aria-label="Publication path" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-sd-line bg-sd-line sm:grid-cols-3 md:grid-cols-5">
        {stages.map((s, i) => cell(s, i, true))}
      </ol>
      <ol aria-label="Off the publication path" className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-dashed border-sd-line bg-sd-line">
        {offPath.map((s, i) => cell(s, i, false))}
      </ol>
    </div>
  );
};

const FirstRun: React.FC<{ canAuthor: boolean }> = ({ canAuthor }) => {
  const steps = [
    { n: 1, t: "Compose a record", d: "Author an executive briefing, board report, or policy paper from a structured template." },
    { n: 2, t: "Submit for governance", d: "It enters the approval chain — reviewed and approved before anything is produced." },
    { n: 3, t: "Approve, publish, preserve", d: "On approval it is rendered, published as an official record, and sealed for preservation." },
  ];
  return (
    <Panel className="mt-2">
      <div className="max-w-xl p-2">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-sd-accent">Welcome to Dispatch</div>
        <h2 className="mt-1.5 font-serif text-[22px] font-semibold text-sd-text">Your institution has no records yet</h2>
        <p className="mt-1 text-[13px] text-sd-text2">Your evaluation includes three official records. Here is how the governed pipeline works.</p>
      </div>
      <ol className="mt-3 grid gap-3 p-2 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="rounded-lg border border-sd-line bg-sd-sunken p-4">
            <div className="grid h-7 w-7 place-items-center rounded-full border border-sd-accent/40 font-mono text-[12px] font-bold text-sd-accent">{s.n}</div>
            <div className="mt-3 text-[13.5px] font-semibold text-sd-text">{s.t}</div>
            <div className="mt-1 text-[12.5px] leading-snug text-sd-text3">{s.d}</div>
          </li>
        ))}
      </ol>
      <div className="mt-2 flex flex-wrap items-center gap-3 p-2">
        {canAuthor && <Link to="/console/create" className="inline-flex h-9 items-center gap-2 rounded-lg bg-sd-accentbg px-3.5 text-[13px] font-semibold text-sd-accentink hover:bg-white">Create your first record <Icon.arrowRight className="h-3.5 w-3.5" /></Link>}
        <Link to="/console/library" className="text-[13px] font-semibold text-sd-text2 hover:text-sd-text">Browse records</Link>
      </div>
    </Panel>
  );
};

const ActivityList: React.FC<{ events: AuditEvent[] }> = ({ events }) => (
  <Panel padded={false}>
    {events.length === 0 ? (
      <EmptyState compact title="No recorded events yet">Activity appears here as records move through governance.</EmptyState>
    ) : (
      <ol className="divide-y divide-sd-soft">
        {events.map((e) => (
          <li key={e.eventId} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 px-4 py-2 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,220px)_auto]">
            <time dateTime={e.ts} title={fmtDateTime(e.ts)} className="hidden font-mono text-[11.5px] tabular-nums text-sd-text3 sm:block">{fmtDateTime(e.ts)}</time>
            <span className="flex min-w-0 items-center gap-2"><span className="truncate font-mono text-[12px] text-sd-text">{e.action}</span>{e.sha256 && <Badge tone="gold" glyph="#" title={`SHA-256 recorded: ${e.sha256}`}>Digest</Badge>}</span>
            <span className="hidden truncate text-[12px] text-sd-text2 sm:block">{actorName(e.actor)}</span>
            {e.targetType === "document" && e.targetId
              ? <Link to={`/console/documents/${e.targetId}`} className="text-[12px] font-semibold text-sd-accent hover:underline">{timeAgo(e.ts)} →</Link>
              : <span className="text-[12px] text-sd-text3">{timeAgo(e.ts)}</span>}
          </li>
        ))}
      </ol>
    )}
  </Panel>
);

// Action queues read oldest-first with the time each record has waited — the
// longest-held record is the one an institution is most accountable for.
const since = (d: DocListItem) => d.waitingSince ?? d.submittedAt ?? d.updatedAt;
const Queue: React.FC<{ title: string; items: DocListItem[]; empty: string; cta?: { to: string; label: string }; tone?: "default" | "warn" | "bad"; loading?: boolean; oldestFirst?: boolean }> = ({ title, items: raw, empty, cta, tone = "default", loading, oldestFirst }) => {
  const items = oldestFirst ? [...raw].sort((a, b) => new Date(since(a) ?? 0).getTime() - new Date(since(b) ?? 0).getTime()) : raw;
  return (
  <Panel padded={false} tone={tone === "default" ? "default" : tone}
    title={<span className="flex items-center gap-2">{title}<span className="rounded bg-sd-sunken px-1.5 py-0.5 font-mono text-[11px] text-sd-text2">{loading ? "…" : items.length >= LIMIT ? `${LIMIT}+` : items.length}</span></span>}
    aside={cta && <Link to={cta.to} className="font-semibold text-sd-accent hover:underline">{cta.label} →</Link>}>
    {loading ? (
      <div className="space-y-2.5 p-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>
    ) : items.length === 0 ? (
      <div className="flex items-center gap-2 px-4 py-4 text-[12.5px] text-sd-text3"><Icon.check className="h-4 w-4 text-sd-ok" />{empty}</div>
    ) : (
      <ul className="divide-y divide-sd-soft">
        {items.slice(0, 5).map((d) => (
          <li key={d.documentId}>
            <Link to={`/console/documents/${d.documentId}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-sd-raised sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
              <ClassificationMark level={d.classification?.level} scheme={d.classification?.scheme} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-sd-text">{d.title || "(untitled)"}</span>
                <span className="block truncate text-[11.5px] text-sd-text3">{recordTypeLabel(d.docType)}{d.currentAuthority ? ` · ${d.currentAuthority}` : ""}</span>
              </span>
              <span className="hidden sm:block"><LifecycleStatus state={d.lifecycle} /></span>
              {oldestFirst
                ? <span className="w-16 text-right font-mono text-[11.5px] text-sd-warn" title="Time waiting">{waited(since(d))}</span>
                : <span className="w-16 text-right font-mono text-[11.5px] text-sd-text3" title={fmtDateTime(d.updatedAt)}>{timeAgo(d.updatedAt)}</span>}
            </Link>
          </li>
        ))}
        {items.length > 5 && cta && <li className="px-4 py-2 text-[12px]"><Link to={cta.to} className="font-semibold text-sd-accent hover:underline">+{items.length - 5} more</Link></li>}
      </ul>
    )}
  </Panel>
  );
};

export default Dashboard;

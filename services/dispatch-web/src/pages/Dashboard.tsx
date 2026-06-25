import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDocuments, getStats, getGovernanceOverview, type DocListItem, type Lifecycle, type Stats, type GovOverview, humanError } from "../lib/api";
import { ClassBadge, LifecycleBadge } from "../lib/ui";
import { useAuth } from "../lib/auth";

// OPERATIONS COMMAND — the command center of a sovereign institution. One
// continuous instrument, read top to bottom: the Governance verdict (the live
// output of the governance engine) → the Official Record Lifecycle as a
// procession → records presented as case files → preservation → quiet evidence.
// Every value is derived from live state; commercial messaging is kept off this
// surface entirely. Craft: 8px rhythm, restrained borders, lit surfaces over
// outlines, gentle motion, a single type/spacing system.

const ALL: Lifecycle[] = ["in_review", "approved", "rendered", "published", "rejected", "archived"];
const fmtEval = (d: Date): string => `Today · ${d.toUTCString().slice(17, 22)} UTC`;

const Dashboard: React.FC = () => {
  const { has } = useAuth();
  const [counts, setCounts] = useState<Record<string, DocListItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [gov, setGov] = useState<GovOverview | null>(null);
  const [evaluatedAt, setEvaluatedAt] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let live = true;
    setMounted(true);
    getStats().then((s) => { if (live) setStats(s); }).catch(() => {});
    getGovernanceOverview().then((g) => { if (live) { setGov(g); setEvaluatedAt(new Date()); } }).catch(() => {});
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
    <div className={`mx-auto max-w-4xl transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
      {err && <div className="mb-8 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</div>}

      {firstRun ? <FirstRun canAuthor={has("dispatch:render")} /> : (
        <>
          <GovernanceStatus loading={loading} hasGov={!!c} violations={violations} expired={expired}
            governed={c?.governed ?? 0} awaitingPublication={rendered} evaluatedAt={evaluatedAt} />

          <Lifecycle loading={loading} inReview={inReview} approved={approved + rendered} published={published} preserved={preserved} />

          <Section title="Requires Action">
            {has("dispatch:approve") && <CaseFiles items={counts["in_review"] ?? []} caption="Awaiting approval" empty="No records await approval — the governance queue is clear." cta={{ to: "/console/review", label: "Open Governance" }} />}
            <CaseFiles items={counts["rendered"] ?? []} caption="Ready for publication" empty="Nothing is awaiting publication — no backlog." cta={rendered > 0 ? { to: "/console/library", label: "Open Records" } : undefined} />
            {returned > 0 && <CaseFiles items={counts["rejected"] ?? []} caption="Returned for revision" empty="" tone="warn" />}
          </Section>

          <Section title="Published">
            <CaseFiles items={counts["published"] ?? []} empty="No records have completed publication yet — they appear here as the lifecycle advances." cta={{ to: "/console/library", label: "Official Records" }} />
          </Section>

          <Section title="Preservation">
            <CaseFiles items={counts["archived"] ?? []} empty="No records are sealed for preservation yet — preserved records are permanent and tamper-evident." cta={{ to: "/console/archives", label: "Preservation" }} />
          </Section>

          <Section title="Institution Ledger">
            <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-4">
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

// ── INSTITUTION STATUS — the live output of the governance engine ─────────────
const GovernanceStatus: React.FC<{
  loading: boolean; hasGov: boolean; violations: number; expired: number;
  governed: number; awaitingPublication: number; evaluatedAt: Date | null;
}> = ({ loading, hasGov, violations, expired, governed, awaitingPublication, evaluatedAt }) => {
  const healthy = hasGov && violations === 0 && expired === 0;
  const tone: "healthy" | "attention" | "unknown" = loading || !hasGov ? "unknown" : healthy ? "healthy" : "attention";
  const accent = { healthy: "border-emerald-400/70", attention: "border-amber-400/70", unknown: "border-white/20" }[tone];
  const dot = { healthy: "bg-emerald-400", attention: "bg-amber-400", unknown: "bg-white/40" }[tone];
  const verdict = loading ? "Assessing governance" : !hasGov ? "Governance status unavailable" : healthy ? "Governance Healthy" : "Governance — Attention Required";

  // The engine's findings — derived, plain-language, the "why" beneath the verdict.
  const findings: { text: React.ReactNode; ok: boolean }[] = [];
  if (hasGov) {
    findings.push({ ok: true, text: governed > 0 ? "All publication policies satisfied" : "No records under an enforced policy yet" });
    findings.push({ ok: awaitingPublication === 0, text: <><Num>{awaitingPublication}</Num> record{awaitingPublication === 1 ? "" : "s"} authorized for publication</> });
    findings.push({ ok: violations === 0, text: <><Num bad={violations > 0}>{violations}</Num> governance violation{violations === 1 ? "" : "s"}</> });
    findings.push({ ok: expired === 0, text: <><Num warn={expired > 0}>{expired}</Num> authorit{expired === 1 ? "y" : "ies"} require renewal</> });
  }

  return (
    <section className={`rounded-2xl border-l-[3px] bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent px-8 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-12 sm:py-14 ${accent}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40">Institution Status</div>
      <div className="mt-6 flex items-center gap-4">
        <span className="relative flex h-3 w-3">
          {tone !== "unknown" && !loading && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${dot}`} />}
          <span className={`relative inline-flex h-3 w-3 rounded-full ${dot}`} />
        </span>
        <h1 className="font-serif text-[2.5rem] font-bold leading-none tracking-tight text-white sm:text-[3.25rem]">{verdict}</h1>
      </div>

      {hasGov && !loading && (
        <ul className="mt-8 space-y-2.5">
          {findings.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-[15px] leading-relaxed text-white/70">
              <span className={`text-[13px] ${f.ok ? "text-emerald-400/70" : "text-amber-300/80"}`} aria-hidden>{f.ok ? "✓" : "!"}</span>
              {f.text}
            </li>
          ))}
        </ul>
      )}

      {evaluatedAt && (
        <div className="mt-8 border-t border-white/[0.06] pt-4 text-[12px] text-white/35">
          Last governance evaluation · <span className="text-white/55">{fmtEval(evaluatedAt)}</span>
        </div>
      )}
    </section>
  );
};

const Num: React.FC<{ children: React.ReactNode; bad?: boolean; warn?: boolean }> = ({ children, bad, warn }) => (
  <span className={`font-mono font-bold tabular-nums ${bad ? "text-red-300" : warn ? "text-amber-300" : "text-white"}`}>{children}</span>
);

// ── OFFICIAL RECORD LIFECYCLE — a procession of engraved milestones ───────────
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
      <div className="mx-auto flex max-w-sm flex-col items-center py-4">
        {stages.map((s, i) => (
          <React.Fragment key={s.name}>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-[1.6rem] font-semibold tracking-tight text-white/90 sm:text-[1.9rem]">{s.name}</span>
              {s.n !== null && s.n > 0 && !loading && (
                <span className="font-mono text-sm font-bold tabular-nums text-seal-light">{s.n}</span>
              )}
            </div>
            {i < stages.length - 1 && <span className="my-3.5 h-9 w-px bg-gradient-to-b from-white/25 to-white/[0.06]" aria-hidden />}
          </React.Fragment>
        ))}
      </div>
    </Section>
  );
};

// ── section — generous rhythm, a single quiet kicker, no heavy dividers ───────
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-16">
    <div className="mb-6 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/40">{title}</div>
    <div className="space-y-8">{children}</div>
  </section>
);

const Stat: React.FC<{ label: string; value?: number }> = ({ label, value }) => (
  <div>
    <div className="font-mono text-[2.1rem] font-bold leading-none tabular-nums text-white">{value === undefined ? "·" : value}</div>
    <div className="mt-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">{label}</div>
  </div>
);

// ── records as CASE FILES — official instruments, one consistent treatment ────
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/30">{label}</div>
    <div className="mt-1.5 text-[12.5px] text-white/75">{children}</div>
  </div>
);

const CaseFiles: React.FC<{ items: DocListItem[]; caption?: string; empty: string; cta?: { to: string; label: string }; tone?: "default" | "warn" }> = ({ items, caption, empty, cta, tone = "default" }) => (
  <div>
    {(caption || (cta && items.length > 0)) && (
      <div className="mb-3 flex items-center justify-between">
        <h3 className={`text-[12.5px] font-semibold ${tone === "warn" ? "text-amber-300/90" : "text-white/60"}`}>
          {caption}{caption && items.length > 0 && <span className="ml-2 font-mono text-[11px] text-white/30">{items.length}</span>}
        </h3>
        {cta && items.length > 0 && <Link to={cta.to} className="text-[12px] font-semibold text-seal-light transition duration-200 hover:text-white">{cta.label} →</Link>}
      </div>
    )}
    {items.length === 0 ? (
      empty ? <p className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-white/40"><span className="mt-0.5 text-emerald-400/60" aria-hidden>✓</span>{empty}</p> : null
    ) : (
      <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.01]">
        {items.slice(0, 5).map((d) => (
          <li key={d.documentId}>
            <Link to={`/console/documents/${d.documentId}`} className="block px-6 py-5 transition duration-200 hover:bg-white/[0.025]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/30">Official Record</div>
              <div className="mt-1.5 font-serif text-[17px] font-semibold leading-snug tracking-tight text-white">{d.title || "Untitled record"}</div>
              <div className="mt-4 flex flex-wrap gap-x-12 gap-y-3">
                <Field label="Classification"><ClassBadge level={d.classification?.level} scheme={d.classification?.scheme} /></Field>
                <Field label="Record type"><span className="capitalize">{d.docType.replace(/_/g, " ")}</span>{d.version != null && <span className="text-white/40"> · v{d.version}</span>}</Field>
                <Field label="Status"><LifecycleBadge state={d.lifecycle} /></Field>
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
    <div className="py-8">
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-seal-light">Welcome to Dispatch</div>
      <h1 className="mt-4 font-serif text-[2.4rem] font-bold leading-tight tracking-tight text-white">Your institution holds no records yet</h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">Your evaluation includes three official records. This is how the governed pipeline works.</p>
      <ol className="mt-10 space-y-7">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-6">
            <div className="font-serif text-xl font-bold text-seal-light/70">{s.n}</div>
            <div>
              <div className="text-[15px] font-semibold text-white">{s.t}</div>
              <div className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-white/50">{s.d}</div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-12 flex flex-wrap items-center gap-6">
        {canAuthor && <Link to="/console/create" className="inline-flex items-center gap-2 rounded-md bg-seal px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-seal-light">Create your first record →</Link>}
        <Link to="/console/library" className="text-sm font-semibold text-white/50 transition duration-200 hover:text-white">Browse records</Link>
      </div>
    </div>
  );
};

export default Dashboard;

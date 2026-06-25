import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGovernanceOverview, type GovOverview, humanError } from "../lib/api";
import { Card, ClassBadge, timeAgo } from "../lib/ui";

// Governance Monitor — the operational view. A compliance officer answers, in
// five seconds: what is awaiting whom, what is awaiting publication, and which
// authorities have expired. Live, derived from the governance engine.
const subjectLabel = (s: string) => s.replace(/^svc:/, "").replace(/^user:/, "");

const GovernanceMonitor: React.FC = () => {
  const [ov, setOv] = useState<GovOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { getGovernanceOverview().then(setOv).catch((e) => setErr(humanError(e, "Could not load the governance monitor."))); }, []);

  const expiredDelegations = ov?.delegations.filter((d) => d.expired) ?? [];

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">Governance</div>
        <h1 className="mt-1.5 font-serif text-[1.9rem] font-bold leading-tight tracking-tight text-white">Governance Oversight</h1>
        <p className="text-sm text-white/50">What is in flight, who must act next, and what is blocked — across every governed record.</p>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[["Pending approvals", ov?.pending.length], ["Awaiting publication", ov?.awaitingPublication.length], ["Expired authorities", ov?.compliance.expiredAuthorities], ["Governance exceptions", ov?.compliance.exceptions]].map(([l, v]) => (
          <Card key={l as string} className="p-4">
            <div className="text-2xl font-bold tabular-nums text-white">{v === undefined ? "·" : (v as number)}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{l}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Queue title="Pending approvals" empty="Nothing awaiting review.">
          {ov?.pending.map((p) => (
            <Row key={p.documentId} to={`/console/documents/${p.documentId}`} level={p.classification?.level} title={p.title} sub={p.policyName || p.docType}
              tag={<span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">Awaiting {p.awaiting}</span>} meta={timeAgo(p.submittedAt)} />
          ))}
        </Queue>

        <Queue title="Awaiting publication" empty="Nothing awaiting a publication authority.">
          {ov?.awaitingPublication.map((p) => (
            <Row key={p.documentId} to={`/console/documents/${p.documentId}`} level={p.classification?.level} title={p.title} sub={p.docType}
              tag={<span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-300">Ready · needs authority</span>} />
          ))}
        </Queue>

        <Queue title="Expired delegations" empty="No expired delegations.">
          {expiredDelegations.map((d, i) => (
            <Row key={i} level={undefined} title={`${subjectLabel(d.delegate_subject)} → ${d.role_key}`} sub={d.reason || "delegation"}
              tag={<span className="rounded-full bg-zinc-500/20 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">Expired {d.ends_at ? new Date(d.ends_at).toLocaleDateString() : ""}</span>} />
          ))}
        </Queue>

        <Queue title="Active delegations" empty="No active delegations.">
          {ov?.delegations.filter((d) => !d.expired).map((d, i) => (
            <Row key={i} level={undefined} title={`${subjectLabel(d.delegate_subject)} → ${d.role_key}`} sub={d.reason || "delegation"}
              tag={<span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">Active</span>} />
          ))}
        </Queue>
      </div>
    </div>
  );
};

const Queue: React.FC<{ title: string; empty: string; children?: React.ReactNode }> = ({ title, empty, children }) => {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/60">{title}</h2>
      {items.length === 0 ? <p className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/30">{empty}</p>
        : <Card><ul className="divide-y divide-white/5">{items}</ul></Card>}
    </section>
  );
};

const Row: React.FC<{ to?: string; level?: string; title: string; sub: string; tag: React.ReactNode; meta?: string }> = ({ to, level, title, sub, tag, meta }) => {
  const body = (
    <div className="flex items-center gap-3 px-4 py-3">
      {level !== undefined && <ClassBadge level={level} />}
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-white">{title || "(untitled)"}</div><div className="truncate text-[11px] text-white/40">{sub}</div></div>
      {tag}
      {meta && <span className="w-14 shrink-0 text-right text-[11px] text-white/30">{meta}</span>}
    </div>
  );
  return <li>{to ? <Link to={to} className="block hover:bg-white/5">{body}</Link> : body}</li>;
};

export default GovernanceMonitor;

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGovernanceIntelligence, type GovIntelligence, humanError } from "../lib/api";
import { Card, ClassBadge } from "../lib/ui";
import { recordTypeLabel } from "../lib/recordTypes";

// Governance Intelligence — the oversight layer. Sharper than "how long overall":
// which authority is slow, who is overloaded right now, what is about to breach,
// and how the queue ages. All from timestamps the engine already records.
const fmtDur = (h: number | null): string => {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
};

const GovernanceIntelligence: React.FC = () => {
  const [d, setD] = useState<GovIntelligence | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { getGovernanceIntelligence().then(setD).catch((e) => setErr(humanError(e, "Could not load governance intelligence."))); }, []);

  const maxTput = Math.max(1, ...(d?.throughput.map((t) => t.count) ?? [1]));
  const maxWork = Math.max(1, ...(d?.workloadByAuthority.map((r) => r.count) ?? [1]));
  const slowest = d?.authorityPerformance.find((a) => a.avgResponseHours != null);

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Compliance</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Governance Intelligence</h1>
        <p className="text-sm text-white/50">Where governance slows, which authority is the constraint, who is overloaded, and what is about to breach.</p>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {/* cycle times + headline constraint */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[["Submit → Approve", d?.cycleHours.submitToApprove], ["Approve → Publish", d?.cycleHours.approveToPublish], ["Publish → Preserve", d?.cycleHours.publishToArchive]].map(([l, v]) => (
          <Card key={l as string} className="p-5">
            <div className="text-3xl font-bold tabular-nums text-white">{d ? fmtDur(v as number | null) : "·"}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{l}</div>
            <div className="mt-0.5 text-[11px] text-white/35">average cycle time</div>
          </Card>
        ))}
        <Card className="border-amber-500/25 p-5">
          <div className="truncate text-2xl font-bold text-white">{slowest ? slowest.role : "—"}</div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">Slowest authority</div>
          <div className="mt-0.5 text-[11px] text-white/35">{slowest ? `${fmtDur(slowest.avgResponseHours)} avg response` : "no data yet"}</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* authority response time — the chain constraint */}
        <Card className="p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Authority response time</div>
          {(d?.authorityPerformance.length ?? 0) === 0 ? <p className="py-4 text-sm text-white/30">No governed approvals yet.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/40"><th className="py-1.5 font-semibold">Authority</th><th className="py-1.5 text-right font-semibold">Avg. response</th><th className="py-1.5 text-right font-semibold">Decisions</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {d?.authorityPerformance.map((a) => (
                  <tr key={a.role}><td className="py-2 font-medium text-white">{a.role}</td>
                    <td className="py-2 text-right tabular-nums"><span className={(a.avgResponseHours ?? 0) > 72 ? "text-red-300" : (a.avgResponseHours ?? 0) > 24 ? "text-amber-300" : "text-white/70"}>{fmtDur(a.avgResponseHours)}</span></td>
                    <td className="py-2 text-right tabular-nums text-white/45">{a.decisions}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* current workload by authority */}
        <Card className="p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Workload now — awaiting each authority</div>
          {(d?.workloadByAuthority.length ?? 0) === 0 ? <p className="py-4 text-sm text-white/30">Nothing awaiting action.</p> : (
            <div className="space-y-2.5">
              {d?.workloadByAuthority.map((r) => (
                <div key={r.role}>
                  <div className="mb-0.5 flex items-center justify-between text-[12px]"><span className="text-white/75">{r.role}</span><span className="tabular-nums text-white/45">{r.count}</span></div>
                  <div className="h-1.5 overflow-hidden rounded bg-white/10"><div className="h-full bg-seal-light" style={{ width: `${(r.count / maxWork) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* bottlenecks — longest in flight, with whose turn */}
        <Card className="p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Longest in flight</div>
          {(d?.oldestInFlight.length ?? 0) === 0 ? <p className="py-4 text-sm text-white/30">Nothing is waiting.</p> : (
            <ul className="divide-y divide-white/5">
              {d?.oldestInFlight.map((r) => (
                <li key={r.documentId}>
                  <Link to={`/console/documents/${r.documentId}`} className="flex items-center gap-3 py-2.5 hover:bg-white/5">
                    <ClassBadge level={r.classification?.level} />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-white">{r.title || "(untitled)"}</div><div className="text-[11px] text-white/40">{recordTypeLabel(r.docType)}{r.awaiting ? ` · awaiting ${r.awaiting}` : ""}</div></div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${(r.hoursWaiting ?? 0) > 72 ? "bg-red-500/15 text-red-300" : (r.hoursWaiting ?? 0) > 24 ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-white/55"}`}>{fmtDur(r.hoursWaiting)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* aging + at-risk */}
        <Card className="p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Queue aging</div>
          <div className="mb-5 grid grid-cols-4 gap-2">
            {d?.aging.map((a) => (
              <div key={a.bucket} className="rounded-lg border border-white/10 bg-ink-900/50 p-3 text-center">
                <div className={`text-xl font-bold tabular-nums ${a.bucket === ">7d" && a.count > 0 ? "text-red-300" : a.bucket === "3–7d" && a.count > 0 ? "text-amber-300" : "text-white"}`}>{a.count}</div>
                <div className="mt-0.5 text-[10px] text-white/40">{a.bucket}</div>
              </div>
            ))}
          </div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Approvals nearing expiry</div>
          {(d?.atRisk.length ?? 0) === 0 ? <p className="py-2 text-sm text-white/30">No approvals expiring within 7 days.</p> : (
            <ul className="divide-y divide-white/5">
              {d?.atRisk.map((r) => (
                <li key={r.documentId + r.role}>
                  <Link to={`/console/documents/${r.documentId}`} className="flex items-center gap-3 py-2 hover:bg-white/5">
                    <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium text-white">{r.title}</div><div className="text-[11px] text-white/40">{r.role} approval</div></div>
                    <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">expires in {fmtDur(r.hoursLeft)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* policy performance */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Policy performance</div>
          {(d?.policyPerformance.length ?? 0) === 0 ? <p className="py-4 text-sm text-white/30">No governed publications yet.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/40"><th className="py-2 font-semibold">Policy</th><th className="py-2 text-right font-semibold">Volume</th><th className="py-2 text-right font-semibold">Avg. time to publish</th><th className="py-2 text-right font-semibold">Compliance</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {d?.policyPerformance.map((p) => (
                  <tr key={p.policy}><td className="py-2.5 font-medium text-white">{p.policy || "(unnamed)"}</td>
                    <td className="py-2.5 text-right tabular-nums text-white/70">{p.volume}</td>
                    <td className="py-2.5 text-right tabular-nums text-white/70">{p.avgDays == null ? "—" : `${p.avgDays}d`}</td>
                    <td className="py-2.5 text-right"><span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${p.complianceRate >= 100 ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{p.complianceRate}%</span></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* publication throughput */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Publication throughput · last 14 days</div>
          {(d?.throughput.length ?? 0) === 0 ? <p className="py-4 text-sm text-white/30">No publications in the window.</p> : (
            <div className="flex items-end gap-1.5" style={{ height: 120 }}>
              {d?.throughput.map((t) => (
                <div key={t.day} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div className="text-[10px] tabular-nums text-white/40">{t.count}</div>
                  <div className="w-full rounded-t bg-seal-light/70" style={{ height: `${(t.count / maxTput) * 90}px` }} />
                  <div className="text-[9px] text-white/30">{t.day}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GovernanceIntelligence;

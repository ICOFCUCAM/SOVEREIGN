import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGovernanceIntelligence, type GovIntelligence, humanError } from "../lib/api";
import { Card, ClassBadge } from "../lib/ui";
import { recordTypeLabel } from "../lib/recordTypes";

// Governance Intelligence — the oversight layer. Where do records pile up, how
// long does governance take, which policies perform, and what is the publication
// throughput. Derived from the timestamps the engine already records.
const fmtDur = (h: number | null): string => {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
};
const roleLabel = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const GovernanceIntelligence: React.FC = () => {
  const [d, setD] = useState<GovIntelligence | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { getGovernanceIntelligence().then(setD).catch((e) => setErr(humanError(e, "Could not load governance intelligence."))); }, []);

  const maxTput = Math.max(1, ...(d?.throughput.map((t) => t.count) ?? [1]));
  const maxRole = Math.max(1, ...(d?.approvalsByRole.map((r) => r.count) ?? [1]));

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Compliance</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Governance Intelligence</h1>
        <p className="text-sm text-white/50">Where governance slows, which policies perform, and how much the institution publishes.</p>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {/* cycle times */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[["Submit → Approve", d?.cycleHours.submitToApprove], ["Approve → Publish", d?.cycleHours.approveToPublish], ["Publish → Preserve", d?.cycleHours.publishToArchive]].map(([l, v]) => (
          <Card key={l as string} className="p-5">
            <div className="text-3xl font-bold tabular-nums text-white">{d ? fmtDur(v as number | null) : "·"}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{l}</div>
            <div className="mt-0.5 text-[11px] text-white/35">average cycle time</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* bottlenecks */}
        <Card className="p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Bottlenecks — longest in flight</div>
          {(d?.oldestInFlight.length ?? 0) === 0 ? <p className="py-4 text-sm text-white/30">Nothing is waiting in governance.</p> : (
            <ul className="divide-y divide-white/5">
              {d?.oldestInFlight.map((r) => (
                <li key={r.documentId}>
                  <Link to={`/console/documents/${r.documentId}`} className="flex items-center gap-3 py-2.5 hover:bg-white/5">
                    <ClassBadge level={r.classification?.level} />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-white">{r.title || "(untitled)"}</div><div className="text-[11px] text-white/40">{recordTypeLabel(r.docType)}</div></div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${(r.hoursWaiting ?? 0) > 72 ? "bg-red-500/15 text-red-300" : (r.hoursWaiting ?? 0) > 24 ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-white/55"}`}>{fmtDur(r.hoursWaiting)} waiting</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* approval activity by authority */}
        <Card className="p-5">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Approval activity by authority</div>
          {(d?.approvalsByRole.length ?? 0) === 0 ? <p className="py-4 text-sm text-white/30">No approvals recorded yet.</p> : (
            <div className="space-y-2.5">
              {d?.approvalsByRole.map((r) => (
                <div key={r.role}>
                  <div className="mb-0.5 flex items-center justify-between text-[12px]"><span className="text-white/75">{roleLabel(r.role)}</span><span className="tabular-nums text-white/45">{r.count}</span></div>
                  <div className="h-1.5 overflow-hidden rounded bg-white/10"><div className="h-full bg-seal-light" style={{ width: `${(r.count / maxRole) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* policy performance */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Policy performance</div>
          {(d?.policyPerformance.length ?? 0) === 0 ? <p className="py-4 text-sm text-white/30">No governed publications yet.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/40">
                <th className="py-2 font-semibold">Policy</th><th className="py-2 text-right font-semibold">Volume</th><th className="py-2 text-right font-semibold">Avg. time to publish</th><th className="py-2 text-right font-semibold">Compliance</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {d?.policyPerformance.map((p) => (
                  <tr key={p.policy}>
                    <td className="py-2.5 font-medium text-white">{p.policy || "(unnamed)"}</td>
                    <td className="py-2.5 text-right tabular-nums text-white/70">{p.volume}</td>
                    <td className="py-2.5 text-right tabular-nums text-white/70">{p.avgDays == null ? "—" : `${p.avgDays}d`}</td>
                    <td className="py-2.5 text-right"><span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${p.complianceRate >= 100 ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{p.complianceRate}%</span></td>
                  </tr>
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

import React, { useCallback, useEffect, useState } from "react";
import { audit, type AuditEvent , humanError} from "../lib/api";
import { Card, inputCls } from "../lib/ui";

// Append-only audit trail (auditor scope). Filter by action or target; the
// trail is tenant-scoped and read-only — the API blocks any mutation.
const Audit: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [action, setAction] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { setEvents((await audit({ action: action || undefined, target: target || undefined, limit: 300 })).events); }
    catch (e) { setErr(humanError(e, "load failed")); }
    finally { setLoading(false); }
  }, [action, target]);
  // Initial load only; subsequent loads are triggered by the filter form.
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-seal-light">Evidence</div>
          <h1 className="mt-1.5 font-serif text-[2rem] font-bold leading-tight tracking-tight text-white">Evidence Chain</h1>
          <p className="mt-1 text-sm text-white/50">An append-only, hash-stamped chain of proceedings — read-only, tenant-scoped, evidentiary by design.</p>
        </div>
        {!loading && <div className="text-right"><div className="font-mono text-2xl font-bold tabular-nums text-white">{events.length}</div><div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Proceedings</div></div>}
      </header>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-4 flex flex-wrap gap-2">
        <input className={`${inputCls} w-56`} value={action} onChange={(e) => setAction(e.target.value)} placeholder="action (e.g. document.published)" />
        <input className={`${inputCls} w-72`} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="target id (uuid)" />
        <button className="rounded-md bg-seal px-3.5 py-2 text-sm font-semibold text-white hover:bg-seal-light">Filter</button>
      </form>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <Card>
        {loading ? <p className="px-4 py-6 text-sm text-white/40">Loading…</p>
          : events.length === 0 ? <p className="px-4 py-10 text-center text-sm text-white/30">No events.</p>
          : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/40">
                  <th className="px-4 py-2 font-semibold">Timestamp</th>
                  <th className="px-4 py-2 font-semibold">Actor</th>
                  <th className="px-4 py-2 font-semibold">Action</th>
                  <th className="px-4 py-2 font-semibold">Document</th>
                  <th className="px-4 py-2 font-semibold">Evidence ID</th>
                  <th className="px-4 py-2 font-semibold">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.map((e) => (
                  <tr key={e.eventId} className="hover:bg-white/5">
                    <td className="px-4 py-2 text-xs text-white/40">{new Date(e.ts).toLocaleString()}</td>
                    <td className="px-4 py-2 text-xs text-white/60">{e.actor} <span className="text-white/30">({e.actorType})</span></td>
                    <td className="px-4 py-2"><span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-white/80">{e.action}</span></td>
                    <td className="px-4 py-2 font-mono text-[10px] text-white/45">{e.targetId ? <>{e.targetType ?? "target"}/{e.targetId.slice(0, 8)}…</> : <span className="text-white/25">—</span>}</td>
                    <td className="px-4 py-2 font-mono text-[10px] text-white/45" title={e.eventId}>{e.eventId.slice(0, 8)}…</td>
                    <td className="px-4 py-2 font-mono text-[10px] text-white/35" title={e.sha256 ? `sha256: ${e.sha256}` : undefined}>
                      {e.sha256 ? <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />Verified</span> : <span className="text-white/25">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </Card>
    </div>
  );
};

export default Audit;

import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getDocument, getJob, artifactGrant, publish, withdraw, audit, DispatchError,
  type DocumentDetail, type JobView, type ArtifactRef, type AuditEvent } from "../lib/api";
import { Button, Card, ClassBadge, timeAgo } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { UpgradeModal, useBilling } from "../lib/upsell";

// A stable, official-looking record number derived from the document id.
const recordNo = (id: string, createdAt?: string) => {
  const n = parseInt(id.replace(/[^0-9a-f]/gi, "").slice(0, 8), 16) % 1_000_000;
  const yr = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  return `SD-${yr}-${String(n).padStart(6, "0")}`;
};

// One document end-to-end: metadata, versions, produced artifacts (download via
// short-lived grants), the live render job, the publish/withdraw controls, and
// the provenance trail — the full Submit→Publish chain in one place.
const DocumentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { has } = useAuth();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [job, setJob] = useState<JobView | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const { setBilling } = useBilling();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const d = await getDocument(id);
      setDoc(d);
      const jobId = d.latestResult?.jobId;
      if (jobId) setJob(await getJob(jobId).catch(() => null));
      if (has("dispatch:audit")) setEvents((await audit({ target: id, limit: 100 }).catch(() => ({ events: [] }))).events);
    } catch (e) { setErr(e instanceof Error ? e.message : "load failed"); }
  }, [id, has]);

  useEffect(() => { load(); }, [load]);

  // Poll the render job while it's in flight.
  useEffect(() => {
    if (!job || ["succeeded", "failed", "partial"].includes(job.status)) return;
    const t = setInterval(async () => { try { setJob(await getJob(job.jobId)); } catch { /* ignore */ } }, 1500);
    return () => clearInterval(t);
  }, [job]);

  const download = async (a: ArtifactRef) => {
    try { const g = await artifactGrant(a.artifactId); window.open(g.downloadUrl, "_blank"); }
    catch (e) {
      if (e instanceof DispatchError && e.status === 402) { setUpgrade(true); return; }
      setErr(e instanceof Error ? e.message : "grant failed");
    }
  };

  const lifecycleAction = async (fn: (id: string) => Promise<unknown>) => {
    if (!id) return; setBusy(true); setErr(null);
    try { await fn(id); await load(); } catch (e) { setErr(e instanceof Error ? e.message : "action failed"); }
    finally { setBusy(false); }
  };

  if (err && !doc) return <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>;
  if (!doc) return <p className="text-sm text-white/40">Loading…</p>;

  const artifacts = job?.result?.artifacts ?? doc.latestResult?.artifacts ?? [];
  const cls = (doc.versions[0] as unknown as { classification?: { level?: string } })?.classification;

  const rendered = artifacts.length > 0 || doc.status === "complete" || doc.status === "published";
  const preserved = doc.status === "published";
  const STAGES: [string, boolean][] = [["Governed", true], ["Approved", rendered], ["Rendered", rendered], ["Preserved", preserved]];

  return (
    <div>
      {upgrade && <UpgradeModal open reason="download" onClose={() => setUpgrade(false)} onSubscribed={(b) => { setBilling(b); setUpgrade(false); }} />}
      <Link to="/console/library" className="mb-4 inline-block text-xs font-semibold text-white/40 hover:text-white">← Library</Link>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Official Record</span>
            <span className="font-mono text-[11px] text-white/45">{recordNo(id!, doc.createdAt)}</span>
            <ClassBadge level={cls?.level} />
          </div>
          <h1 className="text-2xl font-bold text-white">{doc.title || "(untitled)"}</h1>
          <p className="text-sm text-white/50">{doc.docType}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STAGES.map(([label, on]) => (
              <span key={label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${on ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30" : "bg-white/5 text-white/35"}`}>
                {on && <span className="text-emerald-400">✓</span>}{label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {has("dispatch:publish") && doc.status === "complete" && (
            <Button variant="ok" onClick={() => lifecycleAction(publish)} disabled={busy}>Publish</Button>
          )}
          {has("dispatch:publish") && (
            <Button variant="ghost" onClick={() => lifecycleAction(withdraw)} disabled={busy}>Withdraw</Button>
          )}
        </div>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* render job */}
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Render</h3>
          {!job ? <p className="text-sm text-white/40">No render job yet — gated on approval.</p> : (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-white/60">Status</span>
                <span className="font-semibold text-white">{job.status} · {job.progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-white/10">
                <div className="h-full bg-seal-light transition-all" style={{ width: `${job.progress}%` }} />
              </div>
            </>
          )}
          <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-white/40">Artifacts</h4>
          {artifacts.length === 0 ? <p className="text-sm text-white/30">None produced yet.</p> : (
            <ul className="space-y-2">
              {artifacts.map((a) => (
                <li key={a.artifactId} className="flex items-center justify-between rounded border border-white/10 px-3 py-2">
                  <div>
                    <span className="text-sm font-semibold uppercase text-white">{a.format}</span>
                    <span className="ml-2 text-xs text-white/40">{(a.sizeBytes / 1024).toFixed(1)} KB{a.pages ? ` · ${a.pages}p` : ""}</span>
                    <div className="font-mono text-[10px] text-white/30">{a.sha256.slice(0, 16)}…</div>
                  </div>
                  <Button variant="ghost" onClick={() => download(a)}>Download</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* versions */}
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Versions</h3>
          <ul className="space-y-2">
            {doc.versions.map((v) => (
              <li key={v.versionNo} className="flex items-center justify-between text-sm">
                <span className="text-white">v{v.versionNo} <span className="text-white/40">· DDM {v.ddmVersion}</span></span>
                <span className="text-xs text-white/40">{timeAgo(v.createdAt)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-white/10 pt-3 text-xs text-white/50">
            <div className="flex justify-between"><dt>Created</dt><dd className="text-white/70">{timeAgo(doc.createdAt)}</dd></div>
            <div className="flex justify-between"><dt>Updated</dt><dd className="text-white/70">{timeAgo(doc.updatedAt)}</dd></div>
            {doc.correlationId && <div className="flex justify-between"><dt>Correlation</dt><dd className="font-mono text-white/70">{doc.correlationId}</dd></div>}
          </dl>
        </Card>
      </div>

      {/* provenance trail (auditor) */}
      {has("dispatch:audit") && (
        <Card className="mt-6 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">Provenance trail</h3>
          {events.length === 0 ? <p className="text-sm text-white/30">No events.</p> : (
            <ol className="space-y-1.5">
              {events.map((e) => (
                <li key={e.eventId} className="flex items-center gap-3 text-xs">
                  <span className="w-32 shrink-0 text-white/30">{new Date(e.ts).toLocaleString()}</span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-white/70">{e.action}</span>
                  <span className="text-white/40">{e.actor}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}
    </div>
  );
};

export default DocumentView;

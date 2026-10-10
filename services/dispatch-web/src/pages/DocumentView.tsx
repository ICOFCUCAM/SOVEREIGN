import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getDocument, getJob, artifactGrant, publish, withdraw, archiveDocument, getCertificate, getGovernanceCertificate, audit, DispatchError,
  type DocumentDetail, type JobView, type ArtifactRef, type AuditEvent, type PreservationCertificate, type GovernanceCertificate, humanError } from "../lib/api";
import { track } from "../lib/analytics";
import { timeAgo } from "../lib/ui";
import { recordTypeLabel } from "../lib/recordTypes";
import { useAuth } from "../lib/auth";
import { UpgradeModal, useBilling } from "../lib/upsell";
import { actorName, fmtBytes, fmtDateTime, recordNo, waited } from "../lib/format";
import { Alert, Badge, Button, ClassificationMark, ConfirmDialog, CopyButton, EmptyState, EvidenceValue, Fact, LifecycleStatus, Panel, Skeleton, cx, postureText } from "../components/console/ds";
import { ChainOfAuthority } from "../components/console/governance";
import { Icon } from "../components/console/icons";

type LifecycleAct = "publish" | "archive" | "withdraw";

// One document end-to-end: identity, governance standing, chain of authority,
// certificates, the render job and its artifacts (download via short-lived
// grants), versions, and the provenance trail — the full Submit→Preserve chain in
// one file. Layout: the governance narrative on the left; the record's identity,
// production and versions in a persistent right rail so context is never lost.
const DocumentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { has } = useAuth();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [job, setJob] = useState<JobView | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<{ msg: string; status?: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<LifecycleAct | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [cert, setCert] = useState<PreservationCertificate | null>(null);
  const [govCert, setGovCert] = useState<GovernanceCertificate | null>(null);
  const [grantBusy, setGrantBusy] = useState<string | null>(null);
  const { setBilling } = useBilling();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const d = await getDocument(id);
      setDoc(d); setLoadErr(null);
      const jobId = d.latestResult?.jobId;
      if (jobId) setJob(await getJob(jobId).catch(() => null));
      if (has("dispatch:audit")) setEvents((await audit({ target: id, limit: 100 }).catch(() => ({ events: [] }))).events);
    } catch (e) { setLoadErr({ msg: humanError(e, "The record could not be loaded."), status: e instanceof DispatchError ? e.status : undefined }); }
  }, [id, has]);

  // A new record id starts from a clean slate — never show (or query certificates
  // for) the previous record's state under the new id.
  useEffect(() => { setDoc(null); setJob(null); setEvents([]); setCert(null); setGovCert(null); setErr(null); setDone(null); setLoadErr(null); }, [id]);
  useEffect(() => { load(); }, [load]);
  const lcFor = doc && doc.id === id ? doc.lifecycle : undefined;
  // Name the tab after the record, so several open records stay distinguishable.
  useEffect(() => {
    if (!doc || doc.id !== id) return;
    const prev = document.title;
    document.title = `${doc.publicId || recordNo(doc.id, doc.createdAt)} · ${doc.title || "(untitled)"} — Sovereign Dispatch`;
    return () => { document.title = prev; };
  }, [doc, id]);

  // An archived record is a preserved artifact — pull its preservation certificate.
  useEffect(() => {
    if (id && lcFor === "archived") getCertificate(id).then((r) => setCert(r.certificate)).catch(() => {});
    else setCert(null);
  }, [id, lcFor]);

  // A record published under an enforced policy carries a Governance Certificate.
  useEffect(() => {
    if (id && (lcFor === "published" || lcFor === "archived"))
      getGovernanceCertificate(id).then((r) => setGovCert(r.certificate)).catch(() => setGovCert(null));
    else setGovCert(null);
  }, [id, lcFor]);

  // Poll the render job while it's in flight.
  useEffect(() => {
    if (!job || ["succeeded", "failed", "partial"].includes(job.status)) return;
    const t = setInterval(async () => { try { setJob(await getJob(job.jobId)); } catch { /* ignore */ } }, 1500);
    return () => clearInterval(t);
  }, [job]);

  const download = async (a: ArtifactRef) => {
    setGrantBusy(a.artifactId); setErr(null);
    try { const g = await artifactGrant(a.artifactId); window.open(g.downloadUrl, "_blank"); }
    catch (e) {
      if (e instanceof DispatchError && e.status === 402) { setUpgrade(true); return; }
      setErr(humanError(e, "The download could not be authorised."));
    }
    finally { setGrantBusy(null); }
  };

  const ACTS: Record<LifecycleAct, { fn: (id: string) => Promise<unknown>; ok: string }> = {
    publish: { fn: publish, ok: "Published. The record is now an official record; its Governance Certificate is issued where a policy applies." },
    archive: { fn: archiveDocument, ok: "Preserved. The record is sealed and terminal; its Preservation Certificate is below." },
    withdraw: { fn: withdraw, ok: "Withdrawn from publication." },
  };
  const lifecycleAction = async (act: LifecycleAct) => {
    if (!id) return; setBusy(true); setErr(null); setDone(null);
    try { await ACTS[act].fn(id); await load(); setDone(ACTS[act].ok); }
    catch (e) {
      // A governance enforcement refusal (incomplete policy, wrong publisher,
      // separation-of-duties) is a friction signal worth measuring distinctly.
      if (e instanceof DispatchError && /POLICY|PUBLICATION_AUTHORITY|SOD|STEP_NOT_OPEN|SELF_APPROVAL/.test(e.code))
        track("governance.failed", { code: e.code });
      setErr(humanError(e, "The action could not be completed."));
    }
    finally { setBusy(false); setConfirm(null); }
  };

  if (loadErr && !doc) {
    const notFound = loadErr.status === 404;
    return (
      <div>
        <BackLink />
        <Panel>
          <EmptyState headingLevel={1} icon={<Icon.alert />} title={notFound ? "Record not found" : "The record could not be loaded"}
            action={!notFound ? <Button onClick={load} icon={<Icon.refresh />}>Try again</Button> : <Link to="/console/library" className="font-semibold text-sd-accent hover:underline">Return to the register</Link>}>
            {notFound ? "No record with this identifier is visible to your credential. Records outside your tenant or above your clearance are never disclosed." : loadErr.msg}
          </EmptyState>
        </Panel>
      </div>
    );
  }
  if (!doc) return <RecordSkeleton />;

  const artifacts = job?.result?.artifacts ?? doc.latestResult?.artifacts ?? [];
  const cls = (doc.versions[0] as unknown as { classification?: { level?: string; scheme?: string } })?.classification;
  const lc = doc.lifecycle;
  const published = lc === "published" || lc === "archived";
  const preserved = lc === "archived";
  const rendered = artifacts.length > 0 || doc.status === "complete" || ["rendered", "published", "archived"].includes(lc ?? "");
  const STAGES: [string, boolean][] = [["Governed", true], ["Approved", rendered], ["Rendered", rendered], ["Published", published], ["Preserved", preserved]];
  const frontier = STAGES.reduce((m, [, on], i) => (on ? i : m), 0);
  const canPublish = has("dispatch:publish");
  const number = doc.publicId || recordNo(id!, doc.createdAt);
  const pubAuth = doc.posture?.publicationAuthority;

  return (
    <div>
      {upgrade && <UpgradeModal open reason="download" onClose={() => setUpgrade(false)} onSubscribed={(b) => { setBilling(b); setUpgrade(false); }} />}
      <BackLink archived={preserved} printable />

      {/* ── Record header — the institutional object's identity ── */}
      <header className="sd-cert relative mb-5 overflow-hidden rounded-xl border border-sd-line bg-sd-panel">
        <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-sd-gold">Official record</span>
              <span className="inline-flex items-center font-mono text-[12.5px] text-sd-text">{number}<CopyButton value={number} label="record number" /></span>
              <ClassificationMark level={cls?.level} scheme={cls?.scheme} />
              <LifecycleStatus state={lc} />
              {doc.publicId && (
                <a href={`/verify/${encodeURIComponent(doc.publicId)}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-sd-ok/40 bg-sd-ok/[0.08] px-2 py-[3px] text-[11.5px] font-semibold text-sd-ok hover:bg-sd-ok/15">
                  Publicly verifiable <Icon.external className="h-3 w-3" /><span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </div>
            <h1 className="mt-2.5 font-serif text-[26px] font-semibold leading-[1.15] tracking-[-0.015em] text-sd-text sm:text-[30px]">{doc.title || "(untitled)"}</h1>
            <p className="mt-1 text-[12.5px] text-sd-text2">
              <span className="font-semibold">{recordTypeLabel(doc.docType)}</span>
              <span className="text-sd-text3"> · version {doc.currentVersion}</span>
              {doc.submittedBy?.name && <> <span className="text-sd-text3">· created by</span> <span className="font-semibold text-sd-text">{doc.submittedBy.name}</span>{doc.submittedBy.office && <span className="text-sd-text3"> · {doc.submittedBy.office}</span>}</>}
            </p>
            {/* lifecycle as a procession — reached, frontier, terminal seal */}
            <ol aria-label="Lifecycle progress" className="mt-4 flex flex-wrap items-center gap-1">
              {STAGES.map(([label, on], i) => {
                const seal = label === "Preserved" && on;
                const isFrontier = on && i === frontier && !seal;
                return (
                  <li key={label} className="flex items-center gap-1" aria-current={isFrontier || seal ? "step" : undefined}>
                    <span className={cx("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11.5px] font-semibold",
                      seal ? "border-sd-gold/50 bg-sd-gold/10 text-sd-gold" : isFrontier ? "border-sd-accent/45 bg-sd-accent/10 text-sd-text" : on ? "border-sd-line bg-sd-raised text-sd-text2" : "border-dashed border-sd-line text-sd-text3")}>
                      {on ? <Icon.check className="h-3 w-3" /> : <span className="sr-only">Not reached: </span>}{label}
                    </span>
                    {i < STAGES.length - 1 && <Icon.chevronRight className="h-3 w-3 text-sd-faint" />}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="sd-noprint flex shrink-0 flex-col items-stretch gap-2 lg:w-[240px]">
            {preserved ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-sd-gold/45 bg-sd-gold/[0.08] px-3 py-2.5">
                <Icon.seal className="h-5 w-5 text-sd-gold" />
                <div className="leading-tight"><div className="text-[13px] font-semibold text-sd-gold">Preserved</div><div className="text-[11.5px] text-sd-text3">Sealed · terminal</div></div>
              </div>
            ) : (
              <>
                {canPublish && lc === "rendered" && (
                  <Button variant="approve" onClick={() => setConfirm("publish")} disabled={busy} icon={<Icon.check />}>{pubAuth ? `Publish as ${pubAuth}` : "Publish"}</Button>
                )}
                {canPublish && lc === "published" && (
                  <Button variant="primary" onClick={() => setConfirm("archive")} disabled={busy} icon={<Icon.seal />}>Preserve for the record</Button>
                )}
                {canPublish && (lc === "published" || lc === "rendered") && (
                  <Button variant="ghost" className="border-sd-line" onClick={() => setConfirm("withdraw")} disabled={busy}>Withdraw</Button>
                )}
                {!canPublish && (lc === "rendered" || lc === "published") && (
                  <p className="flex items-start gap-2 rounded-lg border border-sd-line bg-sd-sunken px-3 py-2 text-[12px] text-sd-text3"><Icon.lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />Publication, preservation and withdrawal require the publish permission{pubAuth ? ` and are released by ${pubAuth}` : ""}.</p>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {done && <Alert tone="ok" className="mb-4" onDismiss={() => setDone(null)}>{done}</Alert>}
      {err && <Alert tone="bad" title="Action not completed" className="mb-4" onDismiss={() => setErr(null)}>{err}</Alert>}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ── the governance narrative ── */}
        <div className="min-w-0 space-y-5">
          {doc.posture && <GovernanceStanding p={doc.posture} lifecycle={lc} submittedAt={doc.posture.waitingSince} />}

          {doc.governanceChain && doc.governanceChain.length > 0 && (
            <Panel headingLevel={2} title="Chain of authority" aside="Server-computed from the governing policy">
              <ChainOfAuthority steps={doc.governanceChain} rejected={doc.governanceRejected} />
            </Panel>
          )}

          {govCert && <GovernanceCertificatePanel c={govCert} />}
          {cert && <PreservationCertificatePanel c={cert} number={number} />}
          {published && !govCert && (
            <Panel><p className="text-[12.5px] text-sd-text3">No Governance Certificate is available for this record. Certificates are issued for publications made under an enforced governance policy.</p></Panel>
          )}

          {/* provenance trail (auditor) */}
          {has("dispatch:audit") && (
            <Panel headingLevel={2} title="Provenance trail" padded={false} aside={<Link to={`/console/audit?target=${id}`} className="font-semibold text-sd-accent hover:underline">Open in evidence chain →</Link>}>
              {events.length === 0 ? <EmptyState compact title="No events recorded for this record" /> : (
                <ol className="divide-y divide-sd-soft">
                  {events.map((e) => (
                    <li key={e.eventId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-4 py-2 sm:grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <time dateTime={e.ts} className="font-mono text-[11.5px] tabular-nums text-sd-text3">{fmtDateTime(e.ts)}</time>
                      <span className="col-start-1 truncate font-mono text-[12px] text-sd-text sm:col-start-auto">{e.action}</span>
                      <span className="col-start-1 truncate text-[12px] text-sd-text2 sm:col-start-auto" title={e.actor}>{actorName(e.actor)} <span className="text-sd-text3">({e.actorType})</span></span>
                      <span className="row-start-1 sm:row-start-auto">{e.sha256 ? <Badge tone="gold" glyph="#" title={`SHA-256 recorded: ${e.sha256}`}>Digest</Badge> : null}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          )}
        </div>

        {/* ── persistent context rail ── */}
        <aside className="min-w-0 space-y-5" aria-label="Record identity, production and versions">
          <Panel headingLevel={2} title="Record identity">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Fact className="col-span-2" label="Record number" value={<span className="font-mono">{number}</span>} />
              {doc.publicId && <Fact label="Public ID" value={doc.publicId} mono />}
              <Fact label="Current version" value={`v${doc.currentVersion}`} />
              <Fact label="Engine status" value={doc.status} />
              <Fact label="Lifecycle" value={<LifecycleStatus state={lc} />} />
              <Fact label="Created" value={<span title={timeAgo(doc.createdAt)}>{fmtDateTime(doc.createdAt)}</span>} />
              <Fact label="Updated" value={<span title={timeAgo(doc.updatedAt)}>{fmtDateTime(doc.updatedAt)}</span>} />
              {doc.publishedAt && <Fact label="Published" value={fmtDateTime(doc.publishedAt)} />}
              {doc.archivedAt && <Fact label="Preserved" value={fmtDateTime(doc.archivedAt)} />}
            </dl>
            <dl className="mt-4 space-y-3 border-t border-sd-soft pt-3">
              <EvidenceValue label="Document ID" value={doc.id} />
              {doc.correlationId && <EvidenceValue label="Correlation ID" value={doc.correlationId} />}
              {doc.preservationSha256 && <EvidenceValue label="Preservation proof (SHA-256)" value={doc.preservationSha256} tone="gold" />}
            </dl>
          </Panel>

          <RenderPanel job={job} artifacts={artifacts} lc={lc} onDownload={download} grantBusy={grantBusy} />

          <Panel headingLevel={2} title="Versions" padded={false}>
            <ul className="divide-y divide-sd-soft">
              {doc.versions.map((v) => (
                <li key={v.versionNo} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[13px] font-semibold text-sd-text">v{v.versionNo}{v.versionNo === doc.currentVersion && <span className="ml-2 font-sans text-[11px] font-semibold text-sd-accent">current</span>}</span>
                    <span className="font-mono text-[11.5px] text-sd-text3" title={timeAgo(v.createdAt)}>{fmtDateTime(v.createdAt)}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11.5px] text-sd-text3">
                    <span>DDM {v.ddmVersion}</span>
                    {v.template && <span>template {v.template}{v.templateVersion ? ` v${v.templateVersion}` : ""}</span>}
                    {v.engineVersion && <span className="font-mono">{v.engineVersion}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>

      <ConfirmDialog open={confirm === "publish"} title="Publish this official record?" confirmLabel={pubAuth ? `Publish as ${pubAuth}` : "Publish"} variant="approve"
        busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => lifecycleAction("publish")}>
        <p><span className="font-semibold text-sd-text">{doc.title || "(untitled)"}</span> will be released as an official record{pubAuth ? <> under the authority of <span className="font-semibold text-sd-text">{pubAuth}</span></> : null}. The engine re-checks the governing policy and publication authority before releasing it, and records the act to the evidence chain.</p>
        <p className="mt-2 text-sd-text3">A published record can later be withdrawn, or preserved permanently.</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm === "archive"} title="Preserve this record permanently?" confirmLabel="Preserve for the record" variant="primary" irreversible="Preservation is terminal: no edit, withdrawal or republication is possible afterwards."
        busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => lifecycleAction("archive")}>
        <p><span className="font-semibold text-sd-text">{doc.title || "(untitled)"}</span> will be sealed and a Preservation Certificate issued with a SHA-256 integrity proof of the sealed form.</p>
      </ConfirmDialog>
      <ConfirmDialog open={confirm === "withdraw"} title="Withdraw this record?" confirmLabel="Withdraw record" variant="danger"
        busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => lifecycleAction("withdraw")}>
        <p><span className="font-semibold text-sd-text">{doc.title || "(untitled)"}</span> will be withdrawn from publication. Withdrawal is recorded to the evidence chain; a withdrawn record can only move on to preservation — it cannot be republished.</p>
      </ConfirmDialog>
    </div>
  );
};

const BackLink: React.FC<{ archived?: boolean; printable?: boolean }> = ({ archived, printable }) => (
  <div className="sd-noprint mb-3 flex items-center justify-between gap-3">
    <Link to={archived ? "/console/archives" : "/console/library"} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-sd-text3 hover:text-sd-text">
      <Icon.arrowLeft className="h-3.5 w-3.5" />{archived ? "Preservation" : "Official records"}
    </Link>
    {printable && <Button size="sm" variant="ghost" onClick={() => window.print()} icon={<Icon.register />}>Print record file</Button>}
  </div>
);

const RecordSkeleton: React.FC = () => (
  <div role="status" aria-label="Loading the record">
    <Skeleton className="mb-4 h-4 w-32" />
    <div className="rounded-xl border border-sd-line bg-sd-panel p-6"><Skeleton className="h-4 w-60" /><Skeleton className="mt-4 h-8 w-2/3" /><Skeleton className="mt-3 h-4 w-1/3" /><Skeleton className="mt-5 h-7 w-1/2" /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>
    <span className="sr-only">Loading the record…</span>
  </div>
);

// ── Render & artifacts ──────────────────────────────────────────────────────
const JOB_TONE: Record<string, "ok" | "bad" | "warn" | "info"> = { succeeded: "ok", failed: "bad", partial: "warn" };
const RenderPanel: React.FC<{ job: JobView | null; artifacts: ArtifactRef[]; lc?: string; onDownload: (a: ArtifactRef) => void; grantBusy: string | null }> = ({ job, artifacts, lc, onDownload, grantBusy }) => {
  const failed = job?.status === "failed";
  const inFlight = job && !["succeeded", "failed", "partial"].includes(job.status);
  const jobErr = job?.error ?? job?.result?.error ?? null;
  const warnings = job?.result?.warnings?.length ?? 0;
  return (
    <Panel headingLevel={2} title="Render & artifacts" aside={job ? <Badge tone={JOB_TONE[job.status] ?? "info"} glyph={failed ? "✕" : inFlight ? "◔" : "✓"}>{job.status}</Badge> : undefined} padded={false}>
      <div className="p-4">
        {!job ? (
          <p className="text-[12.5px] text-sd-text3">{lc === "in_review" || lc === "submitted" || lc === "draft" || lc === "rejected" ? "No render job — rendering is gated on approval." : "No render job is recorded for this record."}</p>
        ) : (
          <>
            <div className="flex items-center justify-between text-[12px]"><span className="text-sd-text3">Progress</span><span className="font-mono text-sd-text">{job.progress}%</span></div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sd-sunken" role="progressbar" aria-valuenow={job.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Render progress">
              <div className={cx("h-full transition-all", failed ? "bg-sd-bad" : "bg-sd-accent")} style={{ width: `${job.progress}%` }} />
            </div>
            {inFlight && <p className="mt-2 text-[12px] text-sd-text3">Rendering — this panel updates automatically.</p>}
            {failed && <Alert tone="bad" className="mt-3" title="Rendering failed">{jobErr ? <><span className="font-mono">{jobErr.code}</span> — {jobErr.message}</> : "The render job did not complete. No artifact was produced."}</Alert>}
            {warnings > 0 && <p className="mt-2 text-[12px] text-sd-warn">{warnings} render warning{warnings > 1 ? "s" : ""} recorded.</p>}
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              <Fact label="Job ID" value={<span className="inline-flex items-center">{job.jobId.slice(0, 8)}…<CopyButton value={job.jobId} label="job ID" /></span>} mono />
              <Fact label="Updated" value={fmtDateTime(job.updatedAt)} />
            </dl>
          </>
        )}
      </div>
      <div className="border-t border-sd-soft">
        <div className="px-4 pt-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-sd-text3">Artifacts</div>
        {artifacts.length === 0 ? <p className="px-4 pb-4 pt-1 text-[12.5px] text-sd-text3">None produced yet.</p> : (
          <ul className="divide-y divide-sd-soft">
            {artifacts.map((a) => (
              <li key={a.artifactId} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-[13px] font-semibold uppercase text-sd-text">{a.format}</span>
                    <span className="ml-2 text-[12px] text-sd-text3">{fmtBytes(a.sizeBytes)}{a.pages ? ` · ${a.pages} page${a.pages > 1 ? "s" : ""}` : ""}{a.role ? ` · ${a.role}` : ""}</span>
                    {a.classification && <div className="mt-1"><ClassificationMark level={a.classification} /></div>}
                  </div>
                  <Button size="sm" onClick={() => onDownload(a)} loading={grantBusy === a.artifactId} icon={<Icon.download />} aria-label={`Download ${a.format.toUpperCase()} artifact`}>Download</Button>
                </div>
                <dl className="mt-2"><EvidenceValue label="Artifact SHA-256" value={a.sha256} /></dl>
              </li>
            ))}
            <li className="px-4 py-2 text-[11.5px] text-sd-text3">Downloads use a short-lived, single-purpose grant. Compare the file's SHA-256 with the value above to confirm it is the exact artifact produced.</li>
          </ul>
        )}
      </div>
    </Panel>
  );
};

// ── Governance Standing — "who holds my document right now?" ─────────────────
const GovernanceStanding: React.FC<{ p: NonNullable<DocumentDetail["posture"]>; lifecycle?: string; submittedAt?: string | null }> = ({ p, lifecycle = "", submittedAt }) => {
  const inReview = lifecycle === "in_review" || lifecycle === "submitted";
  return (
    <Panel padded={false}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-sd-text3">Governance standing</h2>
          <div className="mt-1.5 flex items-center gap-2.5"><LifecycleStatus state={lifecycle} /><span className="font-serif text-[19px] font-semibold leading-tight text-sd-text">{postureText(lifecycle, p.status) || "—"}</span></div>
        </div>
        {p.policyName && (
          <div className="shrink-0 sm:text-right">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-sd-text3">Governing policy</div>
            <div className="mt-1 text-[13.5px] font-semibold text-sd-text">{p.policyName}{p.policyVersion ? <span className="font-mono text-sd-text3"> v{p.policyVersion}</span> : null}</div>
          </div>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-sd-soft px-4 py-3.5 sm:grid-cols-4">
        {inReview && <Fact label="Current authority" value={p.currentAuthority ?? <span className="text-sd-text2">Under review</span>} />}
        {inReview && <Fact label="Next authority" value={p.nextAuthority} />}
        {p.approvalAuthority && <Fact label="Approval authority" value={p.approvalAuthority} />}
        <Fact label="Publication authority" value={p.publicationAuthority} />
        {inReview
          ? <Fact label="Waiting" value={<span className="font-mono text-sd-warn">{waited(submittedAt)}</span>} />
          : <Fact label="Submitted" value={submittedAt ? timeAgo(submittedAt) : undefined} />}
      </dl>
    </Panel>
  );
};

// ── Certificates ────────────────────────────────────────────────────────────
const CertFrame: React.FC<{ kind: string; aside?: React.ReactNode; children: React.ReactNode; statement: React.ReactNode }> = ({ kind, aside, children, statement }) => (
  <section aria-label={kind} className="sd-cert relative rounded-xl border border-sd-gold/45 bg-sd-panel p-5 sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2.5"><Icon.seal className="h-5 w-5 text-sd-gold" /><h2 className="font-serif text-[18px] font-semibold text-sd-text">{kind}</h2></div>
      {aside}
    </div>
    {children}
    <div className="mt-5 border-t border-sd-soft pt-3.5">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-sd-text3">Issued by Sovereign Dispatch</div>
      <p className="mt-1.5 max-w-[80ch] text-[12.5px] leading-relaxed text-sd-text2">{statement}</p>
    </div>
  </section>
);

const HASH_NOTE = "Recomputing this digest over the same canonical content yields the same value, so any alteration is detectable. A digest alone does not identify who issued it.";

const GovernanceCertificatePanel: React.FC<{ c: GovernanceCertificate }> = ({ c }) => {
  const ok = c.complianceResult === "COMPLIANT";
  return (
    <CertFrame kind="Governance certificate" aside={<Badge tone={ok ? "ok" : "bad"} glyph={ok ? "✓" : "✕"}>{c.complianceResult}</Badge>}
      statement={<>Sovereign Dispatch certifies that this publication {ok ? "satisfied" : "did not satisfy"} governance policy <span className="font-semibold text-sd-text">{c.policyName}</span> (v{c.policyVersion}): the required approval chain was {ok ? "satisfied in order" : "not satisfied in order"}, with separation of duties {c.separationOfDuties}. This certificate can be verified independently against the SHA-256 integrity proof above.</>}>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
        <Fact label="Governing policy" value={<>{c.policyName} <span className="font-mono text-sd-text3">v{c.policyVersion}</span></>} />
        <Fact label="Publication authority" value={c.publicationAuthority} />
        <Fact label="Published by" value={actorName(c.publishedBy)} />
        <Fact label="Separation of duties" value={<span className="text-sd-ok">{c.separationOfDuties}</span>} />
        <Fact label="Record ID" value={c.recordId} mono className="sm:col-span-2" />
      </dl>

      <div className="mt-5">
        <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-sd-text3">Required chain — and who satisfied it</div>
        <div className="overflow-x-auto rounded-lg border border-sd-soft">
          <table className="sd-table min-w-[420px]" data-density="compact">
            <thead><tr><th scope="col">Step</th><th scope="col">Required office</th><th scope="col">Quorum</th><th scope="col">Satisfied by</th></tr></thead>
            <tbody>
              {c.requiredRoles.map((r) => {
                const actual = c.actualRoles.find((a) => a.step === r.step);
                const by = (actual?.satisfiedBy ?? []).map(actorName);
                return (
                  <tr key={r.step}>
                    <td className="font-mono">{r.step}</td>
                    <td className="text-sd-text">{r.label}</td>
                    <td className="font-mono">{r.quorum}</td>
                    <td>{by.length ? <span className="text-sd-ok">{by.join(", ")}</span> : <span className="text-sd-bad">Not satisfied</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-sd-text3">Approval sequence</div>
        <ol className="space-y-1.5">
          {c.approvalSequence.map((a, i) => (
            <li key={i} className="grid grid-cols-[22px_minmax(0,1fr)] gap-x-2 text-[12.5px] sm:grid-cols-[22px_minmax(0,1fr)_auto]">
              <span className="font-mono text-sd-text3">{i + 1}.</span>
              <span className="min-w-0"><span className="font-semibold text-sd-text">{a.role}</span> · <span className="font-mono text-sd-text2">{actorName(a.actor)}</span>{a.onBehalfOf && <span className="text-sd-warn"> (on behalf of {actorName(a.onBehalfOf)})</span>}</span>
              <time dateTime={a.decidedAt} className="col-start-2 font-mono text-[11.5px] text-sd-text3 sm:col-start-auto">{fmtDateTime(a.decidedAt)}</time>
            </li>
          ))}
        </ol>
      </div>

      {c.delegations?.length > 0 && (
        <div className="mt-4 text-[12.5px]"><span className="font-semibold text-sd-text2">Delegations used: </span>{c.delegations.map((d, i) => <span key={i} className="text-sd-warn">{actorName(d.actor)} for {d.role} (on behalf of {actorName(d.onBehalfOf)}){i < c.delegations.length - 1 ? "; " : ""}</span>)}</div>
      )}

      <dl className="mt-5"><EvidenceValue label="Integrity proof (SHA-256)" value={c.integrityProof} tone="gold" note={HASH_NOTE} /></dl>
    </CertFrame>
  );
};

const PreservationCertificatePanel: React.FC<{ c: PreservationCertificate; number: string }> = ({ c, number }) => (
  <CertFrame kind="Preservation certificate" aside={<span className="font-mono text-[11.5px] text-sd-text3">Sealed {fmtDateTime(c.archivedAt)}</span>}
    statement={<>Sovereign Dispatch certifies that this record was sealed{c.archivedAt ? ` on ${fmtDateTime(c.archivedAt)}` : ""} and is terminal — no edit, withdrawal or republication is possible. The sealed form is provable against the SHA-256 integrity proof above.</>}>
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
      <Fact label="Record" value={number} mono />
      <Fact label="Governing policy" value={c.governancePolicy?.name || "—"} />
      <Fact label="Version" value={`v${c.version}`} />
      <Fact label="Published" value={fmtDateTime(c.publishedAt)} />
      <Fact label="Archived" value={fmtDateTime(c.archivedAt)} />
      <Fact label="Lifecycle at sealing" value={c.lifecycle} />
    </dl>
    <dl className="mt-4 space-y-3">
      <EvidenceValue label="Record hash (SHA-256)" value={c.recordHash} note="Digest of the record's canonical content (DDM) at sealing." />
      <EvidenceValue label="Integrity proof (SHA-256)" value={c.integrityProof} tone="gold" note={HASH_NOTE} />
    </dl>
    {c.governancePolicy?.reviewChain?.length > 0 && (
      <div className="mt-4">
        <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-sd-text3">Approval chain</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {c.governancePolicy.reviewChain.map((s, i) => (
            <React.Fragment key={i}>
              <span className="rounded-md border border-sd-line bg-sd-sunken px-2 py-0.5 text-[12px] text-sd-text">{s.label}</span>
              {i < c.governancePolicy.reviewChain.length - 1 && <Icon.chevronRight className="h-3 w-3 text-sd-faint" />}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 text-[12px] text-sd-text3">
          {c.governancePolicy.approvalAuthority && <span>Approval: <span className="text-sd-text2">{c.governancePolicy.approvalAuthority}</span></span>}
          {c.governancePolicy.publicationAuthority && <span>Publication: <span className="text-sd-text2">{c.governancePolicy.publicationAuthority}</span></span>}
        </div>
      </div>
    )}
    {c.approvalChain?.length > 0 && (
      <div className="mt-4">
        <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-sd-text3">Recorded approvals</div>
        <ul className="space-y-1">
          {c.approvalChain.map((a, i) => (
            <li key={i} className="text-[12.5px] text-sd-text2"><span className="font-mono text-sd-text">{actorName(a.actor)}</span> · {a.decision}{a.clearance ? <span className="text-sd-text3"> · clearance {a.clearance}</span> : null} · <span className="font-mono text-sd-text3">{fmtDateTime(a.ts)}</span></li>
          ))}
        </ul>
      </div>
    )}
  </CertFrame>
);

export default DocumentView;

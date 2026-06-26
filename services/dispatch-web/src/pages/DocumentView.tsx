import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getDocument, getJob, artifactGrant, publish, withdraw, archiveDocument, getCertificate, getGovernanceCertificate, audit, DispatchError,
  type DocumentDetail, type JobView, type ArtifactRef, type AuditEvent, type PreservationCertificate, type GovernanceCertificate, type ChainStep, humanError } from "../lib/api";
import { track } from "../lib/analytics";
import { Button, Card, ClassBadge, timeAgo } from "../lib/ui";
import { recordTypeLabel } from "../lib/recordTypes";
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
  const [cert, setCert] = useState<PreservationCertificate | null>(null);
  const [govCert, setGovCert] = useState<GovernanceCertificate | null>(null);
  const { setBilling } = useBilling();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const d = await getDocument(id);
      setDoc(d);
      const jobId = d.latestResult?.jobId;
      if (jobId) setJob(await getJob(jobId).catch(() => null));
      if (has("dispatch:audit")) setEvents((await audit({ target: id, limit: 100 }).catch(() => ({ events: [] }))).events);
    } catch (e) { setErr(humanError(e, "load failed")); }
  }, [id, has]);

  useEffect(() => { load(); }, [load]);

  // An archived record is a preserved artifact — pull its preservation certificate.
  useEffect(() => {
    if (id && doc?.lifecycle === "archived") getCertificate(id).then((r) => setCert(r.certificate)).catch(() => {});
    else setCert(null);
  }, [id, doc?.lifecycle]);

  // A record published under an enforced policy carries a Governance Certificate.
  useEffect(() => {
    if (id && (doc?.lifecycle === "published" || doc?.lifecycle === "archived"))
      getGovernanceCertificate(id).then((r) => setGovCert(r.certificate)).catch(() => setGovCert(null));
    else setGovCert(null);
  }, [id, doc?.lifecycle]);

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
      setErr(humanError(e, "grant failed"));
    }
  };

  const lifecycleAction = async (fn: (id: string) => Promise<unknown>) => {
    if (!id) return; setBusy(true); setErr(null);
    try { await fn(id); await load(); }
    catch (e) {
      // A governance enforcement refusal (incomplete policy, wrong publisher,
      // separation-of-duties) is a friction signal worth measuring distinctly.
      if (e instanceof DispatchError && /POLICY|PUBLICATION_AUTHORITY|SOD|STEP_NOT_OPEN|SELF_APPROVAL/.test(e.code))
        track("governance.failed", { code: e.code });
      setErr(humanError(e, "action failed"));
    }
    finally { setBusy(false); }
  };

  if (err && !doc) return <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>;
  if (!doc) return <p className="text-sm text-white/40">Loading…</p>;

  const artifacts = job?.result?.artifacts ?? doc.latestResult?.artifacts ?? [];
  const cls = (doc.versions[0] as unknown as { classification?: { level?: string } })?.classification;

  const lc = doc.lifecycle;
  const published = lc === "published" || lc === "archived";
  const preserved = lc === "archived";
  const rendered = artifacts.length > 0 || doc.status === "complete" || ["rendered", "published", "archived"].includes(lc ?? "");
  const STAGES: [string, boolean][] = [["Governed", true], ["Approved", rendered], ["Rendered", rendered], ["Published", published], ["Preserved", preserved]];
  // The procession frontier — the furthest stage this record has reached. Reached
  // stages read white/authoritative; the frontier carries the seal-blue accent;
  // only the terminal Preserved seal earns colour (permanence, the institution's
  // green). Consistent with the Command dashboard's colour discipline.
  const frontier = STAGES.reduce((m, [, on], i) => (on ? i : m), 0);

  return (
    <div>
      {upgrade && <UpgradeModal open reason="download" onClose={() => setUpgrade(false)} onSubscribed={(b) => { setBilling(b); setUpgrade(false); }} />}
      <Link to="/console/library" className="mb-4 inline-block text-xs font-semibold text-white/40 hover:text-white">← Library</Link>
      <header className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">Official Record</span>
            <span className="font-mono text-[11px] tabular-nums text-white/55">{doc.publicId || recordNo(id!, doc.createdAt)}</span>
            <ClassBadge level={cls?.level} />
            {doc.publicId && (
              <a href={`/verify/${encodeURIComponent(doc.publicId)}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20">Publicly verifiable ↗</a>
            )}
          </div>
          <h1 className="font-serif text-[1.9rem] font-bold leading-tight tracking-tight text-white">{doc.title || "(untitled)"}</h1>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">{recordTypeLabel(doc.docType)}</p>
          {doc.submittedBy?.name && (
            <p className="mt-2 text-[12.5px] text-white/50">Created by <span className="font-semibold text-white/85">{doc.submittedBy.name}</span>{doc.submittedBy.office && <span className="text-white/45"> · {doc.submittedBy.office}</span>}</p>
          )}
          {/* lifecycle as a procession — reached white, frontier seal-accented, the terminal seal earns green */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1">
            {STAGES.map(([label, on], i) => {
              const isPreservedSeal = label === "Preserved" && on;
              const isFrontier = on && i === frontier && !isPreservedSeal;
              const pill = isPreservedSeal
                ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30"
                : isFrontier
                  ? "bg-seal/25 text-white ring-1 ring-seal-light/40"
                  : on
                    ? "bg-white/[0.06] text-white/85 ring-1 ring-white/12"
                    : "bg-white/[0.02] text-white/30";
              return (
                <React.Fragment key={label}>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${pill}`}>
                    {on && <span className={isPreservedSeal ? "text-emerald-300" : "text-seal-light"} aria-hidden>✓</span>}{label}
                  </span>
                  {i < STAGES.length - 1 && <span className="px-0.5 text-white/15" aria-hidden>→</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {preserved ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200">
              <span aria-hidden className="relative flex h-3.5 w-3.5 items-center justify-center">
                <span className="absolute inset-0 rounded-full border border-emerald-400/60" />
                <span className="h-1 w-1 rounded-full bg-emerald-400/80" />
              </span>
              Preserved
            </span>
          ) : (
            <>
              {has("dispatch:publish") && lc === "rendered" && (
                <Button variant="ok" onClick={() => lifecycleAction(publish)} disabled={busy}>
                  {doc.posture?.publicationAuthority ? `Publish as ${doc.posture.publicationAuthority}` : "Publish"}
                </Button>
              )}
              {has("dispatch:publish") && lc === "published" && (
                <Button variant="ok" onClick={() => lifecycleAction(archiveDocument)} disabled={busy}>Preserve for the record</Button>
              )}
              {has("dispatch:publish") && (lc === "published" || lc === "rendered") && (
                <Button variant="ghost" onClick={() => lifecycleAction(withdraw)} disabled={busy}>Withdraw</Button>
              )}
            </>
          )}
        </div>
      </header>

      {doc.posture && <GovernanceStanding p={doc.posture} lifecycle={lc} submittedAt={doc.posture.waitingSince} />}

      {doc.governanceChain && doc.governanceChain.length > 0 && (
        <ChainOfAuthority steps={doc.governanceChain} rejected={doc.governanceRejected} />
      )}

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {govCert && (
        <Card className="mb-6 border-seal-light/30 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">Governance Certificate</div>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${govCert.complianceResult === "COMPLIANT" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{govCert.complianceResult}</span>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-[12.5px]">
            <div><span className="text-white/40">Policy: </span><span className="font-semibold text-white">{govCert.policyName}</span> <span className="font-mono text-[11px] text-white/40">v{govCert.policyVersion}</span></div>
            {govCert.publicationAuthority && <div><span className="text-white/40">Publication authority: </span><span className="text-white/80">{govCert.publicationAuthority}</span></div>}
            <div><span className="text-white/40">Separation of duties: </span><span className="text-emerald-300">{govCert.separationOfDuties}</span></div>
          </div>

          {/* required chain vs actual */}
          <div className="mb-4">
            <div className="mb-1.5 text-[11px] uppercase tracking-wide text-white/40">Required chain — and who satisfied it</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {govCert.requiredRoles.map((r, i) => {
                const actual = govCert.actualRoles.find((a) => a.step === r.step);
                return (
                  <React.Fragment key={i}>
                    <span className="inline-flex flex-col rounded border border-white/10 bg-ink-900/50 px-2.5 py-1">
                      <span className="text-[12px] font-semibold text-white">{r.label}{r.quorum > 1 ? ` ×${r.quorum}` : ""}</span>
                      <span className="font-mono text-[10px] text-emerald-300/80">{(actual?.satisfiedBy ?? []).map((s) => s.replace(/^svc:|^user:/, "")).join(", ") || "—"}</span>
                    </span>
                    {i < govCert.requiredRoles.length - 1 && <span className="text-white/25" aria-hidden>→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-white/40">Approval sequence</div>
            <ol className="space-y-1">
              {govCert.approvalSequence.map((a, i) => (
                <li key={i} className="text-[12px] text-white/75">
                  <span className="text-white/40">{i + 1}.</span> <span className="font-semibold text-white">{a.role}</span> · <span className="font-mono text-white/70">{a.actor.replace(/^svc:|^user:/, "")}</span>
                  {a.onBehalfOf && <span className="text-amber-300/80"> (on behalf of {a.onBehalfOf.replace(/^svc:|^user:/, "")})</span>}
                  <span className="text-white/35"> · {new Date(a.decidedAt).toLocaleString()}</span>
                </li>
              ))}
            </ol>
          </div>

          {govCert.delegations?.length > 0 && (
            <div className="mb-4 text-[12px]"><span className="text-white/40">Delegations used: </span>{govCert.delegations.map((d, i) => <span key={i} className="text-amber-300/80">{d.actor.replace(/^svc:|^user:/, "")} for {d.role}{i < govCert.delegations.length - 1 ? ", " : ""}</span>)}</div>
          )}

          <div><div className="text-[11px] uppercase tracking-wide text-white/40">Integrity proof (SHA-256)</div><div className="break-all font-mono text-[11px] text-seal-light/90">{govCert.integrityProof}</div></div>

          {/* certifying statement — this panel is an instrument, not a dashboard */}
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Issued by Sovereign Dispatch</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">
              Sovereign Dispatch certifies that this publication {govCert.complianceResult === "COMPLIANT" ? "satisfied" : "did not satisfy"} governance policy <span className="font-semibold text-white/75">{govCert.policyName}</span> (v{govCert.policyVersion}): the required approval chain was {govCert.complianceResult === "COMPLIANT" ? "satisfied in order" : "not satisfied in order"}, with separation of duties {govCert.separationOfDuties}. This certificate can be verified independently against the SHA-256 integrity proof above.
            </p>
          </div>
        </Card>
      )}

      {cert && (
        <Card className="mb-6 border-emerald-500/25 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">Preservation Certificate</div>
            <span className="text-[11px] text-white/35">Sealed {cert.archivedAt ? new Date(cert.archivedAt).toLocaleString() : "—"}</span>
          </div>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <div><dt className="text-[11px] uppercase tracking-wide text-white/40">Record</dt><dd className="font-mono text-sm text-white/85">{recordNo(cert.recordId, cert.publishedAt)}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-wide text-white/40">Governing policy</dt><dd className="text-sm text-white/85">{cert.governancePolicy?.name || "—"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-[11px] uppercase tracking-wide text-white/40">Record hash (SHA-256)</dt><dd className="break-all font-mono text-[11px] text-white/70">{cert.recordHash}</dd></div>
            <div className="sm:col-span-2"><dt className="text-[11px] uppercase tracking-wide text-white/40">Integrity proof (SHA-256)</dt><dd className="break-all font-mono text-[11px] text-emerald-200/90">{cert.integrityProof}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-wide text-white/40">Published</dt><dd className="text-sm text-white/75">{cert.publishedAt ? new Date(cert.publishedAt).toLocaleString() : "—"}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-wide text-white/40">Archived</dt><dd className="text-sm text-white/75">{cert.archivedAt ? new Date(cert.archivedAt).toLocaleString() : "—"}</dd></div>
          </dl>
          {cert.governancePolicy?.reviewChain?.length > 0 && (
            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wide text-white/40">Approval chain</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {cert.governancePolicy.reviewChain.map((s, i) => (
                  <React.Fragment key={i}>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[12px] text-white/80">{s.label}</span>
                    {i < cert.governancePolicy.reviewChain.length - 1 && <span className="text-white/25" aria-hidden>→</span>}
                  </React.Fragment>
                ))}
                {cert.governancePolicy.approvalAuthority && <span className="ml-1 text-[12px] text-white/45">· approval: {cert.governancePolicy.approvalAuthority}</span>}
              </div>
            </div>
          )}
          {cert.approvalChain?.length > 0 && (
            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-wide text-white/40">Recorded approvals</div>
              <ul className="mt-1 space-y-1">
                {cert.approvalChain.map((a, i) => (
                  <li key={i} className="text-[12px] text-white/70"><span className="font-mono text-white/85">{a.actor}</span> · {a.decision} · {new Date(a.ts).toLocaleString()}</li>
                ))}
              </ul>
            </div>
          )}

          {/* certifying statement — the seal, in words */}
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Issued by Sovereign Dispatch</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">
              Sovereign Dispatch certifies that this record was sealed{cert.archivedAt ? ` on ${new Date(cert.archivedAt).toLocaleString()}` : ""} and is terminal — no edit, withdrawal or republication is possible. The sealed form is provable against the SHA-256 integrity proof above.
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* render job */}
        <Card className="p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Render</h3>
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
          <h4 className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Artifacts</h4>
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
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Versions</h3>
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
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">Provenance trail</h3>
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

// ── Governance Standing — the answer to "who holds my document right now?" ────
// Reads the record's institutional posture as plain fact: the verdict sentence,
// the authority that holds it, who is next, who may publish, under what policy,
// and for how long. Every value is server-computed from real governance state.
const STANDING_DOT: Record<string, string> = {
  draft: "bg-white/30", submitted: "bg-amber-400", in_review: "bg-amber-400",
  approved: "bg-seal-light", rendered: "bg-seal-light", published: "bg-white",
  withdrawn: "bg-white/30", archived: "bg-emerald-400", rejected: "bg-red-400",
};
const waitedFor = (iso?: string | null): string => {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m`;
  return "just now";
};

const StandFact: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) =>
  value == null || value === "" ? null : (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{label}</div>
      <div className="mt-1 text-sm font-medium text-white/90">{value}</div>
    </div>
  );

// ── Chain of Authority — the record's approval chain as a live procession ──────
// Every office the record must pass, in order, with its standing: cleared (and by
// whom), awaiting now, or still to come — then the publishing office. This is the
// screen's answer to "whose turn is it?", visible at every stage, not only after
// the fact on the certificate. Colour discipline: emerald for cleared (settled),
// amber for the office that holds it now (the one exception that earns colour),
// monochrome for what is still pending.
const ChainOfAuthority: React.FC<{ steps: ChainStep[]; rejected?: boolean }> = ({ steps, rejected }) => (
  <section className="mb-6 overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.04] to-transparent">
    <div className="border-b border-white/[0.07] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">Chain of authority</div>
    <ol className="px-6 py-5">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const mark = s.state === "done"
          ? { ring: "border-emerald-400/60 bg-emerald-400/15 text-emerald-300", sym: "✓" }
          : s.state === "current"
            ? { ring: "border-amber-400/70 bg-amber-400/15 text-amber-300", sym: "●" }
            : { ring: "border-white/20 bg-transparent text-white/30", sym: "" };
        const sub = s.state === "done"
          ? (s.by.length ? <>Cleared by <span className="text-white/75">{s.by.join(", ")}</span></> : "Cleared")
          : s.state === "current"
            ? <span className="text-amber-300/90">{s.publication ? "Ready for publication by this office" : "Awaiting this office now"}</span>
            : <span className="text-white/35">{s.publication ? "Publication — after approval" : "Pending"}</span>;
        return (
          <li key={i} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!last && <span aria-hidden className={`absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px ${s.state === "done" ? "bg-emerald-400/25" : "bg-white/10"}`} />}
            <span className={`relative z-10 mt-0.5 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border text-[12px] font-bold ${mark.ring}`}>
              {mark.sym || i + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className={`text-sm font-semibold ${s.state === "pending" ? "text-white/55" : "text-white"}`}>{s.label}</span>
                {s.quorum > 1 && <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-white/50">needs {s.quorum}</span>}
                {s.publication && <span className="text-[10px] font-semibold uppercase tracking-wide text-white/30">publication</span>}
              </div>
              <div className="mt-0.5 text-[12px]">{sub}</div>
            </div>
          </li>
        );
      })}
    </ol>
    {rejected && (
      <div className="border-t border-amber-500/20 bg-amber-500/[0.06] px-6 py-2.5 text-[12px] text-amber-300/90">Returned for revision — off the publication path until re-submitted.</div>
    )}
  </section>
);

const GovernanceStanding: React.FC<{ p: NonNullable<DocumentDetail["posture"]>; lifecycle?: string; submittedAt?: string | null }> = ({ p, lifecycle = "", submittedAt }) => {
  const inReview = lifecycle === "in_review" || lifecycle === "submitted";
  const dot = STANDING_DOT[lifecycle] ?? "bg-white/40";
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.05] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">Governance Standing</div>
          <div className="mt-2 flex items-center gap-2.5">
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            <span className="font-serif text-[1.4rem] font-bold leading-none tracking-tight text-white">{p.status || "—"}</span>
          </div>
        </div>
        {p.policyName && (
          <div className="shrink-0 sm:text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Governing policy</div>
            <div className="mt-1 text-sm font-semibold text-white/90">{p.policyName}{p.policyVersion ? <span className="font-mono text-white/45"> v{p.policyVersion}</span> : null}</div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-white/[0.07] px-6 py-5 sm:grid-cols-4">
        {inReview && <StandFact label="Current authority" value={p.currentAuthority ?? <span className="text-white/45">Under review</span>} />}
        {inReview && <StandFact label="Next authority" value={p.nextAuthority} />}
        <StandFact label="Publication authority" value={p.publicationAuthority} />
        {inReview
          ? <StandFact label="Waiting" value={waitedFor(submittedAt)} />
          : <StandFact label="Submitted" value={submittedAt ? timeAgo(submittedAt) : undefined} />}
      </div>
    </section>
  );
};

export default DocumentView;

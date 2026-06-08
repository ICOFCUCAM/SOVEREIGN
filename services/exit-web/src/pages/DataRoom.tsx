import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Kpi, SectionHeader, fmtMoney } from "../lib/ui";
import { DILIGENCE, VALUATION_STRATEGIC } from "../lib/engines";
import { listDocuments, uploadDocument, fmtBytes, type DataRoomDocument, type RoomKind } from "../lib/data-room";

// Completeness model — buyers care about how complete each package is, not how
// many files were uploaded. Completeness = uploaded ÷ required specs (capped),
// and each missing REQUIRED artifact carries an estimated valuation impact
// (a fraction of the strategic headline, weighted by how foundational the
// package is to a buyer's diligence).
const PKG_IMPACT_WEIGHT: Record<string, number> = {
  financial: 0.06, legal: 0.05, security: 0.04, technical: 0.03,
  commercial: 0.03, market: 0.02, user_growth: 0.02,
};
function completeness(uploaded: number, required: number) {
  return required === 0 ? 100 : Math.min(100, Math.round((uploaded / required) * 100));
}
function missingImpactUsd(kind: string, missingRequired: number): number {
  const w = PKG_IMPACT_WEIGHT[kind] ?? 0.02;
  return VALUATION_STRATEGIC.headline.mid * w * missingRequired;
}

// Virtual Data Room — wired to Supabase storage via the exit-doc-upload
// + exit-doc-list edge functions. Diligence-engine specs surface the
// required artifacts per package; the uploader writes actual bytes to
// the 'exit-data-room' bucket and the list refreshes against it.

const CLASS_STYLE: Record<string, string> = {
  unclassified: "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  sensitive:    "bg-loi-500/15 text-loi-400 ring-loi-400/40",
  confidential: "bg-red-500/15 text-red-300 ring-red-400/40",
};

const DataRoom: React.FC = () => {
  const [activeKind, setActiveKind] = useState<RoomKind>((DILIGENCE.documents[0]?.kind as RoomKind) ?? "financial");
  const [uploaded, setUploaded] = useState<DataRoomDocument[]>([]);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const active = DILIGENCE.documents.find((d) => d.kind === activeKind) ?? DILIGENCE.documents[0];

  const refresh = async () => {
    setLoading(true); setError(null);
    try { setUploaded(await listDocuments()); }
    catch (e) { setError(e instanceof Error ? e.message : "list failed"); }
    finally   { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      await uploadDocument({ roomKind: activeKind, file });
      if (fileInput.current) fileInput.current.value = "";
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "upload failed");
    } finally {
      setUploading(false);
    }
  };

  const docsForActive = uploaded.filter((d) => d.room_kind === activeKind);
  const requiredArtifacts = DILIGENCE.documents.reduce((s, d) => s + d.artifacts.filter((a) => a.required).length, 0);
  const confidentialCount = DILIGENCE.documents.filter((d) => d.classification === "confidential").length;
  const uploadedTotalBytes = uploaded.reduce((s, d) => s + d.bytes, 0);

  // overall completeness + total at-risk value across all packages
  const perPkg = DILIGENCE.documents.map((d) => {
    const req = d.artifacts.filter((a) => a.required).length;
    const up = uploaded.filter((u) => u.room_kind === d.kind).length;
    const pct = completeness(up, req);
    const missing = Math.max(0, req - up);
    return { kind: d.kind, title: d.title, pct, missing, impact: missingImpactUsd(d.kind, missing), req, up };
  });
  const overallPct = perPkg.length ? Math.round(perPkg.reduce((s, p) => s + p.pct, 0) / perPkg.length) : 0;
  const atRiskUsd = perPkg.reduce((s, p) => s + p.impact, 0);
  const activePkg = perPkg.find((p) => p.kind === activeKind);
  // missing required artifacts for the active package
  const uploadedNames = new Set(docsForActive.map((d) => d.filename.toLowerCase()));
  const missingArtifacts = (active?.artifacts ?? []).filter((a) => a.required && !uploadedNames.has(a.filename.toLowerCase()));

  return (
    <div>
      <SectionHeader
        kicker="Module 02 · Workspace"
        title="Virtual Data Room"
        description="Diligence-engine specs surface the required artifacts per package. Uploaded files persist to the private 'exit-data-room' Supabase bucket and serve via short-lived signed URLs."
        actions={
          <>
            <Button variant="ghost" onClick={refresh} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</Button>
            <Button onClick={() => fileInput.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : `Upload to ${activeKind.replace(/_/g, " ")}`}</Button>
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              onChange={onFile}
              disabled={uploading}
            />
          </>
        }
      />

      {error && (
        <div className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Data room completeness" value={`${overallPct}%`} sub={`${requiredArtifacts} required specs across ${DILIGENCE.documents.length} packages`} accent={overallPct >= 80 ? "#34d399" : overallPct >= 50 ? "#fbbf24" : "#f87171"} />
        <Kpi label="Value at risk"          value={`-${fmtMoney(atRiskUsd)}`} sub="if missing artifacts stay open" accent="#f87171" />
        <Kpi label="Uploaded"               value={String(uploaded.length)} sub={fmtBytes(uploadedTotalBytes)} accent="#34d399" />
        <Kpi label="Confidential pkgs"      value={String(confidentialCount)} sub="ring-1 access policy" />
      </div>

      {/* Due Diligence AI — instant risk readout on the package contents */}
      <Card className="mt-8 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/10 bg-loi-500/10 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-loi-500/25 text-[12px] text-loi-200 ring-1 ring-loi-400/40">!</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-loi-200">Due Diligence AI · risk scan</span>
          </div>
          <Link to="/console/diligence-ai" className="text-[12px] font-semibold text-loi-200 hover:text-loi-100">Full report →</Link>
        </div>
        <div className="grid gap-px bg-white/10 sm:grid-cols-2">
          {DILIGENCE.redFlags.length === 0 ? (
            <div className="bg-ink-800/95 p-5 text-sm text-white/55 sm:col-span-2">No material risks detected in the current package — defensible buyer-facing posture.</div>
          ) : (
            DILIGENCE.redFlags.slice(0, 4).map((f) => {
              const fl = f.toLowerCase();
              const cat = fl.includes("concentration") ? "Customer concentration" : fl.includes("regulat") || fl.includes("compliance") ? "Compliance" : fl.includes("margin") || fl.includes("revenue") || fl.includes("retention") ? "Revenue" : "Legal";
              return (
                <div key={f} className="bg-ink-800/95 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-loi-300">{cat} risk</div>
                  <div className="mt-1 text-[13px] leading-snug text-white/80">{f}</div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {DILIGENCE.documents.map((doc) => {
            const pkg = perPkg.find((p) => p.kind === doc.kind);
            const pct = pkg?.pct ?? 0;
            const pc = pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";
            return (
              <button
                key={doc.kind}
                onClick={() => setActiveKind(doc.kind as RoomKind)}
                className={`block w-full rounded-lg border p-3 text-left transition ${
                  activeKind === doc.kind
                    ? "border-deal-400/50 bg-deal-600/10"
                    : "border-white/10 bg-ink-800/40 hover:border-white/20 hover:bg-ink-800/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium leading-tight text-white">{doc.title}</div>
                  <span className="shrink-0 font-mono text-[11px] font-bold" style={{ color: pc }}>{pct}%</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pc }} />
                </div>
                <div className="mt-1.5 flex items-baseline justify-between text-[10px] text-white/45">
                  <span>{pkg?.up ?? 0}/{pkg?.req ?? 0} required</span>
                  {pkg && pkg.missing > 0 && <span className="text-red-300/80">-{fmtMoney(pkg.impact)}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {active && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-5 border-b border-white/10 pb-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-deal-400">{active.kind.replace(/_/g, " ")}</div>
                <h2 className="mt-2 font-serif text-2xl font-bold text-white">{active.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className={`rounded-full px-2.5 py-0.5 font-semibold uppercase tracking-wide ring-1 ${CLASS_STYLE[active.classification]}`}>
                    {active.classification}
                  </span>
                  <span className="text-white/45">{active.artifacts.length} required specs · {docsForActive.length} uploaded</span>
                </div>
              </div>

              {/* completeness + missing artifacts with estimated impact */}
              {activePkg && (
                <div className="mb-6 rounded-lg border border-white/10 bg-ink-900/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Package completeness</span>
                    <span className="font-mono text-lg font-bold" style={{ color: activePkg.pct >= 80 ? "#34d399" : activePkg.pct >= 50 ? "#fbbf24" : "#f87171" }}>{activePkg.pct}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${activePkg.pct}%`, background: activePkg.pct >= 80 ? "#34d399" : activePkg.pct >= 50 ? "#fbbf24" : "#f87171" }} />
                  </div>
                  {missingArtifacts.length > 0 ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-white/55">Missing required artifacts</span>
                        <span className="font-mono font-semibold text-red-300">est. impact -{fmtMoney(activePkg.impact)}</span>
                      </div>
                      <ul className="mt-2 space-y-1 text-[12px] text-white/70">
                        {missingArtifacts.map((a) => (
                          <li key={a.filename} className="flex items-baseline gap-2">
                            <span className="mt-1 inline-block h-1 w-1 rounded-full bg-red-400" /><span className="font-mono">{a.filename}</span> <span className="text-white/40">— {a.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-3 text-[12px] text-deal-300">All required artifacts present for this package.</div>
                  )}
                </div>
              )}

              <h3 className="mb-3 font-serif text-base font-bold text-white">Uploaded artifacts</h3>
              {docsForActive.length === 0 ? (
                <div className="rounded border border-dashed border-white/15 bg-ink-900/40 px-4 py-8 text-center text-sm text-white/45">
                  No documents uploaded to this package yet.<br />
                  <button onClick={() => fileInput.current?.click()} className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-deal-400 hover:text-deal-300">
                    Upload your first artifact →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {docsForActive.map((d) => (
                    <div key={d.id} className="flex items-baseline justify-between rounded border border-white/10 bg-ink-900/40 px-3 py-2">
                      <div>
                        <div className="font-mono text-[12px] text-white">{d.filename}</div>
                        <div className="mt-0.5 text-[11px] text-white/50">
                          {fmtBytes(d.bytes)} · {d.mime} · {new Date(d.uploaded_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          d.classification === "confidential" ? "bg-red-500/15 text-red-300" :
                          d.classification === "sensitive"     ? "bg-loi-500/15 text-loi-400" :
                                                                  "bg-deal-600/20 text-deal-300"
                        }`}>{d.classification}</span>
                        {d.downloadUrl && (
                          <a href={d.downloadUrl} target="_blank" rel="noreferrer" className="text-[12px] font-semibold uppercase tracking-wide text-deal-400 hover:text-deal-300">
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="mb-3 mt-7 font-serif text-base font-bold text-white">Required artifacts (engine spec)</h3>
              <div className="space-y-2">
                {active.artifacts.map((a) => (
                  <div key={a.filename} className="flex items-baseline justify-between rounded border border-white/10 bg-ink-900/40 px-3 py-2">
                    <div>
                      <div className="font-mono text-[12px] text-white">{a.filename}</div>
                      <div className="mt-0.5 text-[11px] text-white/50">{a.description}</div>
                    </div>
                    {a.required ? (
                      <span className="rounded bg-loi-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-loi-400">Required</span>
                    ) : (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">Optional</span>
                    )}
                  </div>
                ))}
              </div>

              <h3 className="mb-3 mt-7 font-serif text-base font-bold text-white">Sections & questions</h3>
              <div className="space-y-4">
                {active.sections.map((s, i) => (
                  <div key={`${i}-${s.heading}`}>
                    <div className="font-medium text-white">{s.heading}</div>
                    <ul className="mt-2 space-y-1 text-[12px] text-white/65">
                      {s.questions.map((q) => (
                        <li key={q} className="flex items-baseline gap-2">
                          <span className="mt-1 inline-block h-1 w-1 rounded-full bg-deal-400" /> {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataRoom;

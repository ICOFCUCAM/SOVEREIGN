import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fmtMoney } from "../lib/ui";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { PageHeader, Section, Metric, Provenance } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { runDueDiligence } from "@exit/engines";
import { canonicalValuationFor } from "../lib/canonical-valuation";
import { loadActiveCompany } from "../lib/active-company";
import { label } from "../lib/labels";
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
function missingImpactUsd(kind: string, missingRequired: number, valueUsd: number): number {
  const w = PKG_IMPACT_WEIGHT[kind] ?? 0.02;
  return valueUsd * w * missingRequired;
}

// Virtual Data Room — wired to Supabase storage via the exit-doc-upload
// + exit-doc-list edge functions. Diligence-engine specs surface the
// required artifacts per package; the uploader writes actual bytes to
// the 'exit-data-room' bucket and the list refreshes against it.

const DataRoom: React.FC = () => {
  // The checklist and value follow the founder's saved intake when there is
  // one, else the demo company. (Uploads always go to the shared demo tenant.)
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const DILIGENCE = useMemo(() => runDueDiligence(company), [company]);
  const valueUsd = useMemo(() => canonicalValuationFor(company).headline.mid, [company]);
  const [activeKind, setActiveKind] = useState<RoomKind>((DILIGENCE.documents[0]?.kind as RoomKind) ?? "financial");
  const [uploaded, setUploaded] = useState<DataRoomDocument[]>([]);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // Uploads go to one demo tenant that every user can list and download (X12).
  // Nothing is uploaded until the founder has acknowledged that.
  const [ack, setAck] = useState(false);

  const active = DILIGENCE.documents.find((d) => d.kind === activeKind) ?? DILIGENCE.documents[0];

  const refresh = async () => {
    setLoading(true); setError(null);
    try { setUploaded(await listDocuments()); }
    catch (e) { setError(`Could not load the uploaded documents (${e instanceof Error ? e.message : "list failed"}). The engine checklist below still applies.`); }
    finally   { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => { await upload(e.target.files?.[0]); };
  // a file dropped on the package's upload zone goes the same way as one picked (only once the shared-storage
  // notice is acknowledged)
  const [dragging, setDragging] = useState(false);
  const dropProps = {
    onDragOver: (e: React.DragEvent) => { if (!ack || uploading) return; e.preventDefault(); setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setDragging(false); if (ack && !uploading) void upload(e.dataTransfer.files?.[0]); },
  };
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      await uploadDocument({ roomKind: activeKind, file });
      if (fileInput.current) fileInput.current.value = "";
      await refresh();
    } catch (err) {
      setError(`The upload did not complete (${err instanceof Error ? err.message : "upload failed"}). Nothing was added.`);
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
    return { kind: d.kind, title: d.title, pct, missing, impact: missingImpactUsd(d.kind, missing, valueUsd), req, up };
  });
  const overallPct = perPkg.length ? Math.round(perPkg.reduce((s, p) => s + p.pct, 0) / perPkg.length) : 0;
  const atRiskUsd = perPkg.reduce((s, p) => s + p.impact, 0);
  const worstPkg = perPkg.filter((p) => p.missing > 0).sort((a, b) => b.impact - a.impact)[0];
  const activePkg = perPkg.find((p) => p.kind === activeKind);
  // missing required artifacts for the active package
  const uploadedNames = new Set(docsForActive.map((d) => d.filename.toLowerCase()));
  const missingArtifacts = (active?.artifacts ?? []).filter((a) => a.required && !uploadedNames.has(a.filename.toLowerCase()));

  // The illustrative-discount rule, with the weights each package actually gets.
  const weightRule = DILIGENCE.documents.map((d) => `${d.title} ${Math.round((PKG_IMPACT_WEIGHT[d.kind] ?? 0.02) * 100)}%`).join(", ");
  const pctCls = (p: number): string => p >= 80 ? "text-xo-verified" : p >= 50 ? "text-xo-caution" : "text-xo-risk";
  const CLASS_CLS: Record<string, string> = { unclassified: "text-xo-verified", sensitive: "text-xo-caution", confidential: "text-xo-risk" };

  return (
    <div data-page="data-room" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Workspace · Data Room · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`} title="Virtual Data Room"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Diligence artifacts · {overallPct}% complete</span></>}
        actions={<>
          <button type="button" onClick={refresh} disabled={loading} className="rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60">{loading ? "Refreshing…" : "Refresh"}</button>
          <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading || !ack} aria-describedby="dr-shared" className="rounded-sm bg-deal-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60">{uploading ? "Uploading…" : `Upload to ${activeKind.replace(/_/g, " ")}`}</button>
          <input ref={fileInput} type="file" className="hidden" onChange={onFile} disabled={uploading || !ack} aria-label={`Upload a file to the ${activeKind.replace(/_/g, " ")} package`} />
        </>} />

      <section aria-label="Data room summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Completeness" emphasis value={<span className={pctCls(overallPct)}>{overallPct}%</span>} sub={`${requiredArtifacts} specs · ${DILIGENCE.documents.length} packages`} /></div>
        <div className="bg-xo-panel"><Metric label="Illustrative discount" value={<span className="text-xo-risk">-{fmtMoney(atRiskUsd)}</span>} sub="fixed-weight rule, see below" /></div>
        <div className="bg-xo-panel"><Metric label="Uploaded" value={String(uploaded.length)} sub={fmtBytes(uploadedTotalBytes)} /></div>
        <div className="bg-xo-panel"><Metric label="Confidential pkgs" value={String(confidentialCount)} sub="engine classification" /></div>
      </section>

      <RegistryTape items={buildMarketTape()} asOf={DNA_AS_OF.slice(0, 10)} />

      <section id="dr-shared" aria-labelledby="dr-shared-h" className="border border-xo-caution/60 bg-xo-panel px-4 py-3">
        <h2 id="dr-shared-h" className="text-[14px] font-semibold text-xo-caution">Shared storage — read before uploading</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-xo-muted">Files uploaded here are stored in a single demo workspace in ExitOS storage. <span className="text-xo-text">Anyone using this app can list and download them.</span> Per-founder access control is not built yet, and the confidential / sensitive labels do not restrict access. Do not upload confidential documents.</p>
        <label className="mt-2 flex items-start gap-2 text-[13px]">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#047857]" />
          <span>I understand that anything I upload here is visible to every ExitOS user.</span>
        </label>
      </section>

      {error && <p role="alert" className="border border-xo-risk/50 bg-xo-panel px-4 py-3 text-[13px] text-xo-risk">{error}</p>}

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
        foot={`Illustrative discount rule: enterprise value × package weight × missing required artifacts. Weights: ${weightRule}. A fixed rule, not a measured buyer discount.`}
        right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-risk">-{fmtMoney(atRiskUsd)}</span>}>
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">{worstPkg
            ? <>Upload the <span className="font-semibold">{worstPkg.missing} missing artifact{worstPkg.missing === 1 ? "" : "s"}</span> in {worstPkg.title} — the biggest gap in the room.</>
            : <>Room is complete — keep it current as new diligence requests land.</>}</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="At stake"><span className="font-mono font-semibold text-xo-risk">-{fmtMoney(atRiskUsd)}</span> illustrative discount while gaps stay open (rule) · {overallPct}% complete.</TakeCell>
            <TakeCell k="If you wait">Every empty package lets a buyer discount the bid or stall in diligence until it's filled.</TakeCell>
            <TakeCell k="Buyer focus">A buyer in diligence probes the weakest package first{worstPkg ? <> — <span className="text-xo-text">{worstPkg.title}</span></> : null}.</TakeCell>
            <TakeCell k="What ExitOS does">Maps every engine-required artifact, scores completeness and applies a fixed-weight rule to show what each gap could cost. The rule is not measured from buyer behaviour.</TakeCell>
          </dl>
          <Link to="/console/diligence-ai" className="mt-3 inline-block rounded-sm border border-xo-line px-4 py-2 text-[13px] font-semibold text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Run the risk scan →</Link>
        </div>
      </Section>

      <Section title="Diligence risk scan · rule-based" eyebrow="Engine red flags, grouped by keyword" className="border border-xo-line"
        right={<Link to="/console/diligence-ai" className="text-[12px] font-semibold text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Full report →</Link>}>
        {DILIGENCE.redFlags.length === 0 ? (
          <p className="px-4 py-3 text-[13px] text-xo-muted">No material risks detected in the current package — defensible buyer-facing posture.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2">
            {DILIGENCE.redFlags.slice(0, 4).map((f) => {
              const fl = f.toLowerCase();
              const cat = fl.includes("concentration") ? "Customer concentration" : fl.includes("regulat") || fl.includes("compliance") ? "Compliance" : fl.includes("margin") || fl.includes("revenue") || fl.includes("retention") ? "Revenue" : "Legal";
              return (
                <li key={f} className="bg-xo-panel px-4 py-3">
                  <div className="text-[11px] font-semibold text-xo-caution">{cat} risk</div>
                  <div className="mt-1 text-[13px] leading-snug">{f}</div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-[280px_1fr]">
        <nav aria-label="Data room packages" className="bg-xo-panel p-2">
          <ul className="space-y-1">
            {DILIGENCE.documents.map((doc) => {
              const pkg = perPkg.find((p) => p.kind === doc.kind);
              const pct = pkg?.pct ?? 0;
              const on = activeKind === doc.kind;
              return (
                <li key={doc.kind}>
                  <button type="button" aria-current={on ? "true" : undefined} onClick={() => setActiveKind(doc.kind as RoomKind)}
                    className={`block w-full border px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action ${on ? "border-xo-verified/60 bg-xo-raise" : "border-xo-line hover:bg-xo-raise"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-medium leading-tight">{doc.title}</span>
                      <span className={`shrink-0 font-mono text-[12px] font-semibold ${pctCls(pct)}`}>{pct}%</span>
                    </div>
                    <div aria-hidden className="mt-1.5 h-1 overflow-hidden rounded-full bg-xo-line"><div className="h-full rounded-full bg-xo-action" style={{ width: `${pct}%` }} /></div>
                    <div className="mt-1 flex items-baseline justify-between text-[11px] text-xo-faint">
                      <span>{pkg?.up ?? 0}/{pkg?.req ?? 0} required</span>
                      {pkg && pkg.missing > 0 && <span className="text-xo-risk">-{fmtMoney(pkg.impact)}</span>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 px-1 text-[11px] leading-snug text-xo-faint">Completeness: files uploaded to a package ÷ its required artifacts, capped at 100% — any file counts. The missing list matches required filenames.</p>
        </nav>

        {active && (
          <section aria-labelledby="dr-active" className="min-w-0 bg-xo-panel px-4 py-4">
            <div className="border-b border-xo-line pb-3">
              <div className="text-[11px] font-semibold text-xo-faint">{label(active.kind)}</div>
              <h2 id="dr-active" className="mt-1 font-serif text-[20px] font-semibold">{active.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                <span className={`font-semibold capitalize ${CLASS_CLS[active.classification]}`}>{active.classification}</span>
                <span className="text-xo-faint">{active.artifacts.length} required specs · {docsForActive.length} uploaded</span>
              </div>
            </div>

            {activePkg && (
              <div className="mt-3 border border-xo-line px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-xo-muted">Package completeness</span>
                  <span className={`font-mono text-[17px] font-semibold ${pctCls(activePkg.pct)}`}>{activePkg.pct}%</span>
                </div>
                <div aria-hidden className="mt-2 h-2 overflow-hidden rounded-full bg-xo-line"><div className="h-full rounded-full bg-xo-action" style={{ width: `${activePkg.pct}%` }} /></div>
                {missingArtifacts.length > 0 ? (
                  <div className="mt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                      <span className="text-xo-muted">Missing required artifacts</span>
                      <span className="font-mono font-semibold text-xo-risk">illustrative impact -{fmtMoney(activePkg.impact)}</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-[12px]">
                      {missingArtifacts.map((a) => (
                        <li key={a.filename} className="break-words"><span className="font-mono">{a.filename}</span> <span className="text-xo-faint">— {a.description}</span></li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-[12px] text-xo-verified">All required artifacts present for this package.</p>
                )}
              </div>
            )}

            <h3 className="mb-2 mt-5 font-serif text-[15px] font-semibold">Uploaded artifacts</h3>
            {docsForActive.length === 0 ? (
              <div {...dropProps} className={`border border-dashed px-4 py-6 text-center text-[13px] text-xo-muted transition-colors ${dragging ? "border-xo-action bg-xo-action/10" : "border-xo-line"}`}>
                {dragging ? "Drop to upload to this package." : <>No documents uploaded to this package yet.{ack && <> Drop a file here, or:</>}</>}<br />
                <button type="button" onClick={() => fileInput.current?.click()} disabled={!ack} aria-describedby="dr-shared" className="mt-2 inline-block py-1 disabled:opacity-60 text-[12px] font-semibold text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Upload your first artifact →</button>
              </div>
            ) : (
              <ul className="space-y-2">
                {docsForActive.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-2 border border-xo-line px-3 py-2">
                    <div className="min-w-0">
                      <div className="break-all font-mono text-[12px]">{d.filename}</div>
                      <div className="mt-0.5 text-[11px] text-xo-faint">{fmtBytes(d.bytes)} · {d.mime} · {new Date(d.uploaded_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-semibold capitalize ${CLASS_CLS[d.classification]}`}>{d.classification} <span className="font-normal normal-case text-xo-faint">(label only)</span></span>
                      {d.downloadUrl && <a href={d.downloadUrl} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Download<span className="sr-only"> {d.filename} (opens in a new tab)</span></a>}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mb-2 mt-5 font-serif text-[15px] font-semibold">Required artifacts (engine spec)</h3>
            <ul className="space-y-2">
              {active.artifacts.map((a) => (
                <li key={a.filename} className="flex flex-wrap items-baseline justify-between gap-2 border border-xo-line px-3 py-2">
                  <div className="min-w-0">
                    <div className="break-all font-mono text-[12px]">{a.filename}</div>
                    <div className="mt-0.5 text-[11px] text-xo-faint">{a.description}</div>
                  </div>
                  <span className={`text-[11px] font-semibold ${a.required ? "text-xo-caution" : "text-xo-faint"}`}>{a.required ? "Required" : "Optional"}</span>
                </li>
              ))}
            </ul>

            <h3 className="mb-2 mt-5 font-serif text-[15px] font-semibold">Sections & questions</h3>
            <div className="space-y-3">
              {active.sections.map((s, i) => (
                <div key={`${i}-${s.heading}`}>
                  <h4 className="text-[13px] font-medium">{s.heading}</h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-[12px] text-xo-muted">
                    {s.questions.map((q) => <li key={q}>{q}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

export default DataRoom;

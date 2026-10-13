import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fmtMoney } from "../lib/ui";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { PageHeader, Section, Metric, Provenance } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { runDueDiligence, roomProgress, suggestedName, type ArtifactStatus } from "@exit/engines";
import { canonicalValuationFor } from "../lib/canonical-valuation";
import { loadActiveCompany } from "../lib/active-company";
import { label } from "../lib/labels";
import { listDocuments, uploadDocument, tagFile, reviewFile, toRoomFile, fmtBytes, type DataRoomDocument, type RoomKind } from "../lib/data-room";

// Completeness model (exit-engines diligence/room.ts): a required artifact counts only
// when a file tagged with it, for this company, has been accepted. Untagged uploads,
// files awaiting review and rejected files count for nothing. Each required artifact
// still missing carries an illustrative valuation impact (a fixed fraction of the
// headline, weighted by how foundational the package is to a buyer's diligence).
const PKG_IMPACT_WEIGHT: Record<string, number> = {
  financial: 0.06, legal: 0.05, security: 0.04, technical_architecture: 0.03,
  commercial: 0.03, market: 0.02, user_growth: 0.02,
};
const STATUS: Record<ArtifactStatus, { text: string; cls: string }> = {
  accepted: { text: "Accepted", cls: "text-xo-verified" },
  in_review: { text: "Awaiting your review", cls: "text-xo-caution" },
  rejected: { text: "Rejected — upload a replacement", cls: "text-xo-risk" },
  missing: { text: "Missing", cls: "text-xo-risk" },
};
function missingImpactUsd(kind: string, missingRequired: number, valueUsd: number): number {
  const w = PKG_IMPACT_WEIGHT[kind] ?? 0.02;
  return valueUsd * w * missingRequired;
}

// Virtual Data Room — wired to Supabase storage via the exit-doc-upload
// + exit-doc-list edge functions, in the signed-in account's own room. Each
// upload is tagged with the artifact it satisfies; the owner then accepts or
// rejects it (exit_data_room_review). Completeness follows accepted artifacts.

const DataRoom: React.FC = () => {
  // The checklist and value follow the founder's saved intake when there is
  // one, else the demo company. Files are tagged with the intake's company id.
  const { company, fromIntake, companyId } = useMemo(() => loadActiveCompany(), []);
  const DILIGENCE = useMemo(() => runDueDiligence(company), [company]);
  const valueUsd = useMemo(() => canonicalValuationFor(company).headline.mid, [company]);
  const [activeKind, setActiveKind] = useState<RoomKind>((DILIGENCE.documents[0]?.kind as RoomKind) ?? "financial");
  const [uploaded, setUploaded] = useState<DataRoomDocument[]>([]);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // the artifact the next picked file will be tagged with (null: an untagged upload)
  const [target, setTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const active = DILIGENCE.documents.find((d) => d.kind === activeKind) ?? DILIGENCE.documents[0];

  const refresh = async () => {
    setLoading(true); setError(null);
    try { setUploaded(await listDocuments()); }
    catch (e) { setError(`Could not load the uploaded documents (${e instanceof Error ? e.message : "list failed"}). The engine checklist below still applies.`); }
    finally   { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => { await upload(e.target.files?.[0], target); };
  const pick = (artifactId: string | null): void => { setTarget(artifactId); fileInput.current?.click(); };
  const upload = async (file: File | undefined, artifactId: string | null) => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      await uploadDocument({ roomKind: activeKind, file, ...(artifactId ? { artifactId } : {}), companyId });
      if (fileInput.current) fileInput.current.value = "";
      await refresh();
    } catch (err) {
      setError(`The upload did not complete (${err instanceof Error ? err.message : "upload failed"}). Nothing was added.`);
    } finally {
      setUploading(false); setTarget(null);
    }
  };
  const act = async (id: string, what: string, run: () => Promise<void>): Promise<void> => {
    setBusy(id); setError(null);
    try { await run(); await refresh(); }
    catch (e) { setError(`${what} did not complete (${e instanceof Error ? e.message : "failed"}).`); }
    finally { setBusy(null); }
  };

  const byId = new Map(uploaded.map((d) => [d.id, d]));
  const progress = useMemo(() => roomProgress(DILIGENCE.documents, uploaded.map(toRoomFile), companyId), [DILIGENCE, uploaded, companyId]);
  const confidentialCount = DILIGENCE.documents.filter((d) => d.classification === "confidential").length;
  const uploadedTotalBytes = uploaded.reduce((s, d) => s + d.bytes, 0);
  const period = String(new Date().getFullYear() - 1);

  // completeness per package and overall (accepted required artifacts ÷ required), and the illustrative at-risk value
  const perPkg = progress.packages.map((p) => {
    const missing = p.required - p.accepted;
    return { kind: p.kind, title: p.title, pct: p.pct, missing, impact: missingImpactUsd(p.kind, missing, valueUsd), req: p.required, up: p.accepted };
  });
  const overallPct = progress.pct;
  const atRiskUsd = perPkg.reduce((s, p) => s + p.impact, 0);
  const worstPkg = perPkg.filter((p) => p.missing > 0).sort((a, b) => b.impact - a.impact)[0];
  const activePkg = perPkg.find((p) => p.kind === activeKind);
  const activeProgress = progress.packages.find((p) => p.kind === activeKind);
  const untaggedHere = progress.untagged.map((f) => byId.get(f.id)).filter((d): d is DataRoomDocument => !!d && d.room_kind === activeKind);
  const awaiting = progress.packages.flatMap((p) => p.artifacts).filter((a) => a.status === "in_review").length;

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
          <input ref={fileInput} type="file" className="hidden" onChange={onFile} disabled={uploading} aria-label={`Upload a file to the ${activeKind.replace(/_/g, " ")} package`} />
        </>} />

      <section aria-label="Data room summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Completeness" emphasis value={<span className={pctCls(overallPct)}>{overallPct}%</span>} sub={`${progress.accepted} of ${progress.required} required artifacts accepted`} /></div>
        <div className="bg-xo-panel"><Metric label="Illustrative discount" value={<span className="text-xo-risk">-{fmtMoney(atRiskUsd)}</span>} sub="fixed-weight rule, see below" /></div>
        <div className="bg-xo-panel"><Metric label="Uploaded" value={String(uploaded.length)} sub={`${fmtBytes(uploadedTotalBytes)} · ${awaiting} awaiting review · ${progress.untagged.length} untagged`} /></div>
        <div className="bg-xo-panel"><Metric label="Confidential pkgs" value={String(confidentialCount)} sub="engine classification" /></div>
      </section>

      <RegistryTape items={buildMarketTape()} asOf={DNA_AS_OF.slice(0, 10)} />

      <section aria-labelledby="dr-access-h" className="border border-xo-line bg-xo-panel px-4 py-3">
        <h2 id="dr-access-h" className="text-[14px] font-semibold">Who can see these files</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-xo-muted">Files are stored in your own account's room: only you can list and download them, through short-lived links. Buyers have no access yet; granting it under an executed NDA is a later step. The confidential and sensitive labels describe the files and do not add further restrictions. <span className="text-xo-text">"Accepted" is your own confirmation that a file is the document the artifact asks for, not an independent review.</span></p>
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
          <p className="mt-2 px-1 text-[11px] leading-snug text-xo-faint">Completeness: required artifacts with an accepted file ÷ required artifacts. A file counts only when it is tagged with the artifact, belongs to this company and has been accepted.</p>
        </nav>

        {active && (
          <section aria-labelledby="dr-active" className="min-w-0 bg-xo-panel px-4 py-4">
            <div className="border-b border-xo-line pb-3">
              <div className="text-[11px] font-semibold text-xo-faint">{label(active.kind)}</div>
              <h2 id="dr-active" className="mt-1 font-serif text-[20px] font-semibold">{active.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                <span className={`font-semibold capitalize ${CLASS_CLS[active.classification]}`}>{active.classification}</span>
                <span className="text-xo-faint">{activePkg?.req ?? 0} required artifacts · {activePkg?.up ?? 0} accepted</span>
              </div>
            </div>

            {activePkg && (
              <div className="mt-3 border border-xo-line px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-xo-muted">Package completeness</span>
                  <span className={`font-mono text-[17px] font-semibold ${pctCls(activePkg.pct)}`}>{activePkg.pct}%</span>
                </div>
                <div aria-hidden className="mt-2 h-2 overflow-hidden rounded-full bg-xo-line"><div className="h-full rounded-full bg-xo-action" style={{ width: `${activePkg.pct}%` }} /></div>
                {activePkg.missing > 0
                  ? <p className="mt-2 text-[12px] text-xo-muted">{activePkg.missing} required artifact{activePkg.missing === 1 ? "" : "s"} not yet accepted · <span className="font-mono font-semibold text-xo-risk">illustrative impact -{fmtMoney(activePkg.impact)}</span></p>
                  : <p className="mt-2 text-[12px] text-xo-verified">Every required artifact in this package has an accepted file.</p>}
              </div>
            )}

            <h3 className="mb-2 mt-5 font-serif text-[15px] font-semibold">Artifacts</h3>
            <ul className="space-y-2">
              {(activeProgress?.artifacts ?? []).map(({ artifact: a, status, files }) => (
                <li key={a.id} data-artifact={a.id} className="border border-xo-line px-3 py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium">{a.description} <span className={`text-[11px] font-semibold ${a.required ? "text-xo-caution" : "text-xo-faint"}`}>{a.required ? "Required" : "Optional"}</span></div>
                      <div className="mt-0.5 text-[11px] text-xo-faint">Suggested name <span className="font-mono">{suggestedName(a, period)}</span></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[12px] font-semibold ${STATUS[status].cls}`}>{STATUS[status].text}</span>
                      <button type="button" onClick={() => pick(a.id)} disabled={uploading} className="rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-medium text-xo-text hover:bg-xo-raise disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{uploading && target === a.id ? "Uploading…" : files.length ? "Upload another" : "Upload"}<span className="sr-only"> for {a.description}</span></button>
                    </div>
                  </div>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1 border-t border-xo-line pt-2">
                      {files.map((f) => { const d = byId.get(f.id); return d && (
                        <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                          <span className="min-w-0 break-all"><span className="font-mono">{d.filename}</span> <span className="text-xo-faint">· {fmtBytes(d.bytes)} · {new Date(d.uploaded_at).toLocaleDateString()} · {d.review_state === "accepted" ? "accepted" : d.review_state === "rejected" ? "rejected" : "awaiting review"}{d.review_note ? ` · ${d.review_note}` : ""}</span></span>
                          <span className="flex items-center gap-2">
                            {d.review_state !== "accepted" && <button type="button" disabled={busy === d.id} onClick={() => void act(d.id, "Accepting the file", () => reviewFile(d.id, "accepted"))} className="font-semibold text-xo-verified hover:underline disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Accept<span className="sr-only"> {d.filename}</span></button>}
                            {d.review_state !== "rejected" && <button type="button" disabled={busy === d.id} onClick={() => void act(d.id, "Rejecting the file", () => reviewFile(d.id, "rejected"))} className="font-semibold text-xo-risk hover:underline disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Reject<span className="sr-only"> {d.filename}</span></button>}
                            {d.downloadUrl && <a href={d.downloadUrl} target="_blank" rel="noreferrer" className="font-semibold text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Download<span className="sr-only"> {d.filename} (opens in a new tab)</span></a>}
                          </span>
                        </li>
                      ); })}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            <h3 className="mb-2 mt-5 font-serif text-[15px] font-semibold">Untagged files in this package</h3>
            {untaggedHere.length === 0 ? (
              <p className="text-[12px] text-xo-faint">None. A file counts towards completeness only once it is tagged with the artifact it satisfies and accepted.</p>
            ) : (
              <ul className="space-y-2">
                {untaggedHere.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border border-xo-line px-3 py-2 text-[12px]">
                    <span className="min-w-0 break-all"><span className="font-mono">{d.filename}</span> <span className="text-xo-faint">· {fmtBytes(d.bytes)} · counts for nothing until tagged</span></span>
                    <label className="flex items-center gap-2">
                      <span className="text-xo-muted">Tag as</span>
                      <select disabled={busy === d.id} defaultValue="" onChange={(e) => { const v = e.target.value; if (v) void act(d.id, "Tagging the file", () => tagFile(d.id, v, companyId)); }}
                        className="rounded-sm border border-xo-line bg-xo-ink px-2 py-1 text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">
                        <option value="">— choose the artifact —</option>
                        {active.artifacts.map((a) => <option key={a.id} value={a.id}>{a.description}</option>)}
                      </select>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={() => pick(null)} disabled={uploading} className="mt-2 text-[12px] font-semibold text-xo-action hover:underline disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Upload a file without tagging it yet →</button>

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

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicHeader, PublicFooter, PageBanner, FilmGrain } from "../components/brand";
import { verifyRecord, type VerifyResult } from "../lib/api";
import { useMarketing4Copy } from "../lib/messages";
import type { VerifyCopy } from "../lib/messages/marketing4";

// PUBLIC VERIFICATION PORTAL — the institutional proof a copied PDF can never
// carry. Anyone holding a copy of an Official Record can confirm, with no account,
// that it is genuine, which institution issued it, and whether it is still current
// or has been revoked. A photocopy of a passport is not a passport; a copy of a
// record still points back to the one verifiable record here. All copy is
// localized via lib/messages/marketing4.ts; only the structural styling (ring,
// chip, mark, proof index) lives here.

const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" }) : "—";

const VERDICT_STYLE: Record<string, { ring: string; chip: string; mark: string }> = {
  OFFICIAL: { ring: "border-emerald-500/40 from-emerald-500/[0.10]", chip: "bg-emerald-500/15 text-emerald-300", mark: "✓" },
  PRESERVED: { ring: "border-emerald-500/40 from-emerald-500/[0.10]", chip: "bg-emerald-500/15 text-emerald-300", mark: "✓" },
  REVOKED: { ring: "border-amber-500/50 from-amber-500/[0.10]", chip: "bg-amber-500/15 text-amber-300", mark: "!" },
  EVALUATION: { ring: "border-amber-500/50 from-amber-500/[0.10]", chip: "bg-amber-500/20 text-amber-300", mark: "!" },
  NOT_FOUND: { ring: "border-red-500/40 from-red-500/[0.08]", chip: "bg-red-500/15 text-red-300", mark: "✕" },
  ERROR: { ring: "border-red-500/40 from-red-500/[0.08]", chip: "bg-red-500/15 text-red-300", mark: "✕" },
};

const Fact: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) =>
  children == null || children === "" ? null : (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{k}</div>
      <div className="mt-1 text-[14px] font-medium text-white/90">{children}</div>
    </div>
  );

// Hash a chosen file locally (Web Crypto) and tell the holder whether it is, byte
// for byte, an official artifact of this record. The file never leaves the browser.
const FileCheck: React.FC<{ artifacts: NonNullable<VerifyResult["artifacts"]>; fc: VerifyCopy["fileCheck"] }> = ({ artifacts, fc }) => {
  const [state, setState] = useState<{ kind: "idle" | "hashing" | "match" | "nomatch"; format?: string; name?: string }>({ kind: "idle" });
  const onFile = async (file?: File) => {
    if (!file) return;
    setState({ kind: "hashing", name: file.name });
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const hit = artifacts.find((a) => a.sha256.toLowerCase() === hex);
    setState(hit ? { kind: "match", format: hit.format, name: file.name } : { kind: "nomatch", name: file.name });
  };
  // Split the templated copy around its {placeholders} so the file name / format
  // can be rendered with their own emphasis rather than inlined as plain text.
  const matchParts = fc.match.split(/\{name\}|\{format\}/);
  const nomatchParts = fc.nomatch.split("{name}");
  return (
    <div className="border-t border-white/[0.08] p-6 sm:p-7">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{fc.label}</div>
      <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-white/50">
        {artifacts.length > 1 ? fc.leadPlural : fc.lead}
      </p>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-[13px] font-semibold text-white/80 transition hover:border-white/40">
        {fc.choose}
        <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {state.kind === "hashing" && <div className="mt-3 text-[13px] text-white/40">{fc.hashing.replace("{name}", state.name ?? "")}</div>}
      {state.kind === "match" && (
        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-[13.5px] text-emerald-200">
          <span className="text-lg">✓</span><span>{matchParts[0]}<span className="font-semibold">{state.name}</span>{matchParts[1]}{state.format?.toUpperCase()}{matchParts[2]}</span>
        </div>
      )}
      {state.kind === "nomatch" && (
        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-[13.5px] text-red-200">
          <span className="text-lg">✕</span><span>{nomatchParts[0]}<span className="font-semibold">{state.name}</span>{nomatchParts[1]}</span>
        </div>
      )}
    </div>
  );
};

const Verify: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const nav = useNavigate();
  const m = useMarketing4Copy().verify;
  const f = m.facts;
  const [input, setInput] = useState(recordId ?? "");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (id: string) => {
    setLoading(true); setResult(null);
    try { setResult(await verifyRecord(id)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (recordId) { setInput(recordId); run(recordId); } }, [recordId, run]);

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (input.trim()) nav(`/verify/${encodeURIComponent(input.trim())}`); };
  const v = result;
  const verdictKey = v ? (v.verified ? v.status : (v.status === "ERROR" ? "ERROR" : "NOT_FOUND")) : "NOT_FOUND";
  const style = VERDICT_STYLE[verdictKey] ?? VERDICT_STYLE.NOT_FOUND;
  const verdictCopy = m.verdicts[verdictKey as keyof VerifyCopy["verdicts"]] ?? m.verdicts.NOT_FOUND;
  const verdict = v ? { ...style, ...verdictCopy } : null;

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="officialrecord" alt="A sealed, verifiable official record" />
      <main className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{m.eyebrow}</div>
          <h1 className="mt-3 font-serif text-[2.4rem] font-bold leading-[1.05] tracking-tight">{m.title}</h1>
          <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-white/55">
            {m.lead}
          </p>

          <form onSubmit={submit} className="mt-7 flex flex-wrap gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={m.placeholder}
              className="min-w-[260px] flex-1 rounded-md border border-white/15 bg-white/[0.04] px-4 py-2.5 font-mono text-sm text-white placeholder:text-white/30 focus:border-gold-400/50 focus:outline-none" />
            <button type="submit" className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/85">{m.verifyBtn}</button>
          </form>

          {loading && <div className="mt-8 text-sm text-white/40">{m.verifyingMsg}</div>}

          {v && verdict && (
            <div className={`mt-8 overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent ${verdict.ring}`}>
              <div className="flex items-start gap-4 p-6 sm:p-7">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${verdict.chip}`}>{verdict.mark}</div>
                <div className="min-w-0">
                  <div className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${verdict.chip}`}>{v.verified ? v.status : m.unverifiedChip}</div>
                  <h2 className="mt-2 font-serif text-[1.7rem] font-bold leading-tight">{verdict.title}</h2>
                  <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-white/55">{v.message || verdict.note}</p>
                </div>
              </div>

              {v.verified && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-white/[0.08] p-6 sm:grid-cols-3 sm:p-7">
                  <Fact k={f.institution}>{v.institution}</Fact>
                  <Fact k={v.status === "EVALUATION" ? f.evaluationRecordId : f.officialRecordId}><span className="font-mono text-[13px]">{v.recordId}</span></Fact>
                  <Fact k={f.recordType}>{v.docType?.replace(/_/g, " ")}</Fact>
                  <Fact k={f.title}>{v.titleWithheld ? <span className="text-white/40">{f.titleWithheld}</span> : v.title}</Fact>
                  <Fact k={f.classification}>{v.classification?.level || f.unclassified}</Fact>
                  <Fact k={f.governance}>{v.governanceCompliance ? <span className="text-emerald-300">{v.governanceCompliance}</span> : "—"}</Fact>
                  {v.approvalChain && v.approvalChain.length > 0 && (
                    <div className="col-span-2 sm:col-span-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{f.approvalChain}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px]">
                        {v.approvalChain.map((r, i) => (
                          <React.Fragment key={i}>
                            <span className="rounded bg-white/[0.06] px-2 py-0.5 text-white/80 ring-1 ring-white/10">{r}</span>
                            {i < v.approvalChain!.length - 1 && <span className="text-white/25" aria-hidden>→</span>}
                          </React.Fragment>
                        ))}
                        {v.publicationAuthority && <><span className="text-white/25">·</span><span className="text-white/55">{f.publishedBy} {v.publicationAuthority}</span></>}
                      </div>
                    </div>
                  )}
                  <Fact k={f.certificates}>
                    <span className="flex flex-wrap gap-1.5">
                      {v.hasGovernanceCertificate && <span className="rounded bg-emerald-500/12 px-1.5 py-0.5 text-[11px] text-emerald-300">{f.governanceCert}</span>}
                      {v.hasPreservationCertificate && <span className="rounded bg-emerald-500/12 px-1.5 py-0.5 text-[11px] text-emerald-300">{f.preservationCert}</span>}
                      {!v.hasGovernanceCertificate && !v.hasPreservationCertificate && "—"}
                    </span>
                  </Fact>
                  <Fact k={f.published}>{fmtDate(v.publishedAt)}</Fact>
                  {v.status === "PRESERVED" && <Fact k={f.preserved}>{fmtDate(v.preservedAt)}</Fact>}
                  {v.status === "REVOKED" && <Fact k={f.revoked}>{fmtDate(v.revokedAt)}</Fact>}
                  <div className="col-span-2 sm:col-span-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{f.integrityProof}</div>
                    <div className="mt-1 break-all font-mono text-[12px] text-emerald-200/90">{v.integrityHash || "—"}</div>
                  </div>
                  {v.artifacts && v.artifacts.length > 0 && (
                    <div className="col-span-2 sm:col-span-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{f.artifactHashes}</div>
                      <ul className="mt-1.5 space-y-1">
                        {v.artifacts.map((a) => (
                          <li key={a.format} className="flex flex-wrap items-baseline gap-2 text-[12px]">
                            <span className="w-12 shrink-0 font-semibold uppercase text-white/70">{a.format}</span>
                            <span className="break-all font-mono text-white/45">{a.sha256}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {v.verified && v.artifacts && v.artifacts.length > 0 && <FileCheck artifacts={v.artifacts} fc={m.fileCheck} />}
              <div className="border-t border-white/[0.06] px-6 py-2.5 text-[11px] text-white/35 sm:px-7">{m.verifiedBy}{v.verifiedAt ? ` · ${fmtDate(v.verifiedAt)}` : ""}</div>
            </div>
          )}

          {!v && !loading && (
            <p className="mt-8 text-[13px] text-white/35">{m.idleHint}</p>
          )}
        </div>
      </main>

      {/* How verification works — the five proofs behind every verdict */}
      <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{m.proofsKicker}</div>
          <h2 className="mt-3 max-w-3xl font-serif text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.4rem]">
            {m.proofsTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">
            {m.proofsLead}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {m.proofs.map((p, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[12px] font-bold text-gold-400/70">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-serif text-[1.2rem] font-bold text-white">{p.title}</span>
                </div>
                <div className="mt-3">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-emerald-300/70">{m.provesLabel}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/60">{p.proves}</p>
                </div>
                <div className="mt-3">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-amber-300/60">{m.defendsLabel}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/50">{p.defends}</p>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-gold-400/25 bg-gradient-to-b from-gold-400/[0.05] to-transparent p-6">
              <div className="font-serif text-[1.2rem] font-bold text-gold-200">{m.copyCardTitle}</div>
              <p className="mt-3 text-[13px] leading-relaxed text-white/60">
                {m.copyCardBody}
              </p>
            </div>
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <button onClick={() => nav("/walkthrough")} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">{m.ctaWalkthrough}</button>
            <button onClick={() => nav("/lifecycle")} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">{m.ctaLifecycle}</button>
            <button onClick={() => nav("/official-record")} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">{m.ctaOfficialRecord}</button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Verify;

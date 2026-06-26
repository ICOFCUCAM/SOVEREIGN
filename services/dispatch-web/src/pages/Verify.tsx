import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicHeader, PublicFooter, PageBanner, FilmGrain } from "../components/brand";
import { verifyRecord, type VerifyResult } from "../lib/api";

// PUBLIC VERIFICATION PORTAL — the institutional proof a copied PDF can never
// carry. Anyone holding a copy of an Official Record can confirm, with no account,
// that it is genuine, which institution issued it, and whether it is still current
// or has been revoked. A photocopy of a passport is not a passport; a copy of a
// record still points back to the one verifiable record here.

const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" }) : "—";

const VERDICT: Record<string, { ring: string; chip: string; mark: string; title: string; note: string }> = {
  OFFICIAL: { ring: "border-emerald-500/40 from-emerald-500/[0.10]", chip: "bg-emerald-500/15 text-emerald-300", mark: "✓", title: "Verified — Official Record", note: "This is a genuine, current Official Record issued by the institution named below." },
  PRESERVED: { ring: "border-emerald-500/40 from-emerald-500/[0.10]", chip: "bg-emerald-500/15 text-emerald-300", mark: "✓", title: "Verified — Preserved Record", note: "This record is genuine and has been sealed into permanent preservation." },
  REVOKED: { ring: "border-amber-500/50 from-amber-500/[0.10]", chip: "bg-amber-500/15 text-amber-300", mark: "!", title: "Verified — but REVOKED", note: "This record was genuine but has been withdrawn by the institution. Any copy you hold is no longer the authoritative version." },
  EVALUATION: { ring: "border-amber-500/50 from-amber-500/[0.10]", chip: "bg-amber-500/20 text-amber-300", mark: "!", title: "Not an Official Record — Evaluation only", note: "This identifier belongs to a free evaluation environment. It is NOT an official record and carries no institutional authority. Genuine Official Records use the SD- identifier." },
  NOT_FOUND: { ring: "border-red-500/40 from-red-500/[0.08]", chip: "bg-red-500/15 text-red-300", mark: "✕", title: "Not a verified record", note: "No Official Record resolves to this identifier. Treat the document you hold as unverified." },
  ERROR: { ring: "border-red-500/40 from-red-500/[0.08]", chip: "bg-red-500/15 text-red-300", mark: "✕", title: "Verification unavailable", note: "The verification service could not be reached. Please try again." },
};

// The five institutional proofs a verification result rests on — what each one
// attests, and what it defends against. This is the substance behind the verdict:
// it explains *why* a verified record can be trusted and a copy cannot.
const PROOFS: { n: string; title: string; proves: string; defends: string }[] = [
  { n: "01", title: "Governance Certificate", proves: "That the document cleared its full approval policy — the required offices reviewed and authorized it, in order, with separation of duties enforced.", defends: "Against a document that was never properly approved being passed off as an institutional decision." },
  { n: "02", title: "Publication Authority", proves: "The named institutional authority that released the record as the institution's official position, captured as a distinct, attributable act.", defends: "Against ambiguity over who committed the institution — and against unauthorized publication." },
  { n: "03", title: "Evidence Chain", proves: "An append-only, timestamped trail of every action — submitted, reviewed, approved, authorized, published, certified, preserved.", defends: "Against a quietly edited history. The chain is recorded as the record is made, not reconstructed afterward." },
  { n: "04", title: "Integrity Hash", proves: "A SHA-256 fingerprint of the sealed record and each official artifact. The file you hold can be hashed and matched, byte for byte.", defends: "Against tampering and forgery — if a single byte differs, the hash will not match." },
  { n: "05", title: "Preservation Status", proves: "Whether the record is sealed for its retention horizon, and whether it is still current or has been revoked by the institution.", defends: "Against a superseded or withdrawn version circulating as if it were still authoritative." },
];

const Fact: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) =>
  children == null || children === "" ? null : (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{k}</div>
      <div className="mt-1 text-[14px] font-medium text-white/90">{children}</div>
    </div>
  );

// Hash a chosen file locally (Web Crypto) and tell the holder whether it is, byte
// for byte, an official artifact of this record. The file never leaves the browser.
const FileCheck: React.FC<{ artifacts: NonNullable<VerifyResult["artifacts"]> }> = ({ artifacts }) => {
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
  return (
    <div className="border-t border-white/[0.08] p-6 sm:p-7">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Check your own copy</div>
      <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-white/50">
        Select the file you received. It is hashed in your browser (it never leaves your device) and compared against the official artifact{artifacts.length > 1 ? "s" : ""}. If a single byte differs, it will not match.
      </p>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/20 px-4 py-2 text-[13px] font-semibold text-white/80 transition hover:border-white/40">
        Choose a file to check
        <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {state.kind === "hashing" && <div className="mt-3 text-[13px] text-white/40">Hashing {state.name}…</div>}
      {state.kind === "match" && (
        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-[13.5px] text-emerald-200">
          <span className="text-lg">✓</span><span><span className="font-semibold">{state.name}</span> is an authentic, unaltered official {state.format?.toUpperCase()} of this record.</span>
        </div>
      )}
      {state.kind === "nomatch" && (
        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-[13.5px] text-red-200">
          <span className="text-lg">✕</span><span><span className="font-semibold">{state.name}</span> does NOT match the official artifact. It has been altered, or it is not the file the institution issued.</span>
        </div>
      )}
    </div>
  );
};

const Verify: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const nav = useNavigate();
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
  const verdict = v ? (VERDICT[v.verified ? v.status : (v.status === "ERROR" ? "ERROR" : "NOT_FOUND")] ?? VERDICT.NOT_FOUND) : null;

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="officialrecord" alt="A sealed, verifiable official record" />
      <main className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Verification Portal</div>
          <h1 className="mt-3 font-serif text-[2.4rem] font-bold leading-[1.05] tracking-tight">Verify an Official Record.</h1>
          <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-white/55">
            Anyone holding a document can confirm whether it is a genuine Official Record — which institution issued it, that its governance and preservation certificates are valid, and whether it is still current or has been revoked. No account needed. A copied file cannot provide this; it still points back to the one record verified here.
          </p>

          <form onSubmit={submit} className="mt-7 flex flex-wrap gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Official Record ID — e.g. SD-2026-00004872"
              className="min-w-[260px] flex-1 rounded-md border border-white/15 bg-white/[0.04] px-4 py-2.5 font-mono text-sm text-white placeholder:text-white/30 focus:border-gold-400/50 focus:outline-none" />
            <button type="submit" className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/85">Verify</button>
          </form>

          {loading && <div className="mt-8 text-sm text-white/40">Verifying…</div>}

          {v && verdict && (
            <div className={`mt-8 overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent ${verdict.ring}`}>
              <div className="flex items-start gap-4 p-6 sm:p-7">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${verdict.chip}`}>{verdict.mark}</div>
                <div className="min-w-0">
                  <div className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${verdict.chip}`}>{v.verified ? v.status : "Unverified"}</div>
                  <h2 className="mt-2 font-serif text-[1.7rem] font-bold leading-tight">{verdict.title}</h2>
                  <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-white/55">{v.message || verdict.note}</p>
                </div>
              </div>

              {v.verified && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-white/[0.08] p-6 sm:grid-cols-3 sm:p-7">
                  <Fact k="Issuing institution">{v.institution}</Fact>
                  <Fact k={v.status === "EVALUATION" ? "Evaluation Record ID" : "Official Record ID"}><span className="font-mono text-[13px]">{v.recordId}</span></Fact>
                  <Fact k="Record type">{v.docType?.replace(/_/g, " ")}</Fact>
                  <Fact k="Title">{v.titleWithheld ? <span className="text-white/40">Withheld — classified</span> : v.title}</Fact>
                  <Fact k="Classification">{v.classification?.level || "Unclassified"}</Fact>
                  <Fact k="Governance">{v.governanceCompliance ? <span className="text-emerald-300">{v.governanceCompliance}</span> : "—"}</Fact>
                  {v.approvalChain && v.approvalChain.length > 0 && (
                    <div className="col-span-2 sm:col-span-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Approval chain</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px]">
                        {v.approvalChain.map((r, i) => (
                          <React.Fragment key={i}>
                            <span className="rounded bg-white/[0.06] px-2 py-0.5 text-white/80 ring-1 ring-white/10">{r}</span>
                            {i < v.approvalChain!.length - 1 && <span className="text-white/25" aria-hidden>→</span>}
                          </React.Fragment>
                        ))}
                        {v.publicationAuthority && <><span className="text-white/25">·</span><span className="text-white/55">published by {v.publicationAuthority}</span></>}
                      </div>
                    </div>
                  )}
                  <Fact k="Certificates">
                    <span className="flex flex-wrap gap-1.5">
                      {v.hasGovernanceCertificate && <span className="rounded bg-emerald-500/12 px-1.5 py-0.5 text-[11px] text-emerald-300">Governance</span>}
                      {v.hasPreservationCertificate && <span className="rounded bg-emerald-500/12 px-1.5 py-0.5 text-[11px] text-emerald-300">Preservation</span>}
                      {!v.hasGovernanceCertificate && !v.hasPreservationCertificate && "—"}
                    </span>
                  </Fact>
                  <Fact k="Published">{fmtDate(v.publishedAt)}</Fact>
                  {v.status === "PRESERVED" && <Fact k="Preserved">{fmtDate(v.preservedAt)}</Fact>}
                  {v.status === "REVOKED" && <Fact k="Revoked">{fmtDate(v.revokedAt)}</Fact>}
                  <div className="col-span-2 sm:col-span-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Cryptographic integrity proof (SHA-256)</div>
                    <div className="mt-1 break-all font-mono text-[12px] text-emerald-200/90">{v.integrityHash || "—"}</div>
                  </div>
                  {v.artifacts && v.artifacts.length > 0 && (
                    <div className="col-span-2 sm:col-span-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Official artifact hashes</div>
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
              {v.verified && v.artifacts && v.artifacts.length > 0 && <FileCheck artifacts={v.artifacts} />}
              <div className="border-t border-white/[0.06] px-6 py-2.5 text-[11px] text-white/35 sm:px-7">Verified by Sovereign Dispatch{v.verifiedAt ? ` · ${fmtDate(v.verifiedAt)}` : ""}</div>
            </div>
          )}

          {!v && !loading && (
            <p className="mt-8 text-[13px] text-white/35">Enter the Official Record ID printed on the document (or scan its verification QR) to check authenticity.</p>
          )}
        </div>
      </main>

      {/* How verification works — the five proofs behind every verdict */}
      <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">How an Official Record is authenticated</div>
          <h2 className="mt-3 max-w-3xl font-serif text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.4rem]">
            A verdict you can trust, because it rests on five proofs.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">
            Verification is not a logo or a claim — it is the institution's own evidence, checked live. Every result above
            is built from these five proofs, each attesting something specific and each defending against a specific way a
            document can be faked, altered or misrepresented.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROOFS.map((p) => (
              <div key={p.n} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[12px] font-bold text-gold-400/70">{p.n}</span>
                  <span className="font-serif text-[1.2rem] font-bold text-white">{p.title}</span>
                </div>
                <div className="mt-3">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-emerald-300/70">What it proves</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/60">{p.proves}</p>
                </div>
                <div className="mt-3">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-amber-300/60">What it defends against</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/50">{p.defends}</p>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-gold-400/25 bg-gradient-to-b from-gold-400/[0.05] to-transparent p-6">
              <div className="font-serif text-[1.2rem] font-bold text-gold-200">Why a copy can never do this</div>
              <p className="mt-3 text-[13px] leading-relaxed text-white/60">
                A copied PDF can be edited, renamed or forged, and it carries none of these proofs with it. It can only
                <span className="text-white/85"> point back</span> to the one authoritative record — which is exactly what
                verification confirms. The proof lives with the institution, not in the file.
              </p>
            </div>
          </div>
          <div className="mt-9 flex flex-wrap gap-3">
            <button onClick={() => nav("/walkthrough")} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">See a record become official</button>
            <button onClick={() => nav("/lifecycle")} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">The governed lifecycle</button>
            <button onClick={() => nav("/official-record")} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">What is an Official Record?</button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Verify;

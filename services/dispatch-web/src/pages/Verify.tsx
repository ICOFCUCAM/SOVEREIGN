import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicHeader, PublicFooter, FilmGrain } from "../components/brand";
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
  NOT_FOUND: { ring: "border-red-500/40 from-red-500/[0.08]", chip: "bg-red-500/15 text-red-300", mark: "✕", title: "Not a verified record", note: "No Official Record resolves to this identifier. Treat the document you hold as unverified." },
  ERROR: { ring: "border-red-500/40 from-red-500/[0.08]", chip: "bg-red-500/15 text-red-300", mark: "✕", title: "Verification unavailable", note: "The verification service could not be reached. Please try again." },
};

const Fact: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) =>
  children == null || children === "" ? null : (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{k}</div>
      <div className="mt-1 text-[14px] font-medium text-white/90">{children}</div>
    </div>
  );

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
      <main className="px-6 py-20 lg:px-12">
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
                  <Fact k="Official Record ID"><span className="font-mono text-[13px]">{v.recordId}</span></Fact>
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
                </div>
              )}
              <div className="border-t border-white/[0.06] px-6 py-2.5 text-[11px] text-white/35 sm:px-7">Verified by Sovereign Dispatch{v.verifiedAt ? ` · ${fmtDate(v.verifiedAt)}` : ""}</div>
            </div>
          )}

          {!v && !loading && (
            <p className="mt-8 text-[13px] text-white/35">Enter the Official Record ID printed on the document (or scan its verification QR) to check authenticity.</p>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Verify;

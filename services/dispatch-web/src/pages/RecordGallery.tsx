import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionHead, Chevron, PublicHeader, PageBanner, PublicFooter, FilmGrain, useReveal } from "../components/brand";
import { useMarketing7Copy } from "../lib/messages";

// Record Gallery — the product made tangible. Specimens of the four artifacts an
// institution actually holds after using Sovereign Dispatch. These are honest
// depictions of the real artifact types the platform produces (a redacted
// reference record), not marketing renders.
const Field: React.FC<{ k: string; v: string; mono?: boolean }> = ({ k, v, mono }) => (
  <div className="flex justify-between gap-4 border-b border-black/5 py-1.5 last:border-0"><span className="text-[11px] uppercase tracking-wide text-black/40">{k}</span><span className={`text-right text-[12px] font-medium text-black/80 ${mono ? "font-mono" : ""}`}>{v}</span></div>
);
const Specimen: React.FC<{ title: string; accent: string; specimen: string; children: React.ReactNode }> = ({ title, accent, specimen, children }) => (
  <div className="reveal overflow-hidden rounded-xl bg-[#f7f6f2] text-black shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)] ring-1 ring-black/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)]">
    <div className="flex items-center justify-between px-5 py-3" style={{ background: accent }}>
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">{title}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{specimen}</span>
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

const RecordGallery: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  const c = useMarketing7Copy().gallery;
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="default" alt="" />
      <main>
        <section className="border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">{c.eyebrow}</span></div>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.05] tracking-tight text-[#f4efe3] sm:text-5xl">{c.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">{c.lead}</p>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-8 py-20 lg:px-12">
          <SectionHead index="01" kicker={c.kicker} title={c.sectionTitle} sub={c.sectionSub} />
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
            <Specimen title={c.officialTitle} accent="#163a6e" specimen={c.specimen}>
              <div className="text-[15px] font-bold text-black/85">{c.docTitle}</div>
              <div className="mt-0.5 text-[11px] text-black/50">{c.docSub}</div>
              <div className="mt-3">
                <Field k={c.fRecordNo} v="SD-2026-758458" mono />
                <Field k={c.fClassification} v="OFFICIAL" />
                <Field k={c.fLifecycle} v={c.vLifecycle} />
                <Field k={c.fVersion} v="v1" />
              </div>
            </Specimen>

            <Specimen title={c.govTitle} accent="#1f4b8e" specimen={c.specimen}>
              <div className="flex items-center justify-between"><div className="text-[13px] font-bold text-black/85">{c.govPolicy} <span className="font-mono text-[10px] text-black/40">v1</span></div><span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{c.compliant}</span></div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="rounded bg-black/[0.06] px-2 py-0.5 text-black/70">{c.chain[0]}</span><Chevron className="h-3 w-3 text-black/30" /><span className="rounded bg-black/[0.06] px-2 py-0.5 text-black/70">{c.chain[1]}</span><span className="text-black/30">⇒</span><span className="rounded bg-emerald-600/10 px-2 py-0.5 text-emerald-700">{c.chain[2]}</span>
              </div>
              <div className="mt-3"><Field k={c.fApprovals} v={c.vApprovals} /><Field k={c.fSod} v={c.vSod} /><Field k={c.fIntegrity} v="3f9b…a41c" mono /></div>
            </Specimen>

            <Specimen title={c.presTitle} accent="#2f7a4f" specimen={c.specimen}>
              <div className="text-[13px] font-bold text-black/85">{c.presHead}</div>
              <div className="mt-3"><Field k={c.fRecordHash} v="ea79…41c7" mono /><Field k={c.fIntegrity} v="2aac…748c" mono /><Field k={c.fPublished} v="2026-06-24" /><Field k={c.fArchived} v="2026-06-24" /></div>
              <div className="mt-2 text-[10px] text-black/40">{c.presNote}</div>
            </Specimen>

            <Specimen title={c.auditTitle} accent="#5a4a1f" specimen={c.specimen}>
              <div className="text-[13px] font-bold text-black/85">{c.auditHead}</div>
              <div className="mt-3 space-y-1.5 font-mono text-[11px] text-black/65">
                <div>document.submitted · author</div>
                <div>approval.approve · director</div>
                <div>approval.approve · secretary_general</div>
                <div>governance.policy_satisfied · system</div>
                <div>document.published · communications_office</div>
                <div>document.preserved · system</div>
              </div>
            </Specimen>
          </div>
          <p className="mx-auto mt-8 max-w-5xl text-center text-[12px] text-white/35">{c.footnote}</p>
        </section>

        <section className="border-t border-white/[0.06] px-8 py-16 lg:px-12">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
            <div className="text-xl font-semibold text-white/80">{c.closing}</div>
            <button onClick={() => nav("/standard")} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-black transition hover:bg-gold-300">{c.cta} <Chevron className="h-3.5 w-3.5" /></button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default RecordGallery;

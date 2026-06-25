import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionHead, Chevron, PublicHeader, PublicFooter, FilmGrain, useReveal } from "../components/brand";

// Record Gallery — the product made tangible. Specimens of the four artifacts an
// institution actually holds after using Sovereign Dispatch. These are honest
// depictions of the real artifact types the platform produces (a redacted
// reference record), not marketing renders.
const Field: React.FC<{ k: string; v: string; mono?: boolean }> = ({ k, v, mono }) => (
  <div className="flex justify-between gap-4 border-b border-black/5 py-1.5 last:border-0"><span className="text-[11px] uppercase tracking-wide text-black/40">{k}</span><span className={`text-right text-[12px] font-medium text-black/80 ${mono ? "font-mono" : ""}`}>{v}</span></div>
);
const Specimen: React.FC<{ title: string; accent: string; children: React.ReactNode }> = ({ title, accent, children }) => (
  <div className="reveal overflow-hidden rounded-xl bg-[#f7f6f2] text-black shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)] ring-1 ring-black/10">
    <div className="flex items-center justify-between px-5 py-3" style={{ background: accent }}>
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">{title}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-white/70">Specimen</span>
    </div>
    <div className="px-5 py-4">{children}</div>
  </div>
);

const RecordGallery: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <main>
        <section className="border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">The artifacts</div>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">What an institution actually holds.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">After a record passes through Sovereign Dispatch, the institution holds four things — not a file, but proof. These are the real artifact types the platform produces.</p>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-8 py-20 lg:px-12">
          <SectionHead index="01" kicker="Gallery" title="Four artifacts, one record." sub="An official record and the three proofs that travel with it." />
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
            <Specimen title="Official Record" accent="#163a6e">
              <div className="text-[15px] font-bold text-black/85">Q3 Fiscal Position — Ministerial Briefing</div>
              <div className="mt-0.5 text-[11px] text-black/50">Ministerial Report</div>
              <div className="mt-3">
                <Field k="Record №" v="SD-2026-758458" mono />
                <Field k="Classification" v="OFFICIAL" />
                <Field k="Lifecycle" v="Published · Preserved" />
                <Field k="Version" v="v1" />
              </div>
            </Specimen>

            <Specimen title="Governance Certificate" accent="#1f4b8e">
              <div className="flex items-center justify-between"><div className="text-[13px] font-bold text-black/85">Ministerial Briefing Policy <span className="font-mono text-[10px] text-black/40">v1</span></div><span className="rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700">COMPLIANT</span></div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="rounded bg-black/[0.06] px-2 py-0.5 text-black/70">Director</span><Chevron className="h-3 w-3 text-black/30" /><span className="rounded bg-black/[0.06] px-2 py-0.5 text-black/70">Secretary General</span><span className="text-black/30">⇒</span><span className="rounded bg-emerald-600/10 px-2 py-0.5 text-emerald-700">Communications Office</span>
              </div>
              <div className="mt-3"><Field k="Approvals" v="2 / 2 in order" /><Field k="Sep. of duties" v="Enforced" /><Field k="Integrity proof" v="3f9b…a41c" mono /></div>
            </Specimen>

            <Specimen title="Preservation Certificate" accent="#2f7a4f">
              <div className="text-[13px] font-bold text-black/85">Sealed institutional artifact</div>
              <div className="mt-3"><Field k="Record hash" v="ea79…41c7" mono /><Field k="Integrity proof" v="2aac…748c" mono /><Field k="Published" v="2026-06-24" /><Field k="Archived" v="2026-06-24" /></div>
              <div className="mt-2 text-[10px] text-black/40">Terminal &amp; immutable — no edit, withdrawal or republication.</div>
            </Specimen>

            <Specimen title="Audit Evidence" accent="#5a4a1f">
              <div className="text-[13px] font-bold text-black/85">Append-only event trail</div>
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
          <p className="mx-auto mt-8 max-w-5xl text-center text-[12px] text-white/35">Specimen values from a reference record. Your institution's records carry the same four artifacts — generated automatically, owned entirely by you.</p>
        </section>

        <section className="border-t border-white/[0.06] px-8 py-16 lg:px-12">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
            <div className="text-xl font-semibold text-white/80">A record is no longer a file. It is proof.</div>
            <button onClick={() => nav("/standard")} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-black transition hover:bg-gold-300">The Dispatch Standard <Chevron className="h-3.5 w-3.5" /></button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default RecordGallery;

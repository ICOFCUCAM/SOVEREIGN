import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, FilmGrain, SectionHead, useReveal } from "../components/brand";
import { useMarketing3Copy } from "../lib/messages";

// "What is an Official Record?" — the page that makes Dispatch's core distinction
// unmissable: an Official Record is not a file, it is the institution's
// authoritative, governed, certified, tamper-evident, permanently verifiable
// version of a decision. A PDF can be copied; the institutional proof cannot.

const OfficialRecord: React.FC = () => {
  useReveal();
  const nav = useNavigate();
  const c = useMarketing3Copy().officialRecord;
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="officialrecord" alt="A sealed official record" />
      <main>
        {/* ── Definition ── */}
        <section className="border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{c.eyebrow}</span></div>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.5rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">{c.title}</h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/65">{c.lead}</p>
            <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-white/45">{c.leadSub}</p>
          </div>
        </section>

        {/* ── Ordinary vs Official ── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-8 py-20 lg:px-12">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{c.ordinaryLabel}</div>
              <ul className="mt-5 space-y-3">
                {c.ordinary.map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[15px] text-white/55">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.06] text-[11px] text-white/40">○</span>{t}
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-[12.5px] text-white/35">{c.ordinaryNote}</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-7 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">{c.officialLabel}</div>
              <ul className="mt-5 space-y-3">
                {c.official.map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[15px] text-white/85">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] text-emerald-300">✓</span>{t}
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-[12.5px] text-emerald-200/50">{c.officialNote}</div>
            </div>
          </div>
        </section>

        {/* ── Authority belongs to the office ── */}
        <section className="border-t border-white/[0.06] px-8 py-20 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <SectionHead index="01" kicker={c.authKicker} title={c.authTitle} sub={c.authSub} />
          </div>
        </section>

        {/* ── Trust matrix ── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-8 py-20 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <SectionHead index="02" kicker={c.matrixKicker} title={c.matrixTitle} />
            <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 border-b border-white/10 bg-white/[0.03] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-white/45">
                <span>{c.capabilityLabel}</span><span className="w-20 text-center">{c.ordinaryCol}</span><span className="w-20 text-center">{c.officialCol}</span>
              </div>
              {c.matrix.map((cap, i) => (
                <div key={cap} className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-6 px-5 py-2.5 text-[13.5px] transition-colors hover:bg-white/[0.03] ${i % 2 ? "bg-white/[0.015]" : ""}`}>
                  <span className="text-white/80">{cap}</span>
                  <span className="w-20 text-center text-red-400/60">✕</span>
                  <span className="w-20 text-center text-emerald-300">✓</span>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button onClick={() => nav("/verify")} className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/85">{c.ctaVerify}</button>
              <button onClick={() => nav("/developers")} className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/40">{c.ctaDevelopers}</button>
              <button onClick={() => nav("/console")} className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/40">{c.ctaLaunch}</button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default OfficialRecord;

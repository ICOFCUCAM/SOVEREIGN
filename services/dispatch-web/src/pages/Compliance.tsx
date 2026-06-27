import React from "react";
import { SectionHead, PublicHeader, PageBanner, PublicFooter, TrustStrip, FilmGrain, useReveal, SURFACE } from "../components/brand";
import { useMarketing2Copy } from "../lib/messages";

// Compliance — the governance-framework alignment relocated from the homepage.
const Compliance: React.FC = () => {
  const c = useMarketing2Copy().compliance;
  useReveal();
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="compliance" alt="An institutional records archive" />
      <main>
        {/* ── Compliance & Security ──────────────────────────────────── */}
        <section id="compliance" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead kicker={c.kicker} title={c.title} sub={c.sub} />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.items.map((x) => (
              <div key={x.name} className={`${SURFACE} p-6`}>
                <div className="text-base font-bold text-[#f4efe3]">{x.name}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">{x.body}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-[12px] leading-relaxed text-white/45">{c.disclaimer}</p>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
            <a href="/procurement" className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white">{c.ctaProcurement}</a>
            <a href="/evidence" className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white">{c.ctaEvidence}</a>
            <a href="/trust" className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white">{c.ctaTrust}</a>
          </div>
        </section>
      </main>
      <TrustStrip />
      <PublicFooter />
    </div>
  );
};

export default Compliance;

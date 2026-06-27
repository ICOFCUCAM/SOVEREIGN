import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionHead, Chevron, PublicHeader, PageBanner, PublicFooter, FilmGrain, useReveal } from "../components/brand";
import { useMarketingCopy } from "../lib/messages";

// The Dispatch Standard — the most strategic asset in a category. When a category
// emerges, the standard matters more than the features. This defines the canonical
// institutional concepts Sovereign Dispatch establishes, so an institution adopts
// a STANDARD for official records, not merely software.
const Standard: React.FC = () => {
  const nav = useNavigate();
  const c = useMarketingCopy().standard;
  const DEFS = c.defs;
  useReveal();
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
          <SectionHead index="①" kicker={c.sectionKicker} title={c.sectionTitle} sub={c.sectionSub} />
          <div className="mx-auto mt-14 max-w-5xl space-y-5">
            {DEFS.map((d, i) => (
              <div key={d.term} className="reveal rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/25 sm:p-8">
                <div className="flex items-baseline gap-3">
                  <span className="text-[12px] font-mono text-gold-400/70">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-xl font-semibold tracking-tight text-white">{d.term}</h3>
                </div>
                <div className="mt-1 pl-8 text-[13.5px] font-medium text-gold-300/80">{d.one}</div>
                <p className="mt-3 max-w-3xl pl-8 text-[14px] leading-relaxed text-white/60">{d.def}</p>
                <div className="mt-4 flex flex-wrap gap-2 pl-8">{d.props.map((p) => <span key={p} className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-[12px] text-white/65">{p}</span>)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-20 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-[#f4efe3] sm:text-4xl">{c.closeTitleA}<br /><span className="text-white/50">{c.closeTitleB}</span></h2>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/55">{c.closeBody}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav("/records")} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-black transition hover:bg-gold-300">{c.ctaArtifacts} <Chevron className="h-3.5 w-3.5" /></button>
              <button onClick={() => nav("/journey")} className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/70 transition hover:text-white">{c.ctaPath} <Chevron className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Standard;

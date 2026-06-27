import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionHead, Card, Chevron, PublicHeader, PageBanner, PublicFooter, TrustStrip, FilmGrain, useReveal } from "../components/brand";
import { PROCUREMENT_ROUTE, EVIDENCE_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";
import { useMarketingCopy } from "../lib/messages";

// Trust — the public adoption-confidence page. The console's Trust Center, made
// reachable to the people who actually decide whether to adopt: procurement,
// CIOs and risk officers, without an account. It answers the fears that stop
// institutions committing — ownership, exit, accountability — in verifiable
// language. No certifications, SLAs or guarantees are asserted.
const Trust: React.FC = () => {
  const nav = useNavigate();
  const c = useMarketingCopy().trust;
  useReveal();
  React.useEffect(() => track("page.trust"), []);
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="trust" alt="An institutional seal press" />
      <main>
        {/* hero */}
        <section className="border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">{c.eyebrow}</span></div>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.05] tracking-tight text-[#f4efe3] sm:text-5xl">{c.titleA}<br /><span className="text-white/50">{c.titleB}</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">{c.lead}</p>
          </div>
        </section>

        {/* ownership */}
        <section className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="01" kicker={c.ownership.kicker} title={c.ownership.title} sub={c.ownership.sub} />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.ownership.cards.map((x) => <Card key={x.title} title={x.title} body={x.body} />)}
          </div>
        </section>

        {/* continuity & exit */}
        <section className="scroll-mt-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-24 lg:px-12">
          <SectionHead index="02" kicker={c.continuity.kicker} title={c.continuity.title} sub={c.continuity.sub} />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.continuity.cards.map((x) => <Card key={x.title} title={x.title} body={x.body} />)}
          </div>
        </section>

        {/* shared responsibility */}
        <section className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="03" kicker={c.accountability.kicker} title={c.accountability.title} sub={c.accountability.sub} />
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-400">{c.accountability.securesLabel}</div>
              <ul className="mt-4 space-y-2.5 text-[14px] text-white/70">
                {c.accountability.secures.map((x) => <li key={x} className="flex gap-2.5"><Chevron className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-400" />{x}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/50">{c.accountability.controlsLabel}</div>
              <ul className="mt-4 space-y-2.5 text-[14px] text-white/70">
                {c.accountability.controls.map((x) => <li key={x} className="flex gap-2.5"><Chevron className="mt-1 h-3.5 w-3.5 shrink-0 text-white/40" />{x}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* provable, not promised */}
        <section className="scroll-mt-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-24 lg:px-12">
          <SectionHead index="04" kicker={c.evidence.kicker} title={c.evidence.title} sub={c.evidence.sub} />
          <div className="mx-auto mt-14 max-w-5xl"><TrustStrip /></div>
          <div className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center gap-4">
            <button onClick={() => nav(PROCUREMENT_ROUTE)} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-black transition hover:bg-gold-300">{c.evidence.ctaProcurement} <Chevron className="h-3.5 w-3.5" /></button>
            <button onClick={() => nav(EVIDENCE_ROUTE)} className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/70 transition hover:text-white">{c.evidence.ctaEvidence} <Chevron className="h-3.5 w-3.5" /></button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Trust;

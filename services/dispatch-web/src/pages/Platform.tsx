import React from "react";
import { SectionHead, Card, Dot, PublicHeader, PageBanner, PublicFooter, TrustStrip, FilmGrain, useReveal, SURFACE } from "../components/brand";
import { useMarketingCopy } from "../lib/messages";

// Platform — the product story relocated from the homepage: what Dispatch is
// (Overview), what it does (Capabilities), the lifecycle (Workflow), and how
// other systems build on it (Integrations).
const Platform: React.FC = () => {
  const c = useMarketingCopy().platform;
  useReveal();
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="default" alt="" />
      <main>
        {/* ── Overview ───────────────────────────────────────────────── */}
        <section id="overview" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="01" kicker={c.overview.kicker} title={c.overview.title} sub={c.overview.sub} />
          <div className="mx-auto mt-14 grid stagger max-w-5xl gap-5 sm:grid-cols-3">
            {c.overview.cards.map((x) => <Card key={x.title} title={x.title} body={x.body} />)}
          </div>
        </section>

        {/* ── Capabilities ───────────────────────────────────────────── */}
        <section id="capabilities" className="scroll-mt-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-24 lg:px-12">
          <SectionHead index="02" kicker={c.capabilities.kicker} title={c.capabilities.title} sub={c.capabilities.sub} />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.capabilities.cards.map((x) => <Card key={x.title} title={x.title} body={x.body} />)}
          </div>
        </section>

        {/* ── Workflow ───────────────────────────────────────────────── */}
        <section id="workflow" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="03" kicker={c.workflow.kicker} title={c.workflow.title} sub={c.workflow.sub} />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {c.workflow.steps.map((s, i) => (
              <div key={s.t} className={`${SURFACE} p-5`}>
                <div className="font-mono text-[12px] font-bold text-gold-400">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-sm font-bold text-[#f4efe3]">{s.t}</div>
                <div className="mt-1 text-[12px] leading-snug text-white/55">{s.b}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Integrations ───────────────────────────────────────────── */}
        <section id="integrations" className="scroll-mt-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-24 lg:px-12">
          <SectionHead index="04" kicker={c.integrations.kicker} title={c.integrations.title} sub={c.integrations.sub} />
          <div className="mx-auto mt-14 grid stagger max-w-5xl gap-5 lg:grid-cols-2">
            <div className={`${SURFACE} p-7`}>
              <div className="text-base font-bold text-[#f4efe3]">{c.integrations.apiTitle}</div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{c.integrations.apiBody}</p>
              <div className="mt-5 rounded-md border border-white/10 bg-black/40 p-4 font-mono text-[12px] leading-relaxed text-white/70">
                POST /v1/token        → client-credentials → JWT<br />
                POST /v1/documents    → submit (Idempotency-Key)<br />
                POST /v1/.../approve  → governance decision<br />
                GET&nbsp;&nbsp;/v1/artifacts/:id → signed download
              </div>
            </div>
            <div className={`${SURFACE} p-7`}>
              <div className="text-base font-bold text-[#f4efe3]">{c.integrations.estateTitle}</div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{c.integrations.estateBody}</p>
              <ul className="mt-5 space-y-2.5 text-[13.5px] text-white/70">
                {c.integrations.estateItems.map((x) => <li key={x} className="flex items-center gap-2"><Dot /> {x}</li>)}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <TrustStrip />
      <PublicFooter />
    </div>
  );
};

export default Platform;

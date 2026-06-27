import React from "react";
import { SectionHead, Card, Chevron, PublicHeader, PageBanner, PublicFooter, TrustStrip, FilmGrain, useReveal, SURFACE } from "../components/brand";
import { CapabilitiesDashboard } from "../components/operations";
import { DeploymentMatrix } from "../components/DeploymentMatrix";
import { useMarketing2Copy } from "../lib/messages";

// Security — the trust story relocated from the homepage: the security posture,
// the sovereignty capability dashboard, and the deployment & architecture model.
const Security: React.FC = () => {
  const c = useMarketing2Copy().security;
  useReveal();
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="security" alt="A secure institutional vault" />
      <main>
        {/* ── Security ───────────────────────────────────────────────── */}
        <section id="security" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="01" kicker={c.secKicker} title={c.secTitle} sub={c.secSub} />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.cards.map((x) => <Card key={x.title} title={x.title} body={x.body} />)}
          </div>
        </section>

        {/* ── Sovereignty dashboard ──────────────────────────────────── */}
        <section id="sovereignty" className="scroll-mt-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-24 lg:px-12">
          <SectionHead index="02" kicker={c.sovKicker} title={c.sovTitle} sub={c.sovSub} />
          <div className="mx-auto mt-14 max-w-5xl">
            <CapabilitiesDashboard />
          </div>
        </section>

        {/* ── Deployment & Architecture ──────────────────────────────── */}
        <section id="deployment" className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="03" kicker={c.depKicker} title={c.depTitle} sub={c.depSub} />
          <div className="mx-auto mt-14 grid stagger max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {c.models.map((m) => (
              <div key={m.t} className={`flex flex-col ${SURFACE} p-5`}>
                <div className="text-[15px] font-bold text-[#f4efe3]">{m.t}</div>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-white/55">{m.b}</p>
                {m.note && <p className="mt-3 text-[11px] italic leading-snug text-white/45">{m.note}</p>}
              </div>
            ))}
          </div>

          {/* system flow */}
          <div className="mx-auto mt-16 max-w-sm">
            <p className="mb-6 text-center text-[12px] font-semibold uppercase tracking-[0.25em] text-white/50">{c.systemFlowLabel}</p>
            <div className="flex flex-col items-stretch">
              {c.systemFlow.map((n, i, a) => (
                <React.Fragment key={n}>
                  <div className={`rounded-md border px-5 py-3 text-center text-sm font-semibold ${i === 0 ? "border-gold-500/30 bg-gold-500/[0.06] text-white" : "border-white/10 bg-white/[0.03] text-white/85"}`}>{n}</div>
                  {i < a.length - 1 && <div className="flex justify-center py-1.5"><Chevron className="h-4 w-4 rotate-90 text-gold-400/60" /></div>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* capability-by-deployment matrix */}
          <div className="mx-auto mt-16 max-w-4xl">
            <p className="mb-5 text-center text-[12px] font-semibold uppercase tracking-[0.25em] text-white/50">{c.matrixLabel}</p>
            <DeploymentMatrix />
          </div>
        </section>
      </main>
      <TrustStrip />
      <PublicFooter />
    </div>
  );
};

export default Security;

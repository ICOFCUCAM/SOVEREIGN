import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, FilmGrain, Chevron, useReveal, SURFACE } from "../components/brand";
import { LIFECYCLE_ROUTE, ROI_ROUTE, WALKTHROUGH_ROUTE, PROCUREMENT_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";
import { useMarketing4Copy } from "../lib/messages";

// Phase 1 of the Institutional Value & Procurement Experience — the page that
// explains the PROBLEM before any value is calculated. All copy is localized via
// lib/messages/marketing4.ts.
const CostOfPublication: React.FC = () => {
  const nav = useNavigate();
  const c = useMarketing4Copy().cost;
  const PROCESS = c.process, UNIFIED = c.unified, HIDDEN = c.hidden;
  useReveal();
  React.useEffect(() => track("page.cost-of-publication"), []);
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="procurement" alt="Institutional review in session" />
      <main>
        {/* hero — the question */}
        <section className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1000px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">{c.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.5rem] font-bold leading-[1.06] tracking-tight text-[#f4efe3] sm:text-[3.2rem]">{c.title}</h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/60">{c.lead}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button onClick={() => nav(LIFECYCLE_ROUTE)}
                className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-8px_rgba(0,0,0,0.55)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                {c.ctaGoverns} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => nav(ROI_ROUTE)}
                className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                {c.ctaModel}
              </button>
            </div>
          </div>
        </section>

        {/* the fragmented process — ten stages, ten hand-offs */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1000px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">{c.processKicker}</div>
            <h2 className="mt-3 max-w-3xl font-serif text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.5rem]">
              {c.processTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">
              {c.processLead}
            </p>
            <ol className="mt-12 space-y-0">
              {PROCESS.map((p, i) => (
                <li key={p.stage} className="relative flex gap-5 border-l border-white/10 pb-7 pl-7 last:pb-0">
                  <span className="absolute -left-[11px] top-0 flex h-[22px] w-[22px] items-center justify-center rounded-full border border-white/15 bg-[#0c0c0c] font-mono text-[10px] font-bold text-gold-400/80">{i + 1}</span>
                  <div className="grid w-full gap-1 sm:grid-cols-[200px_1fr] sm:gap-6">
                    <div>
                      <div className="text-[15px] font-bold text-white">{p.stage}</div>
                      <div className="text-[12px] uppercase tracking-wide text-white/40">{p.who}</div>
                    </div>
                    <p className="text-[14px] leading-relaxed text-white/55">{p.cost}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-10 max-w-2xl border-l-2 border-gold-400/40 pl-5 font-serif text-[1.35rem] leading-snug text-white/80">
              {c.processClose}
            </p>
          </div>
        </section>

        {/* the hidden costs */}
        <section className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{c.hiddenKicker}</div>
            <h2 className="mt-3 max-w-3xl font-serif text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.5rem]">
              {c.hiddenTitle}
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HIDDEN.map((h) => (
                <div key={h.label} className={`${SURFACE} p-6`}>
                  <div className="text-[15px] font-bold text-white">{h.label}</div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{h.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* the contrast — Dispatch collapses the chain into five services */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{c.unifiedKicker}</div>
              <h2 className="mx-auto mt-3 max-w-3xl font-serif text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.5rem]">
                {c.unifiedTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">
                {c.unifiedLead}
              </p>
            </div>

            {/* before → after */}
            <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div className="rounded-2xl border border-white/10 bg-white/[0.015] p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{c.todayLabel}</div>
                <div className="mt-4 space-y-1.5">
                  {PROCESS.map((p) => (
                    <div key={p.stage} className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-[13px] text-white/55">{p.stage}</div>
                  ))}
                </div>
                <div className="mt-4 text-[12px] text-white/35">{c.todayFootnote}</div>
              </div>

              <div className="hidden lg:flex lg:flex-col lg:items-center lg:px-2">
                <Chevron className="h-7 w-7 text-gold-400/60" />
              </div>

              <div className="rounded-2xl border border-gold-400/25 bg-gradient-to-b from-gold-400/[0.05] to-transparent p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400/80">{c.withLabel}</div>
                <div className="mt-4 space-y-3">
                  {UNIFIED.map((u, i) => (
                    <div key={u.title} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] text-gold-400/70">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-[14.5px] font-bold text-white">{u.title}</span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{u.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-[12px] text-gold-300/70">{c.withFootnote}</div>
              </div>
            </div>
          </div>
        </section>

        {/* close — onward to the lifecycle / ROI / procurement */}
        <section className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-[2rem] font-bold leading-tight text-white sm:text-[2.4rem]">{c.closeTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
              {c.closeLead}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(LIFECYCLE_ROUTE)} className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                {c.ctaLifecycle} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => nav(ROI_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                {c.ctaRoi}
              </button>
              <button onClick={() => nav(WALKTHROUGH_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                {c.ctaWalkthrough}
              </button>
              <button onClick={() => nav(PROCUREMENT_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                {c.ctaProcurement}
              </button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default CostOfPublication;

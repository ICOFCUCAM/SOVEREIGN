import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chevron, PublicHeader, PageBanner, PublicFooter, FilmGrain, useReveal } from "../components/brand";
import { TRUST_ROUTE, PROCUREMENT_ROUTE } from "../lib/routes";
import { useMarketing7Copy } from "../lib/messages";

// Institution Readiness Journey — an adoption accelerator. An evaluator names
// their institution and immediately receives a tailored starting point:
// deployment, governance, and policy recommendations, and where to go next.
// Editorial guidance grounded in the platform's real capabilities — a sales
// engineer's first conversation, on demand. Copy lives in the marketing7
// catalog; only the profile keys stay here.
const PROFILE_KEYS = ["gov", "uni", "hosp", "reg", "ent"];

const ReadinessJourney: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  const c = useMarketing7Copy().journey;
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const sel = selIdx === null ? null : c.profiles[selIdx];

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
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

        <section className="border-t border-white/[0.06] px-8 py-16 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {c.profiles.map((p, i) => (
                <button key={PROFILE_KEYS[i]} onClick={() => setSelIdx(i)}
                  className={`rounded-xl border p-5 text-left transition ${selIdx === i ? "border-gold-400/60 bg-gold-400/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/30"}`}>
                  <div className="text-[14px] font-bold text-white">{p.name}</div>
                  <div className="mt-1 text-[11.5px] leading-snug text-white/45">{p.lede}</div>
                </button>
              ))}
            </div>

            {sel && (
              <div className="mt-8 rounded-2xl border border-gold-400/20 bg-gradient-to-b from-white/[0.03] to-transparent p-7 sm:p-9">
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-400">{c.recommended} · {sel.name}</div>
                <div className="mt-5 grid gap-6 sm:grid-cols-3">
                  {[[c.labels.deployment, sel.deployment], [c.labels.governance, sel.governance], [c.labels.policy, sel.policy]].map(([k, v]) => (
                    <div key={k}><div className="text-[11px] uppercase tracking-wide text-white/40">{k}</div><div className="mt-1 text-[14px] leading-relaxed text-white/80">{v}</div></div>
                  ))}
                </div>
                <div className="mt-6">
                  <div className="text-[11px] uppercase tracking-wide text-white/40">{c.labels.records}</div>
                  <div className="mt-2 flex flex-wrap gap-2">{sel.records.map((r) => <span key={r} className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-[12.5px] text-white/70">{r}</span>)}</div>
                </div>
                <div className="mt-7 flex flex-wrap gap-3 border-t border-white/10 pt-6">
                  <button onClick={() => nav(PROCUREMENT_ROUTE)} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-black transition hover:bg-gold-300">{c.ctaPackage} <Chevron className="h-3.5 w-3.5" /></button>
                  <button onClick={() => nav(TRUST_ROUTE)} className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/70 transition hover:text-white">{c.ctaTrust} <Chevron className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )}
            {!sel && <p className="mt-8 text-center text-[13px] text-white/35">{c.selectHint}</p>}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default ReadinessJourney;

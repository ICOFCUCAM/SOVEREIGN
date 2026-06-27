import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { WALKTHROUGH_ROUTE, VERIFY_ROUTE, COST_ROUTE, ROI_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";
import { useMarketing6Copy } from "../lib/messages";

// Phase 2 of the Institutional Value & Procurement Experience — the interactive
// lifecycle. Eight governed stages; clicking one reveals exactly who participates,
// what governs the stage, what it produces and what evidence it leaves behind.
// This is the page that lets a procurement team understand precisely what they
// are buying — not a demo (that is /walkthrough), but a reference. All copy is
// localized via lib/messages/marketing6.ts; the stage key + number stay here.

const STAGE_META = [
  { key: "create", n: "01" },
  { key: "review", n: "02" },
  { key: "approve", n: "03" },
  { key: "authorize", n: "04" },
  { key: "publish", n: "05" },
  { key: "certify", n: "06" },
  { key: "verify", n: "07" },
  { key: "preserve", n: "08" },
];

const Facet: React.FC<{ label: string; tone: "participants" | "governance" | "outputs" | "evidence"; items: string[] }> = ({ label, tone, items }) => {
  const ring = {
    participants: "border-white/10",
    governance: "border-gold-400/25",
    outputs: "border-sky-500/25",
    evidence: "border-emerald-500/25",
  }[tone];
  const dot = {
    participants: "bg-white/40",
    governance: "bg-gold-400/70",
    outputs: "bg-sky-400/70",
    evidence: "bg-emerald-400/70",
  }[tone];
  return (
    <div className={`rounded-xl border ${ring} bg-white/[0.02] p-5`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</div>
      <ul className="mt-3 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5 text-[13.5px] leading-snug text-white/70">
            <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />{it}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Lifecycle: React.FC = () => {
  const nav = useNavigate();
  const c = useMarketing6Copy().lifecycle;
  useReveal();
  const [i, setI] = useState(0);
  React.useEffect(() => track("page.lifecycle"), []);
  const meta = STAGE_META[i];
  const s = c.stages[i];
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="officialrecord" alt="The governed lifecycle of an official record" />
      <main>
        <section className="border-t border-white/[0.06] px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">{c.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-serif text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">
              {c.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/60">
              {c.lead}
            </p>

            {/* stage selector — horizontal rail */}
            <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {STAGE_META.map((st, idx) => (
                <button key={st.key} onClick={() => setI(idx)}
                  aria-current={idx === i}
                  className={`group rounded-xl border px-3 py-3 text-left transition ${idx === i ? "border-gold-400/45 bg-gold-400/[0.07]" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}>
                  <div className={`font-mono text-[11px] font-bold ${idx === i ? "text-gold-300" : "text-white/40"}`}>{st.n}</div>
                  <div className={`mt-1 text-[13px] font-semibold leading-tight ${idx === i ? "text-white" : "text-white/70"}`}>{c.stages[idx].title}</div>
                </button>
              ))}
            </div>

            {/* detail panel */}
            <div key={meta.key} className="reveal in mt-10 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 sm:p-9">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-[13px] font-bold text-gold-400">{meta.n}</span>
                <h2 className="font-serif text-[1.9rem] font-bold tracking-tight text-white">{s.title}</h2>
              </div>
              <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-white/65">{s.summary}</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Facet label={c.facetParticipants} tone="participants" items={s.participants} />
                <Facet label={c.facetGovernance} tone="governance" items={s.governance} />
                <Facet label={c.facetOutputs} tone="outputs" items={s.outputs} />
                <Facet label={c.facetEvidence} tone="evidence" items={s.evidence} />
              </div>
              <div className="mt-7 flex items-center gap-3">
                <button onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}
                  className="rounded border border-white/15 px-4 py-2 text-[12.5px] font-semibold uppercase tracking-wide text-white/80 transition enabled:hover:border-white/35 disabled:opacity-30">{c.backBtn}</button>
                <button onClick={() => setI((v) => Math.min(STAGE_META.length - 1, v + 1))} disabled={i === STAGE_META.length - 1}
                  className="group inline-flex items-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2 text-[12.5px] font-bold uppercase tracking-wide text-[#1c1407] transition active:translate-y-px enabled:hover:from-gold-200 enabled:hover:to-gold-500 disabled:opacity-40">
                  {c.nextBtn} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </button>
                <span className="ml-auto font-mono text-[12px] text-white/35">{i + 1}/{STAGE_META.length}</span>
              </div>
            </div>
          </div>
        </section>

        {/* close */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-[1.9rem] font-bold leading-tight text-white sm:text-[2.3rem]">{c.closeTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
              {c.closeLead}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(COST_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">{c.ctaCost}</button>
              <button onClick={() => nav(WALKTHROUGH_ROUTE)} className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">{c.ctaWalkthrough} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
              <button onClick={() => nav(VERIFY_ROUTE)} className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-emerald-300 transition hover:bg-emerald-500/20">{c.ctaVerify}</button>
              <button onClick={() => nav(ROI_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">{c.ctaRoi}</button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Lifecycle;

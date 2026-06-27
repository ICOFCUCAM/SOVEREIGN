import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionHead, Chevron, PublicHeader, PageBanner, PublicFooter, FilmGrain, useReveal } from "../components/brand";
import { TRUST_ROUTE } from "../lib/routes";

// Outcomes — answers the executive question features cannot: "what changes if we
// adopt this?" Before / after, and the actual institutional journeys. This is
// transformation, not capability — for a Minister, Rector or Board Chair who will
// never read a dashboard.
const BEFORE = ["A policy PDF on a shared drive", "An email chain of approvals", "Version confusion — which is final?", "Approvals that cannot be proven", "Records that quietly disappear"];
const AFTER = ["A governed official record", "An enforced chain of authority", "One canonical, immutable version", "A cryptographic certificate of approval", "Permanent, provable retrieval"];

const SCENARIOS: { who: string; what: string; flow: string[] }[] = [
  { who: "Ministry", what: "Cabinet Memorandum", flow: ["Drafted", "Governed by policy", "Director → Secretary approval", "Published of record", "Preserved with proof"] },
  { who: "University", what: "Academic Senate Resolution", flow: ["Proposed", "Senate governance", "Registrar authority", "Official record", "Preserved permanently"] },
  { who: "Hospital", what: "Clinical Directive", flow: ["Authored", "Clinical governance", "Medical Director approval", "Published to staff", "Full audit trail"] },
  { who: "Regulator", what: "Regulatory Notice", flow: ["Issued", "Legal review chain", "Commissioner authority", "Published as evidence", "Retained to schedule"] },
];

const Outcomes: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="outcomes" alt="A government office at work" />
      <main>
        <section className="border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <div className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">Institutional transformation</div>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">What changes when an institution<br /><span className="text-white/50">adopts Sovereign Dispatch.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">Not new features. A new way official records exist — created under governance, proven by certificate, and preserved beyond the people who made them.</p>
          </div>
        </section>

        {/* before / after */}
        <section className="scroll-mt-24 border-t border-white/[0.06] px-8 py-24 lg:px-12">
          <SectionHead index="01" kicker="Before & After" title="The same decision — transformed."
            sub="How an official act moves from a file on a drive to a governed institutional record." />
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/40">Before Dispatch</div>
              <ul className="mt-4 space-y-3 text-[14px] text-white/55">{BEFORE.map((x) => <li key={x} className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/25" />{x}</li>)}</ul>
            </div>
            <div className="rounded-2xl border border-gold-400/25 bg-gradient-to-b from-gold-400/[0.06] to-transparent p-7">
              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-400">After Dispatch</div>
              <ul className="mt-4 space-y-3 text-[14px] text-white/80">{AFTER.map((x) => <li key={x} className="flex gap-3"><Chevron className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-400" />{x}</li>)}</ul>
            </div>
          </div>
        </section>

        {/* scenario library */}
        <section className="scroll-mt-24 border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-24 lg:px-12">
          <SectionHead index="02" kicker="Scenario Library" title="The same governed journey, every institution."
            sub="A different official act in each — the same enforced path from drafting to permanent record." />
          <div className="mx-auto mt-14 max-w-5xl space-y-4">
            {SCENARIOS.map((s) => (
              <div key={s.who} className="reveal rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/25">
                <div className="mb-4 flex items-baseline gap-3"><span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-400">{s.who}</span><span className="text-base font-semibold text-white">{s.what}</span></div>
                <div className="flex flex-wrap items-center gap-2">
                  {s.flow.map((step, i) => (
                    <React.Fragment key={step}>
                      <span className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[12.5px] text-white/75">{step}</span>
                      {i < s.flow.length - 1 && <Chevron className="h-3 w-3 shrink-0 text-white/25" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-8 py-20 lg:px-12">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
            <div className="text-xl font-semibold text-white/80">Every journey ends the same way: a record you can prove, and keep.</div>
            <button onClick={() => nav(TRUST_ROUTE)} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-black transition hover:bg-gold-300">Why it's safe to adopt <Chevron className="h-3.5 w-3.5" /></button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Outcomes;

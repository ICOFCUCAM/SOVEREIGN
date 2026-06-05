import React from "react";
import { useNavigate } from "react-router-dom";
import GlobeScene from "../components/GlobeScene";

// Public marketing landing — the front door to Dispatch. Models the benchmark:
// a full-bleed cinematic hero (live intelligence globe, gold institutional
// accent) with the value proposition on the left and a top nav. "Launch
// Dispatch" / "Log in" route into the gated console (/console).
//
// The hero artwork is the coded GlobeScene — a full-bleed 2036 acquisition-
// intelligence command core (volumetric particle globe, orbital rings,
// telemetry grid, holographic platform, connected intelligence panels). No
// static image. A left-to-right gradient keeps the headline legible over it.
const NAV = ["Overview", "Capabilities", "Workflow", "Security", "Integrations", "Resources"];

const Feature: React.FC<{ icon: React.ReactNode; title: string; sub: string }> = ({ icon, title, sub }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-gold-400">{icon}</div>
    <div>
      <div className="text-sm font-bold leading-tight text-white">{title}</div>
      <div className="text-xs leading-snug text-white/45">{sub}</div>
    </div>
  </div>
);

const Landing: React.FC = () => {
  const nav = useNavigate();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020407] text-white">
      {/* hero artwork — the live intelligence command core (GlobeScene),
          full-bleed behind the hero content. */}
      <div className="absolute inset-0" aria-hidden>
        <GlobeScene className="h-full w-full" />
      </div>
      {/* legibility gradient: darken the left column for the headline while
          leaving the command core bright on the right. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070707] from-12% via-[#070707]/60 via-38% to-transparent to-60%" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#070707] to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] flex-col px-8 lg:px-12">
        {/* top nav */}
        <header className="flex items-center justify-between py-7">
          <div className="flex items-center gap-3">
            <DispatchMark className="h-9 w-9 text-gold-400" />
            <span className="text-xl font-bold tracking-tight">
              SOVEREIGN <span className="text-gold-400">DISPATCH</span>
            </span>
          </div>
          <nav className="hidden items-center gap-9 lg:flex">
            {NAV.map((n) => (
              <a key={n} href={`#${n.toLowerCase()}`} className="text-[13px] font-medium uppercase tracking-wide text-white/70 transition hover:text-white">{n}</a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={() => nav("/console")} className="text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:text-white">Log in</button>
            <button onClick={() => nav("/console")}
              className="group inline-flex items-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-lg shadow-gold-700/20 transition hover:from-gold-200 hover:to-gold-500">
              Launch Dispatch
              <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </header>

        {/* hero body */}
        <div className="flex flex-1 items-center">
          <div className="max-w-2xl py-10">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.25em] text-gold-400">Institutional Publication Infrastructure</p>
            <h1 className="font-serif text-6xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
              From Information
              <br />to <span className="text-gold-400">Official Record.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/60">
              Generate briefings, board reports, policy papers, regulatory submissions, operational packages and official records at sovereign scale.
            </p>

            {/* trust strip */}
            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              <Feature icon={<ShieldCheck />} title="Trusted" sub="by Institutions That Cannot Fail" />
              <Feature icon={<Lock />} title="Sovereign by Design" sub="Data. Residency. Operations." />
              <Feature icon={<DocFlow />} title="Governed End to End" sub="From Draft to Publication." />
              <Feature icon={<Seal />} title="Auditable Always" sub="Every Action. Every Version." />
            </div>

            {/* CTAs */}
            <div className="mt-11 flex flex-wrap items-center gap-4">
              <button onClick={() => nav("/console")}
                className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-xl shadow-gold-700/25 transition hover:from-gold-200 hover:to-gold-500">
                Launch Dispatch
                <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <a href="#capabilities"
                className="inline-flex items-center rounded border border-white/20 px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/40 hover:bg-white/5">
                View Publication Infrastructure
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- inline icons (no dependency) ----
const DispatchMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    <path d="M16 2l11 4v9c0 7-4.7 12.4-11 15-6.3-2.6-11-8-11-15V6l11-4z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 9v9m-4-5l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Chevron: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className}><path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const ShieldCheck = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C8 19 5 15.6 5 11V5.5L12 3z" stroke="currentColor" strokeWidth="1.5" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const Lock = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" /></svg>);
const DocFlow = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 3h7l4 4v14H7V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M14 3v4h4M9 13h6M9 16h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>);
const Seal = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M9 14l-1.5 7 4.5-2.5L16.5 21 15 14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>);

export default Landing;

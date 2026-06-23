import React from "react";
import { useNavigate } from "react-router-dom";

// Shared marketing chrome for the public pages (Landing keeps its own copies for
// historical reasons; Procurement + Architecture use these). No dependency on an
// icon library — institutional, not glossy.
export const DispatchMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    <path d="M16 2l11 4v9c0 7-4.7 12.4-11 15-6.3-2.6-11-8-11-15V6l11-4z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 9v9m-4-5l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Chevron: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className}><path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const Dot: React.FC = () => <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />;

// Centered section heading — kicker, serif title, optional sub. Shared across the
// public pages so positioning copy reads consistently.
export const SectionHead: React.FC<{ kicker: string; title: string; sub?: string }> = ({ kicker, title, sub }) => (
  <div className="mx-auto max-w-3xl text-center">
    <div className="mx-auto mb-6 h-px w-10 bg-gold-500/45" aria-hidden />
    <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">{kicker}</p>
    <h2 className="mx-auto mt-5 max-w-[20ch] font-serif text-4xl font-bold leading-[1.08] text-white sm:text-5xl">{title}</h2>
    {sub && <p className="mx-auto mt-6 max-w-[42rem] text-lg leading-[1.7] text-white/55">{sub}</p>}
  </div>
);

// Bordered capability card — title + body, with a subtle hover lift.
export const Card: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 transition hover:border-gold-500/30 hover:bg-white/[0.04]">
    <div className="text-[15px] font-bold tracking-[-0.005em] text-white">{title}</div>
    <p className="mt-2.5 text-[13.5px] leading-[1.65] text-white/55">{body}</p>
  </div>
);

// Shared trust strip — the three positioning pillars, full-bleed.
export const TrustStrip: React.FC = () => (
  <div className="border-t border-white/10 bg-white/[0.02] px-8 py-6 lg:px-12">
    <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/45">
      <span>Sovereign by Design</span>
      <span className="hidden text-gold-400/40 sm:inline">·</span>
      <span>Auditable by Default</span>
      <span className="hidden text-gold-400/40 sm:inline">·</span>
      <span>Institution Ready</span>
    </div>
  </div>
);

// Shared public footer — DispatchMark + institutional wordmark.
export const PublicFooter: React.FC = () => (
  <footer className="border-t border-white/5 px-8 py-10 lg:px-12">
    <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-4 text-[12px] text-white/40 sm:flex-row">
      <div className="flex items-center gap-2"><DispatchMark className="h-5 w-5 text-gold-400" /> Sovereign Dispatch · Institutional Publication Infrastructure</div>
      <div>Sovereign by design · Auditable always</div>
    </div>
  </footer>
);

// Sticky public header shared by the procurement + architecture pages. `actions`
// renders on the right (e.g. a print button). `.no-print` keeps it out of PDFs.
export const PublicHeader: React.FC<{ actions?: React.ReactNode }> = ({ actions }) => {
  const nav = useNavigate();
  return (
    <header className="no-print sticky top-0 z-50 border-b border-white/5 bg-[#070707]/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-8 py-4 lg:px-12">
        <button onClick={() => nav("/")} className="flex items-center gap-3">
          <DispatchMark className="h-8 w-8 text-gold-400" />
          <span className="text-lg font-bold tracking-tight">SOVEREIGN <span className="text-gold-400">DISPATCH</span></span>
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => nav("/")} className="text-[13px] font-semibold uppercase tracking-wide text-white/70 transition hover:text-white">Home</button>
          {actions}
          <button onClick={() => nav("/console")}
            className="group inline-flex items-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-lg shadow-gold-700/20 transition hover:from-gold-200 hover:to-gold-500">
            Launch Dispatch
            <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

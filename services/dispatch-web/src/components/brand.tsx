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
            className="group inline-flex items-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-lg shadow-gold-700/20 transition hover:from-gold-200 hover:to-gold-500">
            Launch Dispatch
            <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

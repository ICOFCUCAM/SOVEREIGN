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
    <h2 className="mx-auto mt-5 max-w-[20ch] font-serif text-4xl font-bold leading-[1.08] text-[#f4efe3] sm:text-5xl">{title}</h2>
    {sub && <p className="mx-auto mt-6 max-w-[42rem] text-lg leading-[1.7] text-white/55">{sub}</p>}
  </div>
);

// The engineered card surface — top-lit gradient, inset highlight, gold hover
// lift. Shared so every bespoke panel across the marketing pages matches the
// homepage's material instead of the older flat `bg-white/[0.02]` boxes.
export const SURFACE =
  "rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.012] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-gold-500/30 hover:from-white/[0.06]";

// Bordered capability card — title + body, with a subtle hover lift.
export const Card: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.012] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-gold-500/30 hover:from-white/[0.06]">
    <div className="text-[15px] font-bold tracking-[-0.005em] text-white">{title}</div>
    <p className="mt-2.5 text-[13.5px] leading-[1.65] text-white/55">{body}</p>
  </div>
);

// Shared trust strip — the three positioning pillars, full-bleed.
export const TrustStrip: React.FC = () => (
  <div className="border-t border-white/[0.06] bg-white/[0.015] px-8 py-7 lg:px-12">
    <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">
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
  <footer className="border-t border-white/[0.06] px-8 py-12 lg:px-12">
    <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-5 sm:flex-row">
      <div className="flex items-center gap-2.5 text-[12.5px] text-white/45">
        <DispatchMark className="h-5 w-5 text-gold-400" />
        <span className="font-semibold tracking-tight text-white/75">Sovereign Dispatch</span>
        <span className="text-white/25">·</span> Institutional Publication Infrastructure
      </div>
      <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.18em] text-white/45">
        <span>Sovereign by design</span>
        <span className="text-gold-400/30">·</span>
        <span>Auditable always</span>
        <span className="text-gold-400/30">·</span>
        <span className="font-mono tracking-[0.1em]">© MMXXXVI</span>
      </div>
    </div>
  </footer>
);

// Fine tactile grain over the dark field — kills flat-black banding. Fixed,
// decorative, identical to the homepage so every marketing surface reads alike.
export const FilmGrain: React.FC = () => (
  <div
    className="pointer-events-none fixed inset-0 z-[1] opacity-[0.038] mix-blend-soft-light print:hidden"
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
    aria-hidden
  />
);

// Restrained scroll reveal — each id'd section rises gently into view once, then
// settles. Shared with the homepage; pair with the `stagger` class for sequenced
// children. Honours prefers-reduced-motion via the CSS that styles `.reveal`.
export const useReveal = (): void => {
  React.useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
    els.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

// Sticky public header shared by the procurement + architecture pages. `actions`
// renders on the right (e.g. a print button). `.no-print` keeps it out of PDFs.
export const PublicHeader: React.FC<{ actions?: React.ReactNode }> = ({ actions }) => {
  const nav = useNavigate();
  return (
    <header className="no-print sticky top-0 z-50 border-b border-white/[0.06] bg-[#070707]/80 backdrop-blur-md shadow-[0_10px_30px_-22px_rgba(0,0,0,0.85)]">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-8 py-4 lg:px-12">
        <button onClick={() => nav("/")} className="flex items-center gap-3">
          <DispatchMark className="h-8 w-8 text-gold-400" />
          <span className="text-lg font-bold tracking-tight">SOVEREIGN <span className="text-gold-400">DISPATCH</span></span>
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => nav("/")} className="text-[13px] font-semibold uppercase tracking-wide text-white/70 transition hover:text-white">Home</button>
          {actions}
          <button onClick={() => nav("/console")}
            className="group inline-flex items-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-8px_rgba(0,0,0,0.55)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
            Launch Dispatch
            <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

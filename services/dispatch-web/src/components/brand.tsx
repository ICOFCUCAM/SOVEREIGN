import React from "react";
import { useNavigate } from "react-router-dom";
import {
  PLATFORM_ROUTE, SECURITY_ROUTE, COMPLIANCE_ROUTE, DEVELOPERS_ROUTE,
  PROCUREMENT_ROUTE, PRICING_ROUTE, ARCHITECTURE_ROUTE, EVIDENCE_ROUTE, TRUST_ROUTE,
  OUTCOMES_ROUTE, STANDARD_ROUTE, RECORDS_ROUTE, JOURNEY_ROUTE,
  OFFICIAL_RECORD_ROUTE, VERIFY_ROUTE, WALKTHROUGH_ROUTE,
  COST_ROUTE, LIFECYCLE_ROUTE, ROI_ROUTE,
} from "../lib/routes";
import { VALUE, VALUE_BASE } from "../lib/value";

// Shared marketing chrome for the public pages (Landing keeps its own copies for
// historical reasons; Procurement + Architecture use these). No dependency on an
// icon library — institutional, not glossy.
export const DispatchMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true" focusable="false">
    <path d="M16 2l11 4v9c0 7-4.7 12.4-11 15-6.3-2.6-11-8-11-15V6l11-4z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 9v9m-4-5l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Chevron: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true" focusable="false"><path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const Dot: React.FC = () => <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />;

// Centered section heading — kicker, serif title, optional sub. Shared across the
// public pages so positioning copy reads consistently. Pass `index` (e.g. "01")
// to render the homepage's numbered dossier eyebrow.
export const SectionHead: React.FC<{ kicker: string; title: string; sub?: string; index?: string }> = ({ kicker, title, sub, index }) => (
  <div className="mx-auto max-w-3xl text-center">
    <div className="mx-auto mb-6 h-px w-10 bg-gold-500/45" aria-hidden />
    <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">
      {index && <><span className="tnum font-mono tracking-normal text-gold-400/55">{index}</span><span className="mx-2 font-normal text-gold-400/30">·</span></>}
      {kicker}
    </p>
    <h2 className="mx-auto mt-5 max-w-[20ch] font-serif text-4xl font-bold leading-[1.08] text-[#f4efe3] sm:text-5xl">{title}</h2>
    {sub && <p className="lead-balance mx-auto mt-6 max-w-[42rem] text-lg leading-[1.7] text-white/55">{sub}</p>}
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
  <div className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-white/[0.006] px-5 py-7 sm:px-8 lg:px-12">
    <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">
      <span>Sovereign by Design</span>
      <span className="hidden text-gold-400/40 sm:inline">·</span>
      <span>Auditable by Default</span>
      <span className="hidden text-gold-400/40 sm:inline">·</span>
      <span>Institution Ready</span>
    </div>
  </div>
);

// One navigation column in the footer — a quiet uppercase label over restrained links.
const FooterCol: React.FC<{ title: string; links: [string, string][] }> = ({ title, links }) => (
  <div>
    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">{title}</div>
    <ul className="mt-4 space-y-2.5">
      {links.map(([label, href]) => (
        <li key={label}>
          <a href={href} className="relative inline-block text-[13px] text-white/60 transition hover:text-gold-300 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-gold-400/55 after:transition-all after:duration-300 hover:after:w-full">{label}</a>
        </li>
      ))}
    </ul>
  </div>
);

// Shared public footer — an institutional sitemap (wordmark + positioning over
// three navigation columns) above a legal/assurance baseline. Substantial, the way
// infrastructure footers are — not a single thin credit line.
export const PublicFooter: React.FC = () => (
  <footer className="relative overflow-hidden border-t border-white/[0.06] px-5 py-14 sm:px-8 lg:px-12">
    <div className="pointer-events-none absolute -right-20 -top-24 opacity-[0.025]" aria-hidden>
      <DispatchMark className="h-80 w-80 text-gold-400" />
    </div>
    <div className="relative mx-auto max-w-[1500px]">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <DispatchMark className="h-6 w-6 text-gold-400" />
            <span className="font-semibold tracking-tight text-white/85">Sovereign Dispatch</span>
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-white/45">
            The operating system for institutional publication — where information becomes a sealed, governed, permanent record.
          </p>
        </div>
        <FooterCol title="The Standard" links={[["What is an Official Record?", OFFICIAL_RECORD_ROUTE], ["See a governed record", WALKTHROUGH_ROUTE], ["Verify a record", VERIFY_ROUTE], ["Outcomes", OUTCOMES_ROUTE], ["The Standard", STANDARD_ROUTE], ["Records", RECORDS_ROUTE], ["Readiness Journey", JOURNEY_ROUTE]]} />
        <FooterCol title="Platform" links={[["Overview", PLATFORM_ROUTE], ["Developers", DEVELOPERS_ROUTE], ["Security", SECURITY_ROUTE], ["Compliance", COMPLIANCE_ROUTE]]} />
        <FooterCol title="Evaluate" links={[["Cost of Publication", COST_ROUTE], ["The Governed Lifecycle", LIFECYCLE_ROUTE], ["ROI Estimator", ROI_ROUTE], ["Pricing", PRICING_ROUTE], ["Procurement", PROCUREMENT_ROUTE], ["Architecture", ARCHITECTURE_ROUTE], ["Evidence", EVIDENCE_ROUTE], ["Trust", TRUST_ROUTE]]} />
        <FooterCol title="The Case" links={VALUE.map((v) => [v.title, `${VALUE_BASE}/${v.slug}`] as [string, string])} />
        <FooterCol title="Access" links={[["Launch Dispatch", "/console"], ["Log in", "/console"]]} />
      </div>
      <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/[0.05] pt-7 sm:flex-row sm:items-center">
        <div className="text-[12px] text-white/55">
          © <span className="font-mono tracking-[0.1em]">MMXXXVI</span> Sovereign Dispatch
          <span className="text-white/25"> · </span>Institutional Publication Infrastructure
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
            <span>Sovereign by design</span>
            <span className="text-gold-400/30">·</span>
            <span>Auditable always</span>
          </div>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/55 transition hover:border-gold-400/40 hover:text-gold-300" aria-label="Back to top">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V3M3 8l5-5 5 5" /></svg>
          </button>
        </div>
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
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
    sections.forEach((el) => el.classList.add("reveal"));
    // Observe id'd sections AND any element that already opted in with a bare
    // `.reveal` class (cards on /standard, /outcomes, /records etc.) — otherwise
    // those never receive `.in` and sit invisible under non-reduced motion.
    const els = Array.from(new Set<HTMLElement>([
      ...sections,
      ...Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.in)")),
    ]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

// Two navigations from one source. The desktop bar is deliberately lean — a
// premium header guides toward the single action (Launch), so it carries only
// the four destinations an evaluator reaches for; everything else lives in the
// footer sitemap and the full mobile sheet. The mobile sheet stays comprehensive
// (a phone has no footer in view), minus Home, which the wordmark already is.
const DESKTOP_NAV: [string, string][] = [
  ["Platform", PLATFORM_ROUTE],
  ["Standard", STANDARD_ROUTE],
  ["Trust", TRUST_ROUTE],
  ["Developers", DEVELOPERS_ROUTE],
  ["Pricing", PRICING_ROUTE],
];
const NAV: [string, string][] = [
  ["Standard", STANDARD_ROUTE],
  ["Outcomes", OUTCOMES_ROUTE],
  ["Trust", TRUST_ROUTE],
  ["Developers", DEVELOPERS_ROUTE],
  ["Verify", VERIFY_ROUTE],
  ["Pricing", PRICING_ROUTE],
];

// Sticky public header shared by the procurement + architecture pages. `actions`
// renders on the right (e.g. a print button). `.no-print` keeps it out of PDFs.
// Below `lg` the inline bar collapses into an accessible mobile sheet so every
// destination is reachable on a phone — not just Launch.
export const PublicHeader: React.FC<{ actions?: React.ReactNode }> = ({ actions }) => {
  const nav = useNavigate();
  const [open, setOpen] = React.useState(false);
  const go = (to: string) => { setOpen(false); nav(to); };
  // A thin gold reading-progress bar under the header — a quiet premium cue of
  // how far through the page the visitor is. rAF-throttled, passive listener.
  const barRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  // Close the sheet on Escape and lock body scroll while it is open.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);
  return (
    <header className="no-print sticky top-0 z-50 border-b border-white/[0.06] bg-[#070707]/80 backdrop-blur-md shadow-[0_10px_30px_-22px_rgba(0,0,0,0.85)]">
      <div ref={barRef} className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-gold-500/50 via-gold-400 to-gold-300" style={{ transform: "scaleX(0)" }} aria-hidden />
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:px-12">
        <button onClick={() => go("/")} className="flex shrink-0 items-center gap-3">
          <DispatchMark className="h-8 w-8 text-gold-400" />
          <span className="whitespace-nowrap text-base font-bold tracking-tight sm:text-lg">SOVEREIGN <span className="text-gold-400">DISPATCH</span></span>
        </button>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {/* lean inline navigation — desktop only */}
          {DESKTOP_NAV.map(([label, to]) => (
            <button key={to} onClick={() => go(to)} className="hidden text-[13px] font-semibold uppercase tracking-wide text-white/70 transition hover:text-white lg:inline-block">{label}</button>
          ))}
          {actions}
          {/* standalone Launch CTA — hidden on the narrowest phones (where it would
              crowd the bar); on those it leads the mobile sheet instead. */}
          <button onClick={() => go("/console")}
            className="btn-sheen group hidden items-center gap-2 whitespace-nowrap rounded bg-gradient-to-b from-gold-300 to-gold-600 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-8px_rgba(0,0,0,0.55)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500 sm:inline-flex sm:px-5">
            <span className="sm:hidden">Launch</span><span className="hidden sm:inline">Launch Dispatch</span>
            <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </button>
          {/* hamburger — tablet & phone */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex h-10 w-10 items-center justify-center rounded border border-white/15 text-white/80 transition hover:border-white/35 hover:text-white lg:hidden">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {/* mobile sheet — full navigation, every destination reachable on a phone */}
      {open && (
        <div className="lg:hidden">
          <div className="fixed inset-0 top-[68px] z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <nav id="mobile-nav" className="relative z-50 border-t border-white/[0.06] bg-[#0a0a0a] px-5 py-3 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.9)] sm:px-8">
            {/* primary action first — on the narrowest phones this is the only Launch entry */}
            <button onClick={() => go("/console")} className="mb-2 mt-1 flex w-full items-center justify-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 py-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition hover:from-gold-200 hover:to-gold-500 sm:hidden">
              Launch Dispatch <Chevron className="h-3.5 w-3.5" />
            </button>
            {NAV.map(([label, to]) => (
              <button key={to} onClick={() => go(to)} className="block w-full border-b border-white/[0.05] py-3.5 text-left text-[14px] font-semibold uppercase tracking-wide text-white/80 transition hover:text-gold-300">{label}</button>
            ))}
            <button onClick={() => go(PROCUREMENT_ROUTE)} className="block w-full py-3.5 text-left text-[14px] font-semibold uppercase tracking-wide text-white/80 transition hover:text-gold-300">Procurement</button>
          </nav>
        </div>
      )}
    </header>
  );
};

// A cinematic institutional banner strip for the top of a marketing page. The
// wide image is faded into the page on every edge so it reads as part of the
// dark field, never a pasted-in photo. `slug` maps to /banners/<slug>.webp; if
// the file is absent the band renders nothing (never a broken image).
export const PageBanner: React.FC<{ slug: string; alt?: string }> = ({ slug, alt = "" }) => {
  const [failed, setFailed] = React.useState(false);
  if (failed) return null;
  return (
    <div className="relative h-[clamp(150px,22vw,300px)] w-full overflow-hidden border-b border-white/[0.06] bg-[#070707]">
      <img
        src={`/banners/${slug}.webp`}
        alt={alt}
        loading="lazy" decoding="async"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070707]/55 via-[#070707]/10 to-[#070707]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070707]/70 via-transparent to-[#070707]/45" />
    </div>
  );
};

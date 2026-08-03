import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { t as tr, ACTIVE_LOCALES, DEFAULT_LOCALE, localeOf, localePath } from "../lib/i18n";
import { conceptLocales } from "../lib/translations";
import { useUiLocale, usePreferredLocale } from "../lib/locale";
import {
  PLATFORM_ROUTE, SECURITY_ROUTE, COMPLIANCE_ROUTE, DEVELOPERS_ROUTE,
  PROCUREMENT_ROUTE, PRICING_ROUTE, ARCHITECTURE_ROUTE, EVIDENCE_ROUTE, TRUST_ROUTE,
  OUTCOMES_ROUTE, STANDARD_ROUTE, RECORDS_ROUTE, JOURNEY_ROUTE,
  OFFICIAL_RECORD_ROUTE, VERIFY_ROUTE, WALKTHROUGH_ROUTE,
  COST_ROUTE, LIFECYCLE_ROUTE, ROI_ROUTE, INDUSTRIES_ROUTE, LEARN_ROUTE, LIBRARY_ROUTE, DOCS_ROUTE,
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
            Institutional trust infrastructure — where institutional decisions become sealed, governed, permanent records.
          </p>
        </div>
        <FooterCol title="The Standard" links={[["What is an Official Record?", OFFICIAL_RECORD_ROUTE], ["See a governed record", WALKTHROUGH_ROUTE], ["Verify a record", VERIFY_ROUTE], ["Outcomes", OUTCOMES_ROUTE], ["The Standard", STANDARD_ROUTE], ["Records", RECORDS_ROUTE], ["Readiness Journey", JOURNEY_ROUTE]]} />
        <FooterCol title="Platform" links={[["Overview", PLATFORM_ROUTE], ["Industries", INDUSTRIES_ROUTE], ["Library", LIBRARY_ROUTE], ["Concepts", LEARN_ROUTE], ["Developers", DEVELOPERS_ROUTE], ["Documentation", DOCS_ROUTE], ["Security", SECURITY_ROUTE], ["Compliance", COMPLIANCE_ROUTE]]} />
        <FooterCol title="Evaluate" links={[["Cost of Publication", COST_ROUTE], ["The Governed Lifecycle", LIFECYCLE_ROUTE], ["ROI Estimator", ROI_ROUTE], ["Pricing", PRICING_ROUTE], ["Procurement", PROCUREMENT_ROUTE], ["Architecture", ARCHITECTURE_ROUTE], ["Evidence", EVIDENCE_ROUTE], ["Trust", TRUST_ROUTE]]} />
        <FooterCol title="The Case" links={VALUE.map((v) => [v.title, `${VALUE_BASE}/${v.slug}`] as [string, string])} />
        <FooterCol title="Access" links={[["Launch Dispatch", "/console"], ["Log in", "/console"]]} />
      </div>
      <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/[0.05] pt-7 sm:flex-row sm:items-center">
        <div className="text-[12px] text-white/55">
          © <span className="font-mono tracking-[0.1em]">MMXXXVI</span> Sovereign Dispatch
          <span className="text-white/25"> · </span>Institutional Trust Infrastructure
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

// Scroll-spy: given an ordered list of element ids, return the id of the
// section currently in view so a table of contents can highlight it. Used by
// long-form pages (articles, docs) to keep the reader oriented.
export const useScrollSpy = (ids: string[]): string => {
  const [active, setActive] = React.useState(ids[0] || "");
  React.useEffect(() => {
    if (!ids.length) return;
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: "-20% 0px -70% 0px", threshold: 0 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids.join("|")]);
  return active;
};

// Two navigations from one source. The desktop bar is deliberately lean — a
// premium header guides toward the single action (Launch), so it carries only
// the four destinations an evaluator reaches for; everything else lives in the
// footer sitemap and the full mobile sheet. The mobile sheet stays comprehensive
// (a phone has no footer in view), minus Home, which the wordmark already is.
// [i18n key, route] — labels resolve to the active locale at render time.
const DESKTOP_NAV: [string, string][] = [
  ["nav.platform", PLATFORM_ROUTE],
  ["nav.standard", STANDARD_ROUTE],
  ["nav.trust", TRUST_ROUTE],
  ["nav.developers", DEVELOPERS_ROUTE],
  ["nav.pricing", PRICING_ROUTE],
];
const NAV: [string, string][] = [
  ["nav.standard", STANDARD_ROUTE],
  ["nav.outcomes", OUTCOMES_ROUTE],
  ["nav.trust", TRUST_ROUTE],
  ["nav.developers", DEVELOPERS_ROUTE],
  ["nav.verify", VERIFY_ROUTE],
  ["nav.pricing", PRICING_ROUTE],
];

// Sticky public header shared by the procurement + architecture pages. `actions`
// renders on the right (e.g. a print button). `.no-print` keeps it out of PDFs.
// Below `lg` the inline bar collapses into an accessible mobile sheet so every
// destination is reachable on a phone — not just Launch.
// Global language selector. Present in the header on every public page so a
// visitor can choose a language anywhere — not only on concept pages. Honest by
// design: it routes to the localized version of the current page when one
// exists; otherwise to that language's flagship concept (every active locale
// has it), so you always land on real localized content, never a fake locale URL.
const CONCEPT_RE = /^\/(?:([a-z]{2})\/)?learn\/([a-z0-9-]+)$/;
export const LanguageMenu: React.FC<{ align?: "left" | "right" }> = ({ align = "right" }) => {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const locale = useUiLocale();
  const { setLocale } = usePreferredLocale();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const target = (code: string): string => {
    const m = pathname.match(CONCEPT_RE);
    if (m) {
      const slug = m[2];
      if (conceptLocales(slug).includes(code)) return localePath(code, `${LEARN_ROUTE}/${slug}`);
      return localePath(code, `${LEARN_ROUTE}/official-publication`);
    }
    return code === DEFAULT_LOCALE ? "/" : localePath(code, `${LEARN_ROUTE}/official-publication`);
  };
  const go = (code: string) => { setOpen(false); setLocale(code); nav(target(code)); };
  const current = localeOf(locale);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open} aria-label={tr(locale, "lang.label")}
        className="inline-flex items-center gap-1.5 rounded border border-white/15 px-2.5 py-2 text-[12px] font-semibold uppercase tracking-wide text-white/75 transition hover:border-gold-400/35 hover:text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" strokeLinecap="round" /></svg>
        <span>{current.code}</span>
        <svg viewBox="0 0 24 24" className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div role="listbox" className={`absolute z-[70] mt-2 max-h-[62vh] w-48 overflow-auto rounded-xl border border-white/12 bg-[#0c0c0c]/95 p-1.5 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur ${align === "right" ? "right-0" : "left-0"}`}>
          {ACTIVE_LOCALES.map((code) => {
            const l = localeOf(code); const on = code === locale;
            return (
              <button key={code} role="option" aria-selected={on} onClick={() => go(code)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] transition ${on ? "bg-gold-400/10 text-gold-200" : "text-white/75 hover:bg-white/[0.05] hover:text-white"}`}>
                <span dir={l.dir}>{l.native}</span>
                <span className="text-[10px] uppercase tracking-wide text-white/35">{l.code}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const PublicHeader: React.FC<{ actions?: React.ReactNode }> = ({ actions }) => {
  const nav = useNavigate();
  const pathname = useLocation().pathname;
  const locale = useUiLocale();
  const [open, setOpen] = React.useState(false);
  const go = (to: string) => { setOpen(false); nav(to); };
  // "You are here" — a nav item is active on its exact route or any child route
  // (so /learn/<concept> still lights Learn). "/" only matches the homepage.
  const isActive = (to: string) => to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");
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
          {DESKTOP_NAV.map(([label, to]) => {
            const on = isActive(to);
            return (
              <button key={to} onClick={() => go(to)} aria-current={on ? "page" : undefined}
                className={`relative hidden text-[13px] font-semibold uppercase tracking-wide transition lg:inline-block ${on ? "text-white after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:bg-gold-400/70" : "text-white/70 hover:text-white"}`}>{tr(locale, label)}</button>
            );
          })}
          {actions}
          {/* global language selector — reachable on every page (the mobile sheet
              carries its own list below the lg breakpoint) */}
          <div className="hidden lg:block"><LanguageMenu /></div>
          {/* standalone Launch CTA — hidden on the narrowest phones (where it would
              crowd the bar); on those it leads the mobile sheet instead. */}
          <button onClick={() => go("/console")}
            className="btn-sheen group hidden items-center gap-2 whitespace-nowrap rounded bg-gradient-to-b from-gold-300 to-gold-600 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-8px_rgba(0,0,0,0.55)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500 sm:inline-flex sm:px-5">
            <span className="sm:hidden">{tr(locale, "cta.launchShort")}</span><span className="hidden sm:inline">{tr(locale, "cta.launch")}</span>
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
              {tr(locale, "cta.launch")} <Chevron className="h-3.5 w-3.5" />
            </button>
            {NAV.map(([label, to]) => {
              const on = isActive(to);
              return (
                <button key={to} onClick={() => go(to)} aria-current={on ? "page" : undefined} className={`block w-full border-b border-white/[0.05] py-3.5 text-left text-[14px] font-semibold uppercase tracking-wide transition ${on ? "text-gold-300" : "text-white/80 hover:text-gold-300"}`}>{tr(locale, label)}</button>
              );
            })}
            <button onClick={() => go(PROCUREMENT_ROUTE)} className="block w-full py-3.5 text-left text-[14px] font-semibold uppercase tracking-wide text-white/80 transition hover:text-gold-300">{tr(locale, "nav.procurement")}</button>
            {/* language selector in the sheet */}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/40">{tr(locale, "lang.label")}</span>
              <LanguageMenu align="right" />
            </div>
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

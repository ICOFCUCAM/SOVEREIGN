import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExchangeLockup } from "./ExchangeMark";
import { useI18n, LOCALES } from "../lib/i18n";

// Shared chrome + iconography for the public marketing site, so the homepage,
// Platform, Modules and Pricing all read as one professional, multi-page
// property rather than a single endless scroll.

// One button family for the marketing pages (EE22): a primary and a secondary,
// each with a paper and an ink form, the same size, weight, arrow and focus ring.
const BTN_BASE = "group inline-flex items-center justify-between gap-5 px-5 py-3.5 text-[12.5px] font-semibold tracking-[0.01em] transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-reduce:transition-none";
export const BUTTON = {
  primary: `${BTN_BASE} bg-ink-900 text-white hover:bg-[#2A2D30] focus-visible:ring-offset-white`,
  secondary: `${BTN_BASE} border border-ink-900/40 text-ink-900 hover:border-ink-900 hover:bg-ink-900 hover:text-white focus-visible:ring-offset-white`,
  primaryInk: `${BTN_BASE} bg-white text-ink-900 hover:bg-[#F5F1E9] focus-visible:ring-offset-ex-1`,
  secondaryInk: `${BTN_BASE} border border-white/50 text-white hover:border-white hover:bg-white hover:text-ink-900 focus-visible:ring-offset-ex-1`,
} as const;

export const Arrow = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"><path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export const Glyph: React.FC<{ name: string; small?: boolean; size?: number }> = ({ name, small, size }) => {
  const s = size ?? (small ? 15 : 20);
  const p: Record<string, React.ReactNode> = {
    chart: <><path d="M4 19V5M4 19h16M8 16v-4M12 16V9M16 16v-7" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M17 11a2.5 2.5 0 100-5M21 20c0-2.2-1.5-3.8-3.5-4.4" /></>,
    doc: <><path d="M7 3h7l4 4v14H7zM14 3v4h4M9 13h6M9 16h6" /></>,
    spark: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" /></>,
    check: <><circle cx="12" cy="12" r="8" /><path d="M9 12l2 2 4-4" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
    fire: <><path d="M12 3c1 3-2 4-2 7a4 4 0 008 0c0-4-3-5-3-8M12 21a5 5 0 01-3-9c0 4 3 4 3 7" /></>,
    shield: <><path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C9 19 5 15.6 5 11V5.5z" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
    x: <><path d="M6 6l12 12M18 6L6 18" /></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {p[name] ?? p.doc}
    </svg>
  );
};

// Brand-coloured monogram tiles — abstract glyphs in each company's colour.
// Placeholders that EVOKE the brand, NOT the trademarked logos.
type MarkDef = { tint: string; glyph: "grid" | "cloud" | "ring" | "tri" | "v" | "bars" | "g" | "shield" | "cross" | "gear" };
const MARKS: Record<string, MarkDef> = {
  Microsoft: { tint: "#0067B8", glyph: "grid" },
  Salesforce: { tint: "#00A1E0", glyph: "cloud" },
  SAP: { tint: "#0A6ED1", glyph: "bars" },
  Oracle: { tint: "#C74634", glyph: "ring" },
  "Thoma Bravo": { tint: "#1A2B5E", glyph: "tri" },
  "Vista Equity Partners": { tint: "#2E3192", glyph: "v" },
  "Palo Alto Networks": { tint: "#FA582D", glyph: "shield" },
  Google: { tint: "#4285F4", glyph: "g" },
  "UnitedHealth Group": { tint: "#002677", glyph: "cross" },
  "Rockwell Automation": { tint: "#CC0000", glyph: "gear" },
};
const MarkGlyph: React.FC<{ g: MarkDef["glyph"]; c: string; s: number }> = ({ g, c, s }) => {
  const p: Record<MarkDef["glyph"], React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7.5" height="7.5" fill={c} /><rect x="13.5" y="3" width="7.5" height="7.5" fill="#7FBA00" /><rect x="3" y="13.5" width="7.5" height="7.5" fill="#00A4EF" /><rect x="13.5" y="13.5" width="7.5" height="7.5" fill="#FFB900" /></>,
    cloud: <path d="M7 16a4 4 0 010-8 5 5 0 019.5-1.5A4 4 0 1117 16z" fill={c} />,
    bars: <><rect x="3" y="6" width="18" height="3.4" rx="1.5" fill={c} /><rect x="3" y="14.6" width="18" height="3.4" rx="1.5" fill={c} opacity="0.6" /></>,
    ring: <ellipse cx="12" cy="12" rx="9" ry="6" fill="none" stroke={c} strokeWidth="3" />,
    tri: <path d="M12 4l8 16H4z" fill={c} />,
    v: <path d="M4 5l8 15L20 5h-4l-4 8-4-8z" fill={c} />,
    g: <path d="M21 12a9 9 0 11-3-6.7l-3 2.6A5 5 0 1017 13h-5v-2.6h8.7A9 9 0 0121 12z" fill={c} />,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" fill={c} />,
    cross: <path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z" fill={c} />,
    gear: <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 4l-2-1 1-2-2-2-2 1-1-2h-2l-1 2-2-1-2 2 1 2-2 1v2l2 1-1 2 2 2 2-1 1 2h2l1-2 2 1 2-2-1-2 2-1z" fill={c} />,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>{p[g]}</svg>;
};
export const Mark: React.FC<{ name: string; size?: number }> = ({ name, size = 26 }) => {
  const m = MARKS[name];
  if (!m) return <span className="inline-flex shrink-0 items-center justify-center rounded bg-slate-500 font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>{name.slice(0, 2).toUpperCase()}</span>;
  return <span className="inline-flex shrink-0 items-center justify-center rounded bg-white shadow-sm ring-1 ring-black/5" style={{ width: size, height: size }} aria-hidden><MarkGlyph g={m.glyph} c={m.tint} s={size * 0.66} /></span>;
};

const NAV: [string, string, string][] = [["nav.platform", "Platform", "/platform"], ["nav.modules", "Modules", "/modules"], ["nav.pricing", "Pricing", "/pricing"]];

// Compact segmented language switcher — EN · FR · ES.
export const LocaleSwitch: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const { locale, setLocale } = useI18n();
  return (
    <div className={`flex items-center overflow-hidden rounded-md border ${dark ? "border-white/15" : "border-slate-300"}`} role="group" aria-label="Language">
      {LOCALES.map(([code]) => (
        <button key={code} onClick={() => setLocale(code)} aria-pressed={locale === code}
          className={`px-2 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wide transition ${
            locale === code
              ? (dark ? "bg-white/15 text-white" : "bg-ink-900 text-white")
              : (dark ? "text-white/55 hover:text-white" : "text-slate-600 hover:text-ink-900")
          }`}>
          {code}
        </button>
      ))}
    </div>
  );
};

/** Shared marketing layout classes (the index(9) skeleton system). */
export const MK = {
  wrap: "mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12",
  section: "py-14 sm:py-20 lg:py-24",
  h1: "font-editorial text-[clamp(2.8rem,6vw,6rem)] font-semibold leading-[0.95] tracking-[-0.045em]",
  h2: "font-editorial text-[clamp(2.25rem,4.6vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em]",
  // the button base and the dark ground follow the homepage system (EE22, EE27)
  btn: BTN_BASE,
  navy: "var(--ex-field)",
} as const;

/** The marketing page hero: chapter label, editorial h1, numbered deck, actions. */
export const PageHero: React.FC<{ chapter: string; title: string; deck: React.ReactNode; actions: React.ReactNode }> = ({ chapter, title, deck, actions }) => (
  <section className="border-b border-slate-200 bg-white">
    <div className={`${MK.wrap} pb-14 pt-12 lg:pb-20 lg:pt-16`}>
      <Chapter n="01">{chapter}</Chapter>
      <h1 className={`${MK.h1} mt-6 max-w-[16ch] text-ink-900`}><Editorial text={title} /></h1>
      <div className="mt-9 grid grid-cols-[44px_minmax(0,1fr)] gap-4 sm:grid-cols-[64px_minmax(0,620px)]">
        <span className="pt-1 font-mono text-[11px] text-[#7A6344]">01—</span>
        <div>
          <div className="text-[16px] leading-relaxed text-slate-600">{deck}</div>
          <div className="mt-7 flex flex-wrap gap-2.5">{actions}</div>
        </div>
      </div>
    </div>
  </section>
);

/** A chapter label — "02 / The thesis" — in the accent colour, mono. */
export const Chapter: React.FC<{ n: string; children: React.ReactNode; dark?: boolean }> = ({ n, children, dark }) => (
  // the one chapter opener (EE13): the number set in the serif, a short rule, the label in mono
  <div className={`flex items-center gap-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] ${dark ? "text-[#C9B08A]" : "text-[#7A6344]"}`}>
    <span className="font-editorial text-[15px] font-semibold not-italic tracking-normal tabular-nums">{n}</span>
    <span aria-hidden className={`h-px w-8 shrink-0 ${dark ? "bg-[#C9B08A]/50" : "bg-[#9A7E56]/50"}`} />
    <span className="sr-only">/</span><span>{children}</span>
  </div>
);

/** Editorial headline lines: every line but the last in ink, the last in the
 *  accent (italic). Single-line strings accent their last word. */
// `quiet`: the italic keeps the heading's own colour — the blue italic is kept for
// four homepage headings only, so it stays a signature rather than a formula (EE15)
export const Editorial: React.FC<{ text: string; dark?: boolean; quiet?: boolean }> = ({ text, dark, quiet }) => {
  const lines = text.split("\n");
  const accent = quiet ? "" : dark ? "text-[#C9B08A]" : "text-[#7A6344]";
  if (lines.length === 1) {
    const i = text.lastIndexOf(" ");
    if (i < 0) return <em className={`not-italic ${accent}`}>{text}</em>;
    return <>{text.slice(0, i + 1)}<em className={`italic ${accent}`}>{text.slice(i + 1)}</em></>;
  }
  return <>{lines.map((l, k) => (
    <React.Fragment key={k}>{k === lines.length - 1 ? <em className={`italic ${accent}`}>{l}</em> : l}{k < lines.length - 1 && <br />}</React.Fragment>
  ))}</>;
};

// The header takes the ink when it sits over a dark chapter (EE21): any element
// marked data-ink that spans the header's midline turns it. Light again over paper.
const useInkUnder = (): boolean => {
  const [ink, setInk] = React.useState(false);
  React.useEffect(() => {
    let raf = 0;
    const read = (): void => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      const y = 36;
      setInk([...document.querySelectorAll<HTMLElement>("[data-ink]")].some((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
    }); };
    read();
    addEventListener("scroll", read, { passive: true }); addEventListener("resize", read);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", read); removeEventListener("resize", read); };
  }, []);
  return ink;
};

export const MarketingChrome: React.FC<{ active?: string; children: React.ReactNode }> = ({ active, children }) => {
  const nav = useNavigate();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const ink = useInkUnder() && !menuOpen;
  const WRAP = "mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12";
  return (
    <div className="min-h-screen bg-[#F8F4EE] text-ink-900">
      <header className={`sticky top-0 z-40 border-b backdrop-blur transition-colors duration-200 motion-reduce:transition-none ${ink ? "border-white/10 bg-ex-1/85 text-white" : "border-[#E7E1D7] bg-[#F7F4EF]/[0.94]"}`}>
        <div className={`${WRAP} grid min-h-[72px] grid-cols-[1fr_auto] items-center gap-5 lg:grid-cols-[1fr_auto_1fr]`}>
          <div className="flex items-center gap-5">
            <button onClick={() => nav("/")} aria-label="ExitOS — home"><ExchangeLockup size={34} dark={ink} /></button>
            <span className={`hidden border-l pl-5 font-mono text-[10px] uppercase tracking-[0.3em] xl:inline ${ink ? "border-white/15 text-[#E8E0D2]/60" : "border-slate-300 text-slate-600"}`}>A Sovereign Infrastructure</span>
          </div>
          <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
            {NAV.map(([key, fallback, to]) => (
              <Link key={to} to={to} aria-current={active === fallback.toLowerCase() ? "page" : undefined}
                className={`relative text-[13px] font-medium transition after:absolute after:-bottom-1.5 after:left-0 after:h-px after:transition-all hover:after:w-full ${ink ? "after:bg-[#C9B08A]" : "after:bg-[#9A7E56]"} ${active === fallback.toLowerCase() ? `font-semibold after:w-full ${ink ? "text-white" : "text-ink-900"}` : `after:w-0 ${ink ? "text-[#E8E0D2]/75 hover:text-white" : "text-slate-600 hover:text-ink-900"}`}`}>{t(key)}</Link>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-3">
            <div className="hidden sm:block"><LocaleSwitch dark={ink} /></div>
            <button onClick={() => nav("/console")} className={`hidden text-[13px] font-medium transition sm:inline-flex ${ink ? "text-[#E8E0D2]/75 hover:text-white" : "text-slate-600 hover:text-ink-900"}`}>{t("nav.login")}</button>
            <button onClick={() => nav("/console")} className={`inline-flex items-center gap-3 px-4 py-3 text-[12px] font-semibold transition ${ink ? "bg-white text-ink-900 hover:bg-[#F5F1E9]" : "bg-ink-900 text-white hover:bg-ink-800"}`}>{t("nav.access")} <span aria-hidden>↗</span></button>
            {/* mobile menu toggle */}
            <button onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen}
              className={`border p-2 lg:hidden ${ink ? "border-white/20 text-white" : "border-slate-300 text-slate-700"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>
        {/* mobile nav panel */}
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
            <nav aria-label="Main" className="flex flex-col gap-1">
              {NAV.map(([key, fallback, to]) => (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 text-[14px] font-medium ${active === fallback.toLowerCase() ? "bg-slate-100 font-semibold text-ink-900" : "text-slate-600"}`}>{t(key)}</Link>
              ))}
              <Link to="/console" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-[14px] font-medium text-slate-600">{t("nav.login")}</Link>
            </nav>
            <div className="mt-3 flex items-center gap-3 border-t border-slate-100 px-3 pt-3">
              <span className="text-[12px] font-semibold text-slate-600">{t("nav.language")}</span>
              <LocaleSwitch />
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      {/* the footer continues the close in the deepest ink (EE16) */}
      <footer data-ink className="ex-seam relative overflow-hidden bg-ex-0 text-white">
        <div className={`${WRAP} pb-10 pt-16 lg:pt-20`}>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-14">
            <div>
              <ExchangeLockup size={30} dark />
              <p className="mt-5 max-w-sm font-editorial text-[17px] leading-snug text-white/85">{t("ft.tagline")}</p>
              {/* how the exchange works, stated — not status lights (EE20) */}
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#E8E0D2]/75">
                <li className="flex items-center gap-2"><span aria-hidden className="h-1.5 w-1.5 rotate-45 border border-ex-done/70" />{t("ft.soc")}</li>
                <li className="flex items-center gap-2"><span aria-hidden className="h-1.5 w-1.5 rotate-45 border border-ex-done/70" />{t("ft.audit")}</li>
                <li className="flex items-center gap-2"><span aria-hidden className="h-1.5 w-1.5 rotate-45 border border-ex-done/70" />{t("ft.ndagated")}</li>
              </ul>
            </div>
            {([
              ["ft.exchange", [["nav.platform", "/platform"], ["nav.modules", "/modules"], ["nav.pricing", "/pricing"], ["nav.access", "/console"]]],
              ["ft.founders", [["ft.list", "/console"], ["ft.valuation", "/modules"], ["ft.plans", "/pricing"]]],
              ["ft.acquirers", [["ft.browse", "/console"], ["ft.buyeraccess", "/pricing"], ["ft.requestnda", "/console"]]],
            ] as Array<[string, Array<[string, string]>]>).map(([titleKey, links]) => (
              <div key={titleKey}>
                <div className="border-b border-white/10 pb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#C9B08A]">{t(titleKey)}</div>
                <ul className="mt-5 space-y-3 text-[13.5px]">
                  {links.map(([k, to]) => (
                    <li key={k + to}><Link to={to} className="group inline-flex items-center gap-2 text-[#E8E0D2]/75 transition-colors hover:text-white focus-visible:text-white">{t(k)}<span aria-hidden className="-translate-x-1 text-[#C9B08A] opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none">→</span></Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="max-w-3xl text-[11px] leading-relaxed text-[#E8E0D2]/65">{t("ft.legal")}</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-[12px] text-[#E8E0D2]/70">
              <div>© {new Date().getFullYear()} ExitOS — A Sovereign Infrastructure</div>
              <div className="flex items-center gap-4">
                <LocaleSwitch dark />
                <div className="font-mono">exit.sovereigndo.com</div>
                {/* back to the top of a long page (EE19); instant when the reader prefers reduced motion */}
                <button type="button" onClick={() => { scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }}
                  className="group inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#E8E0D2]/80 transition hover:border-[#C9B08A]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                  {t("ft.top")} <span aria-hidden className="transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none">↑</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* the sign-off: the page closes with the mark it opened with, across the foot of every page (EE17;
            the homepage's own sign-off in chapter 09 moved here so there is one) */}
        <div aria-hidden className="pointer-events-none mx-auto -mb-[0.2em] max-w-[1480px] select-none overflow-hidden px-5 font-editorial sm:px-8 lg:px-12 font-semibold leading-[0.8] tracking-[-0.06em] text-transparent"
          style={{ fontSize: "clamp(6rem, 23vw, 21rem)", backgroundImage: "linear-gradient(180deg, rgba(220,205,179,0.42) 0%, rgba(220,205,179,0.05) 85%)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
          Exit<span className="italic">OS</span>
        </div>
      </footer>
    </div>
  );
};

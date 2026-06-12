import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExchangeLockup } from "./ExchangeMark";
import { useI18n, LOCALES } from "../lib/i18n";

// Shared chrome + iconography for the public marketing site, so the homepage,
// Platform, Modules and Pricing all read as one professional, multi-page
// property rather than a single endless scroll.

export const Arrow = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export const Glyph: React.FC<{ name: string; small?: boolean }> = ({ name, small }) => {
  const s = small ? 15 : 20;
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
              : (dark ? "text-white/55 hover:text-white" : "text-slate-500 hover:text-ink-900")
          }`}>
          {code}
        </button>
      ))}
    </div>
  );
};

export const MarketingChrome: React.FC<{ active?: string; children: React.ReactNode }> = ({ active, children }) => {
  const nav = useNavigate();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-ink-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10">
          <button onClick={() => nav("/")} aria-label="ExitOS — home"><ExchangeLockup size={30} /></button>
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map(([key, fallback, to]) => (
              <Link key={to} to={to} className={`text-[13px] font-medium transition ${active === fallback.toLowerCase() ? "font-semibold text-ink-900" : "text-slate-600 hover:text-ink-900"}`}>{t(key)}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><LocaleSwitch /></div>
            <button onClick={() => nav("/console")} className="hidden rounded-md border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex">{t("nav.login")}</button>
            <button onClick={() => nav("/console")} className="rounded-md bg-ink-900 px-3 py-2 text-[12.5px] font-semibold text-white transition hover:bg-ink-800 sm:px-4 sm:text-[13px]">{t("nav.access")}</button>
            {/* mobile menu toggle */}
            <button onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen}
              className="rounded-md border border-slate-300 p-2 text-slate-700 lg:hidden">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>
        {/* mobile nav panel */}
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map(([key, fallback, to]) => (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-[14px] font-medium ${active === fallback.toLowerCase() ? "bg-slate-100 font-semibold text-ink-900" : "text-slate-600"}`}>{t(key)}</Link>
              ))}
              <Link to="/console" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2.5 text-[14px] font-medium text-slate-600">{t("nav.login")}</Link>
            </nav>
            <div className="mt-3 flex items-center gap-3 border-t border-slate-100 px-3 pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t("nav.language")}</span>
              <LocaleSwitch />
            </div>
          </div>
        )}
      </header>

      {children}

      <footer className="border-t border-slate-200 bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1320px] px-6 py-10 lg:px-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <ExchangeLockup size={30} />
              <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-slate-500">{t("ft.tagline")}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[10.5px] text-slate-400">
                <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-emerald-500" /> {t("ft.soc")}</span>
                <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-emerald-500" /> {t("ft.audit")}</span>
                <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-emerald-500" /> {t("ft.ndagated")}</span>
              </div>
            </div>
            {([
              ["ft.exchange", [["nav.platform", "/platform"], ["nav.modules", "/modules"], ["nav.pricing", "/pricing"], ["nav.access", "/console"]]],
              ["ft.founders", [["ft.list", "/console"], ["ft.valuation", "/modules"], ["ft.plans", "/pricing"]]],
              ["ft.acquirers", [["ft.browse", "/console"], ["ft.buyeraccess", "/pricing"], ["ft.requestnda", "/console"]]],
            ] as Array<[string, Array<[string, string]>]>).map(([titleKey, links]) => (
              <div key={titleKey}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{t(titleKey)}</div>
                <ul className="mt-3 space-y-2 text-[13px]">
                  {links.map(([k, to]) => (
                    <li key={k + to}><Link to={to} className="text-slate-600 hover:text-ink-900">{t(k)}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="max-w-3xl text-[10.5px] leading-relaxed text-slate-400">{t("ft.legal")}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-[12px] text-slate-400">
              <div>© {new Date().getFullYear()} ExitOS — A Sovereign Infrastructure</div>
              <div className="flex items-center gap-4">
                <LocaleSwitch />
                <div className="font-mono uppercase tracking-[0.22em]">exit.sovereigndo.com</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

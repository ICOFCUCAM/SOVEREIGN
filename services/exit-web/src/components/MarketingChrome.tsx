import React from "react";
import { Link, useNavigate } from "react-router-dom";

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

const NAV: [string, string][] = [["Platform", "/platform"], ["Modules", "/modules"], ["Pricing", "/pricing"]];

export const MarketingChrome: React.FC<{ active?: string; children: React.ReactNode }> = ({ active, children }) => {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-ink-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-4 lg:px-10">
          <button onClick={() => nav("/")} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-900 text-xs font-black text-white">EX</div>
            <span className="text-lg font-bold tracking-tight text-ink-900">ExitOS</span>
          </button>
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map(([label, to]) => (
              <Link key={to} to={to} className={`text-[13px] font-medium transition ${active === label.toLowerCase() ? "font-semibold text-ink-900" : "text-slate-600 hover:text-ink-900"}`}>{label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => nav("/console")} className="rounded-md border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50">Log in</button>
            <button onClick={() => nav("/console")} className="rounded-md bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-ink-800">Launch ExitOS</button>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-slate-200 bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1320px] px-6 py-10 lg:px-10">
          <div className="grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink-900 text-xs font-black text-white">EX</div>
                <span className="text-lg font-bold tracking-tight">ExitOS</span>
              </div>
              <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-slate-500">The operating system for company sales — sourcing, diligence, negotiation and closing on one acquisition exchange.</p>
            </div>
            {[
              ["Product", [["Platform", "/platform"], ["Modules", "/modules"], ["Pricing", "/pricing"], ["Launch", "/console"]]],
              ["Company", [["Home", "/"], ["Pricing", "/pricing"]]],
              ["Get started", [["Log in", "/console"], ["Request a demo", "/pricing"]]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{title as string}</div>
                <ul className="mt-3 space-y-2 text-[13px]">
                  {(links as [string, string][]).map(([l, to]) => (
                    <li key={l + to}><Link to={to} className="text-slate-600 hover:text-ink-900">{l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 text-[12px] text-slate-400">
            <div>© {new Date().getFullYear()} ExitOS — A Sovereign Infrastructure</div>
            <div className="font-mono uppercase tracking-[0.22em]">exit.sovereigndo.com</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

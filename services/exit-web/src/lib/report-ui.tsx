import React from "react";
import { useNavigate } from "react-router-dom";

// ── INSTITUTIONAL PUBLISHING LAYER ──────────────────────────────────
// The shared vocabulary every ExitOS document is set in — cover, numbered
// sections, numbered exhibits, banking tables, executive stat blocks, running
// header/footer, confidentiality watermark and a print system that yields
// board-meeting-quality PDFs through the browser's vector engine. Presentation
// only: not one figure is computed here.

export const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];

// palette
const INK = "#0b1220", MUTE = "#5b6675", FAINT = "#9aa3b0", LINE = "#d8dee8", HAIR = "#eef1f5";
const GREEN = "#0e7a4f", NAVY = "#16314f", GOLD = "#8a6d3b";

export const ReportFrame: React.FC<{ docType: string; company: string; frameworkVersion: string; children: React.ReactNode }> = ({ docType, company, frameworkVersion, children }) => {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a1018] py-8">
      <style>{REPORT_CSS}</style>
      <div className="no-print mx-auto mb-5 flex max-w-[840px] items-center justify-between px-4">
        <button onClick={() => nav(-1)} className="rounded-md border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/5">← Back</button>
        <div className="text-[12px] text-white/45">{docType} · {company}</div>
        <button onClick={() => window.print()} className="rounded-md bg-deal-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-deal-500">Download PDF →</button>
      </div>
      <div className="rpt mx-auto max-w-[840px] bg-white text-[#0b1220] shadow-2xl shadow-black/50">
        <div className="rpt-fixed-header no-screen"><span>{company}</span><span>{docType}</span></div>
        <div className="rpt-fixed-footer no-screen"><span>ExitOS Advisory · Strictly Private &amp; Confidential</span><span>Framework v{frameworkVersion}</span></div>
        <div className="rpt-watermark no-screen">CONFIDENTIAL</div>
        {children}
      </div>
    </div>
  );
};

/** Premium cover — institutional hairline geometry, no stock photography. */
export const Cover: React.FC<{
  docType: string; company: string; preparedFor: string; preparedBy: string; date: string; frameworkVersion: string; classification?: string;
}> = ({ docType, company, preparedFor, preparedBy, date, frameworkVersion, classification = "Strictly Private & Confidential" }) => (
  <section className="rpt-cover relative flex min-h-[1040px] flex-col overflow-hidden px-16 py-20">
    {/* subtle hairline geometry */}
    <svg className="pointer-events-none absolute -right-40 -top-24 h-[640px] w-[640px]" viewBox="0 0 200 200" fill="none" aria-hidden>
      {[40, 62, 84].map((r) => <circle key={r} cx="150" cy="60" r={r} stroke={GREEN} strokeOpacity="0.06" strokeWidth="0.6" />)}
      <g stroke={NAVY} strokeOpacity="0.05" strokeWidth="0.5">{Array.from({ length: 14 }, (_, i) => <line key={i} x1={i * 16} y1="200" x2={i * 16 + 60} y2="0" />)}</g>
    </svg>
    <div className="relative flex items-center gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-[#0e7a4f] font-mono text-[14px] font-bold text-white">E</span>
      <span className="text-[12px] font-semibold uppercase tracking-[0.34em] text-[#0e7a4f]">ExitOS Acquisition Exchange</span>
    </div>
    <div className="relative mt-auto">
      <div className="text-[13px] font-semibold uppercase tracking-[0.28em] text-[#5b6675]">{docType}</div>
      <h1 className="mt-3 font-serif text-[54px] font-bold leading-[1.04] text-[#0b1220]">{company}</h1>
      <div className="mt-6 h-px w-28 bg-[#0e7a4f]" />
      <div className="mt-12 grid grid-cols-2 gap-y-6 text-[13px]">
        <CoverField k="Prepared for" v={preparedFor} />
        <CoverField k="Prepared by" v={preparedBy} />
        <CoverField k="Date" v={date} />
        <CoverField k="Framework" v={`ExitOS Valuation Framework v${frameworkVersion}`} />
      </div>
    </div>
    <div className="relative mt-auto flex items-end justify-between border-t border-[#d8dee8] pt-5">
      <span className="rounded-sm border border-[#c9b08a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a6d3b]">{classification}</span>
      <span className="text-[10px] text-[#9aa3b0]">This document is the property of ExitOS Advisory and may not be reproduced or distributed.</span>
    </div>
  </section>
);

const CoverField: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9aa3b0]">{k}</div>
    <div className="mt-1 text-[15px] font-medium text-[#0b1220]">{v}</div>
  </div>
);

export const Contents: React.FC<{ items: string[] }> = ({ items }) => (
  <Section n={null} title="Contents">
    <ol className="mt-2 divide-y divide-[#eef1f5]">
      {items.map((s, i) => (
        <li key={s} className="flex items-baseline gap-3 py-2.5 text-[13.5px]">
          <span className="w-9 font-mono font-semibold text-[#0e7a4f]">{ROMAN[i + 1]}</span>
          <span className="font-medium text-[#0b1220]">{s}</span>
          <span className="mx-2 flex-1 border-b border-dotted border-[#c8cfda]" />
        </li>
      ))}
    </ol>
  </Section>
);

/** A formal "List of Exhibits" register — exhibit number + caption. */
export const ListOfExhibits: React.FC<{ items: { n: string; title: string }[] }> = ({ items }) => (
  <Section n={null} title="List of Exhibits">
    <ol className="mt-2 divide-y divide-[#eef1f5]">
      {items.map((e) => (
        <li key={e.n} className="flex items-baseline gap-3 py-2 text-[12.5px]">
          <span className="w-20 shrink-0 font-mono font-semibold text-[#0e7a4f]">Exhibit {e.n}</span>
          <span className="font-medium text-[#0b1220]">{e.title}</span>
          <span className="mx-2 flex-1 border-b border-dotted border-[#c8cfda]" />
        </li>
      ))}
    </ol>
  </Section>
);

/** A cross-reference to a numbered exhibit, e.g. (see Exhibit IV-A). */
export const ExhibitRef: React.FC<{ n: string }> = ({ n }) => (
  <span className="whitespace-nowrap font-medium text-[#0e7a4f]">Exhibit {n}</span>
);

export const Section: React.FC<{ n: number | null; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="rpt-section px-16 py-12">
    <div className="mb-6 border-b-2 border-[#0b1220] pb-2.5">
      {n != null && <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#0e7a4f]">Section {ROMAN[n]}</div>}
      <h2 className="mt-1 font-serif text-[24px] font-bold uppercase tracking-[0.015em] text-[#0b1220]">{title}</h2>
    </div>
    {children}
  </section>
);

/** A numbered, captioned exhibit frame. */
export const Exhibit: React.FC<{ n: string; title: string; children: React.ReactNode; source?: string }> = ({ n, title, children, source }) => (
  <figure className="avoid-break my-5">
    <figcaption className="mb-2 flex items-baseline gap-2 border-b border-[#0b1220] pb-1">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0e7a4f]">Exhibit {n}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5b6675]">{title}</span>
    </figcaption>
    {children}
    {source && <div className="mt-1.5 text-[9.5px] italic text-[#9aa3b0]">Source: {source}</div>}
  </figure>
);

export interface BankColumn { key: string; label: string; align?: "left" | "right" | "center" }
/** A research-grade table — heavy header rule, hairline rows, tabular numerics. */
export const BankTable: React.FC<{ columns: BankColumn[]; rows: Record<string, React.ReactNode>[]; footnote?: React.ReactNode; emphasizeFirst?: boolean }> = ({ columns, rows, footnote, emphasizeFirst = true }) => (
  <div className="avoid-break">
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr className="border-b-2 border-[#0b1220] text-[9.5px] uppercase tracking-[0.08em] text-[#5b6675]">
          {columns.map((c) => <th key={c.key} className={`py-2 ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left"} ${c.align === "right" ? "pl-2" : "pr-2"}`}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={`border-b border-[#eef1f5] ${i % 2 === 1 ? "bg-[#fafbfc]" : ""}`}>
            {columns.map((c, j) => (
              <td key={c.key} className={`py-1.5 ${c.align === "right" ? "tnum text-right pl-2" : c.align === "center" ? "text-center" : "pr-2"} ${j === 0 && emphasizeFirst ? "font-medium text-[#0b1220]" : c.align === "right" ? "font-mono text-[#0b1220]" : "text-[#2b3543]"}`}>{row[c.key]}</td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={columns.length} className="py-3 text-[#9aa3b0]">No data indexed.</td></tr>}
      </tbody>
    </table>
    {footnote && <div className="mt-2 text-[10px] leading-relaxed text-[#9aa3b0]">{footnote}</div>}
  </div>
);

export const StatGrid: React.FC<{ cols?: 3 | 4 | 5; children: React.ReactNode }> = ({ cols = 3, children }) => (
  <div className={`grid gap-px overflow-hidden rounded-sm border border-[#e3e8ef] bg-[#e3e8ef] ${cols === 5 ? "grid-cols-2 sm:grid-cols-5" : cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>{children}</div>
);

export const Stat: React.FC<{ label: string; value: string; sub?: string; hero?: boolean }> = ({ label, value, sub, hero }) => (
  <div className="bg-white px-4 py-3.5">
    <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#5b6675]">{label}</div>
    <div className={`tnum mt-1 font-mono font-bold text-[#0b1220] ${hero ? "text-[26px] text-[#0e7a4f]" : "text-[18px]"}`}>{value}</div>
    {sub && <div className="text-[10.5px] text-[#9aa3b0]">{sub}</div>}
  </div>
);

export const Lead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mb-4 text-[13.5px] leading-relaxed text-[#2b3543]">{children}</p>
);
export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-2 text-[11px] leading-relaxed text-[#9aa3b0]">{children}</p>
);

export const PALETTE = { INK, MUTE, FAINT, LINE, HAIR, GREEN, NAVY, GOLD };

export const REPORT_CSS = `
.rpt { position: relative; font-feature-settings: "tnum" 1, "lnum" 1; }
.rpt h1, .rpt h2, .rpt .font-serif { font-family: "Source Serif 4", Georgia, "Times New Roman", serif; font-feature-settings: "lnum" 1; }
.rpt h1 { letter-spacing: -0.012em; }
.tnum { font-variant-numeric: tabular-nums lining-nums; }
.no-screen { display: none; }
.rpt-watermark { display: none; }
@media print {
  @page { size: A4; margin: 18mm 15mm 20mm; }
  @page { @bottom-center { content: "ExitOS Advisory  ·  Strictly Private & Confidential"; font-size: 8px; color: #9aa3b0; } @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 8px; color: #9aa3b0; } }
  html, body { background: #ffffff !important; }
  .no-print { display: none !important; }
  .rpt { box-shadow: none !important; max-width: none !important; width: 100% !important; margin: 0 !important; }
  .rpt-section, .rpt-cover { break-before: page; }
  .rpt-cover { break-before: avoid; break-after: page; min-height: 0 !important; }
  .avoid-break { break-inside: avoid; }
  tr, figure { break-inside: avoid; }
  h2, h3 { break-after: avoid; }
  .no-screen { display: flex; }
  .rpt-fixed-header { position: fixed; top: 0; left: 0; right: 0; justify-content: space-between; font-size: 8.5px; letter-spacing: .08em; text-transform: uppercase; color: #9aa3b0; padding: 5mm 15mm 0; }
  .rpt-fixed-footer { position: fixed; bottom: 0; left: 0; right: 0; justify-content: space-between; font-size: 8.5px; color: #9aa3b0; padding: 0 15mm 5mm; border-top: 1px solid #e3e8ef; }
  .rpt-watermark { display: block; position: fixed; top: 44%; left: 0; right: 0; text-align: center; font-size: 104px; font-weight: 800; letter-spacing: .3em; color: rgba(14,122,79,0.045); transform: rotate(-26deg); }
}
`;

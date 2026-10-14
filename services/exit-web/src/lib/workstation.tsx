import React from "react";
import { useLocation } from "react-router-dom";
import type { TapeItem, TapeKind } from "./market-tape";
import { LAYERS, activeLayer } from "../components/LayerBar";

// ── WORKSTATION PRIMITIVES ──────────────────────────────────────────
// The shared vocabulary that makes a screen read as one instrument — a deal
// command center — instead of a page of floating cards. Hairline-separated
// panels in a single bordered frame, a command bar with a live status strip,
// dense mono numerics. Used by the Terminal, Buyer Graph, Acquisition Radar
// and Founder Inbox so an operator moving between them stays in one cockpit.

/** A hairline-framed panel — the building block of every workstation grid. */
export const Panel: React.FC<{
  title: string; right?: React.ReactNode; children: React.ReactNode; className?: string; foot?: React.ReactNode;
}> = ({ title, right, children, className = "", foot }) => (
  <section className={`flex min-h-0 flex-col bg-xo-panel ${className}`}>
    <header className="flex items-center justify-between gap-2 border-b border-xo-line px-3 py-1.5">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-xo-verified/90">{title}</span>
      {right}
    </header>
    <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    {foot && <div className="border-t border-xo-line px-3 py-1.5 text-[9px] leading-tight text-xo-faint">{foot}</div>}
  </section>
);

/** A status cell — a tiny uppercase label over a mono value. */
export const Cell: React.FC<{ k: string; v: React.ReactNode; accent?: boolean; sub?: React.ReactNode }> = ({ k, v, accent, sub }) => (
  <div className="px-3 py-2">
    <div className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-xo-faint">{k}</div>
    <div className={`mt-0.5 font-mono text-[15px] font-bold leading-none tabular-nums ${accent ? "text-xo-verified" : "text-xo-text"}`}>{v}</div>
    {sub && <div className="mt-1 truncate text-[9px] uppercase tracking-wide text-xo-faint">{sub}</div>}
  </div>
);

/** The bordered, hairline-gapped grid container that holds Panels. */
export const Frame: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`relative z-[1] grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-xo-line bg-xo-raise shadow-[0_1px_0_rgba(60,45,20,0.06)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)] lg:grid-cols-12 ${className}`}>
    {children}
  </div>
);

/** A vertical rail — a hairline-gapped column that stacks Panels into one
 *  intelligence rail or action rail. Drop into a Frame with a col-span. */
export const Rail: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`flex flex-col gap-px bg-xo-raise ${className}`}>{children}</div>
);

// ── LIVE MARKET TAPE ────────────────────────────────────────────────
const TAPE_KIND: Record<TapeKind, { c: string; l: string }> = {
  ACQ:     { c: "text-xo-verified",    l: "ACQ" },
  BUYER:   { c: "text-sky-300",     l: "BUY" },
  SECTOR:  { c: "text-amber-300",   l: "SEC" },
  MANDATE: { c: "text-emerald-300", l: "LIVE" },
};

/** A continuous ticker of real market activity — the pulse of the desk. */
export const MarketTape: React.FC<{ items: TapeItem[] }> = ({ items }) => {
  if (!items.length) return null;
  const Track: React.FC<{ k: string }> = ({ k }) => (
    <>
      {items.map((it, i) => (
        <span key={`${k}-${i}`} className="inline-flex items-center gap-1.5 px-3 text-[11px]">
          <span className={`font-bold ${TAPE_KIND[it.kind].c}`}>{TAPE_KIND[it.kind].l}</span>
          <span className="text-xo-muted">{it.label}</span>
          {it.value && <span className={it.dir === "up" ? "font-mono text-xo-verified" : it.dir === "down" ? "font-mono text-xo-risk" : "font-mono text-xo-faint"}>{it.dir === "up" ? "▲" : it.dir === "down" ? "▼" : ""}{it.value}</span>}
          <span className="px-1 text-xo-faint">│</span>
        </span>
      ))}
    </>
  );
  return (
    <div className="relative overflow-hidden rounded-lg border border-xo-line bg-xo-panel">
      <div className="absolute inset-y-0 left-0 z-10 flex items-center gap-1.5 bg-xo-panel px-3 ring-1 ring-xo-line">
        <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-deal-400 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-deal-400" /></span>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-xo-verified">Tape</span>
      </div>
      <div className="overflow-hidden py-1.5 pl-16">
        <div className="ex-ticker flex w-max whitespace-nowrap"><Track k="a" /><Track k="b" /></div>
      </div>
    </div>
  );
};

// ── COMMAND STATE ───────────────────────────────────────────────────
// The four questions every workstation must answer, as one bordered strip:
// what IS happening, what CHANGED, what to DO, what to EXPECT. Color-coded
// quadrants so the eye reads state → change → action → outcome left to right.
export const CommandState: React.FC<{
  current: React.ReactNode;
  changes: React.ReactNode;
  action: React.ReactNode;
  outcome: React.ReactNode;
}> = ({ current, changes, action, outcome }) => {
  const cells: { k: string; tone: string; body: React.ReactNode }[] = [
    { k: "Current state", tone: "text-xo-faint", body: current },
    { k: "Recent changes", tone: "text-amber-300/80", body: changes },
    { k: "Recommended action", tone: "text-xo-verified", body: action },
    { k: "Expected outcome", tone: "text-sky-300/80", body: outcome },
  ];
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-xo-line bg-xo-raise sm:grid-cols-2 lg:grid-cols-4">
      {cells.map((c) => (
        <div key={c.k} className="bg-xo-panel px-3 py-2">
          <div className={`text-[8.5px] font-semibold uppercase tracking-[0.18em] ${c.tone}`}>{c.k}</div>
          <div className="mt-1 text-[12px] leading-snug text-xo-text">{c.body}</div>
        </div>
      ))}
    </div>
  );
};

// ── EVIDENCE OVERLAY ────────────────────────────────────────────────
// A floating evidence panel attached to any figure. Hover or focus reveals
// its source, methodology and confidence — the spatial-intelligence rule:
// no important metric without traceable evidence. Opens downward so it reads
// inside tall panel bodies.
export interface EvidenceMeta {
  source?: string;
  methodology?: string;
  confidence?: string;
  sample?: number;
  asOf?: string;
}
export const Evidence: React.FC<{ meta: EvidenceMeta; children: React.ReactNode; className?: string; align?: "left" | "right" }> = ({ meta, children, className = "", align = "left" }) => (
  <span tabIndex={0} className={`group/ev relative inline-flex cursor-help items-center gap-0.5 outline-none ${className}`}>
    {children}
    <span className="text-[8px] leading-none text-xo-faint transition group-hover/ev:text-xo-verified group-focus/ev:text-xo-verified">ⓘ</span>
    <span className={`absolute hidden ${align === "right" ? "right-0" : "left-0"} top-full z-[60] mt-1 w-60 max-w-[calc(100vw-2rem)] rounded-md border border-xo-line bg-xo-ink p-2.5 text-left shadow-xl shadow-black/60 backdrop-blur group-hover/ev:block group-focus/ev:block`}>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-xo-verified">Evidence</span>
      {meta.methodology && <span className="mt-1 block text-[11px] leading-snug text-xo-text">{meta.methodology}</span>}
      <span className="mt-1.5 block space-y-0.5 text-[11px] text-xo-muted">
        {meta.source && <span className="block">source · {meta.source}</span>}
        {meta.confidence && <span className="block">confidence · {meta.confidence}{meta.sample != null ? ` (n=${meta.sample})` : ""}</span>}
        {meta.asOf && <span className="block">as of {meta.asOf}</span>}
      </span>
    </span>
  </span>
);

export interface MetricCell { k: string; v: React.ReactNode; accent?: boolean; sub?: React.ReactNode }

const STRIP_COLS: Record<number, string> = {
  2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4",
  5: "lg:grid-cols-5", 6: "lg:grid-cols-6", 7: "lg:grid-cols-7", 8: "lg:grid-cols-8",
};

/** The command bar — mandate identity, a firmographics line and a mono
 *  metrics strip. The operational replacement for a marketing hero header. */
export const CommandHeader: React.FC<{
  kicker?: string;
  title: string;
  tag?: string;
  status?: string;
  meta?: { k: string; v: React.ReactNode }[];
  metrics?: MetricCell[];
  note?: React.ReactNode;
  right?: React.ReactNode;
}> = ({ kicker = "◉ Mandate", title, tag, status, meta = [], metrics = [], note, right }) => {
  const { pathname } = useLocation();
  const layer = LAYERS.find((l) => l.key === activeLayer(pathname));
  return (
  <div className="overflow-hidden rounded-lg border border-xo-line">
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-gradient-to-r from-deal-600/15 via-ink-900 to-ink-900 px-4 py-2.5">
      <div className="flex flex-wrap items-baseline gap-3">
        {layer && <span className="rounded bg-xo-raise px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wide text-xo-verified/80 ring-1 ring-xo-line" title={`${layer.label} layer`}>L{layer.roman}</span>}
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-xo-verified/80">{kicker}</span>
        <span className="font-mono text-[18px] font-bold tracking-tight text-xo-text">{title}</span>
        {tag && <span className="rounded bg-xo-raise px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-xo-muted ring-1 ring-xo-line">{tag}</span>}
        {status && <span className="rounded bg-xo-verified/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-xo-verified ring-1 ring-xo-action/30">{status}</span>}
      </div>
      {right ?? (meta.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-xo-muted">
          {meta.map((m, i) => (
            <React.Fragment key={m.k}>
              {i > 0 && <span className="text-xo-faint">│</span>}
              <span>{m.k} <span className="font-bold text-xo-text">{m.v}</span></span>
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>

    {metrics.length > 0 && (
      <div className={`grid grid-cols-2 gap-px border-t border-xo-line bg-xo-raise sm:grid-cols-4 ${STRIP_COLS[metrics.length] ?? "lg:grid-cols-6"}`}>
        {metrics.map((c) => <div key={c.k} className="bg-xo-panel"><Cell {...c} /></div>)}
      </div>
    )}

    {note && <div className="border-t border-xo-line bg-xo-panel px-4 py-2 text-[12.5px] text-xo-muted">{note}</div>}
  </div>
  );
};

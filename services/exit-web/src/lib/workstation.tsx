import React from "react";

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
  <section className={`flex min-h-0 flex-col bg-ink-900 ${className}`}>
    <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-deal-300/90">{title}</span>
      {right}
    </header>
    <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    {foot && <div className="border-t border-white/10 px-3 py-1.5 text-[9px] leading-tight text-white/35">{foot}</div>}
  </section>
);

/** A status cell — a tiny uppercase label over a mono value. */
export const Cell: React.FC<{ k: string; v: React.ReactNode; accent?: boolean; sub?: React.ReactNode }> = ({ k, v, accent, sub }) => (
  <div className="px-3 py-2">
    <div className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-white/40">{k}</div>
    <div className={`mt-0.5 font-mono text-[15px] font-bold leading-none tabular-nums ${accent ? "text-deal-300" : "text-white"}`}>{v}</div>
    {sub && <div className="mt-1 truncate text-[9px] uppercase tracking-wide text-white/35">{sub}</div>}
  </div>
);

/** The bordered, hairline-gapped grid container that holds Panels. */
export const Frame: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 lg:grid-cols-12 ${className}`}>
    {children}
  </div>
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
}> = ({ kicker = "◉ Mandate", title, tag, status, meta = [], metrics = [], note, right }) => (
  <div className="overflow-hidden rounded-lg border border-white/10">
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-gradient-to-r from-deal-600/15 via-ink-900 to-ink-900 px-4 py-2.5">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-deal-300/80">{kicker}</span>
        <span className="font-mono text-[18px] font-bold tracking-tight text-white">{title}</span>
        {tag && <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/65 ring-1 ring-white/10">{tag}</span>}
        {status && <span className="rounded bg-deal-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-deal-300 ring-1 ring-deal-400/30">{status}</span>}
      </div>
      {right ?? (meta.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-white/55">
          {meta.map((m, i) => (
            <React.Fragment key={m.k}>
              {i > 0 && <span className="text-white/15">│</span>}
              <span>{m.k} <span className="font-bold text-white/85">{m.v}</span></span>
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>

    {metrics.length > 0 && (
      <div className={`grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-4 ${STRIP_COLS[metrics.length] ?? "lg:grid-cols-6"}`}>
        {metrics.map((c) => <div key={c.k} className="bg-ink-900"><Cell {...c} /></div>)}
      </div>
    )}

    {note && <div className="border-t border-white/10 bg-ink-900 px-4 py-2 text-[12.5px] text-white/70">{note}</div>}
  </div>
);

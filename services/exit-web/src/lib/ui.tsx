import React from "react";

// ExitOS shared UI primitives. Buttons, cards, inputs, stage badges. Keep
// in sync with the dispatch-web/lib/ui.tsx vocabulary so operators moving
// between consoles see consistent controls.

export type DealStage =
  | "sourcing"
  | "engaged"
  | "diligence"
  | "loi"
  | "signed"
  | "closed"
  | "dead";

const STAGE_STYLE: Record<DealStage, string> = {
  sourcing:  "bg-stage-sourcing/15 text-stage-sourcing ring-1 ring-stage-sourcing/30",
  engaged:   "bg-stage-engaged/15 text-stage-engaged ring-1 ring-stage-engaged/40",
  diligence: "bg-stage-diligence/15 text-stage-diligence ring-1 ring-stage-diligence/40",
  loi:       "bg-stage-loi/15 text-stage-loi ring-1 ring-stage-loi/40",
  signed:    "bg-stage-signed/15 text-stage-signed ring-1 ring-stage-signed/40",
  closed:    "bg-stage-closed/20 text-stage-closed ring-1 ring-stage-closed/40",
  dead:      "bg-stage-dead/15 text-stage-dead ring-1 ring-stage-dead/30",
};

export const STAGE_ORDER: readonly DealStage[] = [
  "sourcing", "engaged", "diligence", "loi", "signed", "closed",
];

export const StageBadge: React.FC<{ stage: DealStage }> = ({ stage }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STAGE_STYLE[stage]}`}>
    {stage}
  </span>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = "", id }) => (
  <div id={id} className={`rounded-lg border border-white/10 bg-ink-800/60 ${className}`}>{children}</div>
);

export const Kpi: React.FC<{ label: string; value: string; sub?: string; accent?: string }> = ({ label, value, sub, accent }) => (
  <Card className="p-5">
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</div>
    <div className="mt-2 text-3xl font-bold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
    {sub && <div className="mt-1 text-[11px] text-white/45">{sub}</div>}
  </Card>
);

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "ok" }
> = ({ variant = "primary", className = "", ...p }) => {
  const v = {
    primary: "bg-deal-600 hover:bg-deal-500 text-white",
    ghost:   "bg-transparent hover:bg-white/5 text-white/80 ring-1 ring-white/15",
    danger:  "bg-red-600 hover:bg-red-500 text-white",
    ok:      "bg-deal-600 hover:bg-deal-500 text-white",
  }[variant];
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${v} ${className}`}
    />
  );
};

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-white/40">{hint}</span>}
  </label>
);

export const inputCls =
  "w-full rounded-md border border-white/15 bg-ink-900/70 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-deal-400 focus:ring-1 focus:ring-deal-400/50";

export const SectionHeader: React.FC<{ kicker: string; title: string; description?: string; actions?: React.ReactNode }> = ({ kicker, title, description, actions }) => (
  <div className="mb-8 flex items-end justify-between gap-6">
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-deal-400">{kicker}</div>
      <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-white sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </div>
);

export function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function fmtMoney(n?: number | null, currency = "USD"): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

// Confidence chip — surfaces the sample size and tier behind every
// statistic. "75% close rate (n=24)" reads very differently from
// "100% close rate (n=1)"; this primitive enforces the distinction
// everywhere stats are quoted.
type ConfidenceTier = "experimental" | "low" | "medium" | "high";
const CONF_STYLE: Record<ConfidenceTier, string> = {
  experimental: "bg-white/5 text-white/40 ring-white/10",
  low:          "bg-loi-500/15 text-loi-300 ring-loi-400/30",
  medium:       "bg-stage-engaged/15 text-stage-engaged ring-stage-engaged/30",
  high:         "bg-deal-600/25 text-deal-200 ring-deal-500/40",
};
const CONF_LABEL: Record<ConfidenceTier, string> = {
  experimental: "Exp.", low: "Low", medium: "Med.", high: "High",
};

export const ConfidenceChip: React.FC<{ tier: ConfidenceTier; sample?: number; compact?: boolean; title?: string }> = ({ tier, sample, compact = false, title }) => (
  <span
    title={title ?? `${CONF_LABEL[tier]} confidence${sample != null ? ` · n=${sample}` : ""}`}
    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono font-bold uppercase tracking-wider ring-1 ${CONF_STYLE[tier]} ${compact ? "text-[8.5px]" : "text-[9.5px]"}`}
  >
    {sample != null && <span className="opacity-80">n={sample}</span>}
    <span>{CONF_LABEL[tier]}</span>
  </span>
);

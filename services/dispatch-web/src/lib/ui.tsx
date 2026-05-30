import React from "react";
import type { Lifecycle } from "./api";

// Classification banding — Dispatch is classification-forward: every document
// row/card carries a visible marking. Maps free-text levels onto a colour band.
export function classBand(level?: string): { label: string; cls: string } {
  const l = (level || "UNCLASSIFIED").toUpperCase();
  if (/TOP[\s_-]?SECRET|COSMIC/.test(l)) return { label: l, cls: "bg-cls-topsecret" };
  if (/SECRET/.test(l)) return { label: l, cls: "bg-cls-secret" };
  if (/SENSITIVE|CONFIDENTIAL|RESTRICTED/.test(l)) return { label: l, cls: "bg-cls-sensitive" };
  if (/OFFICIAL/.test(l)) return { label: l, cls: "bg-cls-official" };
  return { label: l || "UNCLASSIFIED", cls: "bg-cls-unclassified" };
}

export const ClassBadge: React.FC<{ level?: string; scheme?: string }> = ({ level, scheme }) => {
  const b = classBand(level);
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white ${b.cls}`} title={scheme ? `scheme: ${scheme}` : undefined}>
      {b.label}
    </span>
  );
};

const LIFECYCLE_STYLE: Record<Lifecycle, string> = {
  draft: "bg-ink-600 text-white/70",
  submitted: "bg-seal-light/20 text-seal-light",
  in_review: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
  rendered: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  published: "bg-emerald-600/20 text-emerald-200 ring-1 ring-emerald-400/40",
  withdrawn: "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30",
  archived: "bg-zinc-700/40 text-zinc-400",
};

export const LifecycleBadge: React.FC<{ state: Lifecycle }> = ({ state }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${LIFECYCLE_STYLE[state] ?? "bg-ink-600 text-white/70"}`}>
    {state.replace(/_/g, " ")}
  </span>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`rounded-lg border border-white/10 bg-ink-800/60 ${className}`}>{children}</div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "ok" }> = ({ variant = "primary", className = "", ...p }) => {
  const v = {
    primary: "bg-seal hover:bg-seal-light text-white",
    ghost: "bg-transparent hover:bg-white/5 text-white/80 ring-1 ring-white/15",
    danger: "bg-cls-secret hover:opacity-90 text-white",
    ok: "bg-emerald-600 hover:bg-emerald-500 text-white",
  }[variant];
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${v} ${className}`} />;
};

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-white/40">{hint}</span>}
  </label>
);

export const inputCls = "w-full rounded-md border border-white/15 bg-ink-900/70 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-seal-light focus:ring-1 focus:ring-seal-light/50";

export function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

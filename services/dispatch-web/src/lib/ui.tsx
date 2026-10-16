import React from "react";
import type { Lifecycle } from "./api";
import { GOLD, GOLD_FOCUS, PANEL, Hairline } from "../components/premium";

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

// Light text on a dark chip with the band as an edge cue: the previous white-on-
// band chip failed WCAG AA on the amber "sensitive" band (≈3.2:1).
export const ClassBadge: React.FC<{ level?: string; scheme?: string }> = ({ level, scheme }) => {
  const b = classBand(level);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-[#263548] bg-[#0d1520] py-[3px] pl-1.5 pr-2 text-[10.5px] font-bold uppercase leading-none tracking-[0.08em] text-[#edf2f8]" title={scheme ? `scheme: ${scheme}` : undefined}>
      <span aria-hidden className={`h-2.5 w-1 rounded-sm ${b.cls}`} />
      <span className="sr-only">Classification: </span>{b.label}
    </span>
  );
};

const LIFECYCLE_STYLE: Record<Lifecycle, string> = {
  draft: "bg-ink-600 text-white/80",
  submitted: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  in_review: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
  rendered: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  published: "bg-emerald-600/20 text-emerald-200 ring-1 ring-emerald-400/40",
  withdrawn: "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30",
  archived: "bg-zinc-700/40 text-zinc-400",
};

// Governance-forward labels. The platform sells governance, so the lifecycle
// reads in that language — never raw engine states ("rendered", "in_review").
const LIFECYCLE_LABEL: Record<Lifecycle, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  // The engine sends a RETURN to "draft"; "rejected" is a rejection. Distinct.
  rejected: "Rejected",
  rendered: "Ready to publish",
  published: "Published",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

export const LifecycleBadge: React.FC<{ state: Lifecycle }> = ({ state }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${LIFECYCLE_STYLE[state] ?? "bg-ink-600 text-white/70"}`}>
    {LIFECYCLE_LABEL[state] ?? state.replace(/_/g, " ")}
  </span>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`relative rounded-xl border border-[#263548] ${PANEL} ${className}`}><Hairline />{children}</div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "ok" }> = ({ variant = "primary", className = "", ...p }) => {
  const v = {
    primary: GOLD,
    ghost: "bg-transparent hover:bg-white/5 text-white/85 ring-1 ring-[#35465d]",
    danger: "bg-[#5c2328] hover:bg-[#6b2a30] text-white ring-1 ring-[#8a3a41]",
    ok: "bg-[#1f5c45] hover:bg-[#24694f] text-white ring-1 ring-[#2f7d5f]",
  }[variant];
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${v} ${className}`} />;
};

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-white/55">{hint}</span>}
  </label>
);

export const inputCls = `w-full rounded-lg border border-[#263548] bg-[#0d1520] px-3 py-2 text-sm text-white placeholder-[#7f8ea3] transition ${GOLD_FOCUS}`;

export function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

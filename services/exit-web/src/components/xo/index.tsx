import React, { useId } from "react";
import { Link } from "react-router-dom";

// ── ACQUISITION INTELLIGENCE WORKSTATION — the ExitOS design system ──
// Institutional primitives adopted one page at a time (Terminal first). They
// sit beside the older `lib/workstation.tsx` primitives rather than replacing
// them, so pages that have not been redesigned yet do not change.
//
// Rules the components encode:
//  • Every figure carries its provenance (Provenance badge) — verified
//    registry record, model-derived, assumption/prior, company-provided,
//    demo fixture or snapshot. Nothing is styled as "live".
//  • Every bar has a numeric label; colour is never the only signal.
//  • Every titled region is a landmark with a real heading.
//  • Scrollable regions are keyboard-focusable.

export type ProvenanceKind = "verified" | "registry" | "model" | "prior" | "company" | "demo" | "snapshot";

const PROVENANCE: Record<ProvenanceKind, { label: string; cls: string; title: string }> = {
  verified: { label: "Verified", cls: "border-xo-verified/40 text-xo-verified", title: "Registry record with a verified source" },
  registry: { label: "Registry", cls: "border-xo-line text-xo-muted", title: "Derived from the indexed acquisition registry" },
  model:    { label: "Model", cls: "border-xo-action/40 text-xo-action", title: "Computed by the valuation framework from the inputs shown" },
  prior:    { label: "Prior", cls: "border-xo-caution/50 text-xo-caution", title: "Not disclosed — a labelled neutral assumption is used" },
  company:  { label: "Your intake", cls: "border-xo-brass/50 text-xo-brass", title: "Provided by you through Value My Company" },
  demo:     { label: "Demo data", cls: "border-xo-caution/50 text-xo-caution", title: "Sample company — not your data" },
  snapshot: { label: "Snapshot", cls: "border-xo-line text-xo-muted", title: "Bundled registry snapshot — not a live feed" },
};

export const Provenance: React.FC<{ kind: ProvenanceKind; children?: React.ReactNode; className?: string }> = ({ kind, children, className = "" }) => {
  const p = PROVENANCE[kind];
  return (
    <span title={p.title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.08em] ${p.cls} ${className}`}>
      {children ?? p.label}
    </span>
  );
};

/** A titled region: a landmark <section> labelled by a real heading. */
export const Section: React.FC<{
  title: string;
  eyebrow?: string;
  right?: React.ReactNode;
  foot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tone?: "ink" | "paper";
  level?: 2 | 3;
}> = ({ title, eyebrow, right, foot, children, className = "", tone = "ink", level = 2 }) => {
  const id = useId();
  const H = level === 2 ? "h2" : "h3";
  const paper = tone === "paper";
  return (
    <section aria-labelledby={id} className={`flex min-w-0 flex-col ${paper ? "bg-xo-paper text-xo-paper-text" : "bg-xo-panel text-xo-text"} ${className}`}>
      <header className={`flex flex-wrap items-end justify-between gap-x-3 gap-y-1 border-b px-4 pb-2 pt-3 ${paper ? "border-xo-paper-line" : "border-xo-line"}`}>
        <div className="min-w-0">
          {eyebrow && <div className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${paper ? "text-xo-paper-muted" : "text-xo-faint"}`}>{eyebrow}</div>}
          <H id={id} className={`text-[14px] font-semibold tracking-tight ${paper ? "text-xo-paper-text" : "text-xo-text"}`}>{title}</H>
        </div>
        {right && <div className="flex items-center gap-2 text-[11px]">{right}</div>}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
      {foot && <div className={`border-t px-4 py-2 text-[11px] leading-snug ${paper ? "border-xo-paper-line text-xo-paper-muted" : "border-xo-line text-xo-faint"}`}>{foot}</div>}
    </section>
  );
};

/** A horizontally scrollable region that keyboard users can reach. */
export const ScrollRegion: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = "" }) => (
  <div role="region" aria-label={label} tabIndex={0} className={`relative overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xo-action ${className}`}>
    {children}
  </div>
);

/** A decision metric: label, tabular value, a qualifier line and provenance. */
export const Metric: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  provenance?: ProvenanceKind;
  emphasis?: boolean;
}> = ({ label, value, sub, provenance, emphasis }) => (
  <div className="min-w-0 px-4 py-3">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-medium text-xo-muted">{label}</span>
      {provenance && <Provenance kind={provenance} />}
    </div>
    <div className={`mt-1 font-mono font-semibold leading-none tabular-nums ${emphasis ? "text-[22px] text-xo-text" : "text-[18px] text-xo-text"}`}>{value}</div>
    {sub && <div className="mt-1.5 text-[11px] leading-snug text-xo-faint">{sub}</div>}
  </div>
);

/** A bar that always carries its number. Decorative fill is aria-hidden; the
 *  value is in text, so colour is never the only signal. */
export const Bar: React.FC<{ value: number; max?: number; label?: string; tone?: "verified" | "action" | "brass"; width?: string }> = ({ value, max = 100, label, tone = "verified", width = "w-16" }) => {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const fill = tone === "action" ? "bg-xo-action" : tone === "brass" ? "bg-xo-brass" : "bg-xo-verified";
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className={`inline-block h-1.5 ${width} overflow-hidden rounded-full bg-xo-line`}>
        <span className={`block h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
      </span>
      {label != null && <span className="font-mono text-[12px] tabular-nums text-xo-text">{label}</span>}
    </span>
  );
};

/** A disclosure toggle with the state announced to assistive technology. */
export const Disclosure: React.FC<{ open: boolean; onToggle: () => void; controls: string; children: React.ReactNode; className?: string }> = ({ open, onToggle, controls, children, className = "" }) => (
  <button type="button" aria-expanded={open} aria-controls={controls} onClick={onToggle}
    className={`inline-flex items-center gap-1 rounded-sm px-1 text-[11px] font-medium text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action ${className}`}>
    {children}
    <span aria-hidden className={`inline-block transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
  </button>
);

/** A text action link in the semantic action colour. */
export const ActionLink: React.FC<{ to: string; children: React.ReactNode; className?: string }> = ({ to, children, className = "" }) => (
  <Link to={to} className={`rounded-sm font-medium text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action ${className}`}>
    {children}
  </Link>
);

/** A term/definition row for evidence and provenance lists. */
export const Fact: React.FC<{ k: string; v: React.ReactNode; tone?: "ink" | "paper" }> = ({ k, v, tone = "ink" }) => (
  <div className="flex items-baseline justify-between gap-3 py-1">
    <dt className={`text-[11px] ${tone === "paper" ? "text-xo-paper-muted" : "text-xo-faint"}`}>{k}</dt>
    <dd className={`text-right font-mono text-[12px] tabular-nums ${tone === "paper" ? "text-xo-paper-text" : "text-xo-text"}`}>{v}</dd>
  </div>
);

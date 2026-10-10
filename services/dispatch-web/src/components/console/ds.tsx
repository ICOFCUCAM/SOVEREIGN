import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Lifecycle } from "../../lib/api";
import { classBand } from "../../lib/ui";
import { Icon } from "./icons";

// ═══ Sovereign Dispatch — Operations console design system ═════════════════
// One vocabulary for every Operations screen: page headers, sections, panels,
// buttons, status, classification, metrics, evidence values, dialogs and states.
// Colour is never the only carrier of meaning — every status has a text label and
// a glyph; every icon-only control has an accessible name.

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

// ── Layout ──────────────────────────────────────────────────────────────────
export const PageHeader: React.FC<{
  eyebrow: string; title: React.ReactNode; description?: React.ReactNode;
  meta?: React.ReactNode; actions?: React.ReactNode; serif?: boolean;
}> = ({ eyebrow, title, description, meta, actions, serif = true }) => (
  <header className="mb-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-sd-line pb-3">
      <span className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-sd-text3">
        <span aria-hidden className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full border border-sd-gold/60"><span className="h-1 w-1 rounded-full bg-sd-gold" /></span>
        {eyebrow}
      </span>
      {meta && <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.06em] text-sd-text3">{meta}</div>}
    </div>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className={cx("text-[26px] leading-[1.15] tracking-[-0.02em] text-sd-text sm:text-[30px]", serif ? "font-serif font-semibold" : "font-semibold")}>{title}</h1>
        {description && <p className="mt-2 max-w-[72ch] text-[13.5px] leading-relaxed text-sd-text2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>
);

export const Section: React.FC<{ title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }> = ({ title, aside, children, className, id }) => {
  const hid = useId();
  return (
    <section className={cx("mt-8", className)} aria-labelledby={hid} id={id}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={hid} className="text-[12px] font-bold uppercase tracking-[0.14em] text-sd-text2">{title}</h2>
        {aside && <div className="text-[12px] text-sd-text3">{aside}</div>}
      </div>
      {children}
    </section>
  );
};

export const Panel: React.FC<{
  title?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode; className?: string;
  tone?: "default" | "gold" | "ok" | "warn" | "bad" | "accent"; padded?: boolean; as?: "section" | "div"; footer?: React.ReactNode; headingLevel?: 2 | 3;
}> = ({ title, aside, children, className, tone = "default", padded = true, as = "section", footer, headingLevel = 3 }) => {
  const border = { default: "border-sd-line", gold: "border-sd-gold/45", ok: "border-sd-ok/40", warn: "border-sd-warn/45", bad: "border-sd-bad/45", accent: "border-sd-accent/40" }[tone];
  const Tag = as;
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <Tag className={cx("min-w-0 rounded-xl border bg-sd-panel", border, className)}>
      {(title || aside) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sd-soft px-4 py-3">
          {title && <H className="text-[13px] font-semibold text-sd-text">{title}</H>}
          {aside && <div className="flex items-center gap-2 text-[12px] text-sd-text3">{aside}</div>}
        </div>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
      {footer && <div className="border-t border-sd-soft px-4 py-2.5">{footer}</div>}
    </Tag>
  );
};

// ── Buttons ─────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "approve" | "danger" | "warn";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-sd-accentbg text-sd-accentink border-sd-accentbg hover:bg-white",
  secondary: "bg-sd-raised text-sd-text border-sd-line hover:bg-sd-hover hover:border-[#35465d]",
  ghost: "bg-transparent text-sd-text2 border-transparent hover:bg-sd-raised hover:text-sd-text",
  approve: "bg-[#1f5c45] text-white border-[#2f7d5f] hover:bg-[#24694f]",
  danger: "bg-[#5c2328] text-white border-[#8a3a41] hover:bg-[#6b2a30]",
  warn: "bg-[#4d3d1d] text-[#fbe9c4] border-[#7a6232] hover:bg-[#5a4822]",
};
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant; size?: "sm" | "md"; loading?: boolean; icon?: React.ReactNode;
}>(({ variant = "secondary", size = "md", loading, icon, className, children, disabled, type = "button", ...p }, ref) => (
  <button ref={ref} type={type} {...p} disabled={disabled || loading} aria-busy={loading || undefined}
    className={cx("inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
      size === "sm" ? "h-8 px-2.5 text-[12px]" : "h-9 px-3.5 text-[13px]", BTN[variant], className)}>
    {loading ? <Spinner /> : icon}
    {children}
  </button>
));
Button.displayName = "Button";

export const Spinner: React.FC<{ className?: string }> = ({ className = "h-3.5 w-3.5" }) => (
  <svg viewBox="0 0 20 20" className={cx("animate-spin motion-reduce:animate-none", className)} aria-hidden><circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.5" fill="none" /><path d="M17 10a7 7 0 00-7-7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" /></svg>
);

// ── Status ──────────────────────────────────────────────────────────────────
export type Tone = "neutral" | "info" | "ok" | "warn" | "bad" | "gold";
const TONE: Record<Tone, string> = {
  neutral: "border-sd-line text-sd-text2 bg-sd-raised",
  info: "border-sd-accent/40 text-sd-accent bg-sd-accent/[0.08]",
  ok: "border-sd-ok/40 text-sd-ok bg-sd-ok/[0.08]",
  warn: "border-sd-warn/45 text-sd-warn bg-sd-warn/[0.08]",
  bad: "border-sd-bad/45 text-sd-bad bg-sd-bad/[0.08]",
  gold: "border-sd-gold/45 text-sd-gold bg-sd-gold/[0.08]",
};
export const Badge: React.FC<{ tone?: Tone; glyph?: string; children: React.ReactNode; className?: string; title?: string }> = ({ tone = "neutral", glyph, children, className, title }) => (
  <span title={title} className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-[3px] text-[11.5px] font-semibold leading-none", TONE[tone], className)}>
    {glyph && <span aria-hidden className="text-[10px] leading-none">{glyph}</span>}
    {children}
  </span>
);

// Every lifecycle state keeps its own label — distinct engine states are never
// merged for visual convenience. "rejected" is a rejection (off the publication
// path); a RETURN for revision sends the record back to "draft" (engine fact).
export const LIFECYCLE: Record<Lifecycle, { label: string; tone: Tone; glyph: string; meaning: string }> = {
  draft:     { label: "Draft",        tone: "neutral", glyph: "○", meaning: "Not in governance — returned for revision, or not yet submitted." },
  submitted: { label: "Submitted",    tone: "warn",    glyph: "◔", meaning: "Received; entering the approval chain." },
  in_review: { label: "In review",    tone: "warn",    glyph: "◑", meaning: "Awaiting a decision under the governing policy." },
  approved:  { label: "Approved",     tone: "info",    glyph: "◕", meaning: "Policy satisfied; the official form is being rendered." },
  rendered:  { label: "Ready to publish", tone: "info", glyph: "●", meaning: "Rendered; awaiting the publication authority." },
  published: { label: "Published",    tone: "ok",      glyph: "✓", meaning: "Released as an official record." },
  withdrawn: { label: "Withdrawn",    tone: "neutral", glyph: "⊘", meaning: "Withdrawn from publication." },
  archived:  { label: "Preserved",    tone: "gold",    glyph: "◆", meaning: "Sealed for preservation — terminal." },
  rejected:  { label: "Rejected",     tone: "bad",     glyph: "✕", meaning: "Rejected — off the publication path; re-work creates a new version." },
};
// The server's posture sentence (shared/governance institutionalStatus) labels the
// "rejected" lifecycle "Returned for revision", although a RETURN decision moves a
// record to "draft". The console states the lifecycle fact for rejected records
// rather than repeat that conflation; every other posture sentence is shown as-is.
export const postureText = (state?: string, status?: string | null): string | null =>
  state === "rejected" ? "Rejected — off the publication path" : (status || null);

export const lifecycleMeta = (s?: string) => LIFECYCLE[(s ?? "") as Lifecycle] ?? { label: s ? s.replace(/_/g, " ") : "—", tone: "neutral" as Tone, glyph: "·", meaning: "" };

export const LifecycleStatus: React.FC<{ state?: string; label?: string | null }> = ({ state, label }) => {
  const m = lifecycleMeta(state);
  return <Badge tone={m.tone} glyph={m.glyph} title={m.meaning}>{label || m.label}</Badge>;
};

// Classification marking — the text is always legible (light on dark), the band
// colour is a secondary cue on the left edge; meaning never rides on colour alone.
export const ClassificationMark: React.FC<{ level?: string; scheme?: string; size?: "sm" | "md" }> = ({ level, scheme, size = "sm" }) => {
  const b = classBand(level);
  return (
    <span title={scheme && scheme !== "none" ? `Classification scheme: ${scheme}` : "Classification marking"}
      className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-sd-line bg-sd-sunken font-bold uppercase tracking-[0.08em] text-sd-text", size === "sm" ? "py-[3px] pl-1.5 pr-2 text-[10.5px] leading-none" : "py-1 pl-2 pr-2.5 text-[11.5px]")}>
      <span aria-hidden className={cx("h-2.5 w-1 rounded-sm", b.cls)} />
      <span className="sr-only">Classification: </span>{b.label}
    </span>
  );
};

// ── Data display ────────────────────────────────────────────────────────────
export const Metric: React.FC<{ value?: React.ReactNode; label: string; sub?: string; tone?: "default" | "info" | "warn" | "bad" | "ok"; loading?: boolean }> = ({ value, label, sub, tone = "default", loading }) => {
  const c = { default: "text-sd-text", info: "text-sd-accent", warn: "text-sd-warn", bad: "text-sd-bad", ok: "text-sd-ok" }[tone];
  return (
    <div className="min-w-0">
      <div className={cx("font-mono text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums", c)}>
        {loading ? <span className="sd-skel inline-block h-6 w-10 align-middle" aria-label="Loading" /> : typeof value === "number" ? value.toLocaleString("en-GB") : value ?? <span className="text-sd-faint" aria-label="Not available">—</span>}
      </div>
      <div className="mt-2 text-[12px] font-semibold text-sd-text2">{label}</div>
      {sub && <div className="text-[11.5px] text-sd-text3">{sub}</div>}
    </div>
  );
};

export const Fact: React.FC<{ label: string; value?: React.ReactNode; mono?: boolean; className?: string }> = ({ label, value, mono, className }) => (
  <div className={cx("min-w-0", className)}>
    <dt className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-sd-text3">{label}</dt>
    <dd className={cx("mt-0.5 break-words text-[13px] text-sd-text", mono && "font-mono text-[12px]")}>{value == null || value === "" ? <span className="text-sd-faint">—</span> : value}</dd>
  </div>
);

export const CopyButton: React.FC<{ value: string; label: string; className?: string }> = ({ value, label, className }) => {
  const [done, setDone] = useState<"ok" | "err" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setDone("ok"); }
    catch { setDone("err"); }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(null), 1600);
  };
  return (
    <button type="button" onClick={copy} aria-label={`Copy ${label}`} title={`Copy ${label}`}
      className={cx("sd-noprint inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold text-sd-text3 transition-colors hover:bg-sd-hover hover:text-sd-text", className)}>
      {done === "ok" ? <Icon.check className="h-3.5 w-3.5 text-sd-ok" /> : <Icon.copy className="h-3.5 w-3.5" />}
      <span aria-live="polite" className={done ? "" : "sr-only"}>{done === "ok" ? "Copied" : done === "err" ? "Copy unavailable" : ""}</span>
    </button>
  );
};

// An identifier or digest shown in full (never truncated away), monospaced, with
// copy. `note` states exactly what the value attests — no more than it proves.
export const EvidenceValue: React.FC<{ label: string; value?: string | null; note?: React.ReactNode; tone?: "default" | "gold" }> = ({ label, value, note, tone = "default" }) => (
  <div className="min-w-0">
    <dt className="flex items-center justify-between gap-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-sd-text3">
      <span>{label}</span>
      {value && <CopyButton value={value} label={label} />}
    </dt>
    <dd className="mt-1">
      <div className={cx("break-all rounded-md border border-sd-soft bg-sd-sunken px-2.5 py-1.5 font-mono text-[11.5px] leading-relaxed", tone === "gold" ? "text-sd-gold" : "text-sd-text2")}>
        {value || <span className="text-sd-faint">Not recorded</span>}
      </div>
      {note && <p className="mt-1 text-[11.5px] leading-snug text-sd-text3">{note}</p>}
    </dd>
  </div>
);

// Highlights a search term within text (case-insensitive), for scanning results.
export const Highlight: React.FC<{ text: string; term?: string }> = ({ text, term }) => {
  const t = term?.trim();
  if (!t) return <>{text}</>;
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${esc})`, "ig"));
  return <>{parts.map((p, i) => (p.toLowerCase() === t.toLowerCase() ? <mark key={i} className="rounded-sm bg-sd-gold/25 px-0.5 text-sd-text">{p}</mark> : <React.Fragment key={i}>{p}</React.Fragment>))}</>;
};

// ── States ──────────────────────────────────────────────────────────────────
export const Alert: React.FC<{ tone?: "info" | "ok" | "warn" | "bad"; title?: React.ReactNode; children?: React.ReactNode; onDismiss?: () => void; className?: string; action?: React.ReactNode }> = ({ tone = "info", title, children, onDismiss, className, action }) => {
  const s = {
    info: { c: "border-sd-accent/35 bg-sd-accent/[0.06]", i: <Icon.info className="h-4 w-4 text-sd-accent" /> },
    ok: { c: "border-sd-ok/40 bg-sd-ok/[0.07]", i: <Icon.check className="h-4 w-4 text-sd-ok" /> },
    warn: { c: "border-sd-warn/45 bg-sd-warn/[0.07]", i: <Icon.alert className="h-4 w-4 text-sd-warn" /> },
    bad: { c: "border-sd-bad/45 bg-sd-bad/[0.07]", i: <Icon.alert className="h-4 w-4 text-sd-bad" /> },
  }[tone];
  return (
    <div role={tone === "bad" || tone === "warn" ? "alert" : "status"} className={cx("sd-fade flex gap-3 rounded-lg border px-3.5 py-3", s.c, className)}>
      <span className="mt-0.5 shrink-0">{s.i}</span>
      <div className="min-w-0 flex-1 text-[13px] leading-snug text-sd-text2">
        {title && <div className="font-semibold text-sd-text">{title}</div>}
        {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss message" className="-mr-1 h-6 w-6 shrink-0 rounded-md text-sd-text3 hover:bg-sd-hover hover:text-sd-text">
          <Icon.close className="mx-auto h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{ title: string; children?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode; compact?: boolean; headingLevel?: 1 | 2 | 3 }> = ({ title, children, action, icon, compact, headingLevel }) => (
  <div className={cx("flex flex-col items-center text-center", compact ? "px-4 py-6" : "px-6 py-12")}>
    {icon && <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-sd-line text-sd-text3">{icon}</div>}
    {headingLevel ? React.createElement(`h${headingLevel}`, { className: "text-[13.5px] font-semibold text-sd-text" }, title) : <div className="text-[13.5px] font-semibold text-sd-text">{title}</div>}
    {children && <div className="mt-1 max-w-md text-[12.5px] leading-relaxed text-sd-text3">{children}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = "h-4 w-full" }) => <span aria-hidden className={cx("sd-skel block", className)} />;
export const SkeletonRows: React.FC<{ rows?: number; label?: string }> = ({ rows = 5, label = "Loading" }) => (
  <div role="status" aria-label={label} className="space-y-3 p-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-24" />
      </div>
    ))}
    <span className="sr-only">{label}…</span>
  </div>
);

// ── Forms ───────────────────────────────────────────────────────────────────
export const selectCls = "rounded-lg border border-sd-line bg-sd-sunken px-3 py-2 text-[13px] text-sd-text transition-colors hover:border-[#35465d] disabled:opacity-50";
export const controlCls = "w-full rounded-lg border border-sd-line bg-sd-sunken px-3 py-2 text-[13px] text-sd-text transition-colors hover:border-[#35465d] disabled:opacity-50";

export const FormField: React.FC<{ id: string; label: string; hint?: React.ReactNode; error?: string | null; required?: boolean; children: React.ReactNode; className?: string; after?: React.ReactNode }> = ({ id, label, hint, error, required, children, className, after }) => (
  <div className={className}>
    <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-sd-text2">
      {label}{required && <span className="text-sd-warn" aria-hidden>*</span>}{required && <span className="sr-only">(required)</span>}
    </label>
    {children}
    {hint && !error && <p id={`${id}-hint`} className="mt-1 text-[11.5px] text-sd-text3">{hint}</p>}
    {error && <p id={`${id}-error`} className="mt-1 text-[11.5px] font-medium text-sd-bad">{error}</p>}
    {after}
  </div>
);

export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-sd-line bg-sd-sunken px-1 font-mono text-[10.5px] font-semibold text-sd-text2">{children}</kbd>
);

export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-9 items-center rounded-lg border border-sd-line bg-sd-sunken p-0.5">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cx("h-full rounded-md px-2.5 text-[12px] font-semibold transition-colors", value === o.value ? "bg-sd-hover text-sd-text" : "text-sd-text3 hover:text-sd-text")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Confirmation dialog — consequential acts state their consequence first ───
// Native <dialog> gives a real modal: focus is contained, Escape cancels, and
// focus returns to the invoking control on close.
export const ConfirmDialog: React.FC<{
  open: boolean; title: string; children: React.ReactNode; confirmLabel: string;
  variant?: BtnVariant; busy?: boolean; onConfirm: () => void; onCancel: () => void;
  irreversible?: boolean | string;
}> = ({ open, title, children, confirmLabel, variant = "primary", busy, onConfirm, onCancel, irreversible }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const hid = useId();
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby={hid} onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }}
      onClick={(e) => { if (e.target === ref.current && !busy) onCancel(); /* backdrop click */ }}
      className="w-[min(92vw,480px)] rounded-xl border border-sd-line bg-sd-panel p-0 text-sd-text shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop:bg-[#05080dcc]">
      {open && (
        <div className="p-5">
          <h2 id={hid} className="text-[16px] font-semibold text-sd-text">{title}</h2>
          <div className="mt-2 text-[13px] leading-relaxed text-sd-text2">{children}</div>
          {irreversible && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-sd-warn/40 bg-sd-warn/[0.07] px-3 py-2 text-[12px] font-semibold text-sd-warn">
              <Icon.lock className="h-3.5 w-3.5 shrink-0" /> {typeof irreversible === "string" ? irreversible : "This cannot be undone."}
            </div>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={onCancel} disabled={busy} autoFocus>Cancel</Button>
            <Button variant={variant} onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
          </div>
        </div>
      )}
    </dialog>
  );
};

// ── Hooks ───────────────────────────────────────────────────────────────────
export type Density = "compact" | "comfortable";
// A per-viewer convenience only; storage failure (private mode) falls back cleanly.
export function useDensity(key: string, initial: Density = "comfortable"): [Density, (d: Density) => void] {
  const [d, setD] = useState<Density>(() => {
    try { const v = localStorage.getItem(`sd.density.${key}`); return v === "compact" || v === "comfortable" ? v : initial; }
    catch { return initial; }
  });
  const set = useCallback((v: Density) => { setD(v); try { localStorage.setItem(`sd.density.${key}`, v); } catch { /* non-fatal */ } }, [key]);
  return [d, set];
}

// Single-key shortcuts that never fire while the user is typing in a field.
export function useHotkeys(map: Record<string, (e: KeyboardEvent) => void>, enabled = true): void {
  const ref = useRef(map); ref.current = map;
  useEffect(() => {
    if (!enabled) return;
    const h = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector("dialog[open]")) return;
      // never hijack Enter/Space on a focused link or button
      if ((e.key === "Enter" || e.key === " ") && t && t.closest("a,button,summary,[role=button],[role=radio]")) return;
      const fn = ref.current[e.key];
      if (fn) { e.preventDefault(); fn(e); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [enabled]);
}

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SummaryKind } from "../lib/menu-summaries";

// A short summary card for a menu entry or a journey step. It opens when the pointer rests on the entry
// for a moment (not on a passing sweep), when the entry takes keyboard focus, or when its ⓘ is tapped on a
// touch screen; it closes on leaving, Escape, or scrolling. Drawn in a portal so the sidebar's scrolling
// never clips it.

const DELAY_MS = 450;

export interface Hint {
  readonly id: string;
  readonly open: boolean;
  readonly rect: DOMRect | null;
  /** handlers for the entry itself */
  readonly bind: {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
    onFocus: (e: React.FocusEvent<HTMLElement>) => void;
    onBlur: () => void;
    "aria-describedby"?: string;
  };
  /** the ⓘ on touch screens: opens at once, a second tap closes */
  readonly toggleFrom: (el: HTMLElement) => void;
}

export function useHint(): Hint {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const clear = (): void => { if (timer.current !== undefined) window.clearTimeout(timer.current); timer.current = undefined; };
  const show = useCallback((el: HTMLElement, wait: number): void => {
    clear();
    timer.current = window.setTimeout(() => { setRect(el.getBoundingClientRect()); setOpen(true); }, wait);
  }, []);
  const hide = useCallback((): void => { clear(); setOpen(false); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") hide(); };
    // a tap anywhere but an ⓘ closes it (touch screens have no "leave")
    const onDown = (e: PointerEvent): void => { if (!(e.target as Element | null)?.closest?.("[data-hint-toggle]")) hide(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown); window.removeEventListener("scroll", hide, true); window.removeEventListener("resize", hide); };
  }, [open, hide]);
  useEffect(() => clear, []);

  return {
    id, open, rect,
    bind: {
      onMouseEnter: (e) => show(e.currentTarget, DELAY_MS),
      onMouseLeave: hide,
      onFocus: (e) => show(e.currentTarget, 0),
      onBlur: hide,
      ...(open ? { "aria-describedby": id } : {}),
    },
    toggleFrom: (el) => (open ? hide() : show(el, 0)),
  };
}

const KIND_STYLE: Record<SummaryKind, string> = {
  Real: "border-[#7DC491]/50 text-[#9FD8AE]",
  Preview: "border-[#C9A262]/60 text-[#E2C98F]",
  Simulation: "border-[#C9A262]/60 text-[#E2C98F]",
  Planning: "border-white/25 text-white/70",
};

/** The card, beside the entry ("right", for the sidebar) or above it ("top", for the step bar). */
export const HintCard: React.FC<{ hint: Hint; title: string; what: string; kind?: SummaryKind; plan?: string; side?: "right" | "top" }> = ({ hint, title, what, kind, plan, side = "right" }) => {
  if (!hint.open || !hint.rect) return null;
  const r = hint.rect, W = 288, M = 8;
  const style: React.CSSProperties = side === "right"
    ? { left: Math.min(r.right + M, window.innerWidth - W - M), top: Math.max(M, Math.min(r.top - 6, window.innerHeight - 180)) }
    : { left: Math.max(M, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - M)), bottom: window.innerHeight - r.top + M };
  return createPortal(
    <div id={hint.id} role="tooltip" style={{ ...style, width: W }}
      className="pointer-events-none fixed z-[80] rounded-[6px] border border-ex-bronze/40 bg-[#14161A] px-3.5 py-3 text-left shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-ex-ivory">{title}</span>
        {kind && <span className={`shrink-0 rounded-sm border px-1.5 py-px font-mono text-[8.5px] font-semibold uppercase tracking-[0.16em] ${KIND_STYLE[kind]}`}>{kind}</span>}
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-white/75">{what}</p>
      {plan && <p className="mt-2 border-t border-white/10 pt-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/45">{plan === "Free" ? "Included on every plan" : `Plan · ${plan}`}</p>}
    </div>,
    document.body,
  );
};

/** The ⓘ shown only on touch screens, where nothing can rest on an entry. */
export const HintToggle: React.FC<{ hint: Hint; label: string; className?: string }> = ({ hint, label, className = "" }) => (
  <button type="button" data-hint-toggle aria-label={`What is ${label}?`} aria-expanded={hint.open}
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); hint.toggleFrom(e.currentTarget.parentElement ?? e.currentTarget); }}
    className={`hidden h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] text-white/45 hover:text-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze [@media(hover:none)]:grid ${className}`}>
    ⓘ
  </button>
);

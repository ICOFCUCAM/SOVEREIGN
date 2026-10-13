import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { needsUpgrade, type NavItem, type Plan, type Role } from "../lib/access";

// The console's command palette: ⌘K (Ctrl+K elsewhere) opens a search over every page the role can
// reach — its menu name, the page's own name and its group — and Enter goes there. A pro page on a
// free plan goes to the upgrade screen, as the menu does. Arrow keys move, Escape closes, focus
// returns to where it was.

const basePath = (to: string): string => to.split("#")[0];

// the last pages opened in this browser, newest first (the palette lists them first when nothing is typed)
const RECENT_KEY = "exitos.recentPages";
export const readRecent = (): string[] => { try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; } };
export const noteRecent = (path: string): void => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([path, ...readRecent().filter((p) => p !== path)].slice(0, 5))); } catch { /* storage unavailable */ }
};

/** With nothing typed: the recent pages first (in recency order), then the rest of the menu. */
export const orderForEmpty = (items: readonly NavItem[], recent: readonly string[]): NavItem[] => {
  const first = recent.map((p) => items.find((n) => basePath(n.to) === p)).filter((n): n is NavItem => !!n);
  return [...first, ...items.filter((n) => !first.includes(n))];
};

/** Pages whose menu name, page name or group contain every word typed, in menu order. */
export const searchPages = (items: readonly NavItem[], query: string): NavItem[] => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((n) => {
    const hay = `${n.label} ${n.name ?? ""} ${n.group}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
};

const CommandPalette: React.FC<{ items: readonly NavItem[]; role: Role; plan: Plan; open: boolean; onOpenChange: (open: boolean) => void }> = ({ items, role, plan, open, onOpenChange }) => {
  const nav = useNavigate();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const recent = useMemo(() => (open ? readRecent() : []), [open]);
  const found = useMemo(() => (q.trim() ? searchPages(items, q) : orderForEmpty(items, recent)), [items, q, recent]);
  const recentCount = q.trim() ? 0 : found.filter((n) => recent.includes(basePath(n.to))).length;

  // the shortcut, from anywhere in the console
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); onOpenChange(!open); }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    setQ(""); setAt(0);
    requestAnimationFrame(() => input.current?.focus());
    return () => opener?.focus?.();
  }, [open]);
  useEffect(() => { setAt(0); }, [q]);

  if (!open) return null;
  const go = (n: NavItem | undefined): void => {
    if (!n) return;
    onOpenChange(false);
    nav(needsUpgrade(basePath(n.to), role, plan) ? "/console/upgrade" : n.to);
  };
  const onKey = (e: React.KeyboardEvent): void => {
    if (e.key === "Escape") { e.preventDefault(); onOpenChange(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setAt((i) => Math.min(found.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAt((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); go(found[at]); }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center bg-black/60 px-4 pt-[14vh] backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div role="dialog" aria-modal="true" aria-label="Go to a page" className="w-full max-w-xl overflow-hidden rounded-xl border border-white/10 bg-ink-800 shadow-2xl shadow-black/60" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-white/40"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Go to a page…"
            role="combobox" aria-expanded="true" aria-controls={`${id}-list`} aria-activedescendant={found[at] ? `${id}-${at}` : undefined} aria-autocomplete="list"
            className="w-full bg-transparent py-4 text-[15px] text-white placeholder-white/35 outline-none" />
          <kbd className="shrink-0 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/45">esc</kbd>
        </div>
        <ul id={`${id}-list`} role="listbox" aria-label="Pages" className="max-h-[50vh] overflow-y-auto p-2">
          {found.map((n, i) => {
            const locked = needsUpgrade(basePath(n.to), role, plan);
            return (
              <li key={`${n.to}-${n.group}`} id={`${id}-${i}`} role="option" aria-selected={i === at}
                onMouseMove={() => setAt(i)} onClick={() => go(n)}
                className={`flex cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2.5 ${i === at ? "bg-deal-600/20 ring-1 ring-deal-400/40" : ""}`}>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-white">{n.label}</span>
                  {n.name && n.name !== n.label && <span className="block truncate text-[11px] text-white/50">{n.name}</span>}
                </span>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">{i < recentCount ? "Recent" : `${locked ? "Pro · " : ""}${n.group}`}</span>
              </li>
            );
          })}
          {found.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-white/50">No page matches “{q}”.</li>}
        </ul>
        <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2 text-[11px] text-white/40">
          <span><kbd className="font-mono">↑ ↓</kbd> to move</span><span><kbd className="font-mono">↵</kbd> to open</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

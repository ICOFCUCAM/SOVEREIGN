import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchCountries, countryByCode, flagUrl, type Country } from "../lib/countries";

// ── COUNTRY SELECT ──────────────────────────────────────────────────
// A searchable country and territory picker (WAI-ARIA combobox with a listbox popup): a trigger
// showing the selected flag and name; on open, a search field that filters every country and
// territory; Arrow keys, Home/End, Page Up/Down and Enter to choose; Escape to close and return
// focus. The value is an ISO 3166-1 alpha-2 code.

export const Flag: React.FC<{ code: string; className?: string }> = ({ code, className = "" }) => {
  const url = flagUrl(code);
  return url
    ? <img src={url} alt="" aria-hidden loading="lazy" width={21} height={14} className={`h-[14px] w-[21px] shrink-0 rounded-[1px] object-cover ring-1 ring-black/10 ${className}`} />
    : <span aria-hidden className={`grid h-[14px] w-[21px] shrink-0 place-items-center rounded-[1px] border border-[#CFC6B7] text-[8px] font-semibold text-ex-slate-ink ${className}`}>{code}</span>;
};

interface Props {
  readonly id?: string;
  readonly label: string;
  readonly value: string | undefined;          // ISO code
  readonly onChange: (code: string) => void;
  readonly hint?: string;
  readonly placeholder?: string;
  readonly invalid?: boolean;
  readonly labelClassName?: string;
}

export const CountrySelect: React.FC<Props> = ({ id, label, value, onChange, hint, placeholder = "Choose a country or territory", invalid, labelClassName }) => {
  const uid = useId();
  const base = id ?? `country-${uid.replace(/:/g, "")}`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  // hover moves the active option only when the pointer really moves (not when the list re-renders under it)
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const hover = (e: React.MouseEvent, i: number): void => {
    const p = pointer.current; pointer.current = { x: e.clientX, y: e.clientY };
    if (p && (p.x !== e.clientX || p.y !== e.clientY)) setActive(i);
  };
  const selected = countryByCode(value);
  const results = useMemo(() => searchCountries(query), [query]);

  const close = (focusTrigger = true): void => { setOpen(false); setQuery(""); if (focusTrigger) trigger.current?.focus(); };
  const choose = (c: Country): void => { onChange(c.code); close(); };

  // opening starts at the current value with an empty search; typing starts again at the first match
  const openList = (): void => {
    const all = searchCountries("");
    setQuery(""); setActive(Math.max(0, selected ? all.findIndex((c) => c.code === selected.code) : 0)); setOpen(true);
  };
  const type = (q: string): void => { setQuery(q); setActive(0); };
  useEffect(() => { if (open) search.current?.focus(); }, [open]);
  // keep the active option in view
  useEffect(() => { if (open) list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" }); }, [active, open]);
  // a click outside closes without choosing
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent): void => { if (!wrap.current?.contains(e.target as Node)) close(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const onKey = (e: React.KeyboardEvent): void => {
    const last = results.length - 1;
    const move = (to: number): void => { e.preventDefault(); setActive(Math.max(0, Math.min(last, to))); };
    switch (e.key) {
      case "ArrowDown": move(active + 1); break;
      case "ArrowUp": move(active - 1); break;
      case "PageDown": move(active + 8); break;
      case "PageUp": move(active - 8); break;
      case "Home": if (!query) move(0); break;
      case "End": if (!query) move(last); break;
      case "Enter": e.preventDefault(); if (results[active]) choose(results[active]); break;
      case "Escape": e.preventDefault(); close(); break;
      case "Tab": close(false); break;
    }
  };

  const optId = (i: number): string => `${base}-opt-${i}`;
  return (
    <div ref={wrap}>
      <div id={`${base}-label`} className={labelClassName ?? "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ex-slate-ink"}>{label}</div>
      <div className="relative">
      <button ref={trigger} id={base} type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${base}-label ${base}`}
        aria-describedby={hint ? `${base}-hint` : undefined} aria-invalid={invalid || undefined}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); openList(); } }}
        className={`flex w-full items-center gap-3 rounded-[11px] border bg-white/95 px-4 py-3.5 text-left text-[14.5px] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_10px_24px_-18px_rgba(120,90,40,0.5)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]/50 ${open ? "border-[#B9924F]" : invalid ? "border-[#B9806F]" : "border-[#DCC9A2] hover:border-[#B9924F]"}`}>
        {selected ? <><Flag code={selected.code} /><span className="flex-1 truncate text-ex-graphite">{selected.name}</span></> : <span className="flex-1 text-[#8A8378]">{placeholder}</span>}
        <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" className={`shrink-0 text-ex-slate-ink transition-transform ${open ? "rotate-180" : ""}`}><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 z-30 mt-2 overflow-hidden rounded-[12px] border border-[#E2D3B5] bg-white shadow-[0_28px_56px_-24px_rgba(60,45,20,0.45)]">
          <div className="flex items-center gap-2 border-b border-[#E6DFD3] px-3.5">
            <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" className="shrink-0 text-[#8A8378]"><circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="m9.5 9.5 3 3" stroke="currentColor" strokeWidth="1.3" /></svg>
            <input ref={search} type="text" role="combobox" aria-expanded="true" aria-controls={`${base}-list`} aria-autocomplete="list"
              aria-activedescendant={results.length ? optId(active) : undefined} aria-label={`Search ${label.toLowerCase()}`}
              value={query} onChange={(e) => type(e.target.value)} onKeyDown={onKey} placeholder="Search countries and territories"
              autoComplete="off" spellCheck={false}
              className="w-full bg-transparent py-3 text-[14px] text-ex-graphite placeholder:text-[#A39C90] focus:outline-none" />
          </div>
          <ul ref={list} id={`${base}-list`} role="listbox" aria-labelledby={`${base}-label`} className="max-h-[296px] overflow-y-auto py-1">
            {results.map((c, i) => {
              const isSel = c.code === selected?.code, isAct = i === active;
              return (
                <li key={c.code} id={optId(i)} data-i={i} role="option" aria-selected={isSel}
                  onMouseMove={(e) => hover(e, i)} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(c)}
                  className={`flex cursor-pointer items-center gap-3 px-3.5 py-2 text-[13.5px] ${isAct ? "bg-[#FAF3E4] shadow-[inset_2px_0_0_0_#C9A262]" : ""} ${isSel ? "font-semibold text-ex-graphite" : "text-ex-slate-ink"}`}>
                  <Flag code={c.code} />
                  <span className="flex-1 truncate">{c.name}</span>
                  {isSel && <span aria-hidden className="text-ex-bronze-ink">✓</span>}
                </li>
              );
            })}
          </ul>
          {results.length === 0 && <p role="status" className="px-3.5 py-4 text-[13px] text-[#8A8378]">No country or territory matches “{query}”.</p>}
          <p aria-live="polite" className="sr-only">{results.length} {results.length === 1 ? "result" : "results"}</p>
        </div>
      )}
      </div>
      {hint && <span id={`${base}-hint`} className="mt-1 block text-[11.5px] text-[#8A8378]">{hint}</span>}
    </div>
  );
};

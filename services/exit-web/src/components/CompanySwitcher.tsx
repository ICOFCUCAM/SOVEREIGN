import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listCompanies, onCompanyChange, selectCompany, companyProfiles, setCompanySink, localCompanies, replaceCompanies } from "../lib/active-company";
import { loadRemoteCompanies, saveRemoteCompany, deleteRemoteCompany, mergeCompanies } from "../lib/company-sync";
import type { Remote } from "../lib/documents/store";
import { findOwnListing, subscribeListings } from "../lib/listings";

// The founder's companies, at the top of the sidebar: the one every page is working on, the others to
// switch to (each with whether it is listed), and "Add a company", which opens Value My Company on a fresh
// company. Each company keeps its own figures, story, documents, data room, listing and deals.

/** Keep a signed-in founder's companies on their account: merge once on sign-in, then save each edit
 *  (debounced; typing saves on every keystroke) and each removal. Failures leave this browser's copy. */
export function useCompanySync(remote: Remote | undefined): void {
  useEffect(() => {
    if (!remote) return;
    let live = true;
    const timers = new Map<string, number>();
    setCompanySink({
      save: (rec) => {
        window.clearTimeout(timers.get(rec.id));
        timers.set(rec.id, window.setTimeout(() => { void saveRemoteCompany(remote, rec).catch(() => undefined); }, 800));
      },
      remove: (id) => { window.clearTimeout(timers.get(id)); void deleteRemoteCompany(remote, id).catch(() => undefined); },
    });
    void loadRemoteCompanies(remote).then((rows) => {
      if (!live) return;
      const local = localCompanies();
      const m = mergeCompanies(local.records, local.synced, rows);
      replaceCompanies(m.records, m.synced);
      for (const rec of m.upload) void saveRemoteCompany(remote, rec).catch(() => undefined);
    }).catch(() => undefined);
    return () => { live = false; setCompanySink(null); for (const t of timers.values()) window.clearTimeout(t); };
  }, [remote]);
}

export function useCompanies(): { companies: ReturnType<typeof listCompanies>; activeId: string | null } {
  const [companies, setCompanies] = useState(listCompanies);
  useEffect(() => onCompanyChange(() => setCompanies(listCompanies())), []);
  return { companies, activeId: companies.find((c) => c.active)?.id ?? null };
}

export const CompanySwitcher: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const nav = useNavigate();
  const { companies } = useCompanies();
  const [open, setOpen] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => subscribeListings(() => setTick((t) => t + 1)), []);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent): void => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent): void => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", down); window.addEventListener("keydown", key);
    return () => { window.removeEventListener("mousedown", down); window.removeEventListener("keydown", key); };
  }, [open]);

  const listed = new Set(companyProfiles().filter((c) => findOwnListing(c.profile)).map((c) => c.id));
  const active = companies.find((c) => c.active);
  const pick = (id: string | null): void => { selectCompany(id); setOpen(false); onNavigate?.(); if (id === null) nav("/console/intake"); };

  return (
    <div ref={box} className="relative mx-3 mb-2">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="listbox"
        className="flex w-full items-center gap-2 rounded-[4px] border border-white/10 bg-white/[0.03] px-2.5 py-2 text-left transition hover:border-ex-bronze/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ex-bronze">
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[8.5px] uppercase tracking-[0.2em] text-white/40">{companies.length > 1 ? `Company · ${companies.length}` : "Company"}</span>
          <span className="block truncate text-[12.5px] font-medium text-white/85">{active ? active.name : "Demo company"}</span>
        </span>
        {active && listed.has(active.id) && <span className="shrink-0 rounded-sm border border-[#7DC491]/40 px-1 py-px font-mono text-[8px] uppercase tracking-[0.14em] text-[#9FD8AE]">Listed</span>}
        <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" className={`shrink-0 text-white/45 transition ${open ? "rotate-180" : ""}`}><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
      </button>
      {open && (
        <div role="listbox" aria-label="Your companies" className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-[4px] border border-white/10 bg-[#14161A] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)]">
          {companies.length === 0 && <p className="px-3 py-2.5 text-[11.5px] text-white/50">No company yet. Pages show the demo company until you add yours.</p>}
          {companies.map((c) => (
            <button key={c.id} type="button" role="option" aria-selected={c.active} onClick={() => pick(c.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] transition hover:bg-white/[0.05] focus-visible:bg-white/[0.05] focus-visible:outline-none ${c.active ? "text-ex-ivory" : "text-white/70"}`}>
              <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.active ? "bg-ex-bronze" : "bg-transparent"}`} />
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              {listed.has(c.id) && <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.14em] text-[#9FD8AE]">Listed</span>}
            </button>
          ))}
          <button type="button" onClick={() => pick(null)}
            className="flex w-full items-center gap-2 border-t border-white/10 px-3 py-2 text-left text-[12px] font-semibold text-ex-bronze transition hover:bg-white/[0.05] focus-visible:bg-white/[0.05] focus-visible:outline-none">
            <span aria-hidden>+</span> Add a company or product
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useId, useMemo, useState } from "react";
import { LEDGER_ALL, type LedgerRow } from "../lib/market-stats";

const usd = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${Math.round(n / 1e6)}M`);
const MAX_ALL = Math.max(...LEDGER_ALL.map((r) => r.valueUsd));

// The ledger's working table: every priced deal on record, searchable by
// target or acquirer, filtered by sector and status, sorted by date or value.
// Ten rows by default; "Show all" opens the rest. The rows are the same
// registry records the front-page stories are drawn from.

type Sort = "date" | "value";
const STATUSES = ["Closed", "Announced", "Terminated"] as const;
const SECTORS = [...new Set(LEDGER_ALL.map((r) => r.sector).filter(Boolean))].sort();
const FIELD = "border border-slate-300 bg-white px-3 py-2 text-[13px] text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

const LedgerTable: React.FC = () => {
  const id = useId();
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState<string>("");
  const [sort, setSort] = useState<Sort>("date");
  const [all, setAll] = useState(false);

  const rows = useMemo<readonly LedgerRow[]>(() => {
    const needle = q.trim().toLowerCase();
    const r = LEDGER_ALL.filter((x) =>
      (!needle || x.target.toLowerCase().includes(needle) || x.buyer.toLowerCase().includes(needle)) &&
      (!sector || x.sector === sector) && (!status || x.status === status));
    return sort === "value" ? [...r].sort((a, b) => b.valueUsd - a.valueUsd) : r;
  }, [q, sector, status, sort]);
  const shown = all ? rows : rows.slice(0, 10);
  const base = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return LEDGER_ALL.filter((x) => (!needle || x.target.toLowerCase().includes(needle) || x.buyer.toLowerCase().includes(needle)) && (!sector || x.sector === sector));
  }, [q, sector]);
  const count = (st: string): number => (st ? base.filter((x) => x.status === st).length : base.length);
  const total = rows.reduce((a, r) => a + r.valueUsd, 0);
  const largest = rows.reduce<LedgerRow | null>((m, r) => (!m || r.valueUsd > m.valueUsd ? r : m), null);

  return (
    <div className="min-w-0">
      {/* controls */}
      <div role="search" aria-label="Filter the ledger" className="flex flex-wrap items-end gap-3 rounded-ex-sm border border-slate-300 bg-[#F8F4EE] p-4 shadow-[inset_0_1px_0_#fff]">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-[12px] text-slate-600" htmlFor={`${id}-q`}>Search target or acquirer
          <input id={`${id}-q`} type="search" value={q} onChange={(e) => { setQ(e.target.value); setAll(false); }} placeholder="e.g. Salesforce" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-slate-600" htmlFor={`${id}-s`}>Sector
          <select id={`${id}-s`} value={sector} onChange={(e) => { setSector(e.target.value); setAll(false); }} className={FIELD}>
            <option value="">All sectors</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-slate-600" htmlFor={`${id}-o`}>Sort by
          <select id={`${id}-o`} value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={FIELD}>
            <option value="date">Newest first</option>
            <option value="value">Largest first</option>
          </select>
        </label>
        <div role="group" aria-label="Status" className="flex gap-1.5">
          {["", ...STATUSES].map((s) => (
            <button key={s || "all"} type="button" aria-pressed={status === s} onClick={() => { setStatus(s); setAll(false); }}
              className={`border px-3 py-2 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${status === s ? "border-ink-900 bg-ink-900 text-white" : "border-slate-300 bg-white text-ink-800 hover:border-ink-900"}`}>
              {s || "All"} <span className={`ml-1 font-mono text-[11px] tabular-nums ${status === s ? "text-[#DCCDB3]" : "text-slate-500"}`}>{count(s)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* what the current view adds up to */}
      <dl className="mt-4 grid grid-cols-3 overflow-hidden rounded-ex-sm text-white" style={{ background: "linear-gradient(135deg, var(--ex-1) 0%, var(--ex-2) 100%)" }}>
        {([["Matching deals", String(rows.length), ""], ["Disclosed value", rows.length ? usd(total) : "—", ""], ["Largest", largest ? largest.value : "—", largest ? `${largest.target} · ${largest.buyer}` : ""]] as const).map(([k, v, sub], i) => (
          <div key={k} className={`min-w-0 px-4 py-4 sm:px-6 ${i ? "border-l border-white/10" : ""}`}>
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#DCCDB3]/80">{k}</dt>
            <dd className="mt-1.5 font-editorial text-[clamp(1.2rem,2.2vw,1.9rem)] font-semibold tabular-nums">{v}</dd>
            {sub && <dd className="mt-0.5 truncate text-[12px] text-[#E8E0D2]/75">{sub}</dd>}
          </div>
        ))}
      </dl>
      <div role="region" aria-label="Disclosed acquisitions" tabIndex={0} className="mt-4 min-w-0 overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
        <table className="w-full min-w-[820px] text-left text-[13px]">
          <caption className="pb-3 text-left text-[12.5px] text-slate-600" aria-live="polite">
            {rows.length ? `${shown.length} of ${rows.length} matching deals, ${sort === "value" ? "largest" : "newest"} first` : "No deals match these filters."}
          </caption>
          <thead>
            <tr className="border-y border-ink-900 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600">
              {["Announced", "Target", "Acquirer", "Sector", "Value", "Status", "Source"].map((h) => <th key={h} scope="col" className={`py-2.5 pr-4 font-semibold ${h === "Value" ? "w-[150px] text-right" : ""}`}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.date + r.target} className="border-b border-slate-200 transition-colors hover:bg-[#F5F1E9]/60">
                <td className="whitespace-nowrap py-2.5 pr-4 font-mono tabular-nums text-slate-600"><time dateTime={r.date}>{r.date}</time></td>
                <th scope="row" className="py-2.5 pr-4 font-editorial text-[15px] font-semibold text-ink-900">{r.target}</th>
                <td className="py-2.5 pr-4 text-ink-800">{r.buyer}</td>
                <td className="py-2.5 pr-4 text-slate-600">{r.sector}</td>
                <td className="py-2.5 pr-4 text-right font-mono font-semibold tabular-nums text-ink-900">
                  <span className="flex items-center justify-end gap-2.5">
                    <span aria-hidden className="h-1.5 rounded-full bg-[#9A7E56]/80" style={{ width: `${Math.max(3, (r.valueUsd / MAX_ALL) * 72)}px` }} />{r.value}
                  </span>
                </td>
                <td className="py-2.5 pr-4 font-mono text-[12px] font-semibold" style={{ color: r.statusColor }}>{r.status}</td>
                <td className="py-2.5 font-mono text-[11px] text-slate-600">{r.sources.map((x) => `${x.kind} ${x.ref}`).join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 10 && (
        <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all}
          className="mt-4 inline-flex items-center gap-3 border border-ink-900 px-4 py-2.5 text-[12px] font-semibold text-ink-900 transition hover:bg-ink-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          {all ? "Show the first ten" : `Show all ${rows.length}`} <span aria-hidden>{all ? "↑" : "↓"}</span>
        </button>
      )}
    </div>
  );
};

export default LedgerTable;

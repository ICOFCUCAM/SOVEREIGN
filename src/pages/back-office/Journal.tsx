import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  listEntries, fetchEntryLines, listAccounts, listPeriods, postJournalEntry,
  BO_CURRENCIES, canPost,
  type BoProfile, type BoJournalEntry, type BoJournalLine, type BoAccount, type BoPeriod, type BoCurrency,
} from "@/lib/backOffice";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface LineDraft {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  currency: BoCurrency;
  fxRate: number;
  memo: string;
}

const blankLine = (currency: BoCurrency = "USD"): LineDraft => ({
  accountId: "", debitAmount: 0, creditAmount: 0, currency, fxRate: 1, memo: "",
});

const Journal: React.FC = () => {
  const { profile } = useOutletContext<{ profile: BoProfile }>();
  const [entries, setEntries] = useState<BoJournalEntry[]>([]);
  const [accts, setAccts] = useState<BoAccount[]>([]);
  const [periods, setPeriods] = useState<BoPeriod[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lines, setLines] = useState<Record<string, BoJournalLine[]>>({});
  const [error, setError] = useState<string | null>(null);

  const refresh = (): void => { listEntries(100).then(setEntries).catch(() => setEntries([])); };
  useEffect(() => {
    refresh();
    listAccounts().then(setAccts).catch(() => setAccts([]));
    listPeriods().then(setPeriods).catch(() => setPeriods([]));
  }, []);

  const toggle = async (id: string): Promise<void> => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!lines[id]) {
      try { const l = await fetchEntryLines(id); setLines((prev) => ({ ...prev, [id]: l })); }
      catch (e) { setError((e as Error).message); }
    }
  };

  const accountById = useMemo(() => new Map(accts.map((a) => [a.id, a])), [accts]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Journal entries</div>
          <h1 className="font-bold text-3xl mt-2">{entries.length} entries</h1>
          <p className="mt-2 text-sm text-white/55">Double-entry validated: functional debits must equal functional credits before posting.</p>
        </div>
        {canPost(profile.role) && (
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm px-4 py-2">
            <Plus size={14} /> New entry
          </button>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3 w-8"></th>
              <th className="px-5 py-3">JE #</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Memo</th>
              <th className="px-5 py-3">Reference</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-white/40">No journal entries yet.</td></tr>
            )}
            {entries.map((e) => (
              <React.Fragment key={e.id}>
                <tr className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer" onClick={() => toggle(e.id)}>
                  <td className="px-5 py-3 text-white/45">{expanded === e.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                  <td className="px-5 py-3 font-mono text-white/85">JE-{String(e.entry_number).padStart(4, "0")}</td>
                  <td className="px-5 py-3 text-white/85">{e.entry_date}</td>
                  <td className="px-5 py-3 text-white max-w-md truncate">{e.memo}</td>
                  <td className="px-5 py-3 text-white/55 font-mono text-[12px]">{e.reference ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${
                      e.status === "posted" ? "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30"
                      : e.status === "draft" ? "bg-white/5 text-white/55 ring-white/10"
                      : "bg-red-500/15 text-red-300 ring-red-400/30"
                    }`}>{e.status}</span>
                  </td>
                </tr>
                {expanded === e.id && lines[e.id] && (
                  <tr>
                    <td colSpan={6} className="bg-black/30 px-5 py-4">
                      <table className="w-full text-xs">
                        <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                          <tr>
                            <th className="py-1.5 w-8">#</th>
                            <th className="py-1.5">Account</th>
                            <th className="py-1.5">Currency</th>
                            <th className="py-1.5 text-right">Debit</th>
                            <th className="py-1.5 text-right">Credit</th>
                            <th className="py-1.5 text-right">Functional</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines[e.id].map((l) => {
                            const acct = accountById.get(l.account_id);
                            const isDr = l.debit_amount > 0;
                            return (
                              <tr key={l.id}>
                                <td className="py-1.5 font-mono text-white/45">{l.line_no}</td>
                                <td className="py-1.5 text-white/85">{acct ? `${acct.code} · ${acct.name}` : l.account_id}</td>
                                <td className="py-1.5 font-mono text-white/65">{l.currency}</td>
                                <td className="py-1.5 text-right font-mono text-white/85">{isDr ? l.debit_amount.toFixed(2) : ""}</td>
                                <td className="py-1.5 text-right font-mono text-white/85">{!isDr ? l.credit_amount.toFixed(2) : ""}</td>
                                <td className="py-1.5 text-right font-mono text-cyan-300">{(isDr ? l.functional_debit : l.functional_credit).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && canPost(profile.role) && (
        <NewEntry
          accts={accts}
          periods={periods}
          onClose={() => setShowNew(false)}
          onPosted={() => { setShowNew(false); refresh(); }}
        />
      )}

      {error && <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
    </div>
  );
};

const NewEntry: React.FC<{
  accts: BoAccount[]; periods: BoPeriod[];
  onClose: () => void; onPosted: () => void;
}> = ({ accts, periods, onClose, onPosted }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [entryDate, setEntryDate] = useState(today);
  const [periodId, setPeriodId] = useState<string>(periods[0]?.id ?? "");
  const [memo, setMemo] = useState("");
  const [reference, setReference] = useState("");
  const [postImmediately, setPostImmediately] = useState(false);
  const [lines, setLines] = useState<LineDraft[]>([blankLine(), blankLine()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    let dr = 0, cr = 0;
    for (const l of lines) { dr += (l.debitAmount || 0) * (l.fxRate || 1); cr += (l.creditAmount || 0) * (l.fxRate || 1); }
    return { dr, cr, balanced: Math.abs(dr - cr) < 0.005 && dr > 0 };
  }, [lines]);

  const update = (i: number, patch: Partial<LineDraft>): void => {
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  };

  const submit = async (): Promise<void> => {
    setBusy(true); setError(null);
    try {
      await postJournalEntry({
        entryDate, periodId: periodId || undefined, memo,
        reference: reference || undefined, postImmediately,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debitAmount: Number(l.debitAmount) || 0,
          creditAmount: Number(l.creditAmount) || 0,
          currency: l.currency,
          fxRate: Number(l.fxRate) || 1,
          ...(l.memo ? { memo: l.memo } : {}),
        })),
      });
      onPosted();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0e14] border border-white/10 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
        <h2 className="font-bold text-xl">New journal entry</h2>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Row label="Date"><input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={inputCls} /></Row>
          <Row label="Period">
            <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Row>
          <Row label="Reference"><input value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} placeholder="INV-001" /></Row>
          <Row label="Memo"><input value={memo} onChange={(e) => setMemo(e.target.value)} className={inputCls} placeholder="Required" /></Row>
        </div>

        <div className="mt-5 rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 bg-white/[0.02]">
              <tr>
                <th className="px-3 py-2 w-8">#</th>
                <th className="px-3 py-2 min-w-[180px]">Account</th>
                <th className="px-3 py-2 w-24">Currency</th>
                <th className="px-3 py-2 w-24 text-right">Debit</th>
                <th className="px-3 py-2 w-24 text-right">Credit</th>
                <th className="px-3 py-2 w-24 text-right">FX→Func</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-3 py-2 font-mono text-white/55">{i + 1}</td>
                  <td className="px-3 py-2">
                    <select value={l.accountId} onChange={(e) => update(i, { accountId: e.target.value })} className={inputCls + " text-[12px]"}>
                      <option value="">— Choose —</option>
                      {accts.filter((a) => a.is_active).map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select value={l.currency} onChange={(e) => update(i, { currency: e.target.value as BoCurrency })} className={inputCls + " text-[12px] font-mono"}>
                      {BO_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="0.01" value={l.debitAmount || ""}
                      onChange={(e) => update(i, { debitAmount: Number(e.target.value), creditAmount: 0 })}
                      className={inputCls + " text-right font-mono text-[12px]"} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="0.01" value={l.creditAmount || ""}
                      onChange={(e) => update(i, { creditAmount: Number(e.target.value), debitAmount: 0 })}
                      className={inputCls + " text-right font-mono text-[12px]"} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="0.0001" value={l.fxRate}
                      onChange={(e) => update(i, { fxRate: Number(e.target.value) })}
                      className={inputCls + " text-right font-mono text-[12px]"} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {lines.length > 2 && (
                      <button onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))} className="text-white/35 hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 bg-white/[0.02]">
                <td colSpan={3} className="px-3 py-2 text-right font-semibold text-white/55 text-[11px] uppercase tracking-wider">Functional totals</td>
                <td className="px-3 py-2 text-right font-mono text-white">{totals.dr.toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-mono text-white">{totals.cr.toFixed(2)}</td>
                <td colSpan={2} className="px-3 py-2 text-right text-[11px]">
                  {totals.balanced
                    ? <span className="text-cyan-300">✓ Balanced</span>
                    : <span className="text-orange-300">{Math.abs(totals.dr - totals.cr).toFixed(2)} off</span>}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button onClick={() => setLines((p) => [...p, blankLine(p[p.length - 1]?.currency ?? "USD")])} className="text-[11px] text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1">
            <Plus size={12} /> Add line
          </button>
          <label className="text-[12px] text-white/65 inline-flex items-center gap-2">
            <input type="checkbox" checked={postImmediately} onChange={(e) => setPostImmediately(e.target.checked)} />
            Post immediately (otherwise save as draft)
          </label>
        </div>

        {error && <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-white/65 hover:text-white">Cancel</button>
          <button onClick={submit} disabled={busy || !totals.balanced || !memo} className="rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm px-4 py-2 disabled:opacity-50">
            {busy ? "Posting…" : postImmediately ? "Post entry" : "Save draft"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">{label}</span>
    <div className="mt-1.5">{children}</div>
  </label>
);
const inputCls = "w-full rounded-md border border-white/15 bg-black/40 px-2.5 py-1.5 text-sm text-white outline-none focus:border-cyan-400/60";

export default Journal;

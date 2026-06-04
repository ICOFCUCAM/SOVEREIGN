import React, { useEffect, useState } from "react";
import { fetchReport, fmtMoney, type ReportKind, type ReportSummary } from "@/lib/backOffice";
import { FileText, Download } from "lucide-react";

const REPORTS: { kind: ReportKind; label: string; description: string }[] = [
  { kind: "trial_balance",    label: "Trial balance",     description: "All accounts with debit/credit totals; must net to zero." },
  { kind: "income_statement", label: "Income statement",  description: "Revenue − expense over the date range." },
  { kind: "balance_sheet",    label: "Balance sheet",     description: "Assets, liabilities, equity as of end date." },
];

const Reports: React.FC = () => {
  const [report, setReport] = useState<ReportKind>("trial_balance");
  const [startDate, setStart] = useState<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [endDate, setEnd] = useState<string>(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (): void => {
    setLoading(true); setError(null);
    fetchReport(report, startDate, endDate)
      .then((s) => setSummary(s))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(run, [report, startDate, endDate]);

  const downloadCsv = (): void => {
    if (!summary) return;
    let csv = "code,name,type,currency,total_debit,total_credit,balance\n";
    const collect = (rows: { code: string; name: string; accountType: string; currency: string; totalDebit: number; totalCredit: number; balance: number }[]): void => {
      for (const r of rows) {
        csv += `${r.code},"${r.name}",${r.accountType},${r.currency},${r.totalDebit},${r.totalCredit},${r.balance}\n`;
      }
    };
    if (summary.report === "trial_balance") collect(summary.rows);
    else if (summary.report === "income_statement") { collect(summary.revenue); collect(summary.expense); }
    else { collect(summary.assets); collect(summary.liabilities); collect(summary.equity); }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${summary.report}_${startDate}_${endDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Financial reports</div>
        <h1 className="font-bold text-3xl mt-2">Period statements</h1>
        <p className="mt-2 text-sm text-white/55">All amounts in the company's functional currency (USD).</p>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 p-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">Report</span>
            <select value={report} onChange={(e) => setReport(e.target.value as ReportKind)} className={`${inputCls} mt-1.5`}>
              {REPORTS.map((r) => <option key={r.kind} value={r.kind}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">Start date</span>
            <input type="date" value={startDate} onChange={(e) => setStart(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">End date</span>
            <input type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} className={`${inputCls} mt-1.5`} />
          </div>
          <div className="flex items-end">
            <button onClick={downloadCsv} disabled={!summary} className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-40">
              <Download size={14} /> CSV
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/45">{REPORTS.find((r) => r.kind === report)?.description}</p>
      </div>

      {error && <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}
      {loading && <div className="rounded-md border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/55">Loading…</div>}

      {!loading && summary && (
        <div className="rounded-lg border border-white/10 bg-black/40 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
            <FileText size={14} className="text-cyan-400" />
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-white/65">
              {REPORTS.find((r) => r.kind === summary.report)?.label}
            </span>
            <span className="text-[11px] text-white/40 ml-auto">{startDate} → {endDate}</span>
          </div>

          {summary.report === "trial_balance" && (
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-2.5 w-24">Code</th><th className="px-5 py-2.5">Account</th><th className="px-5 py-2.5">Type</th>
                  <th className="px-5 py-2.5 text-right">Debit</th><th className="px-5 py-2.5 text-right">Credit</th><th className="px-5 py-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.filter((r) => r.totalDebit > 0 || r.totalCredit > 0).map((r) => (
                  <tr key={r.accountId} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-2 font-mono text-white/85">{r.code}</td>
                    <td className="px-5 py-2 text-white">{r.name}</td>
                    <td className="px-5 py-2 text-[11px] uppercase tracking-wide text-white/55">{r.accountType}</td>
                    <td className="px-5 py-2 text-right font-mono text-white/85">{r.totalDebit.toFixed(2)}</td>
                    <td className="px-5 py-2 text-right font-mono text-white/85">{r.totalCredit.toFixed(2)}</td>
                    <td className="px-5 py-2 text-right font-mono text-cyan-300">{fmtMoney(r.balance, r.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 bg-white/[0.02]">
                  <td colSpan={3} className="px-5 py-2.5 text-right font-semibold text-[11px] uppercase tracking-wider text-white/55">Total</td>
                  <td className="px-5 py-2.5 text-right font-mono text-white">{summary.totals.debit.toFixed(2)}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-white">{summary.totals.credit.toFixed(2)}</td>
                  <td className="px-5 py-2.5 text-right">
                    {summary.balanced ? <span className="text-cyan-300 text-[11px]">✓ Balanced</span> : <span className="text-orange-300 text-[11px]">Off</span>}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {summary.report === "income_statement" && (
            <div className="p-5 space-y-6">
              <ReportSection title="Revenue" rows={summary.revenue} />
              <div className="flex justify-end font-mono">
                <div className="text-right space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-white/45">Total revenue</div>
                  <div className="text-lg text-emerald-300">{fmtMoney(summary.totalRevenue, "USD")}</div>
                </div>
              </div>
              <ReportSection title="Expense" rows={summary.expense} />
              <div className="flex justify-end font-mono">
                <div className="text-right space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-white/45">Total expense</div>
                  <div className="text-lg text-rose-300">{fmtMoney(summary.totalExpense, "USD")}</div>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 flex justify-end font-mono">
                <div className="text-right space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-white/45">Net income</div>
                  <div className={`text-2xl ${summary.netIncome >= 0 ? "text-cyan-300" : "text-rose-300"}`}>{fmtMoney(summary.netIncome, "USD")}</div>
                </div>
              </div>
            </div>
          )}

          {summary.report === "balance_sheet" && (
            <div className="p-5 space-y-6">
              <ReportSection title="Assets" rows={summary.assets} />
              <div className="flex justify-end font-mono">
                <div className="text-right space-y-1">
                  <div className="text-[11px] uppercase tracking-wide text-white/45">Total assets</div>
                  <div className="text-lg text-cyan-300">{fmtMoney(summary.totalAssets, "USD")}</div>
                </div>
              </div>
              <ReportSection title="Liabilities" rows={summary.liabilities} />
              <ReportSection title="Equity" rows={summary.equity} />
              {summary.retainedFromPeriod !== 0 && (
                <div className="flex justify-end font-mono text-sm">
                  <div className="text-right text-white/65">
                    + Retained earnings (period): <span className="text-cyan-300">{fmtMoney(summary.retainedFromPeriod, "USD")}</span>
                  </div>
                </div>
              )}
              <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4 font-mono">
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-white/45">Total liabilities + equity</div>
                  <div className="text-lg text-cyan-300">{fmtMoney(summary.totalLiabilities + summary.totalEquity, "USD")}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-white/45">Equation</div>
                  <div className={`text-lg ${summary.balanced ? "text-cyan-300" : "text-orange-300"}`}>
                    {summary.balanced ? "✓ Balanced" : "Off"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ReportSection: React.FC<{ title: string; rows: { code: string; name: string; balance: number; currency: string; accountId: string }[] }> = ({ title, rows }) => (
  <div>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-2">{title}</div>
    <table className="w-full text-sm">
      <tbody>
        {rows.filter((r) => Math.abs(r.balance) > 0.005).map((r) => (
          <tr key={r.accountId} className="border-b border-white/5 last:border-0">
            <td className="py-1.5 w-24 font-mono text-white/65">{r.code}</td>
            <td className="py-1.5 text-white/85">{r.name}</td>
            <td className="py-1.5 text-right font-mono text-cyan-300">{fmtMoney(r.balance, r.currency)}</td>
          </tr>
        ))}
        {rows.filter((r) => Math.abs(r.balance) > 0.005).length === 0 && (
          <tr><td className="py-2 text-[11px] text-white/40 italic">no balances</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

const inputCls = "w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60";

export default Reports;

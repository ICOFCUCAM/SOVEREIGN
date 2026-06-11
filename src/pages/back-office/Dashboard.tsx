import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { BoProfile } from "@/lib/backOffice";
import { listEntries, listAuditLog, fetchReport, type BoJournalEntry, type BoAuditEntry, BO_ROLES } from "@/lib/backOffice";

const Dashboard: React.FC = () => {
  const { profile } = useOutletContext<{ profile: BoProfile }>();
  const [entries, setEntries] = useState<BoJournalEntry[]>([]);
  const [audit, setAudit] = useState<BoAuditEntry[]>([]);
  const [kpi, setKpi] = useState<{ revenue: number; expense: number; netIncome: number } | null>(null);

  useEffect(() => {
    listEntries(10).then(setEntries).catch(() => setEntries([]));
    listAuditLog(8).then(setAudit).catch(() => setAudit([]));
    fetchReport("income_statement").then((r) => {
      if (r.report === "income_statement") {
        setKpi({ revenue: r.totalRevenue, expense: r.totalExpense, netIncome: r.netIncome });
      }
    }).catch(() => setKpi(null));
  }, []);

  const roleDesc = BO_ROLES.find((r) => r.value === profile.role)?.description;
  const fmt = (n: number): string => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-8 space-y-8">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Dashboard</div>
        <h1 className="font-bold text-3xl mt-2">Welcome, {profile.full_name.split(" ")[0]}.</h1>
        <p className="mt-2 text-sm text-white/55">{roleDesc}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Total revenue" value={kpi ? fmt(kpi.revenue) : "—"} sub="functional currency (USD)" accent="#22d3ee" />
        <Kpi label="Total expense" value={kpi ? fmt(kpi.expense) : "—"} sub="functional currency (USD)" />
        <Kpi label="Net income" value={kpi ? fmt(kpi.netIncome) : "—"} sub="revenue − expense"
             accent={kpi && kpi.netIncome > 0 ? "#34d399" : kpi && kpi.netIncome < 0 ? "#f87171" : undefined} />
        <Kpi label="Recent entries" value={String(entries.length)} sub="last 10" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/40 p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Recent journal entries</div>
          {entries.length === 0 ? (
            <p className="mt-4 text-sm text-white/55">No entries yet. Post your first via Journal entries → New entry.</p>
          ) : (
            <table className="w-full mt-4 text-sm">
              <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                <tr className="border-b border-white/10">
                  <th className="py-2">#</th><th className="py-2">Date</th><th className="py-2">Memo</th><th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2 font-mono text-white/55">JE-{String(e.entry_number).padStart(4, "0")}</td>
                    <td className="py-2 text-white/85">{e.entry_date}</td>
                    <td className="py-2 text-white/75 max-w-xs truncate">{e.memo}</td>
                    <td className="py-2 text-right">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-black/40 p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Audit log · recent</div>
          {audit.length === 0 ? (
            <p className="mt-4 text-sm text-white/55">
              {profile.role === "superadmin" || profile.role === "auditor"
                ? "No activity recorded yet."
                : "Audit log restricted to superadmin + auditor roles."}
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5 text-sm">
              {audit.map((a) => (
                <li key={a.id} className="border-b border-white/5 pb-2 last:border-0">
                  <div className="text-white/85 font-mono text-[12px]">{a.action}</div>
                  <div className="text-[11px] text-white/45 flex gap-2">
                    <span>{new Date(a.at).toLocaleString()}</span>
                    {a.actor_email && <span>· {a.actor_email}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const Kpi: React.FC<{ label: string; value: string; sub?: string; accent?: string }> = ({ label, value, sub, accent }) => (
  <div className="rounded-lg border border-white/10 bg-black/40 p-5">
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</div>
    <div className="mt-2 text-2xl font-bold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
    {sub && <div className="mt-1 text-[11px] text-white/45">{sub}</div>}
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    draft:  "bg-white/5 text-white/55 ring-white/10",
    posted: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
    voided: "bg-red-500/15 text-red-300 ring-red-400/30",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
};

export default Dashboard;

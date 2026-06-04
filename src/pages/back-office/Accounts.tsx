import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  listAccounts, createAccount, setAccountActive,
  BO_CURRENCIES, type BoProfile, type BoAccount, type BoAccountType, type BoCurrency,
  canManageAccounts,
} from "@/lib/backOffice";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";

const TYPE_LABEL: Record<BoAccountType, string> = {
  asset: "Asset", liability: "Liability", equity: "Equity", revenue: "Revenue", expense: "Expense",
};
const TYPE_STYLE: Record<BoAccountType, string> = {
  asset:     "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
  liability: "bg-orange-500/15 text-orange-300 ring-orange-400/30",
  equity:    "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  revenue:   "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  expense:   "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

const Accounts: React.FC = () => {
  const { profile } = useOutletContext<{ profile: BoProfile }>();
  const [accts, setAccts] = useState<BoAccount[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ code: string; name: string; account_type: BoAccountType; currency: BoCurrency }>({
    code: "", name: "", account_type: "asset", currency: "USD",
  });

  const canEdit = canManageAccounts(profile.role);
  const refresh = (): void => { listAccounts().then(setAccts).catch(() => setAccts([])); };
  useEffect(refresh, []);

  const submit = async (): Promise<void> => {
    setError(null);
    try {
      await createAccount({
        code: form.code.trim(),
        name: form.name.trim(),
        account_type: form.account_type,
        parent_id: null,
        currency: form.currency,
        is_active: true,
        description: null,
      });
      setForm({ code: "", name: "", account_type: "asset", currency: "USD" });
      setShowNew(false);
      refresh();
    } catch (e) { setError((e as Error).message); }
  };

  const counts: Record<BoAccountType, number> = { asset: 0, liability: 0, equity: 0, revenue: 0, expense: 0 };
  for (const a of accts) counts[a.account_type]++;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Chart of accounts</div>
          <h1 className="font-bold text-3xl mt-2">{accts.length} accounts</h1>
          <p className="mt-2 text-sm text-white/55">
            {counts.asset} asset · {counts.liability} liability · {counts.equity} equity · {counts.revenue} revenue · {counts.expense} expense
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm px-4 py-2"
          >
            <Plus size={14} /> New account
          </button>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3 w-24">Code</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Currency</th>
              <th className="px-5 py-3">Status</th>
              {canEdit && <th className="px-5 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {accts.map((a) => (
              <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-3 font-mono text-white/85">{a.code}</td>
                <td className="px-5 py-3 text-white">{a.name}</td>
                <td className="px-5 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${TYPE_STYLE[a.account_type]}`}>
                    {TYPE_LABEL[a.account_type]}
                  </span>
                </td>
                <td className="px-5 py-3 text-white/65 font-mono text-[12px]">{a.currency}</td>
                <td className="px-5 py-3 text-[12px]">
                  {a.is_active ? <span className="text-cyan-300">active</span> : <span className="text-white/40">inactive</span>}
                </td>
                {canEdit && (
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setAccountActive(a.id, !a.is_active).then(refresh).catch((e) => setError((e as Error).message))}
                      className="inline-flex items-center gap-1 text-[11px] text-white/55 hover:text-white"
                    >
                      {a.is_active ? <><ToggleRight size={14} /> Deactivate</> : <><ToggleLeft size={14} /> Activate</>}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}

      {showNew && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0e14] border border-white/10 rounded-lg p-6 w-full max-w-md">
            <h2 className="font-bold text-xl">New account</h2>
            <div className="mt-5 space-y-3">
              <Row label="Code"><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} placeholder="e.g. 6800" /></Row>
              <Row label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Insurance" /></Row>
              <Row label="Type">
                <select value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value as BoAccountType })} className={inputCls}>
                  {(Object.keys(TYPE_LABEL) as BoAccountType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                </select>
              </Row>
              <Row label="Currency">
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as BoCurrency })} className={inputCls}>
                  {BO_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Row>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setShowNew(false); setError(null); }} className="px-4 py-2 text-sm text-white/65 hover:text-white">Cancel</button>
              <button onClick={submit} className="rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm px-4 py-2">Create account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">{label}</span>
    <div className="mt-1.5">{children}</div>
  </label>
);

const inputCls = "w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60";

export default Accounts;

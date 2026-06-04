import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  listBoUsers, createBoUser, updateBoUserStatus,
  BO_ROLES, type BoProfile, type BoRole,
} from "@/lib/backOffice";
import { UserPlus, ShieldX, ShieldCheck } from "lucide-react";

const Users: React.FC = () => {
  const { profile } = useOutletContext<{ profile: BoProfile }>();
  const [users, setUsers] = useState<BoProfile[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{ email: string; password: string; fullName: string; role: BoRole; employeeId: string }>({
    email: "", password: "", fullName: "", role: "accountant", employeeId: "",
  });

  const refresh = (): void => { listBoUsers().then(setUsers).catch(() => setUsers([])); };
  useEffect(refresh, []);

  if (profile.role !== "superadmin") {
    return (
      <div className="p-8">
        <div className="max-w-md rounded-md border border-white/10 bg-black/40 p-6 text-sm text-white/65">
          Officer management is restricted to superadmin.
        </div>
      </div>
    );
  }

  const submit = async (): Promise<void> => {
    setBusy(true); setError(null);
    try {
      await createBoUser({
        email: form.email, password: form.password, fullName: form.fullName, role: form.role,
        ...(form.employeeId ? { employeeId: form.employeeId } : {}),
      });
      setForm({ email: "", password: "", fullName: "", role: "accountant", employeeId: "" });
      setShowCreate(false);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (u: BoProfile): Promise<void> => {
    const next = u.status === "active" ? "suspended" : "active";
    try { await updateBoUserStatus(u.user_id, next); refresh(); } catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Officers</div>
          <h1 className="font-bold text-3xl mt-2">{users.length} provisioned</h1>
          <p className="mt-2 text-sm text-white/55">Create officer accounts; suspend / restore as needed. Every action is audit-logged.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm px-4 py-2 transition"
        >
          <UserPlus size={14} /> New officer
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Employee ID</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const roleDef = BO_ROLES.find((r) => r.value === u.role);
              return (
                <tr key={u.user_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-white">{u.full_name}</td>
                  <td className="px-5 py-3 text-cyan-300 text-[12px] font-semibold uppercase tracking-wide">{roleDef?.label ?? u.role}</td>
                  <td className="px-5 py-3 text-white/55 font-mono text-[12px]">{u.employee_id ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${
                      u.status === "active" ? "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30"
                      : u.status === "suspended" ? "bg-orange-500/15 text-orange-300 ring-orange-400/30"
                      : "bg-red-500/15 text-red-300 ring-red-400/30"
                    }`}>{u.status}</span>
                  </td>
                  <td className="px-5 py-3 text-white/45 text-[12px]">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    {u.user_id !== profile.user_id && u.status !== "revoked" && (
                      <button
                        onClick={() => toggleStatus(u)}
                        className="inline-flex items-center gap-1 text-[11px] text-white/55 hover:text-white"
                      >
                        {u.status === "active" ? <><ShieldX size={12} /> Suspend</> : <><ShieldCheck size={12} /> Restore</>}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0e14] border border-white/10 rounded-lg p-6 w-full max-w-md">
            <h2 className="font-bold text-xl">New officer</h2>
            <p className="mt-1 text-xs text-white/55">Initial credentials — officer rotates password on first login.</p>

            <div className="mt-5 space-y-3">
              <FormRow label="Full name">
                <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} />
              </FormRow>
              <FormRow label="Email">
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
              </FormRow>
              <FormRow label="Initial password (≥ 12 chars)">
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
              </FormRow>
              <FormRow label="Role">
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as BoRole })} className={inputCls}>
                  {BO_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <p className="mt-1 text-[11px] text-white/45">{BO_ROLES.find((r) => r.value === form.role)?.description}</p>
              </FormRow>
              <FormRow label="Employee ID (optional)">
                <input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className={inputCls} />
              </FormRow>
            </div>

            {error && <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setShowCreate(false); setError(null); }} className="px-4 py-2 text-sm text-white/65 hover:text-white">Cancel</button>
              <button onClick={submit} disabled={busy} className="rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm px-4 py-2 disabled:opacity-50">
                {busy ? "Creating…" : "Create officer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FormRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">{label}</span>
    <div className="mt-1.5">{children}</div>
  </label>
);

const inputCls = "w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60";

export default Users;

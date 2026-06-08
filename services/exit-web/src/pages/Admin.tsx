import React, { useState } from "react";
import { Card, Kpi, SectionHeader, Button, Field, inputCls, notify } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { ROLE_LABEL, type Role, type Plan } from "../lib/access";

// Admin console — the back office. Account roster, plan mix and system status,
// plus the superadmin's ability to provision admin accounts. Illustrative data
// in demo mode; wires to the identity service in production.

interface Account { name: string; email: string; role: Role; plan: Plan; deals: number }

const SEED: Account[] = [
  { name: "Tcha Mer", email: "tchamer@aol.com", role: "superadmin", plan: "pro", deals: 0 },
  { name: "James Okafor", email: "founder@helios.co", role: "founder", plan: "pro", deals: 1 },
  { name: "Dana Reyes", email: "dana@northwind.io", role: "founder", plan: "free", deals: 0 },
  { name: "Amazon Strategic", email: "corpdev@amazon-strategic.com", role: "buyer", plan: "pro", deals: 4 },
  { name: "Pritzker Private Capital", email: "deals@pritzker.com", role: "buyer", plan: "free", deals: 0 },
  { name: "Ops · Calibration", email: "ops@exitos.com", role: "admin", plan: "pro", deals: 0 },
];

const ROLE_STYLE: Record<Role, string> = {
  founder: "text-deal-300", buyer: "text-loi-300", admin: "text-stage-engaged", superadmin: "text-red-300",
};

const Admin: React.FC = () => {
  const { session } = useAuth();
  const isSuper = session?.role === "superadmin";
  const [accounts, setAccounts] = useState<Account[]>(SEED);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const createAdmin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    if (accounts.some((a) => a.email.toLowerCase() === newEmail.trim().toLowerCase())) { notify("That email already has an account"); return; }
    setAccounts((prev) => [{ name: newName.trim(), email: newEmail.trim(), role: "admin", plan: "pro", deals: 0 }, ...prev]);
    setNewName(""); setNewEmail("");
    notify(`Admin account created for ${newEmail.trim()}`);
  };

  const founders = accounts.filter((a) => a.role === "founder").length;
  const buyers = accounts.filter((a) => a.role === "buyer").length;
  const pro = accounts.filter((a) => a.plan === "pro").length;

  return (
    <div>
      <SectionHeader
        kicker="Internal · Operator"
        title="Admin Console"
        description={`Signed in as ${ROLE_LABEL[session?.role ?? "admin"]}. Account roster, plan mix and platform status.`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Accounts" value={String(accounts.length)} sub="across all roles" accent="#34d399" />
        <Kpi label="Founders" value={String(founders)} sub="seller side" />
        <Kpi label="Buyers" value={String(buyers)} sub="buy side" />
        <Kpi label="Pro subscriptions" value={`${pro}/${accounts.length}`} sub="paid plans" accent="#fbbf24" />
      </div>

      {/* Provision admins — superadmin only */}
      {isSuper ? (
        <Card className="mt-8 p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-300">Provision admin</div>
          <p className="mt-1 text-[12px] text-white/45">Superadmin only. Create an admin account for an operator on your team.</p>
          <form onSubmit={createAdmin} className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Field label="Full name"><input className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Operator name" /></Field>
            <Field label="Work email"><input className={inputCls} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="operator@exitos.com" /></Field>
            <Button type="submit" disabled={!newName.trim() || !newEmail.trim()}>Create admin</Button>
          </form>
        </Card>
      ) : (
        <Card className="mt-8 p-5 text-[13px] text-white/55">Admin provisioning is restricted to the superadmin.</Card>
      )}

      <Card className="mt-6">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3">Account</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Plan</th>
              <th className="px-5 py-3 text-right">Active deals</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.email} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-3.5"><div className="font-medium text-white">{a.name}</div><div className="text-[11px] text-white/45">{a.email}</div></td>
                <td className={`px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wide ${ROLE_STYLE[a.role]}`}>{ROLE_LABEL[a.role]}</td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${a.plan === "pro" ? "bg-deal-600/20 text-deal-300 ring-deal-400/40" : "bg-white/5 text-white/55 ring-white/15"}`}>{a.plan}</span>
                </td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white/85">{a.deals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-6 p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Platform status</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 text-[13px]">
          {[["Engines", "operational"], ["Marketplace", "operational"], ["Identity / SSO", "demo mode"]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-lg border border-white/10 bg-ink-900/40 px-3 py-2.5">
              <span className="text-white/70">{k}</span>
              <span className="flex items-center gap-1.5 text-deal-300"><span className="h-1.5 w-1.5 rounded-full bg-deal-400" />{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Admin;

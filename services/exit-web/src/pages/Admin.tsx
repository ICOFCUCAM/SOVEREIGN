import React, { useState } from "react";
import { Card, Kpi, SectionHeader, Button, Field, inputCls, notify } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { ROLE_LABEL, type Role, type Plan } from "../lib/access";
import { CHANNELS } from "../lib/social-publish";
import { useEngineStatus, usePublishHistory, ENGINE_ENDPOINT } from "../lib/distribution-engine";

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

      <SocialDistribution />
    </div>
  );
};

// ── ExitOS Distribution Engine — our own social posting backend ──────
// Channel credentials live as Supabase function secrets on exit-social-dispatch
// (LINKEDIN_ACCESS_TOKEN, X_ACCESS_TOKEN, FB_PAGE_ACCESS_TOKEN, TELEGRAM_BOT_TOKEN,
// WHATSAPP_TOKEN, INSTAGRAM_ACCESS_TOKEN, …). This panel reads the live
// connection status from the engine and shows what has been published.
const SECRET_HINT: Record<string, string> = {
  linkedin: "LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN",
  x: "X_ACCESS_TOKEN",
  facebook: "FB_PAGE_ACCESS_TOKEN + FB_PAGE_ID",
  instagram: "INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_USER_ID",
  telegram: "TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID",
  whatsapp: "WHATSAPP_TOKEN + WHATSAPP_PHONE_ID + WHATSAPP_RECIPIENTS",
};

const SocialDistribution: React.FC = () => {
  const { connected, anyConnected, loading } = useEngineStatus();
  const history = usePublishHistory();

  return (
    <Card className="mt-6 p-6">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">ExitOS Distribution Engine</div>
        <span className={`flex items-center gap-1.5 text-[11px] ${anyConnected ? "text-deal-300" : "text-loi-300"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${anyConnected ? "bg-deal-400" : "bg-loi-400"}`} />
          {loading ? "Checking…" : anyConnected ? `${Object.values(connected).filter(Boolean).length} channel(s) live` : "No channels connected"}
        </span>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">
        ExitOS's own posting engine (<span className="font-mono text-white/70">exit-social-dispatch</span>) holds each
        platform's tokens as Supabase function secrets and posts to the real APIs. The browser never sees a credential.
        Connect a channel by setting its secrets, then redeploy the function.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {CHANNELS.map((c) => {
          const on = connected[c.id];
          return (
            <div key={c.id} className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${on ? "border-deal-500/30 bg-deal-600/[0.06]" : "border-white/10 bg-ink-900/40"}`}>
              <div>
                <div className="text-[13px] font-semibold text-white">{c.label}</div>
                <div className="font-mono text-[10.5px] text-white/40">{SECRET_HINT[c.id]}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${on ? "bg-deal-600/20 text-deal-300 ring-1 ring-deal-400/40" : "bg-white/5 text-white/45 ring-1 ring-white/15"}`}>{loading ? "…" : on ? "Connected" : "Activating"}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 font-mono text-[10.5px] text-white/35 break-all">Endpoint · {ENGINE_ENDPOINT}</div>

      <div className="mt-5">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Recent publishes</div>
        {history.length === 0 ? (
          <div className="mt-2 text-[12px] text-white/45">Nothing published yet. Use “↗ Publish” on any opportunity in Acquisition Radar.</div>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {history.slice(0, 8).map((h, i) => (
              <li key={i} className="flex items-center gap-2 text-[12px]">
                <span className={h.status === "done" ? "text-deal-300" : "text-red-300"}>{h.status === "done" ? "✓" : "✗"}</span>
                <span className="capitalize text-white/70">{h.channel}</span>
                <span className="truncate text-white/45">· {h.title}</span>
                {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0 text-deal-300 hover:underline">view ↗</a>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

export default Admin;

import React, { useCallback, useEffect, useState } from "react";
import {
  listClients, createClient, updateClient, type AdminClient,
  listMembers, upsertMember, type AdminMember,
  listPolicies, upsertPolicy, type AdminPolicy,
  listRetention, upsertRetention, type RetentionPolicy,
} from "../lib/api";
import { Button, Card, Field, inputCls, timeAgo } from "../lib/ui";

// Admin surface — manage the tenant's machine clients, member roles + clearance,
// and approval policies. All gated on dispatch:admin (the API enforces it; this
// page is only shown to tenant_admin via the role-filtered nav).
const ROLES = ["viewer", "author", "reviewer", "approver", "publisher", "auditor", "tenant_admin"];
const CLEARANCES = ["none", "official", "official_sensitive", "secret", "top_secret"];

const Admin: React.FC = () => {
  const [tab, setTab] = useState<"clients" | "members" | "policies" | "retention">("clients");
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Admin</h1>
        <p className="text-sm text-white/50">Service clients, member roles &amp; clearance, approval &amp; retention policies.</p>
      </header>
      <div className="mb-6 flex gap-1 border-b border-white/10">
        {(["clients", "members", "policies", "retention"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold capitalize transition ${tab === t ? "border-gold-400 text-white" : "border-transparent text-white/45 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "clients" && <Clients />}
      {tab === "members" && <Members />}
      {tab === "policies" && <Policies />}
      {tab === "retention" && <Retention />}
    </div>
  );
};

const Banner: React.FC<{ kind: "ok" | "err"; children: React.ReactNode }> = ({ kind, children }) => (
  <div className={`mb-4 rounded border px-3 py-2 text-sm ${kind === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>{children}</div>
);

// ---- Service clients ----
const Clients: React.FC = () => {
  const [items, setItems] = useState<AdminClient[]>([]);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<{ clientId: string; secret: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { try { setItems((await listClients()).items); } catch (e) { setErr(e instanceof Error ? e.message : "load failed"); } }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setBusy(true); setErr(null); setSecret(null);
    try { const r = await createClient(name.trim(), ["dispatch:read"]); setSecret({ clientId: r.clientId, secret: r.secret }); setName(""); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : "create failed"); }
    finally { setBusy(false); }
  };
  const toggle = async (c: AdminClient) => { await updateClient(c.id, { active: !c.active }).catch((e) => setErr(e.message)); await load(); };

  return (
    <div>
      {err && <Banner kind="err">{err}</Banner>}
      {secret && (
        <Banner kind="ok">
          Client <span className="font-mono">{secret.clientId}</span> created. Secret (shown once):
          <span className="ml-2 select-all rounded bg-black/40 px-2 py-0.5 font-mono text-xs text-gold-200">{secret.secret}</span>
        </Banner>
      )}
      <Card className="mb-6 p-4">
        <Field label="Provision a new service client">
          <div className="flex gap-2">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name (e.g. Emergency AI)" />
            <Button onClick={create} disabled={busy || !name.trim()}>Create</Button>
          </div>
        </Field>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/40">
            <th className="px-4 py-2">Name</th><th className="px-4 py-2">Client ID</th><th className="px-4 py-2">Clearance</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Last used</th><th className="px-4 py-2"></th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="px-4 py-2.5 font-medium text-white">{c.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-white/60">{c.clientId}</td>
                <td className="px-4 py-2.5 text-white/60">{c.clearance}</td>
                <td className="px-4 py-2.5">{c.active ? <span className="text-emerald-300">active</span> : <span className="text-white/40">disabled</span>}</td>
                <td className="px-4 py-2.5 text-right text-xs text-white/40">{c.lastUsedAt ? timeAgo(c.lastUsedAt) : "—"}</td>
                <td className="px-4 py-2.5 text-right"><button onClick={() => toggle(c)} className="text-xs font-semibold text-white/50 hover:text-white">{c.active ? "Disable" : "Enable"}</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-white/30">No service clients.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ---- Members ----
const Members: React.FC = () => {
  const [items, setItems] = useState<AdminMember[]>([]);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("author");
  const [clearance, setClearance] = useState("none");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => { try { setItems((await listMembers()).items); } catch (e) { setErr(e instanceof Error ? e.message : "load failed"); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setErr(null);
    try { await upsertMember(userId.trim(), role, clearance); setUserId(""); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : "save failed"); }
  };

  return (
    <div>
      {err && <Banner kind="err">{err}</Banner>}
      <Card className="mb-6 p-4">
        <Field label="Add / update a member (by user id)">
          <div className="flex flex-wrap gap-2">
            <input className={`${inputCls} flex-1`} value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user UUID" />
            <select className={`${inputCls} w-44`} value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            <select className={`${inputCls} w-44`} value={clearance} onChange={(e) => setClearance(e.target.value)}>{CLEARANCES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <Button onClick={save} disabled={!userId.trim()}>Save</Button>
          </div>
        </Field>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/40">
            <th className="px-4 py-2">User</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Clearance</th><th className="px-4 py-2">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {items.map((m) => (
              <tr key={m.id} className="hover:bg-white/5">
                <td className="px-4 py-2.5 font-mono text-xs text-white/70">{m.userId}</td>
                <td className="px-4 py-2.5 text-white">{m.role}</td>
                <td className="px-4 py-2.5 text-white/60">{m.clearance}</td>
                <td className="px-4 py-2.5 text-white/50">{m.status}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-white/30">No members.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ---- Approval policies ----
const Policies: React.FC = () => {
  const [items, setItems] = useState<AdminPolicy[]>([]);
  const [docType, setDocType] = useState("");
  const [level, setLevel] = useState("");
  const [required, setRequired] = useState(1);
  const [autoUser, setAutoUser] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => { try { setItems((await listPolicies()).items); } catch (e) { setErr(e instanceof Error ? e.message : "load failed"); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setErr(null);
    try { await upsertPolicy({ docType: docType || undefined, classificationLevel: level || undefined, requiredApprovals: required, autoApproveUser: autoUser }); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : "save failed"); }
  };

  return (
    <div>
      {err && <Banner kind="err">{err}</Banner>}
      <Card className="mb-6 p-4">
        <Field label="Set an approval policy" hint="Blank doc type / level = applies as a wildcard. Most-specific policy wins.">
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${inputCls} w-48`} value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="doc type (or blank)" />
            <input className={`${inputCls} w-48`} value={level} onChange={(e) => setLevel(e.target.value)} placeholder="classification (or blank)" />
            <label className="flex items-center gap-2 text-sm text-white/70">approvals
              <input type="number" min={0} max={5} className={`${inputCls} w-16`} value={required} onChange={(e) => setRequired(Number(e.target.value))} />
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={autoUser} onChange={(e) => setAutoUser(e.target.checked)} /> auto-approve user lane
            </label>
            <Button onClick={save}>Save</Button>
          </div>
        </Field>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/40">
            <th className="px-4 py-2">Doc type</th><th className="px-4 py-2">Classification</th><th className="px-4 py-2">Required</th><th className="px-4 py-2">Auto (service)</th><th className="px-4 py-2">Auto (user)</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-white/5">
                <td className="px-4 py-2.5 text-white">{p.docType ?? <span className="text-white/30">any</span>}</td>
                <td className="px-4 py-2.5 text-white/60">{p.classificationLevel ?? <span className="text-white/30">any</span>}</td>
                <td className="px-4 py-2.5 text-white">{p.requiredApprovals}</td>
                <td className="px-4 py-2.5 text-white/60">{p.autoApproveService ? "yes" : "no"}</td>
                <td className="px-4 py-2.5 text-white/60">{p.autoApproveUser ? "yes" : "no"}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-white/30">No policies (defaults apply).</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ---- Retention policies ----
const Retention: React.FC = () => {
  const [items, setItems] = useState<RetentionPolicy[]>([]);
  const [level, setLevel] = useState("");
  const [retentionDays, setRetentionDays] = useState(365);
  const [graceDays, setGraceDays] = useState(30);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => { try { setItems((await listRetention()).items); } catch (e) { setErr(e instanceof Error ? e.message : "load failed"); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setErr(null);
    try { await upsertRetention({ classificationLevel: level || undefined, retentionDays, purgeGraceDays: graceDays }); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : "save failed"); }
  };

  return (
    <div>
      {err && <Banner kind="err">{err}</Banner>}
      <Card className="mb-6 p-4">
        <Field label="Set a retention policy" hint="Blank classification = wildcard default. Most-specific wins. Computed at publish into archive + purge dates.">
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${inputCls} w-52`} value={level} onChange={(e) => setLevel(e.target.value)} placeholder="classification (or blank)" />
            <label className="flex items-center gap-2 text-sm text-white/70">retain days
              <input type="number" min={0} max={36500} className={`${inputCls} w-24`} value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value))} />
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70">purge grace
              <input type="number" min={0} max={36500} className={`${inputCls} w-20`} value={graceDays} onChange={(e) => setGraceDays(Number(e.target.value))} />
            </label>
            <Button onClick={save}>Save</Button>
          </div>
        </Field>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/40">
            <th className="px-4 py-2">Classification</th><th className="px-4 py-2">Retention (days)</th><th className="px-4 py-2">Purge grace (days)</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-white/5">
                <td className="px-4 py-2.5 text-white">{p.classificationLevel ?? <span className="text-white/30">any (default)</span>}</td>
                <td className="px-4 py-2.5 text-white/70">{p.retentionDays}</td>
                <td className="px-4 py-2.5 text-white/70">{p.purgeGraceDays}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-white/30">No retention policies (tenant default applies).</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Admin;

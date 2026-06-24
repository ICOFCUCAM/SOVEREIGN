import React, { useCallback, useEffect, useState } from "react";
import { listClients, getGovernance, createGovRole, grantGovRole, createDelegation,
  type ServiceClient, type GovRole, type GovGrant, type GovDelegation, humanError } from "../lib/api";
import { Button, Card, Field, inputCls } from "../lib/ui";

// Authority Directory — the Identity domain. Answers, in five seconds: who holds
// which governance authority, and which authorities are delegated or expired.
// A principal's identity is its credential (subject "svc:<clientId>"); a grant
// binds that identity to a named role. This is who-may-act, not a CRUD table.
const subjectLabel = (s: string) => s.replace(/^svc:/, "").replace(/^user:/, "");

const AuthorityDirectory: React.FC = () => {
  const [clients, setClients] = useState<ServiceClient[]>([]);
  const [roles, setRoles] = useState<GovRole[]>([]);
  const [grants, setGrants] = useState<GovGrant[]>([]);
  const [delegations, setDelegations] = useState<GovDelegation[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ key: "", label: "" });
  const [del, setDel] = useState({ roleKey: "", delegateSubject: "", reason: "", endsAt: "" });

  const load = useCallback(async () => {
    try {
      const [c, g] = await Promise.all([listClients(), getGovernance()]);
      setClients(c.clients); setRoles(g.roles); setGrants(g.grants); setDelegations(g.delegations);
    } catch (e) { setErr(humanError(e, "Could not load the authority directory.")); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rolesFor = (subject: string) => grants.filter((x) => x.subject === subject).map((x) => x.role_key);
  const addRole = async () => {
    if (!newRole.key.trim() || !newRole.label.trim()) return;
    try { await createGovRole(newRole.key.trim().toLowerCase().replace(/\s+/g, "_"), newRole.label.trim()); setNewRole({ key: "", label: "" }); load(); }
    catch (e) { setErr(humanError(e, "Could not add the role.")); }
  };
  const grant = async (subject: string, roleKey: string) => {
    if (!roleKey) return;
    try { await grantGovRole(subject, roleKey); load(); } catch (e) { setErr(humanError(e, "Could not grant the role.")); }
  };
  const addDelegation = async () => {
    if (!del.roleKey || !del.delegateSubject || !del.endsAt) return;
    try { await createDelegation({ roleKey: del.roleKey, delegateSubject: del.delegateSubject, reason: del.reason || undefined, endsAt: new Date(del.endsAt).toISOString() }); setDel({ roleKey: "", delegateSubject: "", reason: "", endsAt: "" }); load(); }
    catch (e) { setErr(humanError(e, "Could not record the delegation.")); }
  };

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Identity</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Authority Directory</h1>
        <p className="text-sm text-white/50">Who holds authority to govern records — roles, the principals that hold them, and active delegations.</p>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* principals × held authorities */}
          <Card className="p-5">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Principals &amp; held authorities</div>
            <div className="divide-y divide-white/5">
              {clients.length === 0 ? <p className="py-4 text-sm text-white/40">No credentials issued yet.</p> : clients.map((c) => {
                const subject = `svc:${c.client_id}`;
                const held = rolesFor(subject);
                return (
                  <div key={c.client_id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{c.name || c.client_id}</div>
                      <div className="truncate font-mono text-[11px] text-white/35">{c.client_id}{c.active ? "" : " · revoked"}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {held.length === 0 ? <span className="text-[11px] text-white/30">no governance authority</span> :
                          held.map((r) => <span key={r} className="rounded bg-seal/25 px-1.5 py-0.5 text-[10px] font-semibold text-seal-light ring-1 ring-seal-light/30">{roles.find((x) => x.key === r)?.label || r}</span>)}
                      </div>
                    </div>
                    <select className={`${inputCls} w-40 shrink-0`} value="" onChange={(e) => grant(subject, e.target.value)}>
                      <option value="">+ Grant role…</option>
                      {roles.filter((r) => !held.includes(r.key)).map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* delegations */}
          <Card className="p-5">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Delegations</div>
            {delegations.length === 0 ? <p className="text-sm text-white/40">No delegations recorded.</p> : (
              <ul className="space-y-2">
                {delegations.map((d, i) => (
                  <li key={i} className="flex items-center justify-between rounded border border-white/10 px-3 py-2 text-[12.5px]">
                    <div>
                      <span className="font-semibold text-white">{subjectLabel(d.delegate_subject)}</span>
                      <span className="text-white/45"> acts as </span>
                      <span className="text-seal-light">{roles.find((x) => x.key === d.role_key)?.label || d.role_key}</span>
                      {d.reason && <span className="text-white/35"> · {d.reason}</span>}
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${d.expired ? "bg-zinc-500/20 text-zinc-400" : "bg-emerald-500/15 text-emerald-300"}`}>{d.expired ? "Expired" : "Active"} · until {d.ends_at ? new Date(d.ends_at).toLocaleDateString() : "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* right rail: define a role + delegate */}
        <div className="space-y-6">
          <Card className="space-y-3 self-start p-5">
            <div className="text-sm font-bold text-white">Authorities (roles)</div>
            <div className="flex flex-wrap gap-1.5">
              {roles.length === 0 ? <span className="text-[12px] text-white/40">No roles defined.</span> :
                roles.map((r) => <span key={r.key} className="rounded bg-white/5 px-2 py-0.5 text-[12px] text-white/75">{r.label}</span>)}
            </div>
            <Field label="New role label"><input className={inputCls} value={newRole.label} onChange={(e) => setNewRole({ label: e.target.value, key: e.target.value })} placeholder="Secretary General" /></Field>
            <Button className="w-full" disabled={!newRole.label.trim()} onClick={addRole}>Add authority</Button>
          </Card>

          <Card className="space-y-3 p-5">
            <div className="text-sm font-bold text-white">Delegate an authority</div>
            <Field label="Role">
              <select className={inputCls} value={del.roleKey} onChange={(e) => setDel({ ...del, roleKey: e.target.value })}>
                <option value="">Select role…</option>
                {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Delegate (principal)">
              <select className={inputCls} value={del.delegateSubject} onChange={(e) => setDel({ ...del, delegateSubject: e.target.value })}>
                <option value="">Select principal…</option>
                {clients.map((c) => <option key={c.client_id} value={`svc:${c.client_id}`}>{c.name || c.client_id}</option>)}
              </select>
            </Field>
            <Field label="Reason"><input className={inputCls} value={del.reason} onChange={(e) => setDel({ ...del, reason: e.target.value })} placeholder="Director on leave" /></Field>
            <Field label="Until"><input type="date" className={inputCls} value={del.endsAt} onChange={(e) => setDel({ ...del, endsAt: e.target.value })} /></Field>
            <Button className="w-full" disabled={!del.roleKey || !del.delegateSubject || !del.endsAt} onClick={addDelegation}>Record delegation</Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDirectory;

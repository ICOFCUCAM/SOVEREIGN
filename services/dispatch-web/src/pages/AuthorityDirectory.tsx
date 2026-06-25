import React, { useCallback, useEffect, useState } from "react";
import { listClients, getGovernance, getUsers, createUser, createGovRole, grantGovRole, createDelegation,
  type ServiceClient, type GovRole, type GovGrant, type GovDelegation, type Department, type Person, humanError } from "../lib/api";
import { Button, Card, Field, inputCls } from "../lib/ui";

// Authority Directory — the Identity domain. Answers, in five seconds: who holds
// which governance authority, and which authorities are delegated or expired.
// A principal's identity is its credential (subject "svc:<clientId>"); a grant
// binds that identity to a named role. This is who-may-act, not a CRUD table.
const subjectLabel = (s: string) => s.replace(/^svc:/, "").replace(/^user:/, "");

const AuthorityDirectory: React.FC = () => {
  const [clients, setClients] = useState<ServiceClient[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<GovRole[]>([]);
  const [grants, setGrants] = useState<GovGrant[]>([]);
  const [delegations, setDelegations] = useState<GovDelegation[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ key: "", label: "" });
  const [newPerson, setNewPerson] = useState({ fullName: "", email: "", departmentKey: "", systemAdmin: false });
  const [del, setDel] = useState({ roleKey: "", delegateSubject: "", reason: "", endsAt: "" });

  const load = useCallback(async () => {
    try {
      const [c, g, u] = await Promise.all([listClients(), getGovernance(), getUsers().catch(() => ({ users: [] }))]);
      setClients(c.clients); setDepartments(g.departments ?? []); setRoles(g.roles); setGrants(g.grants); setDelegations(g.delegations);
      setPeople(u.users);
    } catch (e) { setErr(humanError(e, "Could not load the authority directory.")); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Resolve a grant subject to a human name (a person) or a service name (a
  // machine), so the directory speaks of people and integrations, not "svc:…".
  const nameOf = (subject: string): string => {
    if (subject.startsWith("user:")) return people.find((p) => p.subject === subject)?.fullName ?? subjectLabel(subject);
    if (subject.startsWith("svc:")) return clients.find((c) => `svc:${c.client_id}` === subject)?.name ?? subjectLabel(subject);
    return subjectLabel(subject);
  };
  const rolesFor = (subject: string) => grants.filter((x) => x.subject === subject).map((x) => x.role_key);
  // Offices are meant to be held by PEOPLE; a service credential holding one is a
  // bootstrap exception, so each holder carries whether it is a machine.
  const holdersOf = (roleKey: string) => grants.filter((x) => x.role_key === roleKey).map((x) => ({ name: nameOf(x.subject), service: x.subject.startsWith("svc:") }));
  const addPerson = async () => {
    if (!newPerson.fullName.trim() || !newPerson.email.trim()) return;
    try { await createUser({ fullName: newPerson.fullName.trim(), email: newPerson.email.trim(), departmentKey: newPerson.departmentKey || undefined, systemAdmin: newPerson.systemAdmin }); setNewPerson({ fullName: "", email: "", departmentKey: "", systemAdmin: false }); load(); }
    catch (e) { setErr(humanError(e, "Could not add the person.")); }
  };
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
        <h1 className="mt-1.5 font-serif text-[1.9rem] font-bold leading-tight tracking-tight text-white">Authority Directory</h1>
        <p className="text-sm text-white/50">The institution as it is organised — departments, the offices within them, and the people who occupy those offices. Authority belongs to the office; people are assigned to it over time.</p>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {/* ── INSTITUTIONAL STRUCTURE — Departments → Offices → Holders ── */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Institutional structure</div>
          <div className="font-mono text-[11px] tabular-nums text-white/30">{departments.length} department{departments.length === 1 ? "" : "s"} · {roles.length} office{roles.length === 1 ? "" : "s"}</div>
        </div>
        {departments.length === 0 && roles.length === 0 ? (
          <p className="py-3 text-sm text-white/40">No departments or offices defined yet.</p>
        ) : (
          <div className="space-y-5">
            {[...departments.map((d) => ({ key: d.key, name: d.name })), { key: null as string | null, name: "Unassigned offices" }]
              .map((dept) => {
                const offices = roles.filter((r) => (r.department_key ?? null) === dept.key)
                  .sort((a, b) => (a.display_order ?? 100) - (b.display_order ?? 100));
                if (offices.length === 0) return null;
                return (
                  <div key={dept.key ?? "_unassigned"}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[12.5px] font-bold uppercase tracking-[0.12em] text-white/70">{dept.name}</span>
                      <span className="h-px flex-1 bg-white/[0.07]" />
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {offices.map((o) => {
                        const holders = holdersOf(o.key);
                        return (
                          <div key={o.key} className="rounded-lg border border-white/10 bg-ink-900/40 px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-white">{o.label}</span>
                              <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">Office</span>
                            </div>
                            <div className="mt-1.5 text-[11px] text-white/45">
                              {holders.length === 0
                                ? <span className="text-amber-300/70">Vacant — no holder assigned</span>
                                : <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">Held by {holders.map((h, i) => (
                                    <span key={i} className="inline-flex items-center gap-1">
                                      <span className="text-white/75">{h.name}</span>
                                      {h.service && <span className="rounded bg-amber-500/15 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-amber-300/90" title="A service credential temporarily holding this office (bootstrap). Reserve offices for people.">bootstrap</span>}
                                      {i < holders.length - 1 ? <span className="text-white/30">·</span> : null}
                                    </span>
                                  ))}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* ── PEOPLE — the human directory; a person occupies offices ── */}
      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">People</div>
          <div className="font-mono text-[11px] tabular-nums text-white/30">{people.length} {people.length === 1 ? "person" : "people"}</div>
        </div>
        <p className="mb-3 text-[12px] text-white/40">People are added by the institution and assigned to offices. Authentication (institutional sign-in) federates onto these identities — Dispatch never stores their passwords.</p>

        {/* add a person */}
        <div className="mb-4 grid gap-2 sm:grid-cols-[1.2fr_1.4fr_1fr_auto]">
          <input className={inputCls} value={newPerson.fullName} onChange={(e) => setNewPerson({ ...newPerson, fullName: e.target.value })} placeholder="Full name" />
          <input className={inputCls} value={newPerson.email} onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })} placeholder="name@ministry.gov" />
          <select className={inputCls} value={newPerson.departmentKey} onChange={(e) => setNewPerson({ ...newPerson, departmentKey: e.target.value })}>
            <option value="">Department…</option>
            {departments.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
          </select>
          <Button disabled={!newPerson.fullName.trim() || !newPerson.email.trim()} onClick={addPerson}>Add person</Button>
        </div>
        <label className="mb-4 flex items-center gap-2 text-[12px] text-white/55">
          <input type="checkbox" checked={newPerson.systemAdmin} onChange={(e) => setNewPerson({ ...newPerson, systemAdmin: e.target.checked })} />
          System administrator (IT permissions) — separate from institutional authority
        </label>

        {people.length === 0 ? <p className="py-2 text-sm text-white/40">No people added yet.</p> : (
          <div className="divide-y divide-white/5">
            {people.map((p) => {
              const held = rolesFor(p.subject);
              const dept = departments.find((d) => d.key === p.departmentKey)?.name;
              return (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{p.fullName}</span>
                      {p.systemAdmin && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">System Admin</span>}
                    </div>
                    <div className="truncate text-[11px] text-white/35">{p.email}{dept ? ` · ${dept}` : ""}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {held.length === 0 ? <span className="text-[11px] text-white/30">holds no office</span> :
                        held.map((r) => <span key={r} className="rounded bg-seal/25 px-1.5 py-0.5 text-[10px] font-semibold text-seal-light ring-1 ring-seal-light/30">{roles.find((x) => x.key === r)?.label || r}</span>)}
                    </div>
                  </div>
                  <select className={`${inputCls} w-44 shrink-0`} value="" onChange={(e) => grant(p.subject, e.target.value)}>
                    <option value="">+ Assign office…</option>
                    {roles.filter((r) => !held.includes(r.key)).map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* service credentials — machines & integrations (not people) */}
          <Card className="p-5">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Service credentials</div>
            <p className="mb-3 text-[11px] text-white/35">Machines, integrations &amp; bootstrap — system-to-system callers and automated ingestion. They carry capabilities, not authority. People sign in through the institution, above.</p>
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

import React, { useCallback, useEffect, useState } from "react";
import { listClients, getGovernance, getUsers, createUser, deleteUser, createGovRole, createDepartment,
  deleteDepartment, deleteGovRole, grantGovRole, revokeGovRole, createDelegation, endDelegation,
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
  const [newDept, setNewDept] = useState("");
  const [newRole, setNewRole] = useState({ label: "", departmentKey: "", displayOrder: "" });
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
  const holdersOf = (roleKey: string) => grants.filter((x) => x.role_key === roleKey).map((x) => ({ subject: x.subject, name: nameOf(x.subject), service: x.subject.startsWith("svc:") }));
  const addPerson = async () => {
    if (!newPerson.fullName.trim() || !newPerson.email.trim()) return;
    try { await createUser({ fullName: newPerson.fullName.trim(), email: newPerson.email.trim(), departmentKey: newPerson.departmentKey || undefined, systemAdmin: newPerson.systemAdmin }); setNewPerson({ fullName: "", email: "", departmentKey: "", systemAdmin: false }); load(); }
    catch (e) { setErr(humanError(e, "Could not add the person.")); }
  };
  const keyFrom = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const addDepartment = async () => {
    if (!newDept.trim()) return;
    try { await createDepartment(keyFrom(newDept), newDept.trim(), (departments.length + 1) * 10); setNewDept(""); load(); }
    catch (e) { setErr(humanError(e, "Could not add the department.")); }
  };
  const addRole = async () => {
    if (!newRole.label.trim()) return;
    try {
      await createGovRole(keyFrom(newRole.label), newRole.label.trim(), newRole.departmentKey || undefined,
        newRole.displayOrder ? Number(newRole.displayOrder) : undefined);
      setNewRole({ label: "", departmentKey: "", displayOrder: "" }); load();
    } catch (e) { setErr(humanError(e, "Could not add the office.")); }
  };
  const grant = async (subject: string, roleKey: string) => {
    if (!roleKey) return;
    try { await grantGovRole(subject, roleKey); load(); } catch (e) { setErr(humanError(e, "Could not grant the role.")); }
  };
  const revoke = async (subject: string, roleKey: string) => {
    try { await revokeGovRole(subject, roleKey); load(); } catch (e) { setErr(humanError(e, "Could not revoke.")); }
  };
  const moveOffice = async (o: GovRole, departmentKey: string) => {
    try { await createGovRole(o.key, o.label, departmentKey || undefined, o.display_order); load(); }
    catch (e) { setErr(humanError(e, "Could not move the office.")); }
  };
  const removeOffice = async (o: GovRole) => {
    if (!window.confirm(`Remove the office “${o.label}”? Any current holder is unassigned and any governance policy step that references it stops resolving.`)) return;
    try { await deleteGovRole(o.key); load(); } catch (e) { setErr(humanError(e, "Could not remove the office.")); }
  };
  const removeDepartment = async (d: Department) => {
    if (!window.confirm(`Remove the department “${d.name}”? Its offices become unassigned (they are not deleted).`)) return;
    try { await deleteDepartment(d.key); load(); } catch (e) { setErr(humanError(e, "Could not remove the department.")); }
  };
  const removePerson = async (p: Person) => {
    if (!window.confirm(`Remove ${p.fullName}? They are deactivated and every office they hold is vacated.`)) return;
    try { await deleteUser(p.id); load(); } catch (e) { setErr(humanError(e, "Could not remove the person.")); }
  };
  // In-place rename — the KEY (what policies reference) is stable; only the
  // display name changes, so renaming an office never disturbs governance.
  const [editing, setEditing] = useState<{ kind: "dept" | "office"; key: string } | null>(null);
  const [editVal, setEditVal] = useState("");
  const startEdit = (kind: "dept" | "office", key: string, current: string) => { setEditing({ kind, key }); setEditVal(current); };
  const saveEdit = async () => {
    if (!editing || !editVal.trim()) { setEditing(null); return; }
    try {
      if (editing.kind === "dept") { const d = departments.find((x) => x.key === editing.key); await createDepartment(editing.key, editVal.trim(), d?.display_order); }
      else { const o = roles.find((x) => x.key === editing.key); await createGovRole(editing.key, editVal.trim(), o?.department_key ?? undefined, o?.display_order); }
      setEditing(null); load();
    } catch (e) { setEditing(null); setErr(humanError(e, "Could not rename.")); }
  };
  const editKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); };
  const actingFor = (roleKey: string) => delegations.filter((d) => d.role_key === roleKey && !d.expired);
  const endActing = async (roleKey: string, delegateSubject: string) => {
    try { await endDelegation(roleKey, delegateSubject); load(); } catch (e) { setErr(humanError(e, "Could not end the acting appointment.")); }
  };
  // Everyone who can hold an office: people first (offices are for people), then
  // service credentials (bootstrap). Used for assignment and acting appointments.
  const principals = [
    ...people.map((p) => ({ subject: p.subject, label: p.fullName })),
    ...clients.map((c) => ({ subject: `svc:${c.client_id}`, label: `${c.name || c.client_id} (service)` })),
  ];
  const addDelegation = async () => {
    if (!del.roleKey || !del.delegateSubject || !del.endsAt) return;
    try { await createDelegation({ roleKey: del.roleKey, delegateSubject: del.delegateSubject, reason: del.reason || undefined, endsAt: new Date(del.endsAt).toISOString() }); setDel({ roleKey: "", delegateSubject: "", reason: "", endsAt: "" }); load(); }
    catch (e) { setErr(humanError(e, "Could not record the delegation.")); }
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-seal-light">Identity</div>
        <h1 className="mt-1.5 font-serif text-[2rem] font-bold leading-tight tracking-tight text-white">Authority Directory</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/50">The institution as it is organised — departments, the offices within them, and the people who occupy those offices. Authority belongs to the office; people are assigned to it over time.</p>
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
            {[...departments, null as Department | null].map((deptObj) => {
              const deptKey = deptObj?.key ?? null;
              const offices = roles.filter((r) => (r.department_key ?? null) === deptKey)
                .sort((a, b) => (a.display_order ?? 100) - (b.display_order ?? 100));
              if (offices.length === 0 && !deptObj) return null; // hide the empty "Unassigned" group
              return (
                <div key={deptKey ?? "_unassigned"}>
                  <div className="group mb-2 flex items-center gap-2">
                    {deptObj && editing?.kind === "dept" && editing.key === deptObj.key
                      ? <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={editKeyDown} onBlur={saveEdit}
                          className="rounded border border-seal-light/40 bg-ink-900/70 px-1.5 py-0.5 text-[12.5px] font-bold uppercase tracking-[0.12em] text-white" />
                      : <button onClick={() => deptObj && startEdit("dept", deptObj.key, deptObj.name)} disabled={!deptObj} title={deptObj ? "Rename department" : undefined}
                          className="text-[12.5px] font-bold uppercase tracking-[0.12em] text-white/70 hover:text-white disabled:cursor-default">{deptObj?.name ?? "Unassigned offices"}</button>}
                    <span className="h-px flex-1 bg-white/[0.07]" />
                    {deptObj && <button onClick={() => removeDepartment(deptObj)} className="text-[10px] font-semibold uppercase tracking-wide text-white/25 opacity-0 transition hover:text-red-300 group-hover:opacity-100">Remove</button>}
                  </div>
                  {offices.length === 0 ? (
                    <p className="px-1 pb-1 text-[11px] text-white/30">No offices in this department yet — add one on the right.</p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {offices.map((o) => {
                        const holders = holdersOf(o.key);
                        return (
                          <div key={o.key} className="group rounded-lg border border-white/10 bg-ink-900/40 px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                              {editing?.kind === "office" && editing.key === o.key
                                ? <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={editKeyDown} onBlur={saveEdit}
                                    className="w-full rounded border border-seal-light/40 bg-ink-900/70 px-1.5 py-0.5 text-sm font-semibold text-white" />
                                : <button onClick={() => startEdit("office", o.key, o.label)} title="Rename office" className="text-sm font-semibold text-white hover:text-seal-light">{o.label}</button>}
                              <div className="flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
                                <select value={o.department_key ?? ""} onChange={(e) => moveOffice(o, e.target.value)} title="Move to department"
                                  className="rounded border border-white/10 bg-ink-900/70 px-1 py-0.5 text-[10px] text-white/60">
                                  <option value="">Unassigned</option>
                                  {departments.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
                                </select>
                                <button onClick={() => removeOffice(o)} title="Remove office" className="text-white/30 hover:text-red-300">✕</button>
                              </div>
                            </div>
                            <div className="mt-1.5 text-[11px] text-white/45">
                              {holders.length === 0
                                ? <span className="text-amber-300/70">Vacant — no holder assigned</span>
                                : <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">Held by {holders.map((h, i) => (
                                    <span key={i} className="inline-flex items-center gap-1">
                                      <span className="text-white/75">{h.name}</span>
                                      {h.service && <span className="rounded bg-amber-500/15 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-amber-300/90" title="A service credential temporarily holding this office (bootstrap). Reserve offices for people.">bootstrap</span>}
                                      <button onClick={() => revoke(h.subject, o.key)} title="Revoke this holder" className="text-white/25 hover:text-red-300">✕</button>
                                      {i < holders.length - 1 ? <span className="text-white/30">·</span> : null}
                                    </span>
                                  ))}</span>}
                            </div>
                            {actingFor(o.key).map((d, i) => (
                              <div key={i} className="mt-1 inline-flex items-center gap-1.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-200/90">
                                <span className="font-semibold uppercase tracking-wide text-amber-300/80 text-[9px]">Acting</span>
                                <span className="text-white/80">{nameOf(d.delegate_subject)}</span>
                                <span className="text-white/40">until {d.ends_at ? new Date(d.ends_at).toLocaleDateString() : "—"}</span>
                                <button onClick={() => endActing(o.key, d.delegate_subject)} title="End acting appointment" className="text-amber-300/50 hover:text-red-300">✕</button>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                        held.map((r) => (
                          <span key={r} className="inline-flex items-center gap-1 rounded bg-seal/25 px-1.5 py-0.5 text-[10px] font-semibold text-seal-light ring-1 ring-seal-light/30">
                            {roles.find((x) => x.key === r)?.label || r}
                            <button onClick={() => revoke(p.subject, r)} title="Vacate this office" className="text-seal-light/60 hover:text-red-300">✕</button>
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <select className={`${inputCls} w-40`} value="" onChange={(e) => grant(p.subject, e.target.value)}>
                      <option value="">+ Assign office…</option>
                      {roles.filter((r) => !held.includes(r.key)).map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                    <button onClick={() => removePerson(p)} title="Remove person" className="rounded px-1.5 py-1 text-[11px] font-semibold text-white/30 hover:text-red-300">Remove</button>
                  </div>
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

          {/* acting appointments */}
          <Card className="p-5">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Acting appointments</div>
            <p className="mb-3 text-[11px] text-white/35">A person temporarily acting in an office — when the holder is on leave. The office and its governance never change; only who occupies it, for a window.</p>
            {delegations.length === 0 ? <p className="text-sm text-white/40">No acting appointments in force.</p> : (
              <ul className="space-y-2">
                {delegations.map((d, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded border border-white/10 px-3 py-2 text-[12.5px]">
                    <div className="min-w-0">
                      <span className="font-semibold text-white">{nameOf(d.delegate_subject)}</span>
                      <span className="text-white/45"> acting as </span>
                      <span className="text-seal-light">{roles.find((x) => x.key === d.role_key)?.label || d.role_key}</span>
                      {d.reason && <span className="text-white/35"> · {d.reason}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${d.expired ? "bg-zinc-500/20 text-zinc-400" : "bg-amber-500/15 text-amber-300"}`}>{d.expired ? "Expired" : "Acting"} · until {d.ends_at ? new Date(d.ends_at).toLocaleDateString() : "—"}</span>
                      {!d.expired && <button onClick={() => endActing(d.role_key, d.delegate_subject)} title="End acting appointment" className="text-white/30 hover:text-red-300">✕</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* right rail: build the organisation (departments + offices) + delegate */}
        <div className="space-y-6">
          <Card className="space-y-3 self-start p-5">
            <div className="text-sm font-bold text-white">Add a department</div>
            <p className="text-[11px] text-white/40">The institution's organisational divisions — Policy, Legal, Communications, Archives.</p>
            <Field label="Department name"><input className={inputCls} value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Policy Division" onKeyDown={(e) => e.key === "Enter" && addDepartment()} /></Field>
            <Button className="w-full" disabled={!newDept.trim()} onClick={addDepartment}>Add department</Button>
          </Card>

          <Card className="space-y-3 p-5">
            <div className="text-sm font-bold text-white">Add an office</div>
            <p className="text-[11px] text-white/40">An office holds authority. Place it in a department and order it in protocol rank.</p>
            <Field label="Office title"><input className={inputCls} value={newRole.label} onChange={(e) => setNewRole({ ...newRole, label: e.target.value })} placeholder="Permanent Secretary" /></Field>
            <Field label="Department">
              <select className={inputCls} value={newRole.departmentKey} onChange={(e) => setNewRole({ ...newRole, departmentKey: e.target.value })}>
                <option value="">Unassigned</option>
                {departments.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Protocol order (lower = higher rank)"><input className={inputCls} type="number" value={newRole.displayOrder} onChange={(e) => setNewRole({ ...newRole, displayOrder: e.target.value })} placeholder="10" /></Field>
            <Button className="w-full" disabled={!newRole.label.trim()} onClick={addRole}>Add office</Button>
          </Card>

          <Card className="space-y-3 p-5">
            <div className="text-sm font-bold text-white">Appoint an acting holder</div>
            <p className="text-[11px] text-white/40">Place a person in an office for a window — when the substantive holder is on leave. Governance is unchanged.</p>
            <Field label="Office">
              <select className={inputCls} value={del.roleKey} onChange={(e) => setDel({ ...del, roleKey: e.target.value })}>
                <option value="">Select office…</option>
                {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Acting holder">
              <select className={inputCls} value={del.delegateSubject} onChange={(e) => setDel({ ...del, delegateSubject: e.target.value })}>
                <option value="">Select a person…</option>
                {principals.map((pr) => <option key={pr.subject} value={pr.subject}>{pr.label}</option>)}
              </select>
            </Field>
            <Field label="Reason"><input className={inputCls} value={del.reason} onChange={(e) => setDel({ ...del, reason: e.target.value })} placeholder="Director on leave" /></Field>
            <Field label="Until"><input type="date" className={inputCls} value={del.endsAt} onChange={(e) => setDel({ ...del, endsAt: e.target.value })} /></Field>
            <Button className="w-full" disabled={!del.roleKey || !del.delegateSubject || !del.endsAt} onClick={addDelegation}>Appoint acting holder</Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDirectory;

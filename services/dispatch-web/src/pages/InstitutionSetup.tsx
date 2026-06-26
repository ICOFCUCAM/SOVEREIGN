import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getGovernance, getUsers, getGovernancePolicies, createUser, createDepartment, createGovRole, grantGovRole,
  type Department, type GovRole, type GovGrant, type Person, type GovernancePolicy, humanError } from "../lib/api";
import { Button, Card, inputCls } from "../lib/ui";

// STAGE 0 — Establish Your Institution, as a GUIDED wizard. One focused step at a
// time, in the order institutions actually exist: the institution and its
// STRUCTURE first, people LAST ("institutions endure; employees change"). The
// admin always sees where they are (the journey rail) and does the work inline.
// Every step's "done" is read from live configuration — a real readiness
// instrument, not a tutorial. Governance is defined against OFFICES, so it never
// depends on who occupies them or how they authenticate.

type StepKind = "institution" | "departments" | "offices" | "policies" | "people" | "assign" | "final";
interface StepDef { id: StepKind; title: string; blurb: string; optional?: boolean }

const STEPS: StepDef[] = [
  { id: "institution", title: "Establish the institution", blurb: "Your institution is an isolated tenant — its records, people and governance are sealed from every other institution. This is already done." },
  { id: "departments", title: "Create departments", blurb: "The institution's organisational divisions — Policy, Legal, Communications, Archives. Offices live inside them." },
  { id: "offices", title: "Create institutional offices", blurb: "The offices that hold authority — Policy Officer, Director, Permanent Secretary, Archivist. Authority belongs to the office, not the person who occupies it." },
  { id: "policies", title: "Define governance policies", blurb: "How each record type is governed — a review chain of OFFICES, a publication authority, a retention horizon. Policies reference offices, never people." },
  { id: "people", title: "Add your people", blurb: "Add the institution's staff. People come late — the institution exists before its employees, and employees change while the institution endures." },
  { id: "assign", title: "Assign people to offices", blurb: "Place each person in the office they occupy. When someone leaves, reassign the office — governance does not change." },
  { id: "final", title: "You're operational", blurb: "The institution is configured. Begin turning information into governed, preserved Official Records." },
];

const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);

const InstitutionSetup: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<GovRole[]>([]);
  const [grants, setGrants] = useState<GovGrant[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false); // has the admin navigated manually?
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [g, u, p] = await Promise.all([getGovernance(), getUsers().catch(() => ({ users: [] })), getGovernancePolicies().catch(() => ({ policies: [] }))]);
      setDepartments(g.departments ?? []); setRoles(g.roles); setGrants(g.grants); setPeople(u.users); setPolicies(p.policies);
    } catch (e) { setErr(humanError(e, "Could not load the institution configuration.")); }
    finally { setLoaded(true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const peopleInOffices = grants.filter((x) => x.subject.startsWith("user:")).length;
  const officePolicies = policies.filter((p) => Array.isArray(p.reviewChain) && p.reviewChain.some((s) => s.role)).length;

  const done = useMemo<Record<StepKind, boolean>>(() => ({
    institution: true,
    departments: departments.length > 0,
    offices: roles.length > 0,
    policies: officePolicies > 0,
    people: people.length > 0,
    assign: peopleInOffices > 0,
    final: false,
  }), [departments.length, roles.length, officePolicies, people.length, peopleInOffices]);

  const count: Record<StepKind, number | null> = {
    institution: null, departments: departments.length, offices: roles.length,
    policies: officePolicies, people: people.length, assign: peopleInOffices, final: null,
  };

  const gateable = STEPS.filter((s) => s.id !== "final");
  const completeCount = gateable.filter((s) => done[s.id]).length;
  const allDone = completeCount === gateable.length;
  const firstIncomplete = gateable.findIndex((s) => !done[s.id]);

  // On first load, land the admin on the first thing that still needs doing (or the
  // finish line if everything is configured) — unless they've navigated themselves.
  useEffect(() => {
    if (!loaded || touched) return;
    setActive(allDone ? STEPS.length - 1 : firstIncomplete === -1 ? 0 : firstIncomplete);
  }, [loaded, touched, allDone, firstIncomplete]);

  const go = (i: number) => { setTouched(true); setActive(Math.max(0, Math.min(STEPS.length - 1, i))); };
  const step = STEPS[active];

  const guard = async (fn: () => Promise<unknown>) => {
    setBusy(true); setErr(null);
    try { await fn(); await load(); }
    catch (e) { setErr(humanError(e, "That action could not be completed.")); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-seal-light">Onboarding</div>
        <h1 className="mt-1.5 font-serif text-[2rem] font-bold leading-tight tracking-tight text-white">Welcome — let's establish your institution</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/50">Configure the institution the way it actually exists — structure first, people last. Governance is defined against offices, so it never depends on who occupies them or how they sign in. Most institutions finish in under an hour.</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 w-56 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald-400 transition-all" style={{ width: `${Math.round((completeCount / gateable.length) * 100)}%` }} /></div>
          <span className="font-mono text-[12px] tabular-nums text-white/50">{completeCount}/{gateable.length} configured</span>
        </div>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* ── Journey rail — where you are, what's next ── */}
        <nav className="lg:sticky lg:top-4 lg:self-start">
          <ol className="space-y-0.5">
            {STEPS.map((s, i) => {
              const isActive = i === active;
              const isDone = done[s.id];
              const c = count[s.id];
              return (
                <li key={s.id}>
                  <button onClick={() => go(i)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${isActive ? "bg-seal/15 ring-1 ring-seal-light/30" : "hover:bg-white/[0.04]"}`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${
                      s.id === "final" ? (allDone ? "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40" : "bg-white/[0.04] text-white/30 ring-white/15")
                      : isDone ? "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40"
                      : isActive ? "bg-seal/30 text-seal-light ring-seal-light/50" : "bg-white/[0.04] text-white/35 ring-white/15"}`}>
                      {s.id === "final" ? "★" : isDone ? "✓" : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] font-semibold ${isActive ? "text-white" : isDone ? "text-white/70" : "text-white/50"}`}>{s.title}</span>
                    </span>
                    {c != null && c > 0 && <span className="font-mono text-[11px] text-white/35">{c}</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ── Focused current step ── */}
        <div className="min-w-0">
          <Card className={`p-6 ${step.id === "final" ? "border-seal-light/30" : ""}`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">{step.id === "final" ? "Finish" : `Step ${active + 1} of ${gateable.length}`}</span>
              {done[step.id] && step.id !== "final" && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Done</span>}
              {step.optional && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">Optional</span>}
            </div>
            <h2 className="mt-2 font-serif text-[1.6rem] font-bold leading-tight tracking-tight text-white">{step.title}</h2>
            <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-white/55">{step.blurb}</p>

            <div className="mt-5">
              {step.id === "institution" && <InstitutionStep />}
              {step.id === "departments" && <DepartmentsStep list={departments} busy={busy} onAdd={(name) => guard(() => createDepartment(slug(name), name, (departments.length + 1) * 10))} />}
              {step.id === "offices" && <OfficesStep roles={roles} departments={departments} busy={busy} onAdd={(label, dept) => guard(() => createGovRole(slug(label), label, dept || undefined, (roles.length + 1) * 10))} />}
              {step.id === "policies" && <PoliciesStep count={officePolicies} />}
              {step.id === "people" && <PeopleStep people={people} departments={departments} busy={busy} reload={load} setErr={setErr} />}
              {step.id === "assign" && <AssignStep people={people} roles={roles} grants={grants} busy={busy} onAssign={(subject, role) => guard(() => grantGovRole(subject, role))} />}
              {step.id === "final" && <FinalStep ready={allDone} remaining={gateable.filter((s) => !done[s.id]).map((s) => s.title)} onJump={() => go(firstIncomplete === -1 ? 0 : firstIncomplete)} />}
            </div>

            {step.id !== "final" && (
              <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
                <button onClick={() => go(active - 1)} disabled={active === 0} className="text-[13px] font-semibold text-white/45 enabled:hover:text-white disabled:opacity-30">← Back</button>
                <Button variant={done[step.id] ? "primary" : "ghost"} onClick={() => go(active + 1)}>
                  {done[step.id] ? "Continue" : "Skip for now"} →
                </Button>
              </div>
            )}
          </Card>

          {/* Operating more than one institution — each is its own isolated tenant. */}
          <Card className="mt-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">More than one institution?</div>
                <p className="mt-1 text-[13px] text-white/55">A nation's ministries, or a group's agencies, are each their own <span className="text-white/75">isolated institution</span> — separate records, people and governance, sealed from one another.</p>
              </div>
              <a href="/signup" className="shrink-0 rounded-md border border-white/15 px-3 py-1.5 text-[12.5px] font-semibold text-white/75 transition hover:border-seal-light/40 hover:text-white">Establish a new institution →</a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ── Step bodies ───────────────────────────────────────────────────────────────

const InstitutionStep: React.FC = () => (
  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3 text-[13px] text-white/70">
    <span className="font-semibold text-emerald-300">Established.</span> Your institution is live as an isolated tenant. Everything below configures how it governs and publishes.
  </div>
);

const Chips: React.FC<{ items: string[]; empty: string }> = ({ items, empty }) =>
  items.length === 0 ? <p className="text-[12.5px] text-white/35">{empty}</p> : (
    <div className="flex flex-wrap gap-1.5">{items.map((t) => <span key={t} className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[12px] text-white/75 ring-1 ring-white/10">{t}</span>)}</div>
  );

const DepartmentsStep: React.FC<{ list: Department[]; busy: boolean; onAdd: (name: string) => void }> = ({ list, busy, onAdd }) => {
  const [name, setName] = useState("");
  const add = () => { if (!name.trim()) return; onAdd(name.trim()); setName(""); };
  return (
    <div className="space-y-4">
      <div><div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">Departments so far</div><Chips items={list.map((d) => d.name)} empty="None yet — add your first division below." /></div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1"><span className="mb-1 block text-[12px] text-white/50">Department name</span>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Policy Division" onKeyDown={(e) => e.key === "Enter" && add()} /></label>
        <Button disabled={!name.trim() || busy} onClick={add}>{busy ? "Adding…" : "Add department"}</Button>
      </div>
      <p className="text-[11px] text-white/35">Add as many as you need. You can refine these any time in the Authority Directory.</p>
    </div>
  );
};

const OfficesStep: React.FC<{ roles: GovRole[]; departments: Department[]; busy: boolean; onAdd: (label: string, dept: string) => void }> = ({ roles, departments, busy, onAdd }) => {
  const [label, setLabel] = useState(""); const [dept, setDept] = useState("");
  const add = () => { if (!label.trim()) return; onAdd(label.trim(), dept); setLabel(""); };
  return (
    <div className="space-y-4">
      <div><div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">Offices so far</div><Chips items={roles.map((r) => r.label)} empty="None yet — add the offices that hold authority." /></div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1"><span className="mb-1 block text-[12px] text-white/50">Office name</span>
          <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Director of Policy" onKeyDown={(e) => e.key === "Enter" && add()} /></label>
        <label><span className="mb-1 block text-[12px] text-white/50">Department</span>
          <select className={inputCls} value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">— none —</option>
            {departments.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
          </select></label>
        <Button disabled={!label.trim() || busy} onClick={add}>{busy ? "Adding…" : "Add office"}</Button>
      </div>
      <p className="text-[11px] text-white/35">Authority belongs to the office. People are placed into offices later — reassigning an office never changes governance.</p>
    </div>
  );
};

const PoliciesStep: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-4">
    <div className="rounded-lg border border-white/10 bg-ink-900/40 px-4 py-3 text-[13px] text-white/65">
      A governance policy binds a record type to a <span className="text-white/85">review chain of offices</span>, a publication authority and a retention horizon. {count > 0 ? <><span className="font-semibold text-emerald-300">{count}</span> policy{count === 1 ? "" : "s"} defined.</> : "None defined yet."}
    </div>
    <Link to="/admin/governance" className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-[12.5px] font-semibold text-white/75 transition hover:border-seal-light/40 hover:text-white">Define governance policies →</Link>
    <p className="text-[11px] text-white/35">Policies need their chain of offices, so they're defined on the Policy surface. Return here when you're done — this step will show as complete.</p>
  </div>
);

const PeopleStep: React.FC<{ people: Person[]; departments: Department[]; busy: boolean; reload: () => Promise<void>; setErr: (s: string | null) => void }> = ({ people, departments, reload, setErr }) => {
  const [csv, setCsv] = useState(""); const [importing, setImporting] = useState(false); const [msg, setMsg] = useState<string | null>(null);
  const importPeople = async () => {
    const rows = csv.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.split(",").map((c) => c.trim()));
    if (rows.length === 0) return;
    setImporting(true); setMsg(null); setErr(null);
    let ok = 0, fail = 0;
    for (const [fullName, email, dept] of rows) {
      if (!fullName || !email) { fail++; continue; }
      const departmentKey = dept ? (departments.find((d) => d.key === dept || d.name.toLowerCase() === dept.toLowerCase())?.key) : undefined;
      try { await createUser({ fullName, email, departmentKey }); ok++; } catch { fail++; }
    }
    setImporting(false); setMsg(`Imported ${ok} ${ok === 1 ? "person" : "people"}${fail ? ` · ${fail} skipped` : ""}.`); setCsv(""); await reload();
  };
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{people.length} {people.length === 1 ? "person" : "people"} added</div>
      <textarea className={`${inputCls} h-24 font-mono text-[12px]`} value={csv} onChange={(e) => setCsv(e.target.value)}
        placeholder={"Paste people — one per line:\nJohn Doe, j.doe@ministry.gov, Policy\nSarah Berg, s.berg@ministry.gov, Policy"} />
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!csv.trim() || importing} onClick={importPeople}>{importing ? "Importing…" : "Import people"}</Button>
        <Link to="/admin/authority" className="text-[12px] font-semibold text-seal-light hover:underline">or add individually →</Link>
        {msg && <span className="text-[12px] text-emerald-300">{msg}</span>}
      </div>
      <p className="text-[11px] text-white/35">From an Azure AD / LDAP export or a spreadsheet: <span className="font-mono">Full name, email, department</span>. How people sign in is connected separately, in API Access.</p>
    </div>
  );
};

const AssignStep: React.FC<{ people: Person[]; roles: GovRole[]; grants: GovGrant[]; busy: boolean; onAssign: (subject: string, role: string) => void }> = ({ people, roles, grants, busy, onAssign }) => {
  const [subject, setSubject] = useState(""); const [role, setRole] = useState("");
  const label = (r: string) => roles.find((x) => x.key === r)?.label || r;
  const nameOf = (subj: string) => people.find((p) => p.subject === subj)?.fullName || subj.replace(/^user:/, "");
  const assign = () => { if (!subject || !role) return; onAssign(subject, role); setSubject(""); setRole(""); };
  const held = grants.filter((g) => g.subject.startsWith("user:"));
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">Appointments so far</div>
        {held.length === 0 ? <p className="text-[12.5px] text-white/35">No one assigned yet — place a person in an office below.</p> : (
          <ul className="space-y-1">{held.map((g, i) => <li key={i} className="text-[13px] text-white/70"><span className="font-semibold text-white/90">{nameOf(g.subject)}</span> <span className="text-white/40">occupies</span> {label(g.role_key)}</li>)}</ul>
        )}
      </div>
      {people.length === 0 || roles.length === 0 ? (
        <p className="text-[12.5px] text-amber-300/80">Add people and offices first, then place each person in the office they occupy.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex-1"><span className="mb-1 block text-[12px] text-white/50">Person</span>
            <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">— select —</option>
              {people.map((p) => <option key={p.id} value={p.subject}>{p.fullName}</option>)}
            </select></label>
          <label className="flex-1"><span className="mb-1 block text-[12px] text-white/50">Office</span>
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">— select —</option>
              {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select></label>
          <Button disabled={!subject || !role || busy} onClick={assign}>{busy ? "Assigning…" : "Assign"}</Button>
        </div>
      )}
    </div>
  );
};

const FinalStep: React.FC<{ ready: boolean; remaining: string[]; onJump: () => void }> = ({ ready, remaining, onJump }) => (
  ready ? (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-5">
        <div className="font-serif text-[1.3rem] font-bold text-white">Your institution is operational.</div>
        <p className="mt-1 text-[13.5px] text-white/60">Structure, offices, governance and people are in place. Begin turning information into governed, preserved Official Records.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to="/console/create" className="inline-flex items-center gap-1.5 rounded-md bg-seal px-4 py-2 text-sm font-semibold text-white transition hover:bg-seal-light">Create your first Official Record →</Link>
        <Link to="/admin/authority" className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 transition hover:border-seal-light/40 hover:text-white">Review the Authority Directory</Link>
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-[13px] text-white/70">
        Almost there — a few steps remain before the institution is fully configured:
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-white/60">{remaining.map((t) => <li key={t}>{t}</li>)}</ul>
      </div>
      <Button variant="primary" onClick={onJump}>Go to the next step →</Button>
    </div>
  )
);

export default InstitutionSetup;

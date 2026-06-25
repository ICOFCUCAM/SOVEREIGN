import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGovernance, getUsers, getGovernancePolicies, createUser,
  type Department, type GovRole, type GovGrant, type Person, type GovernancePolicy, humanError } from "../lib/api";
import { Button, Card, inputCls } from "../lib/ui";

// STAGE 0 — Establish Your Institution. The onboarding an institution follows when
// it adopts Dispatch, in the order institutions actually exist: the institution
// and its STRUCTURE first, people LAST. "Institutions endure; employees change."
// Governance is defined against OFFICES, so it never depends on who currently
// occupies them or how they authenticate. Every step's state is read from live
// configuration — this is a real readiness instrument, not a tutorial.

const Dot: React.FC<{ done: boolean; n: number }> = ({ done, n }) => (
  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${done ? "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40" : "bg-seal/25 text-seal-light ring-seal-light/40"}`}>
    {done ? "✓" : n}
  </div>
);

const InstitutionSetup: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<GovRole[]>([]);
  const [grants, setGrants] = useState<GovGrant[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [g, u, p] = await Promise.all([getGovernance(), getUsers().catch(() => ({ users: [] })), getGovernancePolicies().catch(() => ({ policies: [] }))]);
      setDepartments(g.departments ?? []); setRoles(g.roles); setGrants(g.grants); setPeople(u.users); setPolicies(p.policies);
    } catch (e) { setErr(humanError(e, "Could not load the institution configuration.")); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const peopleInOffices = grants.filter((x) => x.subject.startsWith("user:")).length;
  const officePolicies = policies.filter((p) => Array.isArray(p.reviewChain) && p.reviewChain.some((s) => s.role)).length;

  // Import people from pasted CSV: "Full Name, email, department(optional)".
  const importPeople = async () => {
    const rows = csv.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.split(",").map((c) => c.trim()));
    if (rows.length === 0) return;
    setImporting(true); setImportMsg(null); setErr(null);
    let ok = 0, fail = 0;
    for (const [fullName, email, dept] of rows) {
      if (!fullName || !email) { fail++; continue; }
      const departmentKey = dept ? (departments.find((d) => d.key === dept || d.name.toLowerCase() === dept.toLowerCase())?.key) : undefined;
      try { await createUser({ fullName, email, departmentKey }); ok++; } catch { fail++; }
    }
    setImporting(false); setImportMsg(`Imported ${ok} ${ok === 1 ? "person" : "people"}${fail ? ` · ${fail} skipped` : ""}.`); setCsv(""); load();
  };

  type Step = { n: number; title: string; done: boolean; detail: string; chip?: string; count?: number; optional?: boolean; final?: boolean; import?: boolean; to?: string; cta?: string };
  const steps: Step[] = [
    { n: 1, title: "Establish the institution", done: true,
      detail: "Your institution is an isolated tenant — its records, people and governance are sealed from every other institution.", chip: "Established" },
    { n: 2, title: "Choose deployment & data residency", done: false, optional: true,
      detail: "Decide where the institution's records live and how it is deployed.", to: "/admin/deployment", cta: "Review deployment" },
    { n: 3, title: "Create departments", done: departments.length > 0, count: departments.length,
      detail: "The institution's organisational divisions — Policy, Legal, Communications, Archives.", to: "/admin/authority", cta: "Manage departments" },
    { n: 4, title: "Create institutional offices", done: roles.length > 0, count: roles.length,
      detail: "The offices that hold authority — Policy Officer, Director, Permanent Secretary, Archivist. Authority belongs to the office, not the person.", to: "/admin/authority", cta: "Manage offices" },
    { n: 5, title: "Define governance policies", done: officePolicies > 0, count: officePolicies,
      detail: "How each record type is governed — a review chain of OFFICES, a publication authority, a retention horizon. Policies reference offices, never people.", to: "/admin/governance", cta: "Define policies" },
    { n: 6, title: "Import people", done: people.length > 0, count: people.length,
      detail: "Add the institution's staff. People come late — institutions exist before employees, and employees change while the institution endures.", import: true },
    { n: 7, title: "Assign people to offices", done: peopleInOffices > 0, count: peopleInOffices,
      detail: "Place each person in the office they occupy. When someone leaves, reassign the office — governance does not change.", to: "/admin/authority", cta: "Assign offices" },
    { n: 8, title: "Start creating Official Records", done: false, final: true,
      detail: "The institution is configured. Begin turning information into governed, preserved Official Records.", to: "/console/create", cta: "Create a record" },
  ];
  const gateable = steps.filter((s) => !s.optional && !s.final);
  const complete = gateable.filter((s) => s.done).length;

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-seal-light">Onboarding</div>
        <h1 className="mt-1.5 font-serif text-[2rem] font-bold leading-tight tracking-tight text-white">Establish Your Institution</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/50">Configure the institution the way it actually exists — structure first, people last. Governance is defined against offices, so it never depends on who occupies them or how they sign in.</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 w-56 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald-400 transition-all" style={{ width: `${Math.round((complete / gateable.length) * 100)}%` }} /></div>
          <span className="font-mono text-[12px] tabular-nums text-white/50">{complete}/{gateable.length} configured</span>
        </div>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <ol className="space-y-3">
        {steps.map((s) => (
          <li key={s.n}>
            <Card className={`p-5 ${s.final ? "border-seal-light/30" : ""}`}>
              <div className="flex items-start gap-4">
                <Dot done={s.done} n={s.n} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold text-white">{s.title}</span>
                    {s.optional && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">Optional</span>}
                    {s.count != null && s.count > 0 && <span className="font-mono text-[11px] text-white/40">{s.count}</span>}
                    {s.done && !s.final && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">{s.chip ?? "Done"}</span>}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/55">{s.detail}</p>

                  {s.import && (
                    <div className="mt-3">
                      <textarea className={`${inputCls} h-24 font-mono text-[12px]`} value={csv} onChange={(e) => setCsv(e.target.value)}
                        placeholder={"Paste people — one per line:\nJohn Doe, j.doe@ministry.gov, Policy\nSarah Berg, s.berg@ministry.gov, Policy"} />
                      <div className="mt-2 flex items-center gap-3">
                        <Button disabled={!csv.trim() || importing} onClick={importPeople}>{importing ? "Importing…" : "Import people"}</Button>
                        <Link to="/admin/authority" className="text-[12px] font-semibold text-seal-light hover:underline">or add individually →</Link>
                        {importMsg && <span className="text-[12px] text-emerald-300">{importMsg}</span>}
                      </div>
                      <p className="mt-1.5 text-[11px] text-white/35">From Azure AD / LDAP export or a spreadsheet: <span className="font-mono">Full name, email, department</span>. Authentication is connected separately, in Access.</p>
                    </div>
                  )}

                  {s.to && (
                    <div className="mt-3">
                      <Link to={s.to} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold ${s.final ? "bg-seal text-white hover:bg-seal-light" : "border border-white/15 text-white/75 hover:border-seal-light/40 hover:text-white"}`}>{s.cta} →</Link>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default InstitutionSetup;

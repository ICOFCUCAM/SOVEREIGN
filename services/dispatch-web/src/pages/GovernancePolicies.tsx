import React, { useEffect, useState } from "react";
import { getGovernancePolicies, upsertGovernancePolicy, getGovernance, type GovernancePolicy, type GovRole, humanError } from "../lib/api";
import { Button, Card, Field, inputCls } from "../lib/ui";
import { RECORD_TYPES, recordTypeLabel } from "../lib/recordTypes";

// Governance Policy Studio — institutions DESIGN how records are governed, with a
// visual chain builder. No JSON, no schema: pick a record type, build the ordered
// review chain from named authorities with quorums, choose who may publish, set
// the machine lane and retention. The policy becomes the executable control.
const LEVELS = ["", "UNCLASSIFIED", "OFFICIAL", "OFFICIAL-SENSITIVE", "CONFIDENTIAL"];

const blank: GovernancePolicy = {
  name: "", docType: RECORD_TYPES[0].docType, classificationLevel: "",
  requiredApprovals: 1, reviewChain: [{ role: "", label: "", quorum: 1 }],
  approvalAuthority: "", publicationAuthority: "", retentionDays: undefined,
  autoApproveService: false, sequential: true, approvalTtlDays: undefined, active: true,
};

const GovernancePolicies: React.FC = () => {
  const [policies, setPolicies] = useState<GovernancePolicy[] | null>(null);
  const [roles, setRoles] = useState<GovRole[]>([]);
  const [form, setForm] = useState<GovernancePolicy>(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = () => Promise.all([getGovernancePolicies(), getGovernance()])
    .then(([p, g]) => { setPolicies(p.policies); setRoles(g.roles); })
    .catch((e) => setErr(humanError(e, "Could not load the policy studio.")));
  useEffect(() => { load(); }, []);

  const roleLabel = (key?: string) => roles.find((r) => r.key === key)?.label || key || "—";
  const setStep = (i: number, patch: Partial<{ role: string; quorum: number }>) =>
    setForm((f) => ({ ...f, reviewChain: f.reviewChain.map((s, j) => (j === i ? { ...s, ...patch, label: patch.role ? roleLabel(patch.role) : s.label } : s)) }));
  const addStep = () => setForm((f) => ({ ...f, reviewChain: [...f.reviewChain, { role: "", label: "", quorum: 1 }] }));
  const removeStep = (i: number) => setForm((f) => ({ ...f, reviewChain: f.reviewChain.filter((_, j) => j !== i) }));

  const edit = (p: GovernancePolicy) => { setForm({ ...p, classificationLevel: p.classificationLevel ?? "", reviewChain: p.reviewChain.length ? p.reviewChain : [{ role: "", label: "", quorum: 1 }] }); setSaved(false); setErr(null); };
  const reset = () => { setForm(blank); setSaved(false); setErr(null); };

  const save = async () => {
    setBusy(true); setErr(null); setSaved(false);
    try {
      const chain = form.reviewChain.filter((s) => s.role).map((s) => ({ role: s.role, label: roleLabel(s.role), quorum: Math.max(1, Number(s.quorum) || 1) }));
      await upsertGovernancePolicy({
        ...form, classificationLevel: form.classificationLevel || null, reviewChain: chain,
        requiredApprovals: chain.length || form.requiredApprovals,
        retentionDays: form.retentionDays ? Number(form.retentionDays) : null,
        approvalTtlDays: form.approvalTtlDays ? Number(form.approvalTtlDays) : null,
      });
      setSaved(true); reset(); load();
    } catch (e) { setErr(humanError(e, "Could not save the policy.")); }
    finally { setBusy(false); }
  };

  const noRoles = roles.length === 0;

  return (
    <div>
      <header className="mb-6 border-b border-white/10 pb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">Governance</div>
        <h1 className="mt-1.5 font-serif text-[2rem] font-bold leading-tight tracking-tight text-white">Governance Policy</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/50">Design how official records are governed — an ordered chain of <span className="text-white/70">offices</span>, quorums, the publication authority, and retention. Policies reference offices, never people, so they never change when a post-holder does.</p>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
      {saved && <div className="mb-4 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Policy saved. Records of this type are now controlled by it.</div>}
      {noRoles && <div className="mb-4 rounded border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-sm text-amber-200">Create offices in the <span className="font-semibold">Authority Directory</span> first — a chain step references a named office (e.g. Director of Policy).</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* existing policies */}
        <div className="space-y-3">
          {policies === null ? <p className="text-sm text-white/40">Loading…</p>
            : policies.length === 0 ? (
              <Card className="p-8 text-center"><p className="text-sm text-white/50">No governance policies yet.</p><p className="mt-1 text-[12px] text-white/35">Records follow the platform default until a policy is defined.</p></Card>
            ) : policies.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2"><span className="text-sm font-bold text-white">{p.name || "(unnamed)"}</span>
                      <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/45">v{p.policyVersion ?? 1}</span></div>
                    <div className="mt-0.5 text-[12px] text-white/45">{recordTypeLabel(p.docType)}{p.classificationLevel ? ` · ${p.classificationLevel}` : ""} · {p.sequential === false ? "parallel" : "ordered"}</div>
                  </div>
                  <button onClick={() => edit(p)} className="shrink-0 text-[12px] font-semibold text-seal-light hover:text-white">Edit</button>
                </div>
                {/* visual chain */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
                  {(p.reviewChain ?? []).filter((s) => s.role || s.label).length === 0 ? <span className="text-white/35">No enforced chain (display-only)</span> :
                    p.reviewChain.map((s, i) => (
                      <React.Fragment key={i}>
                        <span className="rounded bg-seal/20 px-2 py-0.5 text-white/85 ring-1 ring-seal-light/25">{roleLabel(s.role) }{s.quorum && s.quorum > 1 ? ` ×${s.quorum}` : ""}</span>
                        {i < p.reviewChain.length - 1 && <span className="text-white/25" aria-hidden>→</span>}
                      </React.Fragment>
                    ))}
                  {p.publicationAuthority && <><span className="text-white/25" aria-hidden>⇒</span><span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300">{roleLabel(p.publicationAuthority)}</span></>}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 text-[11px] text-white/40">
                  {p.autoApproveService && <span>machine lane: on</span>}
                  {p.approvalTtlDays ? <span>approval expires: {p.approvalTtlDays}d</span> : null}
                  {p.retentionDays ? <span>retention: {p.retentionDays}d</span> : null}
                </div>
              </Card>
            ))}
        </div>

        {/* the studio editor */}
        <Card className="space-y-4 self-start p-5">
          <div className="text-sm font-bold text-white">{form.id ? "Edit policy" : "New policy"}</div>
          <Field label="Policy name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ministerial Briefing Policy" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Record type">
              <select className={inputCls} value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
                {RECORD_TYPES.map((t) => <option key={t.docType} value={t.docType}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Classification">
              <select className={inputCls} value={form.classificationLevel ?? ""} onChange={(e) => setForm({ ...form, classificationLevel: e.target.value })}>
                {LEVELS.map((l) => <option key={l} value={l}>{l === "" ? "Any" : l}</option>)}
              </select>
            </Field>
          </div>

          {/* visual chain builder */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/50">Review chain — the offices that approve</span>
              <label className="flex items-center gap-1.5 text-[11px] text-white/55"><input type="checkbox" checked={form.sequential !== false} onChange={(e) => setForm({ ...form, sequential: e.target.checked })} />ordered</label>
            </div>
            <div className="space-y-2">
              {form.reviewChain.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4 shrink-0 text-center text-[11px] text-white/35">{i + 1}</span>
                  <select className={`${inputCls} flex-1`} value={s.role ?? ""} onChange={(e) => setStep(i, { role: e.target.value })}>
                    <option value="">Select office…</option>
                    {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                  <div className="flex items-center gap-1 text-[11px] text-white/40">×<input type="number" min={1} max={9} className={`${inputCls} w-12 px-2`} value={s.quorum ?? 1} onChange={(e) => setStep(i, { quorum: Number(e.target.value) })} /></div>
                  {form.reviewChain.length > 1 && <button onClick={() => removeStep(i)} className="shrink-0 text-white/30 hover:text-red-300" aria-label="Remove">✕</button>}
                </div>
              ))}
            </div>
            <button onClick={addStep} className="mt-2 text-[12px] font-semibold text-seal-light hover:text-white">+ Add approval step</button>
          </div>

          <Field label="Publication authority">
            <select className={inputCls} value={form.publicationAuthority ?? ""} onChange={(e) => setForm({ ...form, publicationAuthority: e.target.value })}>
              <option value="">Anyone with publish permission</option>
              {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={!!form.autoApproveService} onChange={(e) => setForm({ ...form, autoApproveService: e.target.checked })} />Machine lane — service integrations auto-satisfy</label>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Approval expires (days)"><input type="number" min={0} className={inputCls} value={form.approvalTtlDays ?? ""} onChange={(e) => setForm({ ...form, approvalTtlDays: e.target.value ? Number(e.target.value) : undefined })} placeholder="30" /></Field>
            <Field label="Retention (days)"><input type="number" min={0} className={inputCls} value={form.retentionDays ?? ""} onChange={(e) => setForm({ ...form, retentionDays: e.target.value ? Number(e.target.value) : undefined })} placeholder="3650" /></Field>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button className="flex-1" disabled={busy || !form.name.trim()} onClick={save}>{busy ? "Saving…" : form.id ? "Update policy" : "Create policy"}</Button>
            {form.id && <Button variant="ghost" onClick={reset}>New</Button>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GovernancePolicies;

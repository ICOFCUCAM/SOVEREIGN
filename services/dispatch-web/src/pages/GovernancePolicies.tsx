import React, { useEffect, useState } from "react";
import { getGovernancePolicies, upsertGovernancePolicy, type GovernancePolicy, humanError } from "../lib/api";
import { Button, Card, Field, inputCls } from "../lib/ui";
import { RECORD_TYPES, recordTypeLabel } from "../lib/recordTypes";

// Governance Policies — the real product. Institutions do not buy record
// creation; they buy CONTROL over how records are created. An admin defines a
// named policy bound to a record type: who reviews (an ordered chain), who
// approves, who publishes, how long it is retained. Records inherit governance
// from the policy — humans do not assemble a workflow each time.

const LEVELS = ["", "UNCLASSIFIED", "OFFICIAL", "OFFICIAL-SENSITIVE", "CONFIDENTIAL"];

const blank: GovernancePolicy = {
  name: "", docType: RECORD_TYPES[0].docType, classificationLevel: "",
  requiredApprovals: 1, reviewChain: [{ label: "" }],
  approvalAuthority: "", publicationAuthority: "", retentionDays: undefined, active: true,
};

const GovernancePolicies: React.FC = () => {
  const [policies, setPolicies] = useState<GovernancePolicy[] | null>(null);
  const [form, setForm] = useState<GovernancePolicy>(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = () => getGovernancePolicies().then((r) => setPolicies(r.policies)).catch((e) => setErr(humanError(e, "Could not load policies.")));
  useEffect(() => { load(); }, []);

  const setChain = (i: number, label: string) => setForm((f) => ({ ...f, reviewChain: f.reviewChain.map((s, j) => (j === i ? { label } : s)) }));
  const addStep = () => setForm((f) => ({ ...f, reviewChain: [...f.reviewChain, { label: "" }] }));
  const removeStep = (i: number) => setForm((f) => ({ ...f, reviewChain: f.reviewChain.filter((_, j) => j !== i) }));

  const edit = (p: GovernancePolicy) => { setForm({ ...p, classificationLevel: p.classificationLevel ?? "", reviewChain: p.reviewChain.length ? p.reviewChain : [{ label: "" }] }); setSaved(false); setErr(null); };
  const reset = () => { setForm(blank); setSaved(false); setErr(null); };

  const save = async () => {
    setBusy(true); setErr(null); setSaved(false);
    try {
      await upsertGovernancePolicy({
        ...form,
        classificationLevel: form.classificationLevel || null,
        reviewChain: form.reviewChain.filter((s) => s.label.trim()).map((s) => ({ label: s.label.trim() })),
        retentionDays: form.retentionDays ? Number(form.retentionDays) : null,
      });
      setSaved(true); reset(); load();
    } catch (e) { setErr(humanError(e, "Could not save the policy.")); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Administration</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Governance Policies</h1>
        <p className="text-sm text-white/50">Define how official records are reviewed, approved, published and retained. Records inherit governance from the policy that matches their type.</p>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
      {saved && <div className="mb-4 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Policy saved. Records of this type now inherit it.</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* existing policies */}
        <div className="space-y-3">
          {policies === null ? <p className="text-sm text-white/40">Loading…</p>
            : policies.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-white/50">No governance policies yet.</p>
                <p className="mt-1 text-[12px] text-white/35">Define one on the right. Until then, records follow the platform default (single approval; machine lane auto-approves).</p>
              </Card>
            ) : policies.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">{p.name || "(unnamed policy)"}</div>
                    <div className="mt-0.5 text-[12px] text-white/45">{recordTypeLabel(p.docType)}{p.classificationLevel ? ` · ${p.classificationLevel}` : ""}</div>
                  </div>
                  <button onClick={() => edit(p)} className="shrink-0 text-[12px] font-semibold text-seal-light hover:text-white">Edit</button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
                  <span className="text-white/40">Review:</span>
                  {(p.reviewChain ?? []).length === 0 ? <span className="text-white/35">—</span> : p.reviewChain.map((s, i) => (
                    <React.Fragment key={i}>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-white/75">{s.label}</span>
                      {i < p.reviewChain.length - 1 && <span className="text-white/25" aria-hidden>→</span>}
                    </React.Fragment>
                  ))}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                  <div><dt className="inline text-white/40">Approval authority: </dt><dd className="inline text-white/70">{p.approvalAuthority || "—"}</dd></div>
                  <div><dt className="inline text-white/40">Publication: </dt><dd className="inline text-white/70">{p.publicationAuthority || "—"}</dd></div>
                  <div><dt className="inline text-white/40">Approvals required: </dt><dd className="inline text-white/70">{p.requiredApprovals}</dd></div>
                  <div><dt className="inline text-white/40">Retention: </dt><dd className="inline text-white/70">{p.retentionDays ? `${p.retentionDays} days` : "—"}</dd></div>
                </dl>
              </Card>
            ))}
        </div>

        {/* policy editor */}
        <Card className="space-y-4 self-start p-5">
          <div className="text-sm font-bold text-white">{form.id ? "Edit policy" : "New policy"}</div>
          <Field label="Policy name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ministerial Briefing Policy" /></Field>
          <Field label="Applies to record type">
            <select className={inputCls} value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
              {RECORD_TYPES.map((t) => <option key={t.docType} value={t.docType}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Classification (optional)" hint="Leave blank to apply to all classifications of this type.">
            <select className={inputCls} value={form.classificationLevel ?? ""} onChange={(e) => setForm({ ...form, classificationLevel: e.target.value })}>
              {LEVELS.map((l) => <option key={l} value={l}>{l === "" ? "Any classification" : l}</option>)}
            </select>
          </Field>

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/50">Review chain</span>
            <div className="space-y-2">
              {form.reviewChain.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-[11px] text-white/35">{i + 1}</span>
                  <input className={inputCls} value={s.label} onChange={(e) => setChain(i, e.target.value)} placeholder={i === 0 ? "Director" : "Secretary General"} />
                  {form.reviewChain.length > 1 && <button onClick={() => removeStep(i)} className="shrink-0 text-white/30 hover:text-red-300" aria-label="Remove step">✕</button>}
                </div>
              ))}
            </div>
            <button onClick={addStep} className="mt-2 text-[12px] font-semibold text-seal-light hover:text-white">+ Add reviewer</button>
          </div>

          <Field label="Approval authority"><input className={inputCls} value={form.approvalAuthority ?? ""} onChange={(e) => setForm({ ...form, approvalAuthority: e.target.value })} placeholder="Chief Secretary" /></Field>
          <Field label="Publication authority"><input className={inputCls} value={form.publicationAuthority ?? ""} onChange={(e) => setForm({ ...form, publicationAuthority: e.target.value })} placeholder="Ministry Communications Office" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Approvals required"><input type="number" min={0} max={5} className={inputCls} value={form.requiredApprovals} onChange={(e) => setForm({ ...form, requiredApprovals: Number(e.target.value) })} /></Field>
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

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitDocument, validateDocument, type ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Button, Card, Field, inputCls } from "../lib/ui";

// CREATE — the institutional authoring department. Unlike Submit (raw DDM JSON),
// this composes a valid DDM document from structured forms per document type, so
// an author can produce an Executive Briefing / Board Report / Policy Paper
// without writing JSON. The output flows through the same Submit → Approve →
// Render → Publish pipeline. (Consumer document generation — CV/letter/book —
// lives in the separate Polished Pages studio, by design.)

type Kind = "paragraph" | "bullets" | "callout";
interface FieldSpec { role: string; heading: string; kind: Kind; placeholder: string; lead?: boolean }
interface DocTypeSpec { docType: string; label: string; blurb: string; fields: FieldSpec[] }

const DOC_TYPES: DocTypeSpec[] = [
  {
    docType: "executive_briefing", label: "Executive Briefing",
    blurb: "Bottom line up front, key judgements, analysis, recommendation.",
    fields: [
      { role: "executive_summary", heading: "Executive Summary", kind: "paragraph", lead: true, placeholder: "Bottom line up front — the single most important thing the principal must know." },
      { role: "key_judgements", heading: "Key Judgements", kind: "bullets", placeholder: "One judgement per line." },
      { role: "analysis", heading: "Analysis", kind: "paragraph", placeholder: "The supporting analysis behind the judgements." },
      { role: "recommendation", heading: "Recommendation", kind: "callout", placeholder: "The recommended course of action." },
    ],
  },
  {
    docType: "board_report", label: "Board Report",
    blurb: "Summary, performance, decisions requested, risks, recommendation.",
    fields: [
      { role: "executive_summary", heading: "Executive Summary", kind: "paragraph", lead: true, placeholder: "The headline for the board." },
      { role: "performance", heading: "Performance", kind: "paragraph", placeholder: "Performance against plan since the last meeting." },
      { role: "decisions", heading: "Decisions Requested", kind: "bullets", placeholder: "One decision the board must take, per line." },
      { role: "risks", heading: "Risks", kind: "bullets", placeholder: "One material risk per line." },
      { role: "recommendation", heading: "Recommendation", kind: "callout", placeholder: "What you are asking the board to approve." },
    ],
  },
  {
    docType: "policy_paper", label: "Policy Paper",
    blurb: "Summary, problem, evidence, options analysis, recommendation.",
    fields: [
      { role: "summary", heading: "Summary", kind: "paragraph", lead: true, placeholder: "A one-paragraph summary of the policy position." },
      { role: "problem", heading: "Problem", kind: "paragraph", placeholder: "The problem this policy addresses." },
      { role: "evidence", heading: "Evidence", kind: "bullets", placeholder: "One evidence point per line." },
      { role: "options_analysis", heading: "Options Analysis", kind: "paragraph", placeholder: "Analysis of the options considered." },
      { role: "recommendation", heading: "Recommendation", kind: "callout", placeholder: "The recommended policy option." },
    ],
  },
];

const LEVELS = ["UNCLASSIFIED", "OFFICIAL", "OFFICIAL-SENSITIVE", "CONFIDENTIAL"];
const today = (): string => new Date().toISOString().slice(0, 10);

const Create: React.FC = () => {
  const { session } = useAuth();
  const nav = useNavigate();
  const [docTypeId, setDocTypeId] = useState(DOC_TYPES[0].docType);
  const spec = useMemo(() => DOC_TYPES.find((d) => d.docType === docTypeId)!, [docTypeId]);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("UNCLASSIFIED");
  const [values, setValues] = useState<Record<string, string>>({});
  const [outputs, setOutputs] = useState<string[]>(["pdf"]);
  const [validation, setValidation] = useState<{ valid: boolean; errors: ApiError[]; warnings: unknown[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  const set = (role: string, v: string): void => { setValues((p) => ({ ...p, [role]: v })); setValidation(null); };

  const document = useMemo(() => {
    const sections = spec.fields.map((f, i) => {
      const v = (values[f.role] ?? "").trim();
      let block: Record<string, unknown>;
      if (f.kind === "bullets") block = { id: `b${i + 1}`, type: "bullets", ordered: false, items: v.split(/\n+/).map((s) => s.trim()).filter(Boolean).map((text) => ({ text })) };
      else if (f.kind === "callout") block = { id: `b${i + 1}`, type: "callout", style: "recommendation", text: v };
      else block = { id: `b${i + 1}`, type: "paragraph", text: v, ...(f.lead ? { style: "lead" } : {}) };
      return { id: `s${i + 1}`, role: f.role, heading: f.heading, level: 1, blocks: [block] };
    });
    return { ddmVersion: "1.0", docType: spec.docType, metadata: { title: title.trim() || spec.label, date: today(), status: "final" }, classification: { scheme: "none", level }, sections };
  }, [spec, values, title, level]);

  const buildRequest = () => ({
    schemaVersion: "1.0",
    idempotencyKey: crypto.randomUUID(),
    source: { system: "saas-ui", tenantId: session!.tenantId },
    document,
    outputs,
    delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 },
  });

  const missing = spec.fields.filter((f) => !(values[f.role] ?? "").trim()).map((f) => f.heading);

  const onValidate = async (): Promise<void> => {
    setErr(null); setValidation(null); setBusy(true);
    try { setValidation(await validateDocument(buildRequest())); }
    catch (e) { setErr(e instanceof Error ? e.message : "validation failed"); }
    finally { setBusy(false); }
  };
  const onSubmit = async (): Promise<void> => {
    setErr(null); setBusy(true);
    try { const req = buildRequest(); const r = await submitDocument(req, req.idempotencyKey); nav(`/console/documents/${r.documentId}`); }
    catch (e) { setErr(e instanceof Error ? e.message : "submit failed"); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create a document</h1>
        <p className="text-sm text-white/50">Author an institutional document from a structured form — it composes a valid DDM and submits into the approval pipeline.</p>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {/* doc-type picker */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {DOC_TYPES.map((d) => (
          <button key={d.docType} onClick={() => { setDocTypeId(d.docType); setValues({}); setValidation(null); }}
            className={`rounded-lg border p-4 text-left transition ${d.docType === docTypeId ? "border-seal-light/60 bg-white/[0.04]" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}>
            <div className="text-sm font-bold text-white">{d.label}</div>
            <div className="mt-1 text-[12px] leading-snug text-white/45">{d.blurb}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* the form */}
        <Card className="space-y-4 p-5">
          <Field label="Title"><input className={inputCls} value={title} onChange={(e) => { setTitle(e.target.value); setValidation(null); }} placeholder={`${spec.label} title`} /></Field>
          {spec.fields.map((f) => (
            <Field key={f.role} label={f.heading} hint={f.kind === "bullets" ? "One item per line." : f.kind === "callout" ? "Shown as a highlighted recommendation." : undefined}>
              <textarea className={`${inputCls} ${f.kind === "bullets" ? "h-24" : "h-20"} leading-relaxed`}
                value={values[f.role] ?? ""} onChange={(e) => set(f.role, e.target.value)} placeholder={f.placeholder} />
            </Field>
          ))}
        </Card>

        {/* controls */}
        <div className="space-y-5">
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Classification</h3>
            <select className={inputCls} value={level} onChange={(e) => { setLevel(e.target.value); setValidation(null); }}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Card>
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Outputs</h3>
            <div className="space-y-2">
              {["pdf", "docx", "md"].map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm text-white/80">
                  <input type="checkbox" checked={outputs.includes(o)} onChange={(e) => setOutputs((prev) => e.target.checked ? [...prev, o] : prev.filter((x) => x !== o))} />
                  {o.toUpperCase()}
                </label>
              ))}
            </div>
          </Card>

          {validation && (
            <Card className={`p-4 ${validation.valid ? "border-emerald-500/30" : "border-red-500/30"}`}>
              <div className={`text-sm font-semibold ${validation.valid ? "text-emerald-300" : "text-red-300"}`}>{validation.valid ? "✓ Valid — ready to submit" : "Validation errors"}</div>
              {validation.errors?.length > 0 && (
                <ul className="mt-2 space-y-1 text-[12px] text-red-300/90">{validation.errors.map((e, i) => <li key={i}>· {e.message}{e.field ? ` (${e.field})` : ""}</li>)}</ul>
              )}
            </Card>
          )}

          <div className="space-y-2">
            {missing.length > 0 && <p className="text-[12px] text-amber-300/90">Fill in: {missing.join(", ")}</p>}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onValidate} disabled={busy}>{busy ? "…" : "Validate"}</Button>
              <Button onClick={onSubmit} disabled={busy || missing.length > 0}>{busy ? "Submitting…" : "Create & submit →"}</Button>
            </div>
            <button onClick={() => setShowJson((s) => !s)} className="text-[11px] uppercase tracking-wide text-white/40 hover:text-white/70">{showJson ? "Hide" : "Show"} composed DDM</button>
          </div>
        </div>
      </div>

      {showJson && (
        <Card className="mt-4 p-4">
          <pre className="max-h-80 overflow-auto font-mono text-[11px] leading-relaxed text-white/60">{JSON.stringify(document, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
};

export default Create;

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitDocument, validateDocument, type ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Button, Card, Field, inputCls } from "../lib/ui";

// Intake — NOT a word processor. The document body (DDM) is a structured
// payload: pasted/imported JSON. The console's job is to classify, choose
// outputs, dry-run validate, and submit into governance. A sample executive
// briefing pre-fills the payload so the flow is testable immediately.
const SAMPLE = {
  ddmVersion: "1.0",
  docType: "executive_briefing",
  metadata: { title: "Quarterly Situation Brief", date: "2026-05-30", status: "final" },
  classification: { scheme: "none", level: "UNCLASSIFIED" },
  sections: [
    { id: "s1", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "Bottom line up front." }] },
    { id: "s2", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", items: [{ text: "Judgement one." }] }] },
    { id: "s3", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Supporting analysis." }] },
    { id: "s4", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Recommended course of action." }] },
  ],
};

const OUTPUTS = ["pdf", "docx", "md"] as const;

const Submit: React.FC = () => {
  const { session } = useAuth();
  const nav = useNavigate();
  const [raw, setRaw] = useState(JSON.stringify(SAMPLE, null, 2));
  const [outputs, setOutputs] = useState<string[]>(["pdf"]);
  const [validation, setValidation] = useState<{ valid: boolean; errors: ApiError[]; warnings: unknown[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parsed = useMemo(() => { try { return { doc: JSON.parse(raw), error: null as string | null }; } catch (e) { return { doc: null, error: (e as Error).message }; } }, [raw]);

  const buildRequest = () => ({
    schemaVersion: "1.0",
    idempotencyKey: crypto.randomUUID(),
    source: { system: "saas-ui", tenantId: session!.tenantId },
    document: parsed.doc,
    outputs,
    delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 },
  });

  const onValidate = async () => {
    setErr(null); setValidation(null);
    if (parsed.error) { setErr("Invalid JSON: " + parsed.error); return; }
    setBusy(true);
    try { setValidation(await validateDocument(buildRequest())); }
    catch (e) { setErr(e instanceof Error ? e.message : "validation failed"); }
    finally { setBusy(false); }
  };

  const onSubmit = async () => {
    setErr(null);
    if (parsed.error) { setErr("Invalid JSON: " + parsed.error); return; }
    setBusy(true);
    try {
      const req = buildRequest();
      const r = await submitDocument(req, req.idempotencyKey);
      nav(`/documents/${r.documentId}`);
    } catch (e) { setErr(e instanceof Error ? e.message : "submit failed"); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Submit a document</h1>
        <p className="text-sm text-white/50">Classify, choose outputs, validate, and submit into the approval pipeline.</p>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-4">
          <Field label="Document payload (DDM JSON)" hint="Dispatch is publication infrastructure — the body is a structured payload, not free-text editing.">
            <textarea
              className={`${inputCls} h-[420px] font-mono text-xs leading-relaxed`}
              value={raw} onChange={(e) => { setRaw(e.target.value); setValidation(null); }} spellCheck={false} />
          </Field>
          {parsed.error && <p className="mt-2 text-xs text-amber-300">⚠ JSON parse error: {parsed.error}</p>}
        </Card>

        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Outputs</h3>
            <div className="space-y-2">
              {OUTPUTS.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm text-white/80">
                  <input type="checkbox" checked={outputs.includes(o)}
                    onChange={(e) => setOutputs((prev) => e.target.checked ? [...prev, o] : prev.filter((x) => x !== o))} />
                  {o.toUpperCase()}
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Validation</h3>
            {!validation ? (
              <p className="text-xs text-white/40">Run a dry-run validation before submitting.</p>
            ) : validation.valid ? (
              <p className="text-sm font-semibold text-emerald-300">✓ Valid{validation.warnings.length ? ` · ${validation.warnings.length} warning(s)` : ""}</p>
            ) : (
              <ul className="space-y-1 text-xs text-red-300">
                {validation.errors.map((e, i) => <li key={i}>✕ <span className="font-mono">{e.code}</span> {e.message}{e.field ? ` (${e.field})` : ""}</li>)}
              </ul>
            )}
          </Card>

          <div className="space-y-2">
            <Button variant="ghost" className="w-full" onClick={onValidate} disabled={busy || !!parsed.error}>Validate</Button>
            <Button className="w-full" onClick={onSubmit} disabled={busy || !!parsed.error || outputs.length === 0}>
              {busy ? "Submitting…" : "Submit for governance"}
            </Button>
            <p className="text-center text-[11px] text-white/30">Render is gated on approval. Machine lanes may auto-approve by policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Submit;

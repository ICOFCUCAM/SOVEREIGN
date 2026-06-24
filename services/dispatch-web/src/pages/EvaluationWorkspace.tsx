import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvaluationAssessment, type EvaluationAssessment, type MaturityStatus, humanError } from "../lib/api";
import { useAuth } from "../lib/auth";

// Executive Evaluation Workspace — a third audience (procurement / board), not
// operators or administrators. A guided 20–30 minute journey: understand, assess,
// and justify adoption. Every score, maturity level and recommendation is DERIVED
// from this tenant's actual posture (getEvaluationAssessment) — no marketing
// metrics, no fabricated telemetry. The platform generates its own evidence.
const STATUS: Record<MaturityStatus, [string, string]> = {
  active: ["Active", "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"],
  configurable: ["Available", "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30"],
  architected: ["Architected for", "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"],
};
const SECTIONS = [["summary", "Executive Summary"], ["readiness", "Readiness Score"], ["maturity", "Capability Maturity"], ["positioning", "Category Positioning"], ["brief", "Board Brief"]] as const;

const POSITIONING = [
  { them: "Document Management Systems", they: "Store and retrieve files.", us: "Govern how official records are created, approved, preserved and proven — storage is a byproduct, not the product." },
  { them: "Workflow / BPM tools", they: "Route tasks between people.", us: "Enforce institutional governance and emit cryptographic compliance evidence — routing without proof is not governance." },
  { them: "Publishing platforms", they: "Format and distribute content.", us: "Produce sovereign, governed, preserved records with an immutable audit trail and a clear chain of authority." },
];

const Bar: React.FC<{ score: number }> = ({ score }) => (
  <div className="h-2 overflow-hidden rounded bg-white/10"><div className={`h-full ${score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${score}%` }} /></div>
);

const EvaluationWorkspace: React.FC = () => {
  const { session, signOut } = useAuth();
  const nav = useNavigate();
  const [a, setA] = useState<EvaluationAssessment | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { getEvaluationAssessment().then(setA).catch((e) => setErr(humanError(e, "Could not assemble the evaluation."))); }, []);

  const verdict = a ? (a.overall >= 80 ? ["Recommended for adoption", "text-emerald-300"] : a.overall >= 60 ? ["Adoption viable — confirm scoped items", "text-amber-300"] : ["Further evaluation advised", "text-red-300"]) : ["·", "text-white/40"];

  const downloadBrief = () => {
    if (!a) return;
    const s = a.summary;
    const sec = (t: string, rows: string[][]) => `<h2>${t}</h2><table>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table>`;
    const css = "body{font:14px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:840px;margin:40px auto;padding:0 24px}h1{font-size:24px;margin:0}h2{font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#1f4b8e;border-bottom:2px solid #1f4b8e;padding-bottom:4px;margin:26px 0 10px}.sub{color:#666;margin:4px 0 22px}table{width:100%;border-collapse:collapse;margin-bottom:6px}td{padding:6px 8px;border-bottom:1px solid #eee;vertical-align:top}td:first-child{color:#555;width:46%;font-weight:600}.v{font-size:30px;font-weight:700}.rec{padding:12px 16px;background:#f3f6fb;border-left:4px solid #1f4b8e;margin:8px 0}";
    const body = [
      sec("Board Summary", [
        ["Platform", "Sovereign Dispatch — governed, sovereign institutional publication"],
        ["Institution readiness", `${a.overall} / 100`],
        ["Governance policies enforced", String(s.chainedPolicies)],
        ["Governed publications", `${s.governed} (compliance ${s.complianceRate}%)`],
        ["Records preserved", String(s.preserved)],
      ]),
      `<h2>Risk Analysis</h2><div class="rec">Adopting Sovereign Dispatch reduces institutional risk in three ways: governance cannot be bypassed (publication is locked until policy is satisfied), every official record is tamper-evident (SHA-256 preservation proofs), and the institution retains full ownership and a clean exit (open formats, no lock-in). Residual items are scoped per deployment (classified clearance, certification scope, DR targets).</div>`,
      sec("Governance Posture", a.dimensions.map((d) => [d.name, `${d.score} / 100`])),
      sec("Deployment Options", [["Managed cloud", "Current engagement"], ["Private cloud / on-premise", "Available per engagement"], ["Air-gapped", "Available for isolated estates"], ["Data residency", "Region of choice; relocatable"]]),
      sec("Compliance Position", [["Compliance rate", `${s.complianceRate}%`], ["Evidence", `${s.compliant} COMPLIANT governance certificate(s)`], ["Audit", "Append-only, hash-stamped"], ["Frameworks", "ISO 27001 · SOC 2 · GDPR · NIS2 (control-aligned)"]]),
      `<h2>Recommendation</h2><div class="rec"><b>${verdict[0]}.</b> Based on this tenant's measured posture (${a.overall}/100 institutional readiness; ${s.complianceRate}% policy compliance; ${s.preserved} preserved records). Figures are derived from the live platform at generation time, not asserted.</div>`,
    ].join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Sovereign Dispatch — Board Evaluation Brief</title><style>${css}</style></head><body><h1>Sovereign Dispatch — Board Evaluation Brief</h1><div class="sub">Tenant ${session?.tenantId?.slice(0, 8)}… · ${new Date().toISOString().slice(0, 10)} · platform-generated from live posture</div>${body}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const el = document.createElement("a"); el.href = url; el.download = `sovereign-dispatch-board-brief-${new Date().toISOString().slice(0, 10)}.html`; el.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full bg-ink-900 text-white">
      {/* focused evaluation chrome — distinct from operations / administration */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-seal text-xs font-black">SD</div>
            <div className="leading-tight"><div className="text-sm font-bold">Executive Evaluation</div><div className="text-[10px] uppercase tracking-[0.2em] text-seal-light">Procurement Workspace</div></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={downloadBrief} disabled={!a} className="rounded-md bg-seal px-3.5 py-1.5 text-[13px] font-semibold transition hover:bg-seal-light disabled:opacity-40">Generate Evaluation Brief</button>
            <button onClick={() => nav("/admin")} className="text-[12px] text-white/50 hover:text-white">Exit</button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-5 overflow-x-auto px-6 pb-2 text-[12px]">
          {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} className="whitespace-nowrap text-white/50 hover:text-white">{label}</a>)}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

        {/* executive summary */}
        <section id="summary" className="scroll-mt-28">
          <h1 className="text-3xl font-bold">Is Sovereign Dispatch right for your institution?</h1>
          <p className="mt-2 max-w-3xl text-white/55">A 20-minute, evidence-based evaluation. Every figure below is derived from your tenant's live posture — not a sales deck.</p>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[["Problem", "Ungoverned, unprovable official publishing"], ["Approach", "Governance enforced, not advised"], ["Proof", a ? `${a.summary.compliant} compliant certificate(s)` : "·"], ["Readiness", a ? `${a.overall}/100` : "·"]].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-white/10 bg-ink-800/60 p-4"><div className="text-lg font-bold text-white">{v}</div><div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/45">{l}</div></div>
            ))}
          </div>
        </section>

        {/* readiness score */}
        <section id="readiness" className="mt-12 scroll-mt-28">
          <h2 className="text-xl font-bold">Institution Readiness Score</h2>
          <p className="mt-1 text-[13px] text-white/45">Derived from measured capability presence — Active counts full, Available partial, Architected-for as capability. Auditable, not invented.</p>
          <div className="mt-5 grid gap-6 lg:grid-cols-[200px_1fr]">
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-ink-800/60 p-6">
              <div className={`text-5xl font-bold tabular-nums ${(a?.overall ?? 0) >= 80 ? "text-emerald-300" : "text-amber-300"}`}>{a ? a.overall : "·"}</div>
              <div className="text-[11px] uppercase tracking-wide text-white/40">out of 100</div>
              <div className={`mt-2 text-center text-[12px] font-semibold ${verdict[1]}`}>{verdict[0]}</div>
            </div>
            <div className="space-y-3 self-center">
              {(a?.dimensions ?? [{ name: "Governance", score: 0 }, { name: "Security", score: 0 }, { name: "Deployment", score: 0 }, { name: "Sovereignty", score: 0 }, { name: "Evidence", score: 0 }]).map((d) => (
                <div key={d.name}>
                  <div className="mb-1 flex justify-between text-[12.5px]"><span className="text-white/75">{d.name}</span><span className="tabular-nums text-white/50">{a ? d.score : "·"}</span></div>
                  <Bar score={a ? d.score : 0} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* capability maturity */}
        <section id="maturity" className="mt-12 scroll-mt-28">
          <h2 className="text-xl font-bold">Capability Maturity</h2>
          <p className="mt-1 text-[13px] text-white/45">Each capability's status and the evidence behind it — assessed against your tenant, not a brochure.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {(a?.maturity ?? []).map((m) => (
              <div key={m.capability} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-ink-800/40 px-4 py-2.5">
                <div className="min-w-0"><div className="text-[13px] font-semibold text-white">{m.capability}</div><div className="text-[11px] text-white/40">{m.evidence}</div></div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS[m.status][1]}`}>{STATUS[m.status][0]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* category positioning */}
        <section id="positioning" className="mt-12 scroll-mt-28">
          <h2 className="text-xl font-bold">Category Positioning</h2>
          <p className="mt-1 text-[13px] text-white/45">Where Sovereign Dispatch sits relative to adjacent tools — to place it correctly in your procurement category.</p>
          <div className="mt-5 space-y-3">
            {POSITIONING.map((p) => (
              <div key={p.them} className="grid gap-4 rounded-lg border border-white/10 bg-ink-800/40 p-4 sm:grid-cols-2">
                <div><div className="text-[12px] font-semibold uppercase tracking-wide text-white/40">{p.them}</div><div className="mt-1 text-[13px] text-white/60">{p.they}</div></div>
                <div className="sm:border-l sm:border-white/10 sm:pl-4"><div className="text-[12px] font-semibold uppercase tracking-wide text-seal-light">Sovereign Dispatch</div><div className="mt-1 text-[13px] text-white/80">{p.us}</div></div>
              </div>
            ))}
          </div>
        </section>

        {/* board brief */}
        <section id="brief" className="mt-12 scroll-mt-28">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-seal-light/30 bg-ink-800/60 p-6">
            <div>
              <h2 className="text-xl font-bold">Board Evaluation Brief</h2>
              <p className="mt-1 max-w-xl text-[13px] text-white/55">A board-ready document — summary, risk analysis, governance posture, deployment options, compliance position, and a recommendation — assembled from this evaluation. No sales engineer required.</p>
            </div>
            <button onClick={downloadBrief} disabled={!a} className="shrink-0 rounded-md bg-seal px-5 py-2.5 text-sm font-semibold transition hover:bg-seal-light disabled:opacity-40">Generate Evaluation Brief →</button>
          </div>
        </section>

        <footer className="mt-10 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/35">
          <span>Tenant {session?.tenantId?.slice(0, 8)}… · figures derived from live posture</span>
          <button onClick={() => { signOut(); nav("/"); }} className="hover:text-white">Sign out</button>
        </footer>
      </main>
    </div>
  );
};

export default EvaluationWorkspace;

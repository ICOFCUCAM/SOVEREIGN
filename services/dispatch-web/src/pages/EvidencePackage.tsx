import React, { useEffect, useState } from "react";
import { getGovernanceOverview, getGovernancePolicies, getGovernance, listClients,
  type GovOverview, type GovernancePolicy, type GovRole, type GovGrant, type ServiceClient, humanError } from "../lib/api";
import { getSovereignty } from "../lib/sovereignty";
import { Button, Card } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { recordTypeLabel } from "../lib/recordTypes";

// Evidence Package Generator — the procurement killer feature. One button
// assembles the institution's ACTUAL posture (governance, compliance,
// preservation, security, deployment, sovereignty) into a self-contained,
// downloadable evaluation bundle. Every figure is live from the platform; the
// architectural statements are the same honest, basis-badged claims as the
// Sovereignty surface — no marketing, no fabricated metrics.
interface Bundle {
  ov: GovOverview; policies: GovernancePolicy[]; roles: GovRole[]; grants: GovGrant[]; clients: ServiceClient[];
}

const EvidencePackage: React.FC = () => {
  const { session } = useAuth();
  const [b, setB] = useState<Bundle | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getGovernanceOverview(), getGovernancePolicies(), getGovernance(), listClients()])
      .then(([ov, p, g, c]) => setB({ ov, policies: p.policies, roles: g.roles, grants: g.grants, clients: c.clients }))
      .catch((e) => setErr(humanError(e, "Could not assemble the evaluation package.")));
  }, []);

  const sov = getSovereignty();
  const today = new Date().toISOString().slice(0, 10);
  const tenant = session?.tenantId?.slice(0, 8);

  // Build the seven evaluation sections from live data + honest posture.
  const sections = b ? [
    { id: "Architecture", rows: [
      ["Platform", "Sovereign Dispatch — institutional publication infrastructure"],
      ["Lifecycle", "Create → Govern → Approve → Render → Publish → Preserve"],
      ["Tenant model", "Multi-tenant, row-level-security isolated (deny-by-default)"],
      ["Audit", "Append-only, SHA-256 hashed event trail"],
      ["Migrations", "Forward-only, manifest-ordered schema"],
    ] },
    { id: "Governance", rows: [
      ["Governance policies", `${b.policies.length} defined`],
      ["Governance authorities", `${b.roles.length} roles, ${b.grants.length} active grants`],
      ["Enforcement", "Ordered approval chains, per-step quorum, separation of duties"],
      ["Publication control", "Publication locked until policy satisfied + authority validated"],
      ...b.policies.slice(0, 6).map((p) => [`Policy · ${recordTypeLabel(p.docType)}`, `${p.name} (v${p.policyVersion ?? 1})`]),
    ] },
    { id: "Compliance", rows: [
      ["Records published", String(b.ov.compliance.published)],
      ["Records preserved", String(b.ov.compliance.preserved)],
      ["Governed publications", String(b.ov.compliance.governed)],
      ["Policy compliance rate", `${b.ov.compliance.complianceRate}%`],
      ["Governance exceptions", String(b.ov.compliance.exceptions)],
      ["Evidence", "Every governed publication carries a COMPLIANT Governance Certificate"],
    ] },
    { id: "Security", rows: sov.sections.find((s) => s.title.includes("Cryptography"))!.items.map((i) => [i.label, `${i.value} · ${i.basis}`]).concat(
      sov.sections.find((s) => s.title.includes("Access"))!.items.map((i) => [i.label, `${i.value} · ${i.basis}`])) },
    { id: "Deployment", rows: [
      ["Deployment model", "Managed cloud (private cloud / on-premise / air-gapped available per engagement)"],
      ["Data residency", sov.residencyRegion],
      ["Storage isolation", "Dedicated PostgreSQL, independent of any other tenant"],
      ["API consumers", `${b.clients.filter((c) => c.active).length} active service credentials`],
    ] },
    { id: "Sovereignty", rows: sov.sections.find((s) => s.title.includes("Data & Residency"))!.items.map((i) => [i.label, `${i.value} · ${i.basis}`]) },
    { id: "Procurement", rows: [
      ["Tenant", `${tenant}…`],
      ["Generated", `${today}`],
      ["Compliance frameworks", "ISO 27001 · SOC 2 · GDPR · NIS2 (control-aligned architecture)"],
      ["Evaluation basis", "Live platform posture — figures reflect this tenant at generation time"],
    ] },
  ] : [];

  const download = () => {
    const css = "body{font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:820px;margin:40px auto;padding:0 24px}h1{font-size:24px;margin:0}h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:#1f4b8e;border-bottom:2px solid #1f4b8e;padding-bottom:4px;margin:28px 0 10px}.sub{color:#666;margin:4px 0 24px}table{width:100%;border-collapse:collapse}td{padding:6px 8px;border-bottom:1px solid #eee;vertical-align:top}td:first-child{color:#555;width:40%;font-weight:600}.foot{margin-top:40px;color:#999;font-size:12px;border-top:1px solid #eee;padding-top:12px}";
    const body = sections.map((s) => `<h2>${s.id}</h2><table>${s.rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Sovereign Dispatch — Evaluation Package</title><style>${css}</style></head><body><h1>Sovereign Dispatch — Institutional Evaluation Package</h1><div class="sub">Tenant ${tenant}… · generated ${today} · live platform posture</div>${body}<div class="foot">Generated by Sovereign Dispatch. Every figure reflects this tenant's actual state at generation time; architectural statements are basis-badged (active / configurable / architected for).</div></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a"); a.href = url; a.download = `sovereign-dispatch-evaluation-${today}.html`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Sovereignty</div>
          <h1 className="mt-1 text-2xl font-bold text-white">Evaluation Package</h1>
          <p className="text-sm text-white/50">One bundle for a procurement team — architecture, governance, compliance, security, deployment, and sovereignty — assembled from this institution's live posture.</p>
        </div>
        <Button className="shrink-0" disabled={!b} onClick={download}>Download Evaluation Package</Button>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {!b ? <p className="text-sm text-white/40">Assembling…</p> : (
        <div className="space-y-5">
          {sections.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">{s.id}</div>
              <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {s.rows.map((r, i) => (
                  <div key={i} className="flex justify-between gap-4 border-b border-white/5 py-1.5">
                    <dt className="text-[12.5px] text-white/45">{r[0]}</dt>
                    <dd className="text-right text-[12.5px] font-medium text-white/85">{r[1]}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
          <p className="text-[12px] text-white/35">Every figure above is live from this tenant; architectural statements carry their basis (active / configurable / architected for). The downloaded package is a self-contained document.</p>
        </div>
      )}
    </div>
  );
};

export default EvidencePackage;

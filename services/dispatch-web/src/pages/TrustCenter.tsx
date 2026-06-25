import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGovernanceOverview, getGovernancePolicies, type GovOverview, humanError } from "../lib/api";
import { Card } from "../lib/ui";

// Trust Center — the adoption-confidence surface. The objective is not more
// capability; it is to let a risk-averse institution feel safe committing. It
// answers the questions procurement and risk teams actually fear: do we own our
// data, how do we leave, who is accountable, and what is provable today. Every
// claim is honest — provable facts, things the institution controls, or
// capabilities scoped per engagement. Nothing is marketing.

const Pill: React.FC<{ tone: "fact" | "yours" | "shared" }> = ({ tone }) => {
  const m = { fact: ["Provable", "bg-emerald-500/15 text-emerald-300"], yours: ["You control", "bg-sky-500/15 text-sky-300"], shared: ["Per engagement", "bg-gold-500/15 text-gold-300"] }[tone];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${m[1]}`}>{m[0]}</span>;
};

const TrustCenter: React.FC = () => {
  const [ov, setOv] = useState<GovOverview | null>(null);
  const [policyCount, setPolicyCount] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    getGovernanceOverview().then(setOv).catch((e) => setErr(humanError(e, "Could not load the trust center.")));
    getGovernancePolicies().then((r) => setPolicyCount(r.policies.length)).catch(() => {});
  }, []);
  const preserved = ov?.compliance.preserved;

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">Sovereignty</div>
        <h1 className="mt-1.5 font-serif text-[1.9rem] font-bold leading-tight tracking-tight text-white">Institutional Trust</h1>
        <p className="text-sm text-white/50">Everything an institution needs to adopt with confidence — what you own, how you leave, who is accountable, and what is provable today.</p>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {/* the four adoption assurances */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["You own your records", "The platform is a custodian, never an owner."],
          ["You can leave at any time", "Full export; no proprietary lock-in."],
          ["Tenant-isolated by default", "Row-level security denies on a missing claim."],
          ["Preserved & tamper-evident", preserved === undefined ? "SHA-256 integrity proofs." : `${preserved} record${preserved === 1 ? "" : "s"} sealed with SHA-256 proofs.`],
        ].map(([t, s]) => (
          <Card key={t} className="p-5"><div className="text-sm font-bold text-white">{t}</div><div className="mt-1 text-[12px] leading-snug text-white/45">{s}</div></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* data ownership */}
        <Card className="p-6">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Data ownership</div>
          <ul className="space-y-3">
            {[
              ["fact", "Your records are yours", "Every document, version, artifact and certificate belongs to your institution. The platform stores and governs them; it does not own them."],
              ["fact", "Tenant isolation", "Row-level security with deny-by-default — a missing tenant claim denies access. Your data is never co-mingled with another tenant."],
              ["yours", "No secondary use", "Your records are never repurposed, mined, or used to train anything. There is no data-sharing business model."],
              ["fact", "Audit of every access", "Submissions, decisions, publications and retrievals are recorded in an append-only, hash-stamped trail."],
            ].map(([tone, t, s]) => (
              <li key={t as string}><div className="flex items-start justify-between gap-2"><span className="text-[13px] font-semibold text-white">{t}</span><Pill tone={tone as "fact" | "yours" | "shared"} /></div><div className="text-[12.5px] text-white/55">{s}</div></li>
            ))}
          </ul>
        </Card>

        {/* continuity & exit — the #1 adoption fear */}
        <Card className="p-6">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Continuity &amp; exit</div>
          <ul className="space-y-3">
            {[
              ["fact", "No proprietary lock-in", "Records are standard structured documents; artifacts are standard PDF/DOCX/MD; the store is standard PostgreSQL. Nothing is trapped in a closed format."],
              ["yours", "Full export on demand", "Export your records, versions, artifacts and governance + preservation certificates at any time."],
              ["shared", "Relocatable deployment", "The same platform runs managed, in your cloud, on-premise or air-gapped — you can move your estate without re-platforming."],
              ["fact", "If the provider disappeared", "You retain your records, artifacts and certificates in open formats, and can run the platform yourself or migrate them. Continuity does not depend on us."],
            ].map(([tone, t, s]) => (
              <li key={t as string}><div className="flex items-start justify-between gap-2"><span className="text-[13px] font-semibold text-white">{t}</span><Pill tone={tone as "fact" | "yours" | "shared"} /></div><div className="text-[12.5px] text-white/55">{s}</div></li>
            ))}
          </ul>
        </Card>

        {/* shared responsibility */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Shared responsibility</div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-seal-light">The platform secures</div>
              <ul className="space-y-1.5 text-[12.5px] text-white/70">
                {["Tenant isolation (row-level security)", "Encryption at rest and in transit", "Append-only audit integrity", "Preservation integrity (SHA-256 proofs)", "Governance enforcement (the engine cannot be bypassed)", "Platform availability and recovery"].map((x) => <li key={x} className="flex gap-2"><span className="text-emerald-400">✓</span>{x}</li>)}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-sky-300">Your institution controls</div>
              <ul className="space-y-1.5 text-[12.5px] text-white/70">
                {["Who holds each governance authority", "Approval chains, quorums and policies", "Classification and clearance of records", "Retention horizons", "Who holds credentials and their scopes", "Deployment model and data residency"].map((x) => <li key={x} className="flex gap-2"><span className="text-sky-400">✓</span>{x}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* provable-now summary + CTA */}
      <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <div className="text-sm font-bold text-white">Provable today, not promised</div>
          <div className="mt-1 text-[12.5px] text-white/55">{policyCount ?? "·"} governance {policyCount === 1 ? "policy" : "policies"} enforced · {ov?.compliance.complianceRate ?? "·"}% compliance · {preserved ?? "·"} preserved · isolation, audit and certificates active now.</div>
        </div>
        <Link to="/admin/evidence" className="shrink-0 rounded-md bg-seal px-4 py-2 text-sm font-semibold text-white transition hover:bg-seal-light">Download the evaluation package →</Link>
      </Card>
      <p className="mt-4 text-[12px] text-white/35">Badges: <span className="text-emerald-300">Provable</span> — verifiable now; <span className="text-sky-300">You control</span> — set by your institution; <span className="text-gold-300">Per engagement</span> — arranged at deployment.</p>
    </div>
  );
};

export default TrustCenter;

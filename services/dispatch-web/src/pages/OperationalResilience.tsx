import React, { useEffect, useState } from "react";
import { getGovernanceOverview, type GovOverview, humanError } from "../lib/api";
import { Card } from "../lib/ui";
import { BASIS_LABEL, type SovBasis } from "../lib/sovereignty";

// Operational Resilience — availability, recovery, and preservation integrity.
// Preservation integrity is LIVE (every preserved record carries a SHA-256
// proof); the rest are honestly basis-badged — "configurable" (set per
// deployment) or "architected for" (capability, SLA scoped per engagement). No
// fabricated uptime figures.
const STYLE: Record<SovBasis, string> = {
  active: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  configurable: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  architected: "bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30",
};
const Badge: React.FC<{ b: SovBasis }> = ({ b }) => <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLE[b]}`}>{BASIS_LABEL[b]}</span>;

const OperationalResilience: React.FC = () => {
  const [ov, setOv] = useState<GovOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { getGovernanceOverview().then(setOv).catch((e) => setErr(humanError(e, "Could not load resilience posture."))); }, []);

  const preserved = ov?.compliance.preserved;
  const sections: { title: string; items: { label: string; value: string; basis: SovBasis; note?: string }[] }[] = [
    { title: "Preservation Integrity", items: [
      { label: "Preserved records", value: preserved === undefined ? "·" : `${preserved} sealed`, basis: "active", note: "Each carries a SHA-256 integrity proof over the canonical record." },
      { label: "Tamper evidence", value: "SHA-256 preservation + governance proofs", basis: "active", note: "Any alteration invalidates the proof." },
      { label: "Record immutability", value: "Archived state is terminal", basis: "active", note: "No edit, re-approval, withdrawal or republication after preservation." },
      { label: "Audit trail", value: "Append-only, hash-stamped", basis: "active" },
    ] },
    { title: "Availability & Recovery", items: [
      { label: "Availability", value: "High-availability architecture", basis: "architected", note: "Multi-AZ capable; SLA scoped per engagement." },
      { label: "Backups", value: "Automated, point-in-time", basis: "configurable", note: "Cadence and retention set per deployment." },
      { label: "Recovery (RPO/RTO)", value: "Targets set per engagement", basis: "architected" },
      { label: "Replication", value: "Cross-AZ / cross-region", basis: "configurable", note: "Enabled per residency and resilience requirements." },
    ] },
    { title: "Continuity", items: [
      { label: "Disaster recovery", value: "DR plan per engagement", basis: "architected" },
      { label: "Provider independence", value: "Standard PostgreSQL + portable artifacts", basis: "active", note: "No proprietary lock-in; relocatable across topologies." },
      { label: "Forward-only migrations", value: "Manifest-ordered, reproducible schema", basis: "active" },
      { label: "Data export", value: "Records + certificates exportable", basis: "configurable" },
    ] },
  ];

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Sovereignty</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Operational Resilience</h1>
        <p className="text-sm text-white/50">Availability, recovery, and the integrity of preserved records — what an institution relies on when it commits to a platform.</p>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        {sections.map((s) => (
          <Card key={s.title} className="p-5">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{s.title}</div>
            <ul className="space-y-3">
              {s.items.map((i) => (
                <li key={i.label}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13px] font-semibold text-white">{i.label}</span><Badge b={i.basis} />
                  </div>
                  <div className="text-[12.5px] text-white/70">{i.value}</div>
                  {i.note && <div className="mt-0.5 text-[11px] text-white/35">{i.note}</div>}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-white/35">Badges: <span className="text-emerald-300">Active</span> — provable now; <span className="text-sky-300">Configurable</span> — set per deployment; <span className="text-gold-300">Architected for</span> — capability, scoped per engagement.</p>
    </div>
  );
};

export default OperationalResilience;

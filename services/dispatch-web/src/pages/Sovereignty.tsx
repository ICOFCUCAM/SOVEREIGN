import React from "react";
import { Card } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { getSovereignty, BASIS_LABEL, type SovBasis } from "../lib/sovereignty";

// Sovereignty Dashboard — the institutional trust surface. Every panel is backed
// by a real property of the deployment or honestly badged: "Active" (provable),
// "Configurable" (set per engagement) or "Architected for" (control-aligned, not
// yet independently certified). No fabricated metrics, certifications or SLAs.
const BASIS_STYLE: Record<SovBasis, string> = {
  active: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  configurable: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  architected: "bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30",
};

const BasisBadge: React.FC<{ basis: SovBasis }> = ({ basis }) => (
  <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${BASIS_STYLE[basis]}`}>
    {BASIS_LABEL[basis]}
  </span>
);

const Sovereignty: React.FC = () => {
  const { session } = useAuth();
  const profile = getSovereignty();

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-serif text-[1.9rem] font-bold leading-tight tracking-tight text-white">Sovereignty</h1>
        <p className="text-sm text-white/50">
          The data, cryptographic, identity and governance posture of this deployment. Configuration-backed — nothing here is decorative.
        </p>
      </header>

      {/* posture banner */}
      <Card className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
        <Stat label="Data residency" value={profile.residencyRegion} />
        <Stat label="Tenant" value={session?.tenantId ? session.tenantId.slice(0, 8) + "…" : "—"} mono />
        <Stat label="Isolation" value="Row-level security" />
        <Stat label="Audit" value="Append-only · SHA-256" />
        <div className="ml-auto flex items-center gap-3 text-[11px] text-white/40">
          <Legend basis="active" /> <Legend basis="configurable" /> <Legend basis="architected" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {profile.sections.map((sec) => (
          <Card key={sec.title} className="p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">{sec.kicker}</p>
            <h2 className="mb-4 mt-1 text-base font-bold text-white">{sec.title}</h2>
            <dl className="space-y-3.5">
              {sec.items.map((it) => (
                <div key={it.label} className="border-b border-white/5 pb-3.5 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-white/45">{it.label}</dt>
                    <BasisBadge basis={it.basis} />
                  </div>
                  <dd className="mt-1 text-sm font-semibold text-white">{it.value}</dd>
                  {it.note && <dd className="mt-0.5 text-xs leading-snug text-white/40">{it.note}</dd>}
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-white/35">
        "Architected for" denotes control-aligned design, not an independent certification. Certification, residency
        and retention are scoped per institutional deployment. Request the deployment dossier for evidence and auditor reports.
      </p>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">{label}</div>
    <div className={`text-sm font-bold text-white ${mono ? "font-mono" : ""}`}>{value}</div>
  </div>
);

const Legend: React.FC<{ basis: SovBasis }> = ({ basis }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={`h-2 w-2 rounded-full ${basis === "active" ? "bg-emerald-400" : basis === "configurable" ? "bg-sky-400" : "bg-gold-400"}`} />
    {BASIS_LABEL[basis]}
  </span>
);

export default Sovereignty;

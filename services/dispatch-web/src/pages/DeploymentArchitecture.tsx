import React, { useState } from "react";
import { Card } from "../lib/ui";

// Deployment Architecture — operational, not marketing. The five topologies
// Sovereign Dispatch can run under, what each means for residency, connectivity,
// and who operates it. The current engagement's mode is marked; the rest are the
// available options a ministry selects per its sovereignty requirements.
type Mode = {
  key: string; name: string; tagline: string; current?: boolean;
  residency: string; control: string; connectivity: string; operatedBy: string; bestFor: string;
};
const MODES: Mode[] = [
  { key: "managed", name: "Managed Cloud", tagline: "Hosted regional deployment", current: true,
    residency: "Dedicated database in a chosen region (live: EU · Ireland)", control: "Platform-operated, tenant-isolated (RLS, deny-by-default)",
    connectivity: "Public API over TLS 1.2+", operatedBy: "Sovereign Dispatch", bestFor: "Fast onboarding; agencies without an internal estate" },
  { key: "private", name: "Private Cloud", tagline: "Your cloud account / VPC",
    residency: "Your cloud tenancy and region", control: "Deployed into your VPC; you hold the cloud account",
    connectivity: "Private networking / peering", operatedBy: "Joint — platform software, your infrastructure", bestFor: "Institutions standardised on a cloud provider" },
  { key: "sovereign", name: "Sovereign Hosting", tagline: "National / accredited data centre",
    residency: "In-jurisdiction sovereign data centre", control: "Runs under national hosting controls and accreditation",
    connectivity: "Government network / private link", operatedBy: "Accredited sovereign operator", bestFor: "Data-localisation mandates" },
  { key: "onprem", name: "On-Premise", tagline: "Inside your data centre",
    residency: "Entirely within your premises", control: "You own the hardware, network and operations",
    connectivity: "Internal network only", operatedBy: "Your institution", bestFor: "Full operational ownership" },
  { key: "airgap", name: "Air-Gapped", tagline: "Isolated, no external network",
    residency: "Within an isolated enclave", control: "No outbound connectivity; offline updates",
    connectivity: "None — physically separated", operatedBy: "Your institution (secure facility)", bestFor: "Classified / national-security estates" },
];

const DeploymentArchitecture: React.FC = () => {
  const [sel, setSel] = useState<Mode>(MODES[0]);
  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Sovereignty</div>
        <h1 className="mt-1.5 font-serif text-[1.9rem] font-bold leading-tight tracking-tight text-white">Deployment Architecture</h1>
        <p className="text-sm text-white/50">Where Sovereign Dispatch runs — and what each topology means for residency, control, and connectivity. The current engagement is marked; the rest are selectable per your sovereignty requirements.</p>
      </header>

      {/* topology spectrum */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
        {MODES.map((m) => (
          <button key={m.key} onClick={() => setSel(m)}
            className={`rounded-lg border p-4 text-left transition ${sel.key === m.key ? "border-seal-light/60 bg-white/[0.05]" : "border-white/10 bg-white/[0.02] hover:border-white/25"}`}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-white">{m.name}</div>
              {m.current && <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-300">Current</span>}
            </div>
            <div className="mt-1 text-[11px] leading-snug text-white/45">{m.tagline}</div>
          </button>
        ))}
      </div>
      <div className="mb-6 text-center text-[11px] uppercase tracking-[0.2em] text-white/25">Managed → → → → Fully sovereign</div>

      {/* selected topology detail */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">{sel.name}</h2>
          {sel.current && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">Current engagement</span>}
        </div>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {[["Data residency", sel.residency], ["Control & isolation", sel.control], ["Connectivity", sel.connectivity], ["Operated by", sel.operatedBy], ["Best for", sel.bestFor]].map(([k, v]) => (
            <div key={k}><dt className="text-[11px] uppercase tracking-wide text-white/40">{k}</dt><dd className="mt-0.5 text-sm text-white/85">{v}</dd></div>
          ))}
        </dl>
      </Card>

      <p className="mt-4 text-[12px] text-white/35">The platform is identical across topologies — the same governance engine, preservation, and audit. What changes is who holds the infrastructure and where the data physically lives. Deployment model is set per engagement.</p>
    </div>
  );
};

export default DeploymentArchitecture;

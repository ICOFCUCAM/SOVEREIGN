import React, { useEffect, useState } from "react";
import { listClients, type ServiceClient, humanError } from "../lib/api";
import { Card } from "../lib/ui";
import { BASIS_LABEL, type SovBasis } from "../lib/sovereignty";

// Integration Control Center — integrations framed as institutional systems, not
// raw endpoints. API Consumers are LIVE (the tenant's real service credentials);
// the connector categories are honestly badged: "Available" connectors set up per
// engagement, "Active" where the platform already provides it.
const STYLE: Record<SovBasis, string> = {
  active: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  configurable: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  architected: "bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30",
};
const Badge: React.FC<{ b: SovBasis; text?: string }> = ({ b, text }) => <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLE[b]}`}>{text ?? BASIS_LABEL[b]}</span>;

const CATEGORIES: { name: string; desc: string; basis: SovBasis; examples: string }[] = [
  { name: "Identity Providers", desc: "Single sign-on for human operators", basis: "architected", examples: "OIDC · SAML · Azure AD · Okta" },
  { name: "Government Directories", desc: "Authoritative people & role directories", basis: "architected", examples: "LDAP · national directory services" },
  { name: "Document Systems", desc: "Source content & records management", basis: "configurable", examples: "DMS · SharePoint · records systems" },
  { name: "Email & Notification", desc: "Dispatch and approval notifications", basis: "configurable", examples: "SMTP · transactional email" },
  { name: "Archival Systems", desc: "Long-term preservation hand-off", basis: "architected", examples: "National archives · WORM storage" },
];

const IntegrationControlCenter: React.FC = () => {
  const [clients, setClients] = useState<ServiceClient[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { listClients().then((r) => setClients(r.clients)).catch((e) => setErr(humanError(e, "Could not load integrations."))); }, []);
  const active = clients?.filter((c) => c.active) ?? [];

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-seal-light">Sovereignty</div>
        <h1 className="mt-1.5 font-serif text-[1.9rem] font-bold leading-tight tracking-tight text-white">Integration Control</h1>
        <p className="text-sm text-white/50">The systems Sovereign Dispatch connects to — identity, directories, document and archival systems — and the API consumers operating against this tenant.</p>
      </header>
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      {/* live API consumers */}
      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">API Consumers</div>
          <Badge b="active" text={`${active.length} active`} />
        </div>
        {clients === null ? <p className="text-sm text-white/40">Loading…</p> : active.length === 0 ? <p className="text-sm text-white/40">No active API consumers.</p> : (
          <div className="divide-y divide-white/5">
            {active.map((c) => (
              <div key={c.client_id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0"><div className="truncate text-sm font-semibold text-white">{c.name || c.client_id}</div><div className="truncate font-mono text-[11px] text-white/35">{c.client_id}</div></div>
                <div className="flex flex-wrap justify-end gap-1">{(c.scopes ?? []).map((s) => <span key={s} className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-white/45">{s.replace("dispatch:", "")}</span>)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* connector categories */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Card key={cat.name} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-bold text-white">{cat.name}</div>
              <Badge b={cat.basis} text={cat.basis === "configurable" ? "Available" : "On engagement"} />
            </div>
            <div className="mt-1 text-[12.5px] text-white/55">{cat.desc}</div>
            <div className="mt-2 text-[11px] text-white/35">{cat.examples}</div>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-white/35">API consumers are the tenant's live service credentials (managed in the Authority Directory). Connectors to external institutional systems are provisioned per engagement.</p>
    </div>
  );
};

export default IntegrationControlCenter;

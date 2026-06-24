import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listClients, getBilling, type ServiceClient, type Billing, humanError } from "../lib/api";
import { Card } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { planLabel } from "../lib/upsell";

// Administration overview — the platform posture of the institution's tenant:
// identity, active credentials, plan, and data residency. This is the systems-
// administration dashboard, deliberately distinct from the Operations dashboard
// (which is about records and governance). No operational record content here.
const AdminHome: React.FC = () => {
  const { session } = useAuth();
  const [clients, setClients] = useState<ServiceClient[] | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listClients().then((r) => setClients(r.clients)).catch((e) => setErr(humanError(e, "Could not load credentials.")));
    getBilling().then(setBilling).catch(() => {});
  }, []);

  const active = clients?.filter((c) => c.active).length;
  const tiles: { label: string; value: string; to: string; sub: string }[] = [
    { label: "Active credentials", value: active === undefined ? "·" : String(active), to: "/admin/access", sub: "API clients & secrets" },
    { label: "Plan", value: billing ? planLabel(billing.plan) : "·", to: "/admin/access", sub: billing ? (billing.subscriptionStatus === "active" ? "Subscription active" : "Evaluation") : "" },
    { label: "Integrations", value: "Direct DDM", to: "/admin/integrations", sub: "Programmatic intake" },
    { label: "Data residency", value: "Single region", to: "/admin/sovereignty", sub: "Tenant-isolated (RLS)" },
  ];

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-seal-light">Administration</div>
        <h1 className="mt-1 text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-sm text-white/50">Identity, access, integrations and data sovereignty for your institution's tenant.</p>
      </header>

      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to}>
            <Card className="h-full p-5 transition hover:border-seal-light/40">
              <div className="text-2xl font-bold text-white">{t.value}</div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{t.label}</div>
              {t.sub && <div className="mt-1 text-[11px] text-white/35">{t.sub}</div>}
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Tenant identity</div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div><dt className="text-[11px] uppercase tracking-wide text-white/40">Principal</dt><dd className="font-mono text-sm text-white/85">{session?.subject}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wide text-white/40">Tenant ID</dt><dd className="font-mono text-sm text-white/85">{session?.tenantId}</dd></div>
          <div className="sm:col-span-2">
            <dt className="text-[11px] uppercase tracking-wide text-white/40">Granted scopes</dt>
            <dd className="mt-1 flex flex-wrap gap-1">{session?.scopes.map((s) => <span key={s} className="rounded bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/55">{s}</span>)}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
};

export default AdminHome;

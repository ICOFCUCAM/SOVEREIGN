import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useBilling, QuotaMeter, UpgradeModal } from "../lib/upsell";

// TWO DISTINCT PRODUCTS on one platform, not one console with two menus. A
// ministry publication officer (Operations) and a systems integrator / security
// admin (Administration) never see each other's surfaces — different navigation,
// different mental model, different home. Records and governance live entirely
// in Operations; identity, credentials, integrations, policy and data residency
// live entirely in Administration. The shell is parameterised by `variant`; the
// route guards (App.tsx) keep operators out of /admin and vice-versa.
export type ConsoleVariant = "operations" | "administration";

type NavItem = { to: string; label: string; scope?: string; end?: boolean; group?: string };

const OPERATIONS_NAV: NavItem[] = [
  { to: "/console", label: "Command", end: true },
  { to: "/console/create", label: "Create Official Record", scope: "dispatch:render" },
  { to: "/console/review", label: "Governance", scope: "dispatch:approve" },
  { to: "/console/library", label: "Official Records", scope: "dispatch:read" },
  { to: "/console/archives", label: "Preservation", scope: "dispatch:read" },
  { to: "/console/audit", label: "Evidence", scope: "dispatch:audit" },
];

// Administration is an institutional governance product organised by operational
// domain — Identity (who holds authority), Governance (how records are governed),
// Compliance (can we prove it) — not a flat list of database tables.
const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Posture", end: true },
  { to: "/admin/authority", label: "Authority Directory", scope: "dispatch:admin", group: "Identity" },
  { to: "/admin/access", label: "Credentials & Access", scope: "dispatch:admin", group: "Identity" },
  { to: "/admin/governance", label: "Policy", scope: "dispatch:admin", group: "Governance" },
  { to: "/admin/monitor", label: "Oversight", scope: "dispatch:read", group: "Governance" },
  { to: "/admin/compliance", label: "Audit & Compliance", scope: "dispatch:read", group: "Compliance" },
  { to: "/admin/intelligence", label: "Intelligence", scope: "dispatch:read", group: "Compliance" },
  { to: "/admin/trust", label: "Trust", scope: "dispatch:read", group: "Sovereignty" },
  { to: "/admin/deployment", label: "Deployment", group: "Sovereignty" },
  { to: "/admin/sovereignty", label: "Data Sovereignty", group: "Sovereignty" },
  { to: "/admin/integrations", label: "Integrations", group: "Sovereignty" },
  { to: "/admin/resilience", label: "Operational Resilience", group: "Sovereignty" },
  { to: "/admin/evidence", label: "Evaluation Package", scope: "dispatch:read", group: "Sovereignty" },
  { to: "/evaluate", label: "Executive Evaluation ↗", scope: "dispatch:read", group: "Sovereignty" },
  { to: "/admin/intake", label: "Direct DDM Intake", scope: "dispatch:render", group: "Platform" },
];

const PRODUCT: Record<ConsoleVariant, { label: string; tag: string; nav: NavItem[]; home: string }> = {
  operations: { label: "Operations", tag: "Records & Governance", nav: OPERATIONS_NAV, home: "/console" },
  administration: { label: "Administration", tag: "Identity & Platform", nav: ADMIN_NAV, home: "/admin" },
};

const ConsoleShell: React.FC<{ children: React.ReactNode; variant?: ConsoleVariant }> = ({ children, variant = "operations" }) => {
  const { session, signOut, has } = useAuth();
  const nav = useNavigate();
  const { billing, setBilling } = useBilling();
  const [upgrade, setUpgrade] = useState(false);
  const product = PRODUCT[variant];
  const items = product.nav.filter((n) => !n.scope || has(n.scope));
  // The switcher only appears for principals who can actually use the other
  // product. Administration is gated on dispatch:admin; Operations on any
  // operating scope. A pure operator never even learns Administration exists.
  const canAdmin = has("dispatch:admin");
  const other = variant === "operations" ? "administration" : "operations";
  const showSwitch = other === "administration" ? canAdmin : true;

  return (
    <div className="flex h-full flex-col">
      {variant === "operations" && upgrade && (
        <UpgradeModal open reason="quota" onClose={() => setUpgrade(false)} onSubscribed={(b) => { setBilling(b); setUpgrade(false); }} />
      )}
      {/* classification ribbon */}
      <div className="gov-ribbon h-1 w-full bg-seal-deep" />
      <div className="flex flex-1 overflow-hidden">
        {/* rail */}
        <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-ink-900/60">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-seal text-sm font-black text-white">SD</div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-white">Sovereign Dispatch</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-seal-light">{product.label}</div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {items.map((n, i) => (
              <React.Fragment key={n.to}>
                {n.group && n.group !== items[i - 1]?.group && (
                  <div className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{n.group}</div>
                )}
                <NavLink to={n.to} end={n.end}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide transition ${isActive ? "bg-seal/30 text-white ring-1 ring-seal-light/40" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                  {n.label}
                </NavLink>
              </React.Fragment>
            ))}
          </nav>
          {/* product switcher — only for principals with access to the other product */}
          {showSwitch && (
            <button onClick={() => nav(PRODUCT[other].home)}
              className="mx-3 mb-2 flex items-center justify-between rounded-md border border-white/10 px-3 py-2 text-left text-[12px] text-white/55 transition hover:border-seal-light/40 hover:text-white">
              <span><span className="text-white/35">Switch to</span> {PRODUCT[other].label}</span>
              <span aria-hidden>→</span>
            </button>
          )}
          {variant === "operations" && billing && (
            <div className="border-t border-white/10 px-4 py-3">
              <QuotaMeter b={billing} />
              {!billing.canDownload && (
                <button onClick={() => setUpgrade(true)} className="mt-2 w-full rounded-md bg-seal px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-seal-light">Upgrade</button>
              )}
            </div>
          )}
          <div className="border-t border-white/10 px-4 py-3">
            <div className="truncate text-xs font-medium text-white/80">{session?.subject}</div>
            <div className="mb-2 truncate text-[10px] text-white/40">tenant {session?.tenantId?.slice(0, 8)}…</div>
            <button onClick={() => { signOut(); nav("/"); }} className="text-xs font-semibold text-white/50 hover:text-white">Sign out</button>
            <a href="/" className="ml-3 text-xs font-semibold text-white/30 hover:text-white/60">Home</a>
          </div>
        </aside>
        {/* main */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default ConsoleShell;

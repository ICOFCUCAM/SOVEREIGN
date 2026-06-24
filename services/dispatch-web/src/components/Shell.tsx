import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useBilling, QuotaMeter } from "../lib/upsell";

// The console is organised in two LAYERS, not one flat menu. Institutional
// operators live entirely in OPERATIONS and never need to see implementation
// detail; the technical machinery (credentials, integrations, raw DDM intake)
// is quarantined under ADMINISTRATION. An operator creates and governs records;
// they never "submit a JSON payload". Each item is scope-gated, and a section
// with no visible items is hidden entirely.
type NavItem = { to: string; label: string; scope?: string; end?: boolean };
type NavSection = { section: string; items: NavItem[] };
const NAV: NavSection[] = [
  { section: "Operations", items: [
    { to: "/console", label: "Operations", end: true },
    { to: "/console/create", label: "Create Record", scope: "dispatch:render" },
    { to: "/console/review", label: "Governance", scope: "dispatch:approve" },
    { to: "/console/library", label: "Records", scope: "dispatch:read" },
    { to: "/console/audit", label: "Audit", scope: "dispatch:audit" },
    { to: "/console/sovereignty", label: "Data Sovereignty" },
  ] },
  { section: "Administration", items: [
    { to: "/console/access", label: "Credentials & Access", scope: "dispatch:admin" },
    { to: "/console/integrations", label: "Integrations" },
    { to: "/console/submit", label: "Advanced · Direct DDM", scope: "dispatch:render" },
  ] },
];

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, signOut, has } = useAuth();
  const nav = useNavigate();
  const sections = NAV
    .map((s) => ({ ...s, items: s.items.filter((n) => !n.scope || has(n.scope)) }))
    .filter((s) => s.items.length > 0);
  const { billing } = useBilling();

  return (
    <div className="flex h-full flex-col">
      {/* classification ribbon */}
      <div className="gov-ribbon h-1 w-full bg-seal-deep" />
      <div className="flex flex-1 overflow-hidden">
        {/* rail */}
        <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-ink-900/60">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-seal text-sm font-black text-white">SD</div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-white">Sovereign Dispatch</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Publication Infra</div>
            </div>
          </div>
          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {sections.map((s) => (
              <div key={s.section} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{s.section}</div>
                {s.items.map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.end}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide transition ${isActive ? "bg-seal/30 text-white ring-1 ring-seal-light/40" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                    {n.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          {billing && (
            <div className="border-t border-white/10 px-4 py-3">
              <QuotaMeter b={billing} />
              {!billing.canDownload && (
                <button onClick={() => nav("/console/access")} className="mt-2 w-full rounded-md bg-seal px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-seal-light">Upgrade</button>
              )}
            </div>
          )}
          <div className="border-t border-white/10 px-4 py-3">
            <div className="truncate text-xs font-medium text-white/80">{session?.subject}</div>
            <div className="mb-2 truncate text-[10px] text-white/40">tenant {session?.tenantId?.slice(0, 8)}…</div>
            <div className="mb-2 flex flex-wrap gap-1">
              {session?.scopes.map((s) => (
                <span key={s} className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-white/45">{s.replace("dispatch:", "")}</span>
              ))}
            </div>
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

export default Shell;

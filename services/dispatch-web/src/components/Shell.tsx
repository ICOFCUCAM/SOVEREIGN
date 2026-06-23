import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

// Role-filtered, top-level navigation — institutional command surfaces, not a
// file menu. Flat by design (Operations · Pipeline · Records · Governance ·
// Audit · Sovereignty · Integrations), in lifecycle order. Items are gated by
// scope, so an auditor sees Governance/Audit and an author sees the Pipeline.
// A few surfaces expose children (the Pipeline's two intake modes).
type NavItem = { to: string; label: string; scope?: string; end?: boolean; children?: { to: string; label: string }[] };
const NAV: NavItem[] = [
  { to: "/console", label: "Operations", end: true },
  { to: "/console/submit", label: "Pipeline", scope: "dispatch:render", children: [
    { to: "/console/create", label: "Compose" },
    { to: "/console/submit", label: "Submit DDM" },
  ] },
  { to: "/console/library", label: "Records", scope: "dispatch:read" },
  { to: "/console/review", label: "Governance", scope: "dispatch:approve" },
  { to: "/console/audit", label: "Audit", scope: "dispatch:audit" },
  { to: "/console/sovereignty", label: "Sovereignty" },
  { to: "/console/integrations", label: "Integrations" },
];

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, signOut, has } = useAuth();
  const nav = useNavigate();
  const items = NAV.filter((n) => !n.scope || has(n.scope));

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
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {items.map((n) => (
              <div key={n.to}>
                <NavLink to={n.to} end={n.end}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide transition ${isActive ? "bg-seal/30 text-white ring-1 ring-seal-light/40" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                  {n.label}
                </NavLink>
                {n.children && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/8 pl-2">
                    {n.children.map((c) => (
                      <NavLink key={c.to + c.label} to={c.to} end
                        className={({ isActive }) =>
                          `block rounded px-3 py-1.5 text-[12.5px] font-medium transition ${isActive ? "text-white" : "text-white/45 hover:text-white/80"}`}>
                        {c.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
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

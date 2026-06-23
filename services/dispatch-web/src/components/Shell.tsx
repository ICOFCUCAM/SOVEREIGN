import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

// Role-filtered navigation rail, organised as institutional sections rather than
// a flat file menu. Items are gated by scope so an auditor sees the governance
// surface and an author sees the operator surface — one app, two faces. The
// lifecycle ordering (Operations → Pipeline → Governance → Records) is the
// information architecture, not a file browser. A section with no visible items
// is hidden entirely.
type NavItem = { to: string; label: string; scope?: string; end?: boolean };
const SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Operations",
    items: [{ to: "/console", label: "Operations", end: true }],
  },
  {
    heading: "Publication Pipeline",
    items: [
      { to: "/console/create", label: "Create", scope: "dispatch:render" },
      { to: "/console/submit", label: "Submit", scope: "dispatch:render" },
    ],
  },
  {
    heading: "Governance",
    items: [
      { to: "/console/review", label: "Review & Approve", scope: "dispatch:approve" },
      { to: "/console/audit", label: "Audit Center", scope: "dispatch:audit" },
    ],
  },
  {
    heading: "Records",
    items: [{ to: "/console/library", label: "Official Records", scope: "dispatch:read" }],
  },
  {
    heading: "Platform",
    items: [
      { to: "/console/sovereignty", label: "Sovereignty" },
      { to: "/console/integrations", label: "Integrations" },
      { to: "/console/polished", label: "Polished Pages" },
    ],
  },
];

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, signOut, has } = useAuth();
  const nav = useNavigate();
  const sections = SECTIONS
    .map((s) => ({ ...s, items: s.items.filter((n) => !n.scope || has(n.scope)) }))
    .filter((s) => s.items.length > 0);

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
          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
            {sections.map((s) => (
              <div key={s.heading} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">{s.heading}</div>
                {s.items.map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.end}
                    className={({ isActive }) =>
                      `block rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "bg-seal/30 text-white ring-1 ring-seal-light/40" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                    {n.label}
                  </NavLink>
                ))}
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

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

// Role-filtered navigation rail. Items are gated by scope so an auditor sees the
// governance surface and an author sees the operator surface — one app, two
// faces. The lifecycle ordering (Submit → Review → Render → Library) is the
// information architecture, not a file browser.
const NAV: { to: string; label: string; scope?: string }[] = [
  { to: "/console", label: "Dashboard" },
  { to: "/console/submit", label: "Submit", scope: "dispatch:render" },
  { to: "/console/review", label: "Review & Approve", scope: "dispatch:approve" },
  { to: "/console/library", label: "Library", scope: "dispatch:read" },
  { to: "/console/audit", label: "Audit", scope: "dispatch:audit" },
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
          <nav className="flex-1 space-y-1 px-3 py-2">
            {items.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/console"}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "bg-seal/30 text-white ring-1 ring-seal-light/40" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                {n.label}
              </NavLink>
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

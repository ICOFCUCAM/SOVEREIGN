import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

// Ten-module rail. Modules are grouped by mental cluster: deal-flow up top
// (intelligence → buyers → pipeline), workspace in the middle (data room,
// investors, documents, NDA), and the operator tier at the bottom
// (negotiator, closing). Active route highlights with deal accent.
const NAV: Array<{ to: string; label: string; group: string; scope?: string }> = [
  { to: "/console",                label: "Founder Dashboard",      group: "Overview" },
  { to: "/console/intelligence",   label: "Acquisition Intelligence", group: "Sourcing" },
  { to: "/console/buyers",         label: "Buyer Marketplace",      group: "Sourcing" },
  { to: "/console/pipeline",       label: "Acquisition Pipeline",   group: "Sourcing" },
  { to: "/console/data-room",      label: "Virtual Data Room",      group: "Workspace" },
  { to: "/console/investors",      label: "Investor CRM",           group: "Workspace" },
  { to: "/console/documents",      label: "Document Generator",     group: "Workspace" },
  { to: "/console/nda",            label: "NDA Automation",         group: "Workspace" },
  { to: "/console/negotiator",     label: "AI Deal Negotiator",     group: "Operator" },
  { to: "/console/closing",        label: "Deal Closing Center",    group: "Operator" },
  { to: "/console/marketplace",    label: "Exit Marketplace",       group: "Marketplace" },
];

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, signOut, has } = useAuth();
  const nav = useNavigate();
  const items = NAV.filter((n) => !n.scope || has(n.scope));

  const groups = items.reduce<Record<string, typeof NAV>>((acc, item) => {
    acc[item.group] = acc[item.group] ?? [];
    acc[item.group]!.push(item);
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col">
      <div className="h-1 w-full bg-gradient-to-r from-deal-700 via-deal-500 to-loi-500" />
      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-ink-900/70">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-gradient-to-br from-deal-400 to-deal-700 text-sm font-black text-white shadow-lg shadow-deal-700/30">
              EX
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-white">ExitOS</div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Founder Acquisition Suite</div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            {Object.entries(groups).map(([group, list]) => (
              <div key={group} className="mb-4">
                <div className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/30">{group}</div>
                <div className="space-y-1">
                  {list.map((n) => (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      end={n.to === "/console"}
                      className={({ isActive }) =>
                        `block rounded-md px-3 py-2 text-[13px] font-medium transition ${isActive
                          ? "bg-deal-600/20 text-white ring-1 ring-deal-400/40"
                          : "text-white/60 hover:bg-white/5 hover:text-white"}`
                      }
                    >
                      {n.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-white/10 px-4 py-3">
            <div className="truncate text-xs font-medium text-white/80">{session?.email}</div>
            <div className="mb-2 truncate text-[10px] text-white/40">workspace · {session?.workspace}</div>
            <button
              onClick={() => { signOut(); nav("/"); }}
              className="text-xs font-semibold text-white/50 hover:text-white"
            >
              Sign out
            </button>
            <a href="/" className="ml-3 text-xs font-semibold text-white/30 hover:text-white/60">Home</a>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-8 py-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Shell;

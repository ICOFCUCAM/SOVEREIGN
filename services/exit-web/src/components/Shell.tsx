import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

// Stage-based rail. Founders think in stages, not modules — so the navigation
// mirrors the arc of a sale: Prepare → Find Buyers → Diligence → Negotiate →
// Close. Each item maps to a real surface; facets that live inside a page
// (Readiness, Signatures, Escrow) link to an anchor on that page.
const NAV: Array<{ to: string; label: string; group: string; scope?: string }> = [
  { to: "/console",                    label: "Dashboard",        group: "Overview" },
  { to: "/console/autopilot",          label: "Autonomous Exit",  group: "Overview" },

  { to: "/console/valuation",          label: "Valuation",        group: "Prepare" },
  { to: "/console/readiness",          label: "Readiness",        group: "Prepare" },
  { to: "/console/investors",          label: "Cap Table",        group: "Prepare" },

  { to: "/console/intelligence",       label: "Intelligence",     group: "Find Buyers" },
  { to: "/console/buyer-copilot",      label: "Buyer Copilot",    group: "Find Buyers" },
  { to: "/console/buyers",             label: "Buyers",           group: "Find Buyers" },
  { to: "/console/marketplace",        label: "Marketplace",      group: "Find Buyers" },
  { to: "/console/banker",             label: "Outreach",         group: "Find Buyers" },

  { to: "/console/diligence-ai",       label: "Diligence",        group: "Diligence" },
  { to: "/console/deal-room",          label: "Live Deal Room",   group: "Diligence" },
  { to: "/console/data-room",          label: "Data Room",        group: "Diligence" },
  { to: "/console/documents",          label: "Documents",        group: "Diligence" },
  { to: "/console/nda",                label: "NDA",              group: "Diligence" },

  { to: "/console/pipeline",           label: "Offers",           group: "Negotiate" },
  { to: "/console/negotiator",         label: "Negotiator",       group: "Negotiate" },
  { to: "/console/simulator",          label: "Simulator",        group: "Negotiate" },

  { to: "/console/closing",            label: "Closing Center",   group: "Close" },
  { to: "/console/closing#signatures", label: "Signatures",       group: "Close" },
  { to: "/console/closing#escrow",     label: "Escrow",           group: "Close" },

  { to: "/console/wealth",             label: "Wealth Transition", group: "Wealth" },

  { to: "/console/buyer-portal",       label: "Buyer Portal",     group: "Internal" },
  { to: "/console/calibration",        label: "Calibration",      group: "Internal" },
];

// Preserve the founder-stage order rather than insertion-bucketed order.
const GROUP_ORDER = ["Overview", "Prepare", "Find Buyers", "Diligence", "Negotiate", "Close", "Wealth", "Internal"];

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, signOut, has } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const items = NAV.filter((n) => !n.scope || has(n.scope));

  // Scroll anchored sections into view when the hash changes (and reset to
  // top on a plain page change). A short delay lets the target page mount.
  useEffect(() => {
    const id = loc.hash ? loc.hash.slice(1) : null;
    const t = setTimeout(() => {
      if (id) {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
    return () => clearTimeout(t);
  }, [loc.pathname, loc.hash]);

  const current = `${loc.pathname}${loc.hash}`;
  const isActive = (to: string): boolean => {
    if (to.includes("#")) return current === to;
    if (to === "/console") return loc.pathname === "/console" && loc.hash === "";
    return loc.pathname === to && loc.hash === "";
  };

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
            {GROUP_ORDER.filter((g) => groups[g]).map((group) => (
              <div key={group} className="mb-4">
                <div className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/30">{group}</div>
                <div className="space-y-1">
                  {groups[group]!.map((n) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={`block rounded-md px-3 py-2 text-[13px] font-medium transition ${isActive(n.to)
                        ? "bg-deal-600/20 text-white ring-1 ring-deal-400/40"
                        : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                    >
                      {n.label}
                    </Link>
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

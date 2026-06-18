import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Toast } from "../lib/ui";
import { navForRole, needsUpgrade, GROUP_ORDER, ROLE_LABEL, type NavItem, type Role, type Plan } from "../lib/access";
import { ExchangeMark } from "./ExchangeMark";
import LayerBar from "./LayerBar";
import LayerSubNav from "./LayerSubNav";

// Role-aware console rail. The navigation is driven by the access policy:
// founders, buyers, admins and superadmins see different command centers, and
// pro-only surfaces show a lock for free plans (linking to the upgrade screen).

const basePath = (to: string): string => to.split("#")[0];

// Routes that render as full-bleed workstations (one instrument, no centered
// column) rather than the standard document-width page.
const WORKSTATION_ROUTES = new Set([
  "/console", "/console/buyer-graph", "/console/acquisition-radar", "/console/inbox",
  "/console/valuation", "/console/readiness",
  "/console/indexes", "/console/outcomes", "/console/exit-timing", "/console/market-map",
  "/console/activity", "/console/engagement-registry", "/console/process-intel", "/console/outreach-plan", "/console/pipeline",
  "/console/buyer-portal", "/console/investors", "/console/buyers", "/console/buyer-copilot",
  "/console/commander", "/console/marketplace", "/console/nda", "/console/network",
  "/console/diligence-ai", "/console/data-room", "/console/documents", "/console/negotiator", "/console/simulator",
  "/console/closing", "/console/wealth", "/console/knowledge-graph",
]);

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  const role: Role = session?.role ?? "founder";
  const plan: Plan = session?.plan ?? "free";
  const items = navForRole(role);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const showStarterNotice = role === "founder" && plan === "starter" && !noticeDismissed;

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setNavOpen(false); }, [loc.pathname, loc.hash]);

  // Scroll anchored sections into view when the hash changes.
  useEffect(() => {
    const id = loc.hash ? loc.hash.slice(1) : null;
    const t = setTimeout(() => { if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
    return () => clearTimeout(t);
  }, [loc.pathname, loc.hash]);

  const current = `${loc.pathname}${loc.hash}`;
  const isActive = (to: string): boolean => {
    if (to.includes("#")) return current === to;
    if (to === "/console") return loc.pathname === "/console" && loc.hash === "";
    return loc.pathname === to && loc.hash === "";
  };

  const groups = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.group] = acc[item.group] ?? []).push(item);
    return acc;
  }, {});

  const subtitle = role === "buyer" ? "Buyer Access" : role === "admin" || role === "superadmin" ? "Operator Console" : "Founder Acquisition Suite";

  const Brand = (
    <div className="flex items-center gap-2.5">
      <ExchangeMark size={32} />
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-tight text-white">ExitOS</div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">{subtitle}</div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div aria-hidden className="h-1 w-full bg-gradient-to-r from-deal-700 via-deal-500 to-loi-500" />

      {/* Mobile top bar */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-ink-900/80 px-4 py-3 lg:hidden">
        <button onClick={() => setNavOpen(true)} aria-label="Open navigation menu" aria-expanded={navOpen}
          className="rounded-md p-2 text-white/80 ring-1 ring-white/15 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>
        {Brand}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {navOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" aria-hidden onClick={() => setNavOpen(false)} />}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-white/10 bg-ink-900/95 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:bg-ink-900/70 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}
          aria-label="Sidebar"
        >
          <div className="flex items-center justify-between px-5 py-5">
            {Brand}
            <button onClick={() => setNavOpen(false)} aria-label="Close navigation menu" className="rounded p-1 text-white/50 hover:text-white lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">✕</button>
          </div>
          <nav aria-label="Console" className="flex-1 overflow-y-auto px-3 py-2">
            {GROUP_ORDER.filter((g) => groups[g]).map((group) => (
              <div key={group} className="mb-4">
                <div className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/40">{group}</div>
                <div className="space-y-1">
                  {groups[group]!.map((n) => {
                    const active = isActive(n.to);
                    const locked = needsUpgrade(basePath(n.to), role, plan);
                    return (
                      <Link
                        key={`${n.to}-${n.group}`}
                        to={locked ? "/console/upgrade" : n.to}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setNavOpen(false)}
                        className={`flex items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400 ${active
                          ? "bg-deal-600/20 text-white ring-1 ring-deal-400/40"
                          : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                      >
                        <span className={locked ? "text-white/45" : ""}>{n.label}</span>
                        {locked && <span aria-label="Pro feature" title="Upgrade to Pro" className="text-[10px] text-white/35">🔒</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="border-t border-white/10 px-4 py-3">
            <div className="truncate text-xs font-medium text-white/80">{session?.email}</div>
            <div className="mb-2 flex items-center gap-1.5 text-[10px] text-white/50">
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-white/70">{ROLE_LABEL[role]}</span>
              <span className={`rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide ${plan === "pro" ? "bg-deal-600/25 text-deal-300" : plan === "starter" ? "bg-loi-500/20 text-loi-300" : "bg-white/10 text-white/55"}`}>{plan}</span>
            </div>
            {plan !== "pro" && (role === "founder" || role === "buyer") && (
              <Link to="/console/upgrade" className="mb-2 block text-xs font-semibold text-deal-300 hover:text-deal-200">Upgrade to Pro →</Link>
            )}
            <button onClick={() => { signOut(); nav("/"); }} className="rounded text-xs font-semibold text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deal-400">Sign out</button>
            <a href="/" className="ml-3 text-xs font-semibold text-white/45 hover:text-white/70">Home</a>
          </div>
        </aside>

        <main className="relative flex-1 overflow-y-auto">
          <div className="sticky top-0 z-30">
            <LayerBar />
            <LayerSubNav />
          </div>
          {showStarterNotice && (
            <div className="border-b border-loi-400/30 bg-loi-500/10">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
                <span className="text-[13px] text-loi-100">🔔 <span className="font-semibold">Buyers are reviewing your listing.</span> Upgrade to Pro to open conversations, run outreach and continue with the agents.</span>
                <Link to="/console/upgrade" className="ml-auto rounded-md bg-deal-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-deal-500">Upgrade to Pro →</Link>
                <button onClick={() => setNoticeDismissed(true)} aria-label="Dismiss" className="rounded p-1 text-white/45 hover:text-white">✕</button>
              </div>
            </div>
          )}
          {WORKSTATION_ROUTES.has(loc.pathname)
            ? <div className="px-3 py-3 sm:px-4 lg:px-5 lg:py-4">{children}</div>   /* full-bleed command centers */
            : <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</div>}
        </main>
      </div>
      <Toast />
    </div>
  );
};

export default Shell;

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { canAccess, featureLabel, type Role } from "../lib/access";

// ── THE FIVE COMMAND LAYERS ─────────────────────────────────────────
// The institutional operating model: every console surface belongs to one of
// five interconnected layers. One row under the market ribbon: the layers, and
// beside the active one the pages within it, so moving between desks and within
// a desk is one click — Executive → Banker → Market → Transaction → Buyer.

interface Layer { key: string; roman: string; label: string; to: string; match: readonly string[] }

export const LAYERS: readonly Layer[] = [
  { key: "EXEC", roman: "I", label: "Executive", to: "/console/commander",
    match: ["/console/commander"] },
  { key: "CIB", roman: "II", label: "Investment Banker", to: "/console",
    match: ["/console", "/console/intake", "/console/valuation", "/console/readiness", "/console/exit-timing", "/console/autopilot"] },
  { key: "MKT", roman: "III", label: "Market", to: "/console/market-map",
    match: ["/console/market-map", "/console/indexes", "/console/outcomes", "/console/knowledge-graph", "/console/network", "/console/buyer-graph"] },
  { key: "TXN", roman: "IV", label: "Transaction", to: "/console/pipeline",
    match: ["/console/pipeline", "/console/negotiator", "/console/nda", "/console/data-room", "/console/documents", "/console/closing", "/console/activity", "/console/process-intel", "/console/inbox", "/console/marketplace", "/console/deal-room", "/console/simulator", "/console/diligence-ai"] },
  { key: "BUY", roman: "V", label: "Buyer", to: "/console/buyers",
    match: ["/console/buyers", "/console/buyer-copilot", "/console/acquisition-radar", "/console/engagement-registry", "/console/outreach-plan", "/console/buyer-portal"] },
];

/** The layer whose match-set best fits the current path (longest prefix). */
export function activeLayer(path: string): string {
  let best = "", bestLen = -1;
  for (const l of LAYERS) for (const m of l.match) {
    if ((path === m || path.startsWith(m + "/")) && m.length > bestLen) { best = l.key; bestLen = m.length; }
  }
  return best;
}

/** The layers a role can open, each pointed at its first surface the role may see (a buyer is never sent to a
 *  founder desk only to be bounced home). */
export function layersFor(role: Role): Array<Layer & { href: string }> {
  return LAYERS.flatMap((l) => {
    const href = canAccess(l.to, role) ? l.to : l.match.find((m) => canAccess(m, role));
    return href ? [{ ...l, href }] : [];
  });
}

/** The pages within a layer the role can open, by their menu names (none when the layer has one page). */
export function layerPages(layer: Layer, role: Role): Array<{ to: string; label: string }> {
  const items = layer.match
    .map((to) => ({ to, label: featureLabel(to, role) }))
    .filter((x): x is { to: string; label: string } => !!x.label && canAccess(x.to, role));
  return items.length > 1 ? items : [];
}

const LayerBar: React.FC = () => {
  const { pathname } = useLocation();
  const { session } = useAuth();
  const role: Role = session?.role ?? "founder";
  const active = activeLayer(pathname);
  return (
    <nav aria-label="Command layers" className="flex items-stretch ex-hscroll overflow-x-auto border-b border-white/10 bg-ex-0/80 backdrop-blur-sm">
      {layersFor(role).map((l) => {
        const on = l.key === active;
        const pages = on ? layerPages(l, role) : [];
        return (
          <React.Fragment key={l.key}>
            <Link to={l.href} aria-current={on ? "true" : undefined}
              className={`group flex shrink-0 items-center gap-2 border-r border-white/[0.07] px-3.5 py-1.5 transition ${on ? "bg-ex-bronze/12" : "hover:bg-white/[0.03]"}`}>
              <span className={`font-mono text-[9px] font-bold ${on ? "text-desk-champagne" : "text-white/60"}`}>{l.roman}</span>
              <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${on ? "text-white" : "text-white/70 group-hover:text-white"}`}>{l.label}</span>
            </Link>
            {pages.length > 0 && (
              <span className="flex shrink-0 items-stretch border-r border-white/[0.07] bg-ex-bronze/[0.06]">
                {pages.map((x) => (
                  <Link key={x.to} to={x.to} aria-current={pathname === x.to ? "page" : undefined}
                    className={`flex shrink-0 items-center px-3 text-[10.5px] font-medium transition ${pathname === x.to ? "bg-white/[0.06] text-white" : "text-white/70 hover:text-white"}`}>
                    {x.label}
                  </Link>
                ))}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default LayerBar;

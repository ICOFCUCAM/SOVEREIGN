import React from "react";
import { Link, useLocation } from "react-router-dom";

// ── THE FIVE COMMAND LAYERS ─────────────────────────────────────────
// The institutional operating model: every console surface belongs to one of
// five interconnected layers. This persistent spine sits under the market
// ribbon and lets an operator move between layers like switching desks —
// Executive → Banker → Market → Transaction → Buyer — not browsing pages.

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

const LayerBar: React.FC = () => {
  const { pathname } = useLocation();
  const active = activeLayer(pathname);
  return (
    <div className="flex items-stretch overflow-x-auto border-b border-white/10 bg-ink-950/80 backdrop-blur-sm">
      <span className="flex shrink-0 items-center border-r border-white/10 px-3 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/30">Command Layers</span>
      {LAYERS.map((l) => {
        const on = l.key === active;
        return (
          <Link key={l.key} to={l.to}
            className={`group flex shrink-0 items-center gap-2 border-r border-white/[0.07] px-3.5 py-1.5 transition ${on ? "bg-deal-600/12" : "hover:bg-white/[0.03]"}`}>
            <span className={`font-mono text-[9px] font-bold ${on ? "text-deal-300" : "text-white/30"}`}>{l.roman}</span>
            <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${on ? "text-white" : "text-white/50 group-hover:text-white/80"}`}>{l.label}</span>
            {on && <span className="h-1 w-1 rounded-full bg-deal-400" />}
          </Link>
        );
      })}
    </div>
  );
};

export default LayerBar;

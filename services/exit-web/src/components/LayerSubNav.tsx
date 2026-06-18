import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { featureLabel, canAccess, type Role } from "../lib/access";
import { LAYERS, activeLayer } from "./LayerBar";

// The contextual sub-nav for the active command layer — the sibling surfaces
// within the current desk, so moving inside a layer is one keystroke. Filtered
// to what the role can actually open; hidden when a layer has a single surface.

const LayerSubNav: React.FC = () => {
  const { pathname } = useLocation();
  const { session } = useAuth();
  const role: Role = session?.role ?? "founder";
  const layer = LAYERS.find((l) => l.key === activeLayer(pathname));
  if (!layer) return null;

  const items = layer.match
    .map((to) => ({ to, label: featureLabel(to, role) }))
    .filter((x): x is { to: string; label: string } => !!x.label && canAccess(x.to, role));
  if (items.length <= 1) return null;

  return (
    <div className="flex items-stretch gap-px overflow-x-auto border-b border-white/10 bg-ink-950/70 backdrop-blur-sm">
      <span className="flex shrink-0 items-center border-r border-white/10 px-3 text-[8px] font-semibold uppercase tracking-[0.22em] text-deal-300/70">{layer.label}</span>
      {items.map((i) => {
        const on = pathname === i.to;
        return (
          <Link key={i.to} to={i.to}
            className={`shrink-0 px-3 py-1 text-[10.5px] font-medium transition ${on ? "bg-white/[0.05] text-white" : "text-white/45 hover:text-white/80"}`}>
            {i.label}
          </Link>
        );
      })}
    </div>
  );
};

export default LayerSubNav;

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
    <nav aria-label={`${layer.label} pages`} className="flex items-stretch ex-hscroll overflow-x-auto border-b border-white/10 bg-ex-1">
      <span className="flex shrink-0 items-center border-r border-white/10 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-desk-champagne">{layer.label}</span>
      {items.map((i) => {
        const on = pathname === i.to;
        return (
          <Link key={i.to} to={i.to} aria-current={on ? "page" : undefined}
            className={`shrink-0 border-r border-white/10 px-4 py-2.5 text-[12.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ex-bronze ${on ? "text-white shadow-[inset_0_-2px_0_0_#E2C07F]" : "text-white/70 hover:text-white"}`}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default LayerSubNav;

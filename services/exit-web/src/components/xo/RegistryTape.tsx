import React from "react";
import type { TapeItem, TapeKind } from "../../lib/market-tape";
import { Provenance, ScrollRegion } from "./index";

// A static, dated strip of the most recent registry entries — the honest
// replacement for an animated "live" ticker. The registry is a bundled
// snapshot, so the strip says so and shows each entry's date; there is no
// pulsing dot and no motion implying a feed.

const KIND: Record<TapeKind, { label: string; cls: string }> = {
  ACQ: { label: "Acquisition", cls: "text-xo-verified" },
  BUYER: { label: "Buyer move", cls: "text-xo-action" },
  SECTOR: { label: "Sector 12m", cls: "text-xo-brass" },
  MANDATE: { label: "Your activity", cls: "text-xo-caution" },
};

export const RegistryTape: React.FC<{ items: TapeItem[]; asOf: string }> = ({ items, asOf }) => {
  if (!items.length) return null;
  return (
    <div className="flex items-stretch border border-xo-line bg-xo-panel">
      <div className="flex shrink-0 flex-col justify-center gap-0.5 border-r border-xo-line px-3 py-1.5">
        <Provenance kind="snapshot">Registry · as of {asOf}</Provenance>
      </div>
      <ScrollRegion label={`Recent registry entries, snapshot as of ${asOf}`} className="flex-1">
        <ul className="flex w-max items-center whitespace-nowrap py-1.5">
          {items.map((it, i) => (
            <li key={i} className="inline-flex items-baseline gap-1.5 border-r border-xo-line px-3 text-[12px] last:border-0">
              <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${KIND[it.kind].cls}`}>{KIND[it.kind].label}</span>
              <span className="text-xo-text">{it.label}</span>
              {it.value && (
                <span className={`font-mono tabular-nums ${it.dir === "down" ? "text-xo-risk" : "text-xo-muted"}`}>
                  {it.dir === "up" ? "▲ " : it.dir === "down" ? "▼ " : ""}{it.value}
                </span>
              )}
              {it.ts && <span className="font-mono text-[11px] tabular-nums text-xo-faint">{it.ts.slice(0, 10)}</span>}
            </li>
          ))}
        </ul>
      </ScrollRegion>
    </div>
  );
};

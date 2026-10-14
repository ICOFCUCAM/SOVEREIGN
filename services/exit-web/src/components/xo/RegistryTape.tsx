import React, { useRef } from "react";
import type { TapeItem, TapeKind } from "../../lib/market-tape";
import { Provenance } from "./index";

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
  const strip = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  return (
    <div className="flex items-stretch border border-xo-line bg-xo-panel">
      <div className="flex shrink-0 flex-col justify-center gap-0.5 border-r border-xo-line px-3 py-1.5">
        <Provenance kind="snapshot">Registry · as of {asOf}</Provenance>
      </div>
      <div ref={strip} role="region" aria-label={`Recent registry entries, snapshot as of ${asOf}`} tabIndex={0}
        className="relative flex-1 overflow-x-auto scroll-smooth [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xo-action [&::-webkit-scrollbar]:hidden">
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
      </div>
      <button type="button" onClick={() => strip.current?.scrollBy({ left: 320 })} aria-label="Show more registry entries"
        className="grid w-9 shrink-0 place-items-center border-l border-xo-line text-xo-muted transition hover:bg-xo-raise hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xo-action">
        <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4.5 2.5 8 6 4.5 9.5" /></svg>
      </button>
    </div>
  );
};

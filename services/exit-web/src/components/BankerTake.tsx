import React from "react";
import { Link } from "react-router-dom";

// Banker's Take — leads with the single Recommended Action (the decision to
// make now + its estimated impact + the button to act), then backs it with
// the four supporting reads a sell-side banker would give: money at stake,
// cost of inaction, which buyer to pursue, and what ExitOS does for you.
// Every value is page-supplied and engine-derived — no static copy. The goal
// is that every screen moves the founder toward a sale with one decision.

export interface BankerCta {
  label: string;
  to?: string;
  onClick?: () => void;
}

export interface BankerTakeProps {
  next: React.ReactNode;        // the recommended action (the decision)
  stake: React.ReactNode;       // money on the table
  inaction: React.ReactNode;    // cost of waiting
  buyer: React.ReactNode;       // which buyer to pursue
  automate: React.ReactNode;    // what ExitOS will do for you
  impact?: React.ReactNode;     // estimated impact of the recommended action
  cta?: BankerCta;
}

interface CellSpec { glyph: string; tint: string; label: string; body: React.ReactNode; }

const BankerTake: React.FC<BankerTakeProps> = ({ next, stake, inaction, buyer, automate, impact, cta }) => {
  const cells: CellSpec[] = [
    { glyph: "$", tint: "text-xo-verified",      label: "At stake",      body: stake },
    { glyph: "!", tint: "text-xo-risk",       label: "If you wait",   body: inaction },
    { glyph: "◎", tint: "text-stage-engaged", label: "Pursue",        body: buyer },
    { glyph: "⚡", tint: "text-xo-caution",       label: "ExitOS does it", body: automate },
  ];

  const ctaEl = cta && (cta.to ? (
    <Link to={cta.to} className="inline-flex items-center rounded-md bg-desk-gold px-4 py-2 text-[13px] font-semibold text-desk-ink transition hover:bg-[#AA8443]">
      {cta.label} →
    </Link>
  ) : (
    <button onClick={cta.onClick} className="inline-flex items-center rounded-md bg-desk-gold px-4 py-2 text-[13px] font-semibold text-desk-ink transition hover:bg-[#AA8443]">
      {cta.label} →
    </button>
  ));

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-xo-verified/30 bg-xo-panel">
      {/* Recommended Action — the lead */}
      <div className="border-b border-xo-line bg-gradient-to-r from-deal-600/15 to-transparent p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-xo-verified/30 text-[10px] font-bold text-xo-verified ring-1 ring-xo-action/40">AB</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-xo-verified">Recommended action</span>
            </div>
            <div className="mt-1.5 text-[17px] font-semibold leading-snug text-xo-text">{next}</div>
          </div>
          <div className="flex shrink-0 items-center gap-5">
            {impact != null && (
              <div className="text-right">
                <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-xo-faint">Estimated impact</div>
                <div className="font-mono text-xl font-bold text-xo-verified">{impact}</div>
              </div>
            )}
            {ctaEl}
          </div>
        </div>
      </div>

      {/* Supporting read */}
      <div className="grid grid-cols-1 divide-y divide-xo-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        {cells.map((c) => (
          <div key={c.label} className="p-4 lg:border-r lg:border-xo-line lg:last:border-r-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${c.tint}`}>{c.glyph}</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-xo-faint">{c.label}</span>
            </div>
            <div className="mt-2 text-[12.5px] leading-snug text-xo-text">{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BankerTake;

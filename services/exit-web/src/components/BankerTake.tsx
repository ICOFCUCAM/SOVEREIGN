import React from "react";
import { Link } from "react-router-dom";

// Banker's Take — the signature strip that makes every console page read
// like an AI investment bank, not passive software. It answers the five
// questions a sell-side banker would in the room:
//   1. What should I do next?
//   2. How much money is at stake?
//   3. What happens if I don't act?
//   4. Which buyer should I pursue?
//   5. How can ExitOS do this for me automatically?
// Every answer is page-supplied and engine-derived — no static copy.

export interface BankerCta {
  label: string;
  to?: string;
  onClick?: () => void;
}

export interface BankerTakeProps {
  next: React.ReactNode;        // recommended next move
  stake: React.ReactNode;       // money on the table
  inaction: React.ReactNode;    // cost of waiting
  buyer: React.ReactNode;       // which buyer to pursue
  automate: React.ReactNode;    // what ExitOS will do for you
  cta?: BankerCta;
}

interface CellSpec { glyph: string; tint: string; label: string; body: React.ReactNode; }

const BankerTake: React.FC<BankerTakeProps> = ({ next, stake, inaction, buyer, automate, cta }) => {
  const cells: CellSpec[] = [
    { glyph: "▸", tint: "text-deal-300",         label: "Do this next",     body: next },
    { glyph: "$", tint: "text-deal-300",         label: "At stake",         body: stake },
    { glyph: "!", tint: "text-red-300",          label: "If you wait",      body: inaction },
    { glyph: "◎", tint: "text-stage-engaged",    label: "Pursue",           body: buyer },
  ];

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-ink-800/60">
      <div className="flex items-center gap-2 border-b border-white/10 bg-deal-600/10 px-5 py-2.5">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-deal-600/30 text-[11px] font-bold text-deal-200 ring-1 ring-deal-400/40">AB</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-deal-300">Banker's Take</span>
        <span className="text-[11px] tracking-wide text-white/35">· your AI investment bank read this page for you</span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5">
        {cells.map((c, i) => (
          <div key={c.label} className={`p-5 ${i < cells.length ? "sm:border-b sm:border-white/10 lg:border-b-0" : ""} lg:border-r lg:border-white/10`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${c.tint}`}>{c.glyph}</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">{c.label}</span>
            </div>
            <div className="mt-2 text-[13px] leading-snug text-white/80">{c.body}</div>
          </div>
        ))}

        {/* Automate cell — the "ExitOS does it for you" close, accent-tinted. */}
        <div className="bg-deal-600/[0.07] p-5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-loi-300">⚡</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">ExitOS does it</span>
          </div>
          <div className="mt-2 text-[13px] leading-snug text-white/80">{automate}</div>
          {cta && (
            cta.to ? (
              <Link to={cta.to} className="mt-3 inline-flex items-center rounded-md bg-deal-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-deal-500">
                {cta.label} →
              </Link>
            ) : (
              <button onClick={cta.onClick} className="mt-3 inline-flex items-center rounded-md bg-deal-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-deal-500">
                {cta.label} →
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BankerTake;

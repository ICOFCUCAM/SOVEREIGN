import React from "react";
import { useNavigate } from "react-router-dom";
import { BUYERS } from "../lib/engines";

// CONVERSION LOGIC — the Listed Founder lead-generation engine. A free
// (Listed Founder) account is listed in the exchange, scored, and receives
// buyer interest — but cannot see buyer identities or engage until it
// upgrades. This gate surfaces the interest and the upgrade path. The count
// is the real qualified-buyer figure from the discovery engine, not a
// fabricated number.

const QUALIFIED = BUYERS.candidates.filter((c) => c.probability >= 0.5).length;

const BuyerInterestGate: React.FC = () => {
  const nav = useNavigate();
  if (QUALIFIED <= 0) return null;
  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-deal-400/40 bg-gradient-to-r from-deal-600/15 via-deal-600/5 to-transparent">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-deal-500/20 text-deal-300 ring-1 ring-deal-400/40" aria-hidden>🔒</span>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-deal-300">Buyer interest · Listed Founder</div>
            <div className="mt-1 font-serif text-lg font-bold text-white">
              You have <span className="tabular-nums text-deal-200">{QUALIFIED}</span> qualified buyer{QUALIFIED === 1 ? "" : "s"} interested in your company.
            </div>
            <div className="mt-0.5 text-[12px] text-white/55">
              Their identities, interest signals and NDA requests are locked. Upgrade to a mandate to see who they are and engage.
            </div>
          </div>
        </div>
        <button
          onClick={() => nav("/console/upgrade")}
          className="shrink-0 rounded-md bg-deal-500 px-5 py-2.5 text-[12.5px] font-semibold text-ink-950 transition hover:bg-deal-400"
        >
          Unlock buyers →
        </button>
      </div>
    </div>
  );
};

export default BuyerInterestGate;

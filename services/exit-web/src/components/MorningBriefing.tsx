import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../lib/ui";
import { morningBriefing, fmtUsdShort } from "../lib/briefing";

// The Chief Investment Banker's morning brief — proactive, on the founder's
// home. What changed in the market, who to engage, and the value at stake.

const MorningBriefing: React.FC = () => {
  const b = morningBriefing();
  return (
    <Card className="overflow-hidden border-deal-400/30 p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-deal-500/20 text-[12px] text-deal-300 ring-1 ring-deal-400/40" aria-hidden>◎</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Chief Investment Banker · Morning Briefing</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wide text-white/35">as of {b.asOf.slice(0, 10)}</span>
      </div>

      <div className="px-5 py-4">
        <p className="font-serif text-[15px] font-bold leading-snug text-white">{b.headline}</p>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr_auto]">
          {/* what moved */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">What moved</div>
            <ul className="mt-2 space-y-1.5">
              {b.movements.length ? b.movements.map((m) => (
                <li key={m.name} className="text-[12px]">
                  {m.buyerId ? <Link to={`/console/buyer/${m.buyerId}`} className="font-semibold text-white hover:text-deal-300">{m.name}</Link> : <span className="font-semibold text-white/85">{m.name}</span>}
                  <span className="text-white/50"> {m.kind} — {m.detail.replace(/^\+?\d+ indexed event\(s\) · /, "")}</span>
                </li>
              )) : <li className="text-[12px] text-white/45">Stable cycle — no new acquirer activity detected.</li>}
            </ul>
          </div>

          {/* recommended actions */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Recommended action · open outreach</div>
            <ul className="mt-2 space-y-1.5">
              {b.actions.map((a) => (
                <li key={a.buyerId} className="text-[12px]">
                  <Link to={`/console/buyer/${a.buyerId}`} className="font-semibold text-white hover:text-deal-300">{a.name}</Link>
                  <span className="font-mono text-deal-300"> {a.probabilityPct}%</span>
                  <span className="text-white/45"> · exp. {fmtUsdShort(a.expectedValueUsd)}</span>
                  <div className="text-[11px] leading-snug text-white/40">{a.why}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* value at stake */}
          <div className="lg:w-40 lg:border-l lg:border-white/10 lg:pl-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Value at stake</div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-deal-200">+{fmtUsdShort(b.valueAtStakeUsd)}</div>
            <div className="text-[10px] leading-snug text-white/35">strategic premium a competitive process captures over the financial baseline</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MorningBriefing;

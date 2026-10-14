import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../lib/ui";
import { morningBriefing, fmtUsdShort } from "../lib/briefing";

// The Chief Investment Banker's morning brief — proactive, on the founder's
// home. What changed in the market, who to engage, and the value at stake.

const MorningBriefing: React.FC<{ baselineUsd?: number; headlineMidUsd?: number; tokens?: readonly string[]; sector?: string }> = (props) => {
  const b = props.baselineUsd != null && props.headlineMidUsd != null
    ? morningBriefing({ baselineUsd: props.baselineUsd, headlineMidUsd: props.headlineMidUsd, tokens: props.tokens, ...(props.sector ? { sector: props.sector } : {}) })
    : morningBriefing();
  return (
    <Card className="overflow-hidden border-xo-verified/30 p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-xo-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-xo-verified/20 text-[12px] text-xo-verified ring-1 ring-xo-action/40" aria-hidden>◎</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-xo-verified">Chief Investment Banker · Morning Briefing</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wide text-xo-faint">as of {b.asOf.slice(0, 10)}</span>
      </div>

      <div className="px-5 py-4">
        <p className="font-serif text-[15px] font-bold leading-snug text-xo-text">{b.headline}</p>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr_auto]">
          {/* what moved */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-xo-faint">What moved</div>
            <ul className="mt-2 space-y-1.5">
              {b.movements.length ? b.movements.map((m) => (
                <li key={m.name} className="text-[12px]">
                  {m.buyerId ? <Link to={`/console/buyer/${m.buyerId}`} className="font-semibold text-xo-text hover:text-xo-verified">{m.name}</Link> : <span className="font-semibold text-xo-text">{m.name}</span>}
                  <span className="text-xo-faint"> {m.kind} — {m.detail.replace(/^\+?\d+ indexed event\(s\) · /, "")}</span>
                </li>
              )) : <li className="text-[12px] text-xo-faint">Stable cycle — no new acquirer activity detected.</li>}
            </ul>
          </div>

          {/* recommended actions */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-xo-faint">Recommended action · open outreach</div>
            <ul className="mt-2 space-y-1.5">
              {b.actions.map((a) => (
                <li key={a.buyerId} className="text-[12px]">
                  <Link to={`/console/buyer/${a.buyerId}`} className="font-semibold text-xo-text hover:text-xo-verified">{a.name}</Link>
                  <span className="font-mono text-xo-verified"> {a.probabilityPct}%</span>
                  <span className="text-xo-faint"> · exp. {fmtUsdShort(a.expectedValueUsd)}</span>
                  <div className="text-[11px] leading-snug text-xo-faint">{a.why}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* value at stake */}
          <div className="lg:w-40 lg:border-l lg:border-xo-line lg:pl-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-xo-faint">Value at stake</div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-xo-verified">+{fmtUsdShort(b.valueAtStakeUsd)}</div>
            <div className="text-[10px] leading-snug text-xo-faint">strategic premium a competitive process captures over the financial baseline</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MorningBriefing;

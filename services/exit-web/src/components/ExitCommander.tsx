import React from "react";
import { Link } from "react-router-dom";
import { fmtMoney } from "../lib/ui";

// AI Exit Commander — the Dashboard hero. Instead of modules to browse, the
// founder reads a short brief from the AI and acts: what the company is worth,
// how much more it could be worth, which buyers are circling, and the one move
// to make now. One Execute dispatches the autonomous agents. Minutes approving,
// not hours inside screens.

export interface ExitCommanderProps {
  founderName: string;
  companyName: string;
  valuationToday: number;
  valuationPotential: number;
  fixCount: number;
  horizonMonths: number;
  strategicBuyersActive: number;
  recommendedAction: string;
  expectedIncreaseUsd: number;
  confidencePct: number;
  onExecute: () => void;
}

const Line: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[15px] leading-relaxed text-white/85">{children}</p>
);

const ExitCommander: React.FC<ExitCommanderProps> = ({
  founderName, companyName, valuationToday, valuationPotential, fixCount,
  horizonMonths, strategicBuyersActive, recommendedAction, expectedIncreaseUsd, confidencePct, onExecute,
}) => {
  const name = founderName.charAt(0).toUpperCase() + founderName.slice(1);
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-deal-500/30 bg-gradient-to-br from-deal-600/12 via-ink-800/60 to-ink-800/60">
      <div className="flex items-center gap-2 border-b border-white/10 px-6 py-3">
        <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-deal-600/30 text-[11px] font-bold text-deal-200 ring-1 ring-deal-400/40">
          AI
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-800 bg-deal-400" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-deal-300">AI Exit Commander</span>
        <span className="text-[11px] text-white/35">· live</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3 border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
          <Line>
            {name}, based on your metrics we estimate <span className="font-semibold text-white">{companyName}</span> is worth{" "}
            <span className="font-mono font-bold text-deal-300">{fmtMoney(valuationToday)}</span> today.
          </Line>
          <Line>
            <Link to="/console/readiness" className="font-semibold text-white underline decoration-white/20 underline-offset-2 hover:decoration-deal-400">{fixCount} actions</Link>{" "}
            can increase that to <span className="font-mono font-bold text-deal-300">{fmtMoney(valuationPotential)}</span> within {horizonMonths} months.
          </Line>
          <Line>
            {strategicBuyersActive > 0
              ? <><span className="font-semibold text-white">{strategicBuyersActive} strategic buyer{strategicBuyersActive === 1 ? "" : "s"}</span> {strategicBuyersActive === 1 ? "has" : "have"} entered acquisition mode.</>
              : <>No strategic buyers are in acquisition mode yet — outreach will surface them.</>}
            {" "}
            <Link to="/console/intelligence" className="text-[12px] font-semibold uppercase tracking-wide text-deal-400 hover:text-deal-300">View →</Link>
          </Line>
        </div>

        <div className="flex flex-col justify-center p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Recommended next action</div>
          <p className="mt-1.5 text-[15px] font-semibold leading-snug text-white">{recommendedAction}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Expected valuation increase</div>
              <div className="font-mono text-base font-bold text-deal-300">+{fmtMoney(expectedIncreaseUsd)}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Confidence</div>
              <div className="font-mono text-base font-bold text-white">{confidencePct}%</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button onClick={onExecute} className="inline-flex items-center gap-2 rounded-md bg-deal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-deal-700/30 transition hover:bg-deal-500">
              Execute →
            </button>
            <Link to="/console/autopilot" className="text-[12px] font-semibold uppercase tracking-wide text-white/50 hover:text-white">See the plan</Link>
          </div>
          <p className="mt-3 text-[11px] text-white/40">One click dispatches the agents — valuation, outreach and diligence start working.</p>
        </div>
      </div>
    </div>
  );
};

export default ExitCommander;

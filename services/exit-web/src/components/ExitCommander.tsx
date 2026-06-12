import React from "react";
import { Link } from "react-router-dom";
import { fmtMoney } from "../lib/ui";

// MORNING BRIEFING — the heart of the console. Not a chatbot card: a deal-desk
// memo from the Chief Investment Banker, set like the documents the platform
// exports (◎ masthead, labelled register rows, one recommended action with an
// Execute control). Every figure is engine-derived.

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
  /** highest-intent buyer + most-likely premium payer, from the intelligence pipeline */
  highestIntentName?: string;
  premiumPayerName?: string;
  onExecute: () => void;
}

const Row: React.FC<{ k: string; v: React.ReactNode; to?: string }> = ({ k, v, to }) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-white/5 py-2 last:border-0">
    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{k}</span>
    <span className="text-right text-[13.5px] font-medium text-white/90">
      {to ? <Link to={to} className="hover:text-deal-300">{v}</Link> : v}
    </span>
  </div>
);

const today = (): string =>
  new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

const ExitCommander: React.FC<ExitCommanderProps> = ({
  companyName, valuationToday, valuationPotential, fixCount,
  horizonMonths, strategicBuyersActive, recommendedAction, expectedIncreaseUsd, confidencePct,
  highestIntentName, premiumPayerName, onExecute,
}) => {
  return (
    <div className="mb-8 overflow-hidden rounded-lg border border-white/10" style={{ background: "linear-gradient(180deg,#08203B 0%,#06182E 100%)" }}>
      {/* memo masthead — the document identity, inside the product */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/25 px-6 py-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[13px] text-deal-300">◎</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white">Morning Briefing</span>
          <span className="hidden text-[10px] uppercase tracking-[0.14em] text-white/35 sm:inline">Chief Investment Banker · {companyName}</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">{today()}</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
        {/* the register — a memo, not a chat */}
        <div className="border-b border-white/10 px-6 py-4 lg:border-b-0 lg:border-r">
          <Row k="Enterprise value" v={<span className="font-mono font-bold tabular-nums text-white">{fmtMoney(valuationToday)}</span>} />
          <Row k="Expected realized value" v={<span className="font-mono font-bold tabular-nums text-deal-300">{fmtMoney(valuationPotential)}</span>} />
          <Row k="Value actions open" to="/console/readiness"
            v={<>{fixCount} priced fixes · ~{horizonMonths} months</>} />
          <Row k="Buyer activity" to="/console/intelligence"
            v={strategicBuyersActive > 0
              ? <><span className="font-semibold text-white">{strategicBuyersActive} strategic acquirer{strategicBuyersActive === 1 ? "" : "s"}</span> in market</>
              : <>No strategic acquirer in market yet</>} />
          {highestIntentName && <Row k="Highest intent" v={highestIntentName} to="/console/intelligence" />}
          {premiumPayerName && <Row k="Premium probability" v={premiumPayerName} to="/console/intelligence" />}
        </div>

        {/* recommended action */}
        <div className="flex flex-col justify-center px-6 py-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-300">Recommended action</div>
          <p className="mt-1.5 text-[15px] font-semibold leading-snug text-white">{recommendedAction}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Expected value increase</div>
              <div className="font-mono text-base font-bold tabular-nums text-deal-300">+{fmtMoney(expectedIncreaseUsd)}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Confidence</div>
              <div className="font-mono text-base font-bold tabular-nums text-white">{confidencePct}%</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button onClick={onExecute} className="inline-flex items-center gap-2 rounded-md bg-deal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-deal-500">
              Execute →
            </button>
            <Link to="/console/autopilot" className="text-[12px] font-semibold uppercase tracking-wide text-white/50 hover:text-white">See the plan</Link>
          </div>
          <p className="mt-3 text-[11px] text-white/40">One instruction dispatches the agents — valuation, outreach and diligence start working.</p>
        </div>
      </div>
    </div>
  );
};

export default ExitCommander;

import React from "react";
import { fmtMoney } from "../lib/ui";

// FOUNDER LIQUIDITY BOARD — one continuous instrument panel, not four
// floating cards. The five readouts that define a founder's position are
// mounted on a single exchange board with hairline column rules, the same
// construction as the homepage acquisition exchange. Every value is
// engine-derived.

export interface CommandTilesProps {
  companyValue: number;
  potential: number;
  exitProbability: number;     // 0..100
  demandLabel: "High" | "Medium" | "Low";
  buyersMatching: number;
  timeToExitMonths: string;    // formatted, e.g. "4.2"
}

const DEMAND_COLOR: Record<string, string> = { High: "#34d399", Medium: "#fbbf24", Low: "#f87171" };

const Readout: React.FC<{ label: string; sub: React.ReactNode; children: React.ReactNode }> = ({ label, sub, children }) => (
  <div className="px-5 py-4" style={{ background: "rgba(6,24,46,.92)" }}>
    <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">{label}</div>
    <div className="mt-1.5">{children}</div>
    <div className="mt-1 text-[10.5px] leading-snug text-white/40">{sub}</div>
  </div>
);

const CommandTiles: React.FC<CommandTilesProps> = ({
  companyValue, potential, exitProbability, demandLabel, buyersMatching, timeToExitMonths,
}) => {
  const probColor = exitProbability >= 70 ? "#34d399" : exitProbability >= 50 ? "#fbbf24" : "#f87171";
  const demandColor = DEMAND_COLOR[demandLabel];
  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-white/10" style={{ background: "linear-gradient(180deg,#08203B 0%,#06182E 100%)" }}>
      {/* board rail */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/25 px-5 py-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">Founder Liquidity Board</span>
        <span className="flex items-center gap-1.5">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-300">Live</span>
        </span>
      </div>
      {/* continuous instrument row */}
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5" style={{ background: "rgba(255,255,255,.07)" }}>
        <Readout label="Enterprise Value" sub={<>strategic mid · engine-priced</>}>
          <div className="font-mono text-[26px] font-bold leading-none tabular-nums text-white">{fmtMoney(companyValue)}</div>
        </Readout>
        <Readout label="Expected Value" sub={<>after the priced readiness fixes</>}>
          <div className="font-mono text-[26px] font-bold leading-none tabular-nums text-deal-300">{fmtMoney(potential)}</div>
        </Readout>
        <Readout label="Active Buyers" sub={<>demand <span style={{ color: demandColor }}>{demandLabel.toLowerCase()}</span> · mandates matching</>}>
          <div className="font-mono text-[26px] font-bold leading-none tabular-nums text-white">{buyersMatching}</div>
        </Readout>
        <Readout label="Close Probability" sub={<>likelihood of a completed transaction</>}>
          <div className="font-mono text-[26px] font-bold leading-none tabular-nums" style={{ color: probColor }}>{exitProbability}%</div>
        </Readout>
        <Readout label="Time to Liquidity" sub={<>once a buyer is engaged</>}>
          <div className="font-mono text-[26px] font-bold leading-none tabular-nums text-white">{timeToExitMonths}<span className="ml-1 text-[15px] text-white/50">mo</span></div>
        </Readout>
      </div>
    </div>
  );
};

export default CommandTiles;

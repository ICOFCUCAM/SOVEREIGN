import React from "react";
import { fmtMoney } from "../lib/ui";

// Founder Command Center — the four numbers that define a founder's position
// at a glance: what the company is worth (and could be), the probability of
// actually closing, how hard buyers are pulling, and how far away the exit is.
// Command, not statistics. Every value is engine-derived.

export interface CommandTilesProps {
  companyValue: number;
  potential: number;
  exitProbability: number;     // 0..100
  demandLabel: "High" | "Medium" | "Low";
  buyersMatching: number;
  timeToExitMonths: string;    // formatted, e.g. "4.2"
}

const DEMAND_COLOR: Record<string, string> = { High: "#34d399", Medium: "#fbbf24", Low: "#f87171" };

const Tile: React.FC<{ label: string; accent: string; children: React.ReactNode; sub: React.ReactNode }> = ({ label, accent, children, sub }) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-800/60 p-5">
    <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />
    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">{label}</div>
    <div className="mt-2">{children}</div>
    <div className="mt-1.5 text-[11px] text-white/45">{sub}</div>
  </div>
);

const CommandTiles: React.FC<CommandTilesProps> = ({
  companyValue, potential, exitProbability, demandLabel, buyersMatching, timeToExitMonths,
}) => {
  const probColor = exitProbability >= 70 ? "#34d399" : exitProbability >= 50 ? "#fbbf24" : "#f87171";
  const demandColor = DEMAND_COLOR[demandLabel];
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Tile label="Company value" accent="#34d399"
        sub={<>↑ Potential <span className="font-mono text-deal-300">{fmtMoney(potential)}</span></>}>
        <div className="font-mono text-3xl font-bold text-white">{fmtMoney(companyValue)}</div>
      </Tile>

      <Tile label="Exit probability" accent={probColor}
        sub="likelihood of a close">
        <div className="font-mono text-3xl font-bold" style={{ color: probColor }}>{exitProbability}%</div>
      </Tile>

      <Tile label="Buyer demand" accent={demandColor}
        sub={<><span className="text-white/70">{buyersMatching}</span> buyers actively matching</>}>
        <div className="text-3xl font-bold" style={{ color: demandColor }}>{demandLabel}</div>
      </Tile>

      <Tile label="Time to exit" accent="#60a5fa"
        sub="estimated to close">
        <div className="font-mono text-3xl font-bold text-white">{timeToExitMonths}<span className="ml-1 text-lg text-white/50">mo</span></div>
      </Tile>
    </div>
  );
};

export default CommandTiles;

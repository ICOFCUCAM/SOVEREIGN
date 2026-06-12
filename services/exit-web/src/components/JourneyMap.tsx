import React from "react";
import { Link } from "react-router-dom";

// Mandate Lifecycle — the institutional arc of a liquidity event, indexed the
// way a deal desk runs it: position the asset, monitor the window, go to
// market, solicit interest, negotiate, execute, transition the proceeds.
// The founder always knows which phase the mandate is in.

interface Stage { key: string; index: string; label: string; to?: string; }

const STAGES: readonly Stage[] = [
  { key: "build",     index: "01", label: "Position" },
  { key: "monitor",   index: "02", label: "Monitor", to: "/console/readiness" },
  { key: "find",      index: "03", label: "Market", to: "/console/intelligence" },
  { key: "run",       index: "04", label: "Solicit", to: "/console/banker" },
  { key: "negotiate", index: "05", label: "Negotiate", to: "/console/negotiator" },
  { key: "close",     index: "06", label: "Execute", to: "/console/closing" },
  { key: "wealth",    index: "07", label: "Transition", to: "/console/wealth" },
];

const JourneyMap: React.FC<{ current?: string }> = ({ current = "monitor" }) => {
  const idx = Math.max(0, STAGES.findIndex((s) => s.key === current));

  return (
    <div className="mb-8 rounded-lg border border-white/10 bg-ink-800/60 px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">Mandate lifecycle</div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-deal-400" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-deal-300">Phase {STAGES[idx]?.index} · {STAGES[idx]?.label}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center">
        {STAGES.map((s, i) => {
          const state = i < idx ? "done" : i === idx ? "current" : "future";
          const node = (
            <div className="flex flex-col items-center gap-1.5">
              <span className={`font-mono text-[10px] font-bold tracking-wide ${
                state === "done" ? "text-deal-400" : state === "current" ? "text-deal-300" : "text-white/30"}`}>
                {state === "done" ? "✓" : s.index}
              </span>
              <span className={`whitespace-nowrap text-[11px] font-semibold ${
                state === "current" ? "text-white" : state === "done" ? "text-white/70" : "text-white/35"}`}>{s.label}</span>
              <span className={`h-0.5 w-8 rounded-full ${state === "current" ? "bg-deal-400" : "bg-transparent"}`} />
            </div>
          );
          return (
            <React.Fragment key={s.key}>
              {s.to ? <Link to={s.to} className="transition hover:opacity-80">{node}</Link> : node}
              {i < STAGES.length - 1 && (
                <div className="mx-1.5 mb-4 h-px flex-1" style={{ background: i < idx ? "rgba(52,211,153,.6)" : "rgba(255,255,255,0.08)" }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default JourneyMap;

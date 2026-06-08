import React from "react";
import { Link } from "react-router-dom";

// Exit Journey — the lifecycle ExitOS spans, end to end. Most M&A tools start
// at "Run Process"; ExitOS starts at "Monitor" (decide *when* to sell) and
// runs through "Wealth Transition" (what to do with the proceeds). The strip
// orients the founder on where they are in the arc of a liquidity event.

interface Stage { key: string; label: string; to?: string; }

const STAGES: readonly Stage[] = [
  { key: "build",     label: "Build" },
  { key: "monitor",   label: "Monitor", to: "/console/readiness" },
  { key: "find",      label: "Find Buyers", to: "/console/intelligence" },
  { key: "run",       label: "Run Process", to: "/console/data-room" },
  { key: "negotiate", label: "Negotiate", to: "/console/negotiator" },
  { key: "close",     label: "Close", to: "/console/closing" },
  { key: "wealth",    label: "Wealth Transition", to: "/console/wealth" },
];

const JourneyMap: React.FC<{ current?: string }> = ({ current = "monitor" }) => {
  const idx = Math.max(0, STAGES.findIndex((s) => s.key === current));

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-ink-800/60 p-5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">The exit journey</div>
        <div className="text-[10px] uppercase tracking-wide text-deal-300">Operating system for founder liquidity</div>
      </div>
      <div className="mt-4 flex items-center">
        {STAGES.map((s, i) => {
          const state = i < idx ? "done" : i === idx ? "current" : "future";
          const dot = state === "done" ? "bg-deal-500 text-white" : state === "current" ? "bg-deal-400 text-ink-900 ring-4 ring-deal-500/20" : "bg-white/10 text-white/40";
          const labelCls = state === "future" ? "text-white/40" : "text-white";
          const node = (
            <div className="flex flex-col items-center gap-1.5">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${dot}`}>
                {state === "done" ? "✓" : i + 1}
              </span>
              <span className={`whitespace-nowrap text-[11px] font-medium ${labelCls}`}>{s.label}</span>
            </div>
          );
          return (
            <React.Fragment key={s.key}>
              {s.to ? <Link to={s.to} className="transition hover:opacity-80">{node}</Link> : node}
              {i < STAGES.length - 1 && (
                <div className="mx-1 mb-5 h-0.5 flex-1 rounded-full" style={{ background: i < idx ? "#10b981" : "rgba(255,255,255,0.1)" }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default JourneyMap;

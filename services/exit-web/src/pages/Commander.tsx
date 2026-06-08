import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, SectionHeader } from "../lib/ui";
import CommandTiles from "../components/CommandTiles";
import ExitCommander from "../components/ExitCommander";
import { commanderMetrics } from "../lib/commander-metrics";
import { SAMPLE_COMPANY } from "../lib/profile";
import { useAuth } from "../lib/auth";

// Exit Commander — not another dashboard. The AI Chief Investment Banker:
// the founder opens it, reads one brief, and presses Execute. The system then
// runs the whole front of the process — buyer list, outreach, NDA, data room,
// pipeline — via the autonomous agents.

const AUTO_STEPS = [
  { label: "Create buyer list",   detail: "Rank strategic + financial acquirers by fit and outcome" },
  { label: "Launch outreach",     detail: "Issue the anonymized teaser to the shortlist" },
  { label: "Prepare NDA",         detail: "Pre-issue bilateral NDAs to engaged buyers" },
  { label: "Prepare data room",   detail: "Provision the rooms and gate access on signature" },
  { label: "Open pipeline",       detail: "Create the marketplace listing and start tracking" },
];

const Commander: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const m = commanderMetrics();

  return (
    <div>
      <SectionHeader
        kicker="Exit Commander · AI Chief Investment Banker"
        title="Exit Commander"
        description="One screen. One brief. One decision. Your AI chief investment banker reads the company and the market, then runs the process for you on a single click."
      />

      <CommandTiles
        companyValue={m.companyValue}
        potential={m.potential}
        exitProbability={m.exitProbability}
        demandLabel={m.demandLabel}
        buyersMatching={m.activeBuyers}
        timeToExitMonths={m.timeToExitMonths}
      />

      <ExitCommander
        founderName={session?.founderId ?? "founder"}
        companyName={SAMPLE_COMPANY.name}
        valuationToday={m.companyValue}
        valuationPotential={m.potential}
        fixCount={m.fixCount}
        horizonMonths={8}
        strategicBuyersActive={m.strategicActive}
        recommendedAction={m.recommendedAction}
        expectedIncreaseUsd={m.expectedIncreaseUsd}
        confidencePct={m.confidencePct}
        onExecute={() => navigate("/console/autopilot")}
      />

      {/* What Execute does — the auto-sequence */}
      <Card className="p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">When you press Execute</div>
        <p className="mt-1 text-[12px] text-white/45">ExitOS dispatches the agents and runs the front of the process automatically — you only approve.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          {AUTO_STEPS.map((s, i) => (
            <div key={s.label} className="rounded-lg border border-white/10 bg-ink-900/40 p-3.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-deal-600/25 font-mono text-[11px] font-bold text-deal-200 ring-1 ring-deal-400/40">{i + 1}</div>
              <div className="mt-2 text-[12.5px] font-semibold text-white">{s.label}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-white/45">{s.detail}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Commander;

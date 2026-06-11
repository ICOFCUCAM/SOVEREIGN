import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionHeader } from "../lib/ui";
import CommandTiles from "../components/CommandTiles";
import ExitCommander from "../components/ExitCommander";
import {
  BuyerMovement, DealTemperature, ValueGap, AcquisitionRadar,
  ExpectedAutomation, ExitProbabilityBreakdown, BankerFeed,
} from "../components/CommanderBlocks";
import { commanderMetrics } from "../lib/commander-metrics";
import { SAMPLE_COMPANY } from "../lib/profile";
import { useAuth } from "../lib/auth";

// Chief Investment Banker — the command surface. The founder opens it, reads
// the value cards and the banker's brief, and presses Execute. Around the
// brief sit the panels a real bank desk would put in front of a seller: who's
// moving, how hot the deal is, the value gap, the buyer universe, the
// probability breakdown, and a live market feed. Not a reporting dashboard —
// a workflow toward an outcome.

const Commander: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const m = commanderMetrics();

  return (
    <div>
      <SectionHeader
        kicker="Powered by ExitOS Intelligence"
        title="Chief Investment Banker"
        description="One screen. One brief. One decision. Your transaction desk reads the company and the market, tells you the single best next move, and runs the process on a click."
      />

      {/* Value cards */}
      <CommandTiles
        companyValue={m.companyValue}
        potential={m.potential}
        exitProbability={m.exitProbability}
        demandLabel={m.demandLabel}
        buyersMatching={m.activeBuyers}
        timeToExitMonths={m.timeToExitMonths}
      />

      {/* Block 1 · who's moving on the company, right under the value cards */}
      <div className="mb-6"><BuyerMovement /></div>

      {/* Blocks 2 + 3 · how hot the deal is, and the value gap */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <DealTemperature />
        <ValueGap />
      </div>

      {/* Block 6 · why the probability is what it is */}
      <div className="mb-6"><ExitProbabilityBreakdown /></div>

      {/* Block 5 · what Execute does — placed right before the brief + button */}
      <div className="mb-6"><ExpectedAutomation /></div>

      {/* The banker's brief + Execute */}
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

      {/* Blocks 4 + 7 · the buyer universe and the live banker feed */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AcquisitionRadar />
        <BankerFeed />
      </div>
    </div>
  );
};

export default Commander;

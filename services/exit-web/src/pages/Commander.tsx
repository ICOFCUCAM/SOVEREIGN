import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Panel, Frame, CommandHeader, MarketTape } from "../lib/workstation";
import { buildMarketTape } from "../lib/market-tape";
import { AcquisitionReactor, BuyerNetworkReactor, ReactorTelemetry } from "../components/Reactor";
import { fmtMoney } from "../lib/ui";
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
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Chief Investment Banker"
        title={SAMPLE_COMPANY.name}
        tag="Transaction desk"
        status={m.demandLabel}
        meta={[{ k: "HORIZON", v: `${m.timeToExitMonths}mo` }, { k: "CONF", v: `${m.confidencePct}%` }]}
        metrics={[
          { k: "Company value", v: fmtMoney(m.companyValue), accent: true, sub: "strategic mid" },
          { k: "Potential", v: fmtMoney(m.potential), accent: true, sub: "after fixes" },
          { k: "Exit probability", v: `${m.exitProbability}%`, sub: m.demandLabel },
          { k: "Active buyers", v: String(m.activeBuyers), sub: "matching mandate" },
          { k: "Time to exit", v: `${m.timeToExitMonths}mo`, sub: "expected" },
        ]}
      />

      <MarketTape items={tape} />

      {/* market reactors — the desk's awareness of the live market */}
      <Frame>
        <Panel title="Acquisition reactor" className="lg:col-span-4" foot="Sector acquisition volume across the network.">
          <AcquisitionReactor height={196} />
        </Panel>
        <Panel title="Buyer network reactor" className="lg:col-span-4" foot="Active acquirers by 12-month cadence.">
          <BuyerNetworkReactor height={196} />
        </Panel>
        <Panel title="Live telemetry" className="lg:col-span-4" foot="Real extrema from the registry + sector indexes.">
          <ReactorTelemetry />
        </Panel>
      </Frame>

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

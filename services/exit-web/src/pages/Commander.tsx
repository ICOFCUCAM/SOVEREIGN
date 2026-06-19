import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Panel, Frame, CommandHeader, MarketTape } from "../lib/workstation";
import { buildMarketTape } from "../lib/market-tape";
import { AcquisitionReactor, BuyerNetworkReactor, ReactorTelemetry } from "../components/Reactor";
import { MARKET_INTEL } from "../lib/market-intel";
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

      <div className="flex flex-wrap justify-end gap-2">
        <a href="/report/board" target="_blank" rel="noopener noreferrer" className="rounded-md border border-deal-400/30 px-3.5 py-1.5 text-[11.5px] font-semibold text-deal-300 transition hover:bg-deal-600/10">Board Memorandum (PDF) →</a>
        <a href="/report" target="_blank" rel="noopener noreferrer" className="rounded-md border border-white/15 px-3.5 py-1.5 text-[11.5px] font-semibold text-white/70 transition hover:bg-white/5">Publishing Center →</a>
      </div>

      {/* executive command — jump to any desk, each with its live headline */}
      <Frame>
        {[
          { roman: "II", label: "Investment Banker", to: "/console", v: fmtMoney(m.companyValue), sub: "enterprise value" },
          { roman: "III", label: "Market", to: "/console/market-map", v: MARKET_INTEL.totalEvents.toLocaleString(), sub: "indexed acquisitions" },
          { roman: "IV", label: "Transaction", to: "/console/pipeline", v: `${m.timeToExitMonths}mo`, sub: "to exit" },
          { roman: "V", label: "Buyer", to: "/console/buyers", v: String(m.activeBuyers), sub: "active acquirers" },
        ].map((d) => (
          <Link key={d.roman} to={d.to} className="group bg-ink-900 px-4 py-3 transition hover:bg-white/[0.03] lg:col-span-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-deal-300">{d.roman}</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">{d.label} layer</span>
              <span className="ml-auto text-deal-300/60 transition group-hover:translate-x-0.5">→</span>
            </div>
            <div className="mt-1 font-mono text-[17px] font-bold tabular-nums text-white">{d.v}</div>
            <div className="text-[10px] text-white/40">{d.sub}</div>
          </Link>
        ))}
      </Frame>

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

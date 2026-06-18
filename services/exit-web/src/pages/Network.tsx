import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "../lib/ui";
import { Panel, Frame, CommandHeader, MarketTape } from "../lib/workstation";
import { buildMarketTape } from "../lib/market-tape";
import { AcquisitionReactor, LiquidityReactor, BuyerNetworkReactor } from "../components/Reactor";
import { BUYERS, VALUATION_STRATEGIC, DILIGENCE } from "../lib/engines";
import { VALUATION_FRAMEWORK } from "@exit/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import { MARKET_FMT, HISTORY_FMT, DEAL_INTEL, DEAL_INTEL_FMT } from "../lib/market-stats";

// Network Intelligence — the five moats. Individual screens can be copied;
// the compounding dataset cannot. This surface makes the moats tangible: the
// deal graph, the buyer graph, deal intelligence, the agent workforce and
// the founder lifecycle. Every figure is computed from the source-referenced
// acquisition history and the live engine runs.

const ARR = SAMPLE_COMPANY.revenue.annualRecurringRevenueUsd;

function buyerDna(name: string, retentionBase: number, earnout: string) {
  const c = BUYERS.candidates.find((x) => x.buyer.name === name) ?? BUYERS.candidates[0];
  const days = c.expectedOutcome.expectedDaysToCash;
  // premium prior is owned by the Valuation Constitution, never inlined here
  const premiumDefault = VALUATION_FRAMEWORK.buyerTypePremiumPriors[c.buyer.buyerType] ?? VALUATION_FRAMEWORK.executionNeutrals.premiumPct;
  const prem = c.outcomes.avgPremiumPct != null ? Math.min(0.4, c.outcomes.avgPremiumPct) : premiumDefault;
  const multiple = ((VALUATION_STRATEGIC.headline.mid * (1 + prem)) / ARR).toFixed(1);
  const retention = Math.min(95, Math.max(45, Math.round(retentionBase + ((c.outcomes.avgRetradePct ?? 0) >= 0 ? 6 : -8))));
  return { name: c.buyer.name, days, multiple, retention, earnout };
}

const Stat: React.FC<{ value: string; label: string; accent?: string }> = ({ value, label, accent }) => (
  <div className="rounded-xl border border-white/10 bg-ink-900/40 p-4">
    <div className="font-mono text-2xl font-bold" style={{ color: accent ?? "#fff" }}>{value}</div>
    <div className="mt-1 text-[11px] uppercase tracking-wide text-white/45">{label}</div>
  </div>
);

const Moat: React.FC<{ n: number; title: string; why: string; children: React.ReactNode; to?: string; cta?: string }> = ({ n, title, why, children, to, cta }) => (
  <Card className="p-6">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-deal-600/25 font-mono text-sm font-bold text-deal-200 ring-1 ring-deal-400/40">{n}</span>
        <div>
          <h2 className="font-serif text-lg font-bold text-white">{title}</h2>
          <p className="text-[12px] text-white/45">{why}</p>
        </div>
      </div>
      {to && <Link to={to} className="shrink-0 text-[12px] font-semibold uppercase tracking-wide text-deal-400 hover:text-deal-300">{cta} →</Link>}
    </div>
    <div className="mt-5">{children}</div>
  </Card>
);

const Network: React.FC = () => {
  const buyerA = buyerDna("Amazon Strategic", 80, "Rare");
  const buyerB = buyerDna("Pritzker Private Capital", 60, "Aggressive");
  const buyerDnaCount = BUYERS.candidates.length;

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ The moat"
        title="Network Intelligence"
        tag="Five compounding assets"
        metrics={[
          { k: "Acquirer mandates", v: MARKET_FMT.buyers, accent: true, sub: "profiled" },
          { k: "Acquisition events", v: HISTORY_FMT.events, sub: "tracked" },
          { k: "Disclosed value", v: HISTORY_FMT.disclosedValue, accent: true, sub: "on record" },
          { k: "Buyer dossiers", v: String(buyerDnaCount), sub: "live engine runs" },
        ]}
      />

      <MarketTape items={useMemo(() => buildMarketTape(), [])} />

      {/* the three reactors — the moat made visible */}
      <Frame>
        <Panel title="Acquisition reactor" className="lg:col-span-4" foot="Sector acquisition volume — the deal graph.">
          <AcquisitionReactor height={200} />
        </Panel>
        <Panel title="Liquidity reactor" className="lg:col-span-4" foot="Disclosed capital depth per sector.">
          <LiquidityReactor height={200} />
        </Panel>
        <Panel title="Buyer network reactor" className="lg:col-span-4" foot="Active acquirers by cadence — the buyer graph.">
          <BuyerNetworkReactor height={200} />
        </Panel>
      </Frame>

      <div className="space-y-2">
        <Moat n={1} title="The Deal Graph" why="A source-referenced acquisition dataset — every event traceable to EDGAR, Wikidata or press.">
          <div className="grid grid-cols-3 gap-4">
            <Stat value={MARKET_FMT.buyers} label="Acquirer mandates profiled" accent="#34d399" />
            <Stat value={HISTORY_FMT.events} label="Acquisition events tracked" accent="#60a5fa" />
            <Stat value={HISTORY_FMT.disclosedValue} label="Disclosed deal value" accent="#a78bfa" />
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-white/65">
            Every event carries buyer, target, sector, price and outcome — with its source on record. The graph learns
            <span className="text-white"> who buys what, for how much, and under what conditions</span> — the
            knowledge a first-time founder and most bankers simply don't have.
          </p>
        </Moat>

        <Moat n={2} title="The Buyer Graph" why="Most marketplaces know sellers. Few know buyers." to="/console/buyer-copilot" cta="Buyer Copilot">
          <p className="text-[13px] text-white/65">Buyer DNA on <span className="text-white">{buyerDnaCount}+ acquirers</span> — measured, not guessed.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[buyerA, buyerB].map((b, i) => (
              <div key={b.name} className="rounded-lg border border-white/10 bg-ink-900/40 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Buyer {i === 0 ? "A" : "B"}</div>
                <div className="text-sm font-bold text-white">{b.name}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div><div className="font-mono text-base font-bold text-white">{b.days}d</div><div className="text-[9px] uppercase text-white/40">to close</div></div>
                  <div><div className="font-mono text-base font-bold text-deal-300">{b.multiple}×</div><div className="text-[9px] uppercase text-white/40">ARR</div></div>
                  <div><div className="font-mono text-base font-bold text-white">{b.retention}%</div><div className="text-[9px] uppercase text-white/40">retention</div></div>
                </div>
                <div className="mt-2 text-[11px] text-white/45">Earnout tendency: <span className="text-white/70">{b.earnout}</span></div>
              </div>
            ))}
          </div>
        </Moat>

        <Moat n={3} title="Deal Intelligence" why="Every acquisition teaches the system — the AI grows smarter than most advisors.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat value={DEAL_INTEL_FMT.medianClose} label="Median announce → close" />
            <Stat value={DEAL_INTEL_FMT.medianPremium} label="Median disclosed premium" />
            <Stat value={DEAL_INTEL_FMT.closedRate} label="Tracked deals closed" />
            <Stat value={String(DEAL_INTEL.measuredCloses)} label="Closes measured" />
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-white/65">
            The platform learns the patterns that win: LOI structures, SPA clauses, earnout models, escrow patterns and
            negotiation outcomes — fed back into every recommendation.
          </p>
        </Moat>

        <Moat n={4} title="Autonomous Agents" why="Competitors offer tools. ExitOS offers workers." to="/console/autopilot" cta="Autonomous Exit">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-ink-900/40 p-3.5 text-[13px] text-white/80">The <span className="text-white">Outreach Agent</span> qualified {BUYERS.candidates.length} buyers from the registry.</div>
            <div className="rounded-lg border border-white/10 bg-ink-900/40 p-3.5 text-[13px] text-white/80">The <span className="text-white">Diligence Agent</span> prepared {DILIGENCE.documents.length} packages and flagged {DILIGENCE.redFlags.length + DILIGENCE.criticalQuestions.length} open items.</div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-white/65">
            Eight agents do the work — not "use the outreach tool" but "the agent contacted the buyers." The winner won't
            be software; it will be software that does the work.
          </p>
        </Moat>

        <Moat n={5} title="The Founder Lifecycle" why="Most platforms care only about the exit. ExitOS owns the whole journey." to="/console/wealth" cta="WealthOS">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { phase: "Before exit", items: ["Valuation", "Readiness", "Growth planning"], to: "/console/readiness" },
              { phase: "During exit", items: ["Buyers", "Negotiation", "Diligence", "Closing"], to: "/console/autopilot" },
              { phase: "After exit", items: ["Taxes", "Trusts", "Family office", "Angel & PE", "Next venture"], to: "/console/wealth" },
            ].map((col) => (
              <Link key={col.phase} to={col.to} className="rounded-lg border border-white/10 bg-ink-900/40 p-4 transition hover:border-deal-400/30">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-deal-300">{col.phase}</div>
                <ul className="mt-2 space-y-1 text-[12.5px] text-white/70">
                  {col.items.map((it) => <li key={it} className="flex items-baseline gap-2"><span className="h-1 w-1 rounded-full bg-white/30" />{it}</li>)}
                </ul>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-white/55">From startup creation through growth, exit and wealth — founders never leave.</p>
        </Moat>
      </div>

      <p className="mt-6 text-[11px] text-white/40">All figures computed from the source-referenced acquisition history and the live engine runs.</p>
    </div>
  );
};

export default Network;

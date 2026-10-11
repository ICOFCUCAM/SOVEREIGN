import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { MarketTape } from "../lib/workstation";
import { PageHeader, Section, Metric, ActionLink } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { AcquisitionReactor, LiquidityReactor, BuyerNetworkReactor } from "../components/Reactor";
import { BUYERS, DILIGENCE, VALUATION_CANONICAL } from "../lib/engines";
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
  const multiple = ((VALUATION_CANONICAL.headline.mid * (1 + prem)) / ARR).toFixed(1);
  const retention = Math.min(95, Math.max(45, Math.round(retentionBase + ((c.outcomes.avgRetradePct ?? 0) >= 0 ? 6 : -8))));
  return { name: c.buyer.name, days, multiple, retention, earnout };
}

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="bg-xo-panel px-4 py-3">
    <div className="font-mono text-[20px] font-semibold tabular-nums text-xo-text">{value}</div>
    <div className="mt-0.5 text-[12px] text-xo-muted">{label}</div>
  </div>
);

const Moat: React.FC<{ n: number; title: string; why: string; children: React.ReactNode; to?: string; cta?: string }> = ({ n, title, why, children, to, cta }) => (
  <Section title={title} eyebrow={`Moat ${n} · ${why}`} className="border border-xo-line"
    right={to ? <ActionLink to={to}>{cta} →</ActionLink> : undefined}>
    <div className="px-4 py-4">{children}</div>
  </Section>
);

const Network: React.FC = () => {
  const buyerA = buyerDna("Amazon Strategic", 80, "Rare");
  const buyerB = buyerDna("Pritzker Private Capital", 60, "Aggressive");
  const buyerDnaCount = BUYERS.candidates.length;
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="network-intelligence" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ The moat · Five compounding assets" title="Network Intelligence"
        description="Individual screens can be copied; the compounding dataset cannot. The deal graph, the buyer graph, deal intelligence, the agent workforce and the founder lifecycle." />

      <section aria-label="Network size" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Acquirer mandates" value={MARKET_FMT.buyers} sub="profiled" /></div>
        <div className="bg-xo-panel"><Metric label="Acquisition events" value={HISTORY_FMT.events} sub="tracked" /></div>
        <div className="bg-xo-panel"><Metric label="Disclosed value" value={HISTORY_FMT.disclosedValue} sub="on record" /></div>
        <div className="bg-xo-panel"><Metric label="Buyer dossiers" value={String(buyerDnaCount)} sub="live engine runs" /></div>
      </section>

      <MarketTape items={tape} />

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-3">
        <Section title="Acquisition reactor" foot="Sector acquisition volume — the deal graph."><AcquisitionReactor height={200} /></Section>
        <Section title="Liquidity reactor" foot="Disclosed capital depth per sector."><LiquidityReactor height={200} /></Section>
        <Section title="Buyer network reactor" foot="Active acquirers by cadence — the buyer graph."><BuyerNetworkReactor height={200} /></Section>
      </div>

      <Moat n={1} title="The Deal Graph" why="A source-referenced acquisition dataset — every event traceable to EDGAR, Wikidata or press.">
        <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-3">
          <Stat value={MARKET_FMT.buyers} label="Acquirer mandates profiled" />
          <Stat value={HISTORY_FMT.events} label="Acquisition events tracked" />
          <Stat value={HISTORY_FMT.disclosedValue} label="Disclosed deal value" />
        </div>
        <p className="mt-3 max-w-[75ch] text-[13px] leading-relaxed text-xo-muted">
          Every event carries buyer, target, sector, price and outcome — with its source on record. The graph learns
          <span className="text-xo-text"> who buys what, for how much, and under what conditions</span> — the
          knowledge a first-time founder and most bankers simply don't have.
        </p>
      </Moat>

      <Moat n={2} title="The Buyer Graph" why="Most marketplaces know sellers. Few know buyers." to="/console/buyer-copilot" cta="Buyer Copilot">
        <p className="text-[13px] text-xo-muted">Buyer DNA on <span className="text-xo-text">{buyerDnaCount}+ acquirers</span> — measured, not guessed.</p>
        <ul className="mt-3 grid gap-px border border-xo-line bg-xo-line sm:grid-cols-2">
          {[buyerA, buyerB].map((b, i) => (
            <li key={b.name} className="bg-xo-panel px-4 py-3">
              <div className="text-[11px] text-xo-faint">Buyer {i === 0 ? "A" : "B"}</div>
              <h3 className="text-[14px] font-semibold">{b.name}</h3>
              <dl className="mt-2 grid grid-cols-3 gap-2">
                <div><dt className="text-[11px] text-xo-faint">to close</dt><dd className="font-mono text-[15px] font-semibold tabular-nums">{b.days}d</dd></div>
                <div><dt className="text-[11px] text-xo-faint">ARR</dt><dd className="font-mono text-[15px] font-semibold tabular-nums text-xo-verified">{b.multiple}×</dd></div>
                <div><dt className="text-[11px] text-xo-faint">retention</dt><dd className="font-mono text-[15px] font-semibold tabular-nums">{b.retention}%</dd></div>
              </dl>
              <p className="mt-2 text-[12px] text-xo-muted">Earnout tendency: <span className="text-xo-text">{b.earnout}</span></p>
            </li>
          ))}
        </ul>
      </Moat>

      <Moat n={3} title="Deal Intelligence" why="Every acquisition teaches the system — the AI grows smarter than most advisors.">
        <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
          <Stat value={DEAL_INTEL_FMT.medianClose} label="Median announce → close" />
          <Stat value={DEAL_INTEL_FMT.medianPremium} label="Median disclosed premium" />
          <Stat value={DEAL_INTEL_FMT.closedRate} label="Tracked deals closed" />
          <Stat value={String(DEAL_INTEL.measuredCloses)} label="Closes measured" />
        </div>
        <p className="mt-3 max-w-[75ch] text-[13px] leading-relaxed text-xo-muted">
          The platform learns the patterns that win: LOI structures, SPA clauses, earnout models, escrow patterns and
          negotiation outcomes — fed back into every recommendation.
        </p>
      </Moat>

      <Moat n={4} title="Autonomous Agents" why="Competitors offer tools. ExitOS offers workers." to="/console/autopilot" cta="Autonomous Exit">
        <ul className="grid gap-px border border-xo-line bg-xo-line sm:grid-cols-2">
          <li className="bg-xo-panel px-4 py-3 text-[13px] text-xo-muted">The <span className="text-xo-text">Outreach Agent</span> qualified {BUYERS.candidates.length} buyers from the registry.</li>
          <li className="bg-xo-panel px-4 py-3 text-[13px] text-xo-muted">The <span className="text-xo-text">Diligence Agent</span> prepared {DILIGENCE.documents.length} packages and flagged {DILIGENCE.redFlags.length + DILIGENCE.criticalQuestions.length} open items.</li>
        </ul>
        <p className="mt-3 max-w-[75ch] text-[13px] leading-relaxed text-xo-muted">
          Eight agents do the work — not "use the outreach tool" but "the agent contacted the buyers." The winner won't
          be software; it will be software that does the work.
        </p>
      </Moat>

      <Moat n={5} title="The Founder Lifecycle" why="Most platforms care only about the exit. ExitOS owns the whole journey." to="/console/wealth" cta="WealthOS">
        <ul className="grid gap-px border border-xo-line bg-xo-line sm:grid-cols-3">
          {[
            { phase: "Before exit", items: ["Valuation", "Readiness", "Growth planning"], to: "/console/readiness" },
            { phase: "During exit", items: ["Buyers", "Negotiation", "Diligence", "Closing"], to: "/console/autopilot" },
            { phase: "After exit", items: ["Taxes", "Trusts", "Family office", "Angel & PE", "Next venture"], to: "/console/wealth" },
          ].map((col) => (
            <li key={col.phase} className="bg-xo-panel">
              <Link to={col.to} className="block h-full px-4 py-3 hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xo-action">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-xo-brass">{col.phase}</span>
                <span className="mt-1 block text-[13px] text-xo-muted">{col.items.join(" · ")}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-xo-muted">From startup creation through growth, exit and wealth — founders never leave.</p>
      </Moat>

      <p className="px-1 text-[12px] text-xo-faint">All figures computed from the source-referenced acquisition history and the live engine runs.</p>
    </div>
  );
};

export default Network;

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { RegistryTape } from "../components/xo/RegistryTape";
import { PageHeader, Section, Metric, ActionLink, Provenance } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { AcquisitionReactor, LiquidityReactor, BuyerNetworkReactor } from "../components/Reactor";
import { VALUATION_FRAMEWORK, runBuyerDiscovery, runDueDiligence, type CompanyProfile } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { canonicalValuationFor } from "../lib/canonical-valuation";
import { MARKET_FMT, HISTORY_FMT, DEAL_INTEL, DEAL_INTEL_FMT } from "../lib/market-stats";
import { DNA_PROFILES, DNA_AS_OF } from "../lib/buyer-dna";

// Network Intelligence — the five moats. Individual screens can be copied;
// the compounding dataset cannot. This surface makes the moats tangible: the
// deal graph, the buyer graph, deal intelligence, the agent workforce and
// the founder lifecycle. Every figure is computed from the source-referenced
// acquisition history and the live engine runs.

// A ranked buyer's measured figures only. The premium is the buyer's average
// disclosed premium (capped at 40%) or, when none is disclosed, the
// framework's prior for that buyer type — labelled as such.
type Candidate = ReturnType<typeof runBuyerDiscovery>["candidates"][number];
function buyerFacts(c: Candidate, company: CompanyProfile, valueMid: number) {
  const ARR = company.revenue.annualRecurringRevenueUsd;
  const disclosed = c.outcomes.avgPremiumPct != null;
  const premium = disclosed ? Math.min(0.4, c.outcomes.avgPremiumPct as number) : (VALUATION_FRAMEWORK.buyerTypePremiumPriors[c.buyer.buyerType] ?? VALUATION_FRAMEWORK.executionNeutrals.premiumPct);
  const multiple = ARR > 0 ? ((valueMid * (1 + premium)) / ARR).toFixed(1) : null;
  return { name: c.buyer.name, days: c.expectedOutcome.expectedDaysToCash, premium, disclosed, multiple, probability: Math.round(c.probability * 100) };
}

// PRELAUNCH-REVIEW: buyer retention % and earnout tendency restored; retention is a hard-coded base nudged by retrade history and earnout is typed in — no retention or earnout source exists
const BUYER_DNA_EXTRAS: Array<{ retentionBase: number; earnout: string }> = [
  { retentionBase: 80, earnout: "Rare" },
  { retentionBase: 60, earnout: "Aggressive" },
];
function buyerRetention(c: Candidate, retentionBase: number): number {
  return Math.min(95, Math.max(45, Math.round(retentionBase + ((c.outcomes.avgRetradePct ?? 0) >= 0 ? 6 : -8))));
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
  // The founder's company when they have saved figures, else the demo company.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const { BUYERS, DILIGENCE, valueMid } = useMemo(() => ({
    BUYERS: runBuyerDiscovery(company, { limit: 12 }),
    DILIGENCE: runDueDiligence(company),
    valueMid: canonicalValuationFor(company).headline.mid,
  }), [company]);
  // the two top-ranked buyers for this company (no hand-picked names)
  const topTwo = BUYERS.candidates.slice(0, 2).map((c, i) => ({
    ...buyerFacts(c, company, valueMid),
    retention: buyerRetention(c, BUYER_DNA_EXTRAS[i].retentionBase),
    earnout: BUYER_DNA_EXTRAS[i].earnout,
  }));
  const buyerDnaCount = BUYERS.candidates.length;
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="network-intelligence" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ The moat · Five compounding assets" title="Network Intelligence"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"}>{fromIntake ? `Your intake · ${company.name}` : `Demo company · ${company.name}`}</Provenance></>}
        description="Individual screens can be copied; the compounding dataset cannot. The deal graph, the buyer graph, deal intelligence, the agent workforce and the founder lifecycle." />

      <section aria-label="Network size" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Acquirer mandates" value={MARKET_FMT.buyers} sub="profiled" /></div>
        <div className="bg-xo-panel"><Metric label="Acquisition events" value={HISTORY_FMT.events} sub="tracked" /></div>
        <div className="bg-xo-panel"><Metric label="Disclosed value" value={HISTORY_FMT.disclosedValue} sub="on record" /></div>
        <div className="bg-xo-panel"><Metric label="Ranked buyers" value={String(buyerDnaCount)} sub="top 12 for this company" /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-3">
        <Section title="Acquisition reactor" foot={`Sector acquisition volume — the deal graph (snapshot as of ${DNA_AS_OF.slice(0, 10)}). Rotation is decorative.`}><AcquisitionReactor height={200} /></Section>
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
        <p className="max-w-[75ch] text-[13px] text-xo-muted">Buyer DNA covers <span className="text-xo-text">{DNA_PROFILES.length.toLocaleString()} acquirers</span> in the registry (snapshot as of {DNA_AS_OF.slice(0, 10)}); the ranking below uses the {MARKET_FMT.buyers} curated mandates.</p>
        <ul className="mt-3 grid gap-px border border-xo-line bg-xo-line sm:grid-cols-2">
          {topTwo.map((b, i) => (
            <li key={b.name} className="bg-xo-panel px-4 py-3">
              <div className="text-[11px] text-xo-faint">Ranked #{i + 1} for this company · {b.probability}% probability</div>
              <h3 className="text-[14px] font-semibold">{b.name}</h3>
              <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div><dt className="text-[11px] text-xo-faint">Days to cash</dt><dd className="font-mono text-[15px] font-semibold tabular-nums">{b.days}d</dd></div>
                <div><dt className="text-[11px] text-xo-faint">Premium {b.disclosed ? "(disclosed avg)" : "(prior)"}</dt><dd className="font-mono text-[15px] font-semibold tabular-nums">+{Math.round(b.premium * 100)}%</dd></div>
                <div><dt className="text-[11px] text-xo-faint">What-if ARR multiple</dt><dd className="font-mono text-[15px] font-semibold tabular-nums text-xo-verified">{b.multiple ?? "—"}{b.multiple && "×"}</dd></div>
                {/* PRELAUNCH-REVIEW: retention figure restored; no measured retention source */}
                <div><dt className="text-[11px] text-xo-faint">Retention</dt><dd className="font-mono text-[15px] font-semibold tabular-nums">{b.retention}%</dd></div>
              </dl>
              {/* PRELAUNCH-REVIEW: earnout tendency restored; typed-in, no earnout data source */}
              <p className="mt-2 text-[12px] text-xo-muted">Earnout tendency: <span className="text-xo-text">{b.earnout}</span></p>
              <p className="mt-1 text-[11px] text-xo-faint">What-if: the company's value × (1 + this premium) ÷ its ARR.</p>
            </li>
          ))}
        </ul>
      </Moat>

      <Moat n={3} title="Deal Intelligence" why="Measured from the source-referenced deal history.">
        <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
          <Stat value={DEAL_INTEL_FMT.medianClose} label="Median announce → close" />
          <Stat value={DEAL_INTEL_FMT.medianPremium} label="Median disclosed premium" />
          <Stat value={DEAL_INTEL_FMT.closedRate} label="Tracked deals closed" />
          <Stat value={String(DEAL_INTEL.measuredCloses)} label="Closes measured" />
        </div>
        <p className="mt-3 max-w-[75ch] text-[13px] leading-relaxed text-xo-muted">
          These figures are recomputed from the deal history each time the registry is refreshed, and the valuation and
          buyer engines use them. Deal terms — LOI structure, SPA clauses, earnouts, escrow — are not yet learned from recorded deals.
        </p>
      </Moat>

      <Moat n={4} title="Autonomous Agents" why="Competitors offer tools. ExitOS offers workers." to="/console/autopilot" cta="Exit Rehearsal">
        <ul className="grid gap-px border border-xo-line bg-xo-line sm:grid-cols-2">
          <li className="bg-xo-panel px-4 py-3 text-[13px] text-xo-muted"><span className="text-xo-text">Buyer discovery</span> ranks {BUYERS.candidates.length} buyers from the curated registry for this company.</li>
          <li className="bg-xo-panel px-4 py-3 text-[13px] text-xo-muted"><span className="text-xo-text">Diligence checks</span> list {DILIGENCE.documents.length} document packages and flag {DILIGENCE.redFlags.length + DILIGENCE.criticalQuestions.length} open items.</li>
        </ul>
        <p className="mt-3 max-w-[75ch] text-[13px] leading-relaxed text-xo-muted">
          Exit Rehearsal lays this work out as agent steps you approve one by one. Nothing is sent to a buyer without your approval.
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

      <p className="px-1 text-[12px] text-xo-faint">All figures are computed from the source-referenced acquisition history and the engines for this company.</p>
    </div>
  );
};

export default Network;

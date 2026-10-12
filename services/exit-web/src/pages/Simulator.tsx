import React, { useEffect, useMemo, useState } from "react";
import { fmtMoney, ConfidenceChip } from "../lib/ui";
import { PageHeader, Section, Metric as XMetric, ScrollRegion, XO_INPUT, XO_LABEL } from "../components/xo";
import { MarketTape } from "../lib/workstation";
import { buildMarketTape } from "../lib/market-tape";
import { runStrategySimulator, runInstitutionalValuation, type BuyerType, type CompanyProfile, type StrategyOutput } from "@exit/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import { VALUATION_CANONICAL } from "../lib/engines";
import { emitTelemetry } from "../lib/telemetry";
import BankerTake from "../components/BankerTake";

// ExitOS Scenario Engine — the founder simulates futures. The baseline
// trajectory is whatever the founder inputs describe today; each scenario
// is a deterministic transform of (company, target, constraints) that we
// re-run through the same valuation + strategy engines, then diff against
// the baseline. Nothing here is free-form — every number traces to
// runInstitutionalValuation (decision D1) / runStrategySimulator over a mutated input.

const BUYER_TYPES: { value: BuyerType | "any"; label: string }[] = [
  { value: "any",           label: "Any" },
  { value: "strategic",     label: "Strategic" },
  { value: "pe",            label: "PE" },
  { value: "vc",            label: "VC (growth)" },
  { value: "family_office", label: "Family office" },
];

const FMT_PCT = (n: number) => `${(n * 100).toFixed(0)}%`;
const FMT_MS  = (n: number) => Math.round(n).toLocaleString();

interface SimConstraints {
  minCashPct: number;
  maxEarnoutPct: number;
  maxTimelineDays: number;
  preferredBuyerType: BuyerType | "any";
  minConfidence: "experimental" | "low" | "medium" | "high";
  targetBuyersToEngage: number;
}

interface Trajectory {
  company: CompanyProfile;
  target: number;
  constraints: SimConstraints;
  sim: StrategyOutput;
  valuationMid: number;
}

// One forward run of both engines over a candidate world-state.
function simulate(company: CompanyProfile, target: number, c: SimConstraints): Trajectory {
  const sim = runStrategySimulator(company, { ...c, targetValueUsd: target });
  const valuationMid = runInstitutionalValuation(company).headline.mid;
  return { company, target, constraints: c, sim, valuationMid };
}

// Scale a company's revenue figures by an ARR factor — used by the
// "wait six months" and "reach $25M ARR" scenarios. Margins, retention,
// and structure are held constant; only the top line moves.
function scaleCompany(c: CompanyProfile, arrFactor: number): CompanyProfile {
  return {
    ...c,
    revenue: {
      ...c.revenue,
      annualRecurringRevenueUsd: Math.round(c.revenue.annualRecurringRevenueUsd * arrFactor),
      trailingTwelveMonthsRevenueUsd: Math.round(c.revenue.trailingTwelveMonthsRevenueUsd * arrFactor),
    },
    growth: {
      ...c.growth,
      netNewArrUsd: c.growth.netNewArrUsd != null ? Math.round(c.growth.netNewArrUsd * arrFactor) : undefined,
    },
  };
}

// Baseline valuation anchors (constant company → compute once).
const BASE_STRATEGIC = runInstitutionalValuation(SAMPLE_COMPANY).headline;

interface ScenarioDef {
  id: string;
  tag: string;
  question: string;
  // Given the baseline trajectory, return the mutated world + the
  // human-readable drivers of the change and a modelling assumption.
  apply: (base: Trajectory) => { company: CompanyProfile; target: number; constraints: SimConstraints; drivers: string[]; assumption: string };
}

const SCENARIOS: readonly ScenarioDef[] = [
  {
    id: "wait6",
    tag: "Timing",
    question: "What happens if I wait six months?",
    apply: (base) => {
      const g = SAMPLE_COMPANY.growth.arrGrowthYoyPct;
      const factor = Math.pow(1 + g, 0.5);                       // half a year of compounding
      const company = scaleCompany(base.company, factor);
      const newMid = runInstitutionalValuation(company).headline.mid;
      const target = Math.round(base.target * (newMid / BASE_STRATEGIC.mid));
      const newArrM = (company.revenue.annualRecurringRevenueUsd / 1_000_000).toFixed(1);
      return {
        company, target,
        constraints: { ...base.constraints, maxTimelineDays: base.constraints.maxTimelineDays + 180 },
        drivers: [
          `ARR compounds ~6 months at ${FMT_PCT(g)} YoY → $${newArrM}M`,
          "Higher revenue base lifts the strategic valuation band",
          "Cash lands ~180 days later — carries market-timing risk",
        ],
        assumption: "Holds margins, retention and buyer pool constant; only the top line compounds. Does not price in multiple compression if the market turns.",
      };
    },
  },
  {
    id: "arr25",
    tag: "Growth",
    question: "What happens if revenue reaches $25M ARR?",
    apply: (base) => {
      const factor = 25_000_000 / SAMPLE_COMPANY.revenue.annualRecurringRevenueUsd;
      const company = scaleCompany(base.company, factor);
      const newMid = runInstitutionalValuation(company).headline.mid;
      const target = Math.round(base.target * (newMid / BASE_STRATEGIC.mid));
      return {
        company, target,
        constraints: base.constraints,
        drivers: [
          "ARR steps from $18M to $25M — crosses the scale threshold buyers reward",
          "Strategic band re-prices off the larger recurring base",
          "Larger check size opens up upper-bracket acquirers",
        ],
        assumption: "Models the destination, not the path — assumes you reach $25M at today's margins and concentration. Time and burn to get there are out of scope.",
      };
    },
  },
  {
    id: "noearnout",
    tag: "Structure",
    question: "What if I remove the earnout?",
    apply: (base) => ({
      company: base.company,
      target: base.target,
      constraints: { ...base.constraints, maxEarnoutPct: 0, minCashPct: Math.max(0.9, base.constraints.minCashPct) },
      drivers: [
        "All-cash demand — earnout ceiling drops to 0%",
        "Buyers who structure around earnouts (often PE) fall out of the set",
        "Realized value equals headline — no contingent claw-back risk",
      ],
      assumption: "Same buyer universe, stricter terms. An all-cash structure de-risks proceeds but can thin the field and shave the top-end offer.",
    }),
  },
  {
    id: "microsoft",
    tag: "Marquee buyer",
    question: "What if Microsoft enters the process?",
    apply: (base) => {
      // Model the effect of a deep-pocketed strategic entrant: the field
      // narrows to strategics, the anchor moves to the top of the
      // strategic band, and a cash-heavy structure becomes achievable.
      const target = Math.round(base.target * (BASE_STRATEGIC.high / BASE_STRATEGIC.mid));
      return {
        company: base.company,
        target,
        constraints: { ...base.constraints, preferredBuyerType: "strategic", minCashPct: Math.max(0.8, base.constraints.minCashPct) },
        drivers: [
          "A marquee strategic tightens the field and raises competitive tension",
          "Anchor moves to the top of the strategic band",
          "Deep balance sheet → cash-heavy structure, faster to close",
        ],
        assumption: "Models the effect of a hyperscaler entrant (top-of-band anchor + auction tension), not a literal new logo in the registry.",
      };
    },
  },
  {
    id: "fast90",
    tag: "Speed",
    question: "What if I force a 90-day close?",
    apply: (base) => ({
      company: base.company,
      target: base.target,
      constraints: { ...base.constraints, maxTimelineDays: 90 },
      drivers: [
        "Hard 90-day timeline — only fast-moving buyers survive",
        "Slower acquirers drop out, thinning the set",
        "Speed protects momentum but sacrifices auction tension",
      ],
      assumption: "Filters the pool on historical close speed. A compressed timeline trades price discovery for certainty and de-risks deal fatigue.",
    }),
  },
  {
    id: "peonly",
    tag: "Path",
    question: "What if I run a PE-only process?",
    apply: (base) => ({
      company: base.company,
      target: base.target,
      constraints: { ...base.constraints, preferredBuyerType: "pe", minCashPct: Math.min(base.constraints.minCashPct, 0.6) },
      drivers: [
        "Restricts the field to financial sponsors",
        "More earnout / rollover structure, lower cash floor",
        "Faster, more repeatable diligence — sponsors transact for a living",
      ],
      assumption: "Sponsors price off cash flow, not synergy — expect tighter headlines than a strategic but a cleaner, more predictable process.",
    }),
  },
];

interface Metric { label: string; base: number; scen: number; fmt: (n: number) => string; higherIsBetter: boolean; }

const Simulator: React.FC = () => {
  const [targetUsd,     setTargetUsd]     = useState<number>(Math.round(VALUATION_CANONICAL.headline.mid));
  const [minCashPct,    setMinCashPct]    = useState<number>(0.75);
  const [maxEarnoutPct, setMaxEarnoutPct] = useState<number>(0.15);
  const [maxTimelineDays, setMaxTimelineDays] = useState<number>(180);
  const [preferredType,   setPreferredType]   = useState<BuyerType | "any">("any");
  const [minConfidence,   setMinConfidence]   = useState<"experimental" | "low" | "medium" | "high">("experimental");
  const [activeScenario,  setActiveScenario]  = useState<string>("wait6");

  useEffect(() => { emitTelemetry("simulator_viewed", undefined, "/console/simulator"); }, []);

  const baseline = useMemo<Trajectory>(() => simulate(SAMPLE_COMPANY, targetUsd, {
    minCashPct, maxEarnoutPct, maxTimelineDays, preferredBuyerType: preferredType, minConfidence, targetBuyersToEngage: 5,
  }), [targetUsd, minCashPct, maxEarnoutPct, maxTimelineDays, preferredType, minConfidence]);

  const scenario = SCENARIOS.find((s) => s.id === activeScenario) ?? SCENARIOS[0];
  const applied = useMemo(() => scenario.apply(baseline), [scenario, baseline]);
  const variant = useMemo<Trajectory>(
    () => simulate(applied.company, applied.target, applied.constraints),
    [applied],
  );

  const result = baseline.sim;

  const metrics: Metric[] = [
    { label: "Strategic valuation",  base: baseline.valuationMid,                     scen: variant.valuationMid,                     fmt: fmtMoney,             higherIsBetter: true },
    { label: "Modelled close probability", base: baseline.sim.expectedCloseProbability,     scen: variant.sim.expectedCloseProbability,     fmt: (n) => `${(n * 100).toFixed(0)}%`, higherIsBetter: true },
    { label: "Best expected value in set", base: baseline.sim.expectedRealizedValueUsd,     scen: variant.sim.expectedRealizedValueUsd,     fmt: fmtMoney,             higherIsBetter: true },
    { label: "Time to cash",         base: baseline.sim.expectedTimeToCashDays,       scen: variant.sim.expectedTimeToCashDays,       fmt: (n) => `${FMT_MS(n)}d`,            higherIsBetter: false },
    { label: "Buyers in set",        base: baseline.sim.recommendedBuyers.length,     scen: variant.sim.recommendedBuyers.length,     fmt: (n) => String(n),                  higherIsBetter: true },
  ];

  const handleScenario = (id: string): void => {
    setActiveScenario(id);
    const s = SCENARIOS.find((x) => x.id === id);
    emitTelemetry("simulator_scenario", { scenario: id, question: s?.question }, "/console/simulator");
  };

  const tape = useMemo(() => buildMarketTape(), []);
  const LBL = XO_LABEL;
  const INP = XO_INPUT;

  return (
    <div data-page="simulator" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Decision Engine" title="Scenario Engine"
        badge={<span className="text-[12px] text-xo-muted">Simulate futures</span>} />

      <section aria-label="Baseline summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-3">
        <div className="bg-xo-panel"><XMetric label="Best expected value in set" emphasis value={fmtMoney(baseline.sim.expectedRealizedValueUsd)} sub="baseline · the highest buyer, not an average" /></div>
        <div className="bg-xo-panel"><XMetric label="Lead buyer close" value={baseline.sim.recommendedBuyers[0] ? `${(baseline.sim.recommendedBuyers[0].expectedOutcome.closeRatePct * 100).toFixed(0)}%` : "—"} sub={baseline.sim.recommendedBuyers[0]?.buyer.name} /></div>
        <div className="bg-xo-panel"><XMetric label="Buyers in set" value={String(baseline.sim.recommendedBuyers.length)} sub="clearing constraints" /></div>
      </section>

      <MarketTape items={tape} />

      <BankerTake
        next={<>Stress-test the plan before you commit — model waiting, scaling to $25M ARR, or a marquee entrant.</>}
        stake={<><span className="font-mono font-bold text-deal-300">{fmtMoney(baseline.sim.expectedRealizedValueUsd)}</span> expected realized on today's baseline trajectory.</>}
        inaction={<>The default path is rarely the optimal one — unexamined timing and structure leave value unmodeled.</>}
        buyer={baseline.sim.recommendedBuyers[0]
          ? <><span className="text-white">{baseline.sim.recommendedBuyers[0].buyer.name}</span> leads the baseline set at {(baseline.sim.recommendedBuyers[0].expectedOutcome.closeRatePct * 100).toFixed(0)}% close.</>
          : <>No buyers clear the baseline constraints — loosen them to rebuild the set.</>}
        automate={<>ExitOS re-runs valuation and strategy for every scenario and diffs the outcome against your baseline.</>}
        impact={<>{fmtMoney(baseline.sim.expectedRealizedValueUsd)}</>}
      />

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        {/* ── Baseline inputs ─────────────────────────────────── */}
        <Section title="Baseline trajectory" className="lg:col-span-4">
          <div className="space-y-4 px-4 py-4">
            <div>
              <label htmlFor="sim-target" className={LBL}>Target value (USD)</label>
              <input id="sim-target" type="number" value={targetUsd} onChange={(e) => setTargetUsd(Number(e.target.value))} step={1_000_000} min={0} aria-describedby="sim-target-hint" className={INP} />
              <span id="sim-target-hint" className="mt-1 block text-[12px] text-xo-muted">Implied mid: {fmtMoney(VALUATION_CANONICAL.headline.mid)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sim-cash" className={LBL}>Min cash %</label>
                <input id="sim-cash" type="number" value={Math.round(minCashPct * 100)} onChange={(e) => setMinCashPct(Math.min(1, Math.max(0, Number(e.target.value) / 100)))} min={0} max={100} step={5} className={INP} />
              </div>
              <div>
                <label htmlFor="sim-earnout" className={LBL}>Max earnout %</label>
                <input id="sim-earnout" type="number" value={Math.round(maxEarnoutPct * 100)} onChange={(e) => setMaxEarnoutPct(Math.min(1, Math.max(0, Number(e.target.value) / 100)))} min={0} max={100} step={5} className={INP} />
              </div>
            </div>
            <div>
              <label htmlFor="sim-days" className={LBL}>Max timeline (days)</label>
              <input id="sim-days" type="number" value={maxTimelineDays} onChange={(e) => setMaxTimelineDays(Math.max(1, Number(e.target.value)))} min={1} step={15} aria-describedby="sim-days-hint" className={INP} />
              <span id="sim-days-hint" className="mt-1 block text-[12px] text-xo-muted">Outreach + LOI + diligence + close</span>
            </div>
            <div>
              <label htmlFor="sim-type" className={LBL}>Preferred buyer type</label>
              <select id="sim-type" value={preferredType} onChange={(e) => setPreferredType(e.target.value as BuyerType | "any")} className={INP}>
                {BUYER_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sim-conf" className={LBL}>Minimum confidence</label>
              <select id="sim-conf" value={minConfidence} onChange={(e) => setMinConfidence(e.target.value as typeof minConfidence)} aria-describedby="sim-conf-hint" className={INP}>
                <option value="experimental">Experimental — accept all</option>
                <option value="low">Low — at least 1 prior</option>
                <option value="medium">Medium — at least 3 priors</option>
                <option value="high">High — at least 10 priors</option>
              </select>
              <span id="sim-conf-hint" className="mt-1 block text-[12px] text-xo-muted">Drop buyers with weaker evidence</span>
            </div>
            <div className="border border-xo-line bg-xo-ink p-3 text-[12px]">
              <h3 className="text-[12px] font-semibold text-xo-muted">Dropped by constraint</h3>
              <dl className="mt-2 grid grid-cols-2 gap-y-1 font-mono tabular-nums">
                <dt className="text-xo-muted">too slow</dt>        <dd className="text-right">{result.droppedByConstraint.tooLong}</dd>
                <dt className="text-xo-muted">wrong type</dt>      <dd className="text-right">{result.droppedByConstraint.wrongBuyerType}</dd>
                <dt className="text-xo-muted">below target</dt>    <dd className="text-right">{result.droppedByConstraint.belowTarget}</dd>
                <dt className="text-xo-muted">low confidence</dt>  <dd className="text-right">{result.droppedByConstraint.belowConfidence}</dd>
              </dl>
            </div>
          </div>
        </Section>

        {/* ── Scenario engine ─────────────────────────────────── */}
        <div className="flex flex-col gap-px bg-xo-line lg:col-span-8">
          <Section title="Current trajectory"
            foot="Model outputs. Close probability = 1 − Π(1 − close rate) across the set — it assumes every buyer in the set makes an offer, independently; close rates use priors where a buyer has not disclosed one. The value is the highest buyer's expected closing value, so it sits above what a typical buyer would pay.">
            <div className="px-4 py-3">
              <p className="text-[13px]">{result.summary}</p>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Modelled close probability" value={`${(result.expectedCloseProbability * 100).toFixed(0)}%`} sub={`P(≥1 of ${result.recommendedBuyers.length}), independence assumed`} />
                <Stat label="Time to cash"       value={`${FMT_MS(result.expectedTimeToCashDays)}d`} sub="median across set" />
                <Stat label="Best expected value in set"  value={fmtMoney(result.expectedRealizedValueUsd)} sub="maximum across the set" />
                <Stat label="Strategic value"    value={fmtMoney(baseline.valuationMid)} sub="mid band, today" />
              </dl>
            </div>
          </Section>

          {/* Scenario picker */}
          <Section title="Simulate a future" right={<span className="text-[11px] text-xo-muted">{SCENARIOS.length} scenarios</span>}>
            <div role="group" aria-label="Scenario" className="grid gap-px bg-xo-line sm:grid-cols-2 lg:grid-cols-3">
              {SCENARIOS.map((s) => {
                const active = s.id === activeScenario;
                return (
                  <button key={s.id} type="button" aria-pressed={active} onClick={() => handleScenario(s.id)}
                    className={`p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xo-action ${active ? "bg-xo-raise" : "bg-xo-panel hover:bg-xo-raise"}`}>
                    <div className={`text-[11px] font-semibold ${active ? "text-xo-verified" : "text-xo-muted"}`}>{active && <span aria-hidden>✓ </span>}{s.tag}</div>
                    <div className="mt-1 text-[13px] font-medium leading-snug">{s.question}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Scenario diff */}
          <Section title={scenario.question} eyebrow="Scenario vs. baseline">
            <div className="px-4 py-3">
              <dl className="grid gap-px bg-xo-line sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((m) => {
                  const diff = m.scen - m.base;
                  const flat = Math.abs(diff) < (m.base === 0 ? 1e-9 : Math.abs(m.base) * 0.005);
                  const good = m.higherIsBetter ? diff > 0 : diff < 0;
                  const color = flat ? "text-xo-muted" : good ? "text-xo-verified" : "text-xo-risk";
                  const arrow = flat ? "→" : diff > 0 ? "▲" : "▼";
                  return (
                    <div key={m.label} className="flex flex-col bg-xo-panel p-3">
                      <dt className="order-1 text-[12px] font-semibold text-xo-muted">{m.label}</dt>
                      <dd className="order-2 mt-1.5 flex items-baseline gap-2">
                        <span className="font-mono text-lg font-semibold tabular-nums">{m.fmt(m.scen)}</span>
                        <span className={`text-[12px] font-semibold ${color}`}>{arrow} {flat ? "no change" : m.fmt(Math.abs(diff))}</span>
                      </dd>
                      <dd className="order-3 mt-1 text-[12px] text-xo-muted">baseline {m.fmt(m.base)}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_minmax(0,300px)]">
                <div>
                  <h3 className="text-[12px] font-semibold text-xo-muted">What changes</h3>
                  <ul className="mt-2 space-y-2 text-[13px]">
                    {applied.drivers.map((d, i) => (
                      <li key={i} className="flex gap-2"><span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-xo-verified" /><span>{d}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="border border-xo-line bg-xo-ink p-3">
                  <h3 className="text-[12px] font-semibold text-xo-muted">Modelling assumption</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-xo-muted">{applied.assumption}</p>
                </div>
              </div>
              <p className="mt-4 border-t border-xo-line pt-3 text-[13px] text-xo-muted">{variant.sim.summary}</p>
            </div>
          </Section>
        </div>
      </div>

      {/* ── Baseline buyer set + process structure ──────────────── */}
      {result.recommendedBuyers.length > 0 && (
        <Section title="Recommended buyer set — baseline trajectory" className="border border-xo-line">
          <ScrollRegion label="Recommended buyer set table">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead className="text-left text-[11px] text-xo-muted">
                <tr className="border-b border-xo-line">
                  <th scope="col" className="w-8 px-4 py-2 font-medium">#</th>
                  <th scope="col" className="px-2 py-2 font-medium">Acquirer</th>
                  <th scope="col" className="px-2 py-2 font-medium">Type</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Headline</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Close rate</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Days</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Expected realized</th>
                </tr>
              </thead>
              <tbody>
                {result.recommendedBuyers.map((c, idx) => (
                  <tr key={c.buyer.name} className="border-b border-xo-line last:border-0">
                    <td className="px-4 py-2.5 font-mono text-[12px] text-xo-muted">{idx + 1}</td>
                    <th scope="row" className="px-2 py-2.5 text-left font-normal">
                      <div className="font-medium">{c.buyer.name}</div>
                      <div className="mt-0.5 max-w-md text-[12px] leading-snug text-xo-muted">{c.buyer.thesis}</div>
                    </th>
                    <td className="px-2 py-2.5 text-[12px] capitalize text-xo-muted">{c.buyer.buyerType.replace(/_/g, " ")}</td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums">{fmtMoney(c.expectedOutcome.expectedHeadlineUsd)}</td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums">{FMT_PCT(c.expectedOutcome.closeRatePct)}</td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums">{c.expectedOutcome.expectedDaysToCash}d</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="font-mono font-semibold tabular-nums text-xo-verified">{fmtMoney(c.expectedOutcome.expectedClosingUsd)}</div>
                      <div className="mt-0.5 flex justify-end"><ConfidenceChip tier={c.expectedOutcome.overallConfidence.tier} sample={c.expectedOutcome.overallConfidence.sample} compact /></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>
      )}

      <Section title="Recommended process structure" className="border border-xo-line">
        <div className="px-4 py-3">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Buyers to engage"  value={String(result.recommendedProcessStructure.buyersToEngage)} sub="parallel process" />
            <Stat label="Timeline"          value={`${result.recommendedProcessStructure.recommendedTimelineDays}d`} sub="outreach → close" />
            <Stat label="Cash floor"        value={FMT_PCT(result.recommendedProcessStructure.recommendedCashFloorPct)} sub="negotiate at or above" />
            <Stat label="Earnout ceiling"   value={FMT_PCT(result.recommendedProcessStructure.recommendedEarnoutCeilingPct)} sub="negotiate at or below" />
          </dl>
          <ul className="mt-4 space-y-2 text-[13px] text-xo-muted">
            {result.recommendedProcessStructure.rationale.map((r, i) => (
              <li key={i} className="flex gap-2"><span aria-hidden className="text-xo-faint">·</span><span>{r}</span></li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; sub?: string; tone?: string }> = ({ label, value, sub, tone }) => (
  <div className="flex flex-col">
    <dt className="order-1 text-[12px] font-semibold text-xo-muted">{label}</dt>
    <dd className={`order-2 mt-1 text-2xl font-semibold tabular-nums ${tone ?? ""}`}>{value}</dd>
    {sub && <dd className="order-3 mt-0.5 text-[12px] text-xo-muted">{sub}</dd>}
  </div>
);

export default Simulator;

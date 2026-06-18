import React, { useEffect, useMemo, useState } from "react";
import { Card, Field, fmtMoney, ConfidenceChip, inputCls } from "../lib/ui";
import { CommandHeader, MarketTape } from "../lib/workstation";
import { buildMarketTape } from "../lib/market-tape";
import { runStrategySimulator, runValuation, type BuyerType, type CompanyProfile, type StrategyOutput } from "@exit/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import { VALUATION_STRATEGIC } from "../lib/engines";
import { emitTelemetry } from "../lib/telemetry";
import BankerTake from "../components/BankerTake";

// ExitOS Scenario Engine — the founder simulates futures. The baseline
// trajectory is whatever the founder inputs describe today; each scenario
// is a deterministic transform of (company, target, constraints) that we
// re-run through the same valuation + strategy engines, then diff against
// the baseline. Nothing here is free-form — every number traces to
// runValuation / runStrategySimulator over a mutated input.

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
  const valuationMid = runValuation(company, { reportType: "strategic" }).headline.mid;
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
const BASE_STRATEGIC = runValuation(SAMPLE_COMPANY, { reportType: "strategic" }).headline;

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
      const newMid = runValuation(company, { reportType: "strategic" }).headline.mid;
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
      const newMid = runValuation(company, { reportType: "strategic" }).headline.mid;
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
  const [targetUsd,     setTargetUsd]     = useState<number>(Math.round(VALUATION_STRATEGIC.headline.mid));
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
    { label: "Close probability",    base: baseline.sim.expectedCloseProbability,     scen: variant.sim.expectedCloseProbability,     fmt: (n) => `${(n * 100).toFixed(0)}%`, higherIsBetter: true },
    { label: "Expected realized",    base: baseline.sim.expectedRealizedValueUsd,     scen: variant.sim.expectedRealizedValueUsd,     fmt: fmtMoney,             higherIsBetter: true },
    { label: "Time to cash",         base: baseline.sim.expectedTimeToCashDays,       scen: variant.sim.expectedTimeToCashDays,       fmt: (n) => `${FMT_MS(n)}d`,            higherIsBetter: false },
    { label: "Buyers in set",        base: baseline.sim.recommendedBuyers.length,     scen: variant.sim.recommendedBuyers.length,     fmt: (n) => String(n),                  higherIsBetter: true },
  ];

  const handleScenario = (id: string): void => {
    setActiveScenario(id);
    const s = SCENARIOS.find((x) => x.id === id);
    emitTelemetry("simulator_scenario", { scenario: id, question: s?.question }, "/console/simulator");
  };

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Decision Engine"
        title="Scenario Engine"
        tag="Simulate futures"
        metrics={[
          { k: "Baseline realized", v: fmtMoney(baseline.sim.expectedRealizedValueUsd), accent: true, sub: "today's trajectory" },
          { k: "Lead buyer close", v: baseline.sim.recommendedBuyers[0] ? `${(baseline.sim.recommendedBuyers[0].expectedOutcome.closeRatePct * 100).toFixed(0)}%` : "—", sub: baseline.sim.recommendedBuyers[0]?.buyer.name },
          { k: "Buyers in set", v: String(baseline.sim.recommendedBuyers.length), sub: "clearing constraints" },
        ]}
      />

      <MarketTape items={buildMarketTape()} />

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

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ── Baseline inputs ─────────────────────────────────── */}
        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Baseline trajectory</div>

          <div className="mt-5 space-y-5">
            <Field label="Target value (USD)" hint={`Implied mid: ${fmtMoney(VALUATION_STRATEGIC.headline.mid)}`}>
              <input
                type="number"
                value={targetUsd}
                onChange={(e) => setTargetUsd(Number(e.target.value))}
                step={1_000_000}
                min={0}
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Min cash %">
                <input
                  type="number"
                  value={Math.round(minCashPct * 100)}
                  onChange={(e) => setMinCashPct(Math.min(1, Math.max(0, Number(e.target.value) / 100)))}
                  min={0} max={100} step={5}
                  className={inputCls}
                />
              </Field>
              <Field label="Max earnout %">
                <input
                  type="number"
                  value={Math.round(maxEarnoutPct * 100)}
                  onChange={(e) => setMaxEarnoutPct(Math.min(1, Math.max(0, Number(e.target.value) / 100)))}
                  min={0} max={100} step={5}
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Max timeline (days)" hint="Outreach + LOI + diligence + close">
              <input
                type="number"
                value={maxTimelineDays}
                onChange={(e) => setMaxTimelineDays(Math.max(1, Number(e.target.value)))}
                min={1} step={15}
                className={inputCls}
              />
            </Field>

            <Field label="Preferred buyer type">
              <select
                value={preferredType}
                onChange={(e) => setPreferredType(e.target.value as BuyerType | "any")}
                className={inputCls}
              >
                {BUYER_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </Field>

            <Field label="Minimum confidence" hint="Drop buyers with weaker evidence">
              <select
                value={minConfidence}
                onChange={(e) => setMinConfidence(e.target.value as typeof minConfidence)}
                className={inputCls}
              >
                <option value="experimental">Experimental — accept all</option>
                <option value="low">Low — at least 1 prior</option>
                <option value="medium">Medium — at least 3 priors</option>
                <option value="high">High — at least 10 priors</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 rounded-md border border-white/5 bg-ink-900/50 p-3 text-[11px] text-white/55">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Dropped by constraint</div>
            <div className="mt-2 grid grid-cols-2 gap-y-1 font-mono tabular-nums">
              <span>too slow</span>          <span className="text-right text-white/75">{result.droppedByConstraint.tooLong}</span>
              <span>wrong type</span>        <span className="text-right text-white/75">{result.droppedByConstraint.wrongBuyerType}</span>
              <span>below target</span>     <span className="text-right text-white/75">{result.droppedByConstraint.belowTarget}</span>
              <span>low confidence</span>   <span className="text-right text-white/75">{result.droppedByConstraint.belowConfidence}</span>
            </div>
          </div>
        </Card>

        {/* ── Scenario engine ─────────────────────────────────── */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-400">Current trajectory</div>
            <p className="mt-3 text-sm text-white/80">{result.summary}</p>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Close probability" value={`${(result.expectedCloseProbability * 100).toFixed(0)}%`} sub={`P(≥1 of ${result.recommendedBuyers.length})`} accent="#34d399" />
              <Stat label="Time to cash"       value={`${FMT_MS(result.expectedTimeToCashDays)}d`} sub="median across set" />
              <Stat label="Expected realized"  value={fmtMoney(result.expectedRealizedValueUsd)} sub="best of set" accent="#34d399" />
              <Stat label="Strategic value"    value={fmtMoney(baseline.valuationMid)} sub="mid band, today" />
            </div>
          </Card>

          {/* Scenario picker */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Simulate a future</div>
              <div className="text-[10px] uppercase tracking-wide text-white/30">{SCENARIOS.length} scenarios</div>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {SCENARIOS.map((s) => {
                const active = s.id === activeScenario;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleScenario(s.id)}
                    className={`rounded-lg border p-3 text-left transition ${active
                      ? "border-deal-500/60 bg-deal-600/15 ring-1 ring-deal-500/40"
                      : "border-white/10 bg-ink-900/40 hover:border-white/25 hover:bg-white/[0.03]"}`}
                  >
                    <div className={`text-[9px] font-semibold uppercase tracking-[0.18em] ${active ? "text-deal-300" : "text-white/35"}`}>{s.tag}</div>
                    <div className={`mt-1 text-[13px] font-medium leading-snug ${active ? "text-white" : "text-white/75"}`}>{s.question}</div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Scenario diff */}
          <Card className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-serif text-lg font-bold text-white">{scenario.question}</h3>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">vs. baseline</span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map((m) => {
                const diff = m.scen - m.base;
                const flat = Math.abs(diff) < (m.base === 0 ? 1e-9 : Math.abs(m.base) * 0.005);
                const good = m.higherIsBetter ? diff > 0 : diff < 0;
                const color = flat ? "text-white/40" : good ? "text-deal-300" : "text-red-300";
                const arrow = flat ? "→" : diff > 0 ? "▲" : "▼";
                return (
                  <div key={m.label} className="rounded-lg border border-white/10 bg-ink-900/40 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{m.label}</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-mono text-lg font-bold tabular-nums text-white">{m.fmt(m.scen)}</span>
                      <span className={`text-[11px] font-semibold ${color}`}>{arrow} {flat ? "no change" : m.fmt(Math.abs(diff))}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-white/40">baseline {m.fmt(m.base)}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(0,300px)]">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">What changes</div>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  {applied.drivers.map((d, i) => (
                    <li key={i} className="flex gap-2"><span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-deal-400" /><span>{d}</span></li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-white/5 bg-ink-900/50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Modelling assumption</div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">{applied.assumption}</p>
              </div>
            </div>

            <p className="mt-5 border-t border-white/10 pt-4 text-[12.5px] text-white/70">{variant.sim.summary}</p>
          </Card>
        </div>
      </div>

      {/* ── Baseline buyer set + process structure ──────────────── */}
      <div className="mt-6 space-y-6">
        {result.recommendedBuyers.length > 0 && (
          <Card>
            <div className="border-b border-white/10 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Recommended buyer set — baseline trajectory
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 w-8">#</th>
                  <th className="px-5 py-3">Acquirer</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-right">Headline</th>
                  <th className="px-5 py-3 text-right">Close rate</th>
                  <th className="px-5 py-3 text-right">Days</th>
                  <th className="px-5 py-3 text-right">Expected realized</th>
                </tr>
              </thead>
              <tbody>
                {result.recommendedBuyers.map((c, idx) => {
                  const rankBg = idx === 0 ? "bg-deal-600/30 text-deal-200 ring-deal-500/40"
                              : idx === 1 ? "bg-stage-engaged/15 text-stage-engaged ring-stage-engaged/40"
                              : idx === 2 ? "bg-loi-500/15 text-loi-300 ring-loi-400/30"
                              : "bg-white/5 text-white/55 ring-white/15";
                  return (
                    <tr key={c.buyer.name} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono font-bold ring-1 ${rankBg}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-white">{c.buyer.name}</div>
                        <div className="mt-0.5 max-w-md text-[11px] leading-snug text-white/45">{c.buyer.thesis}</div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] uppercase tracking-wide text-white/65">{c.buyer.buyerType.replace(/_/g, " ")}</td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white/85">{fmtMoney(c.expectedOutcome.expectedHeadlineUsd)}</td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white/85">{FMT_PCT(c.expectedOutcome.closeRatePct)}</td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white/85">{c.expectedOutcome.expectedDaysToCash}d</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="font-mono tabular-nums font-semibold text-deal-300">{fmtMoney(c.expectedOutcome.expectedClosingUsd)}</div>
                        <div className="mt-0.5 flex justify-end">
                          <ConfidenceChip
                            tier={c.expectedOutcome.overallConfidence.tier}
                            sample={c.expectedOutcome.overallConfidence.sample}
                            compact
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}

        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Recommended process structure</div>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Buyers to engage"  value={String(result.recommendedProcessStructure.buyersToEngage)} sub="parallel process" />
            <Stat label="Timeline"           value={`${result.recommendedProcessStructure.recommendedTimelineDays}d`} sub="outreach → close" />
            <Stat label="Cash floor"         value={FMT_PCT(result.recommendedProcessStructure.recommendedCashFloorPct)} sub="negotiate at or above" />
            <Stat label="Earnout ceiling"   value={FMT_PCT(result.recommendedProcessStructure.recommendedEarnoutCeilingPct)} sub="negotiate at or below" />
          </div>
          <ul className="mt-5 space-y-2 text-sm text-white/70">
            {result.recommendedProcessStructure.rationale.map((r, i) => (
              <li key={i} className="flex gap-2"><span className="text-white/30">·</span><span>{r}</span></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; sub?: string; accent?: string }> = ({ label, value, sub, accent }) => (
  <div>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</div>
    <div className="mt-1 text-2xl font-bold tabular-nums" style={accent ? { color: accent } : undefined}>{value}</div>
    {sub && <div className="mt-0.5 text-[11px] text-white/45">{sub}</div>}
  </div>
);

export default Simulator;

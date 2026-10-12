import React, { useEffect, useMemo, useState } from "react";
import { fmtMoney, ConfidenceChip } from "../lib/ui";
import { PageHeader, Section, Metric as XMetric, ScrollRegion, Provenance, XO_INPUT, XO_LABEL } from "../components/xo";
import { MarketTape } from "../lib/workstation";
import { buildMarketTape } from "../lib/market-tape";
import { runStrategySimulator, runInstitutionalValuation, type BuyerType, type CompanyProfile, type StrategyOutput } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { parseNumber } from "../lib/intake-fields";
import { canonicalValuationFor } from "../lib/canonical-valuation";
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

interface ScenarioDef {
  id: string;
  tag: string;
  question: (company: CompanyProfile) => string;
  // Given the baseline trajectory, return the mutated world + the
  // drivers of the change (computed from the company, or worded as what
  // to check in the diff) and a modelling assumption.
  apply: (base: Trajectory) => { company: CompanyProfile; target: number; constraints: SimConstraints; drivers: string[]; assumption: string };
}

const arrM = (c: CompanyProfile): number => c.revenue.annualRecurringRevenueUsd / 1_000_000;
// The growth scenario's destination: $25M ARR, or 40% above today when
// the company is already past it (rounded up to the next $5M).
const growthTargetArr = (c: CompanyProfile): number => {
  const cur = c.revenue.annualRecurringRevenueUsd;
  return cur < 25_000_000 ? 25_000_000 : Math.ceil((cur * 1.4) / 5_000_000) * 5_000_000;
};

const SCENARIOS: readonly ScenarioDef[] = [
  {
    id: "wait6",
    tag: "Timing",
    question: () => "What happens if I wait six months?",
    apply: (base) => {
      const g = base.company.growth.arrGrowthYoyPct;
      const factor = Math.pow(1 + g, 0.5);                       // half a year of compounding
      const company = scaleCompany(base.company, factor);
      const newMid = runInstitutionalValuation(company).headline.mid;
      const target = Math.round(base.target * (newMid / base.valuationMid));
      return {
        company, target,
        constraints: { ...base.constraints, maxTimelineDays: base.constraints.maxTimelineDays + 180 },
        drivers: [
          `ARR compounds about 6 months at ${FMT_PCT(g)} a year: $${arrM(base.company).toFixed(1)}M → $${arrM(company).toFixed(1)}M`,
          "The valuation is re-run on the larger revenue base — see the diff above",
          "Cash lands about 180 days later, with market-timing risk",
        ],
        assumption: "Holds margins, retention and buyer pool constant; only the top line compounds. Does not price in multiple compression if the market turns.",
      };
    },
  },
  {
    id: "arr25",
    tag: "Growth",
    question: (c) => `What happens if revenue reaches $${Math.round(growthTargetArr(c) / 1_000_000)}M ARR?`,
    apply: (base) => {
      const dest = growthTargetArr(base.company);
      const factor = dest / base.company.revenue.annualRecurringRevenueUsd;
      const company = scaleCompany(base.company, factor);
      const newMid = runInstitutionalValuation(company).headline.mid;
      const target = Math.round(base.target * (newMid / base.valuationMid));
      return {
        company, target,
        constraints: base.constraints,
        drivers: [
          `ARR goes from $${arrM(base.company).toFixed(1)}M to $${(dest / 1_000_000).toFixed(0)}M`,
          "The valuation is re-run on the larger recurring base — see the diff above",
          "The buyer set is re-filtered at the new size — compare Buyers in set",
        ],
        assumption: `Models the destination, not the path — assumes you reach $${(dest / 1_000_000).toFixed(0)}M at today's margins and concentration. Time and burn to get there are out of scope.`,
      };
    },
  },
  {
    id: "noearnout",
    tag: "Structure",
    question: () => "What if I remove the earnout?",
    apply: (base) => ({
      company: base.company,
      target: base.target,
      constraints: { ...base.constraints, maxEarnoutPct: 0, minCashPct: Math.max(0.9, base.constraints.minCashPct) },
      drivers: [
        "All-cash demand — earnout ceiling 0%, cash floor at least 90%",
        "Buyers whose expected structure needs an earnout may drop out — compare Buyers in set",
        "Realized value then equals the headline — no contingent component",
      ],
      assumption: "Same buyer universe, stricter terms. An all-cash structure de-risks proceeds but can thin the field and shave the top-end offer.",
    }),
  },
  {
    id: "microsoft",
    tag: "Marquee buyer",
    question: () => "What if a marquee strategic (e.g. Microsoft) enters?",
    apply: (base) => {
      // Model the effect of a deep-pocketed strategic entrant: the field
      // narrows to strategics, the anchor moves to the top of the band,
      // and a cash-heavy structure is demanded.
      const head = runInstitutionalValuation(base.company).headline;
      const target = Math.round(base.target * (head.high / head.mid));
      return {
        company: base.company,
        target,
        constraints: { ...base.constraints, preferredBuyerType: "strategic", minCashPct: Math.max(0.8, base.constraints.minCashPct) },
        drivers: [
          "The field narrows to strategic buyers",
          "The target moves to the top of the canonical band",
          "Cash floor rises to at least 80%",
        ],
        assumption: "Models the effect of a deep-pocketed strategic entrant (top-of-band target, strategics only, cash-heavy), not a literal new buyer in the registry.",
      };
    },
  },
  {
    id: "fast90",
    tag: "Speed",
    question: () => "What if I force a 90-day close?",
    apply: (base) => ({
      company: base.company,
      target: base.target,
      constraints: { ...base.constraints, maxTimelineDays: 90 },
      drivers: [
        "Hard 90-day timeline",
        "Buyers with slower historical closes drop out — compare Buyers in set",
        "Speed generally trades price discovery for certainty",
      ],
      assumption: "Filters the pool on historical close speed. A compressed timeline trades price discovery for certainty and de-risks deal fatigue.",
    }),
  },
  {
    id: "peonly",
    tag: "Path",
    question: () => "What if I run a PE-only process?",
    apply: (base) => ({
      company: base.company,
      target: base.target,
      constraints: { ...base.constraints, preferredBuyerType: "pe", minCashPct: Math.min(base.constraints.minCashPct, 0.6) },
      drivers: [
        "Restricts the field to financial sponsors",
        "Cash floor capped at 60% — more rollover or earnout allowed",
        "Sponsors generally price off cash flow rather than synergy — compare the value diff",
      ],
      assumption: "Sponsors price off cash flow, not synergy — expect tighter headlines than a strategic but a cleaner, more predictable process.",
    }),
  },
];

interface Metric { label: string; base: number; scen: number; fmt: (n: number) => string; higherIsBetter: boolean; }

const Simulator: React.FC = () => {
  // The founder's saved intake when there is one; the demo company otherwise.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const canonicalMid = useMemo(() => canonicalValuationFor(company).headline.mid, [company]);
  const [targetUsd,     setTargetUsd]     = useState<number>(Math.round(canonicalMid));
  const [minCashPct,    setMinCashPct]    = useState<number>(0.75);
  const [maxEarnoutPct, setMaxEarnoutPct] = useState<number>(0.15);
  const [maxTimelineDays, setMaxTimelineDays] = useState<number>(180);
  const [preferredType,   setPreferredType]   = useState<BuyerType | "any">("any");
  const [minConfidence,   setMinConfidence]   = useState<"experimental" | "low" | "medium" | "high">("experimental");
  const [activeScenario,  setActiveScenario]  = useState<string>("wait6");
  // Inputs keep the typed text; only values that parse reach the engines.
  const [text, setText] = useState({ target: String(Math.round(canonicalMid / 1e5) / 10), cash: "75", earnout: "15", days: "180" });
  const SPEC = {
    target:  { min: 0.1, max: 1_000_000, scale: 1e6 },
    cash:    { min: 0, max: 100 },
    earnout: { min: 0, max: 100 },
    days:    { min: 1, max: 3650, integer: true },
  } as const;
  const parsed = {
    target: parseNumber(text.target, SPEC.target),
    cash: parseNumber(text.cash, SPEC.cash),
    earnout: parseNumber(text.earnout, SPEC.earnout),
    days: parseNumber(text.days, SPEC.days),
  };
  const onText = (k: keyof typeof text) => (e: React.ChangeEvent<HTMLInputElement>): void => {
    const v = e.target.value;
    setText((t) => ({ ...t, [k]: v }));
    const r = parseNumber(v, SPEC[k]);
    if (!r.ok) return;
    if (k === "target") setTargetUsd(r.value);
    if (k === "cash") setMinCashPct(r.value / 100);
    if (k === "earnout") setMaxEarnoutPct(r.value / 100);
    if (k === "days") setMaxTimelineDays(r.value);
  };
  const Msg: React.FC<{ id: string; k: keyof typeof text; hint?: string }> = ({ id, k, hint }) => {
    const r = parsed[k];
    return <span id={id} className={`mt-1 block text-[12px] ${r.ok ? "text-xo-muted" : "text-xo-risk"}`}>{r.ok ? hint ?? "\u00a0" : `${r.error} The last valid value is used.`}</span>;
  };

  useEffect(() => { emitTelemetry("simulator_viewed", undefined, "/console/simulator"); }, []);

  const baseline = useMemo<Trajectory>(() => simulate(company, targetUsd, {
    minCashPct, maxEarnoutPct, maxTimelineDays, preferredBuyerType: preferredType, minConfidence, targetBuyersToEngage: 5,
  }), [company, targetUsd, minCashPct, maxEarnoutPct, maxTimelineDays, preferredType, minConfidence]);

  const scenario = SCENARIOS.find((s) => s.id === activeScenario) ?? SCENARIOS[0];
  const applied = useMemo(() => scenario.apply(baseline), [scenario, baseline]);
  const variant = useMemo<Trajectory>(
    () => simulate(applied.company, applied.target, applied.constraints),
    [applied],
  );

  const result = baseline.sim;

  const metrics: Metric[] = [
    { label: "Valuation (canonical midpoint)", base: baseline.valuationMid,                     scen: variant.valuationMid,                     fmt: fmtMoney,             higherIsBetter: true },
    { label: "Modelled close probability", base: baseline.sim.expectedCloseProbability,     scen: variant.sim.expectedCloseProbability,     fmt: (n) => `${(n * 100).toFixed(0)}%`, higherIsBetter: true },
    { label: "Best expected value in set", base: baseline.sim.expectedRealizedValueUsd,     scen: variant.sim.expectedRealizedValueUsd,     fmt: fmtMoney,             higherIsBetter: true },
    { label: "Time to cash",         base: baseline.sim.expectedTimeToCashDays,       scen: variant.sim.expectedTimeToCashDays,       fmt: (n) => `${FMT_MS(n)}d`,            higherIsBetter: false },
    { label: "Buyers in set",        base: baseline.sim.recommendedBuyers.length,     scen: variant.sim.recommendedBuyers.length,     fmt: (n) => String(n),                  higherIsBetter: true },
  ];

  const handleScenario = (id: string): void => {
    setActiveScenario(id);
    const s = SCENARIOS.find((x) => x.id === id);
    emitTelemetry("simulator_scenario", { scenario: id, question: s?.question(baseline.company) }, "/console/simulator");
  };

  const tape = useMemo(() => buildMarketTape(), []);
  const LBL = XO_LABEL;
  const INP = XO_INPUT;

  return (
    <div data-page="simulator" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Decision Engine · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`} title="Scenario Engine"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Simulate futures</span></>}
        description={fromIntake ? "Runs on your saved intake." : "Runs on the demo company. Save an intake to simulate your own."} />

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
              <label htmlFor="sim-target" className={LBL}>Target value ($M)</label>
              <input id="sim-target" inputMode="decimal" value={text.target} onChange={onText("target")} aria-invalid={!parsed.target.ok} aria-describedby="sim-target-hint" className={INP} />
              <Msg id="sim-target-hint" k="target" hint={`Canonical midpoint: ${fmtMoney(canonicalMid)} · using ${fmtMoney(targetUsd)}`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sim-cash" className={LBL}>Min cash %</label>
                <input id="sim-cash" inputMode="decimal" value={text.cash} onChange={onText("cash")} aria-invalid={!parsed.cash.ok} aria-describedby="sim-cash-msg" className={INP} />
                <Msg id="sim-cash-msg" k="cash" hint="0–100" />
              </div>
              <div>
                <label htmlFor="sim-earnout" className={LBL}>Max earnout %</label>
                <input id="sim-earnout" inputMode="decimal" value={text.earnout} onChange={onText("earnout")} aria-invalid={!parsed.earnout.ok} aria-describedby="sim-earnout-msg" className={INP} />
                <Msg id="sim-earnout-msg" k="earnout" hint="0–100" />
              </div>
            </div>
            <div>
              <label htmlFor="sim-days" className={LBL}>Max timeline (days)</label>
              <input id="sim-days" inputMode="numeric" value={text.days} onChange={onText("days")} aria-invalid={!parsed.days.ok} aria-describedby="sim-days-hint" className={INP} />
              <Msg id="sim-days-hint" k="days" hint="Outreach + LOI + diligence + close · whole days, 1–3,650" />
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
                <Stat label="Valuation (canonical midpoint)" value={fmtMoney(baseline.valuationMid)} sub="today — the console value" />
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
                    <div className="mt-1 text-[13px] font-medium leading-snug">{s.question(baseline.company)}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Scenario diff */}
          <Section title={scenario.question(baseline.company)} eyebrow="Scenario vs. baseline">
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

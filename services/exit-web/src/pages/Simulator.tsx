import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Field, SectionHeader, fmtMoney, ConfidenceChip, inputCls } from "../lib/ui";
import { runStrategySimulator, type BuyerType } from "@exit/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import { VALUATION_STRATEGIC } from "../lib/engines";
import { emitTelemetry } from "../lib/telemetry";

// Strategy Simulator — inverts the One-Click Exit. Founder enters the
// exit they want; the engine plans the path to it. Reads the same
// outcome-augmented buyer pool that powers Recommendation 2.0, so the
// process structure, close probability, and realized-value forecast
// all reflect tenant-measured + EDGAR/Wikidata-sourced track records.

const BUYER_TYPES: { value: BuyerType | "any"; label: string }[] = [
  { value: "any",           label: "Any" },
  { value: "strategic",     label: "Strategic" },
  { value: "pe",            label: "PE" },
  { value: "vc",            label: "VC (growth)" },
  { value: "family_office", label: "Family office" },
];

const FMT_PCT = (n: number) => `${(n * 100).toFixed(0)}%`;
const FMT_MS  = (n: number) => Math.round(n).toLocaleString();

const Simulator: React.FC = () => {
  const [targetUsd,     setTargetUsd]     = useState<number>(Math.round(VALUATION_STRATEGIC.headline.mid));
  const [minCashPct,    setMinCashPct]    = useState<number>(0.75);
  const [maxEarnoutPct, setMaxEarnoutPct] = useState<number>(0.15);
  const [maxTimelineDays, setMaxTimelineDays] = useState<number>(180);
  const [preferredType,   setPreferredType]   = useState<BuyerType | "any">("any");
  const [minConfidence,   setMinConfidence]   = useState<"experimental" | "low" | "medium" | "high">("experimental");

  useEffect(() => { emitTelemetry("simulator_viewed", undefined, "/console/simulator"); }, []);

  const result = useMemo(() => runStrategySimulator(SAMPLE_COMPANY, {
    targetValueUsd: targetUsd,
    minCashPct,
    maxEarnoutPct,
    maxTimelineDays,
    preferredBuyerType: preferredType,
    minConfidence,
    targetBuyersToEngage: 5,
  }), [targetUsd, minCashPct, maxEarnoutPct, maxTimelineDays, preferredType, minConfidence]);

  const handleSimulate = (): void => {
    emitTelemetry("simulator_run", {
      target: targetUsd, timeline: maxTimelineDays,
      buyerType: preferredType, recommendedCount: result.recommendedBuyers.length,
      expectedClose: result.expectedCloseProbability,
    }, "/console/simulator");
  };

  return (
    <div>
      <SectionHeader
        kicker="Module 10 · Decision Engine"
        title="Strategy Simulator"
        description="Specify the exit you want — target value, consideration mix, timeline, buyer type. The engine returns the buyer set, close probability, time to cash, expected realized value, and a recommended process structure."
        actions={<Button onClick={handleSimulate}>Save scenario</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ── Inputs ──────────────────────────────────────────── */}
        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Founder inputs</div>

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

        {/* ── Outputs ─────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-400">Engine plan</div>
            <p className="mt-3 text-sm text-white/80">{result.summary}</p>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Close probability" value={`${(result.expectedCloseProbability * 100).toFixed(0)}%`} sub={`P(≥1 of ${result.recommendedBuyers.length})`} accent="#34d399" />
              <Stat label="Time to cash"       value={`${FMT_MS(result.expectedTimeToCashDays)}d`} sub="median across set" />
              <Stat label="Expected realized"  value={fmtMoney(result.expectedRealizedValueUsd)} sub="best of set" accent="#34d399" />
              <Stat label="Expected headline"  value={fmtMoney(result.expectedHeadlineUsd)} sub="best LOI of set" />
            </div>
          </Card>

          {result.recommendedBuyers.length > 0 && (
            <Card>
              <div className="border-b border-white/10 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Recommended buyer set
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

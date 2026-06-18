import React, { useState } from "react";
import { Link } from "react-router-dom";
import { fmtMoney, notify } from "../lib/ui";
import { Panel, Frame, CommandHeader, CommandState, Evidence } from "../lib/workstation";
import { READINESS_ANALYSIS } from "../lib/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import { EXIT_SCORE, READINESS_BAND, CURRENT_VALUE_USD, POTENTIAL_VALUE_USD, VALUE_LEFT_USD, READINESS_CATEGORIES } from "../lib/deal-context";

// Exit Readiness Score — the category-defining surface. Not a generic score:
// it ties the readiness number directly to money. Current valuation, the
// score, the valuation after fixes, the value left on the table, and the
// ranked fixes that close the gap — each priced. All from the readiness
// engine (runReadiness + runReadinessAnalysis).

const EFFORT_LABEL: Record<string, string> = { weeks: "~weeks", months: "~months", quarters: "~quarters" };

const Readiness: React.FC = () => {
  const score = EXIT_SCORE;
  const current = CURRENT_VALUE_USD;
  const potential = POTENTIAL_VALUE_USD;
  const left = VALUE_LEFT_USD;
  const upliftPct = current > 0 ? (left / current) * 100 : 0;
  const fixes = [...READINESS_ANALYSIS.weaknesses].sort((a, b) => b.valuationUpliftUsd - a.valuationUpliftUsd);
  const topFix = fixes[0];
  const categories = [...READINESS_CATEGORIES].sort((a, b) => b.impactUsd - a.impactUsd);

  const scoreColor = score >= 70 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  const R = 52;
  const circ = 2 * Math.PI * R;

  // "When to sell" — the monitor signal. ExitOS helps decide *when*, not just
  // run the process. Strong growth + open market window argue for going now;
  // a large, fixable readiness gap argues for two quarters of prep first.
  const growthYoy = SAMPLE_COMPANY.growth.arrGrowthYoyPct;
  const marketGrowth = SAMPLE_COMPANY.market.marketGrowthPct ?? 0;
  const gapRatio = current > 0 ? left / current : 0;
  const growthStrong = growthYoy >= 0.3;
  const marketOpen = marketGrowth >= 0.05;
  const verdict = gapRatio > 0.25
    ? { tone: "#fbbf24", label: "Prepare — don't list yet",
        body: `${fmtMoney(left)} of upside is still fixable. Two to three quarters of prep lifts the headline before you ever run a process.` }
    : growthStrong && marketOpen
      ? { tone: "#34d399", label: "Window open — go",
          body: "Growth and the market window are both working for you. Readiness is high enough — start the process now." }
      : { tone: "#94a3b8", label: "Monitor — hold",
          body: "No urgent catalyst. Keep building and let ExitOS watch the readiness clock for the right moment." };

  const signals = [
    { label: "Readiness", value: `${score.toFixed(0)}/100`, ok: score >= 60 },
    { label: "Growth momentum", value: `${Math.round(growthYoy * 100)}% YoY`, ok: growthStrong },
    { label: "Market window", value: marketOpen ? "Open" : "Tightening", ok: marketOpen },
    { label: "Upside still on table", value: fmtMoney(left), ok: gapRatio <= 0.15 },
  ];

  const [scanning, setScanning] = useState(false);
  const rescore = (): void => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      notify(`Re-scored · ${EXIT_SCORE}/100 (${READINESS_BAND.replace(/_/g, " ")}) — ${READINESS_CATEGORIES.length} categories re-evaluated`);
    }, 700);
  };

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="Readiness Desk"
        title="Exit Readiness"
        tag={READINESS_BAND.replace(/_/g, " ")}
        status={verdict.label}
        meta={[
          { k: "GROWTH", v: `${Math.round(growthYoy * 100)}%` },
          { k: "WINDOW", v: marketOpen ? "Open" : "Tightening" },
          { k: "CATEGORIES", v: categories.length },
        ]}
        metrics={[
          { k: "Readiness", v: `${score.toFixed(0)}/100`, accent: true, sub: READINESS_BAND.replace(/_/g, " ") },
          { k: "Current value", v: fmtMoney(current), sub: "strategic mid, today" },
          { k: "Potential", v: fmtMoney(potential), accent: true, sub: "after fixes" },
          { k: "Value left", v: fmtMoney(left), sub: `+${upliftPct.toFixed(0)}% unclaimed` },
          { k: "Top fix impact", v: topFix ? `+${fmtMoney(topFix.valuationUpliftUsd)}` : "—", sub: topFix?.dimension },
        ]}
      />


      <CommandState
        current={<>Readiness <span className="font-mono text-white">{score.toFixed(0)}/100</span> ({READINESS_BAND.replace(/_/g, " ")}) · value {fmtMoney(current)}</>}
        changes={<>{categories.length} categories scored · {topFix ? `top lever: ${topFix.dimension}` : "all on track"}</>}
        action={topFix ? <>{topFix.recommendation.split(".")[0]} — <span className="font-mono text-white">+{fmtMoney(topFix.valuationUpliftUsd)}</span></> : <>Run the process — readiness is high enough</>}
        outcome={<>Potential <span className="font-mono text-white">{fmtMoney(potential)}</span> · +{fmtMoney(left)} unclaimed ({upliftPct.toFixed(0)}%) · verdict: {verdict.label}</>}
      />

      {/* recommended action + gauge + cascade */}
      <Frame>
        <Panel title="Exit readiness" className="lg:col-span-3"
          right={<button onClick={rescore} disabled={scanning} className="rounded bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/55 ring-1 ring-white/10 hover:text-white disabled:opacity-50">{scanning ? "Re-scoring…" : "Re-score"}</button>}>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle cx="60" cy="60" r={R} fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={`${circ * (1 - score / 100)}`} />
              </svg>
              <div className="absolute text-center">
                <div className="font-mono text-4xl font-bold" style={{ color: scoreColor }}>{score.toFixed(0)}</div>
                <div className="text-[10px] uppercase tracking-wide text-white/40">/ 100</div>
              </div>
            </div>
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-white/60">{READINESS_BAND.replace(/_/g, " ")}</div>
          </div>
        </Panel>

        <Panel title="Value cascade · readiness → money" className="lg:col-span-5"
          foot={topFix ? `Biggest single lever: ${topFix.dimension} · ${EFFORT_LABEL[topFix.effort] ?? topFix.effort} · ${topFix.recommendation.split(".")[0]}.` : undefined}>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <CascadeStat label="Current valuation" value={fmtMoney(current)} sub="strategic mid, today" color="text-white" />
              <CascadeStat label="Potential after fixes" value={fmtMoney(potential)} sub="if the gaps close" color="text-deal-300" arrow />
              <CascadeStat label="Value left" value={fmtMoney(left)} sub={`+${upliftPct.toFixed(0)}% unclaimed`} color="text-loi-300" arrow />
            </div>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/5">
              <div className="flex h-full">
                <div className="h-full bg-gradient-to-r from-deal-700 to-deal-400" style={{ width: `${(current / potential) * 100}%` }} />
                <div className="h-full bg-loi-500/50" style={{ width: `${(left / potential) * 100}%` }} />
              </div>
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-white/45">
              <span>Captured · {fmtMoney(current)}</span>
              <span className="text-loi-300">Unclaimed · {fmtMoney(left)}</span>
            </div>
          </div>
        </Panel>

        <Panel title="When to sell · monitor signal" className="lg:col-span-4">
          <div className="p-4">
            <div className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-bold" style={{ background: `${verdict.tone}1f`, color: verdict.tone }}>
              <span className="h-2 w-2 rounded-full" style={{ background: verdict.tone }} /> {verdict.label}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-white/65">{verdict.body}</p>
            <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md bg-white/10">
              {signals.map((s) => (
                <div key={s.label} className="bg-ink-900 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.ok ? "bg-deal-400" : "bg-loi-400"}`} />
                    <span className="text-[9px] uppercase tracking-wide text-white/40">{s.label}</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[13px] font-semibold text-white">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </Frame>

      {/* category scorecard with priced fixes */}
      <Frame>
        <Panel title="Exit Readiness AI · Value Impact Simulator" className="lg:col-span-12"
          right={<span className="font-mono text-[10px] text-deal-300">total upside +{fmtMoney(left)}</span>}
          foot={`Scored across the ten categories buyers underwrite — every fix priced. ${READINESS_ANALYSIS.headline}`}>
          <div className="divide-y divide-white/5">
            {categories.map((cat) => {
              const c = cat.score >= 75 ? "#34d399" : cat.score >= 50 ? "#fbbf24" : "#f87171";
              return (
                <div key={cat.key} className="grid items-center gap-4 px-3 py-2 sm:grid-cols-[160px_1fr_130px]">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[18px] font-bold" style={{ color: c }}>{cat.score}</span>
                    <span className="text-[12px] font-semibold text-white">{cat.label}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${Math.max(2, cat.score)}%`, background: c }} /></div>
                    <p className="mt-1 text-[11.5px] leading-snug text-white/55">{cat.fix}</p>
                  </div>
                  <div className="text-right">
                    {cat.impactUsd > 0
                      ? <Evidence meta={{ methodology: cat.fix, source: "readiness engine · value-impact simulator", confidence: `${cat.score}/100 category score` }}><span className="font-mono text-[14px] font-bold text-deal-300">+{fmtMoney(cat.impactUsd)}</span></Evidence>
                      : <span className="text-[11px] font-semibold text-deal-300">On track ✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </Frame>

      <div className="flex flex-wrap gap-2 px-1">
        <Link to="/console/valuation" className="rounded-md bg-deal-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-deal-500">See the valuation model →</Link>
        <Link to="/console/data-room" className="rounded-md border border-white/15 px-4 py-2 text-[13px] font-semibold text-white/80 transition hover:bg-white/5">Close the gaps in the data room</Link>
      </div>
    </div>
  );
};

const CascadeStat: React.FC<{ label: string; value: string; sub: string; color: string; arrow?: boolean }> = ({ label, value, sub, color, arrow }) => (
  <div className="relative">
    {arrow && <span className="absolute -left-3 top-4 hidden text-white/20 sm:block">→</span>}
    <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
    <div className={`mt-1 font-mono text-2xl font-bold ${color}`}>{value}</div>
    <div className="mt-0.5 text-[11px] text-white/45">{sub}</div>
  </div>
);

export default Readiness;

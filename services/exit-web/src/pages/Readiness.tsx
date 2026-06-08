import React from "react";
import { Link } from "react-router-dom";
import { Button, Card, SectionHeader, fmtMoney } from "../lib/ui";
import { READINESS, READINESS_ANALYSIS } from "../lib/engines";
import { SAMPLE_COMPANY } from "../lib/profile";

// Exit Readiness Score — the category-defining surface. Not a generic score:
// it ties the readiness number directly to money. Current valuation, the
// score, the valuation after fixes, the value left on the table, and the
// ranked fixes that close the gap — each priced. All from the readiness
// engine (runReadiness + runReadinessAnalysis).

const EFFORT_LABEL: Record<string, string> = { weeks: "~weeks", months: "~months", quarters: "~quarters" };
const SEV_DOT: Record<string, string> = { high: "bg-red-400", medium: "bg-loi-400", low: "bg-white/40" };

const Readiness: React.FC = () => {
  const score = READINESS.overallScore;
  const current = READINESS_ANALYSIS.currentStrategicMid;
  const potential = READINESS_ANALYSIS.projectedStrategicMid;
  const left = Math.max(0, potential - current);
  const upliftPct = current > 0 ? (left / current) * 100 : 0;
  const fixes = [...READINESS_ANALYSIS.weaknesses].sort((a, b) => b.valuationUpliftUsd - a.valuationUpliftUsd);
  const topFix = fixes[0];

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

  return (
    <div>
      <SectionHeader
        kicker="Prepare · Exit readiness"
        title="Exit Readiness Score"
        description="One number that tells you what your company is worth today, what it could be worth, and exactly what to fix to close the gap — every fix priced in dollars."
        actions={<Button>Re-score</Button>}
      />

      {/* ── Recommended action lead ──────────────────────────────── */}
      {topFix && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-deal-500/40 bg-gradient-to-r from-deal-600/15 to-transparent">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-deal-300">Recommended action</div>
              <div className="mt-1 text-lg font-semibold text-white">{topFix.recommendation.split(".")[0]}.</div>
              <div className="mt-0.5 text-[12px] text-white/55">Biggest single lever: {topFix.dimension} · {EFFORT_LABEL[topFix.effort] ?? topFix.effort}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide text-white/40">Estimated impact</div>
              <div className="font-mono text-2xl font-bold text-deal-300">+{fmtMoney(topFix.valuationUpliftUsd)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Score + money cascade ────────────────────────────────── */}
      <Card className="p-6">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* gauge */}
          <div className="flex flex-col items-center justify-center border-b border-white/10 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Exit readiness</div>
            <div className="relative mt-3 flex h-40 w-40 items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle cx="60" cy="60" r={R} fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${circ}`} strokeDashoffset={`${circ * (1 - score / 100)}`} />
              </svg>
              <div className="absolute text-center">
                <div className="font-mono text-4xl font-bold" style={{ color: scoreColor }}>{score.toFixed(0)}</div>
                <div className="text-[10px] uppercase tracking-wide text-white/40">/ 100</div>
              </div>
            </div>
            <div className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-white/60">{READINESS.band.replace(/_/g, " ")}</div>
          </div>

          {/* money cascade */}
          <div className="flex flex-col justify-center">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <CascadeStat label="Current valuation" value={fmtMoney(current)} sub="strategic mid, today" color="text-white" />
              <CascadeStat label="Potential after fixes" value={fmtMoney(potential)} sub="if the gaps close" color="text-deal-300" arrow />
              <CascadeStat label="Value left on the table" value={fmtMoney(left)} sub={`+${upliftPct.toFixed(0)}% upside unclaimed`} color="text-loi-300" arrow />
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/5">
              <div className="flex h-full">
                <div className="h-full bg-gradient-to-r from-deal-700 to-deal-400" style={{ width: `${(current / potential) * 100}%` }} />
                <div className="h-full bg-loi-500/50" style={{ width: `${(left / potential) * 100}%` }} />
              </div>
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-white/45">
              <span>Captured today · {fmtMoney(current)}</span>
              <span className="text-loi-300">Unclaimed · {fmtMoney(left)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── When to sell (monitor signal) ────────────────────────── */}
      <Card className="mt-8 p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div className="border-b border-white/10 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">When to sell</div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold" style={{ background: `${verdict.tone}1f`, color: verdict.tone }}>
              <span className="h-2 w-2 rounded-full" style={{ background: verdict.tone }} /> {verdict.label}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/65">{verdict.body}</p>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Timing signals</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {signals.map((s) => (
                <div key={s.label} className="rounded-lg border border-white/10 bg-ink-900/40 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.ok ? "bg-deal-400" : "bg-loi-400"}`} />
                    <span className="text-[10px] uppercase tracking-wide text-white/40">{s.label}</span>
                  </div>
                  <div className="mt-1 font-mono text-base font-semibold text-white">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Ranked fixes ─────────────────────────────────────────── */}
      <div className="mt-8 flex items-end justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-white">Recommended fixes</h2>
          <p className="text-xs text-white/45">Ranked by the dollars each one adds to the headline. {READINESS_ANALYSIS.headline}</p>
        </div>
        <div className="text-right text-[11px]">
          <div className="uppercase tracking-[0.2em] text-white/40">Total upside</div>
          <div className="font-mono text-lg font-bold text-deal-300">+{fmtMoney(left)}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {fixes.map((f, i) => (
          <Card key={f.dimension} className="p-5">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 font-mono text-[12px] font-bold text-white/70 ring-1 ring-white/15">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${SEV_DOT[f.severity]}`} />
                    <span className="text-[13px] font-bold text-white">{f.dimension}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/45 ring-1 ring-white/10">{EFFORT_LABEL[f.effort] ?? f.effort}</span>
                  </div>
                  <span className="font-mono text-base font-bold text-deal-300">+{fmtMoney(f.valuationUpliftUsd)}</span>
                </div>
                <p className="mt-1.5 text-[12.5px] text-white/55">{f.weakness}</p>
                <p className="mt-1 text-[13px] text-white/80">→ {f.recommendation}</p>
              </div>
            </div>
          </Card>
        ))}
        {fixes.length === 0 && (
          <Card className="p-6 text-sm text-white/55">No material gaps — readiness is strong. Run the process.</Card>
        )}
      </div>

      {/* ── Dimension breakdown ──────────────────────────────────── */}
      <Card className="mt-8 p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Score breakdown</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {READINESS.dimensions.map((d) => {
            const c = d.score >= 70 ? "#34d399" : d.score >= 50 ? "#fbbf24" : "#f87171";
            return (
              <div key={d.name}>
                <div className="mb-1 flex items-baseline justify-between text-[12px]">
                  <span className="text-white/70">{d.name}</span>
                  <span className="font-mono" style={{ color: c }}>{d.score.toFixed(0)}/100</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(2, d.score)}%`, background: c }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/console/valuation" className="rounded-md bg-deal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-deal-500">See the valuation model →</Link>
          <Link to="/console/data-room" className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5">Close the gaps in the data room</Link>
        </div>
      </Card>
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

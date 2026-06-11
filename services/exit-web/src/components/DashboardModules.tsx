import React from "react";
import { Card, fmtMoney } from "../lib/ui";
import { CURRENT_VALUE_USD, POTENTIAL_VALUE_USD, DEAL_BUYERS, ACTIVE_BUYERS, DEMAND_LABEL } from "../lib/deal-context";

// Founder-dashboard market modules. Personal, actionable views of the founder's
// position: how liquid the market is for them, where demand is hottest, who's
// looking right now, what the company is worth on each path, and the odds
// through the funnel. Company-side numbers are engine-derived; market-scale and
// activity figures are illustrative in demo mode.

// ── Liquidity Score ───────────────────────────────────────────────
export const LiquidityScore: React.FC = () => {
  const score = Math.min(98, 70 + ACTIVE_BUYERS * 4);
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";
  return (
    <Card className="p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Market liquidity</div>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-mono text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="mb-1 text-sm text-white/45">/ 100</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <p className="mt-3 text-[12.5px] text-white/60">
        {DEMAND_LABEL === "High" ? "Buyer demand is higher than supply — a seller's market for your profile." : "Balanced demand — a clean process still clears."}
      </p>
    </Card>
  );
};

// ── Acquisition Heat Map ──────────────────────────────────────────
const HEAT: { country: string; score: number }[] = [
  { country: "United States", score: 96 },
  { country: "Germany", score: 88 },
  { country: "United Kingdom", score: 84 },
  { country: "Canada", score: 82 },
  { country: "Singapore", score: 78 },
];
export const AcquisitionHeatMap: React.FC = () => (
  <Card className="p-6">
    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Acquisition heat map</div>
    <p className="mt-1 text-[11px] text-white/40">Where demand for your profile concentrates</p>
    <div className="mt-4 space-y-2.5">
      {HEAT.map((h) => (
        <div key={h.country}>
          <div className="flex items-baseline justify-between text-[12px]">
            <span className="text-white/75">{h.country}</span>
            <span className="font-mono text-white/85">{h.score}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-deal-700 to-deal-400" style={{ width: `${h.score}%` }} />
          </div>
        </div>
      ))}
    </div>
  </Card>
);

// ── Live Buyer Activity ───────────────────────────────────────────
const ACTIONS = ["viewed your profile", "requested metrics", "opened the teaser", "re-opened the data room"];
export const LiveBuyerActivity: React.FC = () => {
  const feed = DEAL_BUYERS.slice(0, 4).map((c, i) => ({
    name: c.buyer.name,
    action: ACTIONS[i % ACTIONS.length],
    when: ["7 mins ago", "14 mins ago", "22 mins ago", "41 mins ago"][i] ?? "1h ago",
  }));
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <span className="relative inline-flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-deal-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-deal-400" /></span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Live buyer activity</span>
      </div>
      <ul className="mt-4 space-y-3">
        {feed.map((f, i) => (
          <li key={i} className="flex items-start justify-between gap-3">
            <div className="text-[13px] leading-snug text-white/80"><span className="font-semibold text-white">{f.name}</span> {f.action}</div>
            <span className="shrink-0 text-[11px] text-white/40">{f.when}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

// ── Valuation Scenarios ───────────────────────────────────────────
export const ValuationScenarios: React.FC = () => {
  const scenarios = [
    { label: "Sell today", value: CURRENT_VALUE_USD, sub: "current strategic mid", color: "text-white" },
    { label: "Optimize 6 months", value: POTENTIAL_VALUE_USD, sub: "after the readiness fixes", color: "text-deal-300" },
    { label: "Optimize 12 months", value: Math.round(POTENTIAL_VALUE_USD * 1.27), sub: "fixes + a year of growth", color: "text-deal-300" },
  ];
  return (
    <Card className="p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Valuation scenarios</div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {scenarios.map((s, i) => (
          <div key={s.label} className="relative rounded-lg border border-white/10 bg-ink-900/40 p-4">
            {i > 0 && <span className="absolute -left-3 top-1/2 hidden -translate-y-1/2 text-white/20 sm:block">→</span>}
            <div className="text-[11px] uppercase tracking-wide text-white/45">{s.label}</div>
            <div className={`mt-1 font-mono text-2xl font-bold ${s.color}`}>{fmtMoney(s.value)}</div>
            <div className="mt-0.5 text-[11px] text-white/40">{s.sub}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ── Probability Funnel ────────────────────────────────────────────
const FUNNEL: { label: string; n: number; w: number }[] = [
  { label: "Buyers in network", n: 58_341, w: 100 },
  { label: "Qualified", n: 3_421, w: 80 },
  { label: "Interested", n: 842, w: 62 },
  { label: "Engaged", n: 72, w: 46 },
  { label: "In diligence", n: 18, w: 32 },
  { label: "Offers", n: 5, w: 20 },
  { label: "Closed", n: 1, w: 12 },
];
export const ProbabilityFunnel: React.FC = () => (
  <Card className="p-6">
    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Probability funnel</div>
    <p className="mt-1 text-[11px] text-white/40">From the buyer network to a closed deal</p>
    <div className="mt-4 space-y-1.5">
      {FUNNEL.map((s, i) => {
        const c = i === FUNNEL.length - 1 ? "#34d399" : i >= FUNNEL.length - 3 ? "#fbbf24" : "#60a5fa";
        return (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-right text-[12px] text-white/60">{s.label}</div>
            <div className="flex-1">
              <div className="flex h-7 items-center rounded-md px-3 font-mono text-[12px] font-semibold text-ink-900" style={{ width: `${s.w}%`, background: c }}>
                {s.n.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
    <p className="mt-3 text-[11px] text-white/40">Network-scale figures are illustrative in demo mode.</p>
  </Card>
);

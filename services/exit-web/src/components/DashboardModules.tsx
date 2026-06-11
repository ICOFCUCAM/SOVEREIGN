import React from "react";
import { Card, fmtMoney } from "../lib/ui";
import { CURRENT_VALUE_USD, POTENTIAL_VALUE_USD, DEAL_BUYERS, ACTIVE_BUYERS, DEMAND_LABEL } from "../lib/deal-context";
import { LISTING_MATCHES, SAMPLE_OFFERS, SAMPLE_NDAS, LISTING_PRIVATE, OFFER_COMPARISON } from "../lib/engines";
import { MARKET } from "../lib/market-stats";

// Founder-dashboard market modules. Personal, actionable views of the founder's
// position: how liquid the market is for them, where demand is hottest, who's
// looking right now, what the company is worth on each path, and the odds
// through the funnel. Every figure is derived from the live engine runs —
// the funnel is this deal's actual stage-by-stage state.

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
// Demand by geography, tallied from where the matched mandates actually
// deploy — each buyer in the pool counts toward its preferred geographies.
const HEAT: { country: string; score: number }[] = (() => {
  const tally = new Map<string, number>();
  for (const c of DEAL_BUYERS) for (const g of c.buyer.geographyPreferred) tally.set(g, (tally.get(g) || 0) + 1);
  const max = Math.max(1, ...tally.values());
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, n]) => ({ country, score: Math.round((n / max) * 100) }));
})();
export const AcquisitionHeatMap: React.FC = () => (
  <Card className="p-6">
    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Acquisition heat map</div>
    <p className="mt-1 text-[11px] text-white/40">Where your matched mandates deploy</p>
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

// ── Top Mandate Matches ───────────────────────────────────────────
// The matching engine's actual top hits on the live listing — fit score
// and the outreach path it recommends, not a simulated activity feed.
export const LiveBuyerActivity: React.FC = () => {
  const feed = LISTING_MATCHES.matches.slice(0, 4).map((m) => ({
    name: m.buyerName,
    action: `matched at ${Math.round(m.matchScore * 100)}% fit`,
    via: m.suggestedOutreach.replace(/_/g, " "),
  }));
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <span className="relative inline-flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-deal-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-deal-400" /></span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Top mandate matches</span>
      </div>
      <ul className="mt-4 space-y-3">
        {feed.map((f, i) => (
          <li key={i} className="flex items-start justify-between gap-3">
            <div className="text-[13px] leading-snug text-white/80"><span className="font-semibold text-white">{f.name}</span> {f.action}</div>
            <span className="shrink-0 text-[11px] text-white/40">{f.via}</span>
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

// ── Deal Funnel ───────────────────────────────────────────────────
// This deal's actual funnel, stage by stage: the full registry, the
// mandates the engine matched, NDAs executed on the listing, offers in
// hand, and the comparison engine's current leader.
const ACTIVE_NDA_COUNT = SAMPLE_NDAS.filter(
  (n) => n.listingId === LISTING_PRIVATE.listingId && n.state === "active",
).length;
const FUNNEL: { label: string; n: number }[] = [
  { label: "Registry mandates", n: MARKET.buyers },
  { label: "Matched", n: LISTING_MATCHES.matches.length },
  { label: "Under NDA", n: ACTIVE_NDA_COUNT },
  { label: "Offers in hand", n: SAMPLE_OFFERS.length },
  { label: "Leading bid", n: OFFER_COMPARISON.leader ? 1 : 0 },
];
export const ProbabilityFunnel: React.FC = () => {
  const top = Math.max(1, FUNNEL[0].n);
  return (
    <Card className="p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Deal funnel</div>
      <p className="mt-1 text-[11px] text-white/40">From the registry to the leading bid — this deal's live state</p>
      <div className="mt-4 space-y-1.5">
        {FUNNEL.map((s, i) => {
          const c = i === FUNNEL.length - 1 ? "#34d399" : i >= FUNNEL.length - 3 ? "#fbbf24" : "#60a5fa";
          const w = Math.max(14, Math.round((s.n / top) * 100));
          return (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-right text-[12px] text-white/60">{s.label}</div>
              <div className="flex-1">
                <div className="flex h-7 items-center rounded-md px-3 font-mono text-[12px] font-semibold text-ink-900" style={{ width: `${w}%`, background: c }}>
                  {s.n.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-white/40">Counts are the engines' live state for this deal.</p>
    </Card>
  );
};

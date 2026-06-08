import React from "react";
import { Card, Kpi, SectionHeader, fmtMoney } from "../lib/ui";
import BankerTake from "../components/BankerTake";
import { VALUATION_STRATEGIC, READINESS_ANALYSIS, BUYERS } from "../lib/engines";
import { SAMPLE_COMPANY } from "../lib/profile";

// Exit Timing Engine — most founders don't know *when* to sell. The engine
// monitors the market signals that move valuation (multiples, deal activity,
// competitor exits, rates, buyer demand) alongside the company's own
// trajectory, then recommends an optimal exit window and the value of waiting.
// Market signals are illustrative in demo mode; the company-side projection
// comes from the readiness + valuation engines.

type Impact = "tailwind" | "headwind" | "neutral";
const IMPACT_STYLE: Record<Impact, { color: string; label: string }> = {
  tailwind: { color: "#34d399", label: "Tailwind" },
  headwind: { color: "#f87171", label: "Headwind" },
  neutral:  { color: "#94a3b8", label: "Neutral" },
};

const EFFORT_MONTHS: Record<string, number> = { weeks: 2, months: 6, quarters: 9 };

const ExitTiming: React.FC = () => {
  const current = VALUATION_STRATEGIC.headline.mid;
  const potential = READINESS_ANALYSIS.projectedStrategicMid;
  const upliftPct = current > 0 ? Math.round((potential / current - 1) * 100) : 0;
  const growthYoy = SAMPLE_COMPANY.growth.arrGrowthYoyPct;
  const activeBuyers = BUYERS.candidates.filter((c) => c.buyer.appetite === "active").length;
  const dealCount = Math.min(40, BUYERS.candidates.reduce((s, c) => s + c.history.totalDeals, 0));

  // window to optimal exit — time to mature the highest-effort fixes
  const monthsToReady = Math.max(3, ...READINESS_ANALYSIS.weaknesses.map((w) => EFFORT_MONTHS[w.effort] ?? 6));
  const windowLo = Math.max(2, monthsToReady - 2);
  const windowHi = monthsToReady + 4;
  const sweet = monthsToReady;

  const signals: { label: string; value: string; trend: string; impact: Impact; note: string }[] = [
    { label: "Industry multiples", value: "3.4× revenue", trend: "+11% YoY", impact: "tailwind", note: "Sector multiples expanding as logistics-tech consolidates." },
    { label: "Acquisition activity", value: `${dealCount} deals / 12mo`, trend: "elevated", impact: "tailwind", note: "Strategics and sponsors are both active in the sector." },
    { label: "Competitor exits", value: "6 recent", trend: "rising", impact: "tailwind", note: "Comparable assets clearing at premium multiples." },
    { label: "Interest rates", value: "5.0%", trend: "easing expected", impact: "neutral", note: "Cheaper debt would lift sponsor bids into next year." },
    { label: "Buyer demand", value: `${activeBuyers} in acquisition mode`, trend: "high", impact: "tailwind", note: "Active acquirers match your profile right now." },
    { label: "Your trajectory", value: `${Math.round(growthYoy * 100)}% ARR growth`, trend: "compounding", impact: "tailwind", note: "Each quarter lifts the headline into a higher band." },
  ];
  const tailwinds = signals.filter((s) => s.impact === "tailwind").length;

  return (
    <div>
      <SectionHeader
        kicker="Prepare · Monitor"
        title="Exit Timing Engine"
        description="Most founders don't know when to sell. The engine reads industry multiples, acquisition activity, competitor exits, rates and buyer behavior — alongside your own trajectory — and tells you the optimal window and the cost of mistiming it."
      />

      <BankerTake
        next={<>Prepare now and target a sale in <span className="text-white">months {windowLo}–{windowHi}</span> — as the readiness gap closes and multiples hold.</>}
        stake={<>Waiting to the window projects <span className="font-mono font-bold text-deal-300">+{upliftPct}%</span> · {fmtMoney(current)} → {fmtMoney(potential)}.</>}
        inaction={<>Selling today leaves the readiness gap unclaimed; waiting too long risks the multiple cycle turning.</>}
        buyer={<><span className="text-white">{tailwinds} of {signals.length}</span> market signals are tailwinds — conditions favor a near-term process.</>}
        automate={<>ExitOS monitors the market continuously and pings you when the window opens.</>}
        impact={<>+{upliftPct}%</>}
        cta={{ label: "See readiness fixes", to: "/console/readiness" }}
      />

      {/* ── Verdict ──────────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="border-b border-white/10 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-400">Recommended window</div>
            <div className="mt-2 font-serif text-3xl font-bold text-white">Months {windowLo}–{windowHi}</div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/60">
              Delaying <span className="text-white">~{sweet} months</span> to close the readiness gap projects a{" "}
              <span className="font-mono font-semibold text-deal-300">+{upliftPct}%</span> valuation lift —{" "}
              {fmtMoney(current)} today to {fmtMoney(potential)} at the window.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-ink-900/40 p-3">
                <div className="text-[10px] uppercase tracking-wide text-white/40">Sell today</div>
                <div className="font-mono text-xl font-bold text-white/80">{fmtMoney(current)}</div>
              </div>
              <div className="rounded-lg border border-deal-500/30 bg-deal-600/[0.07] p-3">
                <div className="text-[10px] uppercase tracking-wide text-deal-300">Sell at window</div>
                <div className="font-mono text-xl font-bold text-deal-300">{fmtMoney(potential)}</div>
              </div>
            </div>
          </div>

          {/* timeline */}
          <div className="flex flex-col justify-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Timing curve</div>
            <div className="mt-6 relative h-2 rounded-full bg-white/10">
              {/* optimal window band */}
              <div className="absolute h-full rounded-full bg-deal-500/40"
                style={{ left: `${(windowLo / (windowHi + 6)) * 100}%`, width: `${((windowHi - windowLo) / (windowHi + 6)) * 100}%` }} />
              {/* sweet spot marker */}
              <div className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-ink-800 bg-deal-400"
                style={{ left: `${(sweet / (windowHi + 6)) * 100}%` }} />
              {/* now marker */}
              <div className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-ink-800 bg-white/50" style={{ left: "0%" }} />
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-white/45">
              <span>Now · {fmtMoney(current)}</span>
              <span className="text-deal-300">Optimal window</span>
              <span>+{windowHi + 6}mo</span>
            </div>
            <p className="mt-5 text-[12.5px] leading-relaxed text-white/55">
              Sell too early and you leave the readiness gap on the table. Sell too late and you risk the multiple
              cycle turning. The window balances both.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Optimal window" value={`${windowLo}–${windowHi}mo`} sub="to start the process" accent="#34d399" />
        <Kpi label="Projected uplift" value={`+${upliftPct}%`} sub="value of waiting" accent="#34d399" />
        <Kpi label="Market signals" value={`${tailwinds}/${signals.length}`} sub="tailwinds" />
        <Kpi label="Buyers circling" value={String(activeBuyers)} sub="in acquisition mode" />
      </div>

      {/* ── Market signals ───────────────────────────────────────── */}
      <h2 className="mt-10 mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Market signals monitored</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {signals.map((s) => {
          const st = IMPACT_STYLE[s.impact];
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{s.label}</div>
                <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide" style={{ background: `${st.color}1f`, color: st.color }}>{st.label}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-xl font-bold text-white">{s.value}</span>
                <span className="text-[12px]" style={{ color: st.color }}>{s.trend}</span>
              </div>
              <p className="mt-2 text-[12px] leading-snug text-white/55">{s.note}</p>
            </Card>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] text-white/40">Market signals are illustrative in demo mode; the company-side projection is computed from the readiness and valuation engines.</p>
    </div>
  );
};

export default ExitTiming;

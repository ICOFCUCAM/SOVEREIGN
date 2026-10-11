import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { fmtMoney } from "../lib/ui";
import { MarketTape } from "../lib/workstation";
import { PageHeader, Section, Metric, Provenance } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { runBuyerDiscovery, runReadiness, runReadinessAnalysis, runValuation } from "@exit/engines";
import { dealContextFor } from "../lib/deal-context";
import { loadActiveCompany } from "../lib/active-company";
import { DEAL_INTEL_FMT, sectorEventCount } from "../lib/market-stats";

// Exit Timing Engine — most founders don't know *when* to sell. The engine
// monitors the market signals that move valuation (multiples, deal activity,
// competitor exits, deal velocity, buyer demand) alongside the company's own
// trajectory, then recommends an optimal exit window and the value of waiting.
// Every signal is computed from the valuation engine, the discovery pool and
// the source-referenced acquisition history.

type Impact = "tailwind" | "headwind" | "neutral";
const IMPACT_STYLE: Record<Impact, { cls: string; glyph: string; label: string }> = {
  tailwind: { cls: "text-xo-verified", glyph: "▲", label: "Tailwind" },
  headwind: { cls: "text-xo-risk", glyph: "▼", label: "Headwind" },
  neutral:  { cls: "text-xo-muted", glyph: "■", label: "Neutral" },
};

const EFFORT_MONTHS: Record<string, number> = { weeks: 2, months: 6, quarters: 9 };

const ExitTiming: React.FC = () => {
  // The founder's saved intake when there is one, else the demo company.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const { ctx, analysis, buyers, standard } = useMemo(() => ({
    ctx: dealContextFor(company),
    analysis: runReadinessAnalysis(company, runReadiness(company)),
    buyers: runBuyerDiscovery(company, { limit: 12 }),
    standard: runValuation(company, { reportType: "standard" }),
  }), [company]);
  const current = ctx.currentValueUsd;
  const potential = ctx.potentialValueUsd;
  const upliftPct = current > 0 ? Math.round((potential / current - 1) * 100) : 0;
  const growthYoy = company.growth.arrGrowthYoyPct;
  const activeBuyers = buyers.candidates.filter((c) => c.buyer.appetite === "active").length;
  const dealCount = Math.min(40, buyers.candidates.reduce((s, c) => s + c.history.totalDeals, 0));

  // window to optimal exit — time to mature the highest-effort fixes
  const monthsToReady = Math.max(3, ...analysis.weaknesses.map((w) => EFFORT_MONTHS[w.effort] ?? 6));
  const windowLo = Math.max(2, monthsToReady - 2);
  const windowHi = monthsToReady + 4;
  const sweet = monthsToReady;

  // ── Multi-year readiness timeline ────────────────────────────
  // Score climbs as fixes mature (~+25 then +43 from base); value compounds
  // ~30%/yr (ARR growth tempered + the readiness lift).
  const baseYear = new Date().getFullYear();
  const yearScores = [ctx.exitScore, ctx.exitScore + 22, ctx.exitScore + 38].map((s) => Math.min(95, Math.round(s)));
  const timeline = [0, 1, 2].map((i) => ({
    year: baseYear + i,
    score: yearScores[i],
    value: Math.round(current * Math.pow(1.3, i)),
  }));
  const windowIdx = yearScores.findIndex((s) => s >= 85);
  const windowRow = timeline[windowIdx === -1 ? timeline.length - 1 : windowIdx];

  const revMult = standard.methodologies.find((m) => m.multiple != null);
  const sectorExits = sectorEventCount(company.sector);
  const signals: { label: string; value: string; trend: string; impact: Impact; note: string }[] = [
    { label: "Industry multiples", value: revMult ? `${revMult.multiple?.toFixed(1)}× ${revMult.basis.toLowerCase().includes("ebitda") ? "EBITDA" : "revenue"}` : "—", trend: "engine mid-band", impact: "tailwind", note: `From the valuation engine's ${revMult?.name.toLowerCase() ?? "multiples"} methodology on your numbers.` },
    { label: "Acquisition activity", value: `${dealCount} tracked deals`, trend: "measured", impact: "tailwind", note: "Strategics and sponsors are both active in the sector." },
    { label: "Sector exits", value: `${sectorExits} on record`, trend: DEAL_INTEL_FMT.medianPremium + " median premium", impact: sectorExits > 0 ? "tailwind" : "neutral", note: "Comparable assets in your sector from the source-referenced history." },
    { label: "Deal velocity", value: DEAL_INTEL_FMT.medianClose, trend: "announce → close", impact: "neutral", note: "Median time from announcement to close across tracked deals." },
    { label: "Buyer demand", value: `${activeBuyers} in acquisition mode`, trend: "high", impact: "tailwind", note: "Active acquirers match your profile right now." },
    { label: "Your trajectory", value: `${Math.round(growthYoy * 100)}% ARR growth`, trend: "compounding", impact: "tailwind", note: "Each quarter lifts the headline into a higher band." },
  ];
  const tailwinds = signals.filter((s) => s.impact === "tailwind").length;
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="exit-timing" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={fromIntake ? `◉ Timing Desk · Your intake: ${company.name}` : `◉ Timing Desk · Demo company: ${company.name}`} title="Exit Timing"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Monitor · {tailwinds}/{signals.length} tailwinds</span></>}>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-xo-line pt-2">
          {([["Growth", `${Math.round(growthYoy * 100)}%`], ["Buyers circling", String(activeBuyers)]] as const).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5"><dt className="text-[11px] text-xo-faint">{k}</dt><dd className="font-mono text-[12px] font-semibold tabular-nums">{v}</dd></div>
          ))}
        </dl>
      </PageHeader>

      <section aria-label="Timing summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-3 xl:grid-cols-6">
        <div className="bg-xo-panel"><Metric label="Optimal window" emphasis value={`${windowLo}–${windowHi}mo`} sub="to start" /></div>
        <div className="bg-xo-panel"><Metric label="Projected uplift" value={<span className="text-xo-verified">+{upliftPct}%</span>} sub="value of waiting" /></div>
        <div className="bg-xo-panel"><Metric label="Sell today" value={fmtMoney(current)} sub="enterprise value today" /></div>
        <div className="bg-xo-panel"><Metric label="Sell at window" value={<span className="text-xo-verified">{fmtMoney(potential)}</span>} sub={`Q2 ${windowRow.year}`} /></div>
        <div className="bg-xo-panel"><Metric label="Market signals" value={`${tailwinds}/${signals.length}`} sub="tailwinds" /></div>
        <div className="bg-xo-panel"><Metric label="Buyers circling" value={String(activeBuyers)} sub="acquisition mode" /></div>
      </section>

      <MarketTape items={tape} />

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
        right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">+{upliftPct}%</span>}>
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">Prepare now and target a sale in <span className="font-semibold">months {windowLo}–{windowHi}</span> — as the readiness gap closes and multiples hold.</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="Today">Sell-today <span className="font-mono">{fmtMoney(current)}</span> · growth {Math.round(growthYoy * 100)}% · {tailwinds >= signals.length / 2 ? "conditions favourable" : "mixed conditions"}</TakeCell>
            <TakeCell k="At stake">Waiting to the window projects <span className="font-mono font-semibold text-xo-verified">+{upliftPct}%</span> · {fmtMoney(current)} → {fmtMoney(potential)}.</TakeCell>
            <TakeCell k="If you wait">Selling today leaves the readiness gap unclaimed; waiting too long risks the multiple cycle turning.</TakeCell>
            <TakeCell k="Signals">{tailwinds} of {signals.length} market signals are tailwinds — conditions favor a near-term process.</TakeCell>
            <TakeCell k="ExitOS does it">ExitOS monitors the market continuously and pings you when the window opens.</TakeCell>
            <TakeCell k="Outcome">At the window <span className="font-mono">{fmtMoney(potential)}</span> · +{upliftPct}% value of waiting · Q2 {windowRow.year}</TakeCell>
          </dl>
          <Link to="/console/readiness" className="mt-3 inline-block rounded-sm bg-deal-700 px-4 py-2 text-[13px] font-semibold text-white hover:bg-deal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">See readiness fixes →</Link>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Recommended window" className="lg:col-span-5"
          foot="Sell too early and you leave the readiness gap on the table; too late and you risk the multiple cycle turning. The window balances both.">
          <div className="px-4 py-4">
            <p className="font-mono text-[28px] font-semibold tabular-nums">Months {windowLo}–{windowHi}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-xo-muted">
              Delaying <span className="text-xo-text">~{sweet} months</span> to close the readiness gap projects a{" "}
              <span className="font-mono font-semibold text-xo-verified">+{upliftPct}%</span> lift — {fmtMoney(current)} → {fmtMoney(potential)}.
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-px bg-xo-line">
              <div className="bg-xo-panel px-3 py-2"><dt className="text-[11px] text-xo-faint">Sell today</dt><dd className="font-mono text-[17px] font-semibold tabular-nums">{fmtMoney(current)}</dd></div>
              <div className="bg-xo-panel px-3 py-2"><dt className="text-[11px] text-xo-faint">Sell at window</dt><dd className="font-mono text-[17px] font-semibold tabular-nums text-xo-verified">{fmtMoney(potential)}</dd></div>
            </dl>
          </div>
        </Section>

        <Section title="Timing curve" className="lg:col-span-7">
          <div className="px-4 py-4">
            <div aria-hidden className="relative mt-2 h-2 rounded-full bg-xo-line">
              <div className="absolute h-full rounded-full bg-xo-verified/40" style={{ left: `${(windowLo / (windowHi + 6)) * 100}%`, width: `${((windowHi - windowLo) / (windowHi + 6)) * 100}%` }} />
              <div className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-xo-panel bg-xo-verified" style={{ left: `${(sweet / (windowHi + 6)) * 100}%` }} />
              <div className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-xo-panel bg-xo-muted" style={{ left: "0%" }} />
            </div>
            <div className="mt-3 flex justify-between text-[12px] text-xo-muted">
              <span>Now · {fmtMoney(current)}</span><span className="text-xo-verified">Optimal window · months {windowLo}–{windowHi}</span><span>+{windowHi + 6}mo</span>
            </div>
            <ol className="mt-5 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-3">
              {timeline.map((t) => {
                const isWindow = t.year === windowRow.year;
                const c = t.score >= 85 ? "text-xo-verified" : t.score >= 60 ? "text-xo-caution" : "text-xo-risk";
                return (
                  <li key={t.year} className={`bg-xo-panel px-3 py-2 ${isWindow ? "ring-1 ring-inset ring-xo-verified/60" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[15px] font-semibold tabular-nums">{t.year}</span>
                      {isWindow && <span className="text-[11px] font-semibold text-xo-verified">Window</span>}
                    </div>
                    <div className={`mt-1 font-mono text-[20px] font-semibold tabular-nums ${c}`}>{t.score}<span className="text-[11px] text-xo-faint">/100</span></div>
                    <div className="font-mono text-[12px] font-semibold tabular-nums text-xo-muted">{fmtMoney(t.value)}</div>
                  </li>
                );
              })}
            </ol>
          </div>
        </Section>
      </div>

      <Section title="Market signals monitored" className="border border-xo-line"
        foot="All signals computed from the valuation engine, the discovery pool and the source-referenced acquisition history.">
        <ul className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 lg:grid-cols-3">
          {signals.map((s) => {
            const st = IMPACT_STYLE[s.impact];
            return (
              <li key={s.label} className="bg-xo-panel px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[12px] font-semibold text-xo-muted">{s.label}</h3>
                  <span className={`text-[11px] font-semibold ${st.cls}`}><span aria-hidden>{st.glyph} </span>{st.label}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-[16px] font-semibold tabular-nums">{s.value}</span>
                  <span className={`text-[12px] ${st.cls}`}>{s.trend}</span>
                </div>
                <p className="mt-1 text-[12px] leading-snug text-xo-muted">{s.note}</p>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

export default ExitTiming;

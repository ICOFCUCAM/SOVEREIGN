import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { fmtMoney } from "../lib/ui";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { PageHeader, Section, Metric, Provenance } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { runBuyerDiscovery, runReadiness, runReadinessAnalysis, runValuation } from "@exit/engines";
import { dealContextFor } from "../lib/deal-context";
import { loadActiveCompany } from "../lib/active-company";
import { DEAL_INTEL_FMT, sectorEventCount } from "../lib/market-stats";

// Exit Timing — most founders don't know *when* to sell. The page reads the
// signals that move valuation (multiples, deal activity, sector exits, deal
// velocity, buyer appetite) alongside the company's own trajectory, and gives
// a rule-based exit window and the value of fixing first. Everything is
// computed when the page opens from the valuation, readiness and discovery
// engines and the source-referenced acquisition history; nothing monitors in
// the background or sends alerts.

// "context" = a measured figure with no rule turning it into a verdict.
type Impact = "tailwind" | "headwind" | "neutral" | "context";
const IMPACT_STYLE: Record<Impact, { cls: string; glyph: string; label: string }> = {
  tailwind: { cls: "text-xo-verified", glyph: "▲", label: "Tailwind" },
  headwind: { cls: "text-xo-risk", glyph: "▼", label: "Headwind" },
  neutral:  { cls: "text-xo-muted", glyph: "■", label: "Neutral" },
  context:  { cls: "text-xo-faint", glyph: "·", label: "Context" },
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
  const dealCount = buyers.candidates.reduce((s, c) => s + c.history.totalDeals, 0);
  const demand = activeBuyers >= 5 ? "High" : activeBuyers >= 2 ? "Medium" : "Low";

  // window to optimal exit — time to mature the highest-effort fixes
  const monthsToReady = Math.max(3, ...analysis.weaknesses.map((w) => EFFORT_MONTHS[w.effort] ?? 6));
  const windowLo = Math.max(2, monthsToReady - 2);
  const windowHi = monthsToReady + 4;
  const sweet = monthsToReady;

  // Now vs after fixes — both points come from the engines: the readiness
  // engine's current and projected score, and value now vs after fixes.
  // No year-by-year forecast is produced, so none is shown.
  const scoreNow = Math.round(analysis.currentScore);
  const scoreAfter = Math.round(analysis.projectedScore);

  const revMult = standard.methodologies.find((m) => m.multiple != null);
  const sectorExits = sectorEventCount(company.sector);
  // Verdicts only where a stated rule exists; everything else is context.
  const signals: { label: string; value: string; trend: string; impact: Impact; note: string }[] = [
    { label: "Industry multiples", value: revMult ? `${revMult.multiple?.toFixed(1)}× ${revMult.basis.toLowerCase().includes("ebitda") ? "EBITDA" : "revenue"}` : "—", trend: "standard valuation", impact: "context", note: `The multiple in the valuation engine's ${revMult?.name.toLowerCase() ?? "multiples"} methodology for this company. No trend over time is measured.` },
    { label: "Acquisition activity", value: `${dealCount.toLocaleString()} acquisitions`, trend: "registry", impact: "context", note: "Recorded acquisitions by the 12 buyers ranked for this company, all years." },
    { label: "Sector exits", value: `${sectorExits} on record`, trend: `${DEAL_INTEL_FMT.medianPremium} median premium, all sectors`, impact: sectorExits > 0 ? "tailwind" : "neutral", note: "Deals in the company's sector in the source-referenced history. Rule: tailwind if any are on record." },
    { label: "Deal velocity", value: DEAL_INTEL_FMT.medianClose, trend: "announce → close", impact: "context", note: "Median time from announcement to close across tracked deals." },
    { label: "Buyer demand", value: `${activeBuyers} with active appetite`, trend: demand, impact: activeBuyers >= 5 ? "tailwind" : activeBuyers >= 2 ? "neutral" : "headwind", note: "Among the 12 ranked buyers. Appetite is a registry attribute, not recent activity. Rule: high at 5 or more, medium at 2–4." },
    { label: "Your trajectory", value: `${Math.round(growthYoy * 100)}% ARR growth`, trend: "company input", impact: growthYoy >= 0.3 ? "tailwind" : "neutral", note: "Year-on-year ARR growth entered for the company. Rule: tailwind at 30% or more (as on Exit Readiness)." },
  ];
  const ruled = signals.filter((s) => s.impact !== "context").length;
  const tailwinds = signals.filter((s) => s.impact === "tailwind").length;
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="exit-timing" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={fromIntake ? `◉ Timing Desk · Your intake: ${company.name}` : `◉ Timing Desk · Demo company: ${company.name}`} title="Exit Timing"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">{tailwinds} of {ruled} rule-based signals favourable</span></>}>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-xo-line pt-2">
          {([["Growth", `${Math.round(growthYoy * 100)}%`], ["Active-appetite buyers", String(activeBuyers)]] as const).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5"><dt className="text-[11px] text-xo-faint">{k}</dt><dd className="font-mono text-[12px] font-semibold tabular-nums">{v}</dd></div>
          ))}
        </dl>
      </PageHeader>

      <section aria-label="Timing summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-3 xl:grid-cols-6">
        <div className="bg-xo-panel"><Metric label="Optimal window" emphasis value={`${windowLo}–${windowHi}mo`} sub="to start" /></div>
        <div className="bg-xo-panel"><Metric label="Projected uplift" value={<span className="text-xo-verified">+{upliftPct}%</span>} sub="value of waiting" /></div>
        <div className="bg-xo-panel"><Metric label="Sell today" value={fmtMoney(current)} sub="enterprise value today" /></div>
        <div className="bg-xo-panel"><Metric label="Sell at window" value={<span className="text-xo-verified">{fmtMoney(potential)}</span>} sub="after fixes · no growth assumed" /></div>
        <div className="bg-xo-panel"><Metric label="Signals favourable" value={`${tailwinds}/${ruled}`} sub="rule-based signals" /></div>
        <div className="bg-xo-panel"><Metric label="Active-appetite buyers" value={String(activeBuyers)} sub="of 12 ranked · registry attribute" /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
        right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">+{upliftPct}%</span>}>
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">Prepare now and target a sale in <span className="font-semibold">months {windowLo}–{windowHi}</span> — as the readiness gap closes and multiples hold.</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="Today">Sell-today <span className="font-mono">{fmtMoney(current)}</span> · growth {Math.round(growthYoy * 100)}% · {tailwinds >= ruled / 2 ? "most rule-based signals favourable" : "mixed signals"}</TakeCell>
            <TakeCell k="At stake">Waiting to the window projects <span className="font-mono font-semibold text-xo-verified">+{upliftPct}%</span> · {fmtMoney(current)} → {fmtMoney(potential)}.</TakeCell>
            <TakeCell k="If you wait">Selling today leaves the readiness gap unclaimed; waiting too long risks the multiple cycle turning.</TakeCell>
            <TakeCell k="Signals">{tailwinds} of {ruled} rule-based signals are tailwinds; {signals.length - ruled} more are shown as context.</TakeCell>
            <TakeCell k="What ExitOS does">Recomputes this page from the company's figures and the registry snapshot each time it opens. There are no alerts — check back after updating your figures.</TakeCell>
            <TakeCell k="Outcome">At the window <span className="font-mono">{fmtMoney(potential)}</span> · +{upliftPct}% value of waiting (after fixes, no growth assumed)</TakeCell>
          </dl>
          <Link to="/console/readiness" className="mt-3 inline-block rounded-sm bg-deal-700 px-4 py-2 text-[13px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">See readiness fixes →</Link>
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

        <Section title="Timing curve · now vs after fixes" className="lg:col-span-7"
          foot="Window rule: the longest open fix sets the months to ready (weeks ≈ 2, months ≈ 6, quarters ≈ 9; at least 3); the window runs from 2 months before to 4 months after it. A heuristic, not a forecast. Scores are the readiness engine's current score and its projection (8 points per open fix, capped at 100); values are today's enterprise value and the value after fixes, with no growth assumed.">
          <div className="px-4 py-4">
            <div aria-hidden className="relative mt-2 h-2 rounded-full bg-xo-line">
              <div className="absolute h-full rounded-full bg-xo-verified/40" style={{ left: `${(windowLo / (windowHi + 6)) * 100}%`, width: `${((windowHi - windowLo) / (windowHi + 6)) * 100}%` }} />
              <div className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-xo-panel bg-xo-verified" style={{ left: `${(sweet / (windowHi + 6)) * 100}%` }} />
              <div className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-xo-panel bg-xo-muted" style={{ left: "0%" }} />
            </div>
            <div className="mt-3 flex justify-between text-[12px] text-xo-muted">
              <span>Now · {fmtMoney(current)}</span><span className="text-xo-verified">Optimal window · months {windowLo}–{windowHi}</span><span>+{windowHi + 6}mo</span>
            </div>
            <ol className="mt-5 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2">
              <li className="bg-xo-panel px-3 py-2">
                <div className="text-[12px] font-semibold text-xo-muted">Now</div>
                <div className="mt-1 font-mono text-[20px] font-semibold tabular-nums">{scoreNow}<span className="text-[11px] text-xo-faint">/100 readiness engine</span></div>
                <div className="font-mono text-[12px] font-semibold tabular-nums text-xo-muted">{fmtMoney(current)}</div>
              </li>
              <li className="bg-xo-panel px-3 py-2 ring-1 ring-inset ring-xo-verified/60">
                <div className="text-[12px] font-semibold text-xo-verified">After fixes · ~{sweet} months</div>
                <div className="mt-1 font-mono text-[20px] font-semibold tabular-nums text-xo-verified">{scoreAfter}<span className="text-[11px] text-xo-faint">/100 projected</span></div>
                <div className="font-mono text-[12px] font-semibold tabular-nums text-xo-muted">{fmtMoney(potential)}</div>
              </li>
            </ol>
          </div>
        </Section>
      </div>

      <Section title="Market signals" className="border border-xo-line"
        foot="Computed when the page opens from the valuation engine, the 12 ranked buyers and the source-referenced acquisition history (registry snapshot). Nothing is monitored in the background.">
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

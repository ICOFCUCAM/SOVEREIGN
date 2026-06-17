import React, { useMemo, useState } from "react";
import { Button, Card, Kpi, SectionHeader, Field, fmtMoney, downloadJson } from "../lib/ui";
import { VALUATION_INSTITUTIONAL } from "../lib/engines";
import { VALUATION_FRAMEWORK } from "@exit/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import BankerTake from "../components/BankerTake";

// Deal Valuation Engine — institutional grade. The headline is not a single
// asserted number: it is the financial baseline (multiples) uplifted by an
// EVIDENCE-BASED strategic premium drawn from observed precedent transactions,
// shown alongside the comparable transactions, a confidence score, and the
// buyer universe behind it. An interactive DCF layers a third method on top.

const C = SAMPLE_COMPANY;
const TTM = C.revenue.trailingTwelveMonthsRevenueUsd;
const EBITDA = TTM * C.revenue.ebitdaMarginPct;
const INST = VALUATION_INSTITUTIONAL;
const pctStr = (x: number, d = 0): string => `${(x * 100).toFixed(d)}%`;

// DCF parameters are governed by the Valuation Constitution, not the page.
function dcf(growth: number, discount: number, years = VALUATION_FRAMEWORK.dcf.years, terminal = VALUATION_FRAMEWORK.dcf.terminalGrowthPct) {
  // FCF proxy = EBITDA, grown each year, discounted; + Gordon terminal value
  let pv = 0;
  let fcf = EBITDA;
  for (let y = 1; y <= years; y++) {
    fcf = fcf * (1 + growth);
    pv += fcf / Math.pow(1 + discount, y);
  }
  const tv = (fcf * (1 + terminal)) / (discount - terminal);
  pv += tv / Math.pow(1 + discount, years);
  return pv;
}

// comparable value from the REAL source-referenced transactions: median
// disclosed price across the institutional report's comparables.
const compPrices = INST.comparableTransactions.map((c) => c.priceUsd).filter((v): v is number => v != null);
const compMid = compPrices.length
  ? [...compPrices].sort((a, b) => a - b)[Math.floor(compPrices.length / 2)]!
  : INST.financialBaseline.mid;

const Valuation: React.FC = () => {
  const [growth, setGrowth] = useState(Math.round(C.growth.arrGrowthYoyPct * 100)); // %
  const [discount, setDiscount] = useState(Math.round(VALUATION_FRAMEWORK.dcf.defaultDiscountPct * 100)); // %

  const dcfValue = useMemo(() => dcf(growth / 100, discount / 100), [growth, discount]);

  // blend: engine multiples baseline + DCF + real comps (equal weight)
  const blended = useMemo(
    () => (INST.financialBaseline.mid + dcfValue + compMid) / 3,
    [dcfValue]
  );
  const premiumGap = INST.headline.mid - INST.financialBaseline.mid;

  return (
    <div>
      <SectionHeader
        kicker="Module · Operator"
        title="Deal Valuation Engine"
        description="Institutional-grade valuation: a multiples baseline uplifted by an evidence-based strategic premium, with comparable transactions, a confidence score and the qualified buyer universe — plus an interactive DCF. Every figure traces to source data, not assumption."
        actions={<Button variant="ghost" onClick={() => downloadJson("exitos-valuation-model.json", {
          company: C.name,
          institutional: INST,
          blended, dcf: dcfValue, comparables: compMid,
          assumptions: { growthPct: growth, discountPct: discount },
        })}>Export model</Button>}
      />

      <BankerTake
        next={<>Anchor the process at the <span className="text-white">strategic</span> band — the {pctStr(INST.premium.appliedPct)} premium is underwritten by {INST.premium.observedPremiums.length} observed precedents, so make buyers defend it, not debate it.</>}
        stake={<><span className="font-mono font-bold text-deal-300">{fmtMoney(INST.headline.mid)}</span> midpoint · {INST.confidence.score}% confidence · {INST.comparablesUsed} comps.</>}
        inaction={<>Pricing off the financial baseline leaves <span className="font-mono text-red-300">{fmtMoney(premiumGap)}</span> of strategic premium unclaimed.</>}
        buyer={<><span className="text-white">{INST.mostLikelyBuyers[0]?.name ?? "Strategic acquirers"}</span> leads the qualified universe of {INST.buyerUniverse.qualified} buyers on fit-adjusted expected value.</>}
        automate={<>ExitOS recomputes baseline, premium and buyer universe from the registries and packages it straight into the CIM.</>}
        impact={<>+{fmtMoney(premiumGap)}</>}
        cta={{ label: "Build the CIM", to: "/console/documents" }}
      />

      {/* ── Institutional summary — the block a banker reads first ── */}
      <Card className="mt-2 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Enterprise value · strategic-buyer basis</div>
          <span className="rounded-full bg-deal-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-deal-300 ring-1 ring-deal-400/40">
            Confidence {INST.confidence.score}% · {INST.confidence.tier}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <ValueStat label="Low" value={fmtMoney(INST.headline.low)} dim />
          <ValueStat label="Midpoint" value={fmtMoney(INST.headline.mid)} accent />
          <ValueStat label="High" value={fmtMoney(INST.headline.high)} dim />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Pill label="Strategic premium" value={`+${pctStr(INST.premium.appliedPct)}`} sub={`range ${pctStr(INST.premium.rangeLowPct)}–${pctStr(INST.premium.rangeHighPct)}`} />
          <Pill label="Comparables used" value={String(INST.comparablesUsed)} sub="source-referenced" />
          <Pill label="Qualified buyers" value={String(INST.buyerUniverse.qualified)} sub={`of ${INST.buyerUniverse.scored} scored`} />
          <Pill label="Time to close" value={`${INST.timeToClose.lowDays}–${INST.timeToClose.highDays}d`} sub="expected" />
          <Pill label="Financial baseline" value={fmtMoney(INST.financialBaseline.mid)} sub="pre-premium" />
          <Pill label="Premium evidence" value={`n=${INST.premium.observedPremiums.length}`} sub={INST.premium.confidence.tier} />
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-white/55">
          Midpoint <span className="font-mono text-white/80">{fmtMoney(INST.headline.mid)}</span> = financial baseline{" "}
          <span className="font-mono text-white/80">{fmtMoney(INST.financialBaseline.mid)}</span> × (1 + {pctStr(INST.premium.appliedPct)} strategic premium).
          {" "}{INST.premium.note}
        </p>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Blended valuation" value={fmtMoney(blended)} sub="baseline · DCF · comps" accent="#34d399" />
        <Kpi label="DCF" value={fmtMoney(dcfValue)} sub={`${growth}% growth · ${discount}% WACC`} />
        <Kpi label="Comparable txns" value={fmtMoney(compMid)} sub={`${INST.comparablesUsed} precedents`} />
        <Kpi label="Strategic midpoint" value={fmtMoney(INST.headline.mid)} sub="evidence-based premium" accent="#fbbf24" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* assumptions */}
        <Card className="space-y-5 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">DCF assumptions</div>
          <Field label={`Annual growth · ${growth}%`}>
            <input type="range" min={0} max={80} value={growth} onChange={(e) => setGrowth(+e.target.value)} className="w-full accent-deal-500" />
          </Field>
          <Field label={`Discount rate (WACC) · ${discount}%`}>
            <input type="range" min={8} max={30} value={discount} onChange={(e) => setDiscount(+e.target.value)} className="w-full accent-deal-500" />
          </Field>
          <div className="rounded-md border border-white/10 bg-ink-900/60 p-3 text-[12px] text-white/60">
            <div className="flex justify-between"><span>TTM revenue</span><span className="font-mono text-white/80">{fmtMoney(TTM)}</span></div>
            <div className="mt-1 flex justify-between"><span>EBITDA ({Math.round(C.revenue.ebitdaMarginPct * 100)}%)</span><span className="font-mono text-white/80">{fmtMoney(EBITDA)}</span></div>
          </div>
        </Card>

        {/* methodology bands + real comps */}
        <Card className="p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Methodology bands · normalized weights sum to 100%</div>
          <div className="mt-4 space-y-4">
            <MethodBar name="DCF (5yr + terminal)" basis={`${growth}% growth · ${discount}% WACC`} mid={dcfValue} max={blended * 1.8} accent="#34d399" />
            <MethodBar name="Comparable transactions" basis={`median of ${INST.comparablesUsed} precedents`} mid={compMid} max={blended * 1.8} accent="#60a5fa" />
            {INST.methodologies.map((m) => (
              <MethodBar key={m.name} name={`${m.name} · ${m.weightPct}%`} basis={m.evidence} mid={m.band.mid} max={blended * 1.8} accent="#a78bfa" />
            ))}
          </div>

          <div className="mt-7 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Comparable transactions</div>
            <span className="text-[10px] uppercase tracking-wide text-white/35">{INST.comparablesUsed} sourced · {INST.premium.confidence.tier} premium evidence</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-[12px]">
              <thead className="bg-white/[0.03] text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                <tr><th className="px-3 py-2">Target</th><th className="px-3 py-2">Acquirer</th><th className="px-3 py-2">Date</th><th className="px-3 py-2 text-right">EV</th><th className="px-3 py-2 text-right">Premium</th></tr>
              </thead>
              <tbody>
                {INST.comparableTransactions.slice(0, 12).map((c) => (
                  <tr key={`${c.buyer}-${c.target}`} className="border-t border-white/5">
                    <td className="px-3 py-2 text-white/85">{c.target}</td>
                    <td className="px-3 py-2 text-white/55">{c.buyer}</td>
                    <td className="px-3 py-2 font-mono text-white/45">{c.date ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-mono text-white/85">{c.priceUsd != null ? fmtMoney(c.priceUsd) : "undisclosed"}</td>
                    <td className="px-3 py-2 text-right font-mono text-deal-300">{c.premiumPct != null ? pctStr(c.premiumPct) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* most likely buyers — the universe behind the premium */}
          <div className="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Most likely acquirers · ranked by fit-adjusted expected value</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {INST.mostLikelyBuyers.map((b, i) => (
              <span key={b.name} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px]">
                <span className="text-white/40">{i + 1}</span>
                <span className="font-medium text-white/85">{b.name}</span>
                <span className="font-mono text-deal-300">{b.probabilityPct}%</span>
                <span className="text-white/35">· {b.expectedDaysToCash}d</span>
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* strategic rationale */}
      <Card className="mt-6 p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Strategic buyer rationale · why a buyer pays the premium</div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {INST.strategicRationale.map((r) => (
            <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-white/70">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-deal-400" />
              {r}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

const ValueStat: React.FC<{ label: string; value: string; accent?: boolean; dim?: boolean }> = ({ label, value, accent, dim }) => (
  <div className={`rounded-lg border p-4 text-center ${accent ? "border-deal-400/40 bg-deal-500/10" : "border-white/10 bg-white/[0.02]"}`}>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</div>
    <div className={`mt-1 font-mono text-xl font-bold ${accent ? "text-deal-200" : dim ? "text-white/70" : "text-white"}`}>{value}</div>
  </div>
);

const Pill: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
    <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-bold text-white/90">{value}</div>
    {sub ? <div className="text-[10px] text-white/40">{sub}</div> : null}
  </div>
);

const MethodBar: React.FC<{ name: string; basis: string; mid: number; max: number; accent: string }> = ({ name, basis, mid, max, accent }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0"><span className="text-sm font-semibold text-white">{name}</span> <span className="text-[11px] text-white/40">· {basis}</span></div>
      <span className="shrink-0 font-mono text-sm font-bold text-white">{fmtMoney(mid)}</span>
    </div>
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (mid / max) * 100)}%`, background: accent }} />
    </div>
  </div>
);

export default Valuation;

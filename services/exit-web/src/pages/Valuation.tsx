import React, { useMemo, useState } from "react";
import { Button, Card, Kpi, SectionHeader, Field, fmtMoney } from "../lib/ui";
import { VALUATION_STANDARD, VALUATION_STRATEGIC } from "../lib/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import BankerTake from "../components/BankerTake";

// Deal Valuation Engine — surfaces the live multiples-driven methodologies
// from runValuation (@exit/engines) AND adds an in-page DCF and comparable-
// transactions view, with adjustable assumptions so the headline moves in
// real time. Nothing here is static: every band is recomputed from inputs.

const C = SAMPLE_COMPANY;
const TTM = C.revenue.trailingTwelveMonthsRevenueUsd;
const EBITDA = TTM * C.revenue.ebitdaMarginPct;

// illustrative comparable transactions (sector logistics/SaaS)
const COMPS = [
  { target: "Cargo flow systems", acquirer: "Strategic", revMult: 3.1, evUsd: 192_000_000 },
  { target: "Freightline AI", acquirer: "PE", revMult: 2.6, evUsd: 158_000_000 },
  { target: "RouteCore", acquirer: "Strategic", revMult: 3.8, evUsd: 240_000_000 },
  { target: "Haulnet", acquirer: "PE", revMult: 2.9, evUsd: 175_000_000 },
];

function dcf(growth: number, discount: number, years = 5, terminal = 0.03) {
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

const Valuation: React.FC = () => {
  const [growth, setGrowth] = useState(Math.round(C.growth.arrGrowthYoyPct * 100)); // %
  const [discount, setDiscount] = useState(18); // %

  const dcfValue = useMemo(() => dcf(growth / 100, discount / 100), [growth, discount]);
  const compMid = useMemo(() => COMPS.reduce((s, c) => s + c.revMult, 0) / COMPS.length * TTM, []);

  // blend: engine multiples headline + DCF + comps (equal weight)
  const blended = useMemo(
    () => (VALUATION_STANDARD.headline.mid + dcfValue + compMid) / 3,
    [dcfValue, compMid]
  );
  const premiumGap = VALUATION_STRATEGIC.headline.mid - VALUATION_STANDARD.headline.mid;

  return (
    <div>
      <SectionHeader
        kicker="Module · Operator"
        title="Deal Valuation Engine"
        description="Live valuation from four methodologies — DCF, comparable transactions, revenue multiples and EBITDA multiples — recomputed as assumptions change. Multiples bands come from the valuation engine; DCF is modelled from company financials."
        actions={<Button variant="ghost">Export model</Button>}
      />

      <BankerTake
        next={<>Anchor the process at the <span className="text-white">strategic</span> band — not the standard multiple — and make buyers underwrite the synergy.</>}
        stake={<><span className="font-mono font-bold text-deal-300">{fmtMoney(blended)}</span> blended · strategic mid {fmtMoney(VALUATION_STRATEGIC.headline.mid)}.</>}
        inaction={<>Pricing off the standard band leaves <span className="font-mono text-red-300">{fmtMoney(premiumGap)}</span> of strategic premium unclaimed.</>}
        buyer={<><span className="text-white">Strategic acquirers</span> pay the premium — financial buyers underwrite cash flow, not synergy.</>}
        automate={<>ExitOS recomputes the full model as assumptions move and packages it straight into the CIM.</>}
        cta={{ label: "Build the CIM", to: "/console/documents" }}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Blended valuation" value={fmtMoney(blended)} sub="DCF · comps · multiples" accent="#34d399" />
        <Kpi label="DCF" value={fmtMoney(dcfValue)} sub={`${growth}% growth · ${discount}% WACC`} />
        <Kpi label="Comparable txns" value={fmtMoney(compMid)} sub={`${COMPS.length} precedents`} />
        <Kpi label="Strategic premium" value={fmtMoney(VALUATION_STRATEGIC.headline.mid)} sub="strategic-buyer report" accent="#fbbf24" />
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

        {/* methodology bands */}
        <Card className="p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Methodology bands</div>
          <div className="mt-4 space-y-4">
            <MethodBar name="DCF (5yr + terminal)" basis={`${growth}% growth · ${discount}% WACC`} mid={dcfValue} max={blended * 1.8} accent="#34d399" />
            <MethodBar name="Comparable transactions" basis={`${(compMid / TTM).toFixed(1)}× revenue · ${COMPS.length} comps`} mid={compMid} max={blended * 1.8} accent="#60a5fa" />
            {VALUATION_STANDARD.methodologies.map((m) => (
              <MethodBar key={m.name} name={m.name} basis={m.basis} mid={m.band.mid} max={blended * 1.8} accent="#a78bfa" />
            ))}
          </div>

          <div className="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Comparable transactions</div>
          <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-[12px]">
              <thead className="bg-white/[0.03] text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                <tr><th className="px-3 py-2">Target</th><th className="px-3 py-2">Acquirer</th><th className="px-3 py-2">Rev multiple</th><th className="px-3 py-2 text-right">EV</th></tr>
              </thead>
              <tbody>
                {COMPS.map((c) => (
                  <tr key={c.target} className="border-t border-white/5">
                    <td className="px-3 py-2 text-white/85">{c.target}</td>
                    <td className="px-3 py-2 text-white/55">{c.acquirer}</td>
                    <td className="px-3 py-2 font-mono text-white/85">{c.revMult.toFixed(1)}×</td>
                    <td className="px-3 py-2 text-right font-mono text-white/85">{fmtMoney(c.evUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

const MethodBar: React.FC<{ name: string; basis: string; mid: number; max: number; accent: string }> = ({ name, basis, mid, max, accent }) => (
  <div>
    <div className="flex items-baseline justify-between">
      <div><span className="text-sm font-semibold text-white">{name}</span> <span className="text-[11px] text-white/40">· {basis}</span></div>
      <span className="font-mono text-sm font-bold text-white">{fmtMoney(mid)}</span>
    </div>
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (mid / max) * 100)}%`, background: accent }} />
    </div>
  </div>
);

export default Valuation;

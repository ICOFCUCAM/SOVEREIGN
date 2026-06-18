import React, { useMemo, useState } from "react";
import { Field, fmtMoney, downloadJson, downloadText } from "../lib/ui";
import { Panel, Frame, CommandHeader, MarketTape, CommandState } from "../lib/workstation";
import { buildMarketTape } from "../lib/market-tape";
import { VALUATION_INSTITUTIONAL, VALUATION_FACTS, DOCUMENT_SUITE } from "../lib/engines";
import { VALUATION_FRAMEWORK } from "@exit/engines";
import { tracedDocMarkdown } from "../lib/deliverables";
import { SAMPLE_COMPANY } from "../lib/profile";
import BankerTake from "../components/BankerTake";

// Enterprise Value — institutional valuation desk. The headline is the
// financial baseline (multiples) uplifted by an EVIDENCE-BASED strategic
// premium from observed precedents, shown beside the comparable set, a
// confidence score, the buyer universe and an interactive DCF. Every figure
// traces to source data, not assumption.

const C = SAMPLE_COMPANY;
const TTM = C.revenue.trailingTwelveMonthsRevenueUsd;
const EBITDA = TTM * C.revenue.ebitdaMarginPct;
const INST = VALUATION_INSTITUTIONAL;
const pctStr = (x: number, d = 0): string => `${(x * 100).toFixed(d)}%`;

function dcf(growth: number, discount: number, years = VALUATION_FRAMEWORK.dcf.years, terminal = VALUATION_FRAMEWORK.dcf.terminalGrowthPct) {
  let pv = 0; let fcf = EBITDA;
  for (let y = 1; y <= years; y++) { fcf = fcf * (1 + growth); pv += fcf / Math.pow(1 + discount, y); }
  const tv = (fcf * (1 + terminal)) / (discount - terminal);
  pv += tv / Math.pow(1 + discount, years);
  return pv;
}

const compPrices = INST.comparableTransactions.map((c) => c.priceUsd).filter((v): v is number => v != null);
const compMid = compPrices.length ? [...compPrices].sort((a, b) => a - b)[Math.floor(compPrices.length / 2)]! : INST.financialBaseline.mid;

const Valuation: React.FC = () => {
  const [growth, setGrowth] = useState(Math.round(C.growth.arrGrowthYoyPct * 100));
  const [discount, setDiscount] = useState(Math.round(VALUATION_FRAMEWORK.dcf.defaultDiscountPct * 100));
  const dcfValue = useMemo(() => dcf(growth / 100, discount / 100), [growth, discount]);
  const blended = useMemo(() => (INST.financialBaseline.mid + dcfValue + compMid) / 3, [dcfValue]);
  const premiumGap = INST.headline.mid - INST.financialBaseline.mid;
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Valuation Desk"
        title="Enterprise Value"
        tag="Strategic-buyer basis"
        status={`Conf ${INST.confidence.score}% · ${INST.confidence.tier}`}
        meta={[
          { k: "FRAMEWORK", v: `v${INST.frameworkVersion}` },
          { k: "COMPS", v: INST.comparablesUsed },
          { k: "BUYERS", v: INST.buyerUniverse.qualified },
        ]}
        metrics={[
          { k: "Midpoint", v: fmtMoney(INST.headline.mid), accent: true, sub: `${fmtMoney(INST.headline.low)}–${fmtMoney(INST.headline.high)}` },
          { k: "Strategic premium", v: `+${pctStr(INST.premium.appliedPct)}`, sub: `range ${pctStr(INST.premium.rangeLowPct)}–${pctStr(INST.premium.rangeHighPct)}` },
          { k: "Financial baseline", v: fmtMoney(INST.financialBaseline.mid), sub: "pre-premium" },
          { k: "Blended", v: fmtMoney(blended), accent: true, sub: "baseline·DCF·comps" },
          { k: "DCF", v: fmtMoney(dcfValue), sub: `${growth}% g · ${discount}% WACC` },
          { k: "Comparable", v: fmtMoney(compMid), sub: `${INST.comparablesUsed} precedents` },
          { k: "Time to close", v: `${INST.timeToClose.lowDays}–${INST.timeToClose.highDays}d`, sub: "expected" },
        ]}
      />

      <MarketTape items={tape} />

      <CommandState
        current={<>Midpoint <span className="font-mono text-white">{fmtMoney(INST.headline.mid)}</span> · confidence {INST.confidence.score}% · baseline {fmtMoney(INST.financialBaseline.mid)}</>}
        changes={<>{INST.comparablesUsed} comparables · premium evidence n={INST.premium.observedPremiums.length} ({INST.premium.confidence.tier})</>}
        action={<>Anchor at the strategic band — make buyers defend +{pctStr(INST.premium.appliedPct)}, not debate it</>}
        outcome={<>Range <span className="font-mono text-white">{fmtMoney(INST.headline.low)}–{fmtMoney(INST.headline.high)}</span> · +{fmtMoney(premiumGap)} premium vs baseline · close {INST.timeToClose.lowDays}–{INST.timeToClose.highDays}d</>}
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

      {/* fact sheet — the institutional tear block */}
      <Frame>
        <Panel title="Valuation fact sheet · every figure traced to a source" className="lg:col-span-12"
          right={
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => downloadText("board-report.md", tracedDocMarkdown(DOCUMENT_SUITE.board_report))} className="rounded bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/55 ring-1 ring-white/10 hover:text-white">Board report</button>
              <button onClick={() => downloadText("market-update.md", tracedDocMarkdown(DOCUMENT_SUITE.market_update))} className="rounded bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/55 ring-1 ring-white/10 hover:text-white">Market update</button>
              <button onClick={() => downloadJson("exitos-valuation-model.json", { company: C.name, institutional: INST, factSheet: VALUATION_FACTS, blended, dcf: dcfValue, comparables: compMid, assumptions: { growthPct: growth, discountPct: discount } })} className="rounded bg-deal-600/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white ring-1 ring-deal-400/40 hover:bg-deal-500">Export model</button>
            </div>
          }
          foot="Hover any figure for its methodology, source and last-updated date. No number on this page exists without one.">
          <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
            {VALUATION_FACTS.map((f) => (
              <div key={f.key} className="bg-ink-900 p-3" title={`${f.methodology} · source: ${f.source} · updated ${f.last_updated}`}>
                <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">{f.label}</div>
                <div className="mt-1 font-mono text-[15px] font-bold text-white">{f.value}</div>
                <div className="mt-1 flex items-center gap-1 text-[9px] text-white/40">
                  <span className="rounded bg-white/5 px-1 py-0.5 ring-1 ring-white/10">{f.confidence}</span>
                  <span className="truncate">{f.source.replace(/^ExitOS /, "")}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </Frame>

      {/* DCF · methodology · buyer universe */}
      <Frame>
        <Panel title="DCF assumptions" className="lg:col-span-3">
          <div className="space-y-4 p-3">
            <Field label={`Annual growth · ${growth}%`}>
              <input type="range" min={0} max={80} value={growth} onChange={(e) => setGrowth(+e.target.value)} className="w-full accent-deal-500" />
            </Field>
            <Field label={`Discount (WACC) · ${discount}%`}>
              <input type="range" min={8} max={30} value={discount} onChange={(e) => setDiscount(+e.target.value)} className="w-full accent-deal-500" />
            </Field>
            <div className="rounded-md border border-white/10 bg-ink-800/60 p-3 text-[12px] text-white/60">
              <div className="flex justify-between"><span>TTM revenue</span><span className="font-mono text-white/80">{fmtMoney(TTM)}</span></div>
              <div className="mt-1 flex justify-between"><span>EBITDA ({Math.round(C.revenue.ebitdaMarginPct * 100)}%)</span><span className="font-mono text-white/80">{fmtMoney(EBITDA)}</span></div>
              <div className="mt-2 border-t border-white/10 pt-2 flex justify-between"><span className="text-white/70">DCF value</span><span className="font-mono font-bold text-deal-300">{fmtMoney(dcfValue)}</span></div>
            </div>
          </div>
        </Panel>

        <Panel title="Methodology bands · normalized weights sum to 100%" className="lg:col-span-5">
          <div className="space-y-3.5 p-3">
            <MethodBar name="DCF (5yr + terminal)" basis={`${growth}% growth · ${discount}% WACC`} mid={dcfValue} max={blended * 1.8} accent="#34d399" />
            <MethodBar name="Comparable transactions" basis={`median of ${INST.comparablesUsed} precedents`} mid={compMid} max={blended * 1.8} accent="#60a5fa" />
            {INST.methodologies.map((m) => (
              <MethodBar key={m.name} name={`${m.name} · ${m.weightPct}%`} basis={m.evidence} mid={m.band.mid} max={blended * 1.8} accent="#a78bfa" />
            ))}
          </div>
        </Panel>

        <Panel title="Most likely acquirers · fit-adjusted EV" className="lg:col-span-4"
          foot={`Premium evidence n=${INST.premium.observedPremiums.length} · ${INST.premium.confidence.tier}. ${INST.premium.note}`}>
          <table className="w-full text-[12px]">
            <tbody>
              {INST.mostLikelyBuyers.map((b, i) => (
                <tr key={b.name} className="border-b border-white/5 last:border-0">
                  <td className="px-3 py-1.5 font-mono text-white/35">{i + 1}</td>
                  <td className="px-2 py-1.5 font-semibold text-white">{b.name}</td>
                  <td className="px-2 py-1.5 text-right font-mono font-bold tabular-nums text-deal-300">{b.probabilityPct}%</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-white/55">{b.expectedDaysToCash}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </Frame>

      {/* comparables · rationale */}
      <Frame>
        <Panel title="Comparable transactions" className="lg:col-span-8"
          right={<span className="text-[9px] uppercase tracking-wide text-white/35">{INST.comparablesUsed} sourced · {INST.premium.confidence.tier} evidence</span>}>
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
              <tr className="border-b border-white/10"><th className="px-3 py-1.5">Target</th><th className="px-3 py-1.5">Acquirer</th><th className="px-2 py-1.5">Date</th><th className="px-2 py-1.5 text-right">EV</th><th className="px-3 py-1.5 text-right">Premium</th></tr>
            </thead>
            <tbody>
              {INST.comparableTransactions.slice(0, 14).map((c) => (
                <tr key={`${c.buyer}-${c.target}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5 text-white/85">{c.target}</td>
                  <td className="px-3 py-1.5 text-white/55">{c.buyer}</td>
                  <td className="px-2 py-1.5 font-mono text-white/45">{c.date ?? "—"}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-white/85">{c.priceUsd != null ? fmtMoney(c.priceUsd) : "undisc."}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-deal-300">{c.premiumPct != null ? pctStr(c.premiumPct) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Strategic rationale · why a buyer pays the premium" className="lg:col-span-4">
          <ul className="space-y-2 p-3">
            {INST.strategicRationale.map((r) => (
              <li key={r} className="flex gap-2 text-[12px] leading-relaxed text-white/70">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-deal-400" />{r}
              </li>
            ))}
          </ul>
        </Panel>
      </Frame>
    </div>
  );
};

const MethodBar: React.FC<{ name: string; basis: string; mid: number; max: number; accent: string }> = ({ name, basis, mid, max, accent }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0"><span className="text-[12.5px] font-semibold text-white">{name}</span> <span className="text-[10px] text-white/40">· {basis}</span></div>
      <span className="shrink-0 font-mono text-[12.5px] font-bold text-white">{fmtMoney(mid)}</span>
    </div>
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (mid / max) * 100)}%`, background: accent }} />
    </div>
  </div>
);

export default Valuation;

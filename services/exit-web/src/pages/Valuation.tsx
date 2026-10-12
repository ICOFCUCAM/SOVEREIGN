import React, { useMemo, useState } from "react";
import { fmtMoney, downloadJson } from "../lib/ui";
import { Evidence } from "../lib/workstation";
import { PageHeader, Section, Metric, ScrollRegion, Provenance, ActionLink, XO_LABEL } from "../components/xo";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { buildMarketTape } from "../lib/market-tape";
import { VALUATION_INSTITUTIONAL, VALUATION_FACTS } from "../lib/engines";
import { VALUATION_FRAMEWORK, runInstitutionalValuation, valuationFacts } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";

// Enterprise Value — institutional valuation desk. The headline is the
// financial baseline (multiples) uplifted by an EVIDENCE-BASED strategic
// premium from observed precedents, shown beside the comparable set, a
// confidence score and the buyer universe. The fact-sheet figures carry
// their sources; the DCF is a sensitivity tool on the user's assumptions.

const pctStr = (x: number, d = 0): string => `${(x * 100).toFixed(d)}%`;

function dcf(ebitda: number, growth: number, discount: number, years = VALUATION_FRAMEWORK.dcf.years, terminal = VALUATION_FRAMEWORK.dcf.terminalGrowthPct) {
  let pv = 0; let fcf = ebitda;
  for (let y = 1; y <= years; y++) { fcf = fcf * (1 + growth); pv += fcf / Math.pow(1 + discount, y); }
  const tv = (fcf * (1 + terminal)) / (discount - terminal);
  pv += tv / Math.pow(1 + discount, years);
  return pv;
}

const Valuation: React.FC = () => {
  // The founder's saved intake when there is one; the demo company otherwise.
  const { company: C, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const INST = useMemo(() => (fromIntake ? runInstitutionalValuation(C) : VALUATION_INSTITUTIONAL), [C, fromIntake]);
  const FACTS = useMemo(() => (fromIntake ? valuationFacts(INST) : VALUATION_FACTS), [INST, fromIntake]);
  const TTM = C.revenue.trailingTwelveMonthsRevenueUsd;
  const EBITDA = TTM * C.revenue.ebitdaMarginPct;
  const compPrices = INST.comparableTransactions.map((c) => c.priceUsd).filter((v): v is number => v != null);
  const compMid = compPrices.length ? [...compPrices].sort((a, b) => a - b)[Math.floor(compPrices.length / 2)]! : INST.financialBaseline.mid;
  const [growth, setGrowth] = useState(Math.round(C.growth.arrGrowthYoyPct * 100));
  const [discount, setDiscount] = useState(Math.round(VALUATION_FRAMEWORK.dcf.defaultDiscountPct * 100));
  const dcfValue = useMemo(() => dcf(EBITDA, growth / 100, discount / 100), [EBITDA, growth, discount]);
  // bar scale: the largest figure drawn, so no bar is clipped
  const barMax = Math.max(dcfValue, INST.headline.high, ...INST.methodologies.map((m) => m.band.mid)) * 1.1;
  const premiumGap = INST.headline.mid - INST.financialBaseline.mid;
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="valuation" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Valuation Desk · ${fromIntake ? "Your intake" : "Demo company"}: ${C.name}`} title="Enterprise Value"
        description={fromIntake ? "Valued from your saved intake." : "Valued for the demo company. Save an intake on Value My Company to value yours."}
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Institutional framework — the console value · Conf {INST.confidence.score}% · {INST.confidence.tier} · framework v{INST.frameworkVersion} · {INST.comparablesUsed} comps · {INST.buyerUniverse.qualified} buyers</span></>} />

      <section aria-label="Valuation summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="bg-xo-panel"><Metric label="Midpoint" emphasis value={fmtMoney(INST.headline.mid)} sub={`${fmtMoney(INST.headline.low)}–${fmtMoney(INST.headline.high)}`} /></div>
        <div className="bg-xo-panel"><Metric label="Strategic premium" value={`+${pctStr(INST.premium.appliedPct)}`} sub={`range ${pctStr(INST.premium.rangeLowPct)}–${pctStr(INST.premium.rangeHighPct)}`} /></div>
        <div className="bg-xo-panel"><Metric label="Financial baseline" value={fmtMoney(INST.financialBaseline.mid)} sub="pre-premium" /></div>
        <div className="bg-xo-panel"><Metric label="DCF sensitivity" value={fmtMoney(dcfValue)} sub={`${growth}% g · ${discount}% WACC · your assumptions`} /></div>
        <div className="bg-xo-panel"><Metric label="Median precedent deal size" value={fmtMoney(compMid)} sub={`${INST.comparablesUsed} precedents · other companies' deals, not a value for this company`} /></div>
        <div className="bg-xo-panel"><Metric label="Time to close" value={`${INST.timeToClose.lowDays}–${INST.timeToClose.highDays}d`} sub="expected" /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
        right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">+{fmtMoney(premiumGap)}</span>}>
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">Anchor the process at the band <span className="font-mono">{fmtMoney(INST.headline.low)}–{fmtMoney(INST.headline.high)}</span>, midpoint <span className="font-mono">{fmtMoney(INST.headline.mid)}</span> — make buyers argue against the +{pctStr(INST.premium.appliedPct)} premium rather than start from the baseline.</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="Today">Midpoint <span className="font-mono text-xo-text">{fmtMoney(INST.headline.mid)}</span> · confidence {INST.confidence.score}% · baseline {fmtMoney(INST.financialBaseline.mid)} · close {INST.timeToClose.lowDays}–{INST.timeToClose.highDays}d.</TakeCell>
            <TakeCell k="If you price off the baseline">The <span className="font-mono text-xo-risk">{fmtMoney(premiumGap)}</span> premium is not asked for.</TakeCell>
            <TakeCell k="Evidence">{INST.comparablesUsed} comparables · premium from {INST.premium.observedPremiums.length} observed precedents ({INST.premium.confidence.tier} evidence).</TakeCell>
            <TakeCell k="Next">{INST.mostLikelyBuyers[0] ? <>{INST.mostLikelyBuyers[0].name} leads the {INST.buyerUniverse.qualified} qualified buyers. </> : null}The same figures feed the CIM. <ActionLink to="/console/documents">Build the CIM →</ActionLink></TakeCell>
          </dl>
        </div>
      </Section>

      {/* fact sheet — the institutional tear block */}
      <Section title="Valuation fact sheet · every figure traced to a source" className="border border-xo-line"
        right={<>
          <button type="button" onClick={() => downloadJson("exitos-valuation-model.json", { company: C.name, institutional: INST, factSheet: FACTS, dcf: dcfValue, medianPrecedentDealSizeUsd: compMid, assumptions: { growthPct: growth, discountPct: discount } })} className="rounded-sm border border-xo-line px-2 py-1 text-[11px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Export data (.json)</button>
          <a href="/report/valuation" target="_blank" rel="noreferrer" className="rounded-sm bg-deal-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Board-ready report (PDF) →</a>
        </>}
        foot="Hover or focus any figure for its methodology, source and last-updated date.">
        <dl className="grid grid-cols-2 gap-px bg-xo-line sm:grid-cols-3 lg:grid-cols-5">
          {FACTS.map((f) => (
            <div key={f.key} className="flex flex-col bg-xo-panel p-3">
              <dt className="order-1 text-[11px] text-xo-muted">{f.label}</dt>
              <dd className="order-2 mt-1 font-mono text-[15px] font-semibold">
                <Evidence meta={{ methodology: f.methodology, source: f.source, confidence: f.confidence, asOf: f.last_updated }}>{f.value}</Evidence>
              </dd>
              <dd className="order-3 mt-1 flex items-center gap-1 text-[11px] text-xo-muted">
                <span className="rounded-sm border border-xo-line px-1">{f.confidence}</span>
                <span className="truncate">{f.source.replace(/^ExitOS /, "")}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* DCF · methodology · buyer universe */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="DCF sensitivity · your assumptions" className="lg:col-span-3"
          foot={`Projects EBITDA as a proxy for free cash flow (capex, tax and working capital are not deducted), grows it ${VALUATION_FRAMEWORK.dcf.years} years at your growth rate, discounts at your WACC and adds a terminal value at ${(VALUATION_FRAMEWORK.dcf.terminalGrowthPct * 100).toFixed(1)}% growth. A sensitivity on your assumptions — not the valuation, which is the midpoint above.`}>
          <div className="space-y-4 px-4 py-3">
            <div>
              <label htmlFor="val-growth" className={XO_LABEL}>Annual growth · {growth}%</label>
              <input id="val-growth" type="range" min={0} max={80} value={growth} onChange={(e) => setGrowth(+e.target.value)} className="w-full accent-deal-500" />
            </div>
            <div>
              <label htmlFor="val-wacc" className={XO_LABEL}>Discount (WACC) · {discount}%</label>
              <input id="val-wacc" type="range" min={8} max={30} value={discount} onChange={(e) => setDiscount(+e.target.value)} className="w-full accent-deal-500" />
            </div>
            <dl className="border border-xo-line bg-xo-ink p-3 text-[12px] text-xo-muted">
              <div className="flex justify-between"><dt>TTM revenue</dt><dd className="font-mono text-xo-text">{fmtMoney(TTM)}</dd></div>
              <div className="mt-1 flex justify-between"><dt>EBITDA ({Math.round(C.revenue.ebitdaMarginPct * 100)}%)</dt><dd className="font-mono text-xo-text">{fmtMoney(EBITDA)}</dd></div>
              <div className="mt-2 flex justify-between border-t border-xo-line pt-2"><dt className="text-xo-text">DCF value</dt><dd className="font-mono font-semibold text-xo-verified">{fmtMoney(dcfValue)}</dd></div>
            </dl>
          </div>
        </Section>

        <Section title="Methodology bands" className="lg:col-span-5"
          foot="The framework's weighted methods (weights sum to 100%) beside your DCF sensitivity, which carries no weight in the midpoint.">
          <div className="space-y-3.5 px-4 py-3">
            <MethodBar name="DCF sensitivity (not weighted)" basis={`${growth}% growth · ${discount}% WACC · your assumptions`} mid={dcfValue} max={barMax} tone="bg-xo-verified" />
            {INST.methodologies.map((m) => (
              <MethodBar key={m.name} name={`${m.name} · ${m.weightPct}%`} basis={m.evidence} mid={m.band.mid} max={barMax} tone="bg-xo-brass" />
            ))}
          </div>
        </Section>

        <Section title="Most likely acquirers · fit-adjusted EV" className="lg:col-span-4"
          foot={`Fit probability is the discovery engine's weighted fit score — not a measured chance of a bid. Premium evidence n=${INST.premium.observedPremiums.length} · ${INST.premium.confidence.tier}. ${INST.premium.note}`}>
          <table className="w-full text-[12px]">
            <thead className="sr-only"><tr><th scope="col">Rank</th><th scope="col">Acquirer</th><th scope="col">Fit probability</th><th scope="col">Days to cash</th></tr></thead>
            <tbody>
              {INST.mostLikelyBuyers.map((b, i) => (
                <tr key={b.name} className="border-b border-xo-line last:border-0">
                  <td className="px-4 py-2 font-mono text-xo-faint">{i + 1}</td>
                  <th scope="row" className="px-2 py-2 text-left font-semibold">{b.name}</th>
                  <td className="px-2 py-2 text-right font-mono font-semibold tabular-nums text-xo-verified"><span className="sr-only">fit probability </span>{b.probabilityPct}%</td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-xo-muted">{b.expectedDaysToCash}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>

      {/* comparables · rationale */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Comparable transactions" className="lg:col-span-8"
          right={<span className="text-[11px] text-xo-muted">{INST.comparablesUsed} sourced · {INST.premium.confidence.tier} evidence</span>}>
          <ScrollRegion label="Comparable transactions table">
            <table className="w-full min-w-[560px] text-[12px]">
              <thead className="text-left text-[11px] text-xo-muted">
                <tr className="border-b border-xo-line"><th scope="col" className="px-4 py-2 font-medium">Target</th><th scope="col" className="px-2 py-2 font-medium">Acquirer</th><th scope="col" className="px-2 py-2 font-medium">Date</th><th scope="col" className="px-2 py-2 text-right font-medium">EV</th><th scope="col" className="px-4 py-2 text-right font-medium">Premium</th></tr>
              </thead>
              <tbody>
                {INST.comparableTransactions.slice(0, 14).map((c) => (
                  <tr key={`${c.buyer}-${c.target}`} className="border-b border-xo-line last:border-0">
                    <th scope="row" className="px-4 py-2 text-left font-normal">{c.target}</th>
                    <td className="px-2 py-2 text-xo-muted">{c.buyer}</td>
                    <td className="px-2 py-2 font-mono text-xo-muted">{c.date ?? "—"}</td>
                    <td className="px-2 py-2 text-right font-mono">{c.priceUsd != null ? fmtMoney(c.priceUsd) : "undisc."}</td>
                    <td className="px-4 py-2 text-right font-mono text-xo-verified">{c.premiumPct != null ? pctStr(c.premiumPct) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>

        <Section title="Strategic rationale · why a buyer pays the premium" className="lg:col-span-4">
          <ul className="space-y-2 px-4 py-3">
            {INST.strategicRationale.map((r) => (
              <li key={r} className="flex gap-2 text-[12px] leading-relaxed text-xo-muted">
                <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-xo-verified" />{r}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

const MethodBar: React.FC<{ name: string; basis: string; mid: number; max: number; tone: string }> = ({ name, basis, mid, max, tone }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0"><span className="text-[13px] font-semibold">{name}</span> <span className="text-[11px] text-xo-muted">· {basis}</span></div>
      <span className="shrink-0 font-mono text-[13px] font-semibold">{fmtMoney(mid)}</span>
    </div>
    <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-xo-line">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, (mid / max) * 100)}%` }} />
    </div>
  </div>
);

export default Valuation;

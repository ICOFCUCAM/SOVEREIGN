import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadActiveCompany } from "../lib/active-company";
import { buildValuationReport, type ValuationReportModel } from "../lib/report-model";
import { fmtMoney } from "../lib/ui";

// ── THE PUBLISHING ENGINE ───────────────────────────────────────────
// Structured report model → board-ready document. White, ink-on-paper,
// institutional typography; cover, table of contents, an executive-summary
// dashboard, numbered sections, transaction/buyer/valuation exhibits, vector
// charts, a data-provenance appendix, a confidentiality watermark and running
// header/footer. "Download PDF" prints through the browser's vector engine —
// no markdown, selectable text, real pages. This is the artifact that leaves
// the building.

const pct = (x: number | null | undefined, d = 0): string => (x == null ? "—" : `${(x * 100).toFixed(d)}%`);
const money = (n: number): string => fmtMoney(n);
const moneyShort = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);

const SECTIONS = [
  "Executive Summary", "Company Overview", "Valuation Methodology", "Comparable Transactions",
  "Strategic Buyer Universe", "Acquisition Probability", "Premium Analysis", "Sensitivity Analysis",
  "Risk Factors", "Data Provenance & Appendix",
];

const Report: React.FC = () => {
  const nav = useNavigate();
  const { company } = useMemo(() => loadActiveCompany(), []);
  const r: ValuationReportModel = useMemo(() => buildValuationReport(company), [company]);

  return (
    <div className="min-h-screen bg-[#0a1018] py-8">
      <style>{PRINT_CSS}</style>

      {/* screen toolbar — never printed */}
      <div className="no-print mx-auto mb-5 flex max-w-[820px] items-center justify-between px-4">
        <button onClick={() => nav(-1)} className="rounded-md border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/5">← Back</button>
        <div className="text-[12px] text-white/45">Institutional Valuation Report · {r.meta.company}</div>
        <button onClick={() => window.print()} className="rounded-md bg-deal-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-deal-500">Download PDF →</button>
      </div>

      <div className="rpt mx-auto max-w-[820px] bg-white text-[#0b1220] shadow-2xl shadow-black/50">
        {/* running header / footer / watermark — repeat on every printed page */}
        <div className="rpt-fixed-header no-screen"><span>{r.meta.company}</span><span>{r.meta.title}</span></div>
        <div className="rpt-fixed-footer no-screen"><span>ExitOS Advisory · Strictly Private &amp; Confidential</span><span>Framework v{r.meta.frameworkVersion}</span></div>
        <div className="rpt-watermark no-screen">CONFIDENTIAL</div>

        {/* ── COVER ── */}
        <section className="rpt-cover flex min-h-[1000px] flex-col px-16 py-20">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#0e7a4f] font-mono text-[13px] font-bold text-white">E</span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.32em] text-[#0e7a4f]">ExitOS Acquisition Exchange</span>
          </div>
          <div className="mt-auto">
            <div className="text-[13px] font-semibold uppercase tracking-[0.26em] text-[#5b6675]">{r.meta.title}</div>
            <h1 className="mt-3 font-serif text-[52px] font-bold leading-[1.05] text-[#0b1220]">{r.meta.company}</h1>
            <div className="mt-6 h-px w-24 bg-[#0e7a4f]" />
            <div className="mt-10 grid grid-cols-2 gap-y-5 text-[13px]">
              <Field k="Prepared for" v={r.meta.preparedFor} />
              <Field k="Prepared by" v={r.meta.preparedBy} />
              <Field k="Date" v={r.meta.date} />
              <Field k="Basis" v="Strategic-buyer enterprise value" />
            </div>
          </div>
          <div className="mt-auto flex items-end justify-between border-t border-[#d8dee8] pt-5">
            <span className="rounded-sm border border-[#c9b08a] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a6d3b]">Strictly Private &amp; Confidential</span>
            <span className="text-[10px] text-[#9aa3b0]">Prepared under the ExitOS Valuation Framework v{r.meta.frameworkVersion}</span>
          </div>
        </section>

        {/* ── TABLE OF CONTENTS ── */}
        <Section n={null} title="Contents" rpt>
          <ol className="mt-2 divide-y divide-[#eef1f5]">
            {SECTIONS.map((s, i) => (
              <li key={s} className="flex items-baseline gap-3 py-2 text-[13.5px]">
                <span className="w-6 font-mono text-[#0e7a4f]">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium text-[#0b1220]">{s}</span>
                <span className="mx-2 flex-1 border-b border-dotted border-[#c8cfda]" />
              </li>
            ))}
          </ol>
        </Section>

        {/* ── 1 · EXECUTIVE SUMMARY ── */}
        <Section n={1} title="Executive Summary" rpt>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded border border-[#e3e8ef] bg-[#e3e8ef]">
            <Stat label="Enterprise Value" value={money(r.exec.evMid)} hero />
            <Stat label="Valuation Range" value={`${moneyShort(r.exec.evLow)} – ${moneyShort(r.exec.evHigh)}`} />
            <Stat label="Confidence" value={`${r.exec.confidencePct}%`} sub={r.exec.confidenceTier} />
            <Stat label="Qualified Buyers" value={String(r.exec.qualifiedBuyers)} sub={`of ${r.exec.scoredBuyers} scored`} />
            <Stat label="Applied Premium" value={`+${pct(r.exec.appliedPremiumPct)}`} sub={r.exec.medianPremiumPct != null ? `${pct(r.exec.medianPremiumPct)} median comp` : "evidence-based"} />
            <Stat label="Expected Close" value={`${r.exec.closeLowDays}–${r.exec.closeHighDays} days`} />
          </div>
          <p className="mt-6 text-[13.5px] leading-relaxed text-[#2b3543]">
            On a strategic-buyer basis, {r.meta.company} carries an enterprise value of{" "}
            <strong className="text-[#0b1220]">{money(r.exec.evMid)}</strong> (range {money(r.exec.evLow)}–{money(r.exec.evHigh)}),
            being the financial baseline of <strong>{money(r.exec.baselineMid)}</strong> uplifted by an evidence-based
            strategic premium of <strong>+{pct(r.exec.appliedPremiumPct)}</strong>, drawn from {r.exec.comparablesUsed} comparable
            transactions. {r.exec.leadBuyer ? <>The most probable acquirer is <strong>{r.exec.leadBuyer}</strong> ({r.exec.leadProbabilityPct}% modelled probability).</> : null}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-[#5b6675]">{r.exec.thesis}</p>
          <ValuationBar low={r.exec.evLow} mid={r.exec.evMid} high={r.exec.evHigh} baseline={r.exec.baselineMid} />
        </Section>

        {/* ── 2 · COMPANY OVERVIEW ── */}
        <Section n={2} title="Company Overview" rpt>
          <table className="w-full border-collapse text-[13px]">
            <tbody>
              {([
                ["Sector", r.overview.sector],
                ["Annual recurring revenue", money(r.overview.arrUsd)],
                ["Trailing twelve-month revenue", money(r.overview.ttmUsd)],
                ["Revenue growth (YoY)", pct(r.overview.growthPct)],
                ["Gross margin", pct(r.overview.grossMarginPct)],
                ["EBITDA margin", pct(r.overview.ebitdaPct)],
                ["Net revenue retention", r.overview.netRetentionPct != null ? pct(r.overview.netRetentionPct) : "—"],
                ["Customers", r.overview.customers != null ? r.overview.customers.toLocaleString() : "—"],
              ] as [string, string][]).map(([k, v]) => (
                <tr key={k} className="border-b border-[#eef1f5]">
                  <td className="py-2 pr-4 text-[#5b6675]">{k}</td>
                  <td className="py-2 text-right font-mono font-semibold text-[#0b1220]">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ── 3 · VALUATION METHODOLOGY ── */}
        <Section n={3} title="Valuation Methodology" rpt>
          <p className="mb-4 text-[13px] leading-relaxed text-[#5b6675]">
            Enterprise value is triangulated across the methodologies below, weighted to a single institutional view.
            Each band derives from the company's reported figures and source-referenced market data.
          </p>
          {r.methodologies.map((m) => {
            const max = Math.max(...r.methodologies.map((x) => x.band.high), r.exec.evHigh);
            return (
              <div key={m.name} className="avoid-break mb-3.5">
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="font-semibold text-[#0b1220]">{m.name} <span className="font-normal text-[#9aa3b0]">· {m.weightPct}% weight</span></span>
                  <span className="font-mono font-semibold text-[#0b1220]">{money(m.band.mid)}</span>
                </div>
                <div className="mt-1 h-2.5 w-full rounded-sm bg-[#eef1f5]">
                  <div className="h-full rounded-sm bg-[#0e7a4f]/30" style={{ marginLeft: `${(m.band.low / max) * 100}%`, width: `${((m.band.high - m.band.low) / max) * 100}%` }}>
                    <div className="h-full w-[2px] bg-[#0e7a4f]" style={{ marginLeft: `${m.band.high > m.band.low ? ((m.band.mid - m.band.low) / (m.band.high - m.band.low)) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="mt-0.5 text-[11px] text-[#9aa3b0]">{m.basis} · {m.evidence}</div>
              </div>
            );
          })}
        </Section>

        {/* ── 4 · COMPARABLE TRANSACTIONS ── */}
        <Section n={4} title="Comparable Transactions" rpt>
          <Exhibit label={`Exhibit 4.1 — Precedent transactions (${r.comparablesAnalysis.count} indexed${r.comparablesAnalysis.medianPremiumPct != null ? `, ${pct(r.comparablesAnalysis.medianPremiumPct)} median premium` : ""})`} />
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b-2 border-[#0b1220] text-left text-[10px] uppercase tracking-wide text-[#5b6675]">
                <th className="py-1.5 pr-2">Target</th><th className="py-1.5 px-2">Acquirer</th>
                <th className="py-1.5 px-2 text-right">Date</th><th className="py-1.5 px-2 text-right">Premium</th><th className="py-1.5 pl-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {r.comparables.map((c, i) => (
                <tr key={`${c.target}-${i}`} className="border-b border-[#eef1f5]">
                  <td className="py-1.5 pr-2 font-medium text-[#0b1220]">{c.target}</td>
                  <td className="py-1.5 px-2 text-[#2b3543]">{c.buyer}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-[#5b6675]">{c.date ?? "—"}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-[#0e7a4f]">{c.premiumPct != null ? `+${pct(c.premiumPct)}` : "—"}</td>
                  <td className="py-1.5 pl-2 text-right font-mono text-[#0b1220]">{c.priceUsd != null ? moneyShort(c.priceUsd) : "undisclosed"}</td>
                </tr>
              ))}
              {r.comparables.length === 0 && <tr><td colSpan={5} className="py-3 text-[#9aa3b0]">No same-sector comparables indexed.</td></tr>}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-[#9aa3b0]">{r.comparablesAnalysis.note}</p>
        </Section>

        {/* ── 5 · STRATEGIC BUYER UNIVERSE ── */}
        <Section n={5} title="Strategic Buyer Universe" rpt>
          <div className="grid grid-cols-4 gap-px overflow-hidden rounded border border-[#e3e8ef] bg-[#e3e8ef]">
            <Stat label="Qualified" value={String(r.buyerUniverse.qualified)} />
            <Stat label="Strategic" value={String(r.buyerUniverse.strategic)} />
            <Stat label="Financial / PE" value={String(r.buyerUniverse.financial)} />
            <Stat label="Sovereign / FO" value={String(r.buyerUniverse.sovereign + r.buyerUniverse.family_office)} />
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-[#5b6675]">
            {r.buyerUniverse.qualified} of {r.buyerUniverse.scored} scored acquirers (from a registry of {r.buyerUniverse.registry})
            qualify against {r.meta.company}'s sector, scale and growth profile.
          </p>
        </Section>

        {/* ── 6 · ACQUISITION PROBABILITY ── */}
        <Section n={6} title="Acquisition Probability" rpt>
          <Exhibit label="Exhibit 6.1 — Most likely acquirers, by fit-adjusted probability" />
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b-2 border-[#0b1220] text-left text-[10px] uppercase tracking-wide text-[#5b6675]">
                <th className="py-1.5 pr-2">#</th><th className="py-1.5 px-2">Acquirer</th>
                <th className="py-1.5 px-2 text-right">Probability</th><th className="py-1.5 pl-2 text-right">Expected days to cash</th>
              </tr>
            </thead>
            <tbody>
              {r.mostLikelyBuyers.map((b, i) => (
                <tr key={b.name} className="border-b border-[#eef1f5]">
                  <td className="py-1.5 pr-2 font-mono text-[#9aa3b0]">{i + 1}</td>
                  <td className="py-1.5 px-2 font-medium text-[#0b1220]">{b.name}</td>
                  <td className="py-1.5 px-2 text-right font-mono font-semibold text-[#0e7a4f]">{b.probabilityPct}%</td>
                  <td className="py-1.5 pl-2 text-right font-mono text-[#2b3543]">{b.expectedDaysToCash}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ── 7 · PREMIUM ANALYSIS ── */}
        <Section n={7} title="Premium Analysis" rpt>
          <p className="mb-4 text-[13px] leading-relaxed text-[#5b6675]">
            The applied strategic premium of <strong className="text-[#0b1220]">+{pct(r.premium.appliedPct)}</strong> is
            underwritten by {r.premium.observedPremiums.length} observed precedent premiums
            ({pct(r.premium.rangeLowPct)}–{pct(r.premium.rangeHighPct)} range, basis: {r.premium.basis.replace(/_/g, " ")}).
          </p>
          <Exhibit label="Exhibit 7.1 — Observed precedent premiums" />
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {[...r.premium.observedPremiums].sort((a, b) => a - b).map((p, i) => {
              const max = Math.max(...r.premium.observedPremiums, r.premium.appliedPct, 0.5);
              return <div key={i} className="flex-1 rounded-t-sm bg-[#0e7a4f]/35" style={{ height: `${(p / max) * 100}%` }} title={pct(p)} />;
            })}
            {r.premium.observedPremiums.length === 0 && <div className="text-[12px] text-[#9aa3b0]">No disclosed precedent premiums in-sample.</div>}
          </div>
          <div className="mt-1 text-[11px] text-[#9aa3b0]">Applied premium +{pct(r.premium.appliedPct)} · {r.premium.note}</div>
        </Section>

        {/* ── 8 · SENSITIVITY ── */}
        <Section n={8} title="Sensitivity Analysis" rpt>
          <Exhibit label="Exhibit 8.1 — Enterprise value across the evidence-based premium band" />
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b-2 border-[#0b1220] text-left text-[10px] uppercase tracking-wide text-[#5b6675]">
                <th className="py-1.5 pr-2">Strategic premium</th><th className="py-1.5 px-2 text-right">Enterprise value</th><th className="py-1.5 pl-2 text-right">Δ vs midpoint</th>
              </tr>
            </thead>
            <tbody>
              {r.sensitivity.map((s) => (
                <tr key={s.premiumPct} className={`border-b border-[#eef1f5] ${Math.abs(s.delta) < 1e6 ? "bg-[#0e7a4f]/[0.06]" : ""}`}>
                  <td className="py-1.5 pr-2 font-mono text-[#0b1220]">+{pct(s.premiumPct)}</td>
                  <td className="py-1.5 px-2 text-right font-mono font-semibold text-[#0b1220]">{money(s.evUsd)}</td>
                  <td className={`py-1.5 pl-2 text-right font-mono ${s.delta >= 0 ? "text-[#0e7a4f]" : "text-[#b4453a]"}`}>{s.delta >= 0 ? "+" : ""}{moneyShort(s.delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ── 9 · RISK FACTORS ── */}
        <Section n={9} title="Risk Factors" rpt>
          <p className="mb-3 text-[13px] leading-relaxed text-[#5b6675]">The factors most likely to be probed in diligence, with the value at stake in each.</p>
          <ol className="space-y-3">
            {r.risks.map((rk, i) => (
              <li key={rk.dimension} className="avoid-break border-l-2 border-[#0e7a4f] pl-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-semibold text-[#0b1220]">{i + 1}. {rk.dimension}</span>
                  <span className="font-mono text-[12.5px] font-semibold text-[#0e7a4f]">{moneyShort(rk.impactUsd)} at stake</span>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-snug text-[#5b6675]">{rk.recommendation} <span className="text-[#9aa3b0]">· {rk.effort}</span></p>
              </li>
            ))}
            {r.risks.length === 0 && <li className="text-[12.5px] text-[#9aa3b0]">No material readiness gaps identified.</li>}
          </ol>
        </Section>

        {/* ── 10 · DATA PROVENANCE & APPENDIX ── */}
        <Section n={10} title="Data Provenance & Appendix" rpt>
          <p className="mb-3 text-[13px] leading-relaxed text-[#5b6675]">
            Every figure in this report traces to a source. {r.provenance.totalFigures} variables underpin the analysis
            {r.provenance.mostRecentDataDate ? `, most recent data as of ${r.provenance.mostRecentDataDate}` : ""}.
          </p>
          <Exhibit label="Exhibit 10.1 — Key variables and sources" />
          <table className="w-full border-collapse text-[11.5px]">
            <thead>
              <tr className="border-b-2 border-[#0b1220] text-left text-[10px] uppercase tracking-wide text-[#5b6675]">
                <th className="py-1.5 pr-2">Variable</th><th className="py-1.5 px-2">Value</th><th className="py-1.5 px-2">Source</th><th className="py-1.5 pl-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {[...r.variables.company, ...r.variables.market, ...r.variables.buyer].filter((v) => v.present).slice(0, 18).map((v) => (
                <tr key={v.name} className="border-b border-[#eef1f5]">
                  <td className="py-1.5 pr-2 text-[#0b1220]">{v.name}</td>
                  <td className="py-1.5 px-2 font-mono text-[#2b3543]">{v.value}</td>
                  <td className="py-1.5 px-2 text-[#5b6675]">{v.source}{v.last_updated ? ` · ${v.last_updated}` : ""}</td>
                  <td className="py-1.5 pl-2 text-[#5b6675]">{v.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 border-t border-[#d8dee8] pt-3 text-[10.5px] leading-relaxed text-[#9aa3b0]">{r.disclaimer}</p>
        </Section>
      </div>
    </div>
  );
};

const Field: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9aa3b0]">{k}</div>
    <div className="mt-1 text-[15px] font-medium text-[#0b1220]">{v}</div>
  </div>
);

const Stat: React.FC<{ label: string; value: string; sub?: string; hero?: boolean }> = ({ label, value, sub, hero }) => (
  <div className="bg-white px-4 py-3.5">
    <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#5b6675]">{label}</div>
    <div className={`mt-1 font-mono font-bold text-[#0b1220] ${hero ? "text-[24px] text-[#0e7a4f]" : "text-[17px]"}`}>{value}</div>
    {sub && <div className="text-[10.5px] text-[#9aa3b0]">{sub}</div>}
  </div>
);

const Exhibit: React.FC<{ label: string }> = ({ label }) => (
  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0e7a4f]">{label}</div>
);

const Section: React.FC<{ n: number | null; title: string; rpt?: boolean; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="rpt-section px-16 py-12">
    <div className="mb-5 flex items-baseline gap-3 border-b-2 border-[#0b1220] pb-2">
      {n != null && <span className="font-mono text-[15px] font-bold text-[#0e7a4f]">{String(n).padStart(2, "0")}</span>}
      <h2 className="font-serif text-[22px] font-bold text-[#0b1220]">{title}</h2>
    </div>
    {children}
  </section>
);

const ValuationBar: React.FC<{ low: number; mid: number; high: number; baseline: number }> = ({ low, mid, high, baseline }) => {
  const max = high * 1.08, scale = (n: number): number => (n / max) * 100;
  return (
    <div className="avoid-break mt-6">
      <Exhibit label="Exhibit 1.1 — Enterprise value range" />
      <div className="relative h-12 rounded-sm bg-[#eef1f5]">
        <div className="absolute top-0 h-full rounded-sm bg-[#0e7a4f]/25" style={{ left: `${scale(low)}%`, width: `${scale(high) - scale(low)}%` }} />
        <div className="absolute top-0 h-full w-[2px] bg-[#0b1220]" style={{ left: `${scale(baseline)}%` }} title="Financial baseline" />
        <div className="absolute top-0 h-full w-[3px] bg-[#0e7a4f]" style={{ left: `${scale(mid)}%` }} title="Midpoint" />
      </div>
      <div className="mt-1 flex justify-between text-[11px] font-mono text-[#5b6675]">
        <span>{moneyShort(low)}</span>
        <span className="text-[#0b1220]">baseline {moneyShort(baseline)}</span>
        <span className="font-semibold text-[#0e7a4f]">midpoint {moneyShort(mid)}</span>
        <span>{moneyShort(high)}</span>
      </div>
    </div>
  );
};

const PRINT_CSS = `
.rpt { position: relative; }
.no-screen { display: none; }
.rpt-watermark { display:none; }
@media print {
  @page { size: A4; margin: 16mm 14mm 18mm; }
  html, body { background: #ffffff !important; }
  .no-print { display: none !important; }
  .rpt { box-shadow: none !important; max-width: none !important; width: 100% !important; margin: 0 !important; }
  .rpt-section, .rpt-cover { break-before: page; }
  .rpt-cover { break-before: avoid; break-after: page; min-height: 0 !important; }
  .avoid-break { break-inside: avoid; }
  tr { break-inside: avoid; }
  .no-screen { display: flex; }
  .rpt-fixed-header { position: fixed; top: 0; left: 0; right: 0; justify-content: space-between; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; color: #9aa3b0; padding: 4mm 14mm 0; }
  .rpt-fixed-footer { position: fixed; bottom: 0; left: 0; right: 0; justify-content: space-between; font-size: 9px; color: #9aa3b0; padding: 0 14mm 4mm; border-top: 1px solid #e3e8ef; }
  .rpt-watermark { display: block; position: fixed; top: 45%; left: 0; right: 0; text-align: center; font-size: 96px; font-weight: 800; letter-spacing: .3em; color: rgba(14,122,79,0.05); transform: rotate(-24deg); }
  @page { @bottom-right { content: "Page " counter(page); font-size: 9px; color: #9aa3b0; } }
}
`;

export default Report;

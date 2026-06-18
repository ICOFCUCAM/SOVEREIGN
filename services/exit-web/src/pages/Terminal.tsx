import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { runInstitutionalValuation, runReadiness, runReadinessAnalysis } from "@exit/engines";
import { rankedBuyers, expectedOutcomeFor, strategicThemes, buyerRationale, acquisitionAppetiteScore, DNA_PROFILES, fmtUsdShort } from "../lib/buyer-dna";
import { loadActiveCompany, activeTokens } from "../lib/active-company";
import BuyerInterestGate from "../components/BuyerInterestGate";

// ── ACQUISITION INTELLIGENCE TERMINAL ───────────────────────────────
// A single operating environment, not a page of cards. One framed
// instrument: a command bar with the mandate + live status strip, then a
// dense grid of hairline-separated panels — buyer rankings, market signals,
// an action queue, comparables, appetite, confidence and themes. Every
// figure is composed from the engines on the active company; nothing new is
// asserted here.

const pct = (x?: number): string => (x == null ? "—" : `${Math.round(x * 100)}%`);
const SECTOR_LABEL: Record<string, string> = {
  enterprise_saas: "Enterprise SaaS", vertical_saas: "Vertical SaaS", b2b_marketplace: "B2B Marketplace",
  consumer_marketplace: "Consumer Marketplace", fintech_payments: "Fintech · Payments", logistics_freight: "Logistics · Freight",
  mobility: "Mobility", ai_infra: "AI Infrastructure", developer_tools: "Developer Tools", media_content: "Media · Content", other: "Diversified",
};

// hairline-framed panel — the building block of the workstation
const Panel: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode; className?: string; foot?: React.ReactNode }> =
  ({ title, right, children, className = "", foot }) => (
    <section className={`flex min-h-0 flex-col bg-ink-900 ${className}`}>
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-deal-300/90">{title}</span>
        {right}
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      {foot && <div className="border-t border-white/10 px-3 py-1.5 text-[9px] leading-tight text-white/35">{foot}</div>}
    </section>
  );

// a status cell in the command strip — label over a mono value
const Cell: React.FC<{ k: string; v: React.ReactNode; accent?: boolean; sub?: string }> = ({ k, v, accent, sub }) => (
  <div className="px-3 py-2">
    <div className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-white/40">{k}</div>
    <div className={`mt-0.5 font-mono text-[15px] font-bold leading-none tabular-nums ${accent ? "text-deal-300" : "text-white"}`}>{v}</div>
    {sub && <div className="mt-1 text-[9px] uppercase tracking-wide text-white/35">{sub}</div>}
  </div>
);

const Terminal: React.FC = () => {
  const { session } = useAuth();
  const plan = session?.plan ?? "free";
  const [openWhy, setOpenWhy] = useState<string | null>(null);

  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const INST = useMemo(() => runInstitutionalValuation(company), [company]);
  const ra = useMemo(() => runReadinessAnalysis(company, runReadiness(company)), [company]);
  const tokens = useMemo(() => activeTokens(company), [company]);
  const BASELINE = INST.financialBaseline.mid;

  const TOP = rankedBuyers(8, tokens).map((r) => ({ ...r, exp: expectedOutcomeFor(r.profile, BASELINE) }));
  const lead = TOP[0];
  const ACTIVE = useMemo(() => DNA_PROFILES
    .filter((p) => p.events_indexed > 0)
    .map((p) => ({ p, a: acquisitionAppetiteScore(p) }))
    .sort((x, y) => y.a.score - x.a.score).slice(0, 7), []);
  const cd = INST.confidence.drivers;
  const themes = strategicThemes(8);
  const comps = INST.comparableTransactions.slice(0, 7);
  const uplift = Math.max(0, ra.projectedStrategicMid - ra.currentStrategicMid);
  const activeAcquirers = DNA_PROFILES.filter((p) => p.events_indexed > 0).length;

  const leadPremium = lead?.profile.premium_pct ?? INST.premium.appliedPct;
  const leadCloseDays = lead?.profile.median_close_days ?? INST.timeToClose.lowDays;
  const asOf = new Date().toISOString().slice(0, 10);

  // action queue — recommended next moves, derived from the engines (not invented)
  const actions: { label: string; meta: string; to: string }[] = [
    ...(lead ? [{ label: `Open outreach · ${lead.profile.name}`, meta: `${lead.probability.pct}% likely · exp. ${fmtUsdShort(lead.exp.expectedClose)}`, to: "/console/banker" }] : []),
    ...ra.weaknesses.slice(0, 3).map((w) => ({ label: w.dimension, meta: `readiness · +${fmtUsdShort(w.valuationUpliftUsd)} uplift`, to: "/console/readiness" })),
    { label: "Prepare NDA package", meta: "gate buyer access on signature", to: "/console/nda" },
    { label: "Assemble CIM", meta: "the institutional memorandum", to: "/console/documents" },
  ];

  const confDrivers: [string, number][] = [
    ["Data completeness", cd.dataCompleteness],
    ["Comparable depth", cd.comparableDepth],
    ["Sector maturity", cd.sectorMaturity],
    ["Financial quality", cd.financialQuality],
    ["Data freshness", cd.dataFreshness],
  ];

  return (
    <div className="space-y-2">
      {plan === "free" && <BuyerInterestGate />}

      {/* ── COMMAND BAR ── identity + live status strip, one framed instrument ── */}
      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-gradient-to-r from-deal-600/15 via-ink-900 to-ink-900 px-4 py-2.5">
          <div className="flex items-baseline gap-3">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-deal-300/80">◉ Mandate</span>
            <span className="font-mono text-[18px] font-bold tracking-tight text-white">{company.name}</span>
            <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/65 ring-1 ring-white/10">{SECTOR_LABEL[company.sector] ?? company.sector}</span>
            <span className="rounded bg-deal-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-deal-300 ring-1 ring-deal-400/30">Active</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-white/55">
            <span>ARR <span className="font-bold text-white/85">{fmtUsdShort(company.revenue.annualRecurringRevenueUsd)}</span></span>
            <span className="text-white/15">│</span>
            <span>TTM <span className="font-bold text-white/85">{fmtUsdShort(company.revenue.trailingTwelveMonthsRevenueUsd)}</span></span>
            <span className="text-white/15">│</span>
            <span>GROWTH <span className="font-bold text-white/85">{pct(company.growth.arrGrowthYoyPct)}</span></span>
            <span className="text-white/15">│</span>
            <span>EBITDA <span className="font-bold text-white/85">{pct(company.revenue.ebitdaMarginPct)}</span></span>
            <span className="text-white/15">│</span>
            <span className="text-white/35">AS OF {asOf}</span>
          </div>
        </div>

        {/* metrics strip — the headline numbers, mono, divided by hairlines */}
        <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-4 lg:grid-cols-7">
          <div className="bg-ink-900"><Cell k="Enterprise value" v={fmtUsdShort(INST.headline.mid)} accent sub={`${fmtUsdShort(INST.headline.low)}–${fmtUsdShort(INST.headline.high)}`} /></div>
          <div className="bg-ink-900"><Cell k="Qualified buyers" v={String(INST.buyerUniverse.qualified)} sub={`of ${INST.buyerUniverse.scored} scored`} /></div>
          <div className="bg-ink-900"><Cell k="Top match" v={lead ? `${lead.probability.pct}%` : "—"} accent sub={lead?.profile.name} /></div>
          <div className="bg-ink-900"><Cell k="Typical premium" v={`+${pct(leadPremium)}`} sub={`range ${pct(INST.premium.rangeLowPct)}–${pct(INST.premium.rangeHighPct)}`} /></div>
          <div className="bg-ink-900"><Cell k="Median close" v={`${leadCloseDays}d`} sub={`${INST.comparablesUsed} comps`} /></div>
          <div className="bg-ink-900"><Cell k="Readiness" v={`${Math.round(ra.currentScore)}`} sub={`→ ${Math.round(ra.projectedScore)} · +${fmtUsdShort(uplift)}`} /></div>
          <div className="bg-ink-900"><Cell k="Confidence" v={`${INST.confidence.score}%`} accent sub={INST.confidence.tier} /></div>
        </div>

        {/* thesis line — the one-sentence answer, operational not marketing */}
        {lead && (
          <div className="border-t border-white/10 bg-ink-900 px-4 py-2 text-[12.5px] text-white/70">
            <Link to={`/console/buyer/${lead.profile.buyer_id}`} className="font-semibold text-deal-200 hover:underline">{lead.profile.name}</Link>{" "}
            is <span className="font-mono font-bold text-deal-200">{lead.probability.pct}%</span> likely to acquire a company like {company.name}.{" "}
            <span className="text-white/45">{buyerRationale(lead.profile, BASELINE, tokens, company.sector).thesis}</span>
          </div>
        )}
      </div>

      {/* ── WORKSTATION GRID ── hairline-separated panels in one frame ── */}
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 lg:grid-cols-12">

        {/* BUYER RANKINGS — the centerpiece */}
        <Panel title="Buyer rankings · by probability" className="lg:col-span-8"
          right={<Link to="/console/buyer-graph" className="text-[9px] uppercase tracking-wide text-white/35 hover:text-deal-300">full ranking →</Link>}
          foot="Expected value = close-weighted to LOI offer. *premium/close not disclosed — neutral prior. Probability = appetite × sector overlap × velocity × recency.">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-3 py-1.5">Buyer</th>
                <th className="px-2 py-1.5 text-right">Prob</th>
                <th className="px-2 py-1.5 text-right">Expected value</th>
                <th className="px-2 py-1.5 text-right">Prem</th>
                <th className="px-2 py-1.5 text-right">Close</th>
                <th className="px-3 py-1.5 text-right">Days</th>
              </tr>
            </thead>
            <tbody>
              {TOP.map((r) => {
                const why = buyerRationale(r.profile, BASELINE, tokens, company.sector);
                const days = r.profile.median_close_days ?? INST.timeToClose.lowDays;
                const open = openWhy === r.profile.buyer_id;
                return (
                  <React.Fragment key={r.profile.buyer_id}>
                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-3 py-1.5">
                        <Link to={`/console/buyer/${r.profile.buyer_id}`} className="font-semibold text-white hover:text-deal-300">{r.profile.name}</Link>
                        <button onClick={() => setOpenWhy(open ? null : r.profile.buyer_id)} className="ml-2 text-[9px] text-white/30 hover:text-deal-300">{open ? "hide" : "why▾"}</button>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="hidden h-1 w-10 overflow-hidden rounded-full bg-white/10 sm:inline-block align-middle"><span className="block h-full bg-deal-500" style={{ width: `${r.probability.pct}%` }} /></span>
                          <span className="font-mono font-bold tabular-nums text-deal-300">{r.probability.pct}%</span>
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/85">{fmtUsdShort(r.exp.expectedClose)}–{fmtUsdShort(r.exp.expectedOffer)}</td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/65">+{Math.round(r.exp.premium * 100)}%{!r.exp.premiumKnown ? "*" : ""}</td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/65">{Math.round(r.exp.close * 100)}%{!r.exp.closeKnown ? "*" : ""}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums text-white/65">{days}</td>
                    </tr>
                    {open && (
                      <tr className="border-b border-white/5 bg-white/[0.015]">
                        <td colSpan={6} className="px-3 py-2">
                          <ul className="grid gap-1 sm:grid-cols-2">
                            {why.points.map((pt) => (
                              <li key={pt.label} className="flex gap-1.5 text-[11px]"><span className="text-deal-400">·</span><span><span className="font-semibold text-white/80">{pt.label}.</span> <span className="text-white/50">{pt.detail}</span></span></li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </Panel>

        {/* right column — signals over action queue */}
        <div className="flex flex-col gap-px bg-white/10 lg:col-span-4">
          <Panel title="Market signals · indexed" className="flex-1"
            right={<span className="font-mono text-[9px] text-white/35">{activeAcquirers} active acquirers</span>}>
            {comps.length ? (
              <ul className="divide-y divide-white/5">
                {comps.map((c, i) => (
                  <li key={`${c.target}-${i}`} className="flex items-baseline justify-between gap-2 px-3 py-[7px] text-[11.5px]">
                    <span className="min-w-0 truncate"><span className="font-medium text-white/90">{c.target}</span> <span className="text-white/30">→</span> <span className="text-white/65">{c.buyer}</span></span>
                    <span className="shrink-0 font-mono tabular-nums text-white/45">{c.date ?? "—"}{c.premiumPct != null && <span className="ml-2 text-deal-300">+{Math.round(c.premiumPct * 100)}%</span>}</span>
                  </li>
                ))}
              </ul>
            ) : <div className="px-3 py-3 text-[11px] text-white/45">No same-sector signals indexed yet.</div>}
          </Panel>
          <Panel title="Action queue" className="flex-1">
            <ul className="divide-y divide-white/5">
              {actions.map((a) => (
                <li key={a.label}>
                  <Link to={a.to} className="flex items-center justify-between gap-2 px-3 py-[7px] transition hover:bg-white/[0.03]">
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-semibold text-white/90">{a.label}</span>
                      <span className="block truncate text-[10px] text-white/40">{a.meta}</span>
                    </span>
                    <span className="shrink-0 text-deal-300/70">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* SIMILAR TRANSACTIONS */}
        <Panel title="Similar transactions" className="lg:col-span-5" foot="Source-referenced precedents from the acquisition registry.">
          {comps.length ? (
            <table className="w-full text-[12px]">
              <tbody>
                {comps.map((c, i) => (
                  <tr key={`${c.target}-${i}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-3 py-[7px]"><span className="font-medium text-white">{c.target}</span> <span className="text-white/30">→</span> <span className="text-white/70">{c.buyer}</span></td>
                    <td className="px-2 py-[7px] text-right font-mono tabular-nums text-white/45">{c.date ?? "—"}</td>
                    <td className="px-2 py-[7px] text-right font-mono tabular-nums text-white/65">{c.premiumPct != null ? `+${Math.round(c.premiumPct * 100)}%` : "—"}</td>
                    <td className="px-3 py-[7px] text-right font-mono tabular-nums text-deal-300">{c.priceUsd != null ? fmtUsdShort(c.priceUsd) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="px-3 py-3 text-[11px] text-white/45">No same-sector comparables indexed yet.</div>}
        </Panel>

        {/* ACTIVE BUYERS · APPETITE */}
        <Panel title="Active buyers · appetite now" className="lg:col-span-4" foot="Appetite = intrinsic acquisitiveness (cadence × acceleration × recency × breadth), independent of you.">
          <table className="w-full text-[12px]">
            <tbody>
              {ACTIVE.map(({ p, a }) => (
                <tr key={p.buyer_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-3 py-[7px]"><Link to={`/console/buyer/${p.buyer_id}`} className="font-semibold text-white hover:text-deal-300">{p.name}</Link></td>
                  <td className="px-2 py-[7px] text-[10px] text-white/40">{p.deals_12m}/12m</td>
                  <td className="px-2 py-[7px] text-right"><span className="inline-block h-1 w-12 overflow-hidden rounded-full bg-white/10 align-middle"><span className="block h-full bg-deal-500" style={{ width: `${a.score}%` }} /></span></td>
                  <td className="px-3 py-[7px] text-right font-mono font-bold tabular-nums text-deal-300">{a.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* CONFIDENCE */}
        <Panel title="Confidence" className="lg:col-span-3"
          right={<span className="font-mono text-[11px] font-bold text-white">{INST.confidence.score}%</span>}
          foot={`${INST.comparablesUsed} comps · ${INST.buyerUniverse.qualified} qualified · v${INST.frameworkVersion}`}>
          <div className="space-y-2 px-3 py-2.5">
            {confDrivers.map(([label, v]) => (
              <div key={label}>
                <div className="flex items-baseline justify-between text-[10.5px]">
                  <span className="text-white/60">{label}</span>
                  <span className="font-mono tabular-nums text-white/45">{Math.round(v * 100)}%</span>
                </div>
                <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-deal-500" style={{ width: `${Math.round(v * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </Panel>

        {/* STRATEGIC THEMES — full-width tape */}
        <Panel title="Strategic themes · detected" className="lg:col-span-12"
          right={<Link to="/console/market-map" className="text-[9px] uppercase tracking-wide text-white/35 hover:text-deal-300">market map →</Link>}>
          <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
            {themes.map((t) => (
              <span key={t.theme} className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] capitalize text-white/80">
                {t.theme} <span className="font-mono text-[9px] text-deal-300">{t.buyers}</span>
              </span>
            ))}
            {themes.length === 0 && <span className="text-[11px] text-white/45">No strategic themes indexed for the active buyer set yet.</span>}
          </div>
        </Panel>
      </div>

      <p className="px-1 text-[10px] text-white/30">
        {fromIntake ? "Personalized to your intake." : "Demo company — run "}{!fromIntake && <Link to="/console/intake" className="text-deal-300 hover:text-deal-200">Value My Company</Link>}{!fromIntake && " to personalize."} All figures composed live from the valuation framework, the buyer graph and {INST.comparablesUsed} comparable transactions — nothing asserted without evidence.
      </p>
    </div>
  );
};

export default Terminal;

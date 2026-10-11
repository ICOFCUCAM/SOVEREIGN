import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { NAV, PLAN_LABEL, needsUpgrade } from "../lib/access";
import { runInstitutionalValuation, runReadiness, runReadinessAnalysis } from "@exit/engines";
import { rankedBuyers, expectedOutcomeFor, strategicThemes, buyerRationale, acquisitionAppetiteScore, buyerConfidence, DNA_PROFILES, DNA_AS_OF, fmtUsdShort } from "../lib/buyer-dna";
import { loadActiveCompany, activeTokens } from "../lib/active-company";
import { Evidence } from "../lib/workstation";
import { Section, Metric, Provenance, Bar, Disclosure, ScrollRegion, ActionLink, Fact } from "../components/xo";
import { RegistryTape } from "../components/xo/RegistryTape";
import { buildMarketTape } from "../lib/market-tape";
import { sectorSignals } from "../lib/sector-signals";
import { AcquisitionReactor, ReactorTelemetry } from "../components/Reactor";
import BuyerInterestGate from "../components/BuyerInterestGate";

// ── ACQUISITION INTELLIGENCE TERMINAL ───────────────────────────────
// Page 01 of the ExitOS institutional redesign (docs/redesign/PAGE-01-
// TERMINAL.md). Read top-down as a decision: the mandate and its data state
// → what it is worth → the decision metrics → who is most likely to buy and
// what to do next → the evidence → supporting market intelligence. Every
// figure is composed from the engines on the active company and carries its
// provenance; nothing new is asserted here.

const pct = (x?: number): string => (x == null ? "—" : `${Math.round(x * 100)}%`);
const SECTOR_LABEL: Record<string, string> = {
  enterprise_saas: "Enterprise SaaS", vertical_saas: "Vertical SaaS", b2b_marketplace: "B2B Marketplace",
  consumer_marketplace: "Consumer Marketplace", fintech_payments: "Fintech · Payments", logistics_freight: "Logistics · Freight",
  mobility: "Mobility", ai_infra: "AI Infrastructure", developer_tools: "Developer Tools", media_content: "Media · Content", other: "Diversified",
};

// A neutral assumption, named in words (not an asterisk) so it is read.
const PriorTag: React.FC = () => (
  <span className="ml-1 align-middle font-sans text-[9px] font-semibold uppercase tracking-wide text-xo-caution" title="Not disclosed by this buyer — a labelled neutral assumption">prior</span>
);

// Low–mid–high band on a shared scale, with the pre-premium financial
// baseline marked. Purely visual; every value is printed beside it.
const RangeBand: React.FC<{ low: number; mid: number; high: number; baseline: number }> = ({ low, mid, high, baseline }) => {
  const max = Math.max(high, baseline) * 1.08 || 1;
  const at = (v: number): string => `${(v / max) * 100}%`;
  return (
    <div aria-hidden className="relative mt-3 h-6">
      <div className="absolute inset-x-0 top-1/2 h-px bg-xo-line" />
      <div className="absolute top-1/2 h-2 -translate-y-1/2 rounded-sm bg-xo-verified/25 ring-1 ring-xo-verified/50" style={{ left: at(low), width: `calc(${at(high)} - ${at(low)})` }} />
      <div className="absolute top-0 h-6 w-0.5 bg-xo-verified" style={{ left: at(mid) }} />
      <div className="absolute top-1 h-4 w-px border-l border-dashed border-xo-brass" style={{ left: at(baseline) }} />
    </div>
  );
};

const Terminal: React.FC = () => {
  const { session } = useAuth();
  const plan = session?.plan ?? "free";
  const role = session?.role ?? "founder";
  // The engagement an action's destination requires, read from the access
  // policy — shown before the click, never enforced here (the route Guard does).
  const gateFor = (to: string): string | null => {
    if (!needsUpgrade(to, role, plan)) return null;
    const e = NAV.find((n) => n.to === to && n.roles.includes("founder"));
    return e?.starter ? `${PLAN_LABEL.prep} or ${PLAN_LABEL.pro}` : PLAN_LABEL.pro;
  };
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

  // Framework figures (what the valuation applies) and the lead buyer's own
  // disclosed figures are different things — they are labelled separately.
  const PREMIUM_BASIS: Record<typeof INST.premium.basis, string> = {
    in_sector: `${INST.premium.inSectorSample} same-sector precedents`,
    market_prior: `market-wide prior · ${INST.premium.marketSample} precedents`,
    neutral_prior: "neutral prior (no precedents)",
  };
  const closeRange = INST.timeToClose.lowDays === INST.timeToClose.highDays
    ? `${INST.timeToClose.lowDays}d` : `${INST.timeToClose.lowDays}–${INST.timeToClose.highDays}d`;
  const leadPremium = lead?.profile.premium_pct;
  const leadCloseDays = lead?.profile.median_close_days;
  // The registry is a bundled snapshot — show its date, never "today".
  const asOf = DNA_AS_OF.slice(0, 10);
  const tape = useMemo(() => buildMarketTape(), []);
  const signals = useMemo(() => sectorSignals(company.sector), [company.sector]);

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

  const dataKind = fromIntake ? "company" : "demo";
  const sectorLabel = SECTOR_LABEL[company.sector] ?? company.sector;

  return (
    <div data-page="terminal" className="space-y-3 text-xo-text">
      {plan === "free" && <BuyerInterestGate />}

      {/* ── 1 · MANDATE ─ identity and data state ───────────────────── */}
      <header className="border border-xo-line bg-xo-ink px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-xo-brass">Acquisition Intelligence Terminal</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-serif text-[24px] font-semibold tracking-tight text-xo-text">{company.name}</h1>
              <span className="text-[13px] text-xo-muted">{sectorLabel}</span>
              <Provenance kind={dataKind} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
            {([
              ["ARR", fmtUsdShort(company.revenue.annualRecurringRevenueUsd)],
              ["TTM revenue", fmtUsdShort(company.revenue.trailingTwelveMonthsRevenueUsd)],
              ["ARR growth", pct(company.growth.arrGrowthYoyPct)],
              ["EBITDA margin", pct(company.revenue.ebitdaMarginPct)],
            ] as const).map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] text-xo-faint">{k}</dt>
                <dd className="font-mono text-[14px] font-semibold tabular-nums text-xo-text">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-2 text-[12px] text-xo-muted">
          {fromIntake
            ? <>Figures use the company data you entered in Value My Company. </>
            : <>This is a sample company, not your data. <ActionLink to="/console/intake">Value My Company</ActionLink> to personalise every figure. </>}
          Market data is a registry snapshot as of <span className="font-mono tabular-nums text-xo-text">{asOf}</span>.
        </p>
      </header>

      {/* ── 2 · VALUE + DECISION METRICS ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Enterprise value" eyebrow="Valuation framework" className="lg:col-span-5"
          right={<Provenance kind="model" />}
          foot={<>Strategic value with the applied premium; the dashed brass mark is the pre-premium financial baseline ({fmtUsdShort(INST.financialBaseline.mid)}). Framework v{INST.frameworkVersion}.</>}>
          <div className="px-4 py-4">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-mono text-[40px] font-semibold leading-none tabular-nums text-xo-text">{fmtUsdShort(INST.headline.mid)}</span>
              <span className="text-[13px] text-xo-muted">midpoint</span>
            </div>
            <RangeBand low={INST.headline.low} mid={INST.headline.mid} high={INST.headline.high} baseline={INST.financialBaseline.mid} />
            <dl className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
              <div><dt className="text-xo-faint">Low</dt><dd className="font-mono tabular-nums text-xo-text">{fmtUsdShort(INST.headline.low)}</dd></div>
              <div className="text-center"><dt className="text-xo-faint">Mid</dt><dd className="font-mono tabular-nums text-xo-verified">{fmtUsdShort(INST.headline.mid)}</dd></div>
              <div className="text-right"><dt className="text-xo-faint">High</dt><dd className="font-mono tabular-nums text-xo-text">{fmtUsdShort(INST.headline.high)}</dd></div>
            </dl>
          </div>
        </Section>

        <section aria-label="Decision metrics" className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3">
          {[
            <Metric key="m" label="Most likely buyer" emphasis provenance="registry"
              value={lead ? `${lead.probability.pct}%` : "—"}
              sub={lead ? <><Link to={`/console/buyer/${lead.profile.buyer_id}`} className="inline-block py-1 text-xo-action hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{lead.profile.name}</Link> · acquisition probability</> : "No ranked buyer"} />,
            <Metric key="q" label="Qualified buyers" provenance="model" value={String(INST.buyerUniverse.qualified)} sub={`of ${INST.buyerUniverse.scored} scored · ${activeAcquirers} active in the registry`} />,
            <Metric key="c" label="Confidence" provenance="model" value={`${INST.confidence.score}%`} sub={`${INST.confidence.tier} · ${INST.comparablesUsed} comparables`} />,
            <Metric key="p" label="Applied premium" provenance={INST.premium.basis === "neutral_prior" ? "prior" : "model"} value={`+${pct(INST.premium.appliedPct)}`} sub={`${PREMIUM_BASIS[INST.premium.basis]} · range ${pct(INST.premium.rangeLowPct)}–${pct(INST.premium.rangeHighPct)}`} />,
            <Metric key="t" label="Time to close" provenance="registry" value={closeRange} sub="announced → closed across ranked acquirers" />,
            <Metric key="r" label="Readiness" provenance="model" value={<>{Math.round(ra.currentScore)}<span className="text-[14px] text-xo-faint"> → {Math.round(ra.projectedScore)}</span></>} sub={`+${fmtUsdShort(uplift)} strategic value if gaps close`} />,
          ].map((m) => <div key={m.key} className="bg-xo-panel">{m}</div>)}
        </section>
      </div>

      {/* ── 3 · DECISION BRIEF ──────────────────────────────────────── */}
      <section aria-label="Decision brief" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line md:grid-cols-2 xl:grid-cols-4">
        {[
          { k: "Where you stand", body: <>Strategic value <span className="font-mono text-xo-text">{fmtUsdShort(INST.headline.mid)}</span>, readiness <span className="font-mono text-xo-text">{Math.round(ra.currentScore)}</span>, {INST.buyerUniverse.qualified} qualified buyers.</> },
          { k: "Market context", body: <>{activeAcquirers} acquirers with indexed activity; {INST.comparablesUsed} comparable transactions on record (latest {INST.provenanceSummary.mostRecentDataDate ?? "—"}).</> },
          { k: "Recommended next move", body: lead ? <>Open outreach to <Link to={`/console/buyer/${lead.profile.buyer_id}`} className="inline-block py-1 font-semibold text-xo-action hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{lead.profile.name}</Link> — {lead.probability.pct}% probability, close-weighted {fmtUsdShort(lead.exp.expectedClose)}.</> : <>List on the exchange to surface the buyer set.</> },
          { k: "Expected outcome", body: <>Strategic range <span className="font-mono text-xo-text">{fmtUsdShort(INST.headline.low)}–{fmtUsdShort(INST.headline.high)}</span>, close {closeRange}, +{fmtUsdShort(uplift)} from readiness.</> },
        ].map((c) => (
          <div key={c.k} className="bg-xo-panel px-4 py-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-xo-faint">{c.k}</h2>
            <p className="mt-1 text-[13px] leading-snug text-xo-muted">{c.body}</p>
          </div>
        ))}
      </section>

      {lead && (
        <p className="border-l-2 border-xo-brass bg-xo-panel px-4 py-2.5 text-[13px] leading-relaxed text-xo-muted">
          <Link to={`/console/buyer/${lead.profile.buyer_id}`} className="font-semibold text-xo-text hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{lead.profile.name}</Link>{" "}
          is <span className="font-mono font-semibold text-xo-verified">{lead.probability.pct}%</span> likely to acquire a company like {company.name}.{" "}
          {buyerRationale(lead.profile, BASELINE, tokens, company.sector).thesis}{" "}
          Their own record: premium {leadPremium != null ? <span className="font-mono text-xo-text">+{pct(leadPremium)}</span> : "not disclosed"} · median close {leadCloseDays != null ? <span className="font-mono text-xo-text">{leadCloseDays}d</span> : "not disclosed"}.
        </p>
      )}

      {/* ── 4 · BUYER INTELLIGENCE + EXECUTION ──────────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Buyer intelligence" eyebrow="Ranked by acquisition probability" className="lg:col-span-8"
          right={<><Provenance kind="registry" /><ActionLink to="/console/buyer-graph">Full ranking →</ActionLink></>}
          foot={<>Expected offer = financial baseline {fmtUsdShort(BASELINE)} × (1 + premium). Close-weighted = expected offer × close rate. <span className="font-semibold text-xo-caution">PRIOR</span> = the buyer has not disclosed it, so a labelled neutral assumption is used (premium 20%, close rate 55%, days = framework low end). Probability = appetite + sector overlap + velocity + recency.</>}>
          <ScrollRegion label="Buyer ranking table">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="text-left text-[11px] font-medium text-xo-faint">
                <tr className="border-b border-xo-line">
                  <th scope="col" className="px-4 py-2 font-medium">Buyer</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Probability</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Expected offer</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Close-weighted</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Premium</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Close rate</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Days</th>
                </tr>
              </thead>
              <tbody>
                {TOP.map((r) => {
                  const why = buyerRationale(r.profile, BASELINE, tokens, company.sector);
                  const daysKnown = r.profile.median_close_days != null;
                  const days = r.profile.median_close_days ?? INST.timeToClose.lowDays;
                  const open = openWhy === r.profile.buyer_id;
                  const whyId = `why-${r.profile.buyer_id}`;
                  return (
                    <React.Fragment key={r.profile.buyer_id}>
                      <tr className={`border-b border-xo-line/60 ${open ? "bg-xo-raise" : "hover:bg-xo-raise/60"}`}>
                        <th scope="row" className="px-4 py-2 text-left font-normal">
                          <Link to={`/console/buyer/${r.profile.buyer_id}`} className="inline-block py-1 font-semibold text-xo-text hover:text-xo-action hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{r.profile.name}</Link>
                          <Disclosure open={open} onToggle={() => setOpenWhy(open ? null : r.profile.buyer_id)} controls={whyId} className="ml-2">
                            {open ? "Hide evidence" : "Evidence"}<span className="sr-only"> for {r.profile.name}</span>
                          </Disclosure>
                        </th>
                        <td className="px-2 py-2 text-right">
                          <Evidence meta={{ methodology: why.thesis, source: "DNA engine · valuation framework", confidence: `${INST.confidence.score}% · ${INST.confidence.tier}` }}>
                            <Bar value={r.probability.pct} label={`${r.probability.pct}%`} width="w-12" />
                          </Evidence>
                        </td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-text">{fmtUsdShort(r.exp.expectedOffer)}</td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-text">{fmtUsdShort(r.exp.expectedClose)}</td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">+{Math.round(r.exp.premium * 100)}%{!r.exp.premiumKnown && <PriorTag />}</td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{Math.round(r.exp.close * 100)}%{!r.exp.closeKnown && <PriorTag />}</td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-xo-muted">{days}{!daysKnown && <PriorTag />}</td>
                      </tr>
                      <tr id={whyId} hidden={!open} className="border-b border-xo-line/60 bg-xo-raise">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="md:col-span-1">
                              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-xo-faint">Why this buyer</h3>
                              <ul className="mt-1.5 space-y-1.5">
                                {why.points.map((pt) => (
                                  <li key={pt.label} className="text-[12px] leading-snug"><span className="font-semibold text-xo-text">{pt.label}.</span> <span className="text-xo-muted">{pt.detail}</span></li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-xo-faint">Probability {r.probability.pct}% =</h3>
                              <dl className="mt-1 divide-y divide-xo-line/60">
                                <Fact k="Appetite (max 50)" v={r.probability.appetite} />
                                <Fact k="Sector overlap (max 34)" v={r.probability.overlap} />
                                <Fact k="Velocity (max 14)" v={r.probability.velocity} />
                                <Fact k="Recency (max 10)" v={r.probability.recency} />
                              </dl>
                              <p className="mt-1 text-[11px] text-xo-faint">{r.probability.rationale}</p>
                            </div>
                            <div>
                              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-xo-faint">Evidence base</h3>
                              <dl className="mt-1 divide-y divide-xo-line/60">
                                <Fact k="Data confidence" v={buyerConfidence(r.profile)} />
                                <Fact k="Events indexed" v={r.profile.events_indexed} />
                                <Fact k="Verified events" v={r.profile.verified_events} />
                                <Fact k="With disclosed value" v={r.profile.disclosed_events} />
                                <Fact k="Last acquisition" v={r.profile.last_acquisition ? `${r.profile.last_acquisition.target} · ${r.profile.last_acquisition.date}` : "none dated"} />
                              </dl>
                              {r.profile.source_url && (
                                <a href={r.profile.source_url} target="_blank" rel="noreferrer noopener" className="mt-1.5 inline-block text-[12px] text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">
                                  Registry source<span className="sr-only"> for {r.profile.name} (opens in a new tab)</span> ↗
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>

        <div className="flex flex-col gap-px bg-xo-line lg:col-span-4">
          <Section title="Next actions" eyebrow="Execution" foot="Derived from the buyer ranking and the readiness analysis. Locked items name the engagement they need.">
            <ul className="divide-y divide-xo-line">
              {actions.map((a) => {
                const gate = gateFor(a.to);
                return (
                  <li key={a.label}>
                    <Link to={a.to} className="flex items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xo-action">
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-xo-text">{a.label}</span>
                        <span className="block truncate text-[11px] text-xo-faint">{a.meta}</span>
                        {gate && <span className="mt-0.5 block text-[11px] font-medium text-xo-caution">Requires {gate}</span>}
                      </span>
                      <span className="shrink-0 text-xo-action" aria-hidden>{gate ? "🔒" : "→"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Section>
          <Section title="Sector signals" eyebrow={`Acquisition indexes · as of ${asOf}`} className="flex-1"
            right={<Provenance kind="snapshot" />}
            foot="12-month acquisitions vs the prior 12 months. Samples are small — read the counts, not just the trend.">
            {signals.length ? (
              <ul className="divide-y divide-xo-line">
                {signals.map((x) => (
                  <li key={x.sector} className="flex items-baseline justify-between gap-2 px-4 py-2 text-[12px]">
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-xo-text">{x.sector}</span>
                      {x.yours && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-xo-brass">your sector</span>}
                      <span className="ml-1.5 text-xo-faint">{x.activeBuyers} buyers</span>
                    </span>
                    <span className="shrink-0 font-mono tabular-nums text-xo-muted">
                      {x.volume12m} vs {x.volumePrior12m}
                      {x.trendPct != null && <span className={`ml-2 ${x.trendPct >= 0 ? "text-xo-verified" : "text-xo-risk"}`}>{x.trendPct >= 0 ? "▲ +" : "▼ "}{Math.round(x.trendPct * 100)}%</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <div className="px-4 py-3 text-[12px] text-xo-muted">No sector index activity in the snapshot.</div>}
          </Section>
        </div>
      </div>

      {/* ── 5 · EVIDENCE ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Comparable transactions" eyebrow="Evidence" className="lg:col-span-8"
          right={<span className="font-mono text-[11px] text-xo-faint">{comps.length} of {INST.comparablesUsed}</span>}
          foot="Source-referenced precedents from the acquisition registry. Focus or hover a source for why the deal is comparable.">
          {comps.length ? (
            <ScrollRegion label="Comparable transactions table">
              <table className="w-full min-w-[560px] text-[13px]">
                <thead className="text-left text-[11px] text-xo-faint">
                  <tr className="border-b border-xo-line">
                    <th scope="col" className="px-4 py-2 font-medium">Target → buyer</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Date</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Price</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Premium</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {comps.map((c, i) => (
                    <tr key={`${c.target}-${i}`} className="border-b border-xo-line/60 last:border-0 hover:bg-xo-raise/60">
                      <td className="px-4 py-2">
                        <span className="font-medium text-xo-text">{c.target}</span> <span className="text-xo-faint">→</span> <span className="text-xo-muted">{c.buyer}</span>
                        <span className="block text-[11px] text-xo-faint">{c.status}{c.closeDays != null ? ` · ${c.closeDays}d to close` : ""}</span>
                      </td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{c.date ?? "—"}</td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-text">{c.priceUsd != null ? fmtUsdShort(c.priceUsd) : <span className="font-sans text-[11px] text-xo-faint">undisclosed</span>}</td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{c.premiumPct != null ? `+${Math.round(c.premiumPct * 100)}%` : "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <Evidence meta={{ methodology: c.rationale, source: c.sourceRef }}>
                          <span className="font-mono text-[11px] text-xo-muted">{c.sourceRef.split(":")[0].replace("_", " ")}</span>
                        </Evidence>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          ) : <div className="px-4 py-3 text-[12px] text-xo-muted">No same-sector comparables indexed yet.</div>}
        </Section>

        <Section title="Confidence" eyebrow="What the valuation rests on" className="lg:col-span-4"
          right={<span className="font-mono text-[14px] font-semibold text-xo-text">{INST.confidence.score}% <span className="text-[11px] font-normal text-xo-faint">{INST.confidence.tier}</span></span>}
          foot={`${INST.comparablesUsed} comparables · ${INST.buyerUniverse.qualified} qualified buyers · framework v${INST.frameworkVersion}`}>
          <ul className="space-y-2.5 px-4 py-3">
            {confDrivers.map(([label, v]) => (
              <li key={label} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-xo-muted">{label}</span>
                <Bar value={Math.round(v * 100)} label={`${Math.round(v * 100)}%`} tone="action" width="w-24" />
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* ── 6 · PROVENANCE & METHODOLOGY ─ editorial reading surface ── */}
      <Section tone="paper" title="How these figures were produced" eyebrow="Provenance & methodology"
        right={<span className="text-[11px] text-xo-paper-muted">Framework v{INST.frameworkVersion}</span>}
        foot={INST.disclaimer}>
        <div className="grid gap-6 px-4 py-4 lg:grid-cols-3">
          <div>
            <h3 className="text-[13px] font-semibold text-xo-paper-text">Valuation methods</h3>
            <ScrollRegion label="Valuation methods table" className="mt-1.5">
              <table className="w-full text-[12px]">
                <thead className="text-left text-[11px] text-xo-paper-muted">
                  <tr className="border-b border-xo-paper-line">
                    <th scope="col" className="py-1 pr-2 font-medium">Method</th>
                    <th scope="col" className="px-2 py-1 text-right font-medium">Weight</th>
                    <th scope="col" className="py-1 pl-2 text-right font-medium">Mid</th>
                  </tr>
                </thead>
                <tbody>
                  {INST.methodologies.map((m) => (
                    <tr key={m.name} className="border-b border-xo-paper-line/70 last:border-0 align-top">
                      <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                        <span className="font-medium text-xo-paper-text">{m.name}</span>
                        <span className="block text-[11px] text-xo-paper-muted">{m.basis}{m.multiple != null ? ` · ${m.multiple.toFixed(1)}×` : ""}</span>
                      </th>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-paper-text">{m.weightPct}%</td>
                      <td className="py-1.5 pl-2 text-right font-mono tabular-nums text-xo-paper-text">{fmtUsdShort(m.band.mid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          </div>
          <div className="space-y-3 text-[12.5px] leading-relaxed text-xo-paper-text">
            <div>
              <h3 className="text-[13px] font-semibold">Premium basis</h3>
              <p className="mt-0.5 text-xo-paper-muted">{INST.premium.note}</p>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold">Confidence</h3>
              <p className="mt-0.5 text-xo-paper-muted">{INST.confidence.note}</p>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold">Comparables</h3>
              <p className="mt-0.5 text-xo-paper-muted">{INST.comparablesAnalysis.note}</p>
            </div>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-xo-paper-text">Sources behind {INST.provenanceSummary.totalFigures} figures</h3>
            <dl className="mt-1 divide-y divide-xo-paper-line">
              {Object.entries(INST.provenanceSummary.bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <Fact key={k} tone="paper" k={k.replace(/_/g, " ")} v={v} />
              ))}
            </dl>
            <p className="mt-2 text-[12px] text-xo-paper-muted">{INST.provenanceSummary.note} Buyer registry snapshot as of {asOf}.</p>
          </div>
        </div>
      </Section>

      {/* ── 7 · SUPPORTING INTELLIGENCE ─ progressive disclosure ────── */}
      <details className="group border border-xo-line bg-xo-panel">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-xo-action">
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-xo-faint">Supporting market intelligence</span>
            <h2 className="text-[14px] font-semibold text-xo-text">Appetite, sector volume, registry extremes, strategic themes and recent entries</h2>
          </span>
          <span aria-hidden className="text-xo-action transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="space-y-3 border-t border-xo-line p-3">
          <RegistryTape items={tape} asOf={asOf} />
          <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
            <Section level={3} title="Most acquisitive buyers" eyebrow="Appetite · independent of you" className="lg:col-span-4"
              foot="Appetite = cadence + acceleration + recency + breadth + themes + geography, 0–100.">
              <ul className="divide-y divide-xo-line">
                {ACTIVE.map(({ p, a }) => (
                  <li key={p.buyer_id} className="flex items-center justify-between gap-2 px-4 py-2 text-[12px]">
                    <span className="min-w-0 truncate"><Link to={`/console/buyer/${p.buyer_id}`} className="inline-block py-1 font-semibold text-xo-text hover:text-xo-action hover:underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{p.name}</Link> <span className="text-xo-faint">{p.deals_12m} in 12m</span></span>
                    <Bar value={a.score} label={String(a.score)} width="w-12" />
                  </li>
                ))}
              </ul>
            </Section>
            <Section level={3} title="Sector volume" eyebrow="Acquisition reactor" className="lg:col-span-4"
              foot={`Node size ∝ √volume · colour = 12-month trend · indexes snapshot as of ${asOf}. Rotation is decorative.`}>
              <AcquisitionReactor height={188} />
            </Section>
            <Section level={3} title="Registry extremes" eyebrow={`Snapshot · as of ${asOf}`} className="lg:col-span-4">
              <ReactorTelemetry />
            </Section>
            <Section level={3} title="Strategic themes" eyebrow="What active acquirers are seeking" className="lg:col-span-12"
              right={<ActionLink to="/console/market-map">Market map →</ActionLink>}>
              <ul className="flex flex-wrap gap-1.5 px-4 py-3">
                {themes.map((t) => (
                  <li key={t.theme} className="inline-flex items-center gap-1.5 border border-xo-line bg-xo-ink px-2 py-1 text-[12px] capitalize text-xo-text">
                    {t.theme} <span className="font-mono text-[11px] text-xo-verified">{t.buyers}<span className="sr-only"> buyers</span></span>
                  </li>
                ))}
                {themes.length === 0 && <li className="text-[12px] text-xo-muted">No strategic themes indexed for the active buyer set yet.</li>}
              </ul>
            </Section>
          </div>
        </div>
      </details>
    </div>
  );
};

export default Terminal;

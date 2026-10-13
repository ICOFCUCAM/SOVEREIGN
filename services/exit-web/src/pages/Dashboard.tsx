import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, LockIcon, fmtMoney, timeAgo } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { requiredEngagement } from "../lib/access";
import {
  assessIntent, runValuation, strategicBuyerReport, assetReplacementReport, runInstitutionalValuation,
  runReadiness, runReadinessAnalysis, runBuyerDiscovery, runDueDiligence,
  createListing, matchBuyersToListing,
} from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { dealContextFor } from "../lib/deal-context";
import { SAMPLE_NDAS, SAMPLE_OFFERS, LISTING_PRIVATE, OFFER_COMPARISON, NEGOTIATION_STATE } from "../lib/engines";
import { liquidityIndex, scenariosFor, heatFor, funnelFor, ownFunnelFor, LIFECYCLE, TWELVE_MONTH_MULTIPLIER } from "../lib/liquidity-view";
import { findOwnListing } from "../lib/listings";
import { ndaRequestsForListing, offersForListing } from "../lib/exit-api";
import { Section, Metric, Provenance, Bar, ScrollRegion, ActionLink, Fact } from "../components/xo";
import ExitProcessModal from "../components/ExitProcessModal";
import BuyerInterestGate from "../components/BuyerInterestGate";
import { commanderMetrics } from "../lib/commander-metrics";
import { loadRun, clearRun, type ExitRun } from "../lib/exit-process";
import { sectorLabel } from "../lib/market-stats";
import { label } from "../lib/labels";
import { emitTelemetry } from "../lib/telemetry";

// ── FOUNDER LIQUIDITY COMMAND ───────────────────────────────────────
// Page 02 of the ExitOS institutional redesign (docs/redesign/PAGE-02-
// LIQUIDITY-COMMAND.md). Reads as a decision: the mandate and its process
// stage → the liquidity position (value now, after fixes, scenarios, odds)
// → the recommended instruction → who is buying → readiness → the deal
// funnel → the valuation evidence. The engines run on the active company
// (the founder's intake, else the demo company); sample offers/NDAs and the
// Exit Process run remain demo fixtures. The shared Liquidity Board and
// Morning Briefing components are not used here (they also serve the Chief
// Investment Banker page, which is redesigned in its own turn).

type Band = ReturnType<typeof runReadiness>["band"];
const BAND_LABEL: Record<Band, string> = {
  not_ready:              "Not ready",
  seed_acquisition:       "Seed acquisition",
  growth_acquisition:     "Growth acquisition",
  strategic_acquisition:  "Strategic acquisition",
};
const SEVERITY: Record<string, string> = { high: "text-xo-risk border-xo-risk/50", medium: "text-xo-caution border-xo-caution/50", low: "text-xo-muted border-xo-line" };

const Dashboard: React.FC = () => {
  const { session } = useAuth();
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  // Every engine run below is for the active company (pure, deterministic).
  const E = useMemo(() => {
    const readiness = runReadiness(company);
    const analysis = runReadinessAnalysis(company, readiness);
    const listing = createListing(company, { visibility: "private_full" });
    return {
      standard: runValuation(company, { reportType: "standard" }),
      strategic: strategicBuyerReport(company),
      replacement: assetReplacementReport(company),
      readiness, analysis,
      buyers: runBuyerDiscovery(company, { limit: 12 }),
      diligence: runDueDiligence(company),
      matches: matchBuyersToListing(listing, company, { limit: 15 }),
      ctx: dealContextFor(company),
      // The console's single enterprise value (decision D1).
      institutional: runInstitutionalValuation(company),
    };
  }, [company]);
  const VALUATION_STANDARD = E.standard, VALUATION_STRATEGIC = E.strategic, VALUATION_REPLACEMENT = E.replacement;
  const READINESS = E.readiness, READINESS_ANALYSIS = E.analysis, BUYERS = E.buyers, DILIGENCE = E.diligence;
  const topBuyers = BUYERS.candidates.slice(0, 5);
  const criticalQs = DILIGENCE.criticalQuestions;
  const redFlags = DILIGENCE.redFlags;
  const arrM = company.revenue.annualRecurringRevenueUsd / 1_000_000;

  const navigate = useNavigate();
  const m = commanderMetrics(E.ctx, E.analysis);

  // Highest-intent buyer + most-likely premium payer for the briefing memo —
  // computed from the same candidates the intelligence pipeline ranks.
  const briefing = useMemo(() => {
    const withIntent = BUYERS.candidates.map((c) => ({ c, intent: assessIntent(c.buyer, c.history) }));
    const byIntent = [...withIntent].sort((a, b) => b.intent.score - a.intent.score)[0];
    const byPremium = [...BUYERS.candidates]
      .filter((c) => c.outcomes.avgPremiumPct != null)
      .sort((a, b) => (b.outcomes.avgPremiumPct ?? 0) - (a.outcomes.avgPremiumPct ?? 0))[0];
    return {
      highestIntent: byIntent ? `${byIntent.c.buyer.name} · intent ${byIntent.intent.score}/100` : undefined,
      premiumPayer: byPremium ? `${byPremium.buyer.name} · +${Math.round((byPremium.outcomes.avgPremiumPct ?? 0) * 100)}% avg` : undefined,
    };
  }, [BUYERS]);

  const [run, setRun] = useState<ExitRun | null>(() => loadRun());
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!modalOpen) setRun(loadRun());
  }, [modalOpen]);

  useEffect(() => {
    emitTelemetry("dashboard_viewed", undefined, "/console");
  }, []);

  const startExit = (): void => {
    emitTelemetry("exit_process_clicked", undefined, "/console");
    setModalOpen(true);
  };
  const resetExit = (): void => {
    emitTelemetry("exit_process_reset", undefined, "/console");
    clearRun();
    setRun(null);
  };

  // Status from real state only: the data source, whether an Exit Process
  // run exists in this browser, and the engine's demand reading.
  const statusChips: Array<[string, string]> = [
    ["Data", fromIntake ? "Your intake" : "Demo company"],
    ["Exit process", run?.status === "complete" ? `Run complete · ${timeAgo(run.finishedAt ?? run.startedAt)}` : run ? "Run in progress" : "Not started"],
    ["Buyer demand", `${m.demandLabel} · ${m.activeBuyers} active of ${E.ctx.dealBuyers.length} matched`],
  ];
  // The engagement each destination needs (display only; the Guard enforces).
  const gate = (to: string): string | null => requiredEngagement(to, session?.role ?? "founder", session?.plan ?? "free");
  const executeGate = gate("/console/autopilot");
  const stageIdx = Math.max(0, LIFECYCLE.findIndex((x) => x.key === (run?.status === "complete" ? "run" : "monitor")));
  const scenarios = scenariosFor(E.ctx.currentValueUsd, E.ctx.potentialValueUsd);
  const liquidity = liquidityIndex(E.ctx.activeBuyers);
  const heat = heatFor(E.ctx.dealBuyers);
  const sampleNdas = SAMPLE_NDAS.filter((n) => n.listingId === LISTING_PRIVATE.listingId && n.state === "active").length;
  // a founder's funnel counts the records on their own listing; the demo's uses its fixtures
  const [own, setOwn] = useState<{ ndas: number; offers: number } | null>(null);
  useEffect(() => {
    if (!fromIntake) return;
    const listing = findOwnListing(company);
    if (!listing) { setOwn({ ndas: 0, offers: 0 }); return; }
    let alive = true;
    void Promise.all([ndaRequestsForListing(listing.id), offersForListing(listing.id)])
      .then(([n, o]) => { if (alive) setOwn({ ndas: n.filter((r) => r.status === "signed").length, offers: o.length }); })
      .catch(() => { if (alive) setOwn({ ndas: 0, offers: 0 }); });
    return () => { alive = false; };
  }, [fromIntake, company]);
  const funnel = fromIntake
    ? ownFunnelFor(E.matches.matches.length, own?.ndas ?? 0, own?.offers ?? 0)
    : funnelFor(E.matches.matches.length, sampleNdas, SAMPLE_OFFERS.length, !!OFFER_COMPARISON.leader);
  const funnelTop = Math.max(1, funnel[0].n);
  const matchFeed = E.matches.matches.slice(0, 4);

  return (
    <div data-page="liquidity-command" className="space-y-3 text-xo-text">
      {/* Listed Founder (free) — surface buyer interest behind the upgrade gate */}
      {(session?.plan ?? "free") === "free" && <BuyerInterestGate />}

      {/* ── 1 · MANDATE ─ identity, data state, process stage, the run ── */}
      <header className="border border-xo-line bg-xo-ink px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-xo-brass">Founder Liquidity Command</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-serif text-[24px] font-semibold tracking-tight text-xo-text">{company.name}</h1>
              <Provenance kind={fromIntake ? "company" : "demo"} />
            </div>
            <div className="mt-1 font-mono text-[12px] text-xo-muted">
              {sectorLabel(company.sector)} · ${arrM.toFixed(1)}M ARR · {company.jurisdiction}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {run?.status === "complete" ? (
              <>
                <Button variant="ghost" onClick={resetExit}>Reset</Button>
                <Button onClick={startExit}>Re-run exit process</Button>
              </>
            ) : (
              <Button onClick={startExit}>Start Exit Process →</Button>
            )}
            {fromIntake && <p className="basis-full text-right text-[11px] text-xo-caution">The Exit Process run uses your company; its negotiation step still scores the demo company's sample offers.</p>}
          </div>
        </div>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-xo-line pt-2">
          {statusChips.map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5">
              <dt className="text-[11px] text-xo-faint">{k}</dt>
              <dd className="font-mono text-[12px] font-semibold tabular-nums text-xo-text">{v}</dd>
            </div>
          ))}
        </dl>
        <nav aria-label="Mandate lifecycle" className="mt-3 border-t border-xo-line pt-2">
          <ol className="flex flex-wrap gap-x-1 gap-y-1">
            {LIFECYCLE.map((st, i) => {
              const state = i < stageIdx ? "done" : i === stageIdx ? "current" : "future";
              const body = (
                <span className={`inline-flex items-baseline gap-1.5 rounded-sm px-2 py-1 text-[12px] ${state === "current" ? "bg-xo-raise text-xo-text ring-1 ring-xo-verified/50" : state === "done" ? "text-xo-muted" : "text-xo-faint"}`}>
                  <span className="font-mono text-[11px]">{state === "done" ? "✓" : st.index}</span>
                  <span className="font-medium">{st.label}</span>
                  {state === "current" && <span className="sr-only">(current phase)</span>}
                  {st.to && gate(st.to) && <span className="text-[11px] text-xo-caution" title={`Requires ${gate(st.to)}`}><LockIcon size={11} /><span className="sr-only">, requires {gate(st.to)}</span></span>}
                </span>
              );
              return (
                <li key={st.key} aria-current={state === "current" ? "step" : undefined}>
                  {st.to ? <Link to={st.to} className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{body}</Link> : body}
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      {/* ── 2 · LIQUIDITY POSITION ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Liquidity position" eyebrow="Founder Liquidity Board" className="lg:col-span-7"

          foot={<>Enterprise value is the institutional valuation framework's midpoint — the same figure as the <ActionLink to="/console">Intelligence Terminal</ActionLink> and the valuation report. Expected value adds the readiness engine's uplift (+{fmtMoney(E.ctx.potentialValueUsd - E.ctx.currentValueUsd)}).</>}>
          <div className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2">
            <div className="bg-xo-panel"><Metric label="Enterprise value" emphasis provenance="model" value={fmtMoney(m.companyValue)} sub={`institutional framework mid · band ${fmtMoney(E.ctx.valuationBand.low)} – ${fmtMoney(E.ctx.valuationBand.high)}`} /></div>
            <div className="bg-xo-panel"><Metric label="Expected value" emphasis provenance="model" value={<span className="text-xo-verified">{fmtMoney(m.potential)}</span>} sub="enterprise value + the priced readiness fixes" /></div>
            <div className="bg-xo-panel"><Metric label="Close-probability index" provenance="model" value={`${m.exitProbability}%`}
              sub={<>Heuristic, not a measured likelihood: 0.35 × Exit Score ({E.ctx.exitScore}) + 0.40 × active buyers ({E.ctx.activeBuyers}/6, max 1) + 0.25 × negotiation leverage ({NEGOTIATION_STATE.leverage}; high = 1, medium = 0.6, low = 0.3; from sample offers).</>} /></div>
            <div className="bg-xo-panel"><Metric label="Time to liquidity" value={<>{m.timeToExitMonths}<span className="text-[13px] text-xo-faint"> mo</span></>} sub="once a buyer is engaged" /></div>
          </div>
        </Section>
        <Section title="Valuation scenarios" eyebrow="Sell now or optimise" className="lg:col-span-5">
          <ul className="divide-y divide-xo-line">
            {scenarios.map((sc) => (
              <li key={sc.key} className="flex items-baseline justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-xo-text">{sc.label}{sc.key === "twelve" && <Provenance kind="prior">Assumption</Provenance>}</span>
                  <span className="block text-[11px] text-xo-faint">{sc.key === "twelve" ? `the 6-month value × ${TWELVE_MONTH_MULTIPLIER} — a fixed multiplier, not a growth forecast` : sc.basis}</span>
                </span>
                <span className={`font-mono text-[18px] font-semibold tabular-nums ${sc.key === "today" ? "text-xo-text" : "text-xo-verified"}`}>{fmtMoney(sc.value)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* ── 3 · RECOMMENDED INSTRUCTION (the briefing) ──────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Recommended action" eyebrow={`Morning Briefing · Chief Investment Banker · ${company.name}`} className="lg:col-span-7">
          <div className="px-4 py-4">
            <p className="max-w-[60ch] text-[16px] font-semibold leading-snug text-xo-text">{m.recommendedAction}</p>
            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
              <div><dt className="text-[11px] text-xo-faint">Expected value increase</dt><dd className="font-mono text-[16px] font-semibold tabular-nums text-xo-verified">+{fmtMoney(m.expectedIncreaseUsd)}</dd></div>
              <div><dt className="text-[11px] text-xo-faint">Confidence index</dt><dd className="font-mono text-[16px] font-semibold tabular-nums text-xo-text">{m.confidencePct}%</dd></div>
            </dl>
            <p className="mt-1 max-w-[60ch] text-[11px] text-xo-faint">Confidence index = 64 + 3 × active buyers + 12 × negotiation leverage (high = 1, medium = 0.6, low = 0.3; from sample offers), capped at 92. A heuristic; it is not the valuation confidence shown on the Intelligence Terminal.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={() => navigate("/console/autopilot")}>Execute →</Button>
              <ActionLink to="/console/autopilot" className="text-[13px]">See the plan</ActionLink>
              {executeGate && <span className="text-[12px] font-medium text-xo-caution">Requires {executeGate}</span>}
            </div>
            <p className="mt-3 text-[12px] text-xo-faint">Execute opens Autonomous Exit, where the agents' work is laid out step by step and each step waits for your approval. Nothing is sent from this page.</p>
          </div>
        </Section>
        <Section title="Briefing register" eyebrow="What the desk is watching" className="lg:col-span-5">
          <dl className="divide-y divide-xo-line px-4 py-1">
            <Fact k="Value actions open" v={<Link to="/console/readiness" className="text-xo-action hover:underline">{m.fixCount} priced fixes · ~6 months</Link>} />
            <Fact k="Buyer activity" v={<Link to="/console/intelligence" className="text-xo-action hover:underline">{m.strategicActive > 0 ? `${m.strategicActive} strategic acquirer${m.strategicActive === 1 ? "" : "s"} in market` : "No strategic acquirer in market yet"}</Link>} />
            {briefing.highestIntent && <Fact k="Highest intent" v={<Link to="/console/intelligence" className="text-xo-action hover:underline">{briefing.highestIntent}</Link>} />}
            {briefing.premiumPayer && <Fact k="Top premium payer" v={<Link to="/console/intelligence" className="text-xo-action hover:underline">{briefing.premiumPayer}</Link>} />}
          </dl>
        </Section>
      </div>

      {run?.status === "complete" && (
        <section aria-label="Exit process status" className="flex flex-wrap items-center justify-between gap-3 border border-xo-verified/40 bg-xo-panel px-4 py-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-xo-verified">Exit process active <Provenance kind="demo">Demo run</Provenance></div>
            <div className="text-[13px] text-xo-text">Initialized {timeAgo(run.startedAt)} · {run.steps.filter((x) => x.status === "done").length}/{run.steps.length} engines complete</div>
          </div>
          <ul className="flex flex-wrap gap-2 text-[11px]">
            {run.artifacts.cim && <li className="border border-xo-line px-2 py-0.5 text-xo-muted">CIM · {run.artifacts.cim.wordCount.toLocaleString()} words</li>}
            {run.artifacts.teaser && <li className="border border-xo-line px-2 py-0.5 text-xo-muted">Teaser ready</li>}
            {run.artifacts.ndasIssued && <li className="border border-xo-line px-2 py-0.5 text-xo-muted">{run.artifacts.ndasIssued.length} NDA drafts (not sent)</li>}
            {run.artifacts.listing && <li className="border border-xo-line px-2 py-0.5 text-xo-muted">Listing {run.artifacts.listing.private.listingId.slice(0, 18)}…</li>}
            {run.artifacts.offerLeaderName && <li className="border border-xo-caution/50 px-2 py-0.5 text-xo-caution">Sample-offer leader: {SAMPLE_OFFERS.find((o) => o.offerId === run.artifacts.offerLeaderName)?.buyerName ?? run.artifacts.offerLeaderName}</li>}
          </ul>
          <p className="basis-full text-[11px] text-xo-faint">The run uses the demo company and sample offers; nothing was sent to any buyer.</p>
        </section>
      )}

      <ExitProcessModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ── 4 · WHO IS BUYING ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Top buyers · ranked" eyebrow={`Top ${BUYERS.candidates.length} ranked buyers (list capped at 12) · ${BUYERS.byType.strategic} strategic · ${BUYERS.byType.pe} PE · ${BUYERS.byType.family_office} family office`} className="lg:col-span-8"
          right={<ActionLink to="/console/intelligence">Open intelligence →</ActionLink>}
          foot={<>Probability = weighted fit: sector 25%, acquisition history 22%, check size 20%, recent activity 15%, business model 10%, geography 8%. Check-size fit is tested against a rule-of-thumb price of {fmtMoney(BUYERS.companyHeadlineUsd)} (the largest of 6× ARR, 3× TTM revenue or $20M) — a ranking input, not a valuation.</>}>
          <ScrollRegion label="Top buyers table">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead className="text-left text-[11px] text-xo-faint">
                <tr className="border-b border-xo-line">
                  <th scope="col" className="px-4 py-2 font-medium">Acquirer</th>
                  <th scope="col" className="px-2 py-2 font-medium">Type</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Check size</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Probability</th>
                </tr>
              </thead>
              <tbody>
                {topBuyers.map((c) => (
                  <tr key={c.buyer.name} className="border-b border-xo-line/60 last:border-0 hover:bg-xo-raise/60">
                    <th scope="row" className="px-4 py-2 text-left font-medium text-xo-text">{c.buyer.name}</th>
                    <td className="px-2 py-2 text-[12px] text-xo-muted">{label(c.buyer.buyerType)}</td>
                    <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-text">{fmtMoney(c.estimatedCheck.low)} – {fmtMoney(c.estimatedCheck.high)}</td>
                    <td className="px-4 py-2 text-right"><Bar value={Math.round(c.probability * 100)} label={`${(c.probability * 100).toFixed(0)}%`} width="w-12" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>
        <div className="flex flex-col gap-px bg-xo-line lg:col-span-4">
          <Section title="Top mandate matches" eyebrow="Matching engine on the listing">
            <ul className="divide-y divide-xo-line">
              {matchFeed.map((f) => (
                <li key={f.buyerName} className="flex items-baseline justify-between gap-3 px-4 py-2 text-[12px]">
                  <span className="min-w-0"><span className="font-semibold text-xo-text">{f.buyerName}</span> <span className="text-xo-muted">matched at {Math.round(f.matchScore * 100)}% fit</span></span>
                  <span className="shrink-0 text-[11px] text-xo-faint">{label(f.suggestedOutreach)}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Acquisition heat map" eyebrow="Where your matched mandates deploy" className="flex-1">
            <ul className="space-y-2 px-4 py-3">
              {heat.map((h) => (
                <li key={h.country} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-xo-muted">{h.country}</span>
                  <Bar value={h.score} label={String(h.score)} width="w-24" />
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      {/* ── 5 · READINESS ───────────────────────────────────────────── */}
      <div id="readiness" className="grid scroll-mt-32 grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Readiness" eyebrow={`${READINESS.overallScore.toFixed(0)}/100 · ${BAND_LABEL[READINESS.band]}`} className="lg:col-span-4">
          <ul className="space-y-2 px-4 py-3">
            {READINESS.dimensions.map((d) => (
              <li key={d.name} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-xo-muted">{d.name}</span>
                <Bar value={Math.max(2, d.score)} label={`${d.score.toFixed(0)}/100`} tone="action" width="w-20" />
              </li>
            ))}
          </ul>
        </Section>
        {READINESS_ANALYSIS.weaknesses.length > 0 && (
          <Section title="Readiness analysis · improvement plan" eyebrow={READINESS_ANALYSIS.headline} className="lg:col-span-8"
            right={<span className="text-right text-[11px] text-xo-faint">Projected mid <span className="font-mono text-[13px] text-xo-verified">{fmtMoney(E.ctx.potentialValueUsd)}</span> vs current {fmtMoney(E.ctx.currentValueUsd)}</span>}>
            <ol className="divide-y divide-xo-line">
              {READINESS_ANALYSIS.weaknesses.slice(0, 4).map((w) => (
                <li key={w.dimension} className="px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[13px] font-semibold text-xo-text">{w.dimension}</span>
                      <span className={`border px-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${SEVERITY[w.severity] ?? SEVERITY.low}`}>{w.severity}</span>
                    </span>
                    <span className="font-mono text-[12px] tabular-nums text-xo-verified">+{fmtMoney(w.valuationUpliftUsd)} <span className="text-xo-faint">· {w.effort}</span></span>
                  </div>
                  <p className="mt-1 text-[13px] text-xo-muted">{w.weakness}</p>
                  <p className="mt-0.5 text-[12px] text-xo-faint">→ {w.recommendation}</p>
                </li>
              ))}
            </ol>
          </Section>
        )}
      </div>

      {/* ── 6 · MARKET & DEAL FUNNEL ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Market liquidity index" eyebrow={`Buyer activity ${E.ctx.activeBuyers} · demand ${E.ctx.demandLabel.toLowerCase()}`} className="lg:col-span-4"
          foot="Index = 70 + 4 × active buyers in the matched pool, capped at 98. A heuristic for this company's buyer pool, not a measure of market depth.">
          <div className="px-4 py-4">
            <div className="font-mono text-[32px] font-semibold leading-none tabular-nums text-xo-text">{liquidity}<span className="text-[14px] text-xo-faint"> / 100</span></div>
            <div className="mt-3"><Bar value={liquidity} width="w-full" /></div>
            <p className="mt-3 text-[13px] text-xo-muted">{E.ctx.demandLabel === "High" ? "Buyer demand is higher than supply — a seller's market for your profile." : "Balanced demand — a clean process still clears."}</p>
          </div>
        </Section>
        <Section title="Deal funnel" eyebrow="From the buyer registry to the leading bid" className="lg:col-span-8"
          foot={fromIntake
            ? "Registry and matches come from the engines for your company; NDAs signed and offers received are the records on your listing."
            : "Registry and matches come from the engines for this company. The NDA, offer and bid stages are demo fixtures (sample NDAs and sample offers)."}>
          <ol className="space-y-1.5 px-4 py-3">
            {funnel.map((f) => (
              <li key={f.label} className="grid grid-cols-[9.5rem_1fr] items-center gap-3 text-[12px]">
                <span className="flex items-center justify-end gap-1.5 text-right text-xo-muted">{f.sample && <Provenance kind="demo">Sample</Provenance>}{f.label}</span>
                <Bar value={Math.max(4, Math.round((f.n / funnelTop) * 100))} label={f.n.toLocaleString()} width="w-full" />
              </li>
            ))}
          </ol>
        </Section>
      </div>

      {/* ── 7 · EVIDENCE ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-3">
        <Section title="Valuation methods" eyebrow="Low · mid · high · the first row is the console value">
          <dl className="divide-y divide-xo-line px-4 py-1">
            {([["Institutional framework (console value)", E.institutional.headline], ["Standard", VALUATION_STANDARD.headline], ["Strategic buyer report", VALUATION_STRATEGIC.headline], ["Asset replacement", VALUATION_REPLACEMENT.headline]] as const).map(([k, v]) => (
              <Fact key={k} k={k} v={`${fmtMoney(v.low)} · ${fmtMoney(v.mid)} · ${fmtMoney(v.high)}`} />
            ))}
          </dl>
          <p className="px-4 pb-3 text-[11px] text-xo-faint">Country adjustment for {company.jurisdiction}: {(VALUATION_STRATEGIC.countryAdjustment * 100).toFixed(0)}%.</p>
        </Section>
        <Section title="Critical diligence questions" eyebrow="Diligence engine">
          {criticalQs.length === 0
            ? <p className="px-4 py-3 text-[13px] text-xo-muted">No critical questions surfaced — clean diligence posture.</p>
            : <ul className="space-y-2 px-4 py-3 text-[13px] text-xo-text">{criticalQs.map((q) => <li key={q}>{q}</li>)}</ul>}
        </Section>
        <Section title="Red flags" eyebrow="Diligence engine">
          {redFlags.length === 0
            ? <p className="px-4 py-3 text-[13px] text-xo-muted">No red flags. Buyer-facing posture is defensible.</p>
            : <ul className="space-y-2 px-4 py-3 text-[13px] text-xo-text">{redFlags.map((f) => <li key={f}>{f}</li>)}</ul>}
        </Section>
      </div>
    </div>
  );
};

export default Dashboard;

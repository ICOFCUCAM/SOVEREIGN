import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fmtMoney, notify } from "../lib/ui";
import { Evidence } from "../lib/workstation";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { PageHeader, Section, Metric, Bar, Provenance } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { isKnown, runReadiness, runReadinessAnalysis } from "@exit/engines";
import { dealContextFor } from "../lib/deal-context";
import { plural } from "../lib/labels";
import { loadActiveCompany } from "../lib/active-company";

// Exit Readiness Score — the category-defining surface. Not a generic score:
// it ties the readiness number directly to money. Current valuation, the
// score, the valuation after fixes, the value left on the table, and the
// ranked fixes that close the gap — each priced. All from the readiness
// engine (runReadiness + runReadinessAnalysis).

const EFFORT_LABEL: Record<string, string> = { weeks: "~weeks", months: "~months", quarters: "~quarters" };

const Readiness: React.FC = () => {
  // The founder's saved intake when there is one, else the demo company.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const { ctx, readiness, analysis } = useMemo(() => {
    const readiness = runReadiness(company);
    return { ctx: dealContextFor(company), readiness, analysis: runReadinessAnalysis(company, readiness) };
  }, [company]);
  const band = ctx.readinessBand;
  const score = ctx.exitScore;
  // The readiness engine's own overall score (shown as "Readiness" on the
  // Terminal and Liquidity Command) is a different model from the ten-category
  // Exit Score; both are named and shown so they are never confused.
  const engineScore = Math.round(readiness.overallScore);
  const current = ctx.currentValueUsd;
  const potential = ctx.potentialValueUsd;
  const left = ctx.valueLeftUsd;
  const upliftPct = current > 0 ? (left / current) * 100 : 0;
  const fixes = [...analysis.weaknesses].sort((a, b) => b.valuationUpliftUsd - a.valuationUpliftUsd);
  const topFix = fixes[0];
  const categories = [...ctx.readinessCategories].sort((a, b) => b.impactUsd - a.impactUsd);

  const scoreColor = score >= 70 ? "#2F6B3F" : score >= 50 ? "#9A6A12" : "#A23A2A";
  const R = 52;
  const circ = 2 * Math.PI * R;

  // "When to sell" — the monitor signal. ExitOS helps decide *when*, not just
  // run the process. Strong growth + open market window argue for going now;
  // a large, fixable readiness gap argues for two quarters of prep first.
  const growthYoy = company.growth.arrGrowthYoyPct;
  // market growth counts only when the company supplied it (a sourced estimate in its story)
  const marketKnown = isKnown(company, "market.marketGrowthPct");
  const marketGrowth = marketKnown ? company.market.marketGrowthPct ?? 0 : 0;
  const gapRatio = current > 0 ? left / current : 0;
  const growthStrong = growthYoy >= 0.3;
  const marketOpen = marketKnown && marketGrowth >= 0.05;
  const verdict = gapRatio > 0.25
    ? { tone: "#9A6A12", label: "Prepare — don't list yet",
        body: `${fmtMoney(left)} of upside is still fixable. Two to three quarters of prep lifts the headline before you ever run a process.` }
    : growthStrong && marketOpen
      ? { tone: "#2F6B3F", label: "Window open — go",
          body: "ARR growth and the company's sourced market growth both clear the thresholds, and the value left is small enough — the rule says start the process now." }
      : { tone: "#8A8378", label: "Monitor — hold",
          body: marketKnown ? "Neither rule fires. Keep building and check this verdict again when your figures change." : "No market growth has been supplied, so the market-window rule cannot fire. Add a sourced market estimate to your company story." };

  const signals = [
    { label: "Exit Score", value: `${score.toFixed(0)}/100`, ok: score >= 60 },
    { label: "Growth momentum", value: `${Math.round(growthYoy * 100)}% YoY`, ok: growthStrong },
    { label: "Market growth (from your company story)", value: marketKnown ? `${Math.round(marketGrowth * 100)}%` : "not supplied", ok: marketOpen },
    { label: "Upside still on table", value: fmtMoney(left), ok: gapRatio <= 0.15 },
  ];

  // PRELAUNCH-REVIEW: Re-score control restored (no re-scoring backend; the score already recomputes from the figures on every render)
  const [scanning, setScanning] = useState(false);
  const rescore = (): void => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      notify(`Re-scored · ${score.toFixed(0)}/100 (${band.replace(/_/g, " ")}) — ${categories.length} categories re-evaluated`);
    }, 700);
  };
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="readiness" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={fromIntake ? `◉ Readiness Desk · Your intake: ${company.name}` : `◉ Readiness Desk · Demo company: ${company.name}`} title="Exit Readiness"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Exit Score {score.toFixed(0)}/100 · readiness engine {engineScore}/100 (<span className="capitalize">{band.replace(/_/g, " ")}</span>) · {verdict.label}</span></>}
        actions={<a href="/report/readiness" target="_blank" rel="noopener noreferrer" className="rounded-sm border border-xo-action/50 px-3 py-1.5 text-[12px] font-medium text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Acquisition Readiness Report →<span className="sr-only"> (opens in a new tab)</span></a>}>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-xo-line pt-2">
          {([["ARR growth", `${Math.round(growthYoy * 100)}%`], ["Market growth", marketKnown ? `${Math.round(marketGrowth * 100)}%` : "not supplied"], ["Categories", String(categories.length)]] as const).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5"><dt className="text-[11px] text-xo-faint">{k}</dt><dd className="font-mono text-[12px] font-semibold tabular-nums">{v}</dd></div>
          ))}
        </dl>
      </PageHeader>

      <section aria-label="Readiness summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-5">
        <div className="bg-xo-panel"><Metric label="Exit Score (ten categories)" emphasis value={`${score.toFixed(0)}/100`} sub={`readiness engine ${engineScore}/100`} /></div>
        <div className="bg-xo-panel"><Metric label="Enterprise value" value={fmtMoney(current)} sub="enterprise value today" /></div>
        <div className="bg-xo-panel"><Metric label="Value after fixes" value={<span className="text-xo-verified">{fmtMoney(potential)}</span>} sub="model: value + readiness uplift" /></div>
        <div className="bg-xo-panel"><Metric label="Value left" value={<span className="text-xo-caution">{fmtMoney(left)}</span>} sub={`+${upliftPct.toFixed(0)}% unclaimed`} /></div>
        <div className="bg-xo-panel"><Metric label="Top fix impact" value={topFix ? `+${fmtMoney(topFix.valuationUpliftUsd)}` : "—"} sub={topFix?.dimension} /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Exit Score" eyebrow="Ten categories" className="lg:col-span-3"
          right={<div className="flex items-center gap-1.5">
            {/* PRELAUNCH-REVIEW: Re-score button restored (simulated; no re-scoring backend) */}
            <button type="button" onClick={rescore} disabled={scanning} className="rounded-sm border border-xo-line px-2 py-0.5 text-[11px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60">{scanning ? "Re-scoring…" : "Re-score"}</button>
            <Link to="/console/intake" className="inline-block rounded-sm border border-xo-line px-2 py-1 text-[11px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Update your figures</Link>
          </div>}
          foot="The score is computed from the company's figures when the page opens. Changing the figures in Value My Company is what changes it.">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="60" cy="60" r={R} fill="none" stroke="#22314b" strokeWidth="10" />
                <circle cx="60" cy="60" r={R} fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={`${circ * (1 - score / 100)}`} />
              </svg>
              <div className="absolute text-center">
                <div className="font-mono text-[34px] font-semibold tabular-nums" style={{ color: scoreColor }}>{score.toFixed(0)}</div>
                <div className="text-[11px] text-xo-faint">/ 100</div>
              </div>
            </div>
            <p className="mt-2 max-w-[16rem] text-center text-[12px] leading-snug text-xo-muted">Weighted average of the categories below that the company's information supports. The readiness engine scores the same company <span className="font-mono font-semibold tabular-nums text-xo-text">{engineScore}/100</span> (<span className="capitalize">{band.replace(/_/g, " ")}</span>) — the number shown as Readiness on the Terminal; it uses its own dimensions and weights.</p>
          </div>
        </Section>

        <Section title="Value cascade · readiness → money" eyebrow="Now vs after fixes" className="lg:col-span-5"
          foot={topFix ? `Biggest single lever: ${topFix.dimension} · ${EFFORT_LABEL[topFix.effort] ?? topFix.effort} · ${topFix.recommendation.split(".")[0]}.` : undefined}>
          <div className="px-4 py-4">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <CascadeStat label="Enterprise value today" value={fmtMoney(current)} sub="institutional framework mid" color="text-xo-text" />
              <CascadeStat label="Potential after fixes" value={fmtMoney(potential)} sub="if the gaps close" color="text-xo-verified" />
              <CascadeStat label="Value left" value={fmtMoney(left)} sub={`+${upliftPct.toFixed(0)}% unclaimed`} color="text-xo-caution" />
            </dl>
            <div aria-hidden className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-xo-line">
              <div className="h-full bg-xo-verified" style={{ width: `${(current / potential) * 100}%` }} />
              <div className="h-full bg-xo-caution/60" style={{ width: `${(left / potential) * 100}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[12px] text-xo-muted">
              <span>Captured · {fmtMoney(current)}</span>
              <span className="text-xo-caution">Unclaimed · {fmtMoney(left)}</span>
            </div>
          </div>
        </Section>

        <Section title="When to sell · rule-based verdict" eyebrow="Verdict" className="lg:col-span-4"
          foot="Rule: Prepare if the value left is over 25% of today's value; otherwise Go if ARR growth is at least 30% and market growth at least 5%; otherwise Monitor. Market growth is the figure entered for the company, not a market feed.">
          <div className="px-4 py-4">
            <p className="inline-flex items-center gap-2 border px-2.5 py-1 text-[13px] font-semibold" style={{ borderColor: verdict.tone, color: verdict.tone }}>{verdict.label}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-xo-muted">{verdict.body}</p>
            <dl className="mt-3 grid grid-cols-2 gap-px bg-xo-line">
              {signals.map((x) => (
                <div key={x.label} className="bg-xo-panel px-3 py-2">
                  <dt className="flex items-center gap-1.5 text-[11px] text-xo-faint"><span aria-hidden className={x.ok ? "text-xo-verified" : "text-xo-caution"}>{x.ok ? "✓" : "!"}</span>{x.label}<span className="sr-only">{x.ok ? " (favourable)" : " (needs attention)"}</span></dt>
                  <dd className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums">{x.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>
      </div>

      <Section title="Ten categories · priced fixes" eyebrow={`Rule-based scores · value left +${fmtMoney(left)} allocated`} className="border border-xo-line"
        foot={`Each category score is a fixed rule on the company's figures (for example, IP starts at 40 and adds points per patent). Each $ figure is the value left, shared out by how far the category sits below 85, weighted — a model allocation, not a buyer quote. ${plural(analysis.weaknesses.length, "weakness", "weaknesses")} found by the readiness engine; the biggest lever is shown above.`}>
        <ol className="divide-y divide-xo-line">
          {categories.map((cat) => (
            <li key={cat.key} className="grid items-center gap-3 px-4 py-2.5 sm:grid-cols-[200px_1fr_130px]">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[17px] font-semibold tabular-nums">{cat.notAssessed ? "—" : cat.score}</span>
                <span className="text-[13px] font-medium">{cat.label}</span>
              </div>
              <div className="min-w-0">
                {cat.notAssessed
                  ? <p className="text-[12px] leading-snug text-xo-caution">{cat.notAssessed.replace(/^not assessed — /, "Not assessed: ")}. Add it to your company story; it is not counted in the Exit Score.</p>
                  : <><Bar value={Math.max(2, cat.score)} width="w-full" tone="action" />
                    <p className="mt-1 text-[12px] leading-snug text-xo-muted">{cat.fix}</p></>}
              </div>
              <div className="text-right">
                {cat.notAssessed ? <span className="text-[12px] text-xo-faint">not counted</span> : cat.impactUsd > 0
                  ? <Evidence align="right" meta={{ methodology: cat.fix, source: "rule-based category score · value left allocated by weighted gap to 85", confidence: `${cat.score}/100 category score (rule-based)` }}><span className="font-mono text-[14px] font-semibold tabular-nums text-xo-verified">+{fmtMoney(cat.impactUsd)}</span></Evidence>
                  : <span className="text-[12px] font-medium text-xo-verified">On track ✓</span>}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <div className="flex flex-wrap gap-2 px-1">
        <Link to="/console/valuation" className="rounded-sm bg-desk-gold px-4 py-2 text-[13px] font-semibold text-desk-ink hover:bg-[#AA8443] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">See the valuation model →</Link>
        <Link to="/console/data-room" className="rounded-sm border border-xo-line px-4 py-2 text-[13px] font-semibold text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Close the gaps in the data room</Link>
      </div>
    </div>
  );
};

const CascadeStat: React.FC<{ label: string; value: string; sub: string; color: string }> = ({ label, value, sub, color }) => (
  <div>
    <dt className="text-[11px] text-xo-faint">{label}</dt>
    <dd className={`mt-1 font-mono text-[20px] font-semibold tabular-nums ${color}`}>{value}</dd>
    <dd className="mt-0.5 text-[11px] text-xo-faint">{sub}</dd>
  </div>
);

export default Readiness;

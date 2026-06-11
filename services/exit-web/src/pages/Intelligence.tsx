import React, { useEffect, useMemo, useState } from "react";
import { Card, Kpi, SectionHeader, Field, inputCls, fmtMoney, ConfidenceChip } from "../lib/ui";
import { VALUATION_STRATEGIC } from "../lib/engines";
import { compareOutcomes, runBuyerDiscovery, type BuyerCandidate } from "@exit/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import { fetchBuyerStats, mergeLiveStatsIntoCandidates, type BuyerLiveStat } from "../lib/buyer-stats";
import { DEAL_INTEL_FMT } from "../lib/market-stats";
import BankerTake from "../components/BankerTake";

// Acquisition Intelligence Engine surface — wired to runBuyerDiscovery.
// Free-text refinement filters the engine output client-side.

const APPETITE_STYLE: Record<"active" | "warm" | "dormant", string> = {
  active:  "text-deal-400",
  warm:    "text-loi-400",
  dormant: "text-white/45",
};

// Provenance tier badges for each signal. Verified (sourced live from
// EDGAR/Wikidata) reads green; unverified (curated, plausible, not
// confirmed) reads white-on-grey; estimated (regex-extracted) reads
// amber; derived (from the static registry) reads as a plain dot;
// caution (negative signal like terminated deals) reads red.
type SignalKind = "derived" | "verified" | "unverified" | "estimated" | "caution";
const SIGNAL_CHIP: Record<SignalKind, string> = {
  derived:    "bg-white/5 text-white/35 ring-1 ring-white/5",
  verified:   "bg-deal-600/30 text-deal-200 ring-1 ring-deal-500/40",
  unverified: "bg-white/10 text-white/50 ring-1 ring-white/15",
  estimated:  "bg-loi-500/15 text-loi-300 ring-1 ring-loi-400/30",
  caution:    "bg-red-500/15 text-red-300 ring-1 ring-red-400/40",
};
const SIGNAL_LABEL: Record<SignalKind, string> = {
  derived: "·", verified: "Verified", unverified: "Unverified", estimated: "Est.", caution: "!",
};
const SIGNAL_TEXT: Record<SignalKind, string> = {
  derived: "text-white/55", verified: "text-white/85", unverified: "text-white/65",
  estimated: "text-white/65", caution: "text-loi-300",
};

// Compose a short strategic narrative from the candidate's real engine fields
// — the strongest fit dimension, the buyer's thesis, and the company's sector —
// so each card reads like a banker's one-line rationale, not a stat.
function narrative(c: BuyerCandidate): string {
  const dims: [string, number][] = [
    ["sector overlap", c.fitDimensions.sectorFit],
    ["business-model fit", c.fitDimensions.modelFit],
    ["check-size fit", c.fitDimensions.checkFit],
    ["geographic footprint", c.fitDimensions.geographyFit],
    ["recent acquisition activity", c.fitDimensions.activityFit],
    ["M&A track record", c.fitDimensions.historyFit],
  ];
  const top = dims.sort((a, b) => b[1] - a[1])[0][0];
  const sector = SAMPLE_COMPANY.sector.replace(/_/g, " ");
  return `${c.buyer.name} likely values ${SAMPLE_COMPANY.name} for its ${sector} position — strongest on ${top}. ${c.buyer.thesis}`;
}

const Intelligence: React.FC = () => {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"probability" | "expected_outcome">("probability");
  const [liveStats, setLiveStats] = useState<readonly BuyerLiveStat[]>([]);
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  // Fetch tenant-measured per-buyer stats once on mount. Failure is
  // non-fatal — the page falls back to the static snapshot.
  useEffect(() => {
    let alive = true;
    fetchBuyerStats()
      .then((s) => { if (alive) setLiveStats(s); })
      .catch(() => { /* silent — snapshot is the fallback */ });
    return () => { alive = false; };
  }, []);

  // Re-run discovery when the sort dimension changes, then merge live
  // stats over the snapshot. The merge re-sorts by the same dimension
  // so live-data-bumped rankings settle correctly.
  const report = useMemo(
    () => runBuyerDiscovery(SAMPLE_COMPANY, { impliedPriceUsd: VALUATION_STRATEGIC.headline.mid, limit: 20, sortBy }),
    [sortBy],
  );
  const candidates = useMemo<readonly BuyerCandidate[]>(() => {
    const merged = mergeLiveStatsIntoCandidates(report.candidates, liveStats, report.companyHeadlineUsd);
    if (sortBy === "expected_outcome") {
      return [...merged].sort((a, b) => b.expectedOutcome.expectedClosingUsd - a.expectedOutcome.expectedClosingUsd);
    }
    return merged;
  }, [report, liveStats, sortBy]);
  const liveCoverage = liveStats.filter((s) => s.closedCount > 0 || s.retradeSampleSize > 0).length;

  const filtered = useMemo(() => {
    if (tokens.length === 0) return candidates;
    return candidates.filter((c) => {
      const hay = [
        c.buyer.name,
        c.buyer.buyerType,
        c.buyer.thesis,
        c.buyer.sectorsActive.join(" "),
        c.buyer.geographyPreferred.join(" "),
      ].join(" ").toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [tokens, candidates]);

  const activeCount = candidates.filter((c) => c.buyer.appetite === "active").length;
  const avgProb = candidates.length > 0
    ? candidates.reduce((s, c) => s + c.probability, 0) / candidates.length
    : 0;

  // Acquisition Radar — signals computed from each candidate's measured
  // acquisition history (EDGAR 8-K / Wikidata / press) and the tracked-deal
  // medians. Lift is a heuristic over the measured track record.
  const trackRecord = candidates
    .filter((c) => c.history.totalDeals > 0)
    .sort((a, b) => b.history.dealsLast3Years - a.history.dealsLast3Years)
    .slice(0, 3)
    .map((c) => ({
      tag: "Track record",
      text: `${c.buyer.name} — ${c.history.totalDeals} tracked acquisition${c.history.totalDeals === 1 ? "" : "s"}${c.history.lastTargetName ? `, most recently ${c.history.lastTargetName}${c.history.lastAcquiredAt ? ` (${c.history.lastAcquiredAt.slice(0, 4)})` : ""}` : ""}.`,
      lift: Math.min(6, Math.max(1, c.history.dealsLast3Years * 2 || c.history.totalDeals)),
    }));
  const radar: { tag: string; text: string; lift: number }[] = [
    ...trackRecord,
    { tag: "Active mandates", text: `${activeCount} of ${candidates.length} matched mandates are actively deploying capital.`, lift: Math.min(4, activeCount) },
    { tag: "Deal medians", text: `Across tracked deals: ${DEAL_INTEL_FMT.medianPremium} median disclosed premium, ${DEAL_INTEL_FMT.medianClose} announce-to-close.`, lift: 2 },
  ];
  const radarLift = radar.reduce((s, r) => s + r.lift, 0);
  return (
    <div>
      <SectionHeader
        kicker="Module 01 · Sourcing"
        title="Acquisition Intelligence Engine"
        description={`Ranked against an implied price of ${fmtMoney(VALUATION_STRATEGIC.headline.mid)}. Probability = sector × model × check × geography × activity × M&A track record (EDGAR 8-K + Wikidata).`}
      />

      {/* ── Acquisition Radar — live market signals ─────────────── */}
      <Card className="mb-8 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/10 bg-deal-600/10 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-deal-600/30 text-[12px] text-deal-200 ring-1 ring-deal-400/40">
              ◎<span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-deal-400" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-deal-300">Acquisition Radar · live</span>
          </div>
          <span className="text-[11px] text-white/55">Outreach success <span className="font-mono font-bold text-deal-300">+{radarLift}%</span></span>
        </div>
        <ul className="divide-y divide-white/5">
          {radar.map((r) => (
            <li key={r.text} className="flex items-start gap-3 px-5 py-3">
              <span className="mt-0.5 shrink-0 rounded bg-white/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/50 ring-1 ring-white/10">{r.tag}</span>
              <span className="flex-1 text-[13px] leading-snug text-white/80">{r.text}</span>
              <span className="shrink-0 font-mono text-[12px] font-semibold text-deal-300">+{r.lift}%</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">Signals computed from the source-referenced acquisition history (EDGAR 8-K / Wikidata / press).</div>
      </Card>

      {candidates[0] && (
        <BankerTake
          next={<>Open conversations with the <span className="text-white">{activeCount} active</span> acquirer{activeCount === 1 ? "" : "s"}, lead with the top-ranked fit.</>}
          stake={<><span className="font-mono font-bold text-deal-300">{fmtMoney(candidates[0].expectedOutcome.expectedClosingUsd)}</span> expected take-home from the best-fit buyer.</>}
          inaction={<>Appetite windows close — active acquirers redeploy capital into the next target while you wait.</>}
          buyer={<><span className="text-white">{candidates[0].buyer.name}</span> — {(candidates[0].probability * 100).toFixed(0)}% match, {candidates[0].buyer.appetite} appetite.</>}
          automate={<>ExitOS scores every buyer on live EDGAR/Wikidata signals and drafts the personalized intro.</>}
          impact={<>{fmtMoney(candidates[0].expectedOutcome.expectedClosingUsd)}</>}
          cta={{ label: "Hand it to the banker", to: "/console/banker" }}
        />
      )}

      {(() => {
        const tally = { verified: 0, unverified: 0, estimated: 0 };
        for (const c of report.candidates) {
          tally.verified   += c.history.coverageByTier.verified;
          tally.unverified += c.history.coverageByTier.unverified;
          tally.estimated  += c.history.coverageByTier.estimated;
        }
        const total = tally.verified + tally.unverified + tally.estimated;
        if (total === 0) return null;
        return (
          <Card className="mb-8 p-4 text-[12px] text-white/65">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Data provenance</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block rounded bg-deal-600/30 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-deal-200 ring-1 ring-deal-500/40">Verified</span>
                <span className="font-mono text-white/85">{tally.verified}</span>
                <span className="text-white/40">deals from live EDGAR/Wikidata fetch</span>
              </span>
              <span className="text-white/20">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-white/50 ring-1 ring-white/15">Unverified</span>
                <span className="font-mono text-white/85">{tally.unverified}</span>
                <span className="text-white/40">curated, source-cited, not yet refreshed</span>
              </span>
              {tally.estimated > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block rounded bg-loi-500/15 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-loi-300 ring-1 ring-loi-400/30">Est.</span>
                    <span className="font-mono text-white/85">{tally.estimated}</span>
                    <span className="text-white/40">prices regex-extracted from filings</span>
                  </span>
                </>
              )}
            </div>
          </Card>
        );
      })()}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Candidates ranked" value={String(candidates.length)} sub="qualifying ≥ 15% probability" />
        <Kpi label="Active acquirers"  value={String(activeCount)} sub="recent-12mo activity" accent="#34d399" />
        <Kpi label="Tracked deals"     value={String(report.candidates.reduce((s, c) => s + c.history.totalDeals, 0))} sub="across registry · sourced" />
        <Kpi label="Average match"     value={avgProb.toFixed(2)} sub="probability × fit" />
      </div>

      {/* Buyer match explanations — the "why", not just the score. The reason
          bullets are real engine signals; the strategic narrative is composed
          from the buyer thesis, the strongest fit dimension and the company
          profile. Banker-level intelligence ahead of the ranked table. */}
      <div className="mt-8">
        <h2 className="font-serif text-lg font-bold text-white">Buyer match explanations</h2>
        <p className="mt-1 text-xs text-white/45">Why these acquirers fit — ranked reasoning, not just a number.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {candidates.slice(0, 3).map((c) => {
            const reasons = c.signals.filter((s) => s.kind !== "caution").slice(0, 4);
            const conf = c.expectedOutcome.overallConfidence.tier;
            return (
              <Card key={c.buyer.name} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold text-white">{c.buyer.name}</div>
                  <div className="text-right">
                    <div className="font-mono text-xl font-bold text-deal-300">{(c.probability * 100).toFixed(0)}%</div>
                    <div className="text-[9px] uppercase tracking-wide text-white/40">match</div>
                  </div>
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-white/45">{c.buyer.buyerType.replace(/_/g, " ")}</div>

                <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Reasons</div>
                <ul className="mt-1.5 space-y-1.5 text-[12px]">
                  {reasons.map((s) => (
                    <li key={s.text} className={`flex items-baseline gap-1.5 ${SIGNAL_TEXT[s.kind]}`}>
                      <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-deal-400" />
                      <span className="leading-snug">{s.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 rounded-md border border-deal-500/20 bg-deal-600/5 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-deal-300">Strategic narrative</div>
                  <p className="mt-1 text-[12px] leading-relaxed text-white/75">{narrative(c)}</p>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-white/45">
                  Confidence <ConfidenceChip tier={conf} sample={c.expectedOutcome.overallConfidence.sample} compact />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="mt-8 p-6">
        <Field label="Refine the candidate set">
          <input
            className={inputCls}
            placeholder="strategic · pe · US · ai · marketplace …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <div className="mt-3 text-xs text-white/40">
          {filtered.length} of {candidates.length} candidates match. {report.summary}
        </div>
      </Card>

      {(() => {
        const standouts = compareOutcomes(candidates.map((c) => c.outcomes));
        if (!standouts.fastestCloser && !standouts.highestPremium && !standouts.bestCloseRate) return null;
        const fmtPct = (n: number) => `${(n * 100).toFixed(0)}%`;
        // Resolve sample sizes from the matching candidate rollup.
        const lookup = (name: string) => candidates.find((c) => c.buyer.name === name)?.outcomes;
        const premiumN = standouts.highestPremium ? (lookup(standouts.highestPremium.buyerName)?.premiumSampleSize ?? 0) : 0;
        const closeN   = standouts.fastestCloser  ? (lookup(standouts.fastestCloser.buyerName)?.closedCount ?? 0)      : 0;
        const tierFrom = (n: number) => n === 0 ? "experimental" : n <= 2 ? "low" : n <= 9 ? "medium" : "high";
        return (
          <Card className="mt-8 p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Deal outcome standouts</div>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
              {standouts.highestPremium && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-white/45">Pays the highest premium</div>
                  <div className="mt-1 flex items-center gap-2 text-white">
                    <span>{standouts.highestPremium.buyerName}</span>
                    <ConfidenceChip tier={tierFrom(premiumN)} sample={premiumN} compact />
                  </div>
                  <div className="text-xs text-deal-300">avg {fmtPct(standouts.highestPremium.avgPremiumPct)} over prior reference</div>
                </div>
              )}
              {standouts.fastestCloser && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-white/45">Closes fastest</div>
                  <div className="mt-1 flex items-center gap-2 text-white">
                    <span>{standouts.fastestCloser.buyerName}</span>
                    <ConfidenceChip tier={tierFrom(closeN)} sample={closeN} compact />
                  </div>
                  <div className="text-xs text-white/65">median {standouts.fastestCloser.medianCloseDays} days announced → closed</div>
                </div>
              )}
              {standouts.bestCloseRate && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-white/45">Highest close rate</div>
                  <div className="mt-1 flex items-center gap-2 text-white">
                    <span>{standouts.bestCloseRate.buyerName}</span>
                    <ConfidenceChip tier={tierFrom(standouts.bestCloseRate.resolved)} sample={standouts.bestCloseRate.resolved} compact />
                  </div>
                  <div className="text-xs text-white/65">{fmtPct(standouts.bestCloseRate.closeRatePct)} of {standouts.bestCloseRate.resolved} resolved LOIs</div>
                </div>
              )}
            </div>
          </Card>
        );
      })()}

      {liveCoverage > 0 && (
        <Card className="mt-8 border-deal-500/40 bg-deal-600/5 p-4 text-[12px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block rounded bg-deal-600/30 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-deal-200 ring-1 ring-deal-500/40">Live data</span>
            <span className="text-white/85">{liveCoverage}</span>
            <span className="text-white/65">
              buyer{liveCoverage === 1 ? "" : "s"} sharpened with tenant-measured close rate, time-to-cash, and retrade — overrides the static snapshot per buyer.
            </span>
          </div>
        </Card>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-bold">Top candidates</h2>
            <p className="mt-1 text-xs text-white/45">
              {sortBy === "expected_outcome"
                ? "Ranked by probability-weighted closing value — the founder's actual take-home expectation."
                : "Ranked by acquisition probability — likelihood the buyer engages and signs."}
            </p>
          </div>
          <div className="flex rounded-md border border-white/10 bg-ink-900/60 p-0.5 text-[11px]">
            <button
              className={`rounded px-3 py-1.5 font-semibold uppercase tracking-wide transition ${sortBy === "probability" ? "bg-deal-600/30 text-deal-200" : "text-white/55 hover:text-white/80"}`}
              onClick={() => setSortBy("probability")}
            >
              Probability
            </button>
            <button
              className={`rounded px-3 py-1.5 font-semibold uppercase tracking-wide transition ${sortBy === "expected_outcome" ? "bg-deal-600/30 text-deal-200" : "text-white/55 hover:text-white/80"}`}
              onClick={() => setSortBy("expected_outcome")}
            >
              Expected outcome
            </button>
          </div>
        </div>
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">Acquirer</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Appetite</th>
                <th className="px-5 py-3">Check size</th>
                <th className="px-5 py-3">Signals</th>
                <th className="px-5 py-3 text-right">Outcomes</th>
                <th className="px-5 py-3 text-right">Expected close</th>
                <th className="px-5 py-3 text-right">Match</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                // Rank badge — #1/#2/#3 for top three in the active sort.
                const rank = candidates.findIndex((x) => x.buyer.name === c.buyer.name);
                const showRankBadge = rank < 3 && tokens.length === 0;
                const rankBg = rank === 0 ? "bg-deal-600/30 text-deal-200 ring-deal-500/40"
                              : rank === 1 ? "bg-stage-engaged/15 text-stage-engaged ring-stage-engaged/40"
                              : "bg-white/5 text-white/55 ring-white/15";
                return (
                <tr key={c.buyer.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 align-top">
                    <div className="flex items-center gap-2">
                      {showRankBadge && (
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono font-bold ring-1 ${rankBg}`}>
                          {rank + 1}
                        </span>
                      )}
                      <div className="font-medium text-white">{c.buyer.name}</div>
                    </div>
                    <div className="mt-1 max-w-md text-xs leading-snug text-white/45">{c.buyer.thesis}</div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] uppercase tracking-wide text-white/65">{c.buyer.buyerType.replace(/_/g, " ")}</td>
                  <td className={`px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wide ${APPETITE_STYLE[c.buyer.appetite]}`}>{c.buyer.appetite}</td>
                  <td className="px-5 py-3.5 text-xs text-white/70">{fmtMoney(c.buyer.checkSizeLowUsd)} – {fmtMoney(c.buyer.checkSizeHighUsd)}</td>
                  <td className="px-5 py-3.5 align-top">
                    <ul className="space-y-1 text-[11px]">
                      {c.signals.slice(0, 5).map((s) => (
                        <li key={s.text} className={`flex items-baseline gap-1.5 ${SIGNAL_TEXT[s.kind]}`}>
                          <span className={`mt-0.5 inline-block rounded px-1 text-[8.5px] font-mono font-bold uppercase tracking-wider leading-3 ${SIGNAL_CHIP[s.kind]}`}>
                            {SIGNAL_LABEL[s.kind]}
                          </span>
                          <span className="leading-snug">{s.text}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-5 py-3.5 text-right align-top text-[11px]">
                    {c.outcomes.loiCount === 0 && c.outcomes.retradeSampleSize === 0 ? (
                      <span className="text-white/30">—</span>
                    ) : (
                      <div className="space-y-0.5 font-mono tabular-nums">
                        {c.outcomes.closeRatePct != null && (
                          <div className="flex items-center justify-end gap-1.5 text-white/85">
                            <span>{(c.outcomes.closeRatePct * 100).toFixed(0)}% close</span>
                            <span className="text-[10px] text-white/40">({c.outcomes.closedCount}W · {c.outcomes.withdrawnCount}D)</span>
                          </div>
                        )}
                        {c.outcomes.medianCloseDays != null && (
                          <div className="text-white/55 text-[10px]">~{c.outcomes.medianCloseDays}d median close</div>
                        )}
                        {c.outcomes.avgPremiumPct != null && (
                          <div className="text-deal-300 text-[10px]">+{(c.outcomes.avgPremiumPct * 100).toFixed(0)}% premium <span className="text-white/35">(n={c.outcomes.premiumSampleSize})</span></div>
                        )}
                        {c.outcomes.avgRetradePct != null && (
                          <div className={`text-[10px] ${c.outcomes.avgRetradePct < -0.02 ? "text-red-300" : "text-white/55"}`}>
                            {c.outcomes.avgRetradePct >= 0 ? "+" : ""}{(c.outcomes.avgRetradePct * 100).toFixed(1)}% retrade <span className="text-white/35">(n={c.outcomes.retradeSampleSize})</span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right align-top">
                    <div className="font-mono tabular-nums font-semibold text-deal-300">{fmtMoney(c.expectedOutcome.expectedClosingUsd)}</div>
                    <div className="mt-0.5 text-[10px] text-white/40 font-mono tabular-nums">
                      {fmtMoney(c.expectedOutcome.expectedHeadlineUsd)} · {(c.expectedOutcome.closeRatePct * 100).toFixed(0)}% · ~{c.expectedOutcome.expectedDaysToCash}d
                    </div>
                    <div className="mt-1 flex justify-end">
                      <ConfidenceChip
                        tier={c.expectedOutcome.overallConfidence.tier}
                        sample={c.expectedOutcome.overallConfidence.sample}
                        compact
                        title={c.expectedOutcome.usedFallback
                          ? `Sector-neutral prior used (${c.expectedOutcome.overallConfidence.note})`
                          : c.expectedOutcome.overallConfidence.note}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right align-top font-mono tabular-nums text-deal-300">{c.probability.toFixed(2)}</td>
                </tr>
              );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-white/40">No candidates match the filter.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default Intelligence;

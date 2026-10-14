import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { requiredEngagement } from "../lib/access";
import { fmtMoney, ConfidenceChip } from "../lib/ui";
import { PageHeader, Section, Metric, ScrollRegion, Chip, Provenance, XO_INPUT, XO_LABEL } from "../components/xo";
import { canonicalValuationFor } from "../lib/canonical-valuation";
import { loadActiveCompany } from "../lib/active-company";
import { compareOutcomes, runBuyerDiscovery, runAcquisitionIntelligence, type BuyerCandidate } from "@exit/engines";
import type { CompanyProfile } from "@exit/engines";
import { fetchBuyerStats, mergeLiveStatsIntoCandidates, type BuyerLiveStat } from "../lib/buyer-stats";
import { DEAL_INTEL_FMT } from "../lib/market-stats";
import { computePlatformSignals } from "../lib/platform-signals";
import { label } from "../lib/labels";
import { sectorLabel } from "../lib/market-stats";
import { MARKET_INDEX_FMT } from "../lib/market-index";

// Acquisition Intelligence Engine surface — wired to runBuyerDiscovery.
// Free-text refinement filters the engine output client-side.

const APPETITE_STYLE: Record<"active" | "warm" | "dormant", string> = {
  active:  "text-xo-verified",
  warm:    "text-xo-caution",
  dormant: "text-xo-faint",
};

// Provenance tier badges for each signal. Verified (sourced live from
// EDGAR/Wikidata) reads green; unverified (curated, plausible, not
// confirmed) reads white-on-grey; estimated (regex-extracted) reads
// amber; derived (from the static registry) reads as a plain dot;
// caution (negative signal like terminated deals) reads red.
type SignalKind = "derived" | "verified" | "unverified" | "estimated" | "caution";
const SIGNAL_CHIP: Record<SignalKind, string> = {
  derived:    "border-xo-line text-xo-faint",
  verified:   "border-xo-verified/50 text-xo-verified",
  unverified: "border-xo-line text-xo-muted",
  estimated:  "border-xo-caution/50 text-xo-caution",
  caution:    "border-xo-risk/50 text-xo-risk",
};
const SIGNAL_LABEL: Record<SignalKind, string> = {
  derived: "·", verified: "Verified", unverified: "Unverified", estimated: "Est.", caution: "!",
};
const SIGNAL_SR: Record<SignalKind, string> = {
  derived: "Derived", verified: "Verified", unverified: "Unverified", estimated: "Estimated", caution: "Caution",
};
const SIGNAL_TEXT: Record<SignalKind, string> = {
  derived: "text-xo-muted", verified: "text-xo-text", unverified: "text-xo-muted",
  estimated: "text-xo-muted", caution: "text-xo-caution",
};

// Compose a short strategic narrative from the candidate's real engine fields
// — the strongest fit dimension, the buyer's thesis, and the company's sector —
// so each card reads like a banker's one-line rationale, not a stat.
function narrative(c: BuyerCandidate, company: CompanyProfile): string {
  const dims: [string, number][] = [
    ["sector overlap", c.fitDimensions.sectorFit],
    ["business-model fit", c.fitDimensions.modelFit],
    ["check-size fit", c.fitDimensions.checkFit],
    ["geographic footprint", c.fitDimensions.geographyFit],
    ["recent acquisition activity", c.fitDimensions.activityFit],
    ["M&A track record", c.fitDimensions.historyFit],
  ];
  const top = dims.sort((a, b) => b[1] - a[1])[0][0];
  const sector = sectorLabel(company.sector);
  return `${c.buyer.name} likely values ${company.name} for its ${sector} position — strongest on ${top}. ${c.buyer.thesis}`;
}

const Intelligence: React.FC = () => {
  const { session } = useAuth();
  // Buyers share this route; founder process data (sample NDAs and offers,
  // the leading counterparty) and the founder's outreach action stay hidden.
  const isBuyer = session?.role === "buyer";
  // The founder's saved intake when there is one, else the demo company.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const impliedPriceUsd = useMemo(() => canonicalValuationFor(company).headline.mid, [company]);
  const bankerGate = requiredEngagement("/console/banker", session?.role ?? "founder", session?.plan ?? "free");
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
    () => runBuyerDiscovery(company, { impliedPriceUsd, limit: 20, sortBy }),
    [company, impliedPriceUsd, sortBy],
  );

  // The full acquisition-intelligence pipeline: registry → fit → pattern →
  // intent → outcome → expected result, plus graph-discovered hidden buyers.
  const intel = useMemo(
    () => runAcquisitionIntelligence(company, { impliedPriceUsd, limit: 5 }),
    [company, impliedPriceUsd],
  );
  const platformSignals = useMemo(() => computePlatformSignals(), []);
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

  // Registry signals — from each candidate's recorded acquisition history
  // (EDGAR 8-K / Wikidata / press) and the tracked-deal medians.
  const trackRecord = candidates
    .filter((c) => c.history.totalDeals > 0)
    .sort((a, b) => b.history.dealsLast3Years - a.history.dealsLast3Years)
    .slice(0, 3)
    .map((c) => ({
      tag: "Track record",
      text: `${c.buyer.name} — ${c.history.totalDeals} tracked acquisition${c.history.totalDeals === 1 ? "" : "s"}${c.history.lastTargetName ? `, most recently ${c.history.lastTargetName}${c.history.lastAcquiredAt ? ` (${c.history.lastAcquiredAt.slice(0, 4)})` : ""}` : ""}.`,
    }));
  const radar: { tag: string; text: string }[] = [
    ...trackRecord,
    { tag: "Active mandates", text: `${activeCount} of ${candidates.length} ranked buyers have an active appetite in the registry (a profile attribute, not recent activity).` },
    { tag: "Deal medians", text: `Across tracked deals: ${DEAL_INTEL_FMT.medianPremium} median disclosed premium, ${DEAL_INTEL_FMT.medianClose} announce-to-close.` },
  ];
  const provenance = (() => {
    const tally = { verified: 0, unverified: 0, estimated: 0 };
    for (const c of report.candidates) {
      tally.verified   += c.history.coverageByTier.verified;
      tally.unverified += c.history.coverageByTier.unverified;
      tally.estimated  += c.history.coverageByTier.estimated;
    }
    return tally;
  })();
  const standouts = compareOutcomes(candidates.map((c) => c.outcomes));
  const fmtPct = (n: number): string => `${(n * 100).toFixed(0)}%`;
  const lookup = (name: string) => candidates.find((c) => c.buyer.name === name)?.outcomes;
  const premiumN = standouts.highestPremium ? (lookup(standouts.highestPremium.buyerName)?.premiumSampleSize ?? 0) : 0;
  const closeN   = standouts.fastestCloser  ? (lookup(standouts.fastestCloser.buyerName)?.closedCount ?? 0)      : 0;
  const tierFrom = (n: number) => n === 0 ? "experimental" as const : n <= 2 ? "low" as const : n <= 9 ? "medium" as const : "high" as const;

  return (
    <div data-page="acquisition-intelligence" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`Module 01 · Sourcing · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`} title="Acquisition Intelligence"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} />{isBuyer && <span className="text-[12px] text-xo-muted">Buyer view — founder process data and outreach are not shown</span>}</>}
        description={`Not a buyer directory. A layered engine that answers one question: which buyer is most likely to produce the best outcome — ranked by expected realized value against an implied price of ${fmtMoney(impliedPriceUsd)}.`} />

      <Section title="Buyer discovery pipeline" className="border border-xo-line"
        right={<span className="font-mono text-[11px] text-xo-faint">market index: {MARKET_INDEX_FMT.events} events · {MARKET_INDEX_FMT.buyers} buyers · as of {MARKET_INDEX_FMT.asOf}</span>}>
        <ol className="grid grid-cols-2 gap-px bg-xo-line sm:grid-cols-3 lg:grid-cols-6">
          {intel.layers.map((l, i) => (
            <li key={l.id} className="bg-xo-panel px-4 py-3">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] font-semibold text-xo-faint">L{i + 1}</span>
                <span className={`font-mono text-[18px] font-semibold tabular-nums ${i === intel.layers.length - 1 ? "text-xo-verified" : "text-xo-text"}`}>{l.pool}</span>
              </div>
              <div className="mt-1 text-[12px] font-semibold leading-tight">{l.name}</div>
              <div className="text-[11px] leading-snug text-xo-faint">{l.note}</div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Most likely successful outcomes" eyebrow="ranked by expected realized value — not headline price" className="border border-xo-line" foot={intel.summary}>
        <ol className="divide-y divide-xo-line">
          {intel.ranked.map((r) => {
            const eo = r.candidate.expectedOutcome;
            return (
              <li key={r.candidate.buyer.name} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span aria-hidden className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-xo-line font-mono text-[12px] font-semibold text-xo-muted">{r.rank}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[14px] font-semibold"><span className="sr-only">Rank {r.rank}: </span>{r.candidate.buyer.name}</h3>
                        <span className="text-[11px] text-xo-muted">{label(r.candidate.buyer.buyerType)}</span>
                        <span className={`text-[11px] font-semibold ${r.intent.tier === "high" ? "text-xo-verified" : r.intent.tier === "medium" ? "text-xo-caution" : "text-xo-muted"}`}>intent {r.intent.score}</span>
                      </div>
                      <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                        {r.whyRanked.map((w) => (
                          <li key={w} className="flex items-baseline gap-1.5 text-[12px] leading-snug text-xo-muted">
                            <span aria-hidden className="text-xo-verified">✓</span> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-right sm:grid-cols-4">
                    <div><dd className="font-mono text-[15px] font-semibold tabular-nums text-xo-verified">{fmtMoney(eo.expectedClosingUsd)}</dd><dt className="text-[11px] text-xo-faint">Expected realized</dt></div>
                    <div><dd className="font-mono text-[15px] font-semibold tabular-nums">{Math.round(eo.closeRatePct * 100)}%</dd><dt className="text-[11px] text-xo-faint">Close probability</dt></div>
                    <div><dd className="font-mono text-[15px] font-semibold tabular-nums">{Math.round(eo.expectedDaysToCash)}d</dd><dt className="text-[11px] text-xo-faint">Time to cash</dt></div>
                    <div><dd className="font-mono text-[15px] font-semibold tabular-nums text-xo-muted">{fmtMoney(eo.expectedHeadlineUsd)}</dd><dt className="text-[11px] text-xo-faint">Offer potential</dt></div>
                  </dl>
                </div>
              </li>
            );
          })}
        </ol>
      </Section>

      <div className={`grid grid-cols-1 gap-px border border-xo-line bg-xo-line ${isBuyer ? "" : "lg:grid-cols-2"}`}>
        <Section title="Network discovery · hidden buyers" eyebrow="off-mandate acquirers reached through the co-acquisition graph">
          <ul className="divide-y divide-xo-line">
            {intel.hidden.map((h) => (
              <li key={h.buyer.name} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold">{h.buyer.name}</span>
                  <span className="font-mono text-[11px] text-xo-faint">via {h.via}</span>
                </div>
                <div className="mt-1 text-[12px] leading-snug text-xo-muted">{h.reason}</div>
              </li>
            ))}
            {intel.hidden.length === 0 && <li className="px-4 py-3 text-[12px] text-xo-muted">No off-mandate adjacency found for this sector yet — the graph grows with every indexed deal.</li>}
          </ul>
        </Section>
        {!isBuyer && <Section title="Process signals · sample records" eyebrow="from the demo company's sample NDAs and offers — demo data"
          foot="Computed from seeded sample records, not from a process run on ExitOS. With real NDAs and offers these figures would come from your own records.">
          <ul className="divide-y divide-xo-line">
            {platformSignals.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold">{s.label}</div>
                  <div className="text-[12px] text-xo-muted">{s.detail}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[15px] font-semibold tabular-nums text-xo-verified">{s.value}</div>
                  <div className="font-mono text-[11px] text-xo-faint">{s.sample}</div>
                </div>
              </li>
            ))}
          </ul>
        </Section>}
      </div>

      <Section title="Registry signals" eyebrow={`Snapshot · as of ${MARKET_INDEX_FMT.asOf}`} className="border border-xo-line"
        foot="Signals computed from the source-referenced acquisition history (EDGAR 8-K / Wikidata / press).">
        <ul className="divide-y divide-xo-line">
          {radar.map((r) => (
            <li key={r.text} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <span className="shrink-0 border border-xo-line px-2 py-0.5 text-[11px] font-medium text-xo-muted">{r.tag}</span>
              <span className="min-w-0 flex-1 text-[13px] leading-snug">{r.text}</span>
            </li>
          ))}
        </ul>
      </Section>

      {!isBuyer && candidates[0] && (
        <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
          right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">{fmtMoney(candidates[0].expectedOutcome.expectedClosingUsd)}</span>}>
          <div className="px-4 py-3">
            <p className="text-[14px] leading-relaxed">Open conversations with the <span className="font-semibold">{activeCount} active</span> acquirer{activeCount === 1 ? "" : "s"}, lead with the top-ranked fit.</p>
            <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
              <TakeCell k="At stake"><span className="font-mono font-semibold text-xo-verified">{fmtMoney(candidates[0].expectedOutcome.expectedClosingUsd)}</span> expected take-home from the best-fit buyer.</TakeCell>
              <TakeCell k="If you wait">The ranking reflects the registry snapshot; appetite can change, and nothing here tracks it over time.</TakeCell>
              <TakeCell k="Pursue">{candidates[0].buyer.name} — {(candidates[0].probability * 100).toFixed(0)}% fit probability, {candidates[0].buyer.appetite} appetite.</TakeCell>
              <TakeCell k="What ExitOS does">Scores every buyer on the registry snapshot (EDGAR / Wikidata / press). Outreach drafts are prepared on the Outreach page; nothing is sent from here.</TakeCell>
            </dl>
            <Link to="/console/banker" className="mt-3 inline-block rounded-sm bg-desk-gold px-4 py-2 text-[13px] font-semibold text-desk-ink hover:bg-[#AA8443] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Hand it to the banker →</Link>
            {bankerGate && <span className="ml-3 text-[12px] text-xo-caution">Requires {bankerGate}</span>}
          </div>
        </Section>
      )}

      {provenance.verified + provenance.unverified + provenance.estimated > 0 && (
        <section aria-label="Data provenance" className="flex flex-wrap items-center gap-x-4 gap-y-1 border border-xo-line bg-xo-panel px-4 py-3 text-[12px] text-xo-muted">
          <span className="text-[11px] font-semibold text-xo-faint">Data provenance</span>
          <span><span className="border border-xo-verified/50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-xo-verified">Verified</span> <span className="font-mono text-xo-text">{provenance.verified}</span> deals fetched from EDGAR/Wikidata (registry snapshot)</span>
          <span><span className="border border-xo-line px-1.5 py-0.5 font-mono text-[11px] font-semibold">Unverified</span> <span className="font-mono text-xo-text">{provenance.unverified}</span> curated, source-cited, not yet refreshed</span>
          {provenance.estimated > 0 && <span><span className="border border-xo-caution/50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-xo-caution">Est.</span> <span className="font-mono text-xo-text">{provenance.estimated}</span> prices regex-extracted from filings</span>}
        </section>
      )}

      <section aria-label="Candidate summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Candidates ranked" value={String(candidates.length)} sub="top by fit probability" /></div>
        <div className="bg-xo-panel"><Metric label="Active-appetite buyers" value={String(activeCount)} sub="registry attribute" /></div>
        <div className="bg-xo-panel"><Metric label="Tracked deals" value={String(report.candidates.reduce((s, c) => s + c.history.totalDeals, 0))} sub="across registry · sourced" /></div>
        <div className="bg-xo-panel"><Metric label="Average fit probability" value={avgProb.toFixed(2)} sub="engine fit score, 0–1" /></div>
      </section>

      <Section title="Buyer match explanations" eyebrow="Why these acquirers fit — ranked reasoning, not just a number." className="border border-xo-line">
        <ul className="grid grid-cols-1 gap-px bg-xo-line lg:grid-cols-3">
          {candidates.slice(0, 3).map((c) => {
            const reasons = c.signals.filter((s) => s.kind !== "caution").slice(0, 4);
            const conf = c.expectedOutcome.overallConfidence.tier;
            return (
              <li key={c.buyer.name} className="bg-xo-panel px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[14px] font-semibold">{c.buyer.name}</h3>
                  <div className="text-right">
                    <div className="font-mono text-[18px] font-semibold tabular-nums text-xo-verified">{(c.probability * 100).toFixed(0)}%</div>
                    <div className="text-[11px] text-xo-faint">fit probability</div>
                  </div>
                </div>
                <div className="text-[11px] text-xo-muted">{label(c.buyer.buyerType)}</div>
                <h4 className="mt-3 text-[11px] font-semibold text-xo-faint">Reasons</h4>
                <ul className="mt-1 space-y-1 text-[12px]">
                  {reasons.map((s) => (
                    <li key={s.text} className={`leading-snug ${SIGNAL_TEXT[s.kind]}`}>· {s.text}</li>
                  ))}
                </ul>
                <div className="mt-3 border border-xo-line px-3 py-2">
                  <h4 className="text-[11px] font-semibold text-xo-faint">Strategic narrative · template sentence</h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-xo-muted">{narrative(c, company)}</p>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-xo-faint">
                  Confidence <ConfidenceChip tier={conf} sample={c.expectedOutcome.overallConfidence.sample} compact />
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {(standouts.fastestCloser || standouts.highestPremium || standouts.bestCloseRate) && (
        <Section title="Deal outcome standouts" className="border border-xo-line">
          <dl className="grid grid-cols-1 gap-px bg-xo-line md:grid-cols-3">
            {standouts.highestPremium && (
              <div className="bg-xo-panel px-4 py-3">
                <dt className="text-[11px] text-xo-faint">Pays the highest premium</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 text-[13px]">{standouts.highestPremium.buyerName} <ConfidenceChip tier={tierFrom(premiumN)} sample={premiumN} compact /></dd>
                <dd className="text-[12px] text-xo-verified">avg {fmtPct(standouts.highestPremium.avgPremiumPct)} over prior reference</dd>
              </div>
            )}
            {standouts.fastestCloser && (
              <div className="bg-xo-panel px-4 py-3">
                <dt className="text-[11px] text-xo-faint">Closes fastest</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 text-[13px]">{standouts.fastestCloser.buyerName} <ConfidenceChip tier={tierFrom(closeN)} sample={closeN} compact /></dd>
                <dd className="text-[12px] text-xo-muted">median {standouts.fastestCloser.medianCloseDays} days announced → closed</dd>
              </div>
            )}
            {standouts.bestCloseRate && (
              <div className="bg-xo-panel px-4 py-3">
                <dt className="text-[11px] text-xo-faint">Highest close rate</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 text-[13px]">{standouts.bestCloseRate.buyerName} <ConfidenceChip tier={tierFrom(standouts.bestCloseRate.resolved)} sample={standouts.bestCloseRate.resolved} compact /></dd>
                <dd className="text-[12px] text-xo-muted">{fmtPct(standouts.bestCloseRate.closeRatePct)} of {standouts.bestCloseRate.resolved} resolved LOIs</dd>
              </div>
            )}
          </dl>
        </Section>
      )}

      {liveCoverage > 0 && (
        <p className="border border-xo-verified/40 bg-xo-panel px-4 py-3 text-[12px] text-xo-muted">
          <span className="mr-2 border border-xo-caution/50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-xo-caution">Recorded stats · demo tenant</span>
          <span className="text-xo-text">{liveCoverage}</span> buyer{liveCoverage === 1 ? "" : "s"} adjusted with close rate, time-to-cash and retrade recorded for the demo tenant (demo data) — these override the registry snapshot per buyer.
        </p>
      )}

      <Section title="Top candidates" className="border border-xo-line"
        eyebrow={sortBy === "expected_outcome"
          ? "Ranked by probability-weighted closing value — the model's expected take-home."
          : "Ranked by fit probability — the engine's weighted fit score, not a measured chance of a bid."}
        right={<div role="group" aria-label="Sort by" className="flex gap-1.5">
          <Chip pressed={sortBy === "probability"} onToggle={() => setSortBy("probability")}>Fit probability</Chip>
          <Chip pressed={sortBy === "expected_outcome"} onToggle={() => setSortBy("expected_outcome")}>Expected outcome</Chip>
        </div>}>
        <div className="border-b border-xo-line px-4 py-3">
          <label htmlFor="intel-filter" className={XO_LABEL}>Refine the candidate set</label>
          <input id="intel-filter" className={XO_INPUT} placeholder="strategic · pe · US · ai · marketplace …" value={query} onChange={(e) => setQuery(e.target.value)} />
          <p className="mt-2 text-[12px] text-xo-faint" aria-live="polite">{filtered.length} of {candidates.length} candidates match. {report.summary}</p>
        </div>
        <ScrollRegion label="Ranked candidate table">
          <table className="w-full min-w-[1100px] text-[13px]">
            <thead className="text-left text-[11px] text-xo-faint">
              <tr className="border-b border-xo-line">
                <th scope="col" className="px-4 py-2 font-medium">Acquirer</th>
                <th scope="col" className="px-4 py-2 font-medium">Type</th>
                <th scope="col" className="px-4 py-2 font-medium">Appetite</th>
                <th scope="col" className="px-4 py-2 font-medium">Check size</th>
                <th scope="col" className="px-4 py-2 font-medium">Signals</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Outcomes</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Expected close</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Fit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const rank = candidates.findIndex((x) => x.buyer.name === c.buyer.name);
                return (
                  <tr key={c.buyer.name} className="border-b border-xo-line last:border-0">
                    <th scope="row" className="px-4 py-3 text-left align-top font-normal">
                      <div className="font-semibold"><span className="mr-1.5 font-mono text-[11px] text-xo-faint">#{rank + 1}</span>{c.buyer.name}</div>
                      <div className="mt-1 max-w-md text-[12px] leading-snug text-xo-muted">{c.buyer.thesis}</div>
                    </th>
                    <td className="px-4 py-3 align-top text-[12px] text-xo-muted">{label(c.buyer.buyerType)}</td>
                    <td className={`px-4 py-3 align-top text-[12px] font-semibold capitalize ${APPETITE_STYLE[c.buyer.appetite]}`}>{c.buyer.appetite}</td>
                    <td className="px-4 py-3 align-top text-[12px] text-xo-muted">{fmtMoney(c.buyer.checkSizeLowUsd)} – {fmtMoney(c.buyer.checkSizeHighUsd)}</td>
                    <td className="px-4 py-3 align-top">
                      <ul className="space-y-1 text-[12px]">
                        {c.signals.slice(0, 5).map((s) => (
                          <li key={s.text} className={`flex items-baseline gap-1.5 ${SIGNAL_TEXT[s.kind]}`}>
                            <span className={`shrink-0 border px-1 font-mono text-[10px] font-semibold ${SIGNAL_CHIP[s.kind]}`}><span aria-hidden>{SIGNAL_LABEL[s.kind]}</span><span className="sr-only">{SIGNAL_SR[s.kind]}:</span></span>
                            <span className="leading-snug">{s.text}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-right align-top text-[12px]">
                      {c.outcomes.loiCount === 0 && c.outcomes.retradeSampleSize === 0 ? (
                        <span className="text-xo-faint">—</span>
                      ) : (
                        <div className="space-y-0.5 font-mono tabular-nums">
                          {c.outcomes.closeRatePct != null && <div>{(c.outcomes.closeRatePct * 100).toFixed(0)}% close <span className="text-[11px] text-xo-faint">({c.outcomes.closedCount}W · {c.outcomes.withdrawnCount}D)</span></div>}
                          {c.outcomes.medianCloseDays != null && <div className="text-[11px] text-xo-muted">~{c.outcomes.medianCloseDays}d median close</div>}
                          {c.outcomes.avgPremiumPct != null && <div className="text-[11px] text-xo-verified">+{(c.outcomes.avgPremiumPct * 100).toFixed(0)}% premium <span className="text-xo-faint">(n={c.outcomes.premiumSampleSize})</span></div>}
                          {c.outcomes.avgRetradePct != null && <div className={`text-[11px] ${c.outcomes.avgRetradePct < -0.02 ? "text-xo-risk" : "text-xo-muted"}`}>{c.outcomes.avgRetradePct >= 0 ? "+" : ""}{(c.outcomes.avgRetradePct * 100).toFixed(1)}% retrade <span className="text-xo-faint">(n={c.outcomes.retradeSampleSize})</span></div>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <div className="font-mono font-semibold tabular-nums text-xo-verified">{fmtMoney(c.expectedOutcome.expectedClosingUsd)}</div>
                      <div className="mt-0.5 font-mono text-[11px] tabular-nums text-xo-faint">{fmtMoney(c.expectedOutcome.expectedHeadlineUsd)} · {(c.expectedOutcome.closeRatePct * 100).toFixed(0)}% · ~{c.expectedOutcome.expectedDaysToCash}d</div>
                      <div className="mt-1 flex justify-end">
                        <ConfidenceChip tier={c.expectedOutcome.overallConfidence.tier} sample={c.expectedOutcome.overallConfidence.sample} compact
                          title={c.expectedOutcome.usedFallback ? `Sector-neutral prior used (${c.expectedOutcome.overallConfidence.note})` : c.expectedOutcome.overallConfidence.note} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right align-top font-mono tabular-nums text-xo-verified">{c.probability.toFixed(2)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[13px] text-xo-muted">No candidates match the filter.</td></tr>
              )}
            </tbody>
          </table>
        </ScrollRegion>
      </Section>
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

export default Intelligence;

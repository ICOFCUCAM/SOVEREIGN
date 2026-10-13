import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageHeader, Section, Metric, ScrollRegion, Provenance } from "../components/xo";
import { captureDealEvent } from "../lib/deal-events";
import {
  buyerById, acquisitionProbability, acquisitionSignals, similarAcquisitionsBy,
  sectorOverlap, recommendedAction, fmtUsdShort, expectedOutcomeFor, buyerRationale,
  acquisitionAppetiteScore, buyerConfidence, DNA_AS_OF,
} from "../lib/buyer-dna";
import { buyerContactRegistry, ENGAGEMENT_DISCLAIMER, ENRICHMENT_PROVIDERS } from "../lib/buyer-contact";
import { runInstitutionalValuation } from "@exit/engines";
import { label } from "../lib/labels";
import { loadActiveCompany, activeTokens } from "../lib/active-company";

// BUYER INTELLIGENCE PROFILE — every indexed buyer's own page. "Microsoft
// Acquisition DNA": the full derived dossier a founder can explore — volume,
// deal sizes, velocity, premiums, regions, strategic themes, similar
// acquisitions and live acquisition-readiness signals. Every figure is
// derived from the ingested registries (Wikipedia · Wikidata · SEC EDGAR).

const BuyerProfile: React.FC = () => {
  const { id = "" } = useParams();
  const p = buyerById(id);
  const [interested, setInterested] = useState(false);
  // The founder's saved intake when there is one, else the demo company —
  // the same inputs the Terminal uses for its buyer list.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const INST = useMemo(() => runInstitutionalValuation(company), [company]);
  const tokens = useMemo(() => activeTokens(company), [company]);

  // Record the view in the founder's deal activity (this browser's storage).
  useEffect(() => {
    if (p) captureDealEvent({ actorRole: "founder", kind: "viewed_buyer", subjectType: "buyer", subjectId: p.buyer_id, subjectName: p.name });
  }, [p]);

  if (!p) {
    return (
      <div data-page="buyer-profile" className="space-y-3 text-xo-text">
        <PageHeader eyebrow="Buyer Intelligence" title="Buyer not found" description="No indexed buyer matches this profile." />
        <Link to="/console/buyer-graph" className="inline-block py-1 text-[13px] font-semibold text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">← Back to the Buyer Graph</Link>
      </div>
    );
  }

  const prob = acquisitionProbability(p, tokens);
  const { signals, activeCount } = acquisitionSignals(p);
  const overlap = sectorOverlap(p, tokens);
  const similar = similarAcquisitionsBy(p.name);

  // Phase 2 — expected outcome for the founder's company under THIS buyer:
  // baseline × (1 + premium) × close-rate. Disclosed figures are used when
  // present; otherwise a labelled market-neutral prior, never hidden.
  const baseline = INST.financialBaseline.mid;
  const { premium, close, premiumKnown, closeKnown, expectedOffer, expectedClose } = expectedOutcomeFor(p, baseline);
  const rationale = buyerRationale(p, baseline, tokens, company.sector);
  const appetite = acquisitionAppetiteScore(p);
  const confidence = buyerConfidence(p);
  const medianClose = p.median_close_days ?? INST.timeToClose.lowDays;
  const reg = buyerContactRegistry(p, tokens);

  return (
    <div data-page="buyer-profile" className="space-y-3 text-xo-text">
      <Link to="/console/buyer-graph" className="inline-block py-1 text-[12px] font-semibold text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">← Buyer Graph</Link>
      <PageHeader eyebrow={`Acquisition DNA · for ${fromIntake ? "your intake" : "the demo company"}: ${company.name}`} title={p.name}
        badge={<Provenance kind={fromIntake ? "company" : "demo"} />}
        description={<span>{label(p.buyer_type)}{p.country ? ` · ${p.country}` : ""}{p.industry_official ? ` · ${p.industry_official}` : ""}</span>}
        actions={<>
          <button type="button"
            onClick={() => { if (!interested) { captureDealEvent({ actorRole: "founder", kind: "expressed_interest", subjectType: "buyer", subjectId: p.buyer_id, subjectName: p.name }); setInterested(true); } }}
            disabled={interested}
            className={`rounded-sm px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action ${interested ? "border border-xo-verified/50 text-xo-verified" : "bg-deal-700 text-white hover:bg-deal-800"}`}>
            {interested ? "✓ Interest captured" : "Express interest"}
          </button>
          <a href={`/report/buyer/${p.buyer_id}`} target="_blank" rel="noopener noreferrer" className="rounded-sm border border-xo-action/50 px-3 py-1.5 text-[12px] font-medium text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Briefing Book →<span className="sr-only"> (opens in a new tab)</span></a>
        </>}>
        <p className="mt-2 text-[12px] text-xo-faint">"Express interest" and your visits to this page are saved to your <Link to="/console/activity" className="text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">deal activity</Link> in this browser only. {p.name} is not notified.</p>
      </PageHeader>

      <section aria-label="Scores" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2">
        <div className="bg-xo-panel"><Metric label="Likelihood score · your company" emphasis value={<span className="text-xo-verified">{prob.pct}<span className="text-[14px] text-xo-faint">/100</span></span>} sub={<>Composite: appetite + sector overlap + velocity + recency — not a probability (formula on the Buyer Graph). Suggested (rule): {recommendedAction(p, tokens)}</>} /></div>
        <div className="bg-xo-panel"><Metric label="Appetite score" emphasis value={<>{appetite.score}<span className="text-[14px] text-xo-faint">/100</span></>} sub={`${appetite.tier} · confidence ${confidence} · intrinsic acquisitiveness, independent of your company`} /></div>
      </section>

      <Section title="Acquisition forecast" className="border border-xo-line">
        <dl className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Likelihood score", `${prob.pct}/100`, "composite, not a probability"],
            ["Expected value", fmtUsdShort(expectedOutcomeFor(p, baseline).expectedClose), "close-rate-weighted"],
            ["Expected premium", `+${Math.round((p.premium_pct ?? 0.2) * 100)}%${p.premium_pct == null ? "*" : ""}`, p.premium_pct != null ? "from track record" : "neutral prior"],
            ["Median close", `${medianClose} days`, "time-to-cash"],
          ].map(([k, v, sub]) => (
            <div key={k} className="bg-xo-panel px-4 py-3">
              <dt className="text-[11px] text-xo-faint">{k}</dt>
              <dd className="mt-0.5 font-mono text-[18px] font-semibold tabular-nums">{v}</dd>
              <dd className="text-[11px] text-xo-faint">{sub}</dd>
            </div>
          ))}
        </dl>
        <dl className="grid grid-cols-1 gap-px border-t border-xo-line bg-xo-line lg:grid-cols-[1fr_1fr_auto]">
          <div className="bg-xo-panel px-4 py-3">
            <dt className="text-[11px] text-xo-faint">Similar acquisitions</dt>
            <dd className="mt-1 text-[13px]">{similar.length ? similar.slice(0, 3).map((s) => s.target).join(" · ") : "none in the bundled extract"}</dd>
          </div>
          <div className="bg-xo-panel px-4 py-3">
            <dt className="text-[11px] text-xo-faint">Strategic rationale</dt>
            <dd className="mt-1 text-[13px]">{rationale.points.slice(0, 3).map((pt) => pt.label).join(" · ") || rationale.thesis.slice(0, 60)}</dd>
          </div>
          <div className="bg-xo-panel px-4 py-3 text-right">
            <dt className="text-[11px] text-xo-faint">Confidence</dt>
            <dd className={`mt-0.5 font-mono text-[18px] font-semibold ${confidence === "High" ? "text-xo-verified" : confidence === "Moderate" ? "text-xo-caution" : "text-xo-muted"}`}>{confidence}</dd>
          </div>
        </dl>
      </Section>

      <section aria-label="Headline DNA" className="grid grid-cols-2 gap-px border border-xo-line bg-xo-line sm:grid-cols-3 lg:grid-cols-6">
        <div className="bg-xo-panel"><Metric label="Acquisitions indexed" value={String(p.events_indexed)} sub={`${p.disclosed_events} with disclosed value`} /></div>
        <div className="bg-xo-panel"><Metric label="Median deal" value={fmtUsdShort(p.median_deal_usd)} sub={p.check_size_band ? `band ${fmtUsdShort(p.check_size_band.low_usd)}–${fmtUsdShort(p.check_size_band.high_usd)}` : "—"} /></div>
        <div className="bg-xo-panel"><Metric label="Largest" value={fmtUsdShort(p.max_deal?.usd)} sub={p.max_deal?.target ?? "—"} /></div>
        <div className="bg-xo-panel"><Metric label="Velocity" value={p.frequency_per_year != null ? `${p.frequency_per_year}/yr` : "—"} sub={`${p.deals_12m} last 12m · ${p.deals_3y} last 3y`} /></div>
        <div className="bg-xo-panel"><Metric label="Avg premium" value={p.premium_pct != null ? `${Math.round(p.premium_pct * 100)}%` : "—"} sub="over reference" /></div>
        <div className="bg-xo-panel"><Metric label="Close rate" value={p.close_rate != null ? `${Math.round(p.close_rate * 100)}%` : "—"} sub={p.median_close_days != null ? `${p.median_close_days}d median` : "—"} /></div>
      </section>

      <Section title={`Why ${p.name} would acquire ${company.name}`} className="border border-xo-line"
        foot="Every point is evidence from the buyer's indexed acquisition record — points appear only when the data supports them.">
        <div className="px-4 py-3">
          <p className="text-[14px] font-medium leading-relaxed">{rationale.thesis}</p>
          {rationale.points.length > 0 && (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {rationale.points.map((pt) => (
                <li key={pt.label} className="text-[13px]"><span className="font-semibold">{pt.label}.</span> <span className="text-xo-muted">{pt.detail}</span></li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      <Section title="Contact intelligence" className="border border-xo-line"
        right={<span className={`text-[12px] font-semibold ${reg.confidence.tier === "High" ? "text-xo-verified" : reg.confidence.tier === "Medium" ? "text-xo-caution" : "text-xo-muted"}`}>Contact confidence: {reg.confidence.tier}</span>}
        foot={ENGAGEMENT_DISCLAIMER}>
        <div className="px-4 py-3">
          <p className="text-[12px] text-xo-muted">{reg.confidence.reason}</p>
          <div className="mt-3 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-[12px] font-semibold text-xo-muted">Outreach paths · how deals originate</h3>
              <ol className="mt-2 space-y-1.5">
                {reg.outreachPaths.map((path) => (
                  <li key={path.rank} className="flex items-baseline gap-2 text-[12px]">
                    <span className="font-mono text-xo-faint">{path.rank}</span>
                    <span className="min-w-0">
                      {path.discoveryUrl
                        ? <a href={path.discoveryUrl} target="_blank" rel="noreferrer" className="font-semibold hover:text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{path.channel} ↗<span className="sr-only"> (opens in a new tab)</span></a>
                        : <span className="font-semibold">{path.channel}</span>}
                      <span className="text-xo-faint"> — {path.rationale}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-xo-muted">Engagement score</h3>
              <dl className="mt-2 grid grid-cols-2 gap-3">
                <EngStat label="Prior similar acq." value={reg.priorSimilarAcquisitions > 0 ? String(reg.priorSimilarAcquisitions) : "—"} sub="indexed in your space" />
                <EngStat label="Close rate" value={reg.engagement.closeRatePct != null ? `${reg.engagement.closeRatePct}%` : "—"} sub={reg.engagement.closeRatePct != null ? "disclosed deals" : "not disclosed"} />
                <EngStat label="Median close" value={reg.engagement.medianTimeToCloseDays != null ? `${reg.engagement.medianTimeToCloseDays}d` : "—"} sub="announced→closed" />
                <EngStat label="Responsiveness" value={reg.engagement.responsivenessPct != null ? `${reg.engagement.responsivenessPct}%` : "—"} sub="needs outreach history" />
                <EngStat label="NDA rate" value={reg.engagement.ndaRatePct != null ? `${reg.engagement.ndaRatePct}%` : "—"} sub="needs outreach history" />
                <EngStat label="LOI rate" value={reg.engagement.loiRatePct != null ? `${reg.engagement.loiRatePct}%` : "—"} sub="needs outreach history" />
              </dl>
            </div>
          </div>
          <div className="mt-4 border-t border-xo-line pt-3">
            <h3 className="text-[12px] font-semibold text-xo-muted">Public channels · research</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {reg.channels.map((c) => (
                <li key={c.label}><a href={c.discoveryUrl} target="_blank" rel="noreferrer" className="inline-block border border-xo-line px-2.5 py-1 text-[12px] text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{c.label} ↗<span className="sr-only"> (opens in a new tab)</span></a></li>
              ))}
            </ul>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-xo-line pt-3 text-[12px]">
            <span className="font-semibold text-xo-faint">Verified contacts via</span>
            {ENRICHMENT_PROVIDERS.map((e) => (
              <span key={e.name} className="border border-xo-line px-2 py-0.5 text-[11px] text-xo-muted">{e.name} {e.connected ? "· connected" : "· not connected"}</span>
            ))}
          </div>
        </div>
      </Section>

      <Section title={`Expected outcome · ${company.name} under ${p.name}`} className="border border-xo-line"
        right={<span className="text-[11px] text-xo-faint">baseline {fmtUsdShort(baseline)} × (1 + premium) × close rate</span>}
        foot={(!premiumKnown || !closeKnown) ? `${(!premiumKnown && !closeKnown) ? "Premium and close rate" : !premiumKnown ? "Premium" : "Close rate"} not disclosed in this buyer's indexed record — a labelled market-neutral prior is applied (never hidden). The figure sharpens as the buyer's outcomes accrue.` : undefined}>
        <div className="grid grid-cols-2 gap-px bg-xo-line sm:grid-cols-4">
          <div className="bg-xo-panel"><Metric label="Premium expectation" value={`${Math.round(premium * 100)}%`} sub={premiumKnown ? `${p.disclosed_events} disclosed deals` : "market-neutral prior"} /></div>
          <div className="bg-xo-panel"><Metric label="Close-rate expectation" value={`${Math.round(close * 100)}%`} sub={closeKnown ? "from track record" : "market-neutral prior"} /></div>
          <div className="bg-xo-panel"><Metric label="Expected offer" value={fmtUsdShort(expectedOffer)} sub="at LOI" /></div>
          <div className="bg-xo-panel"><Metric label="Expected to close" value={fmtUsdShort(expectedClose)} sub="close-rate-weighted" /></div>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-px bg-xo-line">
          <Section title="Acquisition profile">
            <dl className="space-y-2 px-4 py-3">
              <Row k="Preferred sectors" v={p.sector_tokens.length ? p.sector_tokens.slice(0, 6).map((t) => t.token).join(" · ") : "—"} />
              <Row k="Preferred regions" v={p.preferred_geography?.length ? p.preferred_geography.slice(0, 4).map((g) => `${g.country} (${g.count})`).join(" · ") : "—"} />
              <Row k="Current strategic themes" v={p.currently_seeking?.length ? <span className="text-xo-caution">{p.currently_seeking.slice(0, 4).join(" · ")}</span> : "—"} />
              <Row k="Last acquisition" v={p.last_acquisition ? `${p.last_acquisition.target} · ${p.last_acquisition.date.slice(0, 7)}` : "—"} />
              <Row k="Your sector overlap" v={<span className="font-mono font-semibold text-xo-verified">{overlap.pct}%{overlap.matched.length ? ` · ${overlap.matched.join(", ")}` : ""}</span>} />
            </dl>
          </Section>
          <Section title="Similar companies acquired">
            {similar.length ? (
              <ScrollRegion label="Similar companies acquired table">
                <table className="w-full min-w-[520px] text-[12px]">
                  <thead className="text-left text-[11px] text-xo-faint">
                    <tr className="border-b border-xo-line"><th scope="col" className="px-4 py-2 font-medium">Target</th><th scope="col" className="px-4 py-2 font-medium">Industry</th><th scope="col" className="px-4 py-2 text-right font-medium">Date</th><th scope="col" className="px-4 py-2 text-right font-medium">Value</th></tr>
                  </thead>
                  <tbody>
                    {similar.map((t) => (
                      <tr key={`${t.target}-${t.date}`} className="border-b border-xo-line last:border-0">
                        <th scope="row" className="px-4 py-2 text-left font-medium">{t.target}</th>
                        <td className="px-4 py-2 text-xo-faint">{t.industry.slice(0, 40)}</td>
                        <td className="px-4 py-2 text-right font-mono text-xo-muted">{t.date?.slice(0, 7) ?? "—"}</td>
                        <td className="px-4 py-2 text-right font-mono text-xo-verified">{fmtUsdShort(t.value_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>
            ) : (
              <p className="px-4 py-3 text-[12px] text-xo-muted">No same-sector acquisitions in the bundled extract; the full event history is not loaded in the browser.</p>
            )}
          </Section>
        </div>

        <Section title="Acquisition signals" right={<span className="font-mono text-[12px] font-semibold text-xo-verified">{activeCount} active</span>}
          foot={`Derived signals come from the acquisition registry. Feed signals (hiring, cash, executives, divisions) populate when those sources are connected — never inferred. As of ${DNA_AS_OF.slice(0, 10)}.`}>
          <div className="px-4 py-3">
            <p className="text-[12px] text-xo-muted">In the registry snapshot (as of {DNA_AS_OF.slice(0, 10)}), {p.name} shows {activeCount} acquisition signal{activeCount === 1 ? "" : "s"}.</p>
            <div className="mt-3 border border-xo-line px-3 py-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[12px] font-semibold text-xo-muted">Appetite score</h3>
                <span className="font-mono text-[13px] font-semibold">{appetite.score}<span className="text-xo-faint">/100 · {appetite.tier}</span></span>
              </div>
              <ul className="mt-2 space-y-1">
                {([["Cadence", appetite.drivers.cadence, 30], ["Acceleration", appetite.drivers.acceleration, 20], ["Recency", appetite.drivers.recency, 20], ["Breadth", appetite.drivers.breadth, 15], ["Themes", appetite.drivers.themes, 10], ["Geography", appetite.drivers.geography, 5]] as [string, number, number][]).map(([k, v, max]) => (
                  <li key={k} className="flex items-center gap-2 text-[11px]">
                    <span className="w-20 shrink-0 text-xo-muted">{k}</span>
                    <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-xo-line"><span className="block h-full rounded-full bg-xo-action" style={{ width: `${(v / max) * 100}%` }} /></span>
                    <span className="w-12 shrink-0 text-right font-mono tabular-nums text-xo-muted">{v}/{max}</span>
                  </li>
                ))}
              </ul>
            </div>
            <h3 className="mt-3 text-[12px] font-semibold text-xo-muted">Behavioral signals</h3>
            <ul className="mt-2 space-y-1.5">
              {signals.map((s) => (
                <li key={s.label} className="text-[12px]">
                  <span aria-hidden className={s.active ? "text-xo-verified" : "text-xo-faint"}>{s.active ? "● " : "○ "}</span>
                  <span className={s.active ? "font-semibold" : "text-xo-muted"}>{s.label}</span>
                  <span className="sr-only">{s.active ? " (active)" : " (inactive)"}</span>
                  <span className="text-xo-faint"> — {s.detail}</span>
                  {s.source === "feed" && <span className="ml-1 border border-xo-line px-1 text-[10px] text-xo-faint">feed</span>}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      </div>

      <a href={p.source_url} target="_blank" rel="noreferrer" className="inline-block py-1 font-mono text-[11px] text-xo-faint hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">source ↗<span className="sr-only"> for {p.name} (opens in a new tab)</span></a>
    </div>
  );
};

const EngStat: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
  <div>
    <dt className="text-[11px] text-xo-faint">{label}</dt>
    <dd className="mt-0.5 text-[13px] font-semibold leading-tight">{value}</dd>
    <dd className="text-[11px] text-xo-faint">{sub}</dd>
  </div>
);

const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="flex items-baseline justify-between gap-3 text-[12px]">
    <dt className="shrink-0 text-[11px] text-xo-faint">{k}</dt>
    <dd className="min-w-0 break-words text-right">{v}</dd>
  </div>
);

export default BuyerProfile;

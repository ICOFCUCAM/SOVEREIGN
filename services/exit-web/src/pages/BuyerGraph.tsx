import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MarketTape, Evidence } from "../lib/workstation";
import { PageHeader, Section, Metric, ScrollRegion, Chip, XO_INPUT } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { BuyerNetworkReactor } from "../components/Reactor";
import {
  DNA_PROFILES, DNA_AS_OF, SECTOR_TRANSACTIONS,
  sectorOverlap, recommendedAction, fmtUsdShort, rankedBuyers, type DnaProfile,
} from "../lib/buyer-dna";
import { MARKET_INDEX_FMT } from "../lib/market-index";
import { SAMPLE_COMPANY } from "../lib/profile";

// BUYER GRAPH — the proprietary acquisition-intelligence layer. Founders
// never see raw acquisition lists; they see Acquisition DNA: appetite,
// cadence, sector preference, deal-size band, last move — every figure
// derived from the ingested registries (Wikipedia · Wikidata · SEC EDGAR)
// with sample sizes and source links on the record.

type TypeFilter = "all" | "corporate" | "private_equity" | "sovereign_fund" | "family_office";

const APPETITE_STYLE: Record<DnaProfile["appetite"], { label: string; cls: string }> = {
  high:      { label: "High",      cls: "text-xo-verified" },
  medium:    { label: "Medium",    cls: "text-xo-caution" },
  low:       { label: "Low",       cls: "text-xo-muted" },
  no_events: { label: "No events", cls: "text-xo-faint" },
};

const DnaCard: React.FC<{ p: DnaProfile }> = ({ p }) => {
  const overlap = sectorOverlap(p);
  const ap = APPETITE_STYLE[p.appetite];
  return (
    <li className="min-w-0 bg-xo-panel px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold"><Link to={`/console/buyer/${p.buyer_id}`} className="hover:text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{p.name}</Link></h3>
          <div className="mt-0.5 text-[11px] capitalize text-xo-faint">
            {p.buyer_type.replace(/_/g, " ")}{p.country ? ` · ${p.country}` : ""}
          </div>
          {p.sector_exitos && p.sector_exitos.length > 0 && (
            <ul aria-label="Sectors" className="mt-1.5 flex flex-wrap gap-1" title={p.industry_official ? `Official: ${p.industry_official}` : undefined}>
              {p.sector_exitos.map((s) => (
                <li key={s} className="border border-xo-line px-1.5 py-0.5 text-[11px] text-xo-muted">{s}</li>
              ))}
            </ul>
          )}
        </div>
        <span className={`shrink-0 text-[12px] font-semibold ${ap.cls}`}>Appetite: {ap.label}</span>
      </div>

      <dl className="mt-3 space-y-1.5 border-t border-xo-line pt-2">
        <Row k="Last acquisition" v={p.last_acquisition ? `${p.last_acquisition.target} · ${p.last_acquisition.date.slice(0, 7)}` : "—"} />
        <Row k="Sector preference" v={p.sector_tokens.length ? p.sector_tokens.slice(0, 4).map((t) => t.token).join(" · ") : "—"} />
        <Row k="Average deal size" v={p.avg_deal_usd ? `${fmtUsdShort(p.avg_deal_usd)} (n=${p.disclosed_events} disclosed)` : "undisclosed"} />
        {p.check_size_band && (
          <Row k="Typical band" v={<span className="font-mono">{fmtUsdShort(p.check_size_band.low_usd)}–{fmtUsdShort(p.check_size_band.high_usd)}{p.median_deal_usd ? ` · median ${fmtUsdShort(p.median_deal_usd)}` : ""}</span>} />
        )}
        <Row k="Maximum historical" v={p.max_deal ? `${fmtUsdShort(p.max_deal.usd)} — ${p.max_deal.target}` : "—"} />
        <Row k="Cadence" v={`${p.deals_12m} last 12m · ${p.deals_3y} last 3y · ${p.events_indexed} indexed`} />
        {p.frequency_per_year != null && <Row k="Frequency" v={`${p.frequency_per_year} deals / year`} />}
        {p.preferred_geography && p.preferred_geography.length > 0 && (
          <Row k="Geography" v={p.preferred_geography.slice(0, 3).map((g) => g.country).join(" · ")} />
        )}
        {(p.premium_pct != null || p.median_close_days != null) && (
          <Row k="Premium · speed" v={`${p.premium_pct != null ? `+${Math.round(p.premium_pct * 100)}% over reference` : "premium undisclosed"}${p.median_close_days != null ? ` · ${p.median_close_days}d to close` : ""}`} />
        )}
        {p.close_rate != null && <Row k="Close rate" v={`${Math.round(p.close_rate * 100)}% of announced deals completed`} />}
        {p.currently_seeking && p.currently_seeking.length > 0 && (
          <Row k="Currently seeking" v={<span className="text-xo-caution">{p.currently_seeking.slice(0, 3).join(" · ")}</span>} />
        )}
        {overlap.pct > 0 && (
          <Row k="Your overlap" v={<span className="font-mono font-semibold text-xo-verified">{overlap.pct}%{overlap.matched.length ? ` · ${overlap.matched.join(", ")}` : ""}</span>} />
        )}
      </dl>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-xo-line pt-2">
        <span className="text-[12px] font-semibold text-xo-verified">{recommendedAction(p)}</span>
        <a href={p.source_url} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-xo-faint hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">source ↗<span className="sr-only"> for {p.name} (opens in a new tab)</span></a>
      </div>
    </li>
  );
};

const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="flex items-baseline justify-between gap-3 text-[12px]">
    <dt className="shrink-0 text-[11px] text-xo-faint">{k}</dt>
    <dd className="min-w-0 break-words text-right text-xo-text">{v}</dd>
  </div>
);

const BuyerGraph: React.FC = () => {
  const [type, setType] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DNA_PROFILES
      .filter((p) => (type === "all" ? true : p.buyer_type === type))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sector_tokens.some((t) => t.token.includes(q)))
      .slice(0, 30);
  }, [type, query]);

  const withEvents = DNA_PROFILES.filter((p) => p.events_indexed > 0).length;
  const highAppetite = DNA_PROFILES.filter((p) => p.appetite === "high").length;
  const RANKED = useMemo(() => rankedBuyers(12), []);
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="buyer-graph" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Market Intelligence" title="Buyer Graph"
        badge={<span className="text-[12px] text-xo-muted">The moat · as of {MARKET_INDEX_FMT.asOf} · Wikipedia · Wikidata · EDGAR</span>}
        actions={<a href="/report/buyers" target="_blank" rel="noopener noreferrer" className="rounded-sm border border-xo-action/50 px-3 py-1.5 text-[12px] font-medium text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Buyer Intelligence Report (PDF) →<span className="sr-only"> (opens in a new tab)</span></a>} />

      <section aria-label="Registry summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-3 xl:grid-cols-5">
        <div className="bg-xo-panel"><Metric label="Buyers indexed" value={MARKET_INDEX_FMT.buyers} sub="corporates · PE · sovereign" /></div>
        <div className="bg-xo-panel"><Metric label="With acquisition DNA" emphasis value={String(withEvents)} sub="≥1 indexed event" /></div>
        <div className="bg-xo-panel"><Metric label="High appetite" value={String(highAppetite)} sub="≥2 deals / 12m" /></div>
        <div className="bg-xo-panel"><Metric label="Events indexed" value={MARKET_INDEX_FMT.events} sub={`as of ${MARKET_INDEX_FMT.asOf}`} /></div>
        <div className="bg-xo-panel"><Metric label="Active acquirers" value={String(withEvents)} sub="with live cadence" /></div>
      </section>

      <MarketTape items={tape} />

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Buyer network reactor" className="lg:col-span-3"
          foot="Active acquirers, node size ∝ 12-month cadence, green = ≥2 deals.">
          <div aria-hidden><BuyerNetworkReactor height={260} /></div>
        </Section>
        <Section title="Acquisition likelihood score · who is most likely to buy you" className="lg:col-span-9"
          right={<span className="text-[11px] text-xo-faint">top {RANKED.length} of {withEvents} active</span>}
          foot={`Ranked for ${SAMPLE_COMPANY.name}. Score out of 100 = appetite (high 50, medium 32, low 14) + sector overlap × 0.34 (max 34) + deals per year × 2.5 (max 14) + recency (10 if within 18 months, 5 within 36, 2 within 60). A composite score, not a probability. Every buyer traces to a source on record.`}>
          <ScrollRegion label="Ranked buyers table">
            <table className="w-full min-w-[760px] text-[12px]">
              <thead className="text-left text-[11px] text-xo-faint">
                <tr className="border-b border-xo-line">
                  <th scope="col" className="px-3 py-2 font-medium">#</th><th scope="col" className="px-3 py-2 font-medium">Buyer</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Score</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Cadence</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Median deal</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Avg prem</th>
                  <th scope="col" className="px-3 py-2 font-medium">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {RANKED.map((r, i) => (
                  <tr key={r.profile.buyer_id} className="border-b border-xo-line last:border-0">
                    <td className="px-3 py-1.5 font-mono text-xo-faint">{i + 1}</td>
                    <th scope="row" className="px-3 py-1.5 text-left font-normal"><Link to={`/console/buyer/${r.profile.buyer_id}`} className="font-semibold hover:text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{r.profile.name}</Link></th>
                    <td className="px-2 py-1.5 text-right">
                      <Evidence align="right" meta={{ methodology: r.probability.rationale, source: "DNA engine · acquisition registry", confidence: "composite score (appetite + overlap + velocity + recency), not a probability", asOf: MARKET_INDEX_FMT.asOf }}>
                        <span className="font-mono font-semibold tabular-nums text-xo-verified">{r.probability.pct}<span className="text-[11px] text-xo-faint">/100</span></span>
                      </Evidence>
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{r.profile.frequency_per_year != null ? `${r.profile.frequency_per_year}/yr` : "—"}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{fmtUsdShort(r.profile.median_deal_usd)}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{r.profile.premium_pct != null ? `${Math.round(r.profile.premium_pct * 100)}%` : "—"}</td>
                    <td className="px-3 py-1.5 text-[12px] text-xo-muted">{r.probability.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>
      </div>

      <Section title="Acquisition DNA" eyebrow={`${filtered.length} shown (up to 30)`} className="border border-xo-line"
        right={<div role="group" aria-label="Buyer type" className="flex flex-wrap gap-1.5">
          {([["all", "All"], ["corporate", "Strategic"], ["private_equity", "Private Equity"], ["sovereign_fund", "Sovereign Funds"], ["family_office", "Family Offices"]] as [TypeFilter, string][]).map(([k, l]) => (
            <Chip key={k} pressed={type === k} onToggle={() => setType(k)}>{l}</Chip>
          ))}
        </div>}>
        <div className="border-b border-xo-line px-4 py-3">
          <label htmlFor="bg-search" className="sr-only">Search buyer or sector token</label>
          <input id="bg-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search buyer or sector token…" className={`${XO_INPUT} max-w-xs`} />
        </div>
        <ul className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => <DnaCard key={p.buyer_id} p={p} />)}
          {filtered.length === 0 && <li className="bg-xo-panel px-4 py-6 text-[13px] text-xo-muted">No indexed buyer matches that filter.</li>}
        </ul>
      </Section>

      <Section title={`Similar transactions · ${SAMPLE_COMPANY.sector.replace(/_/g, " ")}`} className="border border-xo-line"
        right={<span className="text-[11px] text-xo-faint">{SECTOR_TRANSACTIONS.length} matching your sector</span>}
        foot={`Every row traces to a source on record (Wikipedia acquisition lists; SEC-corroborated where an 8-K item 2.01 matches). As of ${DNA_AS_OF.slice(0, 10)}.`}>
        <ScrollRegion label="Similar transactions table">
          <table className="w-full min-w-[640px] text-[12px]">
            <thead className="text-left text-[11px] text-xo-faint">
              <tr className="border-b border-xo-line">
                <th scope="col" className="px-3 py-2 font-medium">Target</th>
                <th scope="col" className="px-3 py-2 font-medium">Acquirer</th>
                <th scope="col" className="px-3 py-2 font-medium">Industry</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Date</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Disclosed</th>
              </tr>
            </thead>
            <tbody>
              {SECTOR_TRANSACTIONS.slice(0, 14).map((t) => (
                <tr key={`${t.buyer}-${t.target}`} className="border-b border-xo-line last:border-0">
                  <th scope="row" className="px-3 py-1.5 text-left font-medium">{t.target}</th>
                  <td className="px-3 py-1.5 text-xo-muted">{t.buyer}</td>
                  <td className="px-3 py-1.5 text-xo-faint">{t.industry.slice(0, 56)}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{t.date?.slice(0, 7) ?? "—"}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-xo-verified">{fmtUsdShort(t.value_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </Section>
    </div>
  );
};

export default BuyerGraph;

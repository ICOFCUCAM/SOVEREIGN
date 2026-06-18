import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { inputCls } from "../lib/ui";
import { Panel, Frame, CommandHeader, MarketTape } from "../lib/workstation";
import { buildMarketTape } from "../lib/market-tape";
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
  high:      { label: "High",      cls: "bg-deal-600/20 text-deal-300 ring-deal-400/40" },
  medium:    { label: "Medium",    cls: "bg-loi-500/15 text-loi-300 ring-loi-400/40" },
  low:       { label: "Low",       cls: "bg-white/5 text-white/50 ring-white/15" },
  no_events: { label: "No events", cls: "bg-white/5 text-white/35 ring-white/10" },
};

const DnaCard: React.FC<{ p: DnaProfile }> = ({ p }) => {
  const overlap = sectorOverlap(p);
  const ap = APPETITE_STYLE[p.appetite];
  return (
    <div className="bg-ink-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/console/buyer/${p.buyer_id}`} className="text-[15px] font-bold text-white hover:text-deal-300">{p.name}</Link>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">
            {p.buyer_type.replace(/_/g, " ")}{p.country ? ` · ${p.country}` : ""}
          </div>
          {p.sector_exitos && p.sector_exitos.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1" title={p.industry_official ? `Official: ${p.industry_official}` : undefined}>
              {p.sector_exitos.map((s) => (
                <span key={s} className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/55 ring-1 ring-white/10">{s}</span>
              ))}
            </div>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${ap.cls}`}>
          Appetite: {ap.label}
        </span>
      </div>

      {/* the DNA register */}
      <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
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
          <Row k="Currently seeking" v={<span className="text-loi-300">{p.currently_seeking.slice(0, 3).join(" · ")}</span>} />
        )}
        {overlap.pct > 0 && (
          <Row k="Your overlap" v={<span className="font-mono font-bold text-deal-300">{overlap.pct}%{overlap.matched.length ? ` · ${overlap.matched.join(", ")}` : ""}</span>} />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="text-[12px] font-semibold text-deal-300">{recommendedAction(p)}</span>
        <a href={p.source_url} target="_blank" rel="noreferrer" className="font-mono text-[9px] uppercase tracking-wide text-white/30 hover:text-white/60">
          source ↗
        </a>
      </div>
    </div>
  );
};

const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="flex items-baseline justify-between gap-3 text-[12px]">
    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{k}</span>
    <span className="text-right text-white/80">{v}</span>
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
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Market Intelligence"
        title="Buyer Graph"
        tag="The moat"
        meta={[
          { k: "AS OF", v: MARKET_INDEX_FMT.asOf },
          { k: "SOURCES", v: "Wikipedia · Wikidata · EDGAR" },
        ]}
        metrics={[
          { k: "Buyers indexed", v: MARKET_INDEX_FMT.buyers, sub: "corporates · PE · sovereign" },
          { k: "With acquisition DNA", v: String(withEvents), accent: true, sub: "≥1 indexed event" },
          { k: "High appetite", v: String(highAppetite), sub: "≥2 deals / 12m" },
          { k: "Events indexed", v: MARKET_INDEX_FMT.events, sub: `as of ${MARKET_INDEX_FMT.asOf}` },
          { k: "Active acquirers", v: String(withEvents), accent: true, sub: "with live cadence" },
        ]}
      />

      <MarketTape items={tape} />

      {/* ── Acquisition Probability — the crown-jewel ranking ── */}
      <Frame>
        <Panel title="Acquisition probability · who is most likely to buy you" className="lg:col-span-12"
          right={<span className="text-[9px] uppercase tracking-wide text-white/35">top {RANKED.length} of {withEvents} active</span>}
          foot={`Ranked for ${SAMPLE_COMPANY.name} — appetite × sector overlap × velocity × recency. Every buyer traces to a source on record.`}>
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-3 py-1.5">#</th><th className="px-3 py-1.5">Buyer</th>
                <th className="px-2 py-1.5 text-right">Prob</th>
                <th className="px-2 py-1.5 text-right">Cadence</th>
                <th className="px-2 py-1.5 text-right">Median deal</th>
                <th className="px-2 py-1.5 text-right">Avg prem</th>
                <th className="px-3 py-1.5">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {RANKED.map((r, i) => (
                <tr key={r.profile.buyer_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5 font-mono text-white/40">{i + 1}</td>
                  <td className="px-3 py-1.5"><Link to={`/console/buyer/${r.profile.buyer_id}`} className="font-semibold text-white hover:text-deal-300">{r.profile.name}</Link></td>
                  <td className="px-2 py-1.5 text-right">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="hidden h-1 w-10 overflow-hidden rounded-full bg-white/10 sm:inline-block align-middle"><span className="block h-full bg-deal-500" style={{ width: `${r.probability.pct}%` }} /></span>
                      <span className="font-mono font-bold tabular-nums text-deal-300">{r.probability.pct}%</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/65">{r.profile.frequency_per_year != null ? `${r.profile.frequency_per_year}/yr` : "—"}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/65">{fmtUsdShort(r.profile.median_deal_usd)}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/65">{r.profile.premium_pct != null ? `${Math.round(r.profile.premium_pct * 100)}%` : "—"}</td>
                  <td className="px-3 py-1.5 text-[11px] text-white/45">{r.probability.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </Frame>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2 px-1 pt-1">
        {([["all", "All"], ["corporate", "Strategic"], ["private_equity", "Private Equity"], ["sovereign_fund", "Sovereign Funds"], ["family_office", "Family Offices"]] as [TypeFilter, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setType(k)}
            className={`rounded-md px-3.5 py-2 text-[13px] font-semibold transition ${type === k ? "bg-deal-600/20 text-white ring-1 ring-deal-400/40" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
            {l}
          </button>
        ))}
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search buyer or sector token…"
          className={`${inputCls} ml-auto max-w-xs`} />
      </div>

      <div className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => <DnaCard key={p.buyer_id} p={p} />)}
        {filtered.length === 0 && (
          <div className="bg-ink-900 p-6 text-sm text-white/50">No indexed buyer matches that filter.</div>
        )}
      </div>

      {/* ── Similar transactions — real comparables for this company ── */}
      <Frame>
        <Panel title={`Similar transactions · ${SAMPLE_COMPANY.sector.replace(/_/g, " ")}`} className="lg:col-span-12"
          right={<span className="text-[9px] uppercase tracking-wide text-white/35">{SECTOR_TRANSACTIONS.length} matching your sector</span>}
          foot={`Every row traces to a source on record (Wikipedia acquisition lists; SEC-corroborated where an 8-K item 2.01 matches). As of ${DNA_AS_OF.slice(0, 10)}.`}>
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-3 py-1.5">Target</th>
                <th className="px-3 py-1.5">Acquirer</th>
                <th className="px-3 py-1.5">Industry</th>
                <th className="px-2 py-1.5 text-right">Date</th>
                <th className="px-3 py-1.5 text-right">Disclosed</th>
              </tr>
            </thead>
            <tbody>
              {SECTOR_TRANSACTIONS.slice(0, 14).map((t) => (
                <tr key={`${t.buyer}-${t.target}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5 font-medium text-white">{t.target}</td>
                  <td className="px-3 py-1.5 text-white/70">{t.buyer}</td>
                  <td className="px-3 py-1.5 text-white/45">{t.industry.slice(0, 56)}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/60">{t.date?.slice(0, 7) ?? "—"}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-deal-300">{fmtUsdShort(t.value_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </Frame>
    </div>
  );
};

export default BuyerGraph;

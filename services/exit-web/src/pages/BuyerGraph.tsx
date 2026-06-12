import React, { useMemo, useState } from "react";
import { Card, Kpi, SectionHeader, inputCls } from "../lib/ui";
import {
  DNA_PROFILES, DNA_AS_OF, SECTOR_TRANSACTIONS,
  sectorOverlap, recommendedAction, fmtUsdShort, type DnaProfile,
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
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-white">{p.name}</div>
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
    </Card>
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

  return (
    <div>
      <SectionHeader
        kicker="Market Intelligence · The moat"
        title="Buyer Graph"
        description={`Acquisition DNA for every indexed buyer — appetite, cadence, sector preference and deal-size band, derived from ${MARKET_INDEX_FMT.events} real acquisition events (Wikipedia · Wikidata · SEC EDGAR, as of ${MARKET_INDEX_FMT.asOf}). Founders never read raw lists; the graph reads them.`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Buyers indexed" value={MARKET_INDEX_FMT.buyers} sub="corporates · PE · sovereign funds" />
        <Kpi label="With acquisition DNA" value={String(withEvents)} sub="≥1 indexed event" accent="#34d399" />
        <Kpi label="High appetite" value={String(highAppetite)} sub="≥2 deals in the last 12 months" accent="#fbbf24" />
        <Kpi label="Events indexed" value={MARKET_INDEX_FMT.events} sub={`as of ${MARKET_INDEX_FMT.asOf}`} />
      </div>

      {/* filters */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {([["all", "All"], ["corporate", "Strategic"], ["private_equity", "Private Equity"], ["sovereign_fund", "Sovereign Funds"], ["family_office", "Family Offices"]] as [TypeFilter, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setType(k)}
            className={`rounded-md px-3.5 py-2 text-[13px] font-semibold transition ${type === k ? "bg-deal-600/20 text-white ring-1 ring-deal-400/40" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
            {l}
          </button>
        ))}
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search buyer or sector token…"
          className={`${inputCls} ml-auto max-w-xs`} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => <DnaCard key={p.buyer_id} p={p} />)}
        {filtered.length === 0 && (
          <Card className="p-6 text-sm text-white/50">No indexed buyer matches that filter.</Card>
        )}
      </div>

      {/* ── Similar transactions — real comparables for this company ── */}
      <Card className="mt-10 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
            Similar transactions · {SAMPLE_COMPANY.sector.replace(/_/g, " ")}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-white/35">{SECTOR_TRANSACTIONS.length} indexed events matching your sector vocabulary</span>
        </div>
        <table className="w-full text-[12.5px]">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-2.5">Target</th>
              <th className="px-5 py-2.5">Acquirer</th>
              <th className="px-5 py-2.5">Industry</th>
              <th className="px-5 py-2.5 text-right">Date</th>
              <th className="px-5 py-2.5 text-right">Disclosed</th>
            </tr>
          </thead>
          <tbody>
            {SECTOR_TRANSACTIONS.slice(0, 12).map((t) => (
              <tr key={`${t.buyer}-${t.target}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-2.5 font-medium text-white">{t.target}</td>
                <td className="px-5 py-2.5 text-white/70">{t.buyer}</td>
                <td className="px-5 py-2.5 text-white/45">{t.industry.slice(0, 56)}</td>
                <td className="px-5 py-2.5 text-right font-mono tabular-nums text-white/60">{t.date?.slice(0, 7) ?? "—"}</td>
                <td className="px-5 py-2.5 text-right font-mono tabular-nums text-deal-300">{fmtUsdShort(t.value_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">
          Every row traces to a source on record (Wikipedia acquisition lists; SEC-corroborated where an 8-K item 2.01 matches). As of {DNA_AS_OF.slice(0, 10)}.
        </div>
      </Card>
    </div>
  );
};

export default BuyerGraph;

import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Kpi, SectionHeader } from "../lib/ui";
import {
  buyerById, acquisitionProbability, acquisitionSignals, similarAcquisitionsBy,
  sectorOverlap, recommendedAction, fmtUsdShort, expectedOutcomeFor, buyerRationale, DNA_AS_OF,
} from "../lib/buyer-dna";
import { VALUATION_INSTITUTIONAL } from "../lib/engines";
import { SAMPLE_COMPANY } from "../lib/profile";

// BUYER INTELLIGENCE PROFILE — every indexed buyer's own page. "Microsoft
// Acquisition DNA": the full derived dossier a founder can explore — volume,
// deal sizes, velocity, premiums, regions, strategic themes, similar
// acquisitions and live acquisition-readiness signals. Every figure is
// derived from the ingested registries (Wikipedia · Wikidata · SEC EDGAR).

const BuyerProfile: React.FC = () => {
  const { id = "" } = useParams();
  const p = buyerById(id);

  if (!p) {
    return (
      <div>
        <SectionHeader kicker="Buyer Intelligence" title="Buyer not found" description="No indexed buyer matches this profile." />
        <Link to="/console/buyer-graph" className="text-[13px] font-semibold text-deal-300 hover:text-deal-200">← Back to the Buyer Graph</Link>
      </div>
    );
  }

  const prob = acquisitionProbability(p);
  const { signals, activeCount } = acquisitionSignals(p);
  const overlap = sectorOverlap(p);
  const similar = similarAcquisitionsBy(p.name);

  // Phase 2 — expected outcome for the founder's company under THIS buyer:
  // baseline × (1 + premium) × close-rate. Disclosed figures are used when
  // present; otherwise a labelled market-neutral prior, never hidden.
  const baseline = VALUATION_INSTITUTIONAL.financialBaseline.mid;
  const { premium, close, premiumKnown, closeKnown, expectedOffer, expectedClose } = expectedOutcomeFor(p, baseline);
  const rationale = buyerRationale(p, baseline);

  return (
    <div>
      <Link to="/console/buyer-graph" className="text-[11px] font-semibold uppercase tracking-wide text-white/40 hover:text-white/70">← Buyer Graph</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-deal-400">Acquisition DNA</div>
          <h1 className="mt-1.5 font-serif text-3xl font-bold text-white sm:text-4xl">{p.name}</h1>
          <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">
            {p.buyer_type.replace(/_/g, " ")}{p.country ? ` · ${p.country}` : ""}{p.industry_official ? ` · ${p.industry_official}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Acquisition probability · your company</div>
          <div className="font-mono text-4xl font-bold tabular-nums text-deal-300">{prob.pct}%</div>
          <div className="text-[11px] text-white/45">{recommendedAction(p)}</div>
        </div>
      </div>

      {/* headline DNA */}
      <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Acquisitions indexed" value={String(p.events_indexed)} sub={`${p.disclosed_events} with disclosed value`} />
        <Kpi label="Median deal" value={fmtUsdShort(p.median_deal_usd)} sub={p.check_size_band ? `band ${fmtUsdShort(p.check_size_band.low_usd)}–${fmtUsdShort(p.check_size_band.high_usd)}` : "—"} />
        <Kpi label="Largest" value={fmtUsdShort(p.max_deal?.usd)} sub={p.max_deal?.target ?? "—"} accent="#fbbf24" />
        <Kpi label="Velocity" value={p.frequency_per_year != null ? `${p.frequency_per_year}/yr` : "—"} sub={`${p.deals_12m} last 12m · ${p.deals_3y} last 3y`} />
        <Kpi label="Avg premium" value={p.premium_pct != null ? `${Math.round(p.premium_pct * 100)}%` : "—"} sub="over reference" />
        <Kpi label="Close rate" value={p.close_rate != null ? `${Math.round(p.close_rate * 100)}%` : "—"} sub={p.median_close_days != null ? `${p.median_close_days}d median` : "—"} accent="#34d399" />
      </div>

      {/* why this buyer would acquire you — strategic rationale */}
      <Card className="mt-6 p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Why {p.name} would acquire {SAMPLE_COMPANY.name}</div>
        <p className="mt-2 text-[14px] font-medium leading-relaxed text-white/85">{rationale.thesis}</p>
        {rationale.points.length > 0 && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {rationale.points.map((pt) => (
              <li key={pt.label} className="flex gap-2 text-[12.5px]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-deal-400" />
                <span><span className="font-semibold text-white/85">{pt.label}.</span> <span className="text-white/55">{pt.detail}</span></span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 text-[10px] text-white/35">Every point is evidence from the buyer's indexed acquisition record — points appear only when the data supports them.</div>
      </Card>

      {/* expected outcome for the founder's company */}
      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Expected outcome · {SAMPLE_COMPANY.name} under {p.name}</div>
          <span className="text-[10px] uppercase tracking-wide text-white/35">baseline {fmtUsdShort(baseline)} × (1 + premium) × close rate</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Kpi label="Premium expectation" value={`${Math.round(premium * 100)}%`} sub={premiumKnown ? `${p.disclosed_events} disclosed deals` : "market-neutral prior"} accent={premiumKnown ? "#34d399" : undefined} />
          <Kpi label="Close-rate expectation" value={`${Math.round(close * 100)}%`} sub={closeKnown ? "from track record" : "market-neutral prior"} accent={closeKnown ? "#34d399" : undefined} />
          <Kpi label="Expected offer" value={fmtUsdShort(expectedOffer)} sub="at LOI" />
          <Kpi label="Expected to close" value={fmtUsdShort(expectedClose)} sub="probability-weighted" accent="#fbbf24" />
        </div>
        {(!premiumKnown || !closeKnown) && (
          <p className="mt-3 text-[10.5px] text-white/35">
            {(!premiumKnown && !closeKnown) ? "Premium and close rate" : !premiumKnown ? "Premium" : "Close rate"} not disclosed in this buyer's
            indexed record — a labelled market-neutral prior is applied (never hidden). The figure sharpens as the buyer's outcomes accrue.
          </p>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* left — themes, sectors, regions, similar acquisitions */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Acquisition profile</div>
            <div className="mt-3 space-y-2.5">
              <Row k="Preferred sectors" v={p.sector_tokens.length ? p.sector_tokens.slice(0, 6).map((t) => t.token).join(" · ") : "—"} />
              <Row k="Preferred regions" v={p.preferred_geography?.length ? p.preferred_geography.slice(0, 4).map((g) => `${g.country} (${g.count})`).join(" · ") : "—"} />
              <Row k="Current strategic themes" v={p.currently_seeking?.length ? <span className="text-loi-300">{p.currently_seeking.slice(0, 4).join(" · ")}</span> : "—"} />
              <Row k="Last acquisition" v={p.last_acquisition ? `${p.last_acquisition.target} · ${p.last_acquisition.date.slice(0, 7)}` : "—"} />
              <Row k="Your sector overlap" v={<span className="font-mono font-bold text-deal-300">{overlap.pct}%{overlap.matched.length ? ` · ${overlap.matched.join(", ")}` : ""}</span>} />
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Similar companies acquired</div>
            {similar.length ? (
              <table className="w-full text-[12.5px]">
                <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  <tr className="border-b border-white/10"><th className="px-5 py-2">Target</th><th className="px-5 py-2">Industry</th><th className="px-5 py-2 text-right">Date</th><th className="px-5 py-2 text-right">Value</th></tr>
                </thead>
                <tbody>
                  {similar.map((t) => (
                    <tr key={`${t.target}-${t.date}`} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-2 font-medium text-white">{t.target}</td>
                      <td className="px-5 py-2 text-white/45">{t.industry.slice(0, 40)}</td>
                      <td className="px-5 py-2 text-right font-mono text-white/60">{t.date?.slice(0, 7) ?? "—"}</td>
                      <td className="px-5 py-2 text-right font-mono text-deal-300">{fmtUsdShort(t.value_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-4 text-[12px] text-white/45">No same-sector acquisitions in the bundled extract — full history indexed node-side.</div>
            )}
          </Card>
        </div>

        {/* right — acquisition-readiness signals */}
        <Card className="p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Acquisition signals</div>
            <span className="font-mono text-[12px] font-bold text-deal-300">{activeCount} active</span>
          </div>
          <p className="mt-1 text-[11px] text-white/45">{p.name} currently exhibits {activeCount} acquisition signal{activeCount === 1 ? "" : "s"}.</p>
          <ul className="mt-3 space-y-1.5">
            {signals.map((s) => (
              <li key={s.label} className="flex items-start gap-2 text-[12px]">
                <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${s.active ? "bg-deal-400" : s.source === "feed" ? "bg-white/15" : "bg-white/10"}`} />
                <span className="min-w-0">
                  <span className={s.active ? "font-semibold text-white" : "text-white/45"}>{s.label}</span>
                  <span className="text-white/35"> — {s.detail}</span>
                  {s.source === "feed" && <span className="ml-1 rounded bg-white/5 px-1 text-[9px] uppercase tracking-wide text-white/30">feed</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-white/10 pt-3 text-[10px] text-white/35">
            Derived signals come from the acquisition registry. Feed signals (hiring, cash, executives, divisions) populate when those sources are connected — never inferred. As of {DNA_AS_OF.slice(0, 10)}.
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <a href={p.source_url} target="_blank" rel="noreferrer" className="font-mono text-[10px] uppercase tracking-wide text-white/30 hover:text-white/60">source ↗</a>
      </div>
    </div>
  );
};

const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{k}</span>
    <span className="text-right text-white/80">{v}</span>
  </div>
);

export default BuyerProfile;

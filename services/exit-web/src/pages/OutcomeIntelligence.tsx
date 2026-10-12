import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { MarketTape, Evidence } from "../lib/workstation";
import { PageHeader, Section, Metric, ScrollRegion } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { BuyerNetworkReactor } from "../components/Reactor";
import { MULTIPLES } from "@exit/engines";
import { premiumLeague, speedLeague, DNA_AS_OF } from "../lib/buyer-dna";

// OUTCOME INTELLIGENCE (Tier 2) — answers "how much are they likely to pay?"
// at the market level: which buyers pay the highest premiums, which close
// fastest, and which sectors command the strongest multiples. Every row is
// a DISCLOSED figure from the registry / framework — sparse by design,
// never fabricated, and it widens as coverage grows.

// strongest-multiple sectors — from the framework's institutional priors
const SECTOR_MULT = Object.entries(MULTIPLES)
  .map(([sector, m]) => {
    const band = m.arr ?? m.revenue;        // the primary top-line multiple
    const kind = m.arr ? "ARR" : "Revenue";
    return band ? { sector, kind, low: band.low, mid: band.mid, high: band.high, ebitda: m.ebitda?.mid } : null;
  })
  .filter((x): x is NonNullable<typeof x> => x != null)
  .sort((a, b) => b.mid - a.mid);

const label = (s: string): string => s.replace(/_/g, " ");

const OutcomeIntelligence: React.FC = () => {
  const premium = premiumLeague(12);
  const speed = speedLeague(12);
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="outcome-intelligence" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Market Intelligence" title="Outcome Intelligence"
        badge={<span className="text-[12px] text-xo-muted">Who pays · who closes · as of {DNA_AS_OF.slice(0, 10)}</span>} />

      <section aria-label="Coverage" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Disclosed premium" value={String(premium.length)} sub="buyers on record" /></div>
        <div className="bg-xo-panel"><Metric label="Close-time data" value={String(speed.length)} sub="median announced→closed" /></div>
        <div className="bg-xo-panel"><Metric label="Sectors benchmarked" value={String(SECTOR_MULT.length)} sub="multiple bands" /></div>
        <div className="bg-xo-panel"><Metric label="Top premium" emphasis value={premium[0] ? `${Math.round((premium[0].premium_pct ?? 0) * 100)}%` : "—"} sub={premium[0]?.name} /></div>
      </section>

      <MarketTape items={tape} />

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Buyer network reactor" className="lg:col-span-3" foot="Active acquirers · node size ∝ 12-month cadence.">
          <div aria-hidden><BuyerNetworkReactor height={220} /></div>
        </Section>
        <Section title="Highest premium payers" className="lg:col-span-5"
          foot="Premium over disclosed reference price. Only buyers with a priced, referenced deal appear.">
          <ScrollRegion label="Highest premium payers table">
            <table className="w-full min-w-[360px] text-[12px]">
              <thead className="text-left text-[11px] text-xo-faint">
                <tr className="border-b border-xo-line"><th scope="col" className="px-3 py-2 font-medium">#</th><th scope="col" className="px-2 py-2 font-medium">Buyer</th><th scope="col" className="px-2 py-2 text-right font-medium">Premium</th><th scope="col" className="px-3 py-2 text-right font-medium">Disclosed</th></tr>
              </thead>
              <tbody>
                {premium.map((p, i) => (
                  <tr key={p.buyer_id} className="border-b border-xo-line last:border-0">
                    <td className="px-3 py-1.5 font-mono text-xo-faint">{i + 1}</td>
                    <th scope="row" className="px-2 py-1.5 text-left font-normal"><Link to={`/console/buyer/${p.buyer_id}`} className="font-semibold hover:text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{p.name}</Link></th>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold tabular-nums text-xo-verified">
                      <Evidence align="right" meta={{ methodology: "premium over the disclosed reference price", source: "acquisition registry (disclosed deals only)", sample: p.disclosed_events, asOf: DNA_AS_OF.slice(0, 10) }}>
                        +{Math.round((p.premium_pct ?? 0) * 100)}%
                      </Evidence>
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-xo-muted">{p.disclosed_events} disc.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>
        <Section title="Fastest closers" className="lg:col-span-4" foot="Median announced→closed duration on completed deals.">
          <ScrollRegion label="Fastest closers table">
            <table className="w-full min-w-[320px] text-[12px]">
              <thead className="text-left text-[11px] text-xo-faint">
                <tr className="border-b border-xo-line"><th scope="col" className="px-3 py-2 font-medium">#</th><th scope="col" className="px-2 py-2 font-medium">Buyer</th><th scope="col" className="px-2 py-2 text-right font-medium">Median close</th><th scope="col" className="px-3 py-2 text-right font-medium">Close rate</th></tr>
              </thead>
              <tbody>
                {speed.map((p, i) => (
                  <tr key={p.buyer_id} className="border-b border-xo-line last:border-0">
                    <td className="px-3 py-1.5 font-mono text-xo-faint">{i + 1}</td>
                    <th scope="row" className="px-2 py-1.5 text-left font-normal"><Link to={`/console/buyer/${p.buyer_id}`} className="font-semibold hover:text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{p.name}</Link></th>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold tabular-nums">{p.median_close_days}d</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-xo-muted">{p.close_rate != null ? `${Math.round(p.close_rate * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>
      </div>

      <Section title="Sectors by multiple · what commands the strongest valuation" className="border border-xo-line"
        foot="Institutional multiple priors, framework-governed (the same bands the valuation engine applies). Tables widen as the registry accretes disclosed outcomes.">
        <ScrollRegion label="Sector multiples table">
          <table className="w-full min-w-[560px] text-[12px]">
            <thead className="text-left text-[11px] text-xo-faint">
              <tr className="border-b border-xo-line">
                <th scope="col" className="px-3 py-2 font-medium">Sector</th><th scope="col" className="px-2 py-2 font-medium">Basis</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Low</th><th scope="col" className="px-2 py-2 text-right font-medium">Mid</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">High</th><th scope="col" className="px-3 py-2 text-right font-medium">EBITDA mid</th>
              </tr>
            </thead>
            <tbody>
              {SECTOR_MULT.map((s) => (
                <tr key={s.sector} className="border-b border-xo-line last:border-0">
                  <th scope="row" className="px-3 py-1.5 text-left font-medium capitalize">{label(s.sector)}</th>
                  <td className="px-2 py-1.5 text-xo-muted">{s.kind}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{s.low}×</td>
                  <td className="px-2 py-1.5 text-right font-mono font-semibold tabular-nums text-xo-verified">{s.mid}×</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{s.high}×</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-xo-muted">{s.ebitda != null ? `${s.ebitda}×` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </Section>
    </div>
  );
};

export default OutcomeIntelligence;

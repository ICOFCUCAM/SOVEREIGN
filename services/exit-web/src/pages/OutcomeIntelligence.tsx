import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Panel, Frame, CommandHeader, MarketTape, Evidence } from "../lib/workstation";
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
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Market Intelligence"
        title="Outcome Intelligence"
        tag="Who pays · who closes"
        status={`As of ${DNA_AS_OF.slice(0, 10)}`}
        metrics={[
          { k: "Disclosed premium", v: String(premium.length), accent: true, sub: "buyers on record" },
          { k: "Close-time data", v: String(speed.length), sub: "median announced→closed" },
          { k: "Sectors benchmarked", v: String(SECTOR_MULT.length), sub: "multiple bands" },
          { k: "Top premium", v: premium[0] ? `${Math.round((premium[0].premium_pct ?? 0) * 100)}%` : "—", accent: true, sub: premium[0]?.name },
        ]}
      />

      <MarketTape items={tape} />

      <Frame>
        <Panel title="Buyer network reactor" className="lg:col-span-3"
          foot="Active acquirers · node size ∝ 12-month cadence.">
          <BuyerNetworkReactor height={220} />
        </Panel>
        <Panel title="Highest premium payers" className="lg:col-span-5"
          foot="Premium over disclosed reference price. Only buyers with a priced, referenced deal appear.">
          <table className="w-full text-[12px]">
            <tbody>
              {premium.map((p, i) => (
                <tr key={p.buyer_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5 font-mono text-white/35">{i + 1}</td>
                  <td className="px-2 py-1.5"><Link to={`/console/buyer/${p.buyer_id}`} className="font-semibold text-white hover:text-deal-300">{p.name}</Link></td>
                  <td className="px-2 py-1.5 text-right font-mono font-bold tabular-nums text-deal-300">
                    <Evidence meta={{ methodology: "premium over the disclosed reference price", source: "acquisition registry (disclosed deals only)", sample: p.disclosed_events, asOf: DNA_AS_OF.slice(0, 10) }}>
                      +{Math.round((p.premium_pct ?? 0) * 100)}%
                    </Evidence>
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-white/45">{p.disclosed_events} disc.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Fastest closers" className="lg:col-span-4"
          foot="Median announced→closed duration on completed deals.">
          <table className="w-full text-[12px]">
            <tbody>
              {speed.map((p, i) => (
                <tr key={p.buyer_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5 font-mono text-white/35">{i + 1}</td>
                  <td className="px-2 py-1.5"><Link to={`/console/buyer/${p.buyer_id}`} className="font-semibold text-white hover:text-deal-300">{p.name}</Link></td>
                  <td className="px-2 py-1.5 text-right font-mono font-bold tabular-nums text-white/85">{p.median_close_days}d</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-white/45">{p.close_rate != null ? `${Math.round(p.close_rate * 100)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </Frame>

      <Frame>
        <Panel title="Sectors by multiple · what commands the strongest valuation" className="lg:col-span-12"
          foot="Institutional multiple priors, framework-governed (the same bands the valuation engine applies). Tables widen as the registry accretes disclosed outcomes.">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-3 py-1.5">Sector</th><th className="px-2 py-1.5">Basis</th>
                <th className="px-2 py-1.5 text-right">Low</th><th className="px-2 py-1.5 text-right">Mid</th>
                <th className="px-2 py-1.5 text-right">High</th><th className="px-3 py-1.5 text-right">EBITDA mid</th>
              </tr>
            </thead>
            <tbody>
              {SECTOR_MULT.map((s) => (
                <tr key={s.sector} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5 font-medium capitalize text-white">{label(s.sector)}</td>
                  <td className="px-2 py-1.5 text-white/45">{s.kind}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/60">{s.low}×</td>
                  <td className="px-2 py-1.5 text-right font-mono font-bold tabular-nums text-deal-300">{s.mid}×</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/60">{s.high}×</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-white/55">{s.ebitda != null ? `${s.ebitda}×` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </Frame>
    </div>
  );
};

export default OutcomeIntelligence;

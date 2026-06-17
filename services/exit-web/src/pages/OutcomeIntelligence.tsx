import React from "react";
import { Link } from "react-router-dom";
import { Card, Kpi, SectionHeader } from "../lib/ui";
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

  return (
    <div>
      <SectionHeader
        kicker="Market Intelligence · Outcomes"
        title="Outcome Intelligence"
        description={`Who pays the most, who closes the fastest, and which sectors command the strongest multiples — from disclosed registry outcomes and the valuation framework. As of ${DNA_AS_OF.slice(0, 10)}.`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Buyers with disclosed premium" value={String(premium.length)} sub="on the record" accent="#34d399" />
        <Kpi label="Buyers with close-time data" value={String(speed.length)} sub="median announced→closed" />
        <Kpi label="Sectors benchmarked" value={String(SECTOR_MULT.length)} sub="multiple bands" accent="#fbbf24" />
        <Kpi label="Top premium" value={premium[0] ? `${Math.round((premium[0].premium_pct ?? 0) * 100)}%` : "—"} sub={premium[0]?.name ?? ""} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* highest premium payers */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Highest premium payers</div>
          <table className="w-full text-[12.5px]">
            <tbody>
              {premium.map((p, i) => (
                <tr key={p.buyer_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-2.5 font-mono text-white/40">{i + 1}</td>
                  <td className="px-3 py-2.5"><Link to={`/console/buyer/${p.buyer_id}`} className="font-semibold text-white hover:text-deal-300">{p.name}</Link></td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-deal-300">+{Math.round((p.premium_pct ?? 0) * 100)}%</td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums text-white/45">{p.disclosed_events} disclosed</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">Premium over disclosed reference price. Only buyers with a priced, referenced deal appear.</div>
        </Card>

        {/* fastest closers */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Fastest closers</div>
          <table className="w-full text-[12.5px]">
            <tbody>
              {speed.map((p, i) => (
                <tr key={p.buyer_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-2.5 font-mono text-white/40">{i + 1}</td>
                  <td className="px-3 py-2.5"><Link to={`/console/buyer/${p.buyer_id}`} className="font-semibold text-white hover:text-deal-300">{p.name}</Link></td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-white/85">{p.median_close_days}d</td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums text-white/45">{p.close_rate != null ? `${Math.round(p.close_rate * 100)}% close` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">Median announced→closed duration on completed deals.</div>
        </Card>
      </div>

      {/* strongest-multiple sectors */}
      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Sectors by multiple — what commands the strongest valuation</div>
        <table className="w-full text-[12.5px]">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-2.5">Sector</th><th className="px-3 py-2.5">Basis</th>
              <th className="px-3 py-2.5 text-right">Low</th><th className="px-3 py-2.5 text-right">Mid</th>
              <th className="px-3 py-2.5 text-right">High</th><th className="px-5 py-2.5 text-right">EBITDA mid</th>
            </tr>
          </thead>
          <tbody>
            {SECTOR_MULT.map((s) => (
              <tr key={s.sector} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-2.5 font-medium capitalize text-white">{label(s.sector)}</td>
                <td className="px-3 py-2.5 text-white/45">{s.kind}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/60">{s.low}×</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-deal-300">{s.mid}×</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/60">{s.high}×</td>
                <td className="px-5 py-2.5 text-right font-mono tabular-nums text-white/55">{s.ebitda != null ? `${s.ebitda}×` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">Institutional multiple priors, framework-governed (the same bands the valuation engine applies). Premium & close-time tables widen as the registry accretes disclosed outcomes.</div>
      </Card>
    </div>
  );
};

export default OutcomeIntelligence;

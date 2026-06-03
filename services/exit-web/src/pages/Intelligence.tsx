import React, { useMemo, useState } from "react";
import { Card, Kpi, SectionHeader, Field, inputCls, fmtMoney } from "../lib/ui";
import { BUYERS, VALUATION_STRATEGIC } from "../lib/engines";

// Acquisition Intelligence Engine surface — wired to runBuyerDiscovery.
// Free-text refinement filters the engine output client-side.

const APPETITE_STYLE: Record<"active" | "warm" | "dormant", string> = {
  active:  "text-deal-400",
  warm:    "text-loi-400",
  dormant: "text-white/45",
};

const Intelligence: React.FC = () => {
  const [query, setQuery] = useState("");
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const filtered = useMemo(() => {
    if (tokens.length === 0) return BUYERS.candidates;
    return BUYERS.candidates.filter((c) => {
      const hay = [
        c.buyer.name,
        c.buyer.buyerType,
        c.buyer.thesis,
        c.buyer.sectorsActive.join(" "),
        c.buyer.geographyPreferred.join(" "),
      ].join(" ").toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [tokens]);

  const activeCount = BUYERS.candidates.filter((c) => c.buyer.appetite === "active").length;
  const avgProb = BUYERS.candidates.length > 0
    ? BUYERS.candidates.reduce((s, c) => s + c.probability, 0) / BUYERS.candidates.length
    : 0;
  return (
    <div>
      <SectionHeader
        kicker="Module 01 · Sourcing"
        title="Acquisition Intelligence Engine"
        description={`Ranked against an implied price of ${fmtMoney(VALUATION_STRATEGIC.headline.mid)}. Probability = sector × model × check × geography × activity × M&A track record (EDGAR 8-K + Wikidata).`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Candidates ranked" value={String(BUYERS.candidates.length)} sub="qualifying ≥ 15% probability" />
        <Kpi label="Active acquirers"  value={String(activeCount)} sub="recent-12mo activity" accent="#34d399" />
        <Kpi label="Tracked deals"     value={String(BUYERS.candidates.reduce((s, c) => s + c.history.totalDeals, 0))} sub="across registry · sourced" />
        <Kpi label="Average match"     value={avgProb.toFixed(2)} sub="probability × fit" />
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
          {filtered.length} of {BUYERS.candidates.length} candidates match. {BUYERS.summary}
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-bold">Top candidates</h2>
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">Acquirer</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Appetite</th>
                <th className="px-5 py-3">Check size</th>
                <th className="px-5 py-3">Signals</th>
                <th className="px-5 py-3 text-right">Match</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.buyer.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 align-top">
                    <div className="font-medium text-white">{c.buyer.name}</div>
                    <div className="mt-1 max-w-md text-xs leading-snug text-white/45">{c.buyer.thesis}</div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] uppercase tracking-wide text-white/65">{c.buyer.buyerType.replace(/_/g, " ")}</td>
                  <td className={`px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wide ${APPETITE_STYLE[c.buyer.appetite]}`}>{c.buyer.appetite}</td>
                  <td className="px-5 py-3.5 text-xs text-white/70">{fmtMoney(c.buyer.checkSizeLowUsd)} – {fmtMoney(c.buyer.checkSizeHighUsd)}</td>
                  <td className="px-5 py-3.5 align-top">
                    <ul className="space-y-1 text-[11px] text-white/55">
                      {c.signals.slice(0, 5).map((s) => {
                        const isEvidence = s.startsWith("Last deal:") || /disclosed deal/.test(s) || /prior acquisition/.test(s);
                        const isCaution  = s.startsWith("Caution:");
                        return (
                          <li key={s} className={isEvidence ? "text-white/75" : isCaution ? "text-loi-400" : ""}>
                            · {s}
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                  <td className="px-5 py-3.5 text-right align-top font-mono tabular-nums text-deal-300">{c.probability.toFixed(2)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-white/40">No candidates match the filter.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default Intelligence;

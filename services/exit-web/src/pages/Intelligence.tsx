import React, { useState } from "react";
import { Button, Card, Field, Kpi, SectionHeader, inputCls } from "../lib/ui";

interface BuyerCandidate {
  name: string; sector: string; appetite: "active" | "warm" | "dormant"; lastDeal: string; checkSize: string; score: number;
}

const CANDIDATES: readonly BuyerCandidate[] = [
  { name: "Helios Acquisition Group",  sector: "Enterprise SaaS",     appetite: "active",  lastDeal: "Q1 2026", checkSize: "$15M–$80M", score: 0.91 },
  { name: "Astra Strategic",           sector: "Vertical SaaS",       appetite: "active",  lastDeal: "Q2 2026", checkSize: "$10M–$60M", score: 0.87 },
  { name: "Forum Equity Partners",     sector: "B2B Marketplaces",    appetite: "warm",    lastDeal: "Q4 2025", checkSize: "$8M–$40M",  score: 0.74 },
  { name: "Northbound Capital",        sector: "Tech-enabled svcs",   appetite: "warm",    lastDeal: "Q3 2025", checkSize: "$5M–$30M",  score: 0.68 },
  { name: "Sentinel Holdings",         sector: "Industrial software", appetite: "dormant", lastDeal: "2024",    checkSize: "$20M–$100M", score: 0.52 },
];

const APPETITE_STYLE: Record<BuyerCandidate["appetite"], string> = {
  active:  "text-deal-400",
  warm:    "text-loi-400",
  dormant: "text-white/45",
};

const Intelligence: React.FC = () => {
  const [query, setQuery] = useState("");
  return (
    <div>
      <SectionHeader
        kicker="Module 01 · Sourcing"
        title="Acquisition Intelligence Engine"
        description="Identify and rank strategic buyers across markets. Signals, posture, deal history and corporate appetite — at founder-readable resolution."
        actions={<Button variant="primary">Run new scan</Button>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Candidates ranked" value="247"  sub="last 30 days" />
        <Kpi label="Active acquirers"  value="38"   sub="signal-confirmed" accent="#34d399" />
        <Kpi label="Sectoral coverage" value="12"   sub="industries" />
        <Kpi label="Average match"     value="0.71" sub="appetite × fit" />
      </div>

      <Card className="mt-8 p-6">
        <Field label="Refine the candidate set">
          <input className={inputCls} placeholder="check size, sector, geography, recent activity…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </Field>
        <div className="mt-3 text-xs text-white/40">Free-text refinement. The intelligence engine resolves natural-language filters against the canonical buyer graph.</div>
      </Card>

      <div className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-bold">Top candidates</h2>
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">Acquirer</th>
                <th className="px-5 py-3">Sector</th>
                <th className="px-5 py-3">Appetite</th>
                <th className="px-5 py-3">Last deal</th>
                <th className="px-5 py-3">Check size</th>
                <th className="px-5 py-3 text-right">Match</th>
              </tr>
            </thead>
            <tbody>
              {CANDIDATES.map((c) => (
                <tr key={c.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium text-white">{c.name}</td>
                  <td className="px-5 py-3.5 text-white/70">{c.sector}</td>
                  <td className={`px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wide ${APPETITE_STYLE[c.appetite]}`}>{c.appetite}</td>
                  <td className="px-5 py-3.5 text-white/55">{c.lastDeal}</td>
                  <td className="px-5 py-3.5 text-white/70">{c.checkSize}</td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums text-deal-300">{c.score.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default Intelligence;

import React from "react";
import { Button, Card, Kpi, SectionHeader, fmtMoney } from "../lib/ui";

interface Mandate { firm: string; type: "Strategic" | "PE" | "Family Office"; thesis: string; checkSize: string; sector: string; appetite: number }

const MANDATES: readonly Mandate[] = [
  { firm: "Helios Acquisition Group",   type: "Strategic", thesis: "Vertical-SaaS consolidation, 18-mo platform thesis",     checkSize: "$15M–$80M",  sector: "Enterprise SaaS",      appetite: 0.92 },
  { firm: "Astra Strategic",            type: "Strategic", thesis: "Bolt-on for enterprise risk product line",               checkSize: "$10M–$60M",  sector: "Risk & Compliance",   appetite: 0.88 },
  { firm: "Forum Equity Partners",      type: "PE",        thesis: "Growth equity into B2B marketplaces",                     checkSize: "$8M–$40M",   sector: "B2B Marketplaces",    appetite: 0.74 },
  { firm: "Northbound Capital",         type: "PE",        thesis: "Tech-enabled services rollups across NA",                  checkSize: "$5M–$30M",   sector: "Tech-enabled svcs",   appetite: 0.69 },
  { firm: "Lehnen Family Holdings",     type: "Family Office", thesis: "Long-hold operating positions in vertical software", checkSize: "$10M–$50M",  sector: "Vertical SaaS",       appetite: 0.65 },
  { firm: "Sentinel Holdings",          type: "Strategic", thesis: "Industrial automation acquisition program",                checkSize: "$20M–$100M", sector: "Industrial software", appetite: 0.61 },
];

const TYPE_STYLE: Record<Mandate["type"], string> = {
  Strategic:      "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  PE:             "bg-loi-500/15 text-loi-400 ring-loi-400/40",
  "Family Office":"bg-stage-engaged/15 text-stage-engaged ring-stage-engaged/40",
};

const Buyers: React.FC = () => (
  <div>
    <SectionHeader
      kicker="Module 03 · Sourcing"
      title="Buyer Marketplace"
      description="Curated directory of strategic and financial buyers with active mandates. The reverse signal: which buyers are looking for what."
      actions={<><Button variant="ghost">Filter</Button><Button>Approach buyer</Button></>}
    />

    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Kpi label="Active mandates"        value="42"   sub="across all sectors" />
      <Kpi label="In our sector"          value="11"   sub="vertical SaaS" accent="#34d399" />
      <Kpi label="Median target check"    value={fmtMoney(22_500_000)} sub="last 90 days" />
      <Kpi label="Newly active"           value="6"    sub="signal-confirmed this week" accent="#fbbf24" />
    </div>

    <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
      {MANDATES.map((m) => (
        <Card key={m.firm} className="!rounded-none border-0 bg-ink-800/95 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-serif text-lg font-bold text-white">{m.firm}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${TYPE_STYLE[m.type]}`}>{m.type}</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-white/65">{m.thesis}</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-[11px]">
            <div><dt className="text-white/40">Check size</dt><dd className="mt-0.5 font-medium text-white/85">{m.checkSize}</dd></div>
            <div><dt className="text-white/40">Sector</dt><dd className="mt-0.5 font-medium text-white/85">{m.sector}</dd></div>
            <div><dt className="text-white/40">Appetite</dt><dd className="mt-0.5 font-mono font-medium text-deal-300">{m.appetite.toFixed(2)}</dd></div>
          </dl>
        </Card>
      ))}
    </div>
  </div>
);

export default Buyers;

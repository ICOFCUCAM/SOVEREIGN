import React from "react";
import { useNavigate } from "react-router-dom";
import { MarketingChrome, Glyph, Arrow } from "../components/MarketingChrome";
import { MODULE_FACTS } from "../lib/module-stats";

// Modules — the marketing breakdown of what's inside the console, split by the
// side of the table the user sits on. Each card's stat line is computed from
// the live engines (see lib/module-stats.ts), never typed in by hand.

interface Mod { icon: string; name: string; body: string; stat?: string }

const FOUNDER_MODULES: Mod[] = [
  { icon: "chart", name: "Valuation Engine", body: "DCF, comparables and revenue/EBITDA multiples, recomputed live.", stat: MODULE_FACTS.valuation },
  { icon: "spark", name: "Exit Readiness Score", body: "A money-tied score across weighted dimensions with each fix priced.", stat: MODULE_FACTS.readiness },
  { icon: "globe", name: "Buyer Intelligence", body: "Likelihood, range, timing, risk and synergy for every acquirer.", stat: MODULE_FACTS.buyerIntel },
  { icon: "users", name: "Outreach", body: "Teasers, CIMs and a sequenced campaign — run by the banker agent.", stat: MODULE_FACTS.outreach },
  { icon: "lock", name: "Data Room", body: "Permissioned, completeness-scored, with the dollar impact of every gap.", stat: MODULE_FACTS.dataRoom },
  { icon: "doc", name: "Documents", body: "CIM, teaser, deck and LOIs, red-teamed against your real numbers.", stat: MODULE_FACTS.documents },
  { icon: "chart", name: "Negotiator", body: "Offer scoring, counters, protective clauses and earnout alternatives." },
  { icon: "check", name: "Closing Center", body: "Signatures, escrow and filings tracked to the wire." },
  { icon: "shield", name: "WealthOS", body: "Proceeds, taxes, trusts, family office and reinvestment after close." },
];

const BUYER_MODULES: Mod[] = [
  { icon: "globe", name: "Marketplace", body: "Browse anonymized opportunities matched to your thesis.", stat: MODULE_FACTS.marketplace },
  { icon: "chart", name: "Acquisition Radar", body: "Live sector signals — deals, mandates and demand.", stat: MODULE_FACTS.radar },
  { icon: "lock", name: "Deal Room", body: "Gated diligence access once trust and NDA clear." },
  { icon: "doc", name: "Access Requests", body: "Request NDA-gated identity and packages, tracked end to end." },
];

const ModCard: React.FC<{ m: Mod }> = ({ m }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
    <div className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Glyph name={m.icon} small /></span>
      <div className="text-sm font-bold text-ink-900">{m.name}</div>
    </div>
    <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">{m.body}</p>
    {m.stat && (
      <div className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[10.5px] font-medium uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
        {m.stat}
      </div>
    )}
  </div>
);

const Modules: React.FC = () => {
  const nav = useNavigate();
  return (
    <MarketingChrome active="modules">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">The modules</div>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.07] tracking-tight text-ink-900 sm:text-5xl">Every module a sell-side desk needs.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">Founders get the full transaction suite. Buyers get a focused access tier on the other side of the marketplace.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-800">Launch ExitOS <Arrow /></button>
            <button onClick={() => nav("/pricing")} className="inline-flex items-center rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-slate-50">See pricing</button>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">Founder side</div>
          <h2 className="mt-2 font-serif text-[2rem] font-bold tracking-tight text-ink-900">Run the whole sale.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FOUNDER_MODULES.map((m) => <ModCard key={m.name} m={m} />)}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">Buyer side</div>
          <h2 className="mt-2 font-serif text-[2rem] font-bold tracking-tight text-ink-900">Find and win deals.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BUYER_MODULES.map((m) => <ModCard key={m.name} m={m} />)}
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700">Launch ExitOS <Arrow /></button>
            <button onClick={() => nav("/platform")} className="inline-flex items-center rounded-md border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-ink-900 transition hover:bg-slate-50">Back to platform</button>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
};

export default Modules;

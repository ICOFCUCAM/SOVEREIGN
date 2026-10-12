import React from "react";
import { useNavigate } from "react-router-dom";
import { MarketingChrome, Glyph, Arrow, Chapter, Editorial, MK, PageHero } from "../components/MarketingChrome";
import { NegotiationDesk, BuyerIntelligence, ExampleListings } from "../components/ExchangeBlocks";
import { SourcesSection } from "../components/SourceNotes";
import { MODULE_FACTS } from "../lib/module-stats";

// Modules — the marketing breakdown of what's inside the console, split by the
// side of the table the user sits on. Each card's stat line is computed from
// the live engines (see lib/module-stats.ts), never typed in by hand.

interface Mod { icon: string; name: string; body: string; stat?: string }

const FOUNDER_MODULES: Mod[] = [
  { icon: "chart", name: "Valuation Engine", body: "DCF, comparables and revenue/EBITDA multiples, recomputed from your figures.", stat: MODULE_FACTS.valuation },
  { icon: "spark", name: "Exit Readiness Score", body: "A money-tied score across weighted dimensions with each fix priced.", stat: MODULE_FACTS.readiness },
  { icon: "globe", name: "Buyer Intelligence", body: "Likelihood, range, timing, risk and synergy for every acquirer.", stat: MODULE_FACTS.buyerIntel },
  { icon: "users", name: "Outreach", body: "Teasers, CIMs and a sequenced campaign — drafted by the banker for you to send.", stat: MODULE_FACTS.outreach },
  { icon: "lock", name: "Data Room", body: "A document checklist, completeness-scored, with the dollar impact of every gap.", stat: MODULE_FACTS.dataRoom },
  { icon: "doc", name: "Documents", body: "CIM, teaser, deck and LOIs, red-teamed against your real numbers.", stat: MODULE_FACTS.documents },
  { icon: "chart", name: "Negotiator", body: "Offer scoring, counters, protective clauses and earnout alternatives." },
  { icon: "check", name: "Closing Center", body: "The closing checklist: signatures, escrow and filings, item by item." },
  { icon: "shield", name: "WealthOS", body: "Proceeds, taxes, trusts, family office and reinvestment after close." },
];

const BUYER_MODULES: Mod[] = [
  { icon: "globe", name: "Marketplace", body: "Browse anonymized opportunities matched to your thesis.", stat: MODULE_FACTS.marketplace },
  { icon: "chart", name: "Acquisition Radar", body: "Sector signals from the registry — deals, mandates and demand.", stat: MODULE_FACTS.radar },
  { icon: "lock", name: "Deal Room", body: "Diligence access for companies that accept your NDA request." },
  { icon: "doc", name: "Access Requests", body: "Request NDA-gated identity and packages, tracked end to end." },
];

const ModCard: React.FC<{ m: Mod; dark?: boolean }> = ({ m, dark }) => (
  <div className={`flex flex-col py-6 sm:px-6 ${dark ? "" : "bg-[#f6f8fb]"}`} style={dark ? { background: "#08203B" } : undefined}>
    <div className="flex items-center gap-3">
      <span className={dark ? "text-blue-300" : "text-blue-600"}><Glyph name={m.icon} /></span>
      <h3 className={`font-editorial text-[21px] font-semibold ${dark ? "text-white" : "text-ink-900"}`}>{m.name}</h3>
    </div>
    <p className={`mt-3 flex-1 text-[13px] leading-relaxed ${dark ? "text-blue-100/70" : "text-slate-600"}`}>{m.body}</p>
    {m.stat && (
      <div className={`mt-4 border-t pt-3 font-mono text-[11.5px] font-medium ${dark ? "border-white/15 text-blue-200" : "border-slate-300 text-ink-800"}`}>
        {m.stat}
      </div>
    )}
  </div>
);

const Modules: React.FC = () => {
  const nav = useNavigate();
  return (
    <MarketingChrome active="modules">
      <PageHero chapter="The modules" title="Every module a sell-side desk needs."
        deck="Founders get the full transaction suite. Buyers get a focused access tier on the other side of the marketplace."
        actions={<>
          <button onClick={() => nav("/console")} className={`${MK.btn} bg-ink-900 text-white hover:bg-ink-800`}>Launch ExitOS <Arrow /></button>
          <button onClick={() => nav("/pricing")} className={`${MK.btn} border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white`}>See pricing <span aria-hidden>↗</span></button>
        </>} />

      <section className="border-b border-slate-200 bg-[#f6f8fb]">
        <div className={`${MK.wrap} ${MK.section}`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n="02">Founder side</Chapter>
            <h2 className={`${MK.h2} text-ink-900`}><Editorial text="Run the whole sale." /></h2>
          </div>
          <div className="mt-12 grid gap-px border-y border-ink-900 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {FOUNDER_MODULES.map((m) => <ModCard key={m.name} m={m} />)}
          </div>
        </div>
      </section>

      <NegotiationDesk n="03" />
      <BuyerIntelligence n="04" />
      <ExampleListings n="05" />

      <section className="text-white" style={{ background: MK.navy }}>
        <div className={`${MK.wrap} ${MK.section}`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n="06" dark>Buyer side</Chapter>
            <h2 className={`${MK.h2} text-white`}><Editorial text="Find and win deals." dark /></h2>
          </div>
          <div className="mt-12 grid gap-px border-y border-white/20 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {BUYER_MODULES.map((m) => <ModCard key={m.name} m={m} dark />)}
          </div>
          <div className="mt-12 flex flex-wrap gap-2.5">
            <button onClick={() => nav("/console")} className={`${MK.btn} bg-white text-ink-900 hover:bg-blue-50`}>Launch ExitOS <Arrow /></button>
            <button onClick={() => nav("/platform")} className={`${MK.btn} border border-white/60 text-white hover:bg-white hover:text-ink-900`}>Back to platform <span aria-hidden>↗</span></button>
          </div>
        </div>
      </section>
      <SourcesSection only={[2]} />
    </MarketingChrome>
  );
};

export default Modules;

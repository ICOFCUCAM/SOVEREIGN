import React from "react";
import { useNavigate } from "react-router-dom";
import { MarketingChrome, Glyph, Arrow, Chapter, Editorial, MK, PageHero } from "../components/MarketingChrome";
import { MARKET_FMT } from "../lib/market-stats";

// Platform — the marketing page for the acquisition infrastructure itself:
// one exchange, one record, end to end.

const PILLARS = [
  { icon: "globe", title: "Acquisition exchange", body: `${MARKET_FMT.buyers} curated acquirer mandates on one exchange — strategics, PE, family offices and corporate development, across ${MARKET_FMT.geographies} jurisdictions.` },
  { icon: "chart", title: "Intelligence engines", body: "Valuation, readiness, buyer discovery and diligence run deterministically on your numbers — not slideware." },
  { icon: "spark", title: "Autonomous execution", body: "Agents walk through sourcing, outreach, data room, negotiation and closing. Each step waits for your approval, and nothing is sent for you." },
  { icon: "lock", title: "Data rooms and records", body: "A document checklist with completeness per package, NDA-gated identity, and your deal actions recorded." },
];

const FLOW = [
  { icon: "chart", title: "Prepare", body: "Valuation, Exit Readiness Score and the priced fix list." },
  { icon: "globe", title: "Discover", body: "Buyer intelligence, the marketplace and the acquisition radar." },
  { icon: "users", title: "Engage", body: "Outreach, NDAs, pipeline and the deal room." },
  { icon: "spark", title: "Negotiate", body: "Offer scoring, counters, clauses and scenario simulation." },
  { icon: "lock", title: "Close", body: "Signatures, escrow, documents and the closing checklist." },
  { icon: "check", title: "Transition", body: "WealthOS — proceeds, taxes, trusts and reinvestment." },
];

const Platform: React.FC = () => {
  const nav = useNavigate();
  return (
    <MarketingChrome active="platform">
      <PageHero chapter="The platform" title={"One acquisition infrastructure.\nSourcing to wire."}
        deck="ExitOS replaces the patchwork of bankers, data rooms and CRMs with a single exchange — one record, one source of truth, from the first conversation to money in the bank."
        actions={<>
          <button onClick={() => nav("/console")} className={`${MK.btn} bg-ink-900 text-white hover:bg-ink-800`}>Launch ExitOS <Arrow /></button>
          <button onClick={() => nav("/modules")} className={`${MK.btn} border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white`}>Explore the modules <span aria-hidden>↗</span></button>
        </>} />

      <section className="border-b border-slate-200 bg-[#f6f8fb]">
        <div className={`${MK.wrap} ${MK.section}`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n="02">Infrastructure</Chapter>
            <h2 className={`${MK.h2} text-ink-900`}><Editorial text="Built like a bank, run like software." /></h2>
          </div>
          <div className="mt-12 grid gap-px border-y border-ink-900 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p, i) => (
              <div key={p.title} className="bg-[#f6f8fb] py-7 sm:px-6">
                <span className="font-mono text-[10.5px] text-blue-600">{String(i + 1).padStart(2, "0")} /</span>
                <div className="mt-5 text-blue-600"><Glyph name={p.icon} size={30} /></div>
                <h3 className="mt-4 font-editorial text-[23px] font-semibold leading-tight text-ink-900">{p.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="text-white" style={{ background: MK.navy }}>
        <div className={`${MK.wrap} ${MK.section}`}>
          <Chapter n="03" dark>End to end</Chapter>
          <h2 className={`${MK.h2} mt-4 text-white`}><Editorial text="The whole exit, on one exchange." dark /></h2>
          <ol className="mt-12 grid gap-px border-y border-white/20 bg-white/10 sm:grid-cols-2 lg:grid-cols-6">
            {FLOW.map((s, i) => (
              <li key={s.title} className="py-6 sm:px-5" style={{ background: "#08203B" }}>
                <div className="flex items-center justify-between">
                  <span className="text-blue-300"><Glyph name={s.icon} /></span>
                  <span className="font-mono text-[11px] text-blue-300">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-5 font-editorial text-[21px] font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-snug text-blue-100/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#f6f8fb]">
        <div className={`${MK.wrap} ${MK.section}`}>
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <Chapter n="04">The next move</Chapter>
              <h2 className={`${MK.h2} mt-5 text-ink-900`}><Editorial text="See the desk run a deal." /></h2>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-600">Open the console and walk through the agents — or talk to us about a private process.</p>
            </div>
            <div className="flex flex-wrap gap-2.5 lg:flex-col lg:items-stretch">
              <button onClick={() => nav("/console")} className={`${MK.btn} justify-between bg-ink-900 text-white hover:bg-ink-800`}>Launch ExitOS <Arrow /></button>
              <button onClick={() => nav("/pricing")} className={`${MK.btn} justify-between border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white`}>See pricing <span aria-hidden>↗</span></button>
            </div>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
};

export default Platform;

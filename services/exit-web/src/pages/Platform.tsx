import React from "react";
import { useNavigate } from "react-router-dom";
import { MarketingChrome, Glyph, Arrow } from "../components/MarketingChrome";

// Platform — the marketing page for the acquisition infrastructure itself:
// one exchange, one audit trail, end to end.

const PILLARS = [
  { icon: "globe", title: "Acquisition exchange", body: "58,000+ verified buyers on one live marketplace — strategics, PE, family offices and corporate development." },
  { icon: "chart", title: "Intelligence engines", body: "Valuation, readiness, buyer discovery and diligence run deterministically on your numbers — not slideware." },
  { icon: "spark", title: "Autonomous execution", body: "Agents run sourcing, outreach, data room, negotiation and closing. You approve; the desk does the work." },
  { icon: "lock", title: "Institutional security", body: "Permissioned data rooms, full audit trails and access logs. Every action and artifact is accountable." },
];

const FLOW = [
  { icon: "chart", title: "Prepare", body: "Valuation, Exit Readiness Score and the priced fix list." },
  { icon: "globe", title: "Discover", body: "Buyer intelligence, the marketplace and the acquisition radar." },
  { icon: "users", title: "Engage", body: "Outreach, NDAs, pipeline and the live deal room." },
  { icon: "spark", title: "Negotiate", body: "Offer scoring, counters, clauses and scenario simulation." },
  { icon: "lock", title: "Close", body: "Signatures, escrow, documents and the closing checklist." },
  { icon: "check", title: "Transition", body: "WealthOS — proceeds, taxes, trusts and reinvestment." },
];

const Platform: React.FC = () => {
  const nav = useNavigate();
  return (
    <MarketingChrome active="platform">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">The platform</div>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.07] tracking-tight text-ink-900 sm:text-5xl">One acquisition infrastructure.<br />Sourcing to wire.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">ExitOS replaces the patchwork of bankers, data rooms and CRMs with a single exchange — one audit trail, one source of truth, from the first conversation to money in the bank.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-800">Launch ExitOS <Arrow /></button>
            <button onClick={() => nav("/modules")} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-slate-50">Explore the modules</button>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <h2 className="font-serif text-[2rem] font-bold tracking-tight text-ink-900">Built like a bank, run like software.</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Glyph name={p.icon} /></span>
                <div className="mt-4 text-base font-bold text-ink-900">{p.title}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">End to end</div>
          <h2 className="mt-3 font-serif text-[2rem] font-bold tracking-tight text-ink-900">The whole exit, on one exchange.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {FLOW.map((s, i) => (
              <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-white"><Glyph name={s.icon} small /></span>
                  <span className="font-mono text-[11px] font-bold text-slate-300">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="mt-3 text-sm font-bold text-ink-900">{s.title}</div>
                <div className="mt-1.5 text-[12px] leading-snug text-slate-500">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">See the desk run a deal.</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">Open the console and watch the agents work — or talk to us about a private process.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700">Launch ExitOS <Arrow /></button>
            <button onClick={() => nav("/pricing")} className="inline-flex items-center rounded-md border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-ink-900 transition hover:bg-slate-50">See pricing</button>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
};

export default Platform;

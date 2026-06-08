import React from "react";
import { useNavigate } from "react-router-dom";

// Public marketing landing — the front door to ExitOS. A 10-section
// institutional sales page (light theme): hero with a live command-center data
// panel, the acquisition marketplace, how it works, buyer intelligence, the
// command center, data rooms, the negotiation engine, the exit marketplace,
// global infrastructure and a closing CTA. Figures are illustrative.

const NAV = ["Platform", "Solutions", "Resources", "Company", "Pricing"];

// ---- shared bits -----------------------------------------------------------
const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">{children}</div>
);
const SectionTag: React.FC<{ n: string; label: string }> = ({ n, label }) => (
  <div className="hidden shrink-0 lg:block">
    <div className="font-mono text-[13px] font-bold text-ink-800">{n}</div>
    <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-slate-400">{label}</div>
  </div>
);

const Landing: React.FC = () => {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-ink-900">
      {/* ===== TOP NAV ===== */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-black text-white shadow-sm">EX</div>
            <span className="text-lg font-bold tracking-tight text-ink-900">
              EXIT<span className="text-blue-600">OS</span>
            </span>
          </div>
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => (
              n === "Pricing"
                ? <button key={n} onClick={() => nav("/pricing")} className="text-[13px] font-medium text-slate-600 transition hover:text-ink-900">{n}</button>
                : <a key={n} href={`#${n.toLowerCase()}`} className="text-[13px] font-medium text-slate-600 transition hover:text-ink-900">{n}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => nav("/console")} className="text-[13px] font-semibold text-slate-700 transition hover:text-ink-900">Log in</button>
            <button onClick={() => nav("/console")}
              className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-ink-800">
              Launch ExitOS
            </button>
          </div>
        </div>
      </header>

      {/* ===== 01 · HERO ===== */}
      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:px-10 lg:py-24">
          <div>
            <Eyebrow>The operating system for company sales</Eyebrow>
            <h1 className="mt-5 font-serif text-5xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-6xl">
              Built for founders.
              <br />Trusted by acquirers.
              <br /><span className="text-blue-600">Designed to close.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
              ExitOS is the acquisition operating system that connects founders with the right buyers, runs the entire sale process, and closes more deals.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button onClick={() => nav("/console")}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                Launch ExitOS
              </button>
              <button onClick={() => nav("/pricing")}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition hover:border-slate-400 hover:bg-slate-50">
                Request a Demo
              </button>
            </div>
            <div className="mt-10">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Trusted by financial backers of the acquirers</div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 font-serif text-sm font-semibold text-slate-400">
                {["Sequoia", "a16z", "Google", "Oracle", "Elite", "Thoma Bravo"].map((l) => <span key={l}>{l}</span>)}
              </div>
            </div>
          </div>
          {/* live command-center data panel */}
          <HeroPanel />
        </div>
      </section>

      {/* ===== 02 · ACQUISITION MARKET ===== */}
      <section id="solutions" className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <SectionTag n="02" label="Acquisition Market" />
          <div className="flex-1">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-ink-900">The world's acquisition marketplace.</h2>
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
              {MARKET_STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-serif text-2xl font-bold text-blue-600">{s.value}</div>
                  <div className="mt-1 text-[12px] leading-snug text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 03 · HOW EXITOS WORKS ===== */}
      <section id="platform" className="border-b border-slate-200">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <SectionTag n="03" label="How ExitOS Works" />
          <div className="flex-1">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-ink-900">Run your entire company sale from discovery to closing.</h2>
            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
              {STEPS.map((st, i) => (
                <div key={st.title} className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-900 text-white shadow-sm">
                    <Glyph name={st.icon} />
                  </div>
                  <div className="mt-4 text-sm font-bold text-ink-900">{st.title}</div>
                  <div className="mt-1.5 text-[12px] leading-snug text-slate-500">{st.body}</div>
                  {i < STEPS.length - 1 && (
                    <div className="absolute right-[-14px] top-6 hidden text-slate-300 lg:block">&rarr;</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 04 · BUYER INTELLIGENCE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <SectionTag n="04" label="Buyer Intelligence" />
          <div className="flex-1">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-ink-900">Real buyers. Real appetite. Real opportunities.</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-xl bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
              {BUYERS.map((b) => (
                <div key={b.name} className="bg-white p-5">
                  <div className="text-sm font-bold text-ink-900">{b.name}</div>
                  <div className="text-[11px] text-slate-400">{b.kind}</div>
                  <dl className="mt-4 space-y-2 text-[11px]">
                    {b.rows.map((r) => (
                      <div key={r[0]} className="flex justify-between gap-2">
                        <dt className="text-slate-400">{r[0]}</dt>
                        <dd className="font-semibold text-ink-800">{r[1]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
            <a href="#" className="mt-6 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">View all buyers &rarr;</a>
          </div>
        </div>
      </section>

      {/* ===== 05 · COMMAND CENTER PREVIEW ===== */}
      <section className="border-b border-slate-200">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <SectionTag n="05" label="Command Center" />
          <div className="grid flex-1 items-center gap-10 lg:grid-cols-2">
            <DashboardMini />
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-ink-900">Your Acquisition Command Center.</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Real-time intelligence, buyer activity, transaction tracking, valuation insights and market demand — all in one institutional platform.
              </p>
              <ul className="mt-6 space-y-4">
                {COMMAND_FEATURES.map((f) => (
                  <li key={f.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600"><Glyph name={f.icon} small /></span>
                    <div>
                      <div className="text-sm font-bold text-ink-900">{f.title}</div>
                      <div className="text-[12px] text-slate-500">{f.body}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <a href="#" className="mt-6 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">Explore the Platform &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 06 · DATA ROOM INFRASTRUCTURE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <SectionTag n="06" label="Data Room Infrastructure" />
          <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-ink-900">Institutional-grade data rooms.</h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
                Secure, permissioned, and built for high-stakes transactions.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {DATA_ROOMS.map((d) => (
                  <div key={d} className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-4 text-center">
                    <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-white text-ink-700 shadow-sm"><Glyph name="doc" small /></span>
                    <div className="mt-3 text-[12px] font-semibold leading-snug text-ink-800">{d}</div>
                  </div>
                ))}
              </div>
              <a href="#" className="mt-6 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">Learn more &rarr;</a>
            </div>
            <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-ink-900 to-ink-700 p-12">
              <Vault />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 07 · NEGOTIATION ENGINE ===== */}
      <section className="border-b border-slate-200">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <SectionTag n="07" label="Negotiation Engine" />
          <div className="grid flex-1 items-start gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-ink-900">Negotiate with clarity. Close with confidence.</h2>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                AI-powered negotiation support to maximise your outcome and minimise your risk.
              </p>
              <OfferTable />
            </div>
            <ul className="space-y-6 lg:pt-4">
              {NEGOTIATION_FEATURES.map((f) => (
                <li key={f.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-loi-300/30 text-loi-600"><Glyph name={f.icon} small /></span>
                  <div>
                    <div className="text-sm font-bold text-ink-900">{f.title}</div>
                    <div className="text-[12px] text-slate-500">{f.body}</div>
                  </div>
                </li>
              ))}
              <a href="#" className="inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">See Negotiation Engine &rarr;</a>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== 08 · EXIT MARKETPLACE ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] items-start gap-8 px-6 py-16 lg:px-10">
          <SectionTag n="08" label="Exit Marketplace" />
          <div className="flex-1">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-ink-900">Live opportunities. Private and confidential.</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {OPPORTUNITIES.map((o) => (
                <div key={o.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                  <div className="inline-block rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">{o.sector}</div>
                  <div className="mt-3 text-sm font-bold text-ink-900">{o.name}</div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">Asking Price</div>
                      <div className="font-serif text-xl font-bold text-ink-900">{o.price}</div>
                    </div>
                    <a href="#" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">View Details &rarr;</a>
                  </div>
                </div>
              ))}
            </div>
            <a href="#" className="mt-6 inline-block text-[13px] font-semibold text-blue-600 hover:text-blue-700">View all opportunities &rarr;</a>
          </div>
        </div>
      </section>

      {/* ===== 09 · GLOBAL INFRASTRUCTURE ===== */}
      <section className="border-b border-slate-200 bg-ink-900 text-white">
        <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:px-10">
          <div className="flex items-center justify-center">
            <WorldDots />
          </div>
          <div>
            <Eyebrow>Global Infrastructure</Eyebrow>
            <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight">Global reach. Institutional network.</h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/65">
              ExitOS connects founders with buyers across 125+ countries and every major industry.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              {GLOBAL_STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-serif text-2xl font-bold text-blue-300">{s.value}</div>
                  <div className="mt-1 text-[12px] text-white/55">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 10 · FINAL CTA ===== */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1320px] px-6 py-24 text-center lg:px-10">
          <h2 className="font-serif text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">Ready to run your company sale?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
            ExitOS brings acquisition intelligence, buyer discovery, diligence, negotiation and closing into a single institutional operating system.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button onClick={() => nav("/console")}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              Launch ExitOS
            </button>
            <button onClick={() => nav("/pricing")}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-ink-900 transition hover:border-slate-400 hover:bg-slate-50">
              Request Private Demo
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-200 bg-[#f6f8fb]">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-6 py-8 text-[12px] text-slate-400 lg:px-10">
          <div>© {new Date().getFullYear()} ExitOS — A Sovereign Infrastructure</div>
          <div className="font-mono uppercase tracking-[0.22em]">exit.sovereigndo.com</div>
        </div>
      </footer>
    </div>
  );
};

// ===========================================================================
// DATA
// ===========================================================================
const MARKET_STATS = [
  { value: "58,341+", label: "Active Buyers" },
  { value: "$4.2T+", label: "Acquisition Appetite Indexed" },
  { value: "13,240", label: "Active Mandates Tracked" },
  { value: "4,800+", label: "Strategic Acquirers Indexed" },
  { value: "212", label: "Sectors Monitored" },
  { value: "125+", label: "Countries with Buyer Activity" },
];
const STEPS = [
  { icon: "chart", title: "Company Analysis", body: "AI-powered valuation, market positioning and readiness scoring." },
  { icon: "users", title: "Buyer Discovery", body: "Access 58,000+ qualified strategic and financial buyers." },
  { icon: "doc", title: "Data Room", body: "Secure diligence infrastructure built for M&A." },
  { icon: "spark", title: "Negotiation Engine", body: "AI-assisted negotiation with offer optimisation and scenario modelling." },
  { icon: "check", title: "LOI Received", body: "Manage terms, track milestones and reduce deal risk." },
  { icon: "lock", title: "Closing & Payout", body: "Streamline closing, documents and funds transfer." },
];
const BUYERS = [
  { name: "Microsoft", kind: "Enterprise Software", rows: [["Acquisition Appetite", "$50B+"], ["Check Size", "$50M–$5B"], ["Activity Score", "94/100"], ["Focus Areas", "AI, Cloud, DevTools"]] },
  { name: "Salesforce", kind: "CRM / AI / Data", rows: [["Acquisition Appetite", "$20B+"], ["Check Size", "$20M–$2B"], ["Activity Score", "91/100"], ["Focus Areas", "AI, Data, Vertical"]] },
  { name: "SAP", kind: "Enterprise Software", rows: [["Acquisition Appetite", "$15B+"], ["Check Size", "$30M–$3B"], ["Activity Score", "88/100"], ["Focus Areas", "Enterprise, Cloud, Data"]] },
  { name: "Oracle", kind: "Cloud Infrastructure", rows: [["Acquisition Appetite", "$25B+"], ["Check Size", "$40M–$4B"], ["Activity Score", "86/100"], ["Focus Areas", "Cloud, Data, Health"]] },
  { name: "Thoma Bravo", kind: "Private Equity", rows: [["Acquisition Appetite", "$30B+"], ["Check Size", "$100M–$5B"], ["Activity Score", "90/100"], ["Focus Areas", "Software, Security"]] },
];
const COMMAND_FEATURES = [
  { icon: "chart", title: "Live deal tracking", body: "from LOI to closing." },
  { icon: "spark", title: "AI-driven valuation", body: "and offer forecasting." },
  { icon: "users", title: "Buyer signals", body: "and intent monitoring." },
  { icon: "fire", title: "Market heat", body: "and liquidity scores." },
];
const DATA_ROOMS = ["Financial Statements", "Legal Documents", "Contracts & IP", "Customer Data", "Technical Due Diligence", "Compliance & Risk"];
const NEGOTIATION_FEATURES = [
  { icon: "spark", title: "Offer optimization", body: "Maximise value and certainty." },
  { icon: "shield", title: "Risk analysis", body: "Understand downside scenarios." },
  { icon: "doc", title: "Term sheet generation", body: "Create investor-grade documents." },
];
const OPPORTUNITIES = [
  { sector: "Logistics", name: "Logistics Platform", price: "$108M" },
  { sector: "Healthcare", name: "Healthcare SaaS", price: "$220M" },
  { sector: "Cybersecurity", name: "Cybersecurity Platform", price: "$340M" },
  { sector: "AI / SaaS", name: "AI Automation Platform", price: "$195M" },
];
const GLOBAL_STATS = [
  { value: "125+", label: "Countries" },
  { value: "58K+", label: "Active Buyers" },
  { value: "$4.2T+", label: "Buyer Appetite" },
  { value: "24/7", label: "Market Activity" },
];

// ===========================================================================
// VISUAL SUB-COMPONENTS
// ===========================================================================
const HERO_BUYERS = [
  ["Microsoft", "Enterprise Software", "94%", "Very High"],
  ["Salesforce", "CRM / AI / Data", "91%", "Very High"],
  ["SAP", "Enterprise Software", "88%", "High"],
  ["Oracle", "Cloud Infrastructure", "86%", "High"],
  ["Thoma Bravo", "Private Equity", "90%", "Very High"],
  ["Vista Equity", "Private Equity", "87%", "High"],
];
const HERO_TX = [
  ["Helios Freight", "$280,000,000", "US Closed"],
  ["FacileNetworks", "$96,000,000", "Diligence"],
  ["Datablind AI", "$310,000,000", "Negotiation"],
  ["CoreSystems", "$175,000,000", "Signed"],
  ["NextGen Robotics", "$140,000,000", "Closed"],
];
const HeroPanel: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-ink-700/40 bg-ink-900 text-white shadow-2xl shadow-ink-900/30">
    <div className="grid grid-cols-1 divide-y divide-white/10 lg:grid-cols-[1.1fr_1.2fr_0.9fr] lg:divide-x lg:divide-y-0">
      {/* strategic buyers */}
      <div className="p-4">
        <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-blue-300">Strategic Buyers</div>
        <div className="mt-3 space-y-2">
          {HERO_BUYERS.map((b) => (
            <div key={b[0]} className="flex items-center justify-between gap-2 text-[10px]">
              <div>
                <div className="font-semibold text-white">{b[0]}</div>
                <div className="text-white/35">{b[1]}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-semibold text-blue-300">{b[2]}</div>
                <div className="text-white/35">{b[3]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* live transactions */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" /> Live Transactions
        </div>
        <div className="mt-3 space-y-2">
          {HERO_TX.map((t) => (
            <div key={t[0]} className="flex items-center justify-between gap-2 text-[10px]">
              <div className="font-semibold text-white">{t[0]}</div>
              <div className="text-right">
                <div className="font-mono text-white/80">{t[1]}</div>
                <div className="text-blue-300">{t[2]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* acquisition demand + market intelligence */}
      <div className="flex flex-col">
        <div className="p-4">
          <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-loi-300">Acquisition Demand</div>
          <div className="mt-3 space-y-2">
            {[["AI Infrastructure", 0.92], ["SaaS / Enterprise", 0.84], ["Cybersecurity", 0.78], ["Health Tech", 0.71], ["Industrial Tech", 0.63]].map(([k, v]) => (
              <div key={k as string}>
                <div className="flex justify-between text-[9px] text-white/55"><span>{k}</span><span>{Math.round((v as number) * 100)}%</span></div>
                <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-loi-400 to-blue-500" style={{ width: `${(v as number) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-px border-t border-white/10 bg-white/5">
          {[["$4.2T+", "Acquisition Appetite"], ["13,240", "Active Mandates"], ["4,800+", "Strategic Acquirers"], ["125+", "Sectors Monitored"]].map((s) => (
            <div key={s[1]} className="bg-ink-900 p-3">
              <div className="font-serif text-base font-bold text-blue-300">{s[0]}</div>
              <div className="text-[9px] text-white/45">{s[1]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const DashboardMini: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-ink-900 p-4 text-white shadow-xl">
    <div className="flex items-center justify-between text-[10px] text-white/50">
      <span className="font-semibold uppercase tracking-[0.18em]">Acquisition Command Center</span>
      <span className="flex items-center gap-1.5"><span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" /> Live</span>
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2">
      {[["$2.7T", "Tracked value"], ["94.7%", "Model accuracy"], ["58,341", "Active buyers"]].map((s) => (
        <div key={s[1]} className="rounded-lg bg-white/5 p-2.5">
          <div className="font-serif text-sm font-bold text-blue-300">{s[0]}</div>
          <div className="text-[8.5px] text-white/45">{s[1]}</div>
        </div>
      ))}
    </div>
    {/* faux bar chart */}
    <div className="mt-3 flex h-24 items-end gap-1 rounded-lg bg-white/5 p-2">
      {[40, 62, 50, 78, 66, 88, 72, 95, 80, 70, 84, 60].map((h, i) => (
        <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-blue-700 to-blue-500" style={{ height: `${h}%` }} />
      ))}
    </div>
    <div className="mt-3 space-y-1.5">
      {[["Detected", "88", "60%"], ["In Progress", "17", "30%"], ["Resolved", "39", "55%"]].map((r) => (
        <div key={r[0]} className="flex items-center gap-2 text-[10px]">
          <span className="w-20 text-white/55">{r[0]}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-blue-500" style={{ width: r[2] }} />
          </div>
          <span className="font-mono text-white/70">{r[1]}</span>
        </div>
      ))}
    </div>
  </div>
);

const OfferTable: React.FC = () => (
  <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
    <table className="w-full text-left text-[12px]">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          {["", "Buyer A", "Buyer B", "Buyer C"].map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {[["Upfront Cash", "$110M", "$295M", "$271M"], ["Earnout", "$30M", "$50M", "$84M"], ["Total", "$140M", "$245M", "$355M"], ["Structure", "Cash", "Cash + Roll", "Cash"]].map((r, i) => (
          <tr key={r[0]} className={i === 2 ? "bg-blue-50/60 font-semibold" : ""}>
            <td className="px-4 py-2.5 text-slate-500">{r[0]}</td>
            <td className="px-4 py-2.5 text-ink-800">{r[1]}</td>
            <td className="px-4 py-2.5 text-ink-800">{r[2]}</td>
            <td className="px-4 py-2.5 text-ink-800">{r[3]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Vault: React.FC = () => (
  <svg viewBox="0 0 120 120" className="h-40 w-40">
    <defs>
      <linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#3a6fc4" /><stop offset="1" stopColor="#163a6e" />
      </linearGradient>
    </defs>
    <rect x="24" y="20" width="72" height="80" rx="6" fill="url(#vg)" stroke="#6ee7b7" strokeOpacity="0.4" />
    <rect x="24" y="20" width="72" height="80" rx="6" fill="none" stroke="#a7f3d0" strokeOpacity="0.25" />
    <circle cx="60" cy="60" r="18" fill="none" stroke="#6ee7b7" strokeWidth="2" />
    <path d="M52 60l5 5 11-11" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <g stroke="#a7f3d0" strokeOpacity="0.5" strokeWidth="1.5">
      <line x1="60" y1="38" x2="60" y2="44" /><line x1="60" y1="76" x2="60" y2="82" />
      <line x1="38" y1="60" x2="44" y2="60" /><line x1="76" y1="60" x2="82" y2="60" />
    </g>
  </svg>
);

const WorldDots: React.FC = () => {
  const dots = React.useMemo(() => {
    const out: { x: number; y: number; r: number }[] = [];
    for (let i = 0; i < 520; i++) {
      const x = Math.random() * 460 + 10, y = Math.random() * 240 + 10;
      // crude landmass weighting: denser in three horizontal bands
      const band = Math.abs(((y - 40) % 90) - 45) / 45;
      if (Math.random() > 0.35 + band * 0.4) out.push({ x, y, r: Math.random() < 0.12 ? 1.8 : 1 });
    }
    return out;
  }, []);
  return (
    <svg viewBox="0 0 480 260" className="w-full max-w-md">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#6ee7b7" opacity={d.r > 1.2 ? 0.9 : 0.4} />
      ))}
    </svg>
  );
};

// minimal inline glyph set (no icon dependency)
const Glyph: React.FC<{ name: string; small?: boolean }> = ({ name, small }) => {
  const s = small ? 14 : 18;
  const p: Record<string, React.ReactNode> = {
    chart: <><path d="M4 19V5M4 19h16M8 16v-4M12 16V9M16 16v-7" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M17 11a2.5 2.5 0 100-5M21 20c0-2.2-1.5-3.8-3.5-4.4" /></>,
    doc: <><path d="M7 3h7l4 4v14H7zM14 3v4h4M9 13h6M9 16h6" /></>,
    spark: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" /></>,
    check: <><circle cx="12" cy="12" r="8" /><path d="M9 12l2 2 4-4" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
    fire: <><path d="M12 3c1 3-2 4-2 7a4 4 0 008 0c0-4-3-5-3-8M12 21a5 5 0 01-3-9c0 4 3 4 3 7" /></>,
    shield: <><path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C9 19 5 15.6 5 11V5.5z" /></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {p[name] ?? p.doc}
    </svg>
  );
};

export default Landing;

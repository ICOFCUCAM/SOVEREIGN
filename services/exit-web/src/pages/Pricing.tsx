import React from "react";
import { useNavigate } from "react-router-dom";
import { BUYER_TIERS as BUYER } from "../lib/buyer-pricing";
import { MarketingChrome, Arrow, Chapter, Editorial, MK, PageHero } from "../components/MarketingChrome";
import { ENGINE_COUNTS } from "../lib/module-stats";

// Public pricing — an acquisition-exchange mandate ladder, not a SaaS plan
// grid. A founder selecting here is choosing a transaction engagement:
//   Listed Founder ($0, listed & discoverable) → Preparation ($995 one-time)
//   → Active Mandate ($995/mo + 2.5% success fee) → Institutional (custom).
// The free tier is a lead-generation engine: founders are listed, scored and
// receive buyer interest, but cannot engage buyers until they upgrade —
// which builds exchange liquidity and network effects.

interface Tier {
  readonly key: string;
  readonly badge: string;
  readonly name: string;
  readonly price: string;
  readonly priceSub: string;
  readonly purpose: string;
  readonly headline: string;
  readonly features: readonly string[];
  readonly restrictions?: readonly string[];
  readonly lockedTeaser?: string;
  readonly cta: string;
  readonly highlight?: boolean;
  readonly highlightLabel?: string;
  readonly tone?: "neutral" | "prep" | "mandate";
}

const FOUNDER_TIERS: readonly Tier[] = [
  {
    key: "listed", badge: "Free", name: "Listed Founder", price: "$0", priceSub: "per company listed",
    purpose: "Become visible to qualified acquirers",
    headline: "Enter the exchange. Get listed, scored and discovered by buyers — at no cost.",
    features: [
      "Company profile & anonymous marketplace listing — for every company you own",
      "Read-only valuation estimate & exit readiness score",
      "Buyer demand indicator & acquisition radar visibility",
      "Receive buyer interest & acquisition signals in your Inbox",
    ],
    restrictions: [
      "Cannot initiate outreach or contact buyers",
      "Cannot start an NDA process with buyers or see buyer identities",
      "Premium process tools need an engagement; responding to an NDA request and completing a transaction you are party to are free",
    ],
    lockedTeaser: "Buyers that match your company are shown once you list.",
    cta: "List my company free",
  },
  {
    key: "preparation", badge: "Preparation", name: "Preparation", price: "$995", priceSub: "one-time, per company",
    tone: "prep",
    purpose: "Prepare your company for market",
    headline: "Walk in ready. A transaction-ready acquisition package for one company, produced once and yours to keep.",
    features: [
      "Valuation framework — institutional EV & range with provenance",
      "CIM & teaser generation",
      "Buyer universe creation & data room",
      "Cap-table review & readiness engine",
      "Market positioning & exit-strategy planning",
    ],
    cta: "Prepare my company",
  },
  {
    key: "mandate", badge: "Active Mandate", name: "Active Mandate", price: "$995", priceSub: "/ mo per company on sale + 2.5% at close",
    tone: "mandate", highlight: true, highlightLabel: "Recommended for a live process",
    purpose: "Run a live acquisition process",
    headline: "The execution desk for one live sale. ExitOS earns the success fee only when that deal closes — our incentive is your outcome.",
    features: [
      "Buyer outreach drafts & NDA requests",
      "Buyer communication & acquisition intelligence",
      "Rule-based negotiation (Bid Room), bid & process management",
      "Due-diligence workflow & data room",
      "Closing Center checklist",
    ],
    cta: "Launch a mandate",
  },
  {
    key: "institutional", badge: "Institutional", name: "Institutional", price: "Custom", priceSub: "engagement + negotiated fee",
    purpose: "For material transactions — $25M+",
    headline: "White-glove execution for material exits — cross-border, private equity, family office and sovereign processes.",
    features: [
      "Dedicated managing director & deal team",
      "Custom buyer sourcing",
      "Legal & escrow coordination",
      "Portfolio sales — several companies sold together under one mandate",
      "White-glove execution & priority support",
      "Single-tenant deployment",
    ],
    cta: "Request a briefing",
  },
];

// How ExitOS gets paid — the engagement arc, above the cards.
const FLOW: readonly { readonly step: string; readonly label: string; readonly note: string }[] = [
  { step: "01", label: "Join the exchange", note: "List every company free. Get scored and discovered." },
  { step: "02", label: "Prepare the company", note: "$995 once per company. A market-ready package." },
  { step: "03", label: "Launch a mandate", note: "$995/mo for each company on sale." },
  { step: "04", label: "Exit successfully", note: "Close with the right buyer." },
  { step: "05", label: "Success fee aligns incentives", note: "2.5% of each sale at close — we win when you do." },
];

// Traditional banker vs ExitOS — the row that converts.
interface CompRow { readonly capability: string; readonly banker: string; readonly exitos: string }
const COMPARISON: readonly CompRow[] = [
  { capability: "Valuation", banker: "Yes", exitos: "Institutional, fully traceable" },
  { capability: "Buyer Discovery", banker: "Personal network", exitos: `${ENGINE_COUNTS.registryFirms}+ mandate Buyer Graph` },
  { capability: "Buyer Registry", banker: "Private rolodex", exitos: "Structured, source-referenced" },
  { capability: "CIM Production", banker: "2–4 weeks", exitos: "Generated in minutes" },
  { capability: "NDA Requests", banker: "Manual", exitos: "Request & register in one place" },
  { capability: "Acquisition Intelligence", banker: "No", exitos: "Intent & appetite signals" },
  { capability: "Negotiation Engine", banker: "No", exitos: "Rule-based scoring & counters" },
  { capability: "Buyer Signals", banker: "No", exitos: "Registry radar (snapshot)" },
  { capability: "Data Room", banker: "Third-party tool", exitos: "Built in" },
  { capability: "Success Fee", banker: "Typically 3–10% of deal", exitos: "2.5% (minimum $25,000), paid only on close" },
];

// Buyer tiers come from the shared source (lib/buyer-pricing, CC1); this page
// adds only its card presentation.
const BUYER_TIERS: readonly Tier[] = BUYER.map((b) => ({
  key: b.key, name: b.name, price: b.price, priceSub: b.priceSub, purpose: b.purpose, headline: b.headline, features: b.features,
  badge: b.key === "buyer-free" ? "Free" : b.key === "buyer-basic" ? "Buyer" : "Buyer Premium",
  cta: b.key === "buyer-free" ? "Start free" : b.key === "buyer-basic" ? "Activate buyer access" : "Request Premium access",
  ...(b.key === "buyer-premium" ? { tone: "mandate" as const, highlight: true, highlightLabel: "Active acquirer tier" } : {}),
}));

const Pricing: React.FC = () => {
  const nav = useNavigate();
  return (
    <MarketingChrome active="pricing">
      <PageHero chapter="Select a mandate" title="Priced like a bank. Success fee only when you close."
        deck={<>ExitOS is an acquisition exchange, not software. List for free and get discovered; prepare for a one-time fee;
          engage a mandate where <span className="font-semibold text-ink-800">ExitOS earns a success fee only when your
          deal closes.</span> Our incentive is your outcome.</>}
        actions={<>
          <button onClick={() => nav("/console")} className={`${MK.btn} bg-ink-900 text-white hover:bg-ink-800`}>List my company free <Arrow /></button>
          <a href="#compare" className={`${MK.btn} border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white`}>ExitOS vs a banker <span aria-hidden>↓</span></a>
        </>} />

      {/* How ExitOS gets paid */}
      <section className="border-b border-slate-200 bg-white">
        <div className={`${MK.wrap} py-12 lg:py-16`}>
          <Chapter n="02">How ExitOS gets paid</Chapter>
          <ol className="mt-6 grid gap-px border-y border-ink-900 bg-slate-200 sm:grid-cols-3 lg:grid-cols-5">
            {FLOW.map((f) => (
              <li key={f.step} className="bg-white py-5 sm:px-5">
                <div className="font-mono text-[11px] font-semibold tabular-nums tracking-widest text-[#7A6344]">{f.step}</div>
                <div className="mt-3 font-editorial text-[19px] font-semibold text-ink-900">{f.label}</div>
                <div className="mt-1 text-[12.5px] leading-relaxed text-slate-600">{f.note}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* founder ladder */}
      <section className="border-b border-slate-200 bg-[#F8F4EE]">
        <div className={`${MK.wrap} ${MK.section}`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n="03">The mandate ladder</Chapter>
            <div>
              <h2 className={`${MK.h2} text-ink-900`}><Editorial text="Four steps, from listed to closed." /></h2>
              <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-slate-600">One path — not a grid of plans to decode. Each step is the natural next move in a live process.</p>
            </div>
          </div>
          <div className="mt-12 grid gap-px border-y border-ink-900 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {FOUNDER_TIERS.map((t) => <TierCard key={t.key} tier={t} onAct={() => nav("/console")} />)}
          </div>
          <p className="mt-6 max-w-3xl text-[12.5px] text-slate-600">
            <span className="font-semibold text-ink-700">The success fee:</span> on an Active Mandate, ExitOS earns 2.5% of
            headline value at close, per company sold (minimum $25,000 per transaction). Traditional bank fees typically run
            3–10%; on a smaller sale the minimum and the monthly fee weigh more, so compare the total for your deal. We are not
            paid a success fee unless you are.
          </p>
        </div>
      </section>

      <PortfolioSection />

      {/* comparison */}
      <section id="compare" className="scroll-mt-24 border-b border-slate-200 bg-white">
        <div className={`${MK.wrap} ${MK.section}`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n="05">Traditional banker vs ExitOS</Chapter>
            <div>
              <h2 className={`${MK.h2} text-ink-900`}><Editorial text="The same engagement. A different machine." /></h2>
              <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-slate-600">A banker brings a rolodex and a deck. ExitOS brings a Buyer Graph, a traceable valuation framework and an execution desk — with the success fee paid only on close.</p>
            </div>
          </div>
          <div role="region" aria-label="Traditional banker compared with ExitOS" tabIndex={0} className="mt-12 overflow-x-auto border-y border-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:ml-[calc(27.5%+3vw)]">
            <table className="w-full min-w-[560px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-slate-200 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <th scope="col" className="py-3.5 pr-4">Capability</th>
                  <th scope="col" className="px-4 py-3.5">Traditional banker</th>
                  <th scope="col" className="bg-ink-900 px-4 py-3.5 text-white">ExitOS</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r) => (
                  <tr key={r.capability} className="border-t border-slate-200">
                    <th scope="row" className="py-3.5 pr-4 font-editorial text-[16px] font-semibold text-ink-900">{r.capability}</th>
                    <td className="px-4 py-3.5 text-slate-600">{r.banker}</td>
                    <td className="bg-[#F5F1E9]/40 px-4 py-3.5 font-semibold text-[#6A5539]"><span className="mr-1.5 text-[#7A6344]" aria-hidden>✓</span>{r.exitos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* buyer side */}
      <section className="border-b border-slate-200 bg-[#F8F4EE]">
        <div className={`${MK.wrap} ${MK.section}`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-amber-700">06 / The other side of the exchange</div>
            <div>
              <h2 className={`${MK.h2} text-ink-900`}><Editorial text="Buyer access. Premium matching." /></h2>
              <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-slate-600">Browsing is free. Buyer Access adds NDA-gated diligence and the deal room; Premium adds matched introductions before a company lists publicly, admitted by request. One subscription covers every company you pursue; each acquisition keeps its own deal room and transaction record.</p>
            </div>
          </div>
          <div className="mt-12 grid gap-px border-y border-ink-900 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {BUYER_TIERS.map((t) => <TierCard key={t.key} tier={t} onAct={() => nav("/console")} />)}
          </div>
        </div>
      </section>

      {/* closing CTA */}
      <section className="bg-white">
        <div className={`${MK.wrap} ${MK.section}`}>
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <Chapter n="07">The next move</Chapter>
              <h2 className={`${MK.h2} mt-5 text-ink-900`}><Editorial text="List free. Engage a mandate when you're ready to sell." /></h2>
              <p className="mt-6 text-[15px] text-slate-600">No card to enter the exchange. No success fee until your deal closes.</p>
            </div>
            <div className="flex flex-wrap gap-2.5 lg:flex-col lg:items-stretch">
              <button onClick={() => nav("/console")} className={`${MK.btn} justify-between bg-ink-900 text-white hover:bg-ink-800`}>Launch ExitOS <Arrow /></button>
              <button onClick={() => nav("/platform")} className={`${MK.btn} justify-between border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white`}>Explore the platform <span aria-hidden>↗</span></button>
            </div>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
};

// One account, several companies: what is free, what is engaged per company, and worked examples.
const PORTFOLIO_RULES: readonly { readonly what: string; readonly rule: string }[] = [
  { what: "Your account", rule: "One login and one portfolio for every company or product you own. Free." },
  { what: "Listing", rule: "Free for each company, subject to identity verification and the exchange rules." },
  { what: "Preparation", rule: "$995 once for each company prepared. Its package stays yours; you do not pay again if a sale pauses." },
  { what: "Active Mandate", rule: "$995 a month for each company on sale, from launch until that sale closes or you withdraw it." },
  { what: "Success fee", rule: "2.5% of each sale at close, minimum $25,000 per transaction." },
  { what: "Selling several together", rule: "Companies sold together to one buyer run as one negotiated portfolio mandate (Institutional), with one success fee." },
];
const EXAMPLES: readonly { readonly owns: number; readonly prepared: number; readonly onSale: number }[] = [
  { owns: 1, prepared: 1, onSale: 1 },
  { owns: 3, prepared: 1, onSale: 1 },
  { owns: 3, prepared: 2, onSale: 1 },
  { owns: 5, prepared: 2, onSale: 2 },
];
const usd = (n: number): string => `$${n.toLocaleString("en-US")}`;

const PortfolioSection: React.FC = () => (
  <section aria-labelledby="portfolio-h" className="border-b border-slate-200 bg-white">
    <div className={`${MK.wrap} ${MK.section}`}>
      <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
        <Chapter n="04">More than one company</Chapter>
        <div>
          <h2 id="portfolio-h" className={`${MK.h2} text-ink-900`}><Editorial text="One account. Multiple companies. Separate mandates." /></h2>
          <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-slate-600">Add as many companies or products as you own, each kept separately. Pay only for the companies you prepare and the sales you run — adding a company never starts a charge.</p>
        </div>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-10 lg:ml-[calc(27.5%+3vw)] lg:grid-cols-2 [&>*]:min-w-0">
        <dl className="divide-y divide-slate-200 border-y border-ink-900">
          {PORTFOLIO_RULES.map((r) => (
            <div key={r.what} className="py-3.5">
              <dt className="font-editorial text-[16px] font-semibold text-ink-900">{r.what}</dt>
              <dd className="mt-0.5 text-[13px] leading-relaxed text-slate-600">{r.rule}</dd>
            </div>
          ))}
        </dl>
        <div>
          <div role="region" aria-label="What several companies cost" tabIndex={0} className="overflow-x-auto border-y border-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <table className="w-full min-w-[420px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  <th scope="col" className="py-3 pr-3">Companies listed</th>
                  <th scope="col" className="px-3 py-3">Prepared</th>
                  <th scope="col" className="px-3 py-3">On sale</th>
                  <th scope="col" className="px-3 py-3 text-right">One-time</th>
                  <th scope="col" className="py-3 pl-3 text-right">Monthly</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {EXAMPLES.map((e) => (
                  <tr key={`${e.owns}-${e.prepared}-${e.onSale}`} className="border-t border-slate-200">
                    <th scope="row" className="py-3 pr-3 font-semibold text-ink-900">{e.owns} <span className="font-normal text-slate-500">· free</span></th>
                    <td className="px-3 py-3 text-slate-700">{e.prepared}</td>
                    <td className="px-3 py-3 text-slate-700">{e.onSale}</td>
                    <td className="px-3 py-3 text-right text-slate-700">{usd(e.prepared * 995)}</td>
                    <td className="py-3 pl-3 text-right font-semibold text-[#6A5539]">{usd(e.onSale * 995)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-slate-600">Examples only. Monthly amounts are for the companies on sale at the same time, before success fees. A company you are not selling stays listed at no charge.</p>
        </div>
      </div>
    </div>
  </section>
);

const TONE: Record<NonNullable<Tier["tone"]>, { top: string; accent: string; dot: string; btn: string; badge: string }> = {
  neutral: { top: "border-t-transparent", accent: "text-slate-600", dot: "bg-slate-400", btn: "border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white", badge: "text-slate-600" },
  prep:    { top: "border-t-transparent", accent: "text-ink-700", dot: "bg-ink-600", btn: "bg-ink-900 text-white hover:bg-ink-800", badge: "text-ink-600" },
  mandate: { top: "border-t-[#9A7E56]", accent: "text-[#7A6344]", dot: "bg-[#B49A75]", btn: "bg-ink-900 text-white hover:bg-ink-800", badge: "text-[#7A6344]" },
};

const TierCard: React.FC<{ tier: Tier; onAct: () => void }> = ({ tier, onAct }) => {
  const t = TONE[tier.tone ?? "neutral"];
  return (
    <div className={`flex flex-col border-t-4 bg-white p-5 sm:p-6 ${t.top}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${t.badge}`}>{tier.badge}</span>
        {tier.highlight && tier.highlightLabel && <span className="bg-[#6A5539] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white">{tier.highlightLabel}</span>}
      </div>
      <h3 className="mt-4 font-editorial text-[24px] font-semibold text-ink-900">{tier.name}</h3>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-editorial text-[2.4rem] font-semibold leading-none tabular-nums text-ink-900">{tier.price}</span>
        <span className="text-[11px] text-slate-600">{tier.priceSub}</span>
      </div>
      <div className="mt-3 text-[12px] font-semibold text-slate-700">{tier.purpose}</div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{tier.headline}</p>
      <ul className="mt-4 flex-1 space-y-2 border-t border-slate-200 pt-4 text-[12.5px] text-slate-700">
        {tier.features.map((f) => (
          <li key={f} className="flex items-baseline gap-2">
            <span className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 ${t.dot}`} /> {f}
          </li>
        ))}
      </ul>
      {tier.restrictions && (
        <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-[11.5px] text-slate-600">
          {tier.restrictions.map((r) => (
            <li key={r} className="flex items-baseline gap-2"><span className="mt-0.5 shrink-0">→</span> {r}</li>
          ))}
        </ul>
      )}
      {tier.lockedTeaser && (
        <div className="mt-3 border-l-2 border-[#9A7E56] bg-[#F5F1E9]/60 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6A5539]">
            <span aria-hidden>🔒</span> {tier.lockedTeaser}
          </div>
          <div className="mt-0.5 text-[10.5px] text-[#6A5539]">Upgrade required to unlock buyer identities and engage.</div>
        </div>
      )}
      <button onClick={onAct} className={`mt-5 w-full px-4 py-3 text-[12.5px] font-semibold transition ${t.btn}`}>
        {tier.cta}
      </button>
    </div>
  );
};

export default Pricing;

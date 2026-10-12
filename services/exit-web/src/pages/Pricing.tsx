import React from "react";
import { useNavigate } from "react-router-dom";
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
  readonly tone?: "neutral" | "prep" | "mandate";
}

const FOUNDER_TIERS: readonly Tier[] = [
  {
    key: "listed", badge: "Free", name: "Listed Founder", price: "$0", priceSub: "to enter the exchange",
    purpose: "Become visible to qualified acquirers",
    headline: "Enter the exchange. Get listed, scored and discovered by buyers — at no cost.",
    features: [
      "Company profile & anonymous marketplace listing",
      "Read-only valuation estimate & exit readiness score",
      "Buyer demand indicator & acquisition radar visibility",
      "Receive buyer interest, acquisition signals & mandate alerts",
    ],
    restrictions: [
      "Cannot initiate outreach or contact buyers",
      "Cannot open an NDA process or see buyer identities",
      "Cannot launch a transaction — upgrade to engage",
    ],
    lockedTeaser: "4 buyers are a strong acquisition match for your company.",
    cta: "List my company free",
  },
  {
    key: "preparation", badge: "Preparation", name: "Preparation", price: "$995", priceSub: "one-time",
    tone: "prep",
    purpose: "Prepare your company for market",
    headline: "Walk in ready. A transaction-ready acquisition package, produced once and yours to keep.",
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
    key: "mandate", badge: "Most selected", name: "Active Mandate", price: "$995", priceSub: "/ mo + 2.5% success fee",
    tone: "mandate", highlight: true,
    purpose: "Run a live acquisition process",
    headline: "The execution desk. ExitOS earns the success fee only when your deal closes — our incentive is your outcome.",
    features: [
      "Buyer outreach & NDA automation",
      "Buyer communication & acquisition intelligence",
      "AI negotiation, bid management & process management",
      "Due-diligence workflow & data room",
      "Closing Center — cap-table-aware net-to-founder math",
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
      "White-glove execution & priority support",
      "Single-tenant deployment",
    ],
    cta: "Request a briefing",
  },
];

// How ExitOS gets paid — the engagement arc, above the cards.
const FLOW: readonly { readonly step: string; readonly label: string; readonly note: string }[] = [
  { step: "01", label: "Join the exchange", note: "List free. Get scored and discovered." },
  { step: "02", label: "Prepare the company", note: "$995 one-time. A market-ready package." },
  { step: "03", label: "Launch a mandate", note: "$995/mo. Run a live process." },
  { step: "04", label: "Exit successfully", note: "Close with the right buyer." },
  { step: "05", label: "Success fee aligns incentives", note: "2.5% at close — we win when you do." },
];

// Traditional banker vs ExitOS — the row that converts.
interface CompRow { readonly capability: string; readonly banker: string; readonly exitos: string }
const COMPARISON: readonly CompRow[] = [
  { capability: "Valuation", banker: "Yes", exitos: "Institutional, fully traceable" },
  { capability: "Buyer Discovery", banker: "Personal network", exitos: `${ENGINE_COUNTS.registryFirms}+ mandate Buyer Graph` },
  { capability: "Buyer Registry", banker: "Private rolodex", exitos: "Structured, source-referenced" },
  { capability: "CIM Production", banker: "2–4 weeks", exitos: "Generated in minutes" },
  { capability: "NDA Automation", banker: "Manual", exitos: "Automated" },
  { capability: "Acquisition Intelligence", banker: "No", exitos: "Intent & appetite signals" },
  { capability: "Negotiation Engine", banker: "No", exitos: "AI scoring & counters" },
  { capability: "Real-Time Buyer Signals", banker: "No", exitos: "Live radar" },
  { capability: "Data Room", banker: "Third-party tool", exitos: "Built in" },
  { capability: "Success Fee", banker: "3–10% of deal", exitos: "2.5%, paid only on close" },
];

const BUYER_TIERS: readonly Tier[] = [
  {
    key: "buyer-free", badge: "Free", name: "Buyer Observer", price: "$0", priceSub: "to browse",
    purpose: "Browse the exchange",
    headline: "Browse anonymized opportunities. Upgrade to engage.",
    features: ["Browse anonymized opportunities", "Acquisition radar (view)", "No NDA requests or deal-room access"],
    cta: "Start free",
  },
  {
    key: "buyer-basic", badge: "Buyer", name: "Buyer Access", price: "$299", priceSub: "/ month",
    purpose: "Engage on diligence",
    headline: "Browse anonymized listings. Request NDA-gated diligence.",
    features: ["Search and filter the exchange", "View anonymized listing detail", "Request NDA to unlock identity & packages", "Up to 10 active inquiries"],
    cta: "Activate buyer access",
  },
  {
    key: "buyer-premium", badge: "Buyer Premium", name: "Premium Buyer Access", price: "$2,499", priceSub: "/ month",
    tone: "mandate", highlight: true,
    purpose: "First look + outbound",
    headline: "Active acquirer tier. Matched introductions before public listing.",
    features: ["Everything in Buyer Access", "Outbound matched introductions before public listing", "Priority NDA processing", "Saved searches + matching alerts", "Quarterly market briefings", "Dedicated buyer-relationship lead"],
    cta: "Activate Premium",
  },
];

const Pricing: React.FC = () => {
  const nav = useNavigate();
  return (
    <MarketingChrome active="pricing">
      <PageHero chapter="Select a mandate" title="Priced like a bank. Paid when you close."
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
                <div className="font-mono text-[11px] font-semibold tabular-nums tracking-widest text-blue-600">{f.step}</div>
                <div className="mt-3 font-editorial text-[19px] font-semibold text-ink-900">{f.label}</div>
                <div className="mt-1 text-[12.5px] leading-relaxed text-slate-500">{f.note}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* founder ladder */}
      <section className="border-b border-slate-200 bg-[#f6f8fb]">
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
          <p className="mt-6 max-w-3xl text-[12.5px] text-slate-500">
            <span className="font-semibold text-ink-700">The success fee:</span> on an Active Mandate, ExitOS earns 2.5% of
            headline value at close (minimum $25,000) — against the 3–10% a traditional bank charges. You keep more of your
            own exit, and we are not paid unless you are.
          </p>
        </div>
      </section>

      {/* comparison */}
      <section id="compare" className="scroll-mt-24 border-b border-slate-200 bg-white">
        <div className={`${MK.wrap} ${MK.section}`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <Chapter n="04">Traditional banker vs ExitOS</Chapter>
            <div>
              <h2 className={`${MK.h2} text-ink-900`}><Editorial text="The same engagement. A different machine." /></h2>
              <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-slate-600">A banker brings a rolodex and a deck. ExitOS brings a Buyer Graph, a traceable valuation framework and an execution desk that runs around the clock — at a fraction of the fee.</p>
            </div>
          </div>
          <div className="mt-12 overflow-x-auto border-y border-ink-900 lg:ml-[calc(27.5%+3vw)]">
            <table className="w-full min-w-[560px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-slate-200 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <th scope="col" className="py-3.5 pr-4">Capability</th>
                  <th scope="col" className="px-4 py-3.5">Traditional banker</th>
                  <th scope="col" className="bg-ink-900 px-4 py-3.5 text-white">ExitOS</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r) => (
                  <tr key={r.capability} className="border-t border-slate-200">
                    <th scope="row" className="py-3.5 pr-4 font-editorial text-[16px] font-semibold text-ink-900">{r.capability}</th>
                    <td className="px-4 py-3.5 text-slate-500">{r.banker}</td>
                    <td className="bg-blue-50/40 px-4 py-3.5 font-semibold text-blue-700"><span className="mr-1.5 text-blue-600" aria-hidden>✓</span>{r.exitos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* buyer side */}
      <section className="border-b border-slate-200 bg-[#f6f8fb]">
        <div className={`${MK.wrap} ${MK.section}`}>
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:gap-[6vw]">
            <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-amber-600">05 / The other side of the exchange</div>
            <div>
              <h2 className={`${MK.h2} text-ink-900`}><Editorial text="Buyer access. Premium matching." /></h2>
              <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-slate-600">Buyers subscribe for browse + NDA-gated diligence; premium adds outbound matched introductions before a company lists publicly.</p>
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
              <Chapter n="06">The next move</Chapter>
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

const TONE: Record<NonNullable<Tier["tone"]>, { top: string; accent: string; dot: string; btn: string; badge: string }> = {
  neutral: { top: "border-t-transparent", accent: "text-slate-400", dot: "bg-slate-300", btn: "border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white", badge: "text-slate-400" },
  prep:    { top: "border-t-transparent", accent: "text-ink-700", dot: "bg-ink-600", btn: "bg-ink-900 text-white hover:bg-ink-800", badge: "text-ink-600" },
  mandate: { top: "border-t-blue-600", accent: "text-blue-600", dot: "bg-blue-500", btn: "bg-ink-900 text-white hover:bg-ink-800", badge: "text-blue-600" },
};

const TierCard: React.FC<{ tier: Tier; onAct: () => void }> = ({ tier, onAct }) => {
  const t = TONE[tier.tone ?? "neutral"];
  return (
    <div className={`flex flex-col border-t-4 bg-white p-5 sm:p-6 ${t.top}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${t.badge}`}>{tier.badge}</span>
        {tier.highlight && <span className="bg-blue-600 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white">Most selected</span>}
      </div>
      <h3 className="mt-4 font-editorial text-[24px] font-semibold text-ink-900">{tier.name}</h3>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-editorial text-[2.4rem] font-semibold leading-none tabular-nums text-ink-900">{tier.price}</span>
        <span className="text-[11px] text-slate-500">{tier.priceSub}</span>
      </div>
      <div className="mt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{tier.purpose}</div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{tier.headline}</p>
      <ul className="mt-4 flex-1 space-y-2 border-t border-slate-200 pt-4 text-[12.5px] text-slate-700">
        {tier.features.map((f) => (
          <li key={f} className="flex items-baseline gap-2">
            <span className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 ${t.dot}`} /> {f}
          </li>
        ))}
      </ul>
      {tier.restrictions && (
        <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-[11.5px] text-slate-400">
          {tier.restrictions.map((r) => (
            <li key={r} className="flex items-baseline gap-2"><span className="mt-0.5 shrink-0">→</span> {r}</li>
          ))}
        </ul>
      )}
      {tier.lockedTeaser && (
        <div className="mt-3 border-l-2 border-blue-600 bg-blue-50/60 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
            <span aria-hidden>🔒</span> {tier.lockedTeaser}
          </div>
          <div className="mt-0.5 text-[10.5px] text-blue-600/80">Upgrade required to unlock buyer identities and engage.</div>
        </div>
      )}
      <button onClick={onAct} className={`mt-5 w-full px-4 py-3 text-[12.5px] font-semibold transition ${t.btn}`}>
        {tier.cta}
      </button>
    </div>
  );
};

export default Pricing;

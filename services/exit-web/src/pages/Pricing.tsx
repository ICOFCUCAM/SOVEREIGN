import React from "react";
import { useNavigate } from "react-router-dom";
import { MarketingChrome, Arrow } from "../components/MarketingChrome";
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
      {/* hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1100px] px-6 py-20 text-center lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">Select a mandate</div>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.07] tracking-tight text-ink-900 sm:text-5xl">
            Priced like a bank. Paid when you close.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            ExitOS is an acquisition exchange, not software. List for free and get discovered; prepare for a one-time fee;
            engage a mandate where <span className="font-semibold text-ink-800">ExitOS earns a success fee only when your
            deal closes.</span> Our incentive is your outcome.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-ink-800">List my company free <Arrow /></button>
            <a href="#compare" className="inline-flex items-center rounded-md border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-ink-900 transition hover:bg-slate-50">ExitOS vs a banker</a>
          </div>
        </div>
      </section>

      {/* How ExitOS gets paid */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1320px] px-6 py-14 lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">How ExitOS gets paid</div>
          <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3 lg:grid-cols-5">
            {FLOW.map((f) => (
              <div key={f.step} className="bg-white p-5">
                <div className="font-mono text-[11px] font-semibold tabular-nums tracking-widest text-blue-600">{f.step}</div>
                <div className="mt-2 font-serif text-[15px] font-bold text-ink-900">{f.label}</div>
                <div className="mt-1 text-[12px] leading-relaxed text-slate-500">{f.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* founder ladder */}
      <section className="border-b border-slate-200 bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">The mandate ladder</div>
          <h2 className="mt-2 font-serif text-[2rem] font-bold tracking-tight text-ink-900">Four steps, from listed to closed.</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-600">One path — not a grid of plans to decode. Each step is the natural next move in a live process.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FOUNDER_TIERS.map((t) => <TierCard key={t.key} tier={t} onAct={() => nav("/console")} />)}
          </div>
          <p className="mt-6 text-[12.5px] text-slate-500">
            <span className="font-semibold text-ink-700">The success fee:</span> on an Active Mandate, ExitOS earns 2.5% of
            headline value at close (minimum $25,000) — against the 3–10% a traditional bank charges. You keep more of your
            own exit, and we are not paid unless you are.
          </p>
        </div>
      </section>

      {/* comparison */}
      <section id="compare" className="border-b border-slate-200 bg-white scroll-mt-24">
        <div className="mx-auto max-w-[1000px] px-6 py-16 lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">Traditional banker vs ExitOS</div>
          <h2 className="mt-2 font-serif text-[2rem] font-bold tracking-tight text-ink-900">The same engagement. A different machine.</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-600">A banker brings a rolodex and a deck. ExitOS brings a Buyer Graph, a traceable valuation framework and an execution desk that runs around the clock — at a fraction of the fee.</p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="bg-[#f6f8fb] text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-5 py-3.5">Capability</th>
                  <th className="px-5 py-3.5">Traditional banker</th>
                  <th className="px-5 py-3.5 text-blue-700">ExitOS</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r) => (
                  <tr key={r.capability} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium text-ink-900">{r.capability}</td>
                    <td className="px-5 py-3 text-slate-500">{r.banker}</td>
                    <td className="px-5 py-3 font-semibold text-blue-700"><span className="mr-1.5 text-blue-500">✓</span>{r.exitos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* buyer side */}
      <section className="border-b border-slate-200 bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-600">The other side of the exchange</div>
          <h2 className="mt-2 font-serif text-[2rem] font-bold tracking-tight text-ink-900">Buyer access. Premium matching.</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-600">Buyers subscribe for browse + NDA-gated diligence; premium adds outbound matched introductions before a company lists publicly.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BUYER_TIERS.map((t) => <TierCard key={t.key} tier={t} onAct={() => nav("/console")} />)}
          </div>
        </div>
      </section>

      {/* closing CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 text-center lg:px-10">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-ink-900">List free. Engage a mandate when you're ready to sell.</h2>
          <p className="mt-3 text-[15px] text-slate-600">No card to enter the exchange. No success fee until your deal closes.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-ink-800">Launch ExitOS <Arrow /></button>
            <button onClick={() => nav("/platform")} className="inline-flex items-center rounded-md border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-ink-900 transition hover:bg-slate-50">Explore the platform</button>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
};

const TONE: Record<NonNullable<Tier["tone"]>, { ring: string; accent: string; dot: string; btn: string; badge: string }> = {
  neutral: { ring: "border-slate-200", accent: "text-slate-400", dot: "bg-slate-300", btn: "border border-slate-300 text-ink-900 hover:bg-slate-50", badge: "text-slate-400" },
  prep:    { ring: "border-slate-300", accent: "text-ink-700", dot: "bg-ink-400", btn: "bg-ink-900 text-white hover:bg-ink-800", badge: "text-ink-600" },
  mandate: { ring: "border-blue-300 ring-2 ring-blue-500", accent: "text-blue-600", dot: "bg-blue-500", btn: "bg-ink-900 text-white hover:bg-ink-800", badge: "text-blue-600" },
};

const TierCard: React.FC<{ tier: Tier; onAct: () => void }> = ({ tier, onAct }) => {
  const t = TONE[tier.tone ?? "neutral"];
  return (
    <div className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${t.ring}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${t.badge}`}>{tier.badge}</span>
        {tier.highlight && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Most selected</span>}
      </div>
      <h3 className="mt-3 font-serif text-lg font-bold text-ink-900">{tier.name}</h3>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-serif text-3xl font-bold tabular-nums text-ink-900">{tier.price}</span>
        <span className="text-[11px] text-slate-500">{tier.priceSub}</span>
      </div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{tier.purpose}</div>
      <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{tier.headline}</p>
      <ul className="mt-4 flex-1 space-y-2 text-[12.5px] text-slate-700">
        {tier.features.map((f) => (
          <li key={f} className="flex items-baseline gap-2">
            <span className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} /> {f}
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
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
            <span aria-hidden>🔒</span> {tier.lockedTeaser}
          </div>
          <div className="mt-0.5 text-[10.5px] text-blue-600/80">Upgrade required to unlock buyer identities and engage.</div>
        </div>
      )}
      <button onClick={onAct} className={`mt-5 w-full rounded-md px-4 py-2.5 text-[12.5px] font-semibold transition ${t.btn}`}>
        {tier.cta}
      </button>
    </div>
  );
};

export default Pricing;

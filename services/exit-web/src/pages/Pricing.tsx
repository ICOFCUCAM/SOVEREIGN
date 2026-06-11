import React from "react";
import { useNavigate } from "react-router-dom";
import { MarketingChrome, Arrow } from "../components/MarketingChrome";
import { ENGINE_COUNTS } from "../lib/module-stats";

// Public pricing — one professional, light page (home-page palette). The
// founder ladder runs Free → Starter ($99) → Prep ($499) → Pro ($1,499) →
// Institutional. Starter is the on-ramp: upload, get valued, get listed and
// let Autonomous Exit run until buyers are found — then upgrade to engage.
// Buyers pay on the other side of the marketplace.

interface Tier {
  readonly key: string;
  readonly badge: string;
  readonly name: string;
  readonly price: string;
  readonly priceSub: string;
  readonly headline: string;
  readonly features: readonly string[];
  readonly cta: string;
  readonly highlight?: boolean;
  readonly tone?: "neutral" | "starter" | "pro";
}

const FOUNDER_TIERS: readonly Tier[] = [
  {
    key: "free", badge: "Free", name: "Founder Free", price: "$0", priceSub: "forever",
    headline: "Watch your position and the market. Read-only — upgrade to act.",
    features: [
      "Founder Dashboard & Exit Readiness Score",
      "Valuation & Cap Table (view)",
      "Marketplace & Acquisition Radar (browse)",
      "Pipeline (view)",
    ],
    cta: "Start free",
  },
  {
    key: "starter", badge: "Get discovered", name: "Founder Starter", price: "$99", priceSub: "/ month",
    headline: "Upload, get valued, and get discovered by buyers. Upgrade when they engage.",
    tone: "starter",
    features: [
      "Everything in Free",
      "Upload documents → AI Diligence & Data Room",
      "Full Valuation & Exit Readiness reports",
      "Generate the anonymized teaser & list the company",
      "Buyer Intelligence — matched acquirers discover you",
      "Autonomous Exit runs up to “buyers found”",
    ],
    cta: "Start with Starter",
  },
  {
    key: "prep", badge: "Preparation", name: "Founder Prep", price: "$499", priceSub: "/ month · billed annually",
    headline: "Get fully acquisition-ready before you run a process.",
    features: [
      "Everything in Starter",
      "Acquisition Memorandum Generator — CIM, deck, teaser, DD index",
      `Due Diligence Engine — ${ENGINE_COUNTS.diligencePackages} standard packages with artifact lists`,
      `Buyer Discovery — ${ENGINE_COUNTS.registryFirms}-firm curated registry`,
      "Virtual Data Room (up to 50GB)",
      "Single workspace, single deal",
    ],
    cta: "Start Prep",
  },
  {
    key: "pro", badge: "Active deal", name: "Founder Pro", price: "$1,499", priceSub: "/ month + 1% success fee",
    headline: "The full transaction desk — communicate, negotiate and close.",
    tone: "pro", highlight: true,
    features: [
      "Everything in Founder Prep",
      "Chief Investment Banker + The Banker outreach",
      "NDA, Live Deal Room & buyer communication",
      "AI Deal Negotiator — scoring, counters, leverage analytics",
      "Cap-table-aware net-to-founder math + Closing Center",
      "WealthOS · up to 3 workspaces; 500GB storage",
    ],
    cta: "Start Pro",
  },
  {
    key: "institutional", badge: "Institutional", name: "ExitOS Institutional", price: "Custom", priceSub: "engagement + success fee",
    headline: "Full white-glove deal execution for material exits in flight.",
    features: [
      "Everything in Founder Pro",
      "Banker-quality CIM via Claude with editorial review",
      "Dedicated managing-director relationship",
      "Counsel + escrow + closing orchestration",
      "Single-tenant deployment available",
      "Negotiated success-fee schedule",
    ],
    cta: "Request a briefing",
  },
];

const BUYER_TIERS: readonly Tier[] = [
  {
    key: "buyer-free", badge: "Free", name: "Buyer Free", price: "$0", priceSub: "forever",
    headline: "Browse the marketplace. Upgrade to engage.",
    features: ["Browse anonymized opportunities", "Acquisition Radar (view)", "No NDA requests or deal-room access"],
    cta: "Start free",
  },
  {
    key: "buyer-basic", badge: "Buyer", name: "Buyer Access", price: "$299", priceSub: "/ month",
    headline: "Browse anonymized listings. Request NDA-gated diligence.",
    features: ["Search and filter the marketplace", "View anonymized listing detail", "Request NDA to unlock identity & packages", "Up to 10 active inquiries"],
    cta: "Activate buyer access",
  },
  {
    key: "buyer-premium", badge: "Buyer Premium", name: "Premium Buyer Access", price: "$2,499", priceSub: "/ month",
    headline: "Active acquirer tier. Outbound matched introductions + priority access.",
    tone: "pro", highlight: true,
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
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">Pricing</div>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.07] tracking-tight text-ink-900 sm:text-5xl">
            Built for the moment a founder decides to sell.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Start free, get <span className="font-semibold text-ink-800">listed and discovered for $99</span>, and step up to the
            full desk when buyers engage. Buyers pay separately on the other side of the marketplace.
          </p>
        </div>
      </section>

      {/* founder tiers */}
      <section className="border-b border-slate-200 bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">Founder side</div>
          <h2 className="mt-2 font-serif text-[2rem] font-bold tracking-tight text-ink-900">From free to institutional.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FOUNDER_TIERS.map((t) => <TierCard key={t.key} tier={t} onAct={() => nav("/console")} />)}
          </div>
          <p className="mt-6 text-[12.5px] text-slate-500">
            <span className="font-semibold text-ink-700">How Starter works:</span> upload your documents and ExitOS values,
            prepares and lists the company. The Autonomous Exit agent runs the process and stops the moment buyers are
            found — then you upgrade to Pro to open conversations and close.
          </p>
        </div>
      </section>

      {/* buyer tiers */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-600">Buyer side</div>
          <h2 className="mt-2 font-serif text-[2rem] font-bold tracking-tight text-ink-900">Buyer access. Premium matching.</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-600">The other side of the marketplace. Buyers subscribe for browse + NDA-gated diligence; premium adds outbound matched introductions before public listing.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BUYER_TIERS.map((t) => <TierCard key={t.key} tier={t} onAct={() => nav("/console")} />)}
          </div>
        </div>
      </section>

      {/* economics */}
      <section className="bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1320px] px-6 py-16 lg:px-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-600">Marketplace economics</div>
            <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-ink-900">How ExitOS makes money.</h2>
            <div className="mt-6 grid gap-8 text-[14px] sm:grid-cols-3">
              <Econ heading="Founder subscriptions" body="$99 Starter lists and gets you discovered. $499 Prep adds the full document & diligence suite. $1,499 Pro runs the live deal. Institutional is bespoke." />
              <Econ heading="Success fees on closed deals" body="1% success fee on Pro-tier closes. Institutional negotiates a custom schedule (typically 0.5–1.5% of headline price)." />
              <Econ heading="Premium buyer access" body="Buyers pay $299–$2,499/month. Premium gets first-look on listings + matched outbound introductions before public publishing." />
            </div>
          </div>

          {/* closing CTA */}
          <div className="mt-12 text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-ink-900">Get listed for $99. Move to Pro when buyers engage.</h2>
            <p className="mt-3 text-[15px] text-slate-600">Cancel anytime. No success fee until you close on Pro.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-ink-800">Launch ExitOS <Arrow /></button>
              <button onClick={() => nav("/platform")} className="inline-flex items-center rounded-md border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-ink-900 transition hover:bg-slate-50">Explore the platform</button>
            </div>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
};

const TONE_RING: Record<NonNullable<Tier["tone"]>, string> = {
  neutral: "border-slate-200",
  starter: "border-amber-300 ring-1 ring-amber-200",
  pro: "border-blue-300 ring-2 ring-blue-500",
};

const TierCard: React.FC<{ tier: Tier; onAct: () => void }> = ({ tier, onAct }) => {
  const tone = tier.tone ?? "neutral";
  return (
    <div className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${TONE_RING[tone]}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${tone === "pro" ? "text-blue-600" : tone === "starter" ? "text-amber-600" : "text-slate-400"}`}>{tier.badge}</span>
        {tier.highlight && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Recommended</span>}
        {tone === "starter" && !tier.highlight && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">New</span>}
      </div>
      <h3 className="mt-3 font-serif text-lg font-bold text-ink-900">{tier.name}</h3>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-serif text-3xl font-bold text-ink-900">{tier.price}</span>
        <span className="text-[11px] text-slate-500">{tier.priceSub}</span>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{tier.headline}</p>
      <ul className="mt-4 flex-1 space-y-2 text-[12.5px] text-slate-700">
        {tier.features.map((f) => (
          <li key={f} className="flex items-baseline gap-2">
            <span className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${tone === "pro" ? "bg-blue-500" : tone === "starter" ? "bg-amber-500" : "bg-slate-300"}`} /> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onAct}
        className={`mt-5 w-full rounded-md px-4 py-2.5 text-[12.5px] font-semibold transition ${
          tone === "pro"
            ? "bg-ink-900 text-white hover:bg-ink-800"
            : tone === "starter"
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "border border-slate-300 text-ink-900 hover:bg-slate-50"
        }`}
      >
        {tier.cta}
      </button>
    </div>
  );
};

const Econ: React.FC<{ heading: string; body: string }> = ({ heading, body }) => (
  <div>
    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">{heading}</div>
    <p className="mt-2 leading-relaxed text-slate-600">{body}</p>
  </div>
);

export default Pricing;

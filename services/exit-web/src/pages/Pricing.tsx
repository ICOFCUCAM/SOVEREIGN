import React from "react";
import { useNavigate } from "react-router-dom";
import { ENGINE_COUNTS } from "../lib/module-stats";

// Public pricing page. Three tiers + the marketplace economics:
// Founder Prep ($499/mo) → Founder Pro ($1,499/mo + success fee) →
// Institutional (custom). Plus the buyer-access tier sold to the
// other side of the marketplace.

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
}

const FOUNDER_TIERS: readonly Tier[] = [
  {
    key: "free",
    badge: "Free",
    name: "Founder Free",
    price: "$0",
    priceSub: "forever",
    headline: "Watch your position and the market. Read-only — upgrade to act.",
    features: [
      "Founder Dashboard & Exit Readiness Score",
      "Valuation & Cap Table (view)",
      "Marketplace & Acquisition Radar (browse)",
      "Pipeline (view)",
      "No outreach, exports or active deals",
    ],
    cta: "Start free",
  },
  {
    key: "prep",
    badge: "Preparation",
    name: "Founder Prep",
    price: "$499",
    priceSub: "/ month · billed annually",
    headline: "Get acquisition-ready. The full engine suite for founders evaluating an exit.",
    features: [
      "Company Valuation Engine — standard, strategic and asset-replacement reports",
      "Exit Readiness Score with weakness analysis + improvement plan",
      "Acquisition Memorandum Generator — CIM, exec summary, deck, teaser, DD index",
      `Due Diligence Engine — ${ENGINE_COUNTS.diligencePackages} standard packages with artifact lists`,
      `Buyer Discovery — ${ENGINE_COUNTS.registryFirms}-firm curated registry`,
      "Virtual Data Room (up to 50GB)",
      "Single workspace, single deal",
    ],
    cta: "Start Prep",
  },
  {
    key: "pro",
    badge: "Active deal",
    name: "Founder Pro",
    price: "$1,499",
    priceSub: "/ month + 1% success fee on close",
    headline: "Everything in Prep, plus the engines that run the live deal.",
    features: [
      "Everything in Founder Prep",
      "AI Deal Negotiator — offer scoring, conflict detection, counter moves",
      "Cross-bid comparison + cap-table-aware net-to-founder math",
      "Multi-buyer negotiation tracker with leverage analytics",
      "Acquisition Marketplace listing (anonymized + private modes)",
      "Premium Buyer Access — outbound matched introductions",
      "Up to 3 simultaneous workspaces; 500GB data-room storage",
      "Priority human review of generated documents",
    ],
    cta: "Start Pro",
    highlight: true,
  },
  {
    key: "institutional",
    badge: "Institutional",
    name: "ExitOS Institutional",
    price: "Custom",
    priceSub: "engagement + success fee",
    headline: "Full white-glove deal execution. For founders with material exits in flight.",
    features: [
      "Everything in Founder Pro",
      "Banker-quality CIM produced via Claude Sonnet 4.6 with editorial review",
      "Dedicated managing-director relationship",
      "Counsel + escrow + closing orchestration",
      "Single-tenant deployment available",
      "Negotiated success-fee schedule",
      "Continuous audit posture, sovereign-grade",
    ],
    cta: "Request a briefing",
  },
];

const BUYER_TIERS: readonly Tier[] = [
  {
    key: "buyer-free",
    badge: "Free",
    name: "Buyer Free",
    price: "$0",
    priceSub: "forever",
    headline: "Browse the marketplace. Upgrade to engage.",
    features: [
      "Browse anonymized opportunities",
      "Acquisition Radar (view)",
      "No NDA requests or deal-room access",
    ],
    cta: "Start free",
  },
  {
    key: "buyer-basic",
    badge: "Buyer",
    name: "Buyer Access",
    price: "$299",
    priceSub: "/ month",
    headline: "Browse anonymized listings. Request NDA-gated diligence.",
    features: [
      "Search and filter the marketplace",
      "View anonymized listing detail",
      "Request NDA to unlock identity and diligence packages",
      "Up to 10 active inquiries",
    ],
    cta: "Activate buyer access",
  },
  {
    key: "buyer-premium",
    badge: "Buyer Premium",
    name: "Premium Buyer Access",
    price: "$2,499",
    priceSub: "/ month · unlimited inquiries",
    headline: "Active acquirer tier. Outbound matched introductions + priority access.",
    features: [
      "Everything in Buyer Access",
      "Outbound matched introductions before public listing",
      "Priority NDA processing",
      "Saved searches + matching alerts",
      "Quarterly market briefings",
      "Dedicated buyer-relationship lead",
    ],
    cta: "Activate Premium",
    highlight: true,
  },
];

const Pricing: React.FC = () => {
  const nav = useNavigate();
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-900 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-[10%] h-[520px] w-[520px] rounded-full opacity-30 blur-[140px]" style={{ background: "rgba(16,185,129,0.30)" }} />
        <div className="absolute -right-32 bottom-[8%] h-[520px] w-[520px] rounded-full opacity-25 blur-[140px]" style={{ background: "rgba(245,158,11,0.25)" }} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] flex-col px-6 lg:px-12">
        {/* nav */}
        <header className="flex items-center justify-between py-7">
          <button onClick={() => nav("/")} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-gradient-to-br from-deal-400 to-deal-700 text-sm font-black text-white shadow-lg shadow-deal-700/30">EX</div>
            <span className="text-xl font-bold tracking-tight">
              EXIT<span className="text-deal-400">OS</span>
            </span>
          </button>
          <nav className="hidden items-center gap-9 lg:flex">
            <button onClick={() => nav("/platform")} className="text-[13px] font-medium uppercase tracking-wide text-white/70 hover:text-white">Platform</button>
            <button onClick={() => nav("/modules")} className="text-[13px] font-medium uppercase tracking-wide text-white/70 hover:text-white">Modules</button>
            <span className="text-[13px] font-medium uppercase tracking-wide text-deal-400">Pricing</span>
          </nav>
          <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded bg-gradient-to-b from-deal-300 to-deal-700 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-[#04140c] shadow-lg shadow-deal-700/30">
            Launch ExitOS
          </button>
        </header>

        {/* hero */}
        <section className="py-12">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-deal-400">Pricing</p>
            <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Built for the moment a <span className="text-deal-400">founder decides to sell</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
              ExitOS prices for the lifecycle of an exit — prep for founders evaluating the move, Pro for live deals, institutional for material exits. Buyers pay separately on the other side of the marketplace.
            </p>
          </div>
        </section>

        {/* founder tiers */}
        <section className="py-10">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-deal-400">Founder side</div>
              <h2 className="mt-2 font-serif text-3xl font-bold leading-tight">From free to institutional.</h2>
            </div>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {FOUNDER_TIERS.map((t) => <TierCard key={t.key} tier={t} onAct={() => nav("/console")} />)}
          </div>
        </section>

        {/* buyer tiers */}
        <section className="py-10">
          <div className="mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-loi-400">Buyer side</div>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight">Buyer access. Premium matching.</h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/60">The other side of the marketplace. Buyers subscribe for browse + NDA-gated diligence; premium adds outbound matched introductions before public listing.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {BUYER_TIERS.map((t) => <TierCard key={t.key} tier={t} onAct={() => nav("/console")} />)}
          </div>
        </section>

        {/* economics */}
        <section className="py-14">
          <div className="rounded-2xl border border-white/10 bg-ink-800/60 p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-deal-400">Marketplace economics</div>
            <h2 className="mt-2 font-serif text-2xl font-bold leading-tight">How ExitOS makes money.</h2>
            <div className="mt-6 grid gap-8 sm:grid-cols-3 text-[14px]">
              <Econ heading="Founder subscriptions" body="$499/month Prep tier covers the engine suite. $1,499/month Pro adds the negotiator + listing. Institutional is bespoke." />
              <Econ heading="Success fees on closed deals" body="1% success fee on Pro-tier closes. Institutional negotiates a custom schedule (typically 0.5–1.5% of headline price)." />
              <Econ heading="Premium buyer access" body="Buyers pay $299–$2,499/month. Premium tier gets first-look on listings + matched outbound introductions before public publishing." />
            </div>
          </div>
        </section>

        {/* closing CTA */}
        <section className="py-16 text-center">
          <h2 className="font-serif text-4xl font-bold leading-tight">Start with Prep. Move to Pro when the deal is live.</h2>
          <p className="mt-4 text-[15px] text-white/55">Cancel anytime. No success fee on Prep — that one's just the engines.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => nav("/console")} className="inline-flex items-center gap-2 rounded bg-gradient-to-b from-deal-300 to-deal-700 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#04140c] shadow-xl shadow-deal-700/40">
              Launch ExitOS
            </button>
            <button onClick={() => nav("/")} className="inline-flex items-center rounded border border-white/20 px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/85 hover:bg-white/5">
              Back to platform
            </button>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-8 text-[12px] text-white/40">
          <div>© {new Date().getFullYear()} ExitOS — A Sovereign Infrastructure</div>
          <div className="font-mono uppercase tracking-[0.22em]">exit.sovereigndo.com</div>
        </footer>
      </div>
    </div>
  );
};

const TierCard: React.FC<{ tier: Tier; onAct: () => void }> = ({ tier, onAct }) => (
  <div className={`bg-ink-800/95 p-7 ${tier.highlight ? "ring-1 ring-deal-400/50" : ""}`}>
    <div className="flex items-baseline justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-deal-400">{tier.badge}</span>
      {tier.highlight && <span className="rounded-full bg-deal-600/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-deal-300 ring-1 ring-deal-400/40">Recommended</span>}
    </div>
    <h3 className="mt-3 font-serif text-2xl font-bold text-white">{tier.name}</h3>
    <div className="mt-3 flex items-baseline gap-2">
      <span className="font-serif text-4xl font-bold text-white">{tier.price}</span>
      <span className="text-[12px] text-white/55">{tier.priceSub}</span>
    </div>
    <p className="mt-3 text-[13px] leading-relaxed text-white/55">{tier.headline}</p>
    <ul className="mt-5 space-y-2 text-[13px] text-white/75">
      {tier.features.map((f) => (
        <li key={f} className="flex items-baseline gap-2">
          <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-deal-400" /> {f}
        </li>
      ))}
    </ul>
    <button
      onClick={onAct}
      className={`mt-6 w-full rounded px-4 py-3 text-[12px] font-bold uppercase tracking-wide transition ${
        tier.highlight
          ? "bg-gradient-to-b from-deal-300 to-deal-700 text-[#04140c] shadow-lg shadow-deal-700/30 hover:from-deal-200 hover:to-deal-600"
          : "border border-white/20 text-white/85 hover:bg-white/5"
      }`}
    >
      {tier.cta}
    </button>
  </div>
);

const Econ: React.FC<{ heading: string; body: string }> = ({ heading, body }) => (
  <div>
    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-deal-400">{heading}</div>
    <p className="mt-2 leading-relaxed text-white/75">{body}</p>
  </div>
);

export default Pricing;

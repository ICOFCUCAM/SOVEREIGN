import React from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/xo";
import { useAuth } from "../lib/auth";
import { homeFor, type Plan } from "../lib/access";

// In-console mandate selector — shown when a plan hits a surface it can't
// reach. The institutional ladder: Listed Founder (free — listed and
// discovered, cannot engage), Preparation ($995 one-time — market-ready
// package), Active Mandate ($995/mo + 2.5% success fee — run the process),
// and Institutional (custom). Choosing a tier flips the session and drops
// the founder back into the work. Plan gating keys are unchanged: prep
// backs Preparation, pro backs Active Mandate.

interface Tier {
  readonly plan: Plan;
  readonly name: string;
  readonly price: string;
  readonly priceSub: string;
  readonly purpose: string;
  readonly blurb: string;
  readonly features: readonly string[];
  readonly highlight?: boolean;
  readonly contact?: boolean;        // Institutional — not a session plan
}

const Upgrade: React.FC<{ feature?: string }> = ({ feature }) => {
  const { session, upgradeTo } = useAuth();
  const navigate = useNavigate();
  const role = session?.role ?? "founder";
  const current = session?.plan ?? "free";

  const TIERS: readonly Tier[] = [
    { plan: "free", name: "Listed Founder", price: "$0", priceSub: "to enter", purpose: "Become visible to acquirers",
      blurb: "Listed and discoverable on the exchange. Receive buyer interest — upgrade to engage.",
      features: ["Company profile & anonymous listing", "Read-only valuation & readiness", "Buyer demand indicator & radar visibility", "Receive buyer interest & mandate alerts"] },
    { plan: "prep", name: "Preparation", price: "$995", priceSub: "one-time", purpose: "Prepare for market",
      blurb: "A transaction-ready acquisition package, produced once and yours to keep.",
      features: ["Valuation framework with provenance", "CIM, teaser & buyer universe", "Data room & cap-table review", "Market positioning & exit-strategy planning"] },
    { plan: "pro", name: "Active Mandate", price: "$995", priceSub: "/ mo + 2.5% fee", purpose: "Run a live process",
      blurb: "The execution desk. The success fee is earned only when your deal closes.",
      features: ["Buyer outreach & NDA automation", "Acquisition intelligence & AI negotiation", "Bid & process management", "Closing Center — net-to-founder math"], highlight: current !== "pro" },
    { plan: "free", name: "Institutional", price: "Custom", priceSub: "engagement + fee", purpose: "Material transactions — $25M+",
      blurb: "White-glove execution: cross-border, private equity, family office and sovereign processes.",
      features: ["Dedicated managing director & deal team", "Custom buyer sourcing", "Legal & escrow coordination", "Single-tenant deployment & priority support"], contact: true },
  ];

  const act = (t: Tier): void => {
    if (t.contact) { navigate("/pricing"); return; }
    if (t.plan === "free") return;
    upgradeTo(t.plan);
    navigate(homeFor(role));
  };

  const BTN = "rounded-sm bg-deal-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
  const BTN_GHOST = "rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";

  return (
    <div data-page="upgrade" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="Select a mandate" title="Choose your engagement"
        description={feature
          ? `${feature} requires an active engagement. Preparation makes you market-ready; an Active Mandate runs the process and is paid on close.`
          : "Listed Founder gets you discovered for free. Preparation makes you market-ready. An Active Mandate runs the live process — and is paid only when you close."} />

      <ul className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((t) => {
          const isCurrent = !t.contact && t.plan === current && t.name !== "Institutional";
          const tone = t.contact ? "text-xo-action" : t.plan === "pro" ? "text-xo-verified" : t.plan === "prep" ? "text-xo-caution" : "text-xo-muted";
          return (
            <li key={t.name} className={`flex flex-col bg-xo-panel ${t.highlight ? "ring-1 ring-inset ring-xo-verified/50" : ""}`}>
              <div className="border-b border-xo-line px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${tone}`}>{t.name}</h2>
                  {t.highlight && <span className="rounded-sm border border-xo-verified/50 px-1.5 py-px text-[11px] font-semibold text-xo-verified">Most selected</span>}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-semibold tabular-nums">{t.price}</span>
                  <span className="text-[12px] text-xo-muted">{t.priceSub}</span>
                </div>
                <div className="mt-1 text-[12px] font-semibold text-xo-muted">{t.purpose}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-xo-muted">{t.blurb}</p>
              </div>
              <div className="flex flex-1 flex-col px-4 py-4">
                <ul className="space-y-2 text-[13px]">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-baseline gap-2"><span aria-hidden className={t.name === "Listed Founder" ? "text-xo-muted" : "text-xo-verified"}>{t.name === "Listed Founder" ? "•" : "✓"}</span>{f}</li>
                  ))}
                </ul>
                <div className="mt-auto pt-5">
                  {isCurrent ? (
                    <p className="text-[12px] font-semibold text-xo-muted">Your current engagement</p>
                  ) : t.name === "Listed Founder" ? (
                    <p className="text-[12px] text-xo-muted">Free — the exchange entry point</p>
                  ) : (
                    <button type="button" onClick={() => act(t)} className={t.plan === "pro" && !t.contact ? BTN : BTN_GHOST}>
                      {t.contact ? "Request a briefing →" : t.plan === "prep" ? "Prepare my company →" : "Launch a mandate →"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => navigate("/pricing")} className={BTN_GHOST}>See full pricing</button>
        <p className="text-[12px] text-xo-muted">Demo: choosing an engagement switches your session instantly.</p>
      </div>
    </div>
  );
};

export default Upgrade;

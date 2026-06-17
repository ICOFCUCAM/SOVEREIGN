import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, SectionHeader, Button } from "../lib/ui";
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

  return (
    <div>
      <SectionHeader
        kicker="Select a mandate"
        title="Choose your engagement"
        description={feature
          ? `${feature} requires an active engagement. Preparation makes you market-ready; an Active Mandate runs the process and is paid on close.`
          : "Listed Founder gets you discovered for free. Preparation makes you market-ready. An Active Mandate runs the live process — and is paid only when you close."}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((t) => {
          const accent = t.contact ? "blue" : t.plan === "pro" ? "deal" : t.plan === "prep" ? "loi" : "muted";
          const isCurrent = !t.contact && t.plan === current && t.name !== "Institutional";
          const head = accent === "deal" ? "from-deal-600/20" : accent === "loi" ? "from-loi-500/15" : accent === "blue" ? "from-blue-500/10" : "";
          const kicker = accent === "deal" ? "text-deal-300" : accent === "loi" ? "text-loi-300" : accent === "blue" ? "text-blue-300" : "text-white/45";
          return (
            <Card key={t.name} className={`overflow-hidden p-0 ${t.highlight ? "ring-1 ring-deal-400/40" : ""}`}>
              <div className={`px-6 py-5 ${head ? `bg-gradient-to-r ${head} to-transparent` : ""}`}>
                <div className="flex items-center justify-between">
                  <div className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${kicker}`}>{t.name}</div>
                  {t.highlight && <span className="rounded-full bg-deal-500/20 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-deal-300 ring-1 ring-deal-400/40">Most selected</span>}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold tabular-nums text-white">{t.price}</span>
                  <span className="text-[12px] text-white/50">{t.priceSub}</span>
                </div>
                <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/35">{t.purpose}</div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">{t.blurb}</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-[13px] text-white/80">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-baseline gap-2"><span className={`mt-0.5 ${t.name === "Listed Founder" ? "text-white/40" : "text-deal-300"}`}>{t.name === "Listed Founder" ? "•" : "✓"}</span>{f}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Your current engagement</div>
                  ) : t.name === "Listed Founder" ? (
                    <div className="text-[11px] uppercase tracking-wide text-white/35">Free — the exchange entry point</div>
                  ) : (
                    <Button variant={t.plan === "pro" && !t.contact ? "primary" : "ghost"} onClick={() => act(t)}>
                      {t.contact ? "Request a briefing →" : t.plan === "prep" ? "Prepare my company →" : "Launch a mandate →"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate("/pricing")}>See full pricing</Button>
        <p className="text-[11px] text-white/40">Demo: choosing an engagement switches your session instantly.</p>
      </div>
    </div>
  );
};

export default Upgrade;

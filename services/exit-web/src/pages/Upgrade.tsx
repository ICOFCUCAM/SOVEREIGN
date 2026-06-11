import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, SectionHeader, Button } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { homeFor, type Plan } from "../lib/access";

// In-console paywall — shown when a plan hits a surface it can't reach. Three
// plans: Free (watch), Starter ($99 — upload, list, get discovered, run
// Autonomous Exit to "buyers found"), and Pro (the full transaction desk).
// Choosing a plan flips the session and drops the founder back into the work.

interface Tier {
  readonly plan: Plan;
  readonly name: string;
  readonly price: string;
  readonly priceSub: string;
  readonly blurb: string;
  readonly features: readonly string[];
  readonly highlight?: boolean;
}

const Upgrade: React.FC<{ feature?: string }> = ({ feature }) => {
  const { session, upgradeTo } = useAuth();
  const navigate = useNavigate();
  const role = session?.role ?? "founder";
  const current = session?.plan ?? "free";

  const proPrice = role === "buyer" ? "$999" : "$1,499";
  const TIERS: readonly Tier[] = [
    { plan: "free", name: "Free", price: "$0", priceSub: "forever", blurb: "Watch your position and the market — read-only.",
      features: ["Dashboard & Exit Readiness Score", "Valuation & Cap Table (view)", "Marketplace & Acquisition Radar (browse)", "Pipeline (view)"] },
    { plan: "starter", name: "Founder Starter", price: "$99", priceSub: "/ month", blurb: "Upload, get valued, and get discovered by buyers.",
      features: ["Everything in Free", "Upload documents → Diligence & Data Room", "Generate the teaser & list the company", "Buyer Intelligence — matched acquirers", "Autonomous Exit up to buyers found"], highlight: current === "free" },
    { plan: "prep", name: "Founder Prep", price: "$499", priceSub: "/ month", blurb: "Get fully acquisition-ready before a live process.",
      features: ["Everything in Starter", "Acquisition Memorandum suite — CIM, deck, teaser, DD index", "Due Diligence Engine — full packages & artifact lists", "Buyer Discovery — full curated registry", "Virtual Data Room (up to 50GB)"] },
    { plan: "pro", name: "Founder Pro", price: proPrice, priceSub: "/ month", blurb: "The full transaction desk — communicate, negotiate, close.",
      features: ["Everything in Prep", "Chief Investment Banker + The Banker outreach", "NDA, Live Deal Room & buyer communication", "Negotiator, Simulator & Closing Center", "WealthOS · unlimited exports & active deals"], highlight: current !== "free" },
  ];

  const act = (plan: Plan): void => {
    if (plan === "free") return;
    upgradeTo(plan);
    navigate(homeFor(role));
  };

  return (
    <div>
      <SectionHeader
        kicker="Subscription"
        title="Choose your plan"
        description={feature
          ? `${feature} needs a higher plan. Starter gets you listed and discovered; Pro runs the whole deal.`
          : "Free watches the market. Starter gets you valued, listed and discovered. Pro runs the whole deal."}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((t) => {
          const isCurrent = t.plan === current;
          return (
            <Card key={t.plan} className={`overflow-hidden p-0 ${t.highlight ? "ring-1 ring-deal-400/40" : ""}`}>
              <div className={`px-6 py-5 ${t.plan === "pro" ? "bg-gradient-to-r from-deal-600/20 to-transparent" : t.plan === "starter" ? "bg-gradient-to-r from-loi-500/15 to-transparent" : t.plan === "prep" ? "bg-gradient-to-r from-blue-500/10 to-transparent" : ""}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${t.plan === "pro" ? "text-deal-300" : t.plan === "starter" ? "text-loi-300" : t.plan === "prep" ? "text-blue-300" : "text-white/45"}`}>{t.name}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-bold text-white">{t.price}</span>
                  <span className="text-[12px] text-white/50">{t.priceSub}</span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">{t.blurb}</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 text-[13px] text-white/80">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-baseline gap-2"><span className={`mt-0.5 ${t.plan === "free" ? "text-white/40" : "text-deal-300"}`}>{t.plan === "free" ? "•" : "✓"}</span>{f}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Your current plan</div>
                  ) : t.plan === "free" ? (
                    <div className="text-[11px] uppercase tracking-wide text-white/35">Downgrade in billing</div>
                  ) : (
                    <Button variant={t.plan === "pro" ? "primary" : "ghost"} onClick={() => act(t.plan)}>
                      {t.plan === "starter" ? "Start with Starter →" : t.plan === "prep" ? "Start with Prep →" : "Upgrade to Pro →"}
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
        <p className="text-[11px] text-white/40">Demo: choosing a plan switches your session instantly.</p>
      </div>
    </div>
  );
};

export default Upgrade;

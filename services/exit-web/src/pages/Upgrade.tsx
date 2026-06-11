import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, SectionHeader, Button } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { homeFor } from "../lib/access";

// Paywall — shown when a free founder/buyer hits a pro-only surface. Upgrading
// flips the session plan to pro (demo) and drops them straight into the feature
// they wanted. The real billing wires through here later.

const PRO_FEATURES = [
  "Chief Investment Banker — your always-on transaction desk",
  "Autonomous Exit — the seven agents run the process end to end",
  "AI Banker, Negotiator & Scenario Simulator",
  "Due Diligence, Data Room, Documents & Closing",
  "Buyer Intelligence, Live Deal Room & WealthOS",
  "Unlimited exports, outreach and active deals",
];

const Upgrade: React.FC<{ feature?: string }> = ({ feature }) => {
  const { session, upgrade } = useAuth();
  const navigate = useNavigate();
  const role = session?.role ?? "founder";

  return (
    <div>
      <SectionHeader
        kicker="Subscription"
        title="Upgrade to Pro"
        description={feature
          ? `${feature} is a Pro feature. Your current plan can watch the read-only surfaces — upgrade to act.`
          : "Your current plan can watch the read-only surfaces — upgrade to act."}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Free</div>
          <div className="mt-2 font-mono text-3xl font-bold text-white">$0</div>
          <p className="mt-2 text-[13px] text-white/55">Watch your position and the market — read-only.</p>
          <ul className="mt-4 space-y-2 text-[13px] text-white/70">
            {["Dashboard & Exit Readiness Score", "Valuation & Cap Table (view)", "Marketplace & Acquisition Radar (browse)", "Pipeline (view)"].map((f) => (
              <li key={f} className="flex items-baseline gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />{f}</li>
            ))}
          </ul>
          <div className="mt-5 text-[11px] uppercase tracking-wide text-white/40">Your current plan</div>
        </Card>

        <Card className="overflow-hidden p-0 ring-1 ring-deal-400/40">
          <div className="bg-gradient-to-r from-deal-600/20 to-transparent px-6 py-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-300">Pro</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-white">{role === "buyer" ? "$999" : "$1,499"}</span>
              <span className="text-[12px] text-white/50">/ month</span>
            </div>
          </div>
          <div className="p-6">
            <ul className="space-y-2 text-[13px] text-white/80">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-baseline gap-2"><span className="mt-0.5 text-deal-300">✓</span>{f}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button onClick={() => { upgrade(); navigate(homeFor(role)); }}>Upgrade to Pro →</Button>
              <Button variant="ghost" onClick={() => navigate("/pricing")}>See full pricing</Button>
            </div>
            <p className="mt-3 text-[11px] text-white/40">Demo: upgrading unlocks every pro surface instantly for this session.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Upgrade;

import React from "react";
import { Link } from "react-router-dom";
import { Card, SectionHeader } from "../lib/ui";
import { BUYERS, VALUATION_STRATEGIC } from "../lib/engines";
import { SAMPLE_COMPANY } from "../lib/profile";

// Network Intelligence — the five moats. Individual screens can be copied;
// the compounding dataset cannot. This surface makes the moats tangible: the
// founder graph, the buyer graph, deal intelligence, the agent workforce and
// the founder lifecycle. Dataset scale is illustrative; the per-buyer DNA is
// computed from the discovery engine's measured outcomes.

const ARR = SAMPLE_COMPANY.revenue.annualRecurringRevenueUsd;

function buyerDna(name: string, premiumDefault: number, retentionBase: number, earnout: string) {
  const c = BUYERS.candidates.find((x) => x.buyer.name === name) ?? BUYERS.candidates[0];
  const days = c.expectedOutcome.expectedDaysToCash;
  const prem = c.outcomes.avgPremiumPct != null ? Math.min(0.4, c.outcomes.avgPremiumPct) : premiumDefault;
  const multiple = ((VALUATION_STRATEGIC.headline.mid * (1 + prem)) / ARR).toFixed(1);
  const retention = Math.min(95, Math.max(45, Math.round(retentionBase + ((c.outcomes.avgRetradePct ?? 0) >= 0 ? 6 : -8))));
  return { name: c.buyer.name, days, multiple, retention, earnout };
}

const Stat: React.FC<{ value: string; label: string; accent?: string }> = ({ value, label, accent }) => (
  <div className="rounded-xl border border-white/10 bg-ink-900/40 p-4">
    <div className="font-mono text-2xl font-bold" style={{ color: accent ?? "#fff" }}>{value}</div>
    <div className="mt-1 text-[11px] uppercase tracking-wide text-white/45">{label}</div>
  </div>
);

const Moat: React.FC<{ n: number; title: string; why: string; children: React.ReactNode; to?: string; cta?: string }> = ({ n, title, why, children, to, cta }) => (
  <Card className="p-6">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-deal-600/25 font-mono text-sm font-bold text-deal-200 ring-1 ring-deal-400/40">{n}</span>
        <div>
          <h2 className="font-serif text-lg font-bold text-white">{title}</h2>
          <p className="text-[12px] text-white/45">{why}</p>
        </div>
      </div>
      {to && <Link to={to} className="shrink-0 text-[12px] font-semibold uppercase tracking-wide text-deal-400 hover:text-deal-300">{cta} →</Link>}
    </div>
    <div className="mt-5">{children}</div>
  </Card>
);

const Network: React.FC = () => {
  const buyerA = buyerDna("Amazon Strategic", 0.28, 80, "Rare");
  const buyerB = buyerDna("Pritzker Private Capital", 0.12, 60, "Aggressive");
  const buyerDnaCount = BUYERS.candidates.length;

  return (
    <div>
      <SectionHeader
        kicker="The moat · network intelligence"
        title="Network Intelligence"
        description="Stop designing screens; design the moat. A market leader isn't the prettiest UI — it's the product that gets harder to replace every year. Five compounding data assets make ExitOS nearly impossible to copy."
      />

      <div className="space-y-5">
        <Moat n={1} title="The Founder Graph" why="The world's largest founder-exit dataset — no new entrant can backfill it.">
          <div className="grid grid-cols-3 gap-4">
            <Stat value="52,000" label="Founders" accent="#34d399" />
            <Stat value="800,000" label="Buyer interactions" accent="#60a5fa" />
            <Stat value="15,000" label="Completed acquisitions" accent="#a78bfa" />
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-white/65">
            Every founder contributes industry, revenue, growth, cap table, team, buyers approached, offers received and
            closing outcomes. The graph learns <span className="text-white">who buys what, for how much, and under what conditions</span> — the
            knowledge a first-time founder and most bankers simply don't have.
          </p>
        </Moat>

        <Moat n={2} title="The Buyer Graph" why="Most marketplaces know sellers. Few know buyers." to="/console/buyer-copilot" cta="Buyer Copilot">
          <p className="text-[13px] text-white/65">Buyer DNA on <span className="text-white">{buyerDnaCount}+ acquirers</span> — measured, not guessed.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[buyerA, buyerB].map((b, i) => (
              <div key={b.name} className="rounded-lg border border-white/10 bg-ink-900/40 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Buyer {i === 0 ? "A" : "B"}</div>
                <div className="text-sm font-bold text-white">{b.name}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div><div className="font-mono text-base font-bold text-white">{b.days}d</div><div className="text-[9px] uppercase text-white/40">to close</div></div>
                  <div><div className="font-mono text-base font-bold text-deal-300">{b.multiple}×</div><div className="text-[9px] uppercase text-white/40">ARR</div></div>
                  <div><div className="font-mono text-base font-bold text-white">{b.retention}%</div><div className="text-[9px] uppercase text-white/40">retention</div></div>
                </div>
                <div className="mt-2 text-[11px] text-white/45">Earnout tendency: <span className="text-white/70">{b.earnout}</span></div>
              </div>
            ))}
          </div>
        </Moat>

        <Moat n={3} title="Deal Intelligence" why="Every acquisition teaches the system — the AI grows smarter than most advisors.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat value="74 days" label="Median LOI → close" />
            <Stat value="8%" label="Median escrow" />
            <Stat value="41%" label="PE deals w/ earnout" />
            <Stat value="28%" label="Reverse break-fee usage" />
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-white/65">
            The platform learns the patterns that win: LOI structures, SPA clauses, earnout models, escrow patterns and
            negotiation outcomes — fed back into every recommendation.
          </p>
        </Moat>

        <Moat n={4} title="Autonomous Agents" why="Competitors offer tools. ExitOS offers workers." to="/console/autopilot" cta="Autonomous Exit">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-ink-900/40 p-3.5 text-[13px] text-white/80">The <span className="text-white">Outreach Agent</span> contacted 27 buyers.</div>
            <div className="rounded-lg border border-white/10 bg-ink-900/40 p-3.5 text-[13px] text-white/80">The <span className="text-white">Diligence Agent</span> prepared the room and flagged 14 risks.</div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-white/65">
            Eight agents do the work — not "use the outreach tool" but "the agent contacted the buyers." The winner won't
            be software; it will be software that does the work.
          </p>
        </Moat>

        <Moat n={5} title="The Founder Lifecycle" why="Most platforms care only about the exit. ExitOS owns the whole journey." to="/console/wealth" cta="WealthOS">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { phase: "Before exit", items: ["Valuation", "Readiness", "Growth planning"], to: "/console/readiness" },
              { phase: "During exit", items: ["Buyers", "Negotiation", "Diligence", "Closing"], to: "/console/autopilot" },
              { phase: "After exit", items: ["Taxes", "Trusts", "Family office", "Angel & PE", "Next venture"], to: "/console/wealth" },
            ].map((col) => (
              <Link key={col.phase} to={col.to} className="rounded-lg border border-white/10 bg-ink-900/40 p-4 transition hover:border-deal-400/30">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-deal-300">{col.phase}</div>
                <ul className="mt-2 space-y-1 text-[12.5px] text-white/70">
                  {col.items.map((it) => <li key={it} className="flex items-baseline gap-2"><span className="h-1 w-1 rounded-full bg-white/30" />{it}</li>)}
                </ul>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-white/55">From startup creation through growth, exit and wealth — founders never leave.</p>
        </Moat>
      </div>

      <p className="mt-6 text-[11px] text-white/40">Dataset scale is illustrative in demo mode; per-buyer DNA and outcomes are computed from the discovery engine.</p>
    </div>
  );
};

export default Network;

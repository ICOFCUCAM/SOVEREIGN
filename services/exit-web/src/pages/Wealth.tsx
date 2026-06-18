import React from "react";
import { Card, fmtMoney } from "../lib/ui";
import { CommandHeader } from "../lib/workstation";
import BankerTake from "../components/BankerTake";
import { OFFER_WATERFALLS, SAMPLE_OFFERS, OFFER_COMPARISON, CAPTABLE_ANALYSIS } from "../lib/engines";

// Wealth Transition — the stage most M&A platforms ignore. The deal closes;
// the founder's job shifts from building a company to stewarding the
// proceeds. This surface takes the leading offer's waterfall through tax,
// lays out when each tranche actually becomes liquid (cash / lock-up /
// earnout), and proposes a diversification plan. This is where ExitOS stops
// being an acquisition tool and becomes the OS for founder liquidity.

const TAX = 0.238; // blended LTCG + NIIT estimate — illustrative; the engine has no tax model

const ALLOC: { label: string; pct: number; note: string; tint: string }[] = [
  { label: "Diversified portfolio", pct: 0.55, note: "Out of a single illiquid position", tint: "#34d399" },
  { label: "Next venture / angel",  pct: 0.20, note: "Reinvest the operator edge",        tint: "#60a5fa" },
  { label: "Real assets",           pct: 0.15, note: "Property, inflation hedge",          tint: "#a78bfa" },
  { label: "Giving / DAF",          pct: 0.10, note: "Donor-advised fund, tax-efficient",  tint: "#fbbf24" },
];

const Wealth: React.FC = () => {
  const leadingOffer = SAMPLE_OFFERS.find((o) => o.buyerName === OFFER_COMPARISON.leader) ?? SAMPLE_OFFERS[0];
  const wf = (OFFER_WATERFALLS.find((w) => w.offerId === leadingOffer.offerId) ?? OFFER_WATERFALLS[0]).waterfall;

  const founderGross = wf.distributions.filter((d) => d.role === "founder").reduce((s, d) => s + d.grossProceedsUsd, 0);
  const afterPref = wf.netToFoundersUsd;
  const taxDue = afterPref * TAX;
  const afterTax = afterPref - taxDue;

  // Liquidity timeline — when each tranche actually lands, by consideration mix.
  const tranches = [
    { label: "Cash at close",      when: "Day 0",        usd: afterTax * leadingOffer.cashPct,    tint: "#34d399" },
    { label: "Stock · lock-up",    when: "~6–12 months", usd: afterTax * leadingOffer.stockPct,   tint: "#60a5fa" },
    { label: "Earnout · milestones", when: "~24 months", usd: afterTax * leadingOffer.earnoutPct, tint: "#fbbf24" },
  ];

  const cascade = [
    { label: "Offer headline",   value: leadingOffer.headlinePriceUsd, color: "text-white",     note: leadingOffer.buyerName },
    { label: "Your gross",       value: founderGross,                  color: "text-white/85",  note: `${(CAPTABLE_ANALYSIS.ownershipByRole.founder * 100).toFixed(1)}% founder stake` },
    { label: "After preferences", value: afterPref,                    color: "text-loi-300",   note: `pref stack ${fmtMoney(wf.preferenceTotalUsd)}` },
    { label: "After taxes",      value: afterTax,                      color: "text-deal-300",  note: `~${(TAX * 100).toFixed(1)}% est. capital gains` },
  ];

  const portfolioUsd = afterTax * ALLOC[0].pct;

  // WealthOS — the nine threads ExitOS keeps after the wire, owning the
  // founder lifecycle from exit into long-term wealth.
  const foViable = afterTax >= 50_000_000;
  const tracker: { label: string; value: string; note: string; pill: string; tint: string }[] = [
    { label: "Tax Planning",            value: fmtMoney(taxDue),                       note: `reserved · QSBS + installment review`,        pill: "Reserved",    tint: "#fbbf24" },
    { label: "Trust Structures",        value: fmtMoney(Math.round(afterTax * 0.12)),  note: "GRAT / family trust for estate efficiency",   pill: "Recommended", tint: "#a78bfa" },
    { label: "Family Office",           value: foViable ? "Single-family office" : "Multi-family office", note: foViable ? "liquidity supports a dedicated SFO" : "MFO / OCIO until scale", pill: "Setup", tint: "#60a5fa" },
    { label: "Investment Opportunities", value: fmtMoney(Math.round(afterTax * 0.30)), note: "diversified market portfolio",                pill: "Allocated",   tint: "#34d399" },
    { label: "Angel Investing",         value: fmtMoney(Math.round(afterTax * 0.08)),  note: "operator-edge angel checks",                  pill: "Allocated",   tint: "#34d399" },
    { label: "Private Equity",          value: fmtMoney(Math.round(afterTax * 0.10)),  note: "co-invest / fund commitments",                pill: "Allocated",   tint: "#34d399" },
    { label: "Real Estate",             value: fmtMoney(Math.round(afterTax * 0.12)),  note: "property · inflation hedge",                  pill: "Allocated",   tint: "#a78bfa" },
    { label: "Philanthropy",            value: fmtMoney(Math.round(afterTax * 0.08)),  note: "donor-advised fund · tax-efficient",          pill: "Allocated",   tint: "#fbbf24" },
    { label: "Next Venture",            value: fmtMoney(Math.round(afterTax * 0.10)),  note: "the next company · holdco",                   pill: "Reserved",    tint: "#60a5fa" },
  ];

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="Wealth · Liquidity"
        title="WealthOS"
        tag="After the wire"
        metrics={[
          { k: "After-tax net", v: fmtMoney(afterTax), accent: true, sub: leadingOffer.buyerName },
          { k: "Tax reserve", v: fmtMoney(taxDue), sub: "set aside first" },
          { k: "To portfolio", v: fmtMoney(portfolioUsd), accent: true, sub: "diversified" },
        ]}
      />


      <BankerTake
        next={<>At lock-up, move <span className="text-white">{Math.round(ALLOC[0].pct * 100)}%</span> of your after-tax proceeds out of concentrated stock and into a diversified portfolio.</>}
        stake={<><span className="font-mono font-bold text-deal-300">{fmtMoney(afterTax)}</span> after-tax net to you from the {leadingOffer.buyerName} deal.</>}
        inaction={<>Holding the position concentrated re-exposes your liquidity to a single company's risk after you've already de-risked the exit.</>}
        buyer={<>Reserve <span className="font-mono text-loi-300">{fmtMoney(taxDue)}</span> for taxes before allocating anything else.</>}
        automate={<>ExitOS runs the waterfall, models the tax, schedules the liquidity and drafts the diversification plan.</>}
        impact={<>{fmtMoney(portfolioUsd)}</>}
      />

      {/* ── Proceeds cascade ─────────────────────────────────────── */}
      <Card className="p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-400">What you walk away with · {leadingOffer.buyerName}</div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cascade.map((s, i) => (
            <div key={s.label} className="relative">
              {i > 0 && <span className="absolute -left-3 top-5 hidden text-white/20 sm:block">→</span>}
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{s.label}</div>
              <div className={`mt-1 font-mono text-2xl font-bold ${s.color}`}>{fmtMoney(s.value)}</div>
              <div className="mt-0.5 text-[10px] text-white/40">{s.note}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── WealthOS tracker — nine lifecycle threads ────────────── */}
      <h2 className="mt-8 mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">WealthOS · founder lifecycle</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {tracker.map((t) => (
          <Card key={t.label} className="relative overflow-hidden p-5">
            <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: t.tint }} />
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{t.label}</div>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide" style={{ background: `${t.tint}1f`, color: t.tint }}>{t.pill}</span>
            </div>
            <div className="mt-2 font-mono text-xl font-bold text-white">{t.value}</div>
            <div className="mt-1 text-[11px] text-white/45">{t.note}</div>
          </Card>
        ))}
      </div>

      {/* ── Liquidity timeline ───────────────────────────────────── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">When your money lands</div>
          <p className="mt-1 text-[11px] text-white/45">After-tax proceeds by consideration mix — {Math.round(leadingOffer.cashPct * 100)}% cash · {Math.round(leadingOffer.stockPct * 100)}% stock · {Math.round(leadingOffer.earnoutPct * 100)}% earnout.</p>
          <div className="mt-5 space-y-4">
            {tranches.map((t) => (
              <div key={t.label}>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="text-white/75">{t.label} <span className="text-white/40">· {t.when}</span></span>
                  <span className="font-mono font-semibold" style={{ color: t.tint }}>{fmtMoney(t.usd)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${afterTax > 0 ? (t.usd / afterTax) * 100 : 0}%`, background: t.tint }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-white/10 pt-3 text-[12px] text-white/55">
            Liquid on day one: <span className="font-mono font-semibold text-deal-300">{fmtMoney(tranches[0].usd)}</span> — the rest unlocks as lock-ups lapse and earnout milestones clear.
          </div>
        </Card>

        {/* ── Diversification plan ───────────────────────────────── */}
        <Card className="p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Diversification plan</div>
          <p className="mt-1 text-[11px] text-white/45">Illustrative allocation of {fmtMoney(afterTax)} after-tax — turn one concentrated position into durable wealth.</p>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full">
            {ALLOC.map((a) => (
              <div key={a.label} style={{ width: `${a.pct * 100}%`, background: a.tint }} />
            ))}
          </div>
          <div className="mt-4 space-y-2.5">
            {ALLOC.map((a) => (
              <div key={a.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: a.tint }} />
                  <div>
                    <div className="text-[13px] font-medium text-white">{a.label}</div>
                    <div className="text-[10px] text-white/40">{a.note}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold text-white">{fmtMoney(afterTax * a.pct)}</div>
                  <div className="text-[10px] text-white/40">{Math.round(a.pct * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── What's next ──────────────────────────────────────────── */}
      <Card className="mt-8 p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">After the wire</div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {[
            { h: "Tax & structure", b: `Reserve ${fmtMoney(taxDue)} now; explore QSBS exclusion, installment treatment on the earnout, and a DAF for the giving tranche.` },
            { h: "Diversify the position", b: `Stagger sales of any stock consideration through the lock-up; rebalance ${Math.round(ALLOC[0].pct * 100)}% into a diversified portfolio.` },
            { h: "The next chapter", b: "Reinvest the operator edge — angel checks, a holdco, or the next company. ExitOS keeps the readiness clock running for round two." },
          ].map((c) => (
            <div key={c.h} className="rounded-lg border border-white/10 bg-ink-900/40 p-4">
              <div className="text-[13px] font-bold text-white">{c.h}</div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/60">{c.b}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-white/40">Illustrative planning only — not tax, legal or investment advice.</p>
      </Card>
    </div>
  );
};

export default Wealth;

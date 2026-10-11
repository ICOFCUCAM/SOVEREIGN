import React, { useMemo } from "react";
import { fmtMoney } from "../lib/ui";
import { MarketTape } from "../lib/workstation";
import { PageHeader, Section, Metric } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
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
  const leadingOffer = SAMPLE_OFFERS.find((o) => o.offerId === OFFER_COMPARISON.leader) ?? SAMPLE_OFFERS[0];
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
  const tape = useMemo(() => buildMarketTape(), []);

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
    <div data-page="liquidity-transition" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Wealth · Liquidity" title="Liquidity &amp; Transition"
        badge={<span className="text-[12px] text-xo-muted">After the wire</span>} />

      <section aria-label="Proceeds summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-3">
        <div className="bg-xo-panel"><Metric label="After-tax net" emphasis value={<span className="text-xo-verified">{fmtMoney(afterTax)}</span>} sub={leadingOffer.buyerName} /></div>
        <div className="bg-xo-panel"><Metric label="Tax reserve" value={fmtMoney(taxDue)} sub="set aside first" /></div>
        <div className="bg-xo-panel"><Metric label="To portfolio" value={fmtMoney(portfolioUsd)} sub="diversified" /></div>
      </section>

      <MarketTape items={tape} />

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
        right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">{fmtMoney(portfolioUsd)}</span>}>
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">At lock-up, move <span className="font-semibold">{Math.round(ALLOC[0].pct * 100)}%</span> of your after-tax proceeds out of concentrated stock and into a diversified portfolio.</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="At stake"><span className="font-mono font-semibold text-xo-verified">{fmtMoney(afterTax)}</span> after-tax net to you from the {leadingOffer.buyerName} deal.</TakeCell>
            <TakeCell k="If you wait">Holding the position concentrated re-exposes your liquidity to a single company's risk after you've already de-risked the exit.</TakeCell>
            <TakeCell k="First">Reserve <span className="font-mono">{fmtMoney(taxDue)}</span> for taxes before allocating anything else.</TakeCell>
            <TakeCell k="ExitOS does it">ExitOS runs the waterfall, models the tax, schedules the liquidity and drafts the diversification plan.</TakeCell>
          </dl>
        </div>
      </Section>

      <Section title={`What you walk away with · ${leadingOffer.buyerName}`} eyebrow="Proceeds cascade" className="border border-xo-line">
        <ol className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
          {cascade.map((s, i) => (
            <li key={s.label} className="bg-xo-panel px-4 py-3">
              <div className="text-[11px] font-medium text-xo-muted"><span aria-hidden className="text-xo-faint">{i > 0 ? "→ " : ""}</span>{s.label}</div>
              <div className={`mt-1 font-mono text-[20px] font-semibold tabular-nums ${i === cascade.length - 1 ? "text-xo-verified" : "text-xo-text"}`}>{fmtMoney(s.value)}</div>
              <div className="mt-0.5 text-[11px] text-xo-faint">{s.note}</div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="WealthOS · founder lifecycle" className="border border-xo-line">
        <ul className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 lg:grid-cols-3">
          {tracker.map((t) => (
            <li key={t.label} className="bg-xo-panel px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[12px] font-semibold text-xo-muted">{t.label}</h3>
                <span className="text-[11px] font-semibold text-xo-faint">{t.pill}</span>
              </div>
              <div className="mt-1 font-mono text-[17px] font-semibold tabular-nums">{t.value}</div>
              <div className="mt-0.5 text-[12px] text-xo-muted">{t.note}</div>
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-2">
        <Section title="When your money lands">
          <div className="px-4 py-3">
            <p className="text-[12px] text-xo-muted">After-tax proceeds by consideration mix — {Math.round(leadingOffer.cashPct * 100)}% cash · {Math.round(leadingOffer.stockPct * 100)}% stock · {Math.round(leadingOffer.earnoutPct * 100)}% earnout.</p>
            <ol className="mt-3 space-y-3">
              {tranches.map((t) => (
                <li key={t.label}>
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span>{t.label} <span className="text-xo-faint">· {t.when}</span></span>
                    <span className="font-mono font-semibold tabular-nums">{fmtMoney(t.usd)}</span>
                  </div>
                  <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-xo-line">
                    <div className="h-full rounded-full bg-xo-action" style={{ width: `${afterTax > 0 ? (t.usd / afterTax) * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-xo-line pt-2 text-[12px] text-xo-muted">
              Liquid on day one: <span className="font-mono font-semibold text-xo-verified">{fmtMoney(tranches[0].usd)}</span> — the rest unlocks as lock-ups lapse and earnout milestones clear.
            </p>
          </div>
        </Section>

        <Section title="Diversification plan">
          <div className="px-4 py-3">
            <p className="text-[12px] text-xo-muted">Illustrative allocation of {fmtMoney(afterTax)} after-tax — turn one concentrated position into durable wealth.</p>
            <div aria-hidden className="mt-3 flex h-2.5 overflow-hidden rounded-full">
              {ALLOC.map((a) => (
                <div key={a.label} style={{ width: `${a.pct * 100}%`, background: a.tint }} />
              ))}
            </div>
            <ul className="mt-3 divide-y divide-xo-line">
              {ALLOC.map((a) => (
                <li key={a.label} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: a.tint }} />
                    <div>
                      <div className="text-[13px] font-medium">{a.label}</div>
                      <div className="text-[11px] text-xo-faint">{a.note}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[13px] font-semibold tabular-nums">{fmtMoney(afterTax * a.pct)}</div>
                    <div className="text-[11px] text-xo-faint">{Math.round(a.pct * 100)}%</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      </div>

      <Section title="After the wire" className="border border-xo-line"
        foot="Illustrative planning only — not tax, legal or investment advice.">
        <ul className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-3">
          {[
            { h: "Tax & structure", b: `Reserve ${fmtMoney(taxDue)} now; explore QSBS exclusion, installment treatment on the earnout, and a DAF for the giving tranche.` },
            { h: "Diversify the position", b: `Stagger sales of any stock consideration through the lock-up; rebalance ${Math.round(ALLOC[0].pct * 100)}% into a diversified portfolio.` },
            { h: "The next chapter", b: "Reinvest the operator edge — angel checks, a holdco, or the next company. ExitOS keeps the readiness clock running for round two." },
          ].map((c) => (
            <li key={c.h} className="bg-xo-panel px-4 py-3">
              <h3 className="text-[13px] font-semibold">{c.h}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-xo-muted">{c.b}</p>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

export default Wealth;

import React, { useMemo } from "react";
import { DemoExample } from "../components/DemoExample";
import { fmtMoney } from "../lib/ui";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { PageHeader, Section, Metric, Provenance } from "../components/xo";
import { SAMPLE_COMPANY } from "../lib/profile";
import { loadActiveCompany } from "../lib/active-company";
import { buildMarketTape } from "../lib/market-tape";
import { OFFER_WATERFALLS, SAMPLE_OFFERS, OFFER_COMPARISON, CAPTABLE_ANALYSIS } from "../lib/engines";

// Wealth Transition — the stage most M&A platforms ignore. The deal closes;
// the founder's job shifts from building a company to stewarding the
// proceeds. This surface takes the leading offer's waterfall through a flat
// tax assumption, lays out when each tranche becomes liquid (cash, escrow,
// stock, earnout) by the offer terms, and shows an illustrative allocation
// template and a checklist of post-exit topics.

const TAX = 0.238; // blended LTCG + NIIT estimate — illustrative; the engine has no tax model

const ALLOC: { label: string; pct: number; note: string; tint: string }[] = [
  { label: "Diversified portfolio", pct: 0.55, note: "Out of a single illiquid position", tint: "#2F6B3F" },
  { label: "Next venture / angel",  pct: 0.20, note: "Reinvest the operator edge",        tint: "#9A7536" },
  { label: "Real assets",           pct: 0.15, note: "Property, inflation hedge",          tint: "#a78bfa" },
  { label: "Giving / DAF",          pct: 0.10, note: "Donor-advised fund, tax-efficient",  tint: "#9A6A12" },
];

const WealthDemo: React.FC = () => {
  // Offers and the cap table are the demo company's samples; an intake holds
  // neither, so this page stays on demo data and says so.
  const { fromIntake } = useMemo(() => loadActiveCompany(), []);
  const leadingOffer = SAMPLE_OFFERS.find((o) => o.offerId === OFFER_COMPARISON.leader) ?? SAMPLE_OFFERS[0];
  const wf = (OFFER_WATERFALLS.find((w) => w.offerId === leadingOffer.offerId) ?? OFFER_WATERFALLS[0]).waterfall;

  // The founder group = every founder-role holder in the cap table (the
  // engine's split). Nominal amounts first; the engine's risk-adjusted value
  // (stock and earnout haircuts) is shown separately, never mixed in.
  const founders = wf.distributions.filter((d) => d.role === "founder");
  const sum = (f: (d: typeof founders[number]) => number): number => founders.reduce((s, d) => s + f(d), 0);
  const founderGross = sum((d) => d.grossProceedsUsd);
  const founderCash = sum((d) => d.cashUsd);
  const founderStock = sum((d) => d.stockValueUsd);
  const founderEarnout = sum((d) => d.earnoutValueUsd);
  const riskAdjusted = wf.netToFoundersUsd;
  const taxDue = founderGross * TAX;
  const afterTax = founderGross - taxDue;

  // Escrow is a term of the offer ("15% / 24mo"): that share of the price is
  // held back from the cash at close, pro rata, until release.
  const escrowTerm = leadingOffer.terms.find((t) => t.category === "escrow");
  const escrowPct = escrowTerm?.numeric ?? 0;
  const escrowMonths = escrowTerm?.value.match(/(\d+)\s*mo/)?.[1];
  const founderEscrow = Math.min(founderCash, founderGross * escrowPct);
  const net = 1 - TAX;

  // Liquidity timeline — when each tranche lands (after the tax assumption).
  const tranches = [
    { label: "Cash at close",  when: "day 0", usd: (founderCash - founderEscrow) * net },
    { label: "Escrow release", when: escrowMonths ? `after ${escrowMonths} months, if no claims` : "per the escrow term", usd: founderEscrow * net },
    { label: "Stock",          when: "lock-up not in the offer terms", usd: founderStock * net },
    { label: "Earnout",        when: "milestones and timing not in the offer terms", usd: founderEarnout * net },
  ];

  const cascade = [
    { label: "Offer headline",   value: leadingOffer.headlinePriceUsd, note: leadingOffer.buyerName },
    { label: "Preference stack", value: wf.preferenceTotalUsd,         note: "paid to preferred holders first" },
    { label: "Founders' gross",  value: founderGross,                  note: `${founders.length} founder holders · ${(CAPTABLE_ANALYSIS.ownershipByRole.founder * 100).toFixed(1)}% founder stake` },
    { label: "After taxes",      value: afterTax,                      note: `flat ${(TAX * 100).toFixed(1)}% tax assumption` },
  ];

  const portfolioUsd = afterTax * ALLOC[0].pct;
  const tape = useMemo(() => buildMarketTape(), []);

  // Topics to plan after the wire. Amounts only where the page computes one
  // (the tax estimate); the family-office line applies a stated rule.
  const foViable = afterTax >= 50_000_000;
  const tracker: { label: string; value?: string; note: string }[] = [
    { label: "Tax Planning",             value: fmtMoney(taxDue), note: "flat-rate estimate · review QSBS and instalment treatment of the earnout" },
    { label: "Trust Structures",         note: "GRAT / family trust for estate efficiency" },
    { label: "Family Office",            value: foViable ? "Single-family office" : "Multi-family office", note: `rule of thumb used here: a dedicated office at $50M or more after tax (${fmtMoney(afterTax)})` },
    { label: "Investment Opportunities", note: "diversified market portfolio" },
    { label: "Angel Investing",          note: "operator-edge angel checks" },
    { label: "Private Equity",           note: "co-invest / fund commitments" },
    { label: "Real Estate",              note: "property · inflation hedge" },
    { label: "Philanthropy",             note: "donor-advised fund · tax-efficient" },
    { label: "Next Venture",             note: "the next company · holdco" },
  ];

  return (
    <div data-page="liquidity-transition" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Wealth · Liquidity · Demo company: ${SAMPLE_COMPANY.name}`} title="Liquidity &amp; Transition"
        badge={<><Provenance kind="demo" /><span className="text-[12px] text-xo-muted">After the wire</span></>}
        description={<>Sample offers and the sample cap table of the demo company ({SAMPLE_COMPANY.name}).{fromIntake ? " Your intake has no offers or cap table, so these figures are not yours." : ""}</>} />

      <section aria-label="Proceeds summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-3">
        <div className="bg-xo-panel"><Metric label="After-tax, founder group" emphasis value={<span className="text-xo-verified">{fmtMoney(afterTax)}</span>} sub={leadingOffer.buyerName} /></div>
        <div className="bg-xo-panel"><Metric label="Tax reserve" value={fmtMoney(taxDue)} sub={`flat ${(TAX * 100).toFixed(1)}% assumption`} /></div>
        <div className="bg-xo-panel"><Metric label="To portfolio" value={fmtMoney(portfolioUsd)} sub={`illustrative template · ${Math.round(ALLOC[0].pct * 100)}%`} /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <Section title="Illustrative next step" eyebrow="Banker's take" className="border border-xo-line"
        right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">{fmtMoney(portfolioUsd)}</span>}>
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">Illustrative: once the stock can be sold, the template below moves <span className="font-semibold">{Math.round(ALLOC[0].pct * 100)}%</span> of after-tax proceeds out of a concentrated position into a diversified portfolio. A template, not a recommendation.</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="At stake"><span className="font-mono font-semibold text-xo-verified">{fmtMoney(afterTax)}</span> after tax to the founder group from the {leadingOffer.buyerName} offer, if every tranche pays in full.</TakeCell>
            <TakeCell k="If you wait">Holding the position concentrated re-exposes your liquidity to a single company's risk after you've already de-risked the exit.</TakeCell>
            <TakeCell k="First">Reserve <span className="font-mono">{fmtMoney(taxDue)}</span> for taxes before allocating anything else.</TakeCell>
            <TakeCell k="What ExitOS does">Runs the cap-table waterfall on the leading offer, applies a flat tax assumption and lays out the tranches by the offer terms. Nothing is scheduled or executed.</TakeCell>
          </dl>
        </div>
      </Section>

      <Section title={`What you walk away with · ${leadingOffer.buyerName}`} eyebrow="Proceeds cascade" className="border border-xo-line"
        foot={`Tax assumption: a flat ${(TAX * 100).toFixed(1)}% (US federal long-term capital gains 20% + net investment income tax 3.8%) on the whole amount — no cost basis, state tax, QSBS exclusion or instalment timing. ExitOS has no tax model; take tax advice.`}>
        <ol className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
          {cascade.map((s, i) => (
            <li key={s.label} className="bg-xo-panel px-4 py-3">
              <div className="text-[11px] font-medium text-xo-muted"><span aria-hidden className="text-xo-faint">{i > 0 ? "→ " : ""}</span>{s.label}</div>
              <div className={`mt-1 font-mono text-[20px] font-semibold tabular-nums ${i === cascade.length - 1 ? "text-xo-verified" : "text-xo-text"}`}>{fmtMoney(s.value)}</div>
              <div className="mt-0.5 text-[11px] text-xo-faint">{s.note}</div>
            </li>
          ))}
        </ol>
        <p className="border-t border-xo-line px-4 py-2 text-[12px] text-xo-muted">Risk-adjusted value (engine): <span className="font-mono font-semibold tabular-nums text-xo-text">{fmtMoney(riskAdjusted)}</span> before tax — stock discounted 15% for illiquidity and earnout 45% for the chance it does not pay. The figures above assume every tranche pays in full.</p>
      </Section>

      <Section title="Topics to plan after the wire" eyebrow="Checklist" className="border border-xo-line"
        foot="A checklist of topics, not a plan in progress: nothing here is allocated, reserved or set up.">
        <ul className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 lg:grid-cols-3">
          {tracker.map((t) => (
            <li key={t.label} className="bg-xo-panel px-4 py-3">
              <h3 className="text-[12px] font-semibold text-xo-muted">{t.label}</h3>
              {t.value && <div className="mt-1 font-mono text-[17px] font-semibold tabular-nums">{t.value}</div>}
              <div className="mt-0.5 text-[12px] text-xo-muted">{t.note}</div>
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-2">
        <Section title="When your money lands">
          <div className="px-4 py-3">
            <p className="text-[12px] text-xo-muted">Founder group, after tax, by consideration mix — {Math.round(leadingOffer.cashPct * 100)}% cash · {Math.round(leadingOffer.stockPct * 100)}% stock · {Math.round(leadingOffer.earnoutPct * 100)}% earnout{escrowTerm ? <>; escrow {escrowTerm.value} held back from the cash</> : null}.</p>
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
              Liquid on day one: <span className="font-mono font-semibold text-xo-verified">{fmtMoney(tranches[0].usd)}</span> — escrow, stock and earnout follow on their own terms.
            </p>
          </div>
        </Section>

        <Section title="Illustrative allocation template" foot="A fixed template (55 / 20 / 15 / 10) applied to the after-tax figure — not a recommendation for this founder.">
          <div className="px-4 py-3">
            <p className="text-[12px] text-xo-muted">The template applied to {fmtMoney(afterTax)} after tax.</p>
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
            { h: "Diversify the position", b: `Stagger sales of any stock consideration through the lock-up; the template rebalances ${Math.round(ALLOC[0].pct * 100)}% into a diversified portfolio.` },
            { h: "The next chapter", b: "Reinvest the operator edge — angel checks, a holdco, or the next company. For a new company, start again from Value My Company." },
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

// With a saved intake the founder's own records are shown (none yet), and the
// demo company's example only on request.
const Wealth: React.FC = () => {
  const { fromIntake } = useMemo(() => loadActiveCompany(), []);
  return (
    <DemoExample fromIntake={fromIntake} page={{ id: "wealth", eyebrow: "◉ Founder · Liquidity", title: "Liquidity & Transition" }}
      title="No offer or cap table to model proceeds from" demo={<WealthDemo />}>
      <>Proceeds depend on a real offer and your cap table, and ExitOS holds neither for your company yet. Your valuation is on Value my company; it is not an offer.</>
    </DemoExample>
  );
};

export default Wealth;

import React, { useMemo, useState } from "react";
import { Button, Modal, Field, inputCls, fmtMoney, copyText, notify } from "../lib/ui";
import { PageHeader, Section, Metric, Provenance, XO_INPUT, XO_LABEL } from "../components/xo";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { SAMPLE_COMPANY } from "../lib/profile";
import { parseNumber } from "../lib/intake-fields";
import { loadActiveCompany } from "../lib/active-company";
import { buildMarketTape } from "../lib/market-tape";
import { OFFER_EVALUATIONS, OFFER_COMPARISON, NEGOTIATION_STATE, RESERVATION_LINES, VALUATION_CANONICAL } from "../lib/engines";

/** The engine's stage code as a reader's word ("loi" → "LOI", "diligence" → "Diligence"). */
const stageName = (stage: string): string => (stage === "loi" ? "LOI" : stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, " "));

interface Reserve { minHeadlinePriceUsd: number; minCashPct: number; maxEarnoutPct: number; premiumOverride: number | null }

const REC_CLS: Record<string, string> = {
  accept: "text-xo-verified", counter: "text-xo-caution", engage: "text-xo-action", decline: "text-xo-risk",
};

const LEV_CLS: Record<string, string> = {
  high: "text-xo-verified", medium: "text-xo-caution", low: "text-xo-risk",
};

// Counteroffer generator — produces an ACTUAL draft counter, not advice. The
// counter price anchors above the strategic-mid (with a leverage-scaled
// premium), the structure shifts toward the founder's reservation lines, and a
// justification is composed from growth, strategic premium and the leverage
// posture. Output is a ready-to-send response.
type Offer = typeof OFFER_EVALUATIONS[number]["offer"];
function generateCounter(offer: Offer, reserve: Reserve) {
  const strategicMid = VALUATION_CANONICAL.headline.mid;
  const strategicHigh = VALUATION_CANONICAL.headline.high;
  const lev = NEGOTIATION_STATE.leverage;
  // anchor: max of strategic-mid and the offer, plus a leverage-scaled premium
  // (or the founder's manual override from the Adjust counter modal)
  const premiumPct = reserve.premiumOverride ?? (lev === "high" ? 0.18 : lev === "medium" ? 0.12 : 0.07);
  const anchor = Math.max(strategicMid, offer.headlinePriceUsd) * (1 + premiumPct);
  const counterPrice = Math.min(strategicHigh * 1.05, Math.round(anchor / 1_000_000) * 1_000_000);
  const upliftPct = ((counterPrice - offer.headlinePriceUsd) / offer.headlinePriceUsd) * 100;
  // structure: pull cash up to the reservation floor, earnout down to the cap
  const cashPct = Math.max(offer.cashPct, reserve.minCashPct);
  const earnoutPct = Math.min(offer.earnoutPct, reserve.maxEarnoutPct);
  const stockPct = Math.max(0, 1 - cashPct - earnoutPct);
  const justification = [
    `${(SAMPLE_GROWTH * 100).toFixed(0)}% ARR growth supports a forward multiple above the submitted bid`,
    `enterprise value (institutional framework) is ${fmtMoney(strategicMid)} — the offer sits below it`,
    `${lev} competitive leverage: ${NEGOTIATION_STATE.activeOffers} active offer${NEGOTIATION_STATE.activeOffers === 1 ? "" : "s"} in process`,
    `cash weighting raised to ${(cashPct * 100).toFixed(0)}% and earnout capped at ${(earnoutPct * 100).toFixed(0)}% to align with deal-certainty requirements`,
  ];
  return { counterPrice, upliftPct, cashPct, stockPct, earnoutPct, justification, strategicMid };
}
// The offers belong to the demo company, so the draft and justification use
// its profile rather than hard-coded figures.
const SAMPLE_GROWTH = SAMPLE_COMPANY.growth.arrGrowthYoyPct;

// Negotiating positions — the founder sets their lines (minimum, ideal,
// walk-away); the lists below are standard templates with fixed figures,
// shown as a starting point for advisers, not legal advice.
interface Thresholds { minUsd: number; idealUsd: number; walkUsd: number; }
function autonomousTerms(offer: Offer | undefined, t: Thresholds): { clauses: string[]; earnouts: string[]; protections: string[] } {
  const earnoutPct = offer?.earnoutPct ?? 0;
  const clauses = [
    `Reverse break-up fee of 4% (${fmtMoney(t.minUsd * 0.04)}) if the buyer fails to close on agreed terms`,
    "Narrow the Material Adverse Change definition to exclude market- and sector-wide events",
    "Cap general indemnity at 10% of consideration; 18-month survival on standard reps",
    "Anti-sandbagging carve-out so disclosed items can't be clawed back post-close",
  ];
  const earnouts = earnoutPct > 0 ? [
    `All-cash alternative at ${fmtMoney(t.minUsd)} — trade the ${Math.round(earnoutPct * 100)}% earnout for certainty`,
    "Shorter 12-month earnout with an 80% cash floor and objective, audited milestones",
    "Convert the earnout to a vendor loan note at 8% — a fixed return, not performance-contingent",
  ] : [
    "Hold the all-cash structure — no earnout exposure to defend in diligence",
    `Offer a 10% management rollover to pull the buyer toward your ideal of ${fmtMoney(t.idealUsd)}`,
  ];
  const protections = [
    "Escrow capped at 8% of consideration, released in 12 months",
    "No personal guarantees or indemnities from the founders beyond escrow",
    "Buyer-funded key-employee retention pool to de-risk the transition",
    "Structure as a stock sale where QSBS treatment applies — protect the after-tax proceeds",
  ];
  return { clauses, earnouts, protections };
}

const Negotiator: React.FC = () => {
  // The engine's leading offer (OFFER_COMPARISON.leader is an offer id) —
  // selected by default and shown as the leading bid whatever is selected.
  const leader = OFFER_EVALUATIONS.find((e) => e.offer.offerId === OFFER_COMPARISON.leader) ?? OFFER_EVALUATIONS[0];
  const [activeId, setActiveId] = useState(leader?.offer.offerId ?? "");
  const active = OFFER_EVALUATIONS.find((e) => e.offer.offerId === activeId) ?? OFFER_EVALUATIONS[0];
  const reserveMid = VALUATION_CANONICAL.headline.mid;
  const [reserve, setReserve] = useState<Reserve>({
    minHeadlinePriceUsd: RESERVATION_LINES.minHeadlinePriceUsd,
    minCashPct: RESERVATION_LINES.minCashPct,
    maxEarnoutPct: RESERVATION_LINES.maxEarnoutPct,
    premiumOverride: null,
  });
  const counter = active ? generateCounter(active.offer, reserve) : null;
  const [draftOpen, setDraftOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);

  // Your lines, typed in dollars. Invalid entries are flagged and the last
  // default stands in; the order walk-away ≤ minimum ≤ ideal is checked.
  const DEF = { walk: Math.round(RESERVATION_LINES.minHeadlinePriceUsd * 0.95), min: RESERVATION_LINES.minHeadlinePriceUsd, ideal: Math.round(VALUATION_CANONICAL.headline.high) };
  // shown with thousands separators ("71,250,000"), regrouped when a field is left; commas are ignored when read
  const grouped = (n: number): string => Math.round(n).toLocaleString("en-US");
  const [walkTxt, setWalkTxt]   = useState(grouped(DEF.walk));
  const [minTxt, setMinTxt]     = useState(grouped(DEF.min));
  const [idealTxt, setIdealTxt] = useState(grouped(DEF.ideal));
  const usd = (t: string) => parseNumber(t, { min: 0, max: 1e13 });
  const regroup = (t: string): string => { const p = usd(t); return p.ok ? grouped(p.value) : t; };
  const walkP = usd(walkTxt), minP = usd(minTxt), idealP = usd(idealTxt);
  const walkUsd = walkP.ok ? walkP.value : DEF.walk;
  const minUsd = minP.ok ? minP.value : DEF.min;
  const idealUsd = idealP.ok ? idealP.value : DEF.ideal;
  const errWalk = !walkP.ok ? `${walkP.error} Using ${fmtMoney(DEF.walk)}.` : walkUsd > minUsd ? "Walk-away is above your minimum." : undefined;
  const errMin = !minP.ok ? `${minP.error} Using ${fmtMoney(DEF.min)}.` : minUsd > idealUsd ? "Minimum is above your ideal." : undefined;
  const errIdeal = !idealP.ok ? `${idealP.error} Using ${fmtMoney(DEF.ideal)}.` : undefined;
  const terms = autonomousTerms(active?.offer, { minUsd, idealUsd, walkUsd });
  const { fromIntake } = useMemo(() => loadActiveCompany(), []);

  const draftText = active && counter
    ? `[SAMPLE — a reply to one of the demo company's sample offers (${SAMPLE_COMPANY.name}). Not for sending.]

Re: Acquisition of ${SAMPLE_COMPANY.name} — response to your ${fmtMoney(active.offer.headlinePriceUsd)} proposal

Dear ${active.offer.buyerName} team,

Thank you for the proposal. We value the engagement and believe a transaction is achievable. After review against our valuation and the other offers we have received, we are countering as follows:

  • Headline consideration: ${fmtMoney(counter.counterPrice)} (a ${counter.upliftPct.toFixed(0)}% increase on the submitted bid)
  • Consideration mix: ${(counter.cashPct * 100).toFixed(0)}% cash / ${(counter.stockPct * 100).toFixed(0)}% stock / ${(counter.earnoutPct * 100).toFixed(0)}% earnout

This reflects:
  - ${(SAMPLE_GROWTH * 100).toFixed(0)}% ARR growth and the forward trajectory of the business
  - an enterprise value of ${fmtMoney(counter.strategicMid)}
  - ${NEGOTIATION_STATE.activeOffers} active offer(s) currently in our process

We are prepared to move quickly toward a definitive agreement on these terms. We propose a call this week to align on structure and timeline.

Best regards,
[Your name] — on behalf of ${SAMPLE_COMPANY.name}`
    : "";

  return (
    <div data-page="bid-room" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Operator · Negotiation desk · Demo company: ${SAMPLE_COMPANY.name}`} title="Bid Room"
        description={<>Sample offers of the demo company ({SAMPLE_COMPANY.name}).{fromIntake ? " Your intake has no offers, so these are not yours." : ""}</>}
        badge={<><Provenance kind="demo" /><span className="text-[12px] text-xo-muted">Stage: {stageName(NEGOTIATION_STATE.stage)} · Leverage {NEGOTIATION_STATE.leverage}</span></>}
        actions={<>
          <Button variant="ghost" onClick={() => setReserveOpen(true)}>Edit reservation lines</Button>
          <Button onClick={() => setDraftOpen(true)}>Generate counter</Button>
        </>} />

      <section aria-label="Negotiation summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Active offers" value={String(NEGOTIATION_STATE.activeOffers)} sub={stageName(NEGOTIATION_STATE.stage)} /></div>
        <div className="bg-xo-panel"><Metric label="Leverage" value={<span className="capitalize">{NEGOTIATION_STATE.leverage}</span>} sub="market posture" /></div>
        <div className="bg-xo-panel"><Metric label="Leading bid" emphasis value={leader ? `${leader.score.toFixed(0)}/100` : "—"} sub={leader?.offer.buyerName} /></div>
        <div className="bg-xo-panel"><Metric label="Enterprise value" value={fmtMoney(reserveMid)} sub="institutional framework · counter reference" /></div>
      </section>

      <RegistryTape items={buildMarketTape()} asOf={DNA_AS_OF.slice(0, 10)} />

      <Modal open={reserveOpen} onClose={() => setReserveOpen(false)} title="Reservation lines & counter" subtitle="These shape the counter price and structure" size="md"
        footer={<><Button variant="ghost" onClick={() => setReserve({ minHeadlinePriceUsd: RESERVATION_LINES.minHeadlinePriceUsd, minCashPct: RESERVATION_LINES.minCashPct, maxEarnoutPct: RESERVATION_LINES.maxEarnoutPct, premiumOverride: null })}>Reset</Button><Button onClick={() => { setReserveOpen(false); notify("Reservation lines updated"); }}>Apply</Button></>}>
        <div className="space-y-4">
          <Field label="Headline floor (walk-away below this)" hint="Recorded for reference; the counter rule uses the cash, earnout and premium settings below.">
            <input type="number" step={1_000_000} min={0} value={reserve.minHeadlinePriceUsd} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n) && n >= 0) setReserve((r) => ({ ...r, minHeadlinePriceUsd: n })); }} className={inputCls} />
          </Field>
          <Field label={`Minimum cash — ${(reserve.minCashPct * 100).toFixed(0)}%`}>
            <input type="range" min={50} max={100} step={5} value={reserve.minCashPct * 100} onChange={(e) => setReserve((r) => ({ ...r, minCashPct: Number(e.target.value) / 100 }))} className="w-full accent-deal-500" />
          </Field>
          <Field label={`Max earnout — ${(reserve.maxEarnoutPct * 100).toFixed(0)}%`}>
            <input type="range" min={0} max={40} step={5} value={reserve.maxEarnoutPct * 100} onChange={(e) => setReserve((r) => ({ ...r, maxEarnoutPct: Number(e.target.value) / 100 }))} className="w-full accent-deal-500" />
          </Field>
          <Field label={`Counter premium — ${reserve.premiumOverride == null ? "auto (leverage-scaled)" : `${Math.round(reserve.premiumOverride * 100)}% over anchor`}`} hint="Override the leverage-scaled premium on the counter price">
            <input type="range" min={0} max={30} step={1} value={reserve.premiumOverride == null ? 12 : Math.round(reserve.premiumOverride * 100)} onChange={(e) => setReserve((r) => ({ ...r, premiumOverride: Number(e.target.value) / 100 }))} className="w-full accent-deal-500" />
          </Field>
          {counter && active && (
            <p className="border border-xo-line px-3 py-2 text-[13px] text-white/80">
              Counter previews at <span className="font-mono font-semibold">{fmtMoney(counter.counterPrice)}</span> (+{counter.upliftPct.toFixed(0)}%) · {(counter.cashPct * 100).toFixed(0)}% cash / {(counter.earnoutPct * 100).toFixed(0)}% earnout.
            </p>
          )}
        </div>
      </Modal>

      {active && counter && (
        <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
          right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">+{counter.upliftPct.toFixed(0)}%</span>}>
          <div className="px-4 py-3">
            <p className="text-[14px] leading-relaxed">{NEGOTIATION_STATE.nextMove}</p>
            <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
              <TakeCell k="At stake">Counter at <span className="font-mono font-semibold text-xo-verified">{fmtMoney(counter.counterPrice)}</span> — +{counter.upliftPct.toFixed(0)}% on the {fmtMoney(active.offer.headlinePriceUsd)} bid.</TakeCell>
              <TakeCell k="If you wait">Accepting the first bid may leave value on the table; leverage is {NEGOTIATION_STATE.leverage} on the offers in hand.</TakeCell>
              <TakeCell k="Pursue">{leader ? <>Lead with <span className="text-xo-text">{leader.offer.buyerName}</span> — your strongest bid at {leader.score.toFixed(0)}/100.</> : null}{leader && leader.offer.offerId !== active.offer.offerId ? <> The counter shown is for {active.offer.buyerName}.</> : null}</TakeCell>
              <TakeCell k="What ExitOS does">Scores every offer and drafts a counter and a response from the stated rules. You review the draft and send it yourself.</TakeCell>
            </dl>
            <button type="button" onClick={() => setDraftOpen(true)} className="mt-3 rounded-sm bg-deal-700 px-4 py-2 text-[13px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Draft the response →</button>
          </div>
        </Section>
      )}

      <Section title="Negotiating positions" eyebrow="Standard templates — not legal advice" className="border border-xo-line">
        <div className="px-4 py-3">
          <p className="text-[12px] text-xo-muted">Set your lines. The clauses, earnout alternatives and protections below are standard negotiating positions with fixed figures (for example a 4% reverse break fee) — a starting list to take to your advisers, not legal advice.</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <XField id="neg-walk" label="Walk away ($)" error={errWalk}><input id="neg-walk" inputMode="numeric" value={walkTxt} aria-invalid={errWalk ? true : undefined} aria-describedby={errWalk ? "neg-walk-err" : undefined} onChange={(e) => setWalkTxt(e.target.value)} onBlur={() => setWalkTxt(regroup)} className={`${XO_INPUT} font-mono tabular-nums`} /></XField>
            <XField id="neg-min" label="Minimum ($)" error={errMin}><input id="neg-min" inputMode="numeric" value={minTxt} aria-invalid={errMin ? true : undefined} aria-describedby={errMin ? "neg-min-err" : undefined} onChange={(e) => setMinTxt(e.target.value)} onBlur={() => setMinTxt(regroup)} className={`${XO_INPUT} font-mono tabular-nums`} /></XField>
            <XField id="neg-ideal" label="Ideal ($)" error={errIdeal}><input id="neg-ideal" inputMode="numeric" value={idealTxt} aria-invalid={errIdeal ? true : undefined} aria-describedby={errIdeal ? "neg-ideal-err" : undefined} onChange={(e) => setIdealTxt(e.target.value)} onBlur={() => setIdealTxt(regroup)} className={`${XO_INPUT} font-mono tabular-nums`} /></XField>
          </div>
          <p className="mt-3 border border-xo-line px-3 py-2 text-[13px] text-xo-muted">
            Your lines: open at <span className="font-mono font-semibold text-xo-text">{fmtMoney(idealUsd)}</span>, concede no lower than <span className="font-mono font-semibold text-xo-text">{fmtMoney(minUsd)}</span>, and walk below <span className="font-mono font-semibold text-xo-risk">{fmtMoney(walkUsd)}</span>.
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <TermsList title="Protective clauses" items={terms.clauses} />
            <TermsList title="Earnout alternatives" items={terms.earnouts} />
            <TermsList title="Seller protections" items={terms.protections} />
          </div>
        </div>
      </Section>

      <Section title="Negotiation posture" className="border border-xo-line">
        <div className="px-4 py-3">
          <p className="text-[14px]"><span className="font-semibold">Next move:</span> {NEGOTIATION_STATE.nextMove}</p>
          {NEGOTIATION_STATE.recommendations.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-xo-muted">
              {NEGOTIATION_STATE.recommendations.map((r) => <li key={r}>{r}</li>)}
            </ul>
          )}
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-[280px_1fr]">
        <nav aria-label="Offers" className="bg-xo-panel p-2">
          <ul className="space-y-1">
            {OFFER_EVALUATIONS.map((e) => {
              const on = activeId === e.offer.offerId;
              return (
                <li key={e.offer.offerId}>
                  <button type="button" aria-current={on ? "true" : undefined} onClick={() => setActiveId(e.offer.offerId)}
                    className={`block w-full border px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action ${on ? "border-xo-verified/60 bg-xo-raise" : "border-xo-line hover:bg-xo-raise"}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase text-xo-faint">{e.offer.buyerType}</span>
                      <span className="font-mono text-[12px] text-xo-muted">{e.score.toFixed(0)}/100</span>
                    </div>
                    <div className="mt-1 text-[13px] font-medium">{e.offer.buyerName}</div>
                    <div className="mt-1 text-[12px] text-xo-muted">{fmtMoney(e.offer.headlinePriceUsd)} · {(e.offer.cashPct * 100).toFixed(0)}% cash · {(e.offer.stockPct * 100).toFixed(0)}% stock · {(e.offer.earnoutPct * 100).toFixed(0)}% earnout</div>
                    <span className={`mt-2 inline-block text-[12px] font-semibold capitalize ${REC_CLS[e.recommendation] ?? "text-xo-muted"}`}>{e.recommendation}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {active && (
          <section aria-labelledby="neg-active" className="min-w-0 bg-xo-panel px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-xo-line pb-3">
              <div>
                <h2 id="neg-active" className="font-serif text-[22px] font-semibold">{active.offer.buyerName}</h2>
                <div className="mt-1 text-[12px] text-xo-muted">{active.offer.buyerType} · received {new Date(active.offer.receivedAt).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-xo-faint">Score</div>
                <div className="font-mono text-[28px] text-xo-verified">{active.score.toFixed(0)}</div>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
              <Stat label="Headline" value={fmtMoney(active.offer.headlinePriceUsd)} />
              <Stat label="Cash" value={`${(active.offer.cashPct * 100).toFixed(0)}%`} />
              <Stat label="Net to founders" value={fmtMoney(active.impliedNetToFoundersUsd)} />
            </dl>

            {counter && (
              <div className="mt-4 border border-xo-line px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[12px] font-semibold text-xo-muted">Counteroffer (rule)</h3>
                  <span className="text-[12px] text-xo-faint">leverage: {NEGOTIATION_STATE.leverage}</span>
                </div>
                <dl className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
                  <div><dt className="text-[11px] text-xo-faint">Their offer</dt><dd className="font-mono text-[17px] text-xo-muted">{fmtMoney(active.offer.headlinePriceUsd)}</dd></div>
                  <div><dt className="text-[11px] text-xo-faint"><span aria-hidden>→ </span>Counter at</dt><dd className="font-mono text-[26px] font-semibold text-xo-verified">{fmtMoney(counter.counterPrice)}</dd><dd className="text-[12px] text-xo-verified">+{counter.upliftPct.toFixed(0)}% uplift</dd></div>
                  <div><dt className="text-[11px] text-xo-faint">Structure</dt><dd className="font-mono text-[13px]">{(counter.cashPct * 100).toFixed(0)}% cash · {(counter.stockPct * 100).toFixed(0)}% stock · {(counter.earnoutPct * 100).toFixed(0)}% earnout</dd></div>
                </dl>
                <h4 className="mt-3 text-[11px] font-semibold text-xo-faint">Justification</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-[12px] text-xo-muted">
                  {counter.justification.map((j) => <li key={j}>{j}</li>)}
                </ul>
                <p className="mt-3 text-[12px] text-xo-faint">Rule: anchor on the higher of the enterprise value and the offer, add a premium by leverage (high 18%, medium 12%, low 7%) or your override, cap at 105% of the high valuation; raise cash to your minimum and cap the earnout.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => setDraftOpen(true)}>✦ Generate response draft</Button>
                  <Button variant="ghost" onClick={() => setReserveOpen(true)}>Adjust counter</Button>
                </div>
              </div>
            )}

            <h3 className="mb-2 mt-5 font-serif text-[15px] font-semibold">Score breakdown</h3>
            <ul className="space-y-2">
              {Object.entries(active.dimensions).map(([k, d]) => (
                <li key={k}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-[12px]">
                    <span className="capitalize text-xo-muted">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                    <span className="font-mono">{d.score.toFixed(0)}/100 <span className="text-xo-faint">× {(d.weight * 100).toFixed(0)}%</span></span>
                  </div>
                  <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-xo-line"><div className="h-full rounded-full bg-xo-action" style={{ width: `${Math.max(2, d.score)}%` }} /></div>
                  <div className="mt-0.5 text-[12px] text-xo-faint">{d.comment}</div>
                </li>
              ))}
            </ul>

            {active.conflicts.length > 0 && (
              <>
                <h3 className="mb-2 mt-5 font-serif text-[15px] font-semibold">Conflicts</h3>
                <ul className="space-y-2">
                  {active.conflicts.map((c, i) => (
                    <li key={`${i}-${c.term}`} className="border border-xo-line px-3 py-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">{c.term}</span>
                        <span className={`text-[12px] font-semibold capitalize ${c.severity === "hard" ? "text-xo-risk" : "text-xo-caution"}`}>{c.severity}</span>
                      </div>
                      <p className="mt-1 text-[13px] text-xo-muted">{c.reason}</p>
                      {c.counterProposal && <p className="mt-1 text-[12px] text-xo-verified">→ {c.counterProposal}</p>}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {active.counterMoves.length > 0 && (
              <>
                <h3 className="mb-2 mt-5 font-serif text-[15px] font-semibold">Counter moves</h3>
                <ul className="list-disc space-y-1 pl-5 text-[13px] text-xo-muted">
                  {active.counterMoves.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </>
            )}
          </section>
        )}
      </div>

      <Section title="Cross-bid comparison" className="border border-xo-line">
        <div className="px-4 py-3">
          <p className="mb-3 text-[13px] text-xo-muted">{OFFER_COMPARISON.summary}</p>
          <dl className="space-y-2 text-[13px]">
            {OFFER_COMPARISON.delta.map((d) => (
              <div key={d.term} className="flex flex-wrap items-baseline gap-3">
                <dt className="font-mono text-[11px] uppercase text-xo-faint">{d.term}</dt>
                <dd className="text-xo-muted">{d.notes}</dd>
              </div>
            ))}
          </dl>
          <p className={`mt-3 text-[12px] font-semibold capitalize ${LEV_CLS[NEGOTIATION_STATE.leverage] ?? "text-xo-muted"}`}>Leverage: {NEGOTIATION_STATE.leverage}</p>
        </div>
      </Section>

      <Modal open={draftOpen && !!active && !!counter} onClose={() => setDraftOpen(false)} title={`Counter response · ${active?.offer.buyerName ?? ""}`} size="lg"
        footer={<><span className="mr-auto text-[12px] text-white/70">Nothing is sent from ExitOS — copy the draft into your own email.</span><Button onClick={() => copyText(draftText)}>Copy draft</Button></>}>
        <pre className="whitespace-pre-wrap border border-white/10 bg-ink-900/70 p-4 font-sans text-[13px] leading-relaxed text-white/85">{draftText}</pre>
      </Modal>
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

const XField: React.FC<{ id: string; label: string; children: React.ReactNode; error?: string }> = ({ id, label, children, error }) => (
  <div>
    <label htmlFor={id} className={XO_LABEL}>{label}</label>
    {children}
    {error && <p id={`${id}-err`} className="mt-1 text-[12px] text-xo-risk">{error}</p>}
  </div>
);

const TermsList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <h3 className="text-[12px] font-semibold text-xo-muted">{title}</h3>
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] text-xo-muted">
      {items.map((it) => <li key={it}>{it}</li>)}
    </ul>
  </div>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-[11px] text-xo-faint">{label}</dt>
    <dd className="mt-1 font-mono text-[15px] font-semibold">{value}</dd>
  </div>
);

export default Negotiator;

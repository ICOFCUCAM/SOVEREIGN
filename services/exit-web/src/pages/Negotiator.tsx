import React, { useState } from "react";
import { Button, Card, Kpi, Modal, SectionHeader, Field, inputCls, fmtMoney, copyText, notify } from "../lib/ui";
import { OFFER_EVALUATIONS, OFFER_COMPARISON, NEGOTIATION_STATE, RESERVATION_LINES, VALUATION_STRATEGIC } from "../lib/engines";
import { sendDeliverable } from "../lib/deliverables";
import BankerTake from "../components/BankerTake";

interface Reserve { minHeadlinePriceUsd: number; minCashPct: number; maxEarnoutPct: number; premiumOverride: number | null }

const REC_STYLE: Record<string, string> = {
  accept:  "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  counter: "bg-loi-500/15 text-loi-300 ring-loi-400/40",
  engage:  "bg-stage-engaged/15 text-stage-engaged ring-stage-engaged/40",
  decline: "bg-red-500/15 text-red-300 ring-red-400/40",
};

const SEVERITY_STYLE: Record<"soft" | "hard", string> = {
  soft: "bg-loi-500/15 text-loi-300",
  hard: "bg-red-500/15 text-red-300",
};

const LEV_STYLE: Record<string, string> = {
  high:   "text-deal-300",
  medium: "text-loi-300",
  low:    "text-red-300",
};

// Counteroffer generator — produces an ACTUAL draft counter, not advice. The
// counter price anchors above the strategic-mid (with a leverage-scaled
// premium), the structure shifts toward the founder's reservation lines, and a
// justification is composed from growth, strategic premium and the leverage
// posture. Output is a ready-to-send response.
type Offer = typeof OFFER_EVALUATIONS[number]["offer"];
function generateCounter(offer: Offer, reserve: Reserve) {
  const strategicMid = VALUATION_STRATEGIC.headline.mid;
  const strategicHigh = VALUATION_STRATEGIC.headline.high;
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
    `strategic-buyer valuation midpoint is ${fmtMoney(strategicMid)} — the offer sits below intrinsic strategic value`,
    `${lev} competitive leverage: ${NEGOTIATION_STATE.activeOffers} active offer${NEGOTIATION_STATE.activeOffers === 1 ? "" : "s"} in process`,
    `cash weighting raised to ${(cashPct * 100).toFixed(0)}% and earnout capped at ${(earnoutPct * 100).toFixed(0)}% to align with deal-certainty requirements`,
  ];
  return { counterPrice, upliftPct, cashPct, stockPct, earnoutPct, justification, strategicMid };
}
const SAMPLE_GROWTH = 0.42; // ARR growth from company profile (Helios)

// Autonomous Negotiation — the founder sets their lines (minimum, ideal,
// walk-away) and the AI generates the deal terms a junior banker + lawyer
// would: protective clauses, earnout alternatives and seller protections.
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
  const [activeId, setActiveId] = useState(OFFER_EVALUATIONS[0]?.offer.offerId ?? "");
  const active = OFFER_EVALUATIONS.find((e) => e.offer.offerId === activeId) ?? OFFER_EVALUATIONS[0];
  const reserveMid = VALUATION_STRATEGIC.headline.mid;
  const [reserve, setReserve] = useState<Reserve>({
    minHeadlinePriceUsd: RESERVATION_LINES.minHeadlinePriceUsd,
    minCashPct: RESERVATION_LINES.minCashPct,
    maxEarnoutPct: RESERVATION_LINES.maxEarnoutPct,
    premiumOverride: null,
  });
  const counter = active ? generateCounter(active.offer, reserve) : null;
  const [draftOpen, setDraftOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [counterSent, setCounterSent] = useState(false);

  const [walkUsd, setWalkUsd]   = useState(Math.round(RESERVATION_LINES.minHeadlinePriceUsd * 0.95));
  const [minUsd, setMinUsd]     = useState(RESERVATION_LINES.minHeadlinePriceUsd);
  const [idealUsd, setIdealUsd] = useState(Math.round(VALUATION_STRATEGIC.headline.high));
  const terms = autonomousTerms(active?.offer, { minUsd, idealUsd, walkUsd });

  const draftText = active && counter
    ? `Re: Acquisition of Helios Freight — response to your ${fmtMoney(active.offer.headlinePriceUsd)} proposal

Dear ${active.offer.buyerName} team,

Thank you for the proposal. We value the engagement and believe a transaction is achievable. After review against our valuation and the competitive process underway, we are countering as follows:

  • Headline consideration: ${fmtMoney(counter.counterPrice)} (a ${counter.upliftPct.toFixed(0)}% increase on the submitted bid)
  • Consideration mix: ${(counter.cashPct * 100).toFixed(0)}% cash / ${(counter.stockPct * 100).toFixed(0)}% stock / ${(counter.earnoutPct * 100).toFixed(0)}% earnout

This reflects:
  - ${SAMPLE_GROWTH * 100}% ARR growth and the forward trajectory of the business
  - a strategic-buyer valuation midpoint of ${fmtMoney(counter.strategicMid)}
  - ${NEGOTIATION_STATE.activeOffers} active offer(s) currently in our process

We are prepared to move quickly toward a definitive agreement on these terms. We propose a call this week to align on structure and timeline.

Best regards,
James — on behalf of Helios Freight`
    : "";

  return (
    <div>
      <SectionHeader
        kicker="Module 05 · Operator"
        title="AI Deal Negotiator"
        description={`Evaluating ${OFFER_EVALUATIONS.length} active offers against the founder's reservation lines (floor ${fmtMoney(reserve.minHeadlinePriceUsd)}; min cash ${(reserve.minCashPct * 100).toFixed(0)}%; max earnout ${(reserve.maxEarnoutPct * 100).toFixed(0)}%).`}
        actions={<><Button variant="ghost" onClick={() => setReserveOpen(true)}>Edit reservation lines</Button><Button onClick={() => setDraftOpen(true)}>Generate counter</Button></>}
      />

      {/* ── Edit reservation lines / adjust counter ───────────────── */}
      <Modal open={reserveOpen} onClose={() => setReserveOpen(false)} title="Reservation lines & counter" subtitle="These shape the counter price and structure" size="md"
        footer={<><Button variant="ghost" onClick={() => setReserve({ minHeadlinePriceUsd: RESERVATION_LINES.minHeadlinePriceUsd, minCashPct: RESERVATION_LINES.minCashPct, maxEarnoutPct: RESERVATION_LINES.maxEarnoutPct, premiumOverride: null })}>Reset</Button><Button onClick={() => { setReserveOpen(false); notify("Reservation lines updated"); }}>Apply</Button></>}>
        <div className="space-y-4">
          <Field label="Headline floor (walk-away below this)">
            <input type="number" step={1_000_000} min={0} value={reserve.minHeadlinePriceUsd} onChange={(e) => setReserve((r) => ({ ...r, minHeadlinePriceUsd: Number(e.target.value) }))} className={inputCls} />
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
            <div className="rounded-md border border-deal-500/30 bg-deal-600/[0.07] p-3 text-[12.5px] text-white/75">
              Counter previews at <span className="font-mono font-semibold text-deal-300">{fmtMoney(counter.counterPrice)}</span> (+{counter.upliftPct.toFixed(0)}%) · {(counter.cashPct * 100).toFixed(0)}% cash / {(counter.earnoutPct * 100).toFixed(0)}% earnout.
            </div>
          )}
        </div>
      </Modal>

      {active && counter && (
        <BankerTake
          next={NEGOTIATION_STATE.nextMove}
          stake={<>Counter at <span className="font-mono font-bold text-deal-300">{fmtMoney(counter.counterPrice)}</span> — <span className="text-deal-300">+{counter.upliftPct.toFixed(0)}%</span> on the {fmtMoney(active.offer.headlinePriceUsd)} bid.</>}
          inaction={<>Accepting the first bid leaves the strategic premium on the table; leverage is {NEGOTIATION_STATE.leverage}.</>}
          buyer={<>Lead with <span className="text-white">{active.offer.buyerName}</span> — your strongest bid at {active.score.toFixed(0)}/100.</>}
          automate={<>ExitOS scores every offer, drafts the counter and writes the ready-to-send response for you.</>}
          impact={<>+{counter.upliftPct.toFixed(0)}%</>}
          cta={{ label: "Draft the response", onClick: () => setDraftOpen(true) }}
        />
      )}

      {/* ── Autonomous Negotiation — set your lines, AI generates the terms ── */}
      <Card className="mb-8 p-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-deal-600/30 text-[10px] font-bold text-deal-200 ring-1 ring-deal-400/40">AI</span>
          <h2 className="font-serif text-base font-bold text-white">Autonomous Negotiation</h2>
        </div>
        <p className="mt-1 text-[12px] text-white/45">Set your lines — the AI anchors the counter, drafts the clauses, and engineers seller protections like a junior banker and lawyer.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Walk away">
            <input type="number" value={walkUsd} step={1_000_000} min={0} onChange={(e) => setWalkUsd(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Minimum">
            <input type="number" value={minUsd} step={1_000_000} min={0} onChange={(e) => setMinUsd(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Ideal">
            <input type="number" value={idealUsd} step={1_000_000} min={0} onChange={(e) => setIdealUsd(Number(e.target.value))} className={inputCls} />
          </Field>
        </div>
        <div className="mt-3 rounded-md border border-deal-500/20 bg-deal-600/[0.06] px-4 py-2.5 text-[12.5px] text-white/75">
          AI strategy: open at <span className="font-mono font-semibold text-deal-300">{fmtMoney(idealUsd)}</span>, concede no lower than <span className="font-mono font-semibold text-white">{fmtMoney(minUsd)}</span>, and walk below <span className="font-mono font-semibold text-red-300">{fmtMoney(walkUsd)}</span>.
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <TermsList title="Protective clauses" items={terms.clauses} dot="bg-deal-400" />
          <TermsList title="Earnout alternatives" items={terms.earnouts} dot="bg-loi-400" />
          <TermsList title="Seller protections" items={terms.protections} dot="bg-stage-engaged" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Active offers"    value={String(NEGOTIATION_STATE.activeOffers)} sub={`Stage: ${NEGOTIATION_STATE.stage}`} />
        <Kpi label="Leverage"         value={NEGOTIATION_STATE.leverage} sub="market posture"
             accent={NEGOTIATION_STATE.leverage === "high" ? "#34d399" : NEGOTIATION_STATE.leverage === "low" ? "#f87171" : "#fbbf24"} />
        <Kpi label="Leading bid"      value={active ? `${active.score.toFixed(0)}/100` : "—"} sub={active?.offer.buyerName} accent="#34d399" />
        <Kpi label="Strategic mid"    value={fmtMoney(reserveMid)} sub="valuation reference" />
      </div>

      <Card className="mt-8 p-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Negotiation posture</div>
        <p className="mt-2 text-sm text-white/85"><span className="font-semibold">Next move:</span> {NEGOTIATION_STATE.nextMove}</p>
        {NEGOTIATION_STATE.recommendations.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-[13px] text-white/65">
            {NEGOTIATION_STATE.recommendations.map((r) => (
              <li key={r} className="flex items-baseline gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-deal-400" /> {r}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-8 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {OFFER_EVALUATIONS.map((e) => (
            <button
              key={e.offer.offerId}
              onClick={() => setActiveId(e.offer.offerId)}
              className={`block w-full rounded-lg border p-4 text-left transition ${
                activeId === e.offer.offerId
                  ? "border-deal-400/50 bg-deal-600/10"
                  : "border-white/10 bg-ink-800/40 hover:border-white/20 hover:bg-ink-800/60"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{e.offer.buyerType}</span>
                <span className="font-mono text-[11px] text-white/55">{e.score.toFixed(0)}/100</span>
              </div>
              <div className="mt-1 text-sm font-medium text-white">{e.offer.buyerName}</div>
              <div className="mt-2 text-[11px] text-white/55">
                {fmtMoney(e.offer.headlinePriceUsd)} · {(e.offer.cashPct * 100).toFixed(0)}c · {(e.offer.stockPct * 100).toFixed(0)}s · {(e.offer.earnoutPct * 100).toFixed(0)}e
              </div>
              <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${REC_STYLE[e.recommendation]}`}>
                {e.recommendation}
              </span>
            </button>
          ))}
        </div>

        {active && (
          <Card className="p-6">
            <div className="mb-5 border-b border-white/10 pb-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white">{active.offer.buyerName}</h2>
                  <div className="mt-1 text-[12px] text-white/55">{active.offer.buyerType} · received {new Date(active.offer.receivedAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">Score</div>
                  <div className="font-mono text-3xl text-deal-300">{active.score.toFixed(0)}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
                <Stat label="Headline" value={fmtMoney(active.offer.headlinePriceUsd)} />
                <Stat label="Cash"     value={`${(active.offer.cashPct * 100).toFixed(0)}%`} />
                <Stat label="Net to founders" value={fmtMoney(active.impliedNetToFoundersUsd)} accent="#34d399" />
              </div>
            </div>

            {/* AI counteroffer — an actual draft, not advice */}
            {counter && (
              <div className="mb-6 rounded-lg border border-deal-500/30 bg-deal-600/5 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-deal-300">AI Counteroffer</div>
                  <span className="text-[11px] text-white/45">leverage: {NEGOTIATION_STATE.leverage}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-white/40">Their offer</div>
                    <div className="font-mono text-lg text-white/70">{fmtMoney(active.offer.headlinePriceUsd)}</div>
                  </div>
                  <div className="text-2xl text-white/30">→</div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-white/40">Counter at</div>
                    <div className="font-mono text-3xl font-bold text-deal-300">{fmtMoney(counter.counterPrice)}</div>
                    <div className="mt-0.5 text-[11px] text-deal-300">+{counter.upliftPct.toFixed(0)}% uplift</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-white/40">Structure</div>
                    <div className="font-mono text-sm text-white/80">{(counter.cashPct * 100).toFixed(0)}% cash · {(counter.stockPct * 100).toFixed(0)}% stock · {(counter.earnoutPct * 100).toFixed(0)}% earnout</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Justification</div>
                  <ul className="mt-1.5 space-y-1 text-[12px] text-white/70">
                    {counter.justification.map((j) => (
                      <li key={j} className="flex items-baseline gap-2"><span className="mt-1 inline-block h-1 w-1 rounded-full bg-deal-400" />{j}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setDraftOpen(true)}>✦ Generate response draft</Button>
                  <Button variant="ghost" onClick={() => setReserveOpen(true)}>Adjust counter</Button>
                </div>
              </div>
            )}

            <h3 className="mb-3 font-serif text-base font-bold text-white">Score breakdown</h3>
            <div className="space-y-2">
              {Object.entries(active.dimensions).map(([k, d]) => (
                <div key={k}>
                  <div className="mb-1 flex items-baseline justify-between text-[12px]">
                    <span className="capitalize text-white/70">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                    <span className="font-mono text-white/85">{d.score.toFixed(0)}/100 <span className="text-white/40">× {(d.weight * 100).toFixed(0)}%</span></span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-deal-700 to-deal-400" style={{ width: `${Math.max(2, d.score)}%` }} />
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/45">{d.comment}</div>
                </div>
              ))}
            </div>

            {active.conflicts.length > 0 && (
              <>
                <h3 className="mb-3 mt-6 font-serif text-base font-bold text-white">Conflicts</h3>
                <div className="space-y-2">
                  {active.conflicts.map((c, i) => (
                    <div key={`${i}-${c.term}`} className="rounded border border-white/10 bg-ink-900/50 p-3">
                      <div className="flex items-baseline justify-between">
                        <span className="font-medium text-white">{c.term}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_STYLE[c.severity]}`}>{c.severity}</span>
                      </div>
                      <p className="mt-1 text-[13px] text-white/65">{c.reason}</p>
                      {c.counterProposal && <p className="mt-1 text-[12px] text-deal-300">→ {c.counterProposal}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {active.counterMoves.length > 0 && (
              <>
                <h3 className="mb-3 mt-6 font-serif text-base font-bold text-white">Counter moves</h3>
                <ul className="space-y-1.5 text-[13px] text-white/75">
                  {active.counterMoves.map((m, i) => (
                    <li key={i} className="flex items-baseline gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-loi-400" /> {m}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-3 font-serif text-lg font-bold">Cross-bid comparison</h2>
        <Card className="p-5">
          <p className="mb-4 text-[13px] text-white/65">{OFFER_COMPARISON.summary}</p>
          <ul className="space-y-2 text-[13px] text-white/75">
            {OFFER_COMPARISON.delta.map((d) => (
              <li key={d.term} className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] uppercase tracking-wide text-white/40">{d.term}</span>
                <span>{d.notes}</span>
              </li>
            ))}
          </ul>
          <div className={`mt-4 text-[11px] uppercase tracking-[0.22em] ${LEV_STYLE[NEGOTIATION_STATE.leverage]}`}>
            Leverage: {NEGOTIATION_STATE.leverage}
          </div>
        </Card>
      </div>

      {/* ready-to-send counter draft */}
      {draftOpen && active && counter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDraftOpen(false)}>
          <div className="max-h-[85vh] max-w-2xl overflow-auto rounded-lg border border-white/10 bg-ink-800/95 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deal-300">Counter response · {active.offer.buyerName}</div>
              <button onClick={() => setDraftOpen(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap rounded-md border border-white/10 bg-ink-900/70 p-4 text-[13px] leading-relaxed text-white/80">{draftText}</pre>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => copyText(draftText)}>Copy</Button>
              <Button onClick={() => { sendDeliverable(`counter-${active.offer.buyerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`, draftText); setCounterSent(true); setDraftOpen(false); }}>{counterSent ? "Sent ✓ · resend" : "Send counter →"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TermsList: React.FC<{ title: string; items: string[]; dot: string }> = ({ title, items, dot }) => (
  <div>
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{title}</div>
    <ul className="mt-2 space-y-2 text-[12.5px] text-white/75">
      {items.map((it) => (
        <li key={it} className="flex items-baseline gap-2"><span className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />{it}</li>
      ))}
    </ul>
  </div>
);

const Stat: React.FC<{ label: string; value: string; accent?: string }> = ({ label, value, accent }) => (
  <div>
    <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">{label}</div>
    <div className="mt-1 font-mono text-base font-semibold" style={accent ? { color: accent } : undefined}>{value}</div>
  </div>
);

export default Negotiator;

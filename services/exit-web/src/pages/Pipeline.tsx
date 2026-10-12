import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { STAGE_ORDER, fmtMoney, timeAgo, type DealStage } from "../lib/ui";
import { Evidence } from "../lib/workstation";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { PageHeader, Section, Metric, ScrollRegion, Provenance } from "../components/xo";
import { SAMPLE_COMPANY } from "../lib/profile";
import { buildMarketTape } from "../lib/market-tape";
import { OFFER_EVALUATIONS, NEGOTIATION_STATE, BUYERS } from "../lib/engines";

// Acquisition Pipeline — kanban over the six negotiation stages.
// Offers from evaluateOffer feed the stage columns; the sourcing column
// lists top discovery candidates that have not been contacted. The negotiation engine's
// derived state drives the leverage banner + forecast.

interface PipelineDeal {
  readonly id: string;
  readonly buyer: string;
  readonly stage: DealStage;
  readonly amount?: number;
  readonly probability: number;
  readonly updatedAt: string;
  readonly score?: number;
  readonly recommendation?: string;
}

function stageFromOffer(rec: string): DealStage {
  switch (rec) {
    case 'accept':  return 'signed';
    case 'counter': return 'loi';
    case 'engage':  return 'engaged';
    case 'decline': return 'dead';
    default:        return 'diligence';
  }
}

function probFromScore(score: number, recommendation: string): number {
  if (recommendation === 'accept')  return Math.max(0.85, score / 100);
  if (recommendation === 'decline') return 0.05;
  if (recommendation === 'counter') return Math.max(0.45, score / 100 * 0.85);
  return Math.max(0.20, score / 100 * 0.5);
}

const DEALS: readonly PipelineDeal[] = [
  // Offers from the negotiation engine
  ...OFFER_EVALUATIONS.map<PipelineDeal>((e) => ({
    id: e.offer.offerId,
    buyer: e.offer.buyerName,
    stage: stageFromOffer(e.recommendation),
    amount: e.offer.headlinePriceUsd,
    probability: probFromScore(e.score, e.recommendation),
    updatedAt: e.offer.receivedAt,
    score: e.score,
    recommendation: e.recommendation,
  })),
];

// Sourcing column: the top-ranked buyers from discovery that have not made an
// offer. They are candidates only — not contacted, no amount, no probability,
// and not counted in any total.
const offerBuyers = new Set(OFFER_EVALUATIONS.map((e) => e.offer.buyerName));
const CANDIDATES = BUYERS.candidates.filter((c) => !offerBuyers.has(c.buyer.name)).slice(0, 3).map((c) => c.buyer.name);

// Close-probability rule — close probability, expected days and the
// probability-adjusted value for each active deal, from stage, offer score and
// recommendation (fixed rules, stated on the page), plus the stage's main risk.
const STAGE_BASE_DAYS: Record<DealStage, number> = {
  sourcing: 140, engaged: 96, diligence: 64, loi: 38, signed: 14, closed: 0, dead: 0,
};
const STAGE_RISK: Record<DealStage, string> = {
  sourcing: "No mutual NDA yet — buyer not formally engaged",
  engaged: "Indication of interest not yet received",
  diligence: "Legal & financial diligence incomplete",
  loi: "Definitive terms (escrow, indemnity) unresolved",
  signed: "Regulatory / closing conditions pending",
  closed: "—",
  dead: "Process terminated",
};
interface Forecast {
  readonly closeProbability: number;   // 0..1
  readonly expectedDays: number;       // to close
  readonly adjustedValue: number;      // probability-weighted
  readonly risk: string;
}
function forecast(d: PipelineDeal): Forecast {
  // expected days shrink as probability rises within the stage band
  const base = STAGE_BASE_DAYS[d.stage];
  const expectedDays = Math.max(7, Math.round(base * (1 - d.probability * 0.45)));
  const adjustedValue = (d.amount ?? 0) * d.probability;
  // low-probability deals in mid-stage flag the stage risk; otherwise momentum
  const risk =
    d.stage === "dead" ? STAGE_RISK.dead
    : d.probability < 0.4 && (d.stage === "diligence" || d.stage === "loi") ? STAGE_RISK[d.stage]
    : d.probability >= 0.7 ? "On track — maintain competitive tension"
    : STAGE_RISK[d.stage];
  return { closeProbability: d.probability, expectedDays, adjustedValue, risk };
}

function dealsByStage(stage: DealStage): readonly PipelineDeal[] {
  return DEALS.filter((d) => d.stage === stage);
}

function weighted(deals: readonly PipelineDeal[]): number {
  return deals.reduce((s, d) => s + (d.amount ?? 0) * d.probability, 0);
}

const LEV_CLS: Record<string, string> = { high: "text-xo-verified", medium: "text-xo-caution", low: "text-xo-risk" };
const STAGE_LABEL: Partial<Record<DealStage, string>> = { sourcing: "Sourcing", engaged: "Engaged", diligence: "Diligence", loi: "LOI", signed: "Signed", closed: "Closed", dead: "Dead" };
const STAGE_CLS: Partial<Record<DealStage, string>> = { sourcing: "text-xo-muted", engaged: "text-xo-action", diligence: "text-xo-caution", loi: "text-xo-caution", signed: "text-xo-verified", closed: "text-xo-verified", dead: "text-xo-faint" };

const Pipeline: React.FC = () => {
  const live = DEALS.filter((d) => d.stage !== 'dead');
  const totalWeighted = weighted(live);
  const lead = live.slice().sort((a, b) => b.probability - a.probability)[0];
  const leadF = lead ? forecast(lead) : null;
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="active-processes" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Exchange · Sourcing · Acquisition Pipeline" title="Active Processes"
        badge={<><Provenance kind="demo" /><span className="text-[12px] text-xo-muted">Six-stage process · Leverage {NEGOTIATION_STATE.leverage}</span></>}
        description={`The demo company's sample offers (${SAMPLE_COMPANY.name}) and its top discovery candidates. Saved intakes hold no offers, so this page stays on demo data.`} />

      <section aria-label="Pipeline summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-3 xl:grid-cols-5">
        <div className="bg-xo-panel"><Metric label="Active deals" value={String(live.length)} sub="offers, excluding dead" /></div>
        <div className="bg-xo-panel"><Metric label="Pipeline value" value={fmtMoney(live.reduce((s, d) => s + (d.amount ?? 0), 0))} sub="indicated" /></div>
        <div className="bg-xo-panel"><Metric label="Prob-weighted (rule)" emphasis value={<span className="text-xo-verified">{fmtMoney(totalWeighted)}</span>} sub="forecast" /></div>
        <div className="bg-xo-panel"><Metric label="Lead close" value={lead ? `${(lead.probability * 100).toFixed(0)}%` : "—"} sub={lead?.buyer} /></div>
        <div className="bg-xo-panel"><Metric label="Leverage" value={<span className="capitalize">{NEGOTIATION_STATE.leverage}</span>} sub="negotiation posture" /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
        right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">{fmtMoney(totalWeighted)}</span>}>
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">{NEGOTIATION_STATE.nextMove}</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-5">
            <TakeCell k="Today"><span className="font-mono">{live.length}</span> active deals · prob-weighted {fmtMoney(totalWeighted)} · leverage {NEGOTIATION_STATE.leverage}{lead ? <> · lead {lead.buyer} at {(lead.probability * 100).toFixed(0)}%{leadF ? ` · ~${leadF.expectedDays}d to close` : ""}</> : null}</TakeCell>
            <TakeCell k="At stake"><span className="font-mono font-semibold text-xo-verified">{fmtMoney(totalWeighted)}</span> probability-weighted across {live.length} active deals.</TakeCell>
            <TakeCell k="If you wait">{lead && leadF
              ? <>Your lead, <span className="text-xo-text">{lead.buyer}</span>, closes in ~{leadF.expectedDays}d. Lose tempo and a single-threaded process retrades the price.</>
              : <>No live offers — without competing bids you have no leverage to hold price.</>}</TakeCell>
            <TakeCell k="Pursue">{lead
              ? <><span className="text-xo-text">{lead.buyer}</span> — {(lead.probability * 100).toFixed(0)}% close{lead.amount ? <>, {fmtMoney(lead.amount)} indicated</> : null}{leadF ? <> · adj. value {fmtMoney(leadF.adjustedValue)}</> : null}.</>
              : "Re-engage the sourcing column to rebuild the funnel."}</TakeCell>
            <TakeCell k="What ExitOS does">Scores each offer and applies the stated close-probability rule. Counters are drafted in the Bid Room; follow-ups are not sequenced automatically.</TakeCell>
          </dl>
          <Link to="/console/negotiator" className="mt-3 inline-block rounded-sm bg-deal-700 px-4 py-2 text-[13px] font-semibold text-white hover:bg-deal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Open the negotiator →</Link>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-12">
        <Section title="Negotiation engine · posture" className="lg:col-span-4">
          <div className="px-4 py-3">
            <p className={`font-mono text-[13px] font-semibold uppercase ${LEV_CLS[NEGOTIATION_STATE.leverage] ?? ""}`}>{NEGOTIATION_STATE.leverage} leverage</p>
            <p className="mt-1.5 text-[13px]">{NEGOTIATION_STATE.nextMove}</p>
            {NEGOTIATION_STATE.recommendations.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-xo-muted">
                {NEGOTIATION_STATE.recommendations.map((r) => <li key={r}>{r}</li>)}
              </ul>
            )}
          </div>
        </Section>

        <Section title="Close-probability rule" className="lg:col-span-8"
          foot="Rule, not a prediction: close probability is at least 85% for an offer the engine says to accept, max(45%, 0.85 × score) for a counter, max(20%, 0.5 × score) otherwise, 5% for a decline. Expected days = the stage base (sourcing 140, engaged 96, diligence 64, LOI 38, signed 14) × (1 − 0.45 × probability). Adjusted value = amount × probability.">
          <ScrollRegion label="Deal probability table">
            <table className="w-full min-w-[680px] text-[12px]">
              <thead className="text-left text-[11px] text-xo-faint">
                <tr className="border-b border-xo-line">
                  <th scope="col" className="px-3 py-2 font-medium">Deal</th>
                  <th scope="col" className="px-2 py-2 font-medium">Stage</th>
                  <th scope="col" className="px-2 py-2 font-medium">Close prob</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Exp. close</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Adj. value</th>
                  <th scope="col" className="px-3 py-2 font-medium">Top risk</th>
                </tr>
              </thead>
              <tbody>
                {live.slice().sort((a, b) => b.probability - a.probability).map((d) => {
                  const f = forecast(d);
                  const pc = f.closeProbability >= 0.7 ? "text-xo-verified" : f.closeProbability >= 0.4 ? "text-xo-caution" : "text-xo-risk";
                  return (
                    <tr key={d.id} className="border-b border-xo-line last:border-0">
                      <th scope="row" className="px-3 py-1.5 text-left font-medium">{d.buyer}</th>
                      <td className="px-2 py-1.5"><StageWord stage={d.stage} /></td>
                      <td className="px-2 py-1.5">
                        <Evidence meta={{ methodology: f.risk, source: "stage progression · offer score · negotiation posture", confidence: `${d.stage} stage` }}>
                          <span className={`font-mono text-[12px] font-semibold ${pc}`}>{(f.closeProbability * 100).toFixed(0)}%</span>
                        </Evidence>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-muted">{f.expectedDays}d</td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-xo-verified">{fmtMoney(f.adjustedValue)}</td>
                      <td className="px-3 py-1.5 text-[12px] text-xo-muted">{f.risk}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollRegion>
        </Section>
      </div>

      <Section title="Pipeline by stage" className="border border-xo-line">
        <div className="grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-3 lg:grid-cols-6">
          {STAGE_ORDER.map((stage) => {
            const list = dealsByStage(stage);
            const stageValue = list.reduce((s, d) => s + (d.amount ?? 0), 0);
            return (
              <section key={stage} aria-label={`${STAGE_LABEL[stage] ?? stage} stage`} className="min-w-0 bg-xo-panel p-3">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-[12px] font-semibold"><StageWord stage={stage} /></h3>
                  <span className="font-mono text-[11px] text-xo-faint">{list.length}{stage === "sourcing" && CANDIDATES.length > 0 ? ` + ${CANDIDATES.length} candidates` : ""}</span>
                </div>
                <div className="mb-2 font-mono text-[11px] text-xo-faint">{stageValue > 0 ? fmtMoney(stageValue) : "—"}</div>
                <ul className="space-y-1.5">
                  {stage === "sourcing" && CANDIDATES.map((name) => (
                    <li key={`cand-${name}`} className="border border-dashed border-xo-line px-2 py-1.5">
                      <div className="text-[12px] font-medium leading-tight">{name}</div>
                      <div className="mt-0.5 text-[11px] text-xo-faint">candidate — not contacted</div>
                    </li>
                  ))}
                  {list.map((d) => {
                    const f = forecast(d);
                    return (
                      <li key={d.id} className="border border-xo-line px-2 py-1.5">
                        <div className="text-[12px] font-medium leading-tight">{d.buyer}</div>
                        <div className="mt-0.5 flex items-center justify-between text-[11px] text-xo-faint">
                          <span className="font-mono">{d.amount ? fmtMoney(d.amount) : "—"}</span>
                          <span>{timeAgo(d.updatedAt)}</span>
                        </div>
                        {d.stage !== "dead" && (
                          <div className="mt-0.5 flex items-center justify-between text-[11px]">
                            <span className="font-mono font-semibold">{(f.closeProbability * 100).toFixed(0)}%</span>
                            <span className="text-xo-faint">~{f.expectedDays}d</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </Section>

      <Section title="Stage conversion · benchmarks" className="border border-xo-line">
        <p className="px-4 py-3 text-[13px] text-xo-muted">No sourced stage-conversion benchmark is available yet, so none is shown. Conversion rates will appear here once they can be measured from recorded processes or cited from a source.</p>
      </Section>
    </div>
  );
};

const StageWord: React.FC<{ stage: DealStage }> = ({ stage }) => (
  <span className={`text-[12px] font-semibold ${STAGE_CLS[stage] ?? "text-xo-muted"}`}>{STAGE_LABEL[stage] ?? stage}</span>
);

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

export default Pipeline;

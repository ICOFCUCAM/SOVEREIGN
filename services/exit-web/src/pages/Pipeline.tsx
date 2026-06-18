import React from "react";
import { StageBadge, STAGE_ORDER, fmtMoney, timeAgo, type DealStage } from "../lib/ui";
import { Panel, Frame, CommandHeader, CommandState, Evidence } from "../lib/workstation";
import { OFFER_EVALUATIONS, NEGOTIATION_STATE } from "../lib/engines";
import BankerTake from "../components/BankerTake";

// Acquisition Pipeline — kanban over the six negotiation stages.
// Live offers from evaluateOffer feed the LOI / engaged columns;
// additional sourcing-stage candidates surface from the buyer
// discovery (top matches not yet engaged). The negotiation engine's
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
  // Sourcing/engaged candidates (placeholder until outreach engine ships)
  { id: 'p-100', buyer: 'C.H. Robinson Bolt-on',     stage: 'engaged',   amount: 110_000_000, probability: 0.25, updatedAt: new Date(Date.now() - 12 * 86400_000).toISOString() },
  { id: 'p-101', buyer: 'Pritzker Private Capital',  stage: 'sourcing',  probability: 0.05, updatedAt: new Date(Date.now() - 18 * 86400_000).toISOString() },
  { id: 'p-102', buyer: 'Walton Enterprises',        stage: 'sourcing',  probability: 0.04, updatedAt: new Date(Date.now() - 22 * 86400_000).toISOString() },
];

// Deal Probability Engine — predicts close probability, expected close date and
// the probability-adjusted value for each live deal, and surfaces the single
// biggest risk to closing. Derived from stage progression, the offer score and
// the negotiation posture (no manual entry).
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

const LEV_TONE: Record<string, string> = { high: "text-deal-300", medium: "text-loi-300", low: "text-red-300" };

const Pipeline: React.FC = () => {
  const live = DEALS.filter((d) => d.stage !== 'dead');
  const totalWeighted = weighted(live);
  const lead = live.slice().sort((a, b) => b.probability - a.probability)[0];
  const leadF = lead ? forecast(lead) : null;

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Exchange · Sourcing"
        title="Acquisition Pipeline"
        tag="Six-stage process"
        status={`Leverage ${NEGOTIATION_STATE.leverage}`}
        metrics={[
          { k: "Live deals", v: String(live.length), sub: "excluding dead" },
          { k: "Pipeline value", v: fmtMoney(live.reduce((s, d) => s + (d.amount ?? 0), 0)), sub: "indicated" },
          { k: "Prob-weighted", v: fmtMoney(totalWeighted), accent: true, sub: "forecast" },
          { k: "Lead close", v: lead ? `${(lead.probability * 100).toFixed(0)}%` : "—", accent: true, sub: lead?.buyer },
          { k: "Leverage", v: NEGOTIATION_STATE.leverage, sub: "negotiation posture" },
        ]}
      />


      <CommandState
        current={<><span className="font-mono text-white">{live.length}</span> live deals · prob-weighted {fmtMoney(totalWeighted)} · leverage {NEGOTIATION_STATE.leverage}</>}
        changes={lead ? <>Lead {lead.buyer} at {(lead.probability * 100).toFixed(0)}%{leadF ? ` · ~${leadF.expectedDays}d to close` : ""}</> : <>No live offers in the funnel</>}
        action={<>{NEGOTIATION_STATE.nextMove}</>}
        outcome={lead && leadF ? <>Lead closes ~{leadF.expectedDays}d · adj. value <span className="font-mono text-white">{fmtMoney(leadF.adjustedValue)}</span></> : <>Rebuild the funnel to regain leverage</>}
      />

      <BankerTake
        next={NEGOTIATION_STATE.nextMove}
        stake={<><span className="font-mono font-bold text-deal-300">{fmtMoney(totalWeighted)}</span> probability-weighted across {live.length} live deals.</>}
        inaction={lead && leadF
          ? <>Your lead, <span className="text-white">{lead.buyer}</span>, closes in ~{leadF.expectedDays}d. Lose tempo and a single-threaded process retrades the price.</>
          : <>No live offers — without competing bids you have no leverage to hold price.</>}
        buyer={lead
          ? <><span className="text-white">{lead.buyer}</span> — {(lead.probability * 100).toFixed(0)}% close{lead.amount ? <>, {fmtMoney(lead.amount)} indicated</> : null}.</>
          : "Re-engage the sourcing column to rebuild the funnel."}
        automate={<>ExitOS scores every deal, drafts the counter and sequences buyer follow-ups automatically.</>}
        impact={<>{fmtMoney(totalWeighted)}</>}
        cta={{ label: "Open the negotiator", to: "/console/negotiator" }}
      />

      <Frame>
        <Panel title="Negotiation engine · posture" className="lg:col-span-4">
          <div className="p-3">
            <span className={`font-mono text-[13px] font-bold uppercase ${LEV_TONE[NEGOTIATION_STATE.leverage]}`}>{NEGOTIATION_STATE.leverage} leverage</span>
            <p className="mt-1.5 text-[12.5px] text-white/85">{NEGOTIATION_STATE.nextMove}</p>
            {NEGOTIATION_STATE.recommendations.length > 0 && (
              <ul className="mt-2 space-y-1 text-[11.5px] text-white/60">
                {NEGOTIATION_STATE.recommendations.map((r) => <li key={r} className="flex gap-1.5"><span className="text-deal-400">·</span>{r}</li>)}
              </ul>
            )}
          </div>
        </Panel>

        <Panel title="Deal Probability Engine" className="lg:col-span-8"
          foot="Predicted close probability, expected close date and probability-adjusted value — derived from stage, offer score and posture.">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-3 py-1.5">Deal</th>
                <th className="px-2 py-1.5">Stage</th>
                <th className="px-2 py-1.5">Close prob</th>
                <th className="px-2 py-1.5 text-right">Exp. close</th>
                <th className="px-2 py-1.5 text-right">Adj. value</th>
                <th className="px-3 py-1.5">Top risk</th>
              </tr>
            </thead>
            <tbody>
              {live.slice().sort((a, b) => b.probability - a.probability).map((d) => {
                const f = forecast(d);
                const pc = f.closeProbability >= 0.7 ? "#34d399" : f.closeProbability >= 0.4 ? "#fbbf24" : "#f87171";
                return (
                  <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-3 py-1.5 font-medium text-white">{d.buyer}</td>
                    <td className="px-2 py-1.5"><StageBadge stage={d.stage} /></td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-14 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${f.closeProbability * 100}%`, background: pc }} /></div>
                        <Evidence meta={{ methodology: f.risk, source: "stage progression · offer score · negotiation posture", confidence: `${d.stage} stage` }}>
                          <span className="font-mono text-[12px] font-bold" style={{ color: pc }}>{(f.closeProbability * 100).toFixed(0)}%</span>
                        </Evidence>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/80">{f.expectedDays}d</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-deal-300">{fmtMoney(f.adjustedValue)}</td>
                    <td className="px-3 py-1.5 text-[11px] text-white/60">{f.risk}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </Frame>

      {/* kanban — six negotiation stages */}
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
        {STAGE_ORDER.map((stage) => {
          const list = dealsByStage(stage);
          const stageValue = list.reduce((s, d) => s + (d.amount ?? 0), 0);
          return (
            <div key={stage} className="bg-ink-900 p-3">
              <div className="mb-2 flex items-center justify-between">
                <StageBadge stage={stage} />
                <span className="font-mono text-[10px] text-white/40">{list.length}</span>
              </div>
              <div className="mb-2 font-mono text-[10px] text-white/45">{stageValue > 0 ? fmtMoney(stageValue) : '—'}</div>
              <div className="space-y-1.5">
                {list.map((d) => {
                  const f = forecast(d);
                  const pc = f.closeProbability >= 0.7 ? "#34d399" : f.closeProbability >= 0.4 ? "#fbbf24" : "#f87171";
                  return (
                  <div key={d.id} className="rounded border border-white/10 bg-ink-800/80 p-2">
                    <div className="text-[12px] font-medium leading-tight text-white">{d.buyer}</div>
                    <div className="mt-0.5 flex items-center justify-between text-[9px] text-white/45">
                      <span className="font-mono">{d.amount ? fmtMoney(d.amount) : '—'}</span>
                      <span>{timeAgo(d.updatedAt)}</span>
                    </div>
                    {d.stage !== "dead" && (
                      <div className="mt-1 flex items-center justify-between text-[9px]">
                        <span className="font-mono font-bold" style={{ color: pc }}>{(f.closeProbability * 100).toFixed(0)}%</span>
                        <span className="text-white/45">~{f.expectedDays}d</span>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Frame>
        <Panel title="Stage conversion · benchmarks" className="lg:col-span-12">
          <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-5">
            {[
              ['Sourcing → Engaged', '38%'], ['Engaged → Diligence', '42%'], ['Diligence → LOI', '55%'],
              ['LOI → Signed', '61%'], ['Signed → Closed', '92%'],
            ].map(([k, v]) => (
              <div key={k} className="bg-ink-900 p-3">
                <div className="text-[9px] uppercase tracking-[0.16em] text-white/40">{k}</div>
                <div className="mt-0.5 font-mono text-[18px] font-bold tabular-nums text-deal-300">{v}</div>
              </div>
            ))}
          </div>
        </Panel>
      </Frame>
    </div>
  );
};

export default Pipeline;

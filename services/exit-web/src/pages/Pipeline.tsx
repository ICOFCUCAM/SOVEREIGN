import React from "react";
import { Card, Kpi, SectionHeader, StageBadge, STAGE_ORDER, fmtMoney, timeAgo, type DealStage } from "../lib/ui";
import { OFFER_EVALUATIONS, NEGOTIATION_STATE } from "../lib/engines";

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

function dealsByStage(stage: DealStage): readonly PipelineDeal[] {
  return DEALS.filter((d) => d.stage === stage);
}

function weighted(deals: readonly PipelineDeal[]): number {
  return deals.reduce((s, d) => s + (d.amount ?? 0) * d.probability, 0);
}

const LEV_STYLE: Record<string, string> = {
  high:   "bg-deal-600/20 text-deal-300 ring-deal-400/40",
  medium: "bg-loi-500/15 text-loi-300 ring-loi-400/40",
  low:    "bg-red-500/15 text-red-300 ring-red-400/40",
};

const Pipeline: React.FC = () => {
  const live = DEALS.filter((d) => d.stage !== 'dead');
  const totalWeighted = weighted(live);

  return (
    <div>
      <SectionHeader
        kicker="Module 08 · Sourcing"
        title="Acquisition Pipeline"
        description={`${live.length} live deals across the six negotiation stages. Probability-weighted forecast ${fmtMoney(totalWeighted)}. Leverage: ${NEGOTIATION_STATE.leverage}.`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Live deals"           value={String(live.length)} sub="excluding dead" />
        <Kpi label="Pipeline value"        value={fmtMoney(live.reduce((s, d) => s + (d.amount ?? 0), 0))} sub="indicated" />
        <Kpi label="Probability-weighted" value={fmtMoney(totalWeighted)} sub="forecast" accent="#34d399" />
        <Kpi label="Leverage"             value={NEGOTIATION_STATE.leverage} sub={`Next: ${NEGOTIATION_STATE.nextMove.slice(0, 40)}${NEGOTIATION_STATE.nextMove.length > 40 ? '…' : ''}`} />
      </div>

      <Card className={`mt-8 p-5 ring-1 ${LEV_STYLE[NEGOTIATION_STATE.leverage]}`}>
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">Negotiation engine · posture</div>
        <p className="mt-2 text-sm text-white/85">{NEGOTIATION_STATE.nextMove}</p>
        {NEGOTIATION_STATE.recommendations.length > 0 && (
          <ul className="mt-3 space-y-1 text-[12px] text-white/65">
            {NEGOTIATION_STATE.recommendations.map((r) => <li key={r}>· {r}</li>)}
          </ul>
        )}
      </Card>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
        {STAGE_ORDER.map((stage) => {
          const list = dealsByStage(stage);
          const stageValue = list.reduce((s, d) => s + (d.amount ?? 0), 0);
          return (
            <div key={stage} className="bg-ink-800/95 p-4">
              <div className="mb-3 flex items-center justify-between">
                <StageBadge stage={stage} />
                <span className="font-mono text-[10px] text-white/40">{list.length}</span>
              </div>
              <div className="mb-3 text-[11px] text-white/45">{stageValue > 0 ? fmtMoney(stageValue) : '—'}</div>
              <div className="space-y-2">
                {list.map((d) => (
                  <div key={d.id} className="rounded border border-white/10 bg-ink-900/80 p-2.5">
                    <div className="text-[13px] font-medium leading-tight text-white">{d.buyer}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-white/45">
                      <span className="font-mono">{d.amount ? fmtMoney(d.amount) : '—'}</span>
                      <span>{timeAgo(d.updatedAt)}</span>
                    </div>
                    {d.score != null && (
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-deal-300">{d.score.toFixed(0)}/100</span>
                        <span className="uppercase tracking-wide text-white/50">{d.recommendation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Card className="mt-8 p-6">
        <h3 className="font-serif text-lg font-bold">Stage conversion · benchmarks</h3>
        <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-5">
          {[
            ['Sourcing → Engaged',   '38%'],
            ['Engaged → Diligence',  '42%'],
            ['Diligence → LOI',      '55%'],
            ['LOI → Signed',         '61%'],
            ['Signed → Closed',      '92%'],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-deal-300">{v}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Pipeline;

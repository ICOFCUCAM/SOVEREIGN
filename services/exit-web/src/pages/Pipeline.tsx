import React from "react";
import { Card, Kpi, SectionHeader, StageBadge, STAGE_ORDER, fmtMoney, timeAgo, type DealStage } from "../lib/ui";

interface PipelineDeal { id: string; buyer: string; stage: DealStage; amount?: number; probability: number; updatedAt: string; }

const DEALS: readonly PipelineDeal[] = [
  { id: "p-001", buyer: "Helios Acquisition Group", stage: "loi",       amount: 18_500_000, probability: 0.65, updatedAt: new Date(Date.now() - 4   * 3600_000).toISOString() },
  { id: "p-002", buyer: "Astra Strategic",          stage: "diligence", amount: 22_000_000, probability: 0.45, updatedAt: new Date(Date.now() - 12  * 3600_000).toISOString() },
  { id: "p-003", buyer: "Forum Equity Partners",    stage: "engaged",   amount: 16_750_000, probability: 0.25, updatedAt: new Date(Date.now() - 28  * 3600_000).toISOString() },
  { id: "p-004", buyer: "Sentinel Holdings",        stage: "signed",    amount: 24_000_000, probability: 0.92, updatedAt: new Date(Date.now() - 14  * 86400_000).toISOString() },
  { id: "p-005", buyer: "Northbound Capital",       stage: "sourcing",                                  probability: 0.05, updatedAt: new Date(Date.now() - 6   * 86400_000).toISOString() },
  { id: "p-006", buyer: "Lehnen Family Holdings",   stage: "sourcing",                                  probability: 0.04, updatedAt: new Date(Date.now() - 9   * 86400_000).toISOString() },
  { id: "p-007", buyer: "Triton Capital",           stage: "dead",      amount: 14_000_000, probability: 0.00, updatedAt: new Date(Date.now() - 30  * 86400_000).toISOString() },
];

function dealsByStage(stage: DealStage): readonly PipelineDeal[] {
  return DEALS.filter((d) => d.stage === stage);
}

function weighted(deals: readonly PipelineDeal[]): number {
  return deals.reduce((s, d) => s + (d.amount ?? 0) * d.probability, 0);
}

const Pipeline: React.FC = () => {
  const live = DEALS.filter((d) => d.stage !== "dead");
  const totalWeighted = weighted(live);
  return (
    <div>
      <SectionHeader
        kicker="Module 08 · Sourcing"
        title="Acquisition Pipeline"
        description="Stage-gated pipeline from sourcing through closing. Forecast, throughput and conversion in one view."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Live deals"           value={String(live.length)}                  sub="excluding dead" />
        <Kpi label="Pipeline value"        value={fmtMoney(live.reduce((s, d) => s + (d.amount ?? 0), 0))} sub="indicated" />
        <Kpi label="Probability-weighted" value={fmtMoney(totalWeighted)}              sub="forecast"  accent="#34d399" />
        <Kpi label="Time-to-close"        value="48 days"                              sub="median, live deals" />
      </div>

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
              <div className="mb-3 text-[11px] text-white/45">{stageValue > 0 ? fmtMoney(stageValue) : "—"}</div>
              <div className="space-y-2">
                {list.map((d) => (
                  <div key={d.id} className="rounded border border-white/10 bg-ink-900/80 p-2.5">
                    <div className="text-[13px] font-medium leading-tight text-white">{d.buyer}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-white/45">
                      <span className="font-mono">{d.amount ? fmtMoney(d.amount) : "—"}</span>
                      <span>{timeAgo(d.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Card className="mt-8 p-6">
        <h3 className="font-serif text-lg font-bold">Conversion</h3>
        <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-5">
          {[
            ["Sourcing → Engaged",   "38%"],
            ["Engaged → Diligence",  "42%"],
            ["Diligence → LOI",      "55%"],
            ["LOI → Signed",         "61%"],
            ["Signed → Closed",      "92%"],
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

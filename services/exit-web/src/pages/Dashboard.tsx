import React from "react";
import { Link } from "react-router-dom";
import { Card, Kpi, SectionHeader, StageBadge, fmtMoney, timeAgo, type DealStage } from "../lib/ui";
import { useAuth } from "../lib/auth";

interface DealRow {
  id: string;
  buyer: string;
  stage: DealStage;
  amount?: number;
  updatedAt: string;
  nextAction: string;
}

// Sample deal pipeline — placeholder until exit-api ships. The shape mirrors
// what the production /v1/deals?summary=founder endpoint will return so swap
// is mechanical.
const DEALS: readonly DealRow[] = [
  { id: "d-001", buyer: "Helios Acquisition Group",     stage: "loi",       amount: 18_500_000, updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),  nextAction: "Counter LOI by EOD Friday" },
  { id: "d-002", buyer: "Astra Strategic",              stage: "diligence", amount: 22_000_000, updatedAt: new Date(Date.now() - 6 * 3600_000).toISOString(),  nextAction: "Customer references — 3 to send" },
  { id: "d-003", buyer: "Forum Equity Partners",        stage: "engaged",   amount: 16_750_000, updatedAt: new Date(Date.now() - 26 * 3600_000).toISOString(), nextAction: "Mutual NDA — countersigned today" },
  { id: "d-004", buyer: "Northbound Capital",           stage: "sourcing",  amount: undefined,  updatedAt: new Date(Date.now() - 5 * 86400_000).toISOString(), nextAction: "Outreach — second touch" },
  { id: "d-005", buyer: "Sentinel Holdings",            stage: "signed",    amount: 24_000_000, updatedAt: new Date(Date.now() - 14 * 86400_000).toISOString(), nextAction: "Closing checklist — 12 items remain" },
];

const Dashboard: React.FC = () => {
  const { session } = useAuth();
  const active = DEALS.filter((d) => d.stage !== "dead" && d.stage !== "closed");
  const open   = DEALS.filter((d) => d.stage === "loi" || d.stage === "signed" || d.stage === "diligence");
  const sumOpen = open.reduce((s, d) => s + (d.amount ?? 0), 0);

  return (
    <div>
      <SectionHeader
        kicker="Founder Dashboard"
        title={`Good morning, ${session?.founderId ?? "founder"}.`}
        description="One screen at 8am. Live deal stage, this-week milestones, blockers, and the next decision the founder owns."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Active deals"        value={String(active.length)} sub={`${DEALS.length - active.length} closed/dead`} />
        <Kpi label="Open value"          value={fmtMoney(sumOpen)}    sub="diligence + LOI + signed" accent="#34d399" />
        <Kpi label="In diligence"        value={String(DEALS.filter((d) => d.stage === "diligence").length)} sub="active workstreams" />
        <Kpi label="This week's actions" value={String(active.length)} sub="founder-owned only" accent="#fbbf24" />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-white">Live pipeline</h2>
            <p className="text-xs text-white/45">Sorted by last activity. The dashboard is read-only; deal edits happen in the relevant module.</p>
          </div>
          <Link to="/console/pipeline" className="text-[12px] font-semibold uppercase tracking-wide text-deal-400 hover:text-deal-300">Open pipeline &rarr;</Link>
        </div>
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">Buyer</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3 text-right">Indicated value</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3">Next action (founder)</th>
              </tr>
            </thead>
            <tbody>
              {DEALS.map((d) => (
                <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium text-white">{d.buyer}</td>
                  <td className="px-5 py-3.5"><StageBadge stage={d.stage} /></td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white/85">{fmtMoney(d.amount)}</td>
                  <td className="px-5 py-3.5 text-xs text-white/50">{timeAgo(d.updatedAt)}</td>
                  <td className="px-5 py-3.5 text-xs text-white/70">{d.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-serif text-lg font-bold text-white">This week</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li className="flex items-baseline gap-3"><span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-deal-400" /> Counter Helios LOI by Friday EOD</li>
            <li className="flex items-baseline gap-3"><span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-loi-400" /> Send Astra three customer references</li>
            <li className="flex items-baseline gap-3"><span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-white/50" /> Sentinel — closing checklist review (Tuesday)</li>
            <li className="flex items-baseline gap-3"><span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-white/50" /> Board update — circulate Thursday</li>
          </ul>
        </Card>
        <Card className="p-6">
          <h3 className="font-serif text-lg font-bold text-white">Blockers</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li className="flex items-baseline gap-3"><span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400" /> Forum Equity — counsel review pending on disclosure schedule</li>
            <li className="flex items-baseline gap-3"><span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-loi-400" /> Two open data-room access requests (Helios diligence team)</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

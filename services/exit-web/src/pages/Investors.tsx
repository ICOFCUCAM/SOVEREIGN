import React from "react";
import { Button, Card, Kpi, SectionHeader, timeAgo } from "../lib/ui";

interface Investor {
  name: string; role: "Board" | "Lead" | "Observer" | "Founder"; ownership: number; touchpoint: string; lastContact: string; signatory: boolean;
}

const INVESTORS: readonly Investor[] = [
  { name: "Anne Kovac",      role: "Founder",  ownership: 0.342, touchpoint: "weekly 1:1",        lastContact: new Date(Date.now() - 8  * 3600_000).toISOString(), signatory: true  },
  { name: "Rafael Mendes",   role: "Founder",  ownership: 0.213, touchpoint: "weekly 1:1",        lastContact: new Date(Date.now() - 12 * 3600_000).toISOString(), signatory: true  },
  { name: "Sequoia (Lead)",  role: "Lead",     ownership: 0.151, touchpoint: "monthly board",     lastContact: new Date(Date.now() - 3  * 86400_000).toISOString(), signatory: true  },
  { name: "Index Ventures",  role: "Board",    ownership: 0.087, touchpoint: "quarterly board",   lastContact: new Date(Date.now() - 8  * 86400_000).toISOString(), signatory: true  },
  { name: "Khosla Ventures", role: "Observer", ownership: 0.034, touchpoint: "deal-stage updates", lastContact: new Date(Date.now() - 14 * 86400_000).toISOString(), signatory: false },
  { name: "Y Combinator",    role: "Observer", ownership: 0.012, touchpoint: "deal-stage updates", lastContact: new Date(Date.now() - 22 * 86400_000).toISOString(), signatory: false },
];

const ROLE_STYLE: Record<Investor["role"], string> = {
  Founder:  "text-deal-300",
  Lead:     "text-loi-300",
  Board:    "text-stage-engaged",
  Observer: "text-white/55",
};

const Investors: React.FC = () => {
  const total = INVESTORS.reduce((s, i) => s + i.ownership, 0);
  return (
    <div>
      <SectionHeader
        kicker="Module 04 · Workspace"
        title="Investor CRM"
        description="Cap-table-aware relationship graph. Board, leads, observers and signatories — all in one stack."
        actions={<Button>Add stakeholder</Button>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Stakeholders" value={String(INVESTORS.length)} sub="board · leads · observers" />
        <Kpi label="Cap table covered" value={`${Math.round(total * 100)}%`} sub="of fully-diluted" accent="#34d399" />
        <Kpi label="Signatories" value={String(INVESTORS.filter((i) => i.signatory).length)} sub="bound to SPA execution" />
        <Kpi label="Touchpoints" value="weekly" sub="board · monthly all-hands" />
      </div>

      <div className="mt-10">
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">Stakeholder</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 text-right">Ownership</th>
                <th className="px-5 py-3">Touchpoint</th>
                <th className="px-5 py-3">Last contact</th>
                <th className="px-5 py-3">Signatory</th>
              </tr>
            </thead>
            <tbody>
              {INVESTORS.map((i) => (
                <tr key={i.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 font-medium text-white">{i.name}</td>
                  <td className={`px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wide ${ROLE_STYLE[i.role]}`}>{i.role}</td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white/85">{(i.ownership * 100).toFixed(1)}%</td>
                  <td className="px-5 py-3.5 text-xs text-white/65">{i.touchpoint}</td>
                  <td className="px-5 py-3.5 text-xs text-white/45">{timeAgo(i.lastContact)}</td>
                  <td className="px-5 py-3.5 text-xs">{i.signatory ? <span className="text-deal-300">Required</span> : <span className="text-white/40">Info-only</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

export default Investors;

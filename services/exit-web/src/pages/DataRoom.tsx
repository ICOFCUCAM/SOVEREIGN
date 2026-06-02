import React from "react";
import { Button, Card, Kpi, SectionHeader, timeAgo } from "../lib/ui";

interface DocRow { name: string; section: string; size: string; access: number; updatedAt: string; classified?: boolean; }

const DOCS: readonly DocRow[] = [
  { name: "01_corporate/Cap_Table_v17.xlsx",        section: "Corporate",   size: "146 KB", access: 7, updatedAt: new Date(Date.now() - 4 * 3600_000).toISOString() },
  { name: "01_corporate/Articles_of_Association.pdf", section: "Corporate", size: "892 KB", access: 5, updatedAt: new Date(Date.now() - 1 * 86400_000).toISOString() },
  { name: "02_financials/Audited_FY25.pdf",         section: "Financials",  size: "3.4 MB", access: 6, updatedAt: new Date(Date.now() - 2 * 86400_000).toISOString() },
  { name: "02_financials/Management_Pack_Q1.xlsx",  section: "Financials",  size: "812 KB", access: 6, updatedAt: new Date(Date.now() - 6 * 3600_000).toISOString() },
  { name: "03_customers/Top_50_Revenue.xlsx",       section: "Customers",   size: "120 KB", access: 4, updatedAt: new Date(Date.now() - 3 * 86400_000).toISOString(), classified: true },
  { name: "04_technical/Architecture_Overview.pdf", section: "Technical",   size: "1.7 MB", access: 3, updatedAt: new Date(Date.now() - 5 * 86400_000).toISOString() },
  { name: "05_legal/Material_Contracts/Index.pdf",  section: "Legal",       size: "624 KB", access: 4, updatedAt: new Date(Date.now() - 8 * 86400_000).toISOString() },
];

const DataRoom: React.FC = () => (
  <div>
    <SectionHeader
      kicker="Module 02 · Workspace"
      title="Virtual Data Room"
      description="Watermarked rooms with deal-stage access policies, audit trail per artifact, and one-click reversion when a buyer drops out."
      actions={<><Button variant="ghost">New room</Button><Button>Upload</Button></>}
    />

    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Kpi label="Active rooms"     value="4"   sub="one per buyer in diligence" />
      <Kpi label="Documents"        value="142" sub="across all rooms" />
      <Kpi label="Pending requests" value="2"   sub="Helios + Forum"  accent="#fbbf24" />
      <Kpi label="Watermark policy" value="ON"  sub="per-buyer signature" accent="#34d399" />
    </div>

    <div className="mt-10">
      <h2 className="mb-3 font-serif text-lg font-bold">Recent activity · Helios room</h2>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3">Artifact</th>
              <th className="px-5 py-3">Section</th>
              <th className="px-5 py-3">Size</th>
              <th className="px-5 py-3 text-right">Accesses</th>
              <th className="px-5 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {DOCS.map((d) => (
              <tr key={d.name} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-3.5 font-mono text-[12px] text-white">
                  {d.name}
                  {d.classified && <span className="ml-2 inline-block rounded bg-loi-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-loi-400">Sensitive</span>}
                </td>
                <td className="px-5 py-3.5 text-white/65">{d.section}</td>
                <td className="px-5 py-3.5 text-white/55">{d.size}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white/85">{d.access}</td>
                <td className="px-5 py-3.5 text-xs text-white/45">{timeAgo(d.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  </div>
);

export default DataRoom;

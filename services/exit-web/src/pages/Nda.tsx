import React from "react";
import { Button, Card, Kpi, SectionHeader, timeAgo } from "../lib/ui";

interface NdaRow { buyer: string; type: "Mutual" | "One-way"; signedAt?: string; expiresAt?: string; status: "active" | "pending" | "revoked" | "breach"; }

const NDAS: readonly NdaRow[] = [
  { buyer: "Helios Acquisition Group",  type: "Mutual",  signedAt: new Date(Date.now() - 18 * 86400_000).toISOString(), expiresAt: new Date(Date.now() + 712 * 86400_000).toISOString(), status: "active" },
  { buyer: "Astra Strategic",           type: "Mutual",  signedAt: new Date(Date.now() - 11 * 86400_000).toISOString(), expiresAt: new Date(Date.now() + 719 * 86400_000).toISOString(), status: "active" },
  { buyer: "Forum Equity Partners",     type: "Mutual",  signedAt: undefined, expiresAt: undefined, status: "pending" },
  { buyer: "Northbound Capital",        type: "One-way", signedAt: new Date(Date.now() - 45 * 86400_000).toISOString(), expiresAt: new Date(Date.now() + 685 * 86400_000).toISOString(), status: "active" },
  { buyer: "Sentinel Holdings",         type: "Mutual",  signedAt: new Date(Date.now() - 120 * 86400_000).toISOString(), expiresAt: new Date(Date.now() + 610 * 86400_000).toISOString(), status: "revoked" },
  { buyer: "Lehnen Family Holdings",    type: "One-way", signedAt: new Date(Date.now() - 9  * 86400_000).toISOString(), expiresAt: new Date(Date.now() + 721 * 86400_000).toISOString(), status: "active" },
];

const STATUS_STYLE: Record<NdaRow["status"], string> = {
  active:  "bg-deal-600/20 text-deal-300",
  pending: "bg-loi-500/15 text-loi-300",
  revoked: "bg-white/5 text-white/45",
  breach:  "bg-red-500/15 text-red-300",
};

const Nda: React.FC = () => (
  <div>
    <SectionHeader
      kicker="Module 07 · Workspace"
      title="NDA Automation"
      description="Bilateral and mutual NDAs issued at first contact. Tracked per buyer with revocation, breach-notice and audit."
      actions={<><Button variant="ghost">Templates</Button><Button>Issue NDA</Button></>}
    />

    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Kpi label="Active NDAs"    value={String(NDAS.filter((n) => n.status === "active").length)}  sub="bound counterparties" accent="#34d399" />
      <Kpi label="Pending"        value={String(NDAS.filter((n) => n.status === "pending").length)} sub="awaiting countersignature" accent="#fbbf24" />
      <Kpi label="Default term"   value="24 months"  sub="confidentiality survival" />
      <Kpi label="Breach notices" value="0"          sub="this exit" />
    </div>

    <div className="mt-10">
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3">Counterparty</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Signed</th>
              <th className="px-5 py-3">Expires</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {NDAS.map((n) => (
              <tr key={n.buyer} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-3.5 font-medium text-white">{n.buyer}</td>
                <td className="px-5 py-3.5 text-white/70">{n.type}</td>
                <td className="px-5 py-3.5 text-xs text-white/55">{n.signedAt ? timeAgo(n.signedAt) : "—"}</td>
                <td className="px-5 py-3.5 text-xs text-white/55">{n.expiresAt ? new Date(n.expiresAt).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-3.5"><span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[n.status]}`}>{n.status}</span></td>
                <td className="px-5 py-3.5"><button className="text-[12px] font-semibold uppercase tracking-wide text-deal-400 hover:text-deal-300">Open &rarr;</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  </div>
);

export default Nda;

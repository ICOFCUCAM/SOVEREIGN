import React from "react";
import { Button, Card, Kpi, SectionHeader, fmtMoney } from "../lib/ui";

interface Term { label: string; counterparty: string; founder: string; delta: string; status: "open" | "agreed" | "blocker" }

const TERMS: readonly Term[] = [
  { label: "Headline price",          counterparty: "$18.5M",        founder: "$24.0M",         delta: "+30%",  status: "open" },
  { label: "Earn-out",                counterparty: "30% of payout", founder: "0–10% max",      delta: "−20pp", status: "open" },
  { label: "Escrow",                  counterparty: "15% / 24mo",    founder: "10% / 12mo",     delta: "−5pp",  status: "open" },
  { label: "Founder retention",       counterparty: "36 months",     founder: "18 months",      delta: "−18mo", status: "open" },
  { label: "Non-compete radius",      counterparty: "Worldwide",     founder: "North America",  delta: "scope", status: "blocker" },
  { label: "Indemnity cap",           counterparty: "100% of price", founder: "20% of price",   delta: "−80pp", status: "blocker" },
  { label: "Treatment of unvested",   counterparty: "Cancelled",     founder: "Accelerated",    delta: "accel", status: "open" },
  { label: "Tax structure",           counterparty: "Asset sale",    founder: "Stock sale",     delta: "structure", status: "agreed" },
];

const STATUS_STYLE: Record<Term["status"], string> = {
  open:    "bg-loi-500/15 text-loi-300",
  agreed:  "bg-deal-600/20 text-deal-300",
  blocker: "bg-red-500/15 text-red-300",
};

const Negotiator: React.FC = () => (
  <div>
    <SectionHeader
      kicker="Module 05 · Operator"
      title="AI Deal Negotiator"
      description="Term-sheet and SPA drafting with negotiation playbooks. Counters generated against your reservation lines; every change auditable."
      actions={<><Button variant="ghost">Reservation lines</Button><Button>Generate counter</Button></>}
    />

    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Kpi label="Active negotiation" value="Helios Group"      sub="LOI stage" />
      <Kpi label="Headline gap"       value={fmtMoney(5_500_000)} sub="founder above counterparty" accent="#fbbf24" />
      <Kpi label="Open terms"         value={String(TERMS.filter((t) => t.status === "open").length)}    sub="for tomorrow's call" />
      <Kpi label="Hard blockers"      value={String(TERMS.filter((t) => t.status === "blocker").length)} sub="founder rejection lines" accent="#f87171" />
    </div>

    <div className="mt-10">
      <h2 className="mb-3 font-serif text-lg font-bold">Term-by-term gap analysis</h2>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3">Term</th>
              <th className="px-5 py-3">Counterparty</th>
              <th className="px-5 py-3">Founder</th>
              <th className="px-5 py-3 text-right">Delta</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {TERMS.map((t) => (
              <tr key={t.label} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-3.5 font-medium text-white">{t.label}</td>
                <td className="px-5 py-3.5 text-white/70">{t.counterparty}</td>
                <td className="px-5 py-3.5 text-white/85">{t.founder}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white/85">{t.delta}</td>
                <td className="px-5 py-3.5"><span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[t.status]}`}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  </div>
);

export default Negotiator;

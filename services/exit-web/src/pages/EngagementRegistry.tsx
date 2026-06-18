import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Kpi, SectionHeader, inputCls } from "../lib/ui";
import { loadActiveCompany, activeTokens } from "../lib/active-company";
import { engagementRegistry } from "../lib/engagement-registry";

// BUYER ENGAGEMENT REGISTRY — the consolidated internal registry. For every
// buyer: acquisition DNA, strategic intent, history, outreach path, contact
// confidence, response history (real processes only), and how likely they
// are to ENGAGE. Answers: who to contact, why, and how likely to respond.

const LIK: Record<string, string> = { High: "text-deal-300", Moderate: "text-loi-300", Low: "text-white/45" };
const CONF: Record<string, string> = { High: "text-deal-300", Medium: "text-loi-300", Low: "text-white/45" };

const EngagementRegistry: React.FC = () => {
  const tokens = useMemo(() => activeTokens(loadActiveCompany().company), []);
  const rows = useMemo(() => engagementRegistry(tokens, 40), [tokens]);
  const [q, setQ] = useState("");
  const filtered = q.trim() ? rows.filter((r) => r.buyerName.toLowerCase().includes(q.trim().toLowerCase())) : rows;

  const high = rows.filter((r) => r.engagementLikelihood.tier === "High").length;
  const withHistory = rows.filter((r) => r.processesRun > 0).length;

  return (
    <div>
      <SectionHeader
        kicker="Buyer Console · Engagement"
        title="Buyer Engagement Registry"
        description="Not a contact database — a consolidated record per buyer: acquisition DNA, strategic intent, history, the outreach path, contact confidence and response history. It answers who to contact, why, and how likely they are to engage."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Buyers in registry" value={String(rows.length)} sub="ranked by engagement" />
        <Kpi label="High engagement" value={String(high)} sub="likely to respond" accent="#34d399" />
        <Kpi label="With response history" value={String(withHistory)} sub="real processes" accent="#fbbf24" />
        <Kpi label="Top buyer" value={rows[0]?.buyerName ?? "—"} sub={`${rows[0]?.engagementLikelihood.score ?? 0}% engagement`} />
      </div>

      <div className="mt-6">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search buyer…" className={`${inputCls} max-w-xs`} />
      </div>

      <Card className="mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-[12.5px]">
            <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">Buyer</th>
                <th className="px-3 py-3">Intent</th>
                <th className="px-3 py-3 text-right">History</th>
                <th className="px-3 py-3">Outreach path</th>
                <th className="px-3 py-3 text-center">Contact</th>
                <th className="px-3 py-3 text-right">NDA</th>
                <th className="px-3 py-3 text-right">LOI</th>
                <th className="px-3 py-3 text-right">Close</th>
                <th className="px-5 py-3 text-right">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.buyerId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-2.5">
                    <Link to={`/console/buyer/${r.buyerId}`} className="font-semibold text-white hover:text-deal-300">{r.buyerName}</Link>
                    <div className="text-[10px] text-white/35">{r.buyerType.replace(/_/g, " ")} · {r.acquisitionDna.appetite.replace("_", " ")} appetite</div>
                  </td>
                  <td className="px-3 py-2.5 text-white/55">{r.strategicIntent.length ? r.strategicIntent.slice(0, 2).join(", ") : "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/70">{r.acquisitionHistory.total}<span className="text-white/35"> · {r.acquisitionHistory.last12m}/12m</span></td>
                  <td className="px-3 py-2.5 text-white/65">{r.outreachPath}</td>
                  <td className={`px-3 py-2.5 text-center font-semibold ${CONF[r.contactConfidence]}`}>{r.contactConfidence}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/55">{r.ndaConversionPct != null ? `${r.ndaConversionPct}%` : "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/55">{r.loiConversionPct != null ? `${r.loiConversionPct}%` : "—"}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/55">{r.closeRatePct != null ? `${r.closeRatePct}%` : "—"}</td>
                  <td className="px-5 py-2.5 text-right">
                    <span className={`font-mono font-bold tabular-nums ${LIK[r.engagementLikelihood.tier]}`} title={r.engagementLikelihood.basis}>{r.engagementLikelihood.score}% · {r.engagementLikelihood.tier}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">
          NDA / LOI conversion populate from the platform's own processes (— until a buyer has run one). Close rate is from the acquisition registry where disclosed. Engagement likelihood is an acquisition-appetite estimate until outreach history exists — it sharpens with every real process. ExitOS surfaces the path, never personal contacts.
        </div>
      </Card>
    </div>
  );
};

export default EngagementRegistry;

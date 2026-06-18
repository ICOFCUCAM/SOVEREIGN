import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { inputCls } from "../lib/ui";
import { Panel, Frame, CommandHeader } from "../lib/workstation";
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
    <div className="space-y-2">
      <CommandHeader
        kicker="Buyer Console"
        title="Engagement Registry"
        tag="Who to contact · how likely"
        metrics={[
          { k: "Buyers in registry", v: String(rows.length), sub: "ranked by engagement" },
          { k: "High engagement", v: String(high), accent: true, sub: "likely to respond" },
          { k: "Response history", v: String(withHistory), sub: "real processes" },
          { k: "Top buyer", v: rows[0]?.buyerName ?? "—", accent: true, sub: `${rows[0]?.engagementLikelihood.score ?? 0}% engagement` },
        ]}
      />


      <Frame>
        <Panel title="Buyer engagement registry" className="lg:col-span-12"
          right={<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search buyer…" className={`${inputCls} h-7 w-40 py-0 text-[11px]`} />}
          foot="NDA / LOI conversion populate from the platform's own processes (— until a buyer has run one). Close rate is from the registry where disclosed. Engagement likelihood sharpens with every real process. ExitOS surfaces the path, never personal contacts.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-[12px]">
              <thead className="sticky top-0 bg-ink-900 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
                <tr className="border-b border-white/10">
                  <th className="px-3 py-1.5">Buyer</th>
                  <th className="px-2 py-1.5">Intent</th>
                  <th className="px-2 py-1.5 text-right">History</th>
                  <th className="px-2 py-1.5">Outreach path</th>
                  <th className="px-2 py-1.5 text-center">Contact</th>
                  <th className="px-2 py-1.5 text-right">NDA</th>
                  <th className="px-2 py-1.5 text-right">LOI</th>
                  <th className="px-2 py-1.5 text-right">Close</th>
                  <th className="px-3 py-1.5 text-right">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.buyerId} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-3 py-1.5">
                      <Link to={`/console/buyer/${r.buyerId}`} className="font-semibold text-white hover:text-deal-300">{r.buyerName}</Link>
                      <div className="text-[9px] text-white/35">{r.buyerType.replace(/_/g, " ")} · {r.acquisitionDna.appetite.replace("_", " ")} appetite</div>
                    </td>
                    <td className="px-2 py-1.5 text-white/55">{r.strategicIntent.length ? r.strategicIntent.slice(0, 2).join(", ") : "—"}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/70">{r.acquisitionHistory.total}<span className="text-white/35"> · {r.acquisitionHistory.last12m}/12m</span></td>
                    <td className="px-2 py-1.5 text-white/65">{r.outreachPath}</td>
                    <td className={`px-2 py-1.5 text-center font-semibold ${CONF[r.contactConfidence]}`}>{r.contactConfidence}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/55">{r.ndaConversionPct != null ? `${r.ndaConversionPct}%` : "—"}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/55">{r.loiConversionPct != null ? `${r.loiConversionPct}%` : "—"}</td>
                    <td className="px-2 py-1.5 text-right font-mono tabular-nums text-white/55">{r.closeRatePct != null ? `${r.closeRatePct}%` : "—"}</td>
                    <td className="px-3 py-1.5 text-right">
                      <span className={`font-mono font-bold tabular-nums ${LIK[r.engagementLikelihood.tier]}`} title={r.engagementLikelihood.basis}>{r.engagementLikelihood.score}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Frame>
    </div>
  );
};

export default EngagementRegistry;

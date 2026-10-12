import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MarketTape } from "../lib/workstation";
import { PageHeader, Section, Metric, ScrollRegion, XO_INPUT } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { loadActiveCompany, activeTokens } from "../lib/active-company";
import { engagementRegistry } from "../lib/engagement-registry";

// BUYER ENGAGEMENT REGISTRY — the consolidated internal registry. For every
// buyer: acquisition DNA, strategic intent, history, outreach path, contact
// confidence, response history (real processes only), and how likely they
// are to ENGAGE. Answers: who to contact, why, and how likely to respond.

const LIK: Record<string, string> = { High: "text-xo-verified", Moderate: "text-xo-caution", Low: "text-xo-muted" };
const CONF: Record<string, string> = { High: "text-xo-verified", Medium: "text-xo-caution", Low: "text-xo-muted" };

const EngagementRegistry: React.FC = () => {
  const tokens = useMemo(() => activeTokens(loadActiveCompany().company), []);
  const rows = useMemo(() => engagementRegistry(tokens, 40), [tokens]);
  const [q, setQ] = useState("");
  const filtered = q.trim() ? rows.filter((r) => r.buyerName.toLowerCase().includes(q.trim().toLowerCase())) : rows;

  const high = rows.filter((r) => r.engagementLikelihood.tier === "High").length;
  const withHistory = rows.filter((r) => r.processesRun > 0).length;
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="engagement-registry" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Buyer Console" title="Engagement Registry"
        badge={<span className="text-[12px] text-xo-muted">Who to contact · how likely</span>} />

      <section aria-label="Registry summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Buyers in registry" value={String(rows.length)} sub="ranked by engagement" /></div>
        <div className="bg-xo-panel"><Metric label="High engagement" emphasis value={String(high)} sub="likely to respond" /></div>
        <div className="bg-xo-panel"><Metric label="Response history" value={String(withHistory)} sub="real processes" /></div>
        <div className="bg-xo-panel"><Metric label="Top buyer" emphasis value={rows[0]?.buyerName ?? "—"} sub={`${rows[0]?.engagementLikelihood.score ?? 0}% engagement`} /></div>
      </section>

      <MarketTape items={tape} />

      <Section title="Buyer engagement registry" className="border border-xo-line"
        right={<span className="flex items-center gap-2"><label htmlFor="er-search" className="text-[11px] text-xo-muted">Search buyer</label><input id="er-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Microsoft" className={`${XO_INPUT} h-8 w-40 py-1 text-[12px]`} /></span>}
        foot="NDA / LOI conversion populate from the platform's own processes (— until a buyer has run one). Close rate is from the registry where disclosed. Engagement likelihood sharpens with every real process. ExitOS surfaces the path, never personal contacts.">
        <p role="status" className="sr-only">{filtered.length} of {rows.length} buyers shown</p>
        <ScrollRegion label="Buyer engagement registry table">
          <table className="w-full min-w-[960px] text-[12px]">
            <thead className="text-left text-[11px] text-xo-muted">
              <tr className="border-b border-xo-line">
                <th scope="col" className="px-4 py-2 font-medium">Buyer</th>
                <th scope="col" className="px-2 py-2 font-medium">Intent</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">History</th>
                <th scope="col" className="px-2 py-2 font-medium">Outreach path</th>
                <th scope="col" className="px-2 py-2 text-center font-medium">Contact</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">NDA</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">LOI</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Close</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.buyerId} className="border-b border-xo-line last:border-0">
                  <th scope="row" className="px-4 py-2 text-left font-normal">
                    <Link to={`/console/buyer/${r.buyerId}`} className="font-semibold text-xo-text hover:text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{r.buyerName}</Link>
                    <div className="text-[11px] text-xo-faint">{r.buyerType.replace(/_/g, " ")} · {r.acquisitionDna.appetite.replace("_", " ")} appetite</div>
                  </th>
                  <td className="px-2 py-2 text-xo-muted">{r.strategicIntent.length ? r.strategicIntent.slice(0, 2).join(", ") : "—"}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">{r.acquisitionHistory.total}<span className="text-xo-faint"> · {r.acquisitionHistory.last12m}/12m</span></td>
                  <td className="px-2 py-2 text-xo-muted">{r.outreachPath}</td>
                  <td className={`px-2 py-2 text-center font-semibold ${CONF[r.contactConfidence]}`}>{r.contactConfidence}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{r.ndaConversionPct != null ? `${r.ndaConversionPct}%` : "—"}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{r.loiConversionPct != null ? `${r.loiConversionPct}%` : "—"}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{r.closeRatePct != null ? `${r.closeRatePct}%` : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`font-mono font-semibold tabular-nums ${LIK[r.engagementLikelihood.tier]}`} title={r.engagementLikelihood.basis}>{r.engagementLikelihood.score}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        {filtered.length === 0 && <p className="px-4 py-6 text-center text-[12px] text-xo-muted">No buyer in the registry matches “{q}”.</p>}
      </Section>
    </div>
  );
};

export default EngagementRegistry;

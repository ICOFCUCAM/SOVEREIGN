import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Section, Metric, ScrollRegion, XO_INPUT, Empty } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { loadActiveCompany, activeTokens } from "../lib/active-company";
import { engagementRegistry } from "../lib/engagement-registry";
import { RegistryTape } from "../components/xo/RegistryTape";
import { inlineLabel, label } from "../lib/labels";
import { DNA_AS_OF } from "../lib/buyer-dna";

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
        badge={<span className="text-[12px] text-xo-muted">Who to contact · engagement estimate</span>}
        description="Engagement estimate (0–100) = the buyer's acquisition-appetite score (cadence, acceleration, recency, breadth, stated themes, geography) × a contact-confidence factor (High 1, Medium 0.85, Low 0.6). Once a buyer's own responses are recorded, it becomes 60% response rate + 40% appetite. High is 65 or more, Moderate 40 or more. An estimate of willingness to engage, not a probability of response." />

      <section aria-label="Registry summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Buyers shown" value={String(rows.length)} sub="top 40 by engagement estimate" /></div>
        <div className="bg-xo-panel"><Metric label="High engagement estimate" emphasis value={String(high)} sub="estimate of 65 or more" /></div>
        <div className="bg-xo-panel"><Metric label="With response history" value={String(withHistory)} sub="buyers with recorded responses of their own" /></div>
        <div className="bg-xo-panel"><Metric label="Top buyer" emphasis value={rows[0]?.buyerName ?? "—"} sub={`engagement estimate ${rows[0]?.engagementLikelihood.score ?? 0}/100`} /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <p role="note" className="border border-xo-line bg-xo-panel px-4 py-2.5 text-[12px] text-xo-muted">The ranking does not depend on your company: the engagement estimate uses only each buyer's own record, so this list is the same for every company. For buyers ranked against your company, see the <Link to="/console/outreach-plan" className="font-medium text-xo-action underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Outreach Plan</Link>.</p>

      <Section title="Buyer engagement registry" className="border border-xo-line"
        right={<span className="flex items-center gap-2"><label htmlFor="er-search" className="text-[11px] text-xo-muted">Search buyer</label><input id="er-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Microsoft" className={`${XO_INPUT} h-8 w-40 py-1 text-[12px]`} /></span>}
        foot="NDA / LOI conversion appear once a buyer's own responses are recorded on ExitOS (— until then; your own views and interest do not count). Close rate is from the registry where disclosed. Indexed deals are registry entries, most of them unverified. Contact confidence is a rule on indexed deals — High at 40 or more, Medium at 8 or more, otherwise Low. The contact role is the one typical for the buyer type, never a named person; ExitOS does not store or send to personal contacts.">
        <p role="status" className="sr-only">{filtered.length} of {rows.length} buyers shown</p>
        <ScrollRegion label="Buyer engagement registry table">
          <table className="w-full min-w-[960px] text-[12px]">
            <thead className="text-left text-[11px] text-xo-muted">
              <tr className="border-b border-xo-line">
                <th scope="col" className="px-4 py-2 font-medium">Buyer</th>
                <th scope="col" className="px-2 py-2 font-medium">Stated themes</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Indexed deals · 12m</th>
                <th scope="col" className="px-2 py-2 font-medium">Typical contact role</th>
                <th scope="col" className="px-2 py-2 text-center font-medium">Contact confidence</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">NDA</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">LOI</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Close rate (registry)</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Engagement estimate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.buyerId} className="border-b border-xo-line last:border-0">
                  <th scope="row" className="px-4 py-2 text-left font-normal">
                    <Link to={`/console/buyer/${r.buyerId}`} className="font-semibold text-xo-text hover:text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">{r.buyerName}</Link>
                    <div className="text-[11px] text-xo-faint">{label(r.buyerType)} · {inlineLabel(r.acquisitionDna.appetite)} appetite</div>
                  </th>
                  <td className="px-2 py-2 text-xo-muted">{r.strategicIntent.length ? r.strategicIntent.slice(0, 2).join(", ") : "—"}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums">{r.acquisitionHistory.total}<span className="text-xo-faint"> · {r.acquisitionHistory.last12m}/12m</span></td>
                  <td className="px-2 py-2 text-xo-muted">{r.outreachPath}</td>
                  <td className={`px-2 py-2 text-center font-semibold ${CONF[r.contactConfidence]}`}>{r.contactConfidence}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{r.ndaConversionPct != null ? `${r.ndaConversionPct}%` : "—"}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{r.loiConversionPct != null ? `${r.loiConversionPct}%` : "—"}</td>
                  <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{r.closeRatePct != null ? `${r.closeRatePct}%` : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={`font-mono font-semibold tabular-nums ${LIK[r.engagementLikelihood.tier]}`} title={r.engagementLikelihood.basis}>{r.engagementLikelihood.score}<span className="text-[11px] font-normal text-xo-muted">/100</span></span>
                    <div className="text-[10px] text-xo-faint">{r.processesRun > 0 ? "with response history" : "appetite estimate"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        {filtered.length === 0 && <Empty title={`No buyer in the registry matches “${q}”.`} />}
      </Section>
    </div>
  );
};

export default EngagementRegistry;

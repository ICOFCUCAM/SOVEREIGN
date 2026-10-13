import React, { useMemo, useState } from "react";
import { Button, Modal, Field, inputCls, fmtMoney, copyText } from "../lib/ui";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { requiredEngagement } from "../lib/access";
import { PageHeader, Section, Metric as XMetric, Provenance } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { runBuyerDiscovery, type BuyerCandidate, type CompanyProfile } from "@exit/engines";
import { inlineLabel, label } from "../lib/labels";
import { loadActiveCompany } from "../lib/active-company";

// Buyer Marketplace — buyer profile cards (not a directory). Each card surfaces
// the signals a founder actually decides on: interest level, appetite, average
// deal size, time-to-close, last acquisition and founder-friendliness. The
// primary action generates a warm introduction composed from the buyer thesis,
// the company profile and the engine's fit reasoning.

// Fit level from the engine's fit probability (thresholds stated on the page).
// Founder-friendliness is not measured per buyer, so it is not shown.
function interest(c: BuyerCandidate): { label: string; pct: number; cls: string } {
  const p = c.probability;
  if (p >= 0.6) return { label: "Hot", pct: Math.round(p * 100), cls: "text-xo-verified" };
  if (p >= 0.35) return { label: "Warm", pct: Math.round(p * 100), cls: "text-xo-caution" };
  return { label: "Cool", pct: Math.round(p * 100), cls: "text-xo-muted" };
}
function warmIntro(c: BuyerCandidate, co: CompanyProfile): string {
  const sector = co.sector.replace(/_/g, " ");
  const arrM = (co.revenue.annualRecurringRevenueUsd / 1_000_000).toFixed(0);
  return (
    `Subject: Introduction — ${co.name} (${sector})\n\n` +
    `Hi ${c.buyer.name} team,\n\n` +
    `I'm reaching out because ${co.name} aligns closely with your acquisition thesis: ${c.buyer.thesis} ` +
    `We're a ${sector} business at $${arrM}M ARR growing ${(co.growth.arrGrowthYoyPct * 100).toFixed(0)}% YoY, ` +
    // Only mention recent activity when the registry records deals in the
    // last three years.
    (c.history.dealsLast3Years > 0
      ? `and your recent activity in the space — plus a check range of ${fmtMoney(c.buyer.checkSizeLowUsd)}–${fmtMoney(c.buyer.checkSizeHighUsd)} — `
      : `and your check range of ${fmtMoney(c.buyer.checkSizeLowUsd)}–${fmtMoney(c.buyer.checkSizeHighUsd)} `) +
    `makes a conversation worth both our time.\n\n` +
    `Happy to share an anonymized teaser under NDA. Would the coming week work for a short call?\n\nBest,\n[Your name]`
  );
}

const Buyers: React.FC = () => {
  // The founder's saved intake when there is one, else the demo company.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const all = useMemo(() => runBuyerDiscovery(company, { limit: 12 }).candidates, [company]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<{ type: string; appetite: string; interest: string }>({ type: "all", appetite: "all", interest: "all" });
  const candidates = useMemo(() => all.filter((c) => {
    if (filter.type !== "all" && c.buyer.buyerType !== filter.type) return false;
    if (filter.appetite !== "all" && c.buyer.appetite !== filter.appetite) return false;
    if (filter.interest === "hot" && c.probability < 0.6) return false;
    if (filter.interest === "warm" && (c.probability < 0.35 || c.probability >= 0.6)) return false;
    return true;
  }), [all, filter]);
  const activeFilters = [filter.type, filter.appetite, filter.interest].filter((f) => f !== "all").length;
  const activeBucket = candidates.filter((c) => c.buyer.appetite === "active");
  const sortedByCheck = candidates.slice().sort((a, b) =>
    (a.buyer.checkSizeLowUsd + a.buyer.checkSizeHighUsd) / 2 - (b.buyer.checkSizeLowUsd + b.buyer.checkSizeHighUsd) / 2);
  const medianCheck = sortedByCheck[Math.floor(candidates.length / 2)];
  const medianCheckUsd = medianCheck ? (medianCheck.buyer.checkSizeLowUsd + medianCheck.buyer.checkSizeHighUsd) / 2 : 0;

  const [intro, setIntro] = useState<{ name: string; text: string } | null>(null);
  const { session } = useAuth();
  // Outreach is an Active Mandate surface; say so before the click.
  const outreachGate = requiredEngagement("/console/banker", session?.role ?? "founder", session?.plan ?? "free");
  const tape = useMemo(() => buildMarketTape(), []);

  return (
    <div data-page="buyer-profiles" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Sourcing · Buyer Marketplace · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`} title="Buyer Profiles"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Profiles ranked</span></>} />

      <section aria-label="Buyer summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><XMetric label="Active-appetite buyers" value={String(activeBucket.length)} sub="registry attribute" /></div>
        <div className="bg-xo-panel"><XMetric label="In our sector" value={String(candidates.filter((c) => c.fitDimensions.sectorFit === 1).length)} sub="direct match" /></div>
        <div className="bg-xo-panel"><XMetric label="Median check midpoint" value={fmtMoney(medianCheckUsd)} sub={`across these ${candidates.length} buyers`} /></div>
        <div className="bg-xo-panel"><XMetric label="Top fit probability" emphasis value={candidates[0] ? `${(candidates[0].probability * 100).toFixed(0)}%` : "—"} sub={candidates[0]?.buyer.name} /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter buyers" subtitle={`${candidates.length} of ${all.length} match`} size="md"
        footer={<><Button variant="ghost" onClick={() => setFilter({ type: "all", appetite: "all", interest: "all" })}>Clear</Button><Button onClick={() => setFilterOpen(false)}>Done</Button></>}>
        <div className="space-y-4">
          <Field label="Buyer type">
            <select className={inputCls} value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}>
              <option value="all">All types</option>
              <option value="strategic">Strategic</option>
              <option value="pe">Private equity</option>
              <option value="family_office">Family office</option>
              <option value="sponsor">Sponsor</option>
            </select>
          </Field>
          <Field label="Appetite">
            <select className={inputCls} value={filter.appetite} onChange={(e) => setFilter((f) => ({ ...f, appetite: e.target.value }))}>
              <option value="all">Any appetite</option>
              <option value="active">Active</option>
              <option value="warm">Warm</option>
              <option value="dormant">Dormant</option>
            </select>
          </Field>
          <Field label="Fit level">
            <select className={inputCls} value={filter.interest} onChange={(e) => setFilter((f) => ({ ...f, interest: e.target.value }))}>
              <option value="all">Any fit</option>
              <option value="hot">Hot (fit ≥ 60%)</option>
              <option value="warm">Warm (fit 35–59%)</option>
            </select>
          </Field>
        </div>
      </Modal>

      {candidates[0] && (() => {
        const top = candidates[0];
        const it = interest(top);
        const topCheck = (top.buyer.checkSizeLowUsd + top.buyer.checkSizeHighUsd) / 2;
        return (
          <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
            right={<span className="font-mono text-[13px] font-semibold tabular-nums text-xo-verified">{fmtMoney(topCheck)}</span>}>
            <div className="px-4 py-3">
              <p className="text-[14px] leading-relaxed">Draft a warm intro to the best-fit buyer and take it to Outreach when you are ready.</p>
              <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
                <TakeCell k="At stake"><span className="font-mono font-semibold text-xo-verified">{fmtMoney(topCheck)}</span> check-size midpoint for {top.buyer.name}; {activeBucket.length} active-appetite buyer{activeBucket.length === 1 ? "" : "s"} (registry).</TakeCell>
                <TakeCell k="If you wait">The ranking reflects the registry snapshot; a buyer's appetite can change, and nothing here tracks it over time.</TakeCell>
                <TakeCell k="Pursue">{top.buyer.name} — fit {it.label.toLowerCase()} at {it.pct}%, {inlineLabel(top.buyer.buyerType)}.</TakeCell>
                <TakeCell k="What ExitOS does">Drafts a warm introduction for each buyer from its thesis and the company's figures. Nothing is sent from this page.</TakeCell>
              </dl>
              <Link to="/console/banker" className="mt-3 inline-block rounded-sm bg-deal-700 px-4 py-2 text-[13px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Open Outreach →</Link>
              {outreachGate && <span className="ml-3 text-[12px] text-xo-caution">Requires {outreachGate}</span>}
            </div>
          </Section>
        );
      })()}

      <Section title="Buyer profiles · ranked against your company" className="border border-xo-line"
        foot="Fit: hot at 60% or more, warm at 35–59%, cool below — the discovery engine's fit score, not measured interest. Appetite is a registry attribute. Check midpoint is the middle of the buyer's stated check range. Founder-friendliness is not measured per buyer, so it is not shown."
        right={<button type="button" onClick={() => setFilterOpen(true)} className="rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Filter{activeFilters > 0 ? ` · ${activeFilters}` : ""}</button>}>
        {candidates.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-xo-muted">No buyers match these filters. <button type="button" className="font-semibold text-xo-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action" onClick={() => setFilter({ type: "all", appetite: "all", interest: "all" })}>Clear filters</button></p>
        ) : (
          <ol className="grid grid-cols-1 gap-px bg-xo-line lg:grid-cols-2">
            {candidates.map((c, i) => {
              const it = interest(c);
              const avgCheck = (c.buyer.checkSizeLowUsd + c.buyer.checkSizeHighUsd) / 2;
              const lastDeal = c.signals.find((s) => /last deal|acquired|20\d\d/i.test(s.text))?.text;
              return (
                <li key={c.buyer.name} className="min-w-0 bg-xo-panel px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold"><span className="sr-only">Rank {i + 1}: </span>{c.buyer.name}</h3>
                      <span className="text-[11px] text-xo-muted">{label(c.buyer.buyerType)}</span>
                    </div>
                    <span className={`shrink-0 text-[12px] font-semibold ${it.cls}`}>Fit: {it.label} · {it.pct}%</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-snug text-xo-muted">{c.buyer.thesis}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-xo-line pt-2 sm:grid-cols-3">
                    <Fact label="Appetite" value={c.buyer.appetite} cls={c.buyer.appetite === "active" ? "text-xo-verified capitalize" : c.buyer.appetite === "warm" ? "text-xo-caution capitalize" : "capitalize"} />
                    <Fact label="Check midpoint" value={fmtMoney(avgCheck)} />
                    <Fact label="To close" value={c.outcomes.medianCloseDays != null ? `~${c.outcomes.medianCloseDays}d` : "—"} />
                    <Fact label="Last acq." value={lastDeal ? lastDeal.replace(/^last deal:?\s*/i, "") : "—"} />
                    <Fact label="Fit probability" value={c.probability.toFixed(2)} />
                  </dl>
                  <div className="mt-2 flex justify-end">
                    <button type="button" onClick={() => setIntro({ name: c.buyer.name, text: warmIntro(c, company) })} className="rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-semibold text-xo-action hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Warm intro<span className="sr-only"> for {c.buyer.name}</span></button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Section>

      <Modal open={intro != null} onClose={() => setIntro(null)} title={`Warm introduction · ${intro?.name ?? ""}`} size="md"
        footer={<>{outreachGate && <span className="mr-auto text-[12px] text-xo-caution">Outreach requires {outreachGate}</span>}<Button variant="ghost" onClick={() => intro && copyText(intro.text)}>Copy</Button><Link to="/console/banker" className="rounded-sm bg-deal-700 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Open Outreach →</Link></>}>
        <p className="mb-3 text-[12px] text-xo-muted">A draft generated from the buyer's thesis and the company's figures. Nothing is sent from this page — copy it, or take it to Outreach.</p>
        <pre className="whitespace-pre-wrap border border-xo-line bg-xo-ink p-4 font-sans text-[13px] leading-relaxed text-xo-text">{intro?.text}</pre>
      </Modal>
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

const Fact: React.FC<{ label: string; value: string; cls?: string }> = ({ label, value, cls }) => (
  <div className="min-w-0">
    <dt className="text-[11px] text-xo-faint">{label}</dt>
    <dd className={`mt-0.5 break-words text-[13px] font-semibold ${cls ?? "text-xo-text"}`}>{value}</dd>
  </div>
);

export default Buyers;

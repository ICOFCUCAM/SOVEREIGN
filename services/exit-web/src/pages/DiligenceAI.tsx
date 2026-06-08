import React, { useMemo, useState } from "react";
import { Button, Card, Kpi, SectionHeader, fmtMoney } from "../lib/ui";
import { DILIGENCE } from "../lib/engines";
import BankerTake from "../components/BankerTake";
import {
  discoverFindings, buildBuyerReport, buildSellerReport, SOURCE_FILES,
  type DiligenceFinding, type RiskCategory, type Severity, type RiskReport,
} from "../lib/diligence-intel";

// Diligence Intelligence Engine — ingests the uploaded document set, discovers
// the risks a buyer's analyst would find across Financial, Legal and
// Operational categories, and produces dual Buyer / Seller risk reports from
// the same findings, before any buyer sees the company.

const SEV_STYLE: Record<Severity, string> = {
  high:   "bg-red-500/15 text-red-300 ring-red-400/40",
  medium: "bg-loi-500/15 text-loi-300 ring-loi-400/40",
  low:    "bg-white/5 text-white/50 ring-white/15",
};
const SEV_DOT: Record<Severity, string> = { high: "bg-red-400", medium: "bg-loi-400", low: "bg-white/40" };

const CATEGORIES: { key: RiskCategory; blurb: string }[] = [
  { key: "Financial",   blurb: "Concentration, revenue quality, cash flow, recurring mix" },
  { key: "Legal",       blurb: "Missing contracts, IP ownership, compliance, litigation" },
  { key: "Operational", blurb: "Founder dependency, vendor & key-employee exposure" },
];

const DiligenceAI: React.FC = () => {
  const findings = useMemo(() => discoverFindings(), []);
  const buyerReport  = useMemo(() => buildBuyerReport(findings), [findings]);
  const sellerReport = useMemo(() => buildSellerReport(findings), [findings]);
  const [audience, setAudience] = useState<"buyer" | "seller">("seller");
  const [open, setOpen] = useState<string | null>(DILIGENCE.documents[0]?.kind ?? null);

  const high = findings.filter((f) => f.severity === "high").length;
  const buyerDiscount = buyerReport.totalImpactUsd;
  const report: RiskReport = audience === "buyer" ? buyerReport : sellerReport;

  // findings grouped by the source file that surfaced them
  const bySource = SOURCE_FILES.map((s) => ({ ...s, count: findings.filter((f) => f.source === s.label).length }));

  return (
    <div>
      <SectionHeader
        kicker="Phase 2 · AI Due Diligence"
        title="AI Due Diligence"
        description="Upload financial reports, contracts, tax records, customer and employment agreements. ExitOS discovers the financial, legal and operational risks a buyer will find and writes both the Buyer Diligence Report and the Seller Risk Report — the work an investment bank charges tens of thousands and weeks for, in minutes."
        actions={<Button>Re-run analysis</Button>}
      />

      <BankerTake
        next={high > 0
          ? <>Clear the <span className="text-white">{high} high-severity finding{high === 1 ? "" : "s"}</span> in the Seller Risk Report before opening the data room.</>
          : <>No high-severity risks — the package is clean enough to open to buyers.</>}
        stake={<><span className="font-mono font-bold text-red-300">-{fmtMoney(buyerDiscount)}</span> is the discount a buyer would seek against these findings.</>}
        inaction={<>Buyers who discover these in their own diligence retrade or walk — surfacing them first protects the price.</>}
        buyer={<>Resolve founder dependency and customer concentration first — they drive the structure a buyer demands.</>}
        automate={<>ExitOS reads every uploaded file, classifies the risk, prices the impact and drafts both risk reports.</>}
        impact={<>-{fmtMoney(buyerDiscount)}</>}
        cta={{ label: "Open the data room", to: "/console/data-room" }}
      />

      {/* ── Ingestion ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {bySource.map((s) => (
          <Card key={s.key} className="p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-deal-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-deal-400" /> Analyzed
            </div>
            <div className="mt-1.5 text-[13px] font-semibold leading-tight text-white">{s.label}</div>
            <div className="mt-0.5 text-[10px] text-white/40">{s.note}</div>
            <div className="mt-2 font-mono text-lg font-bold text-white">{s.count}</div>
            <div className="text-[10px] uppercase tracking-wide text-white/40">finding{s.count === 1 ? "" : "s"}</div>
          </Card>
        ))}
      </div>

      {/* Value prop — what a bank charges vs. what ExitOS just did */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-deal-500/30 bg-gradient-to-r from-deal-600/12 to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">Investment bank</div>
            <div className="font-mono text-sm text-white/70 line-through decoration-white/30">$40,000+ · 4–6 weeks</div>
          </div>
          <span className="text-xl text-white/25">→</span>
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-deal-300">ExitOS</div>
            <div className="font-mono text-sm font-bold text-deal-300">{findings.length} findings · 2 reports · seconds</div>
          </div>
        </div>
        <button className="inline-flex items-center rounded-md bg-deal-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-deal-500">Export both reports →</button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Risks discovered" value={String(findings.length)} sub="across 3 categories" accent={high ? "#f87171" : "#34d399"} />
        <Kpi label="High severity" value={String(high)} sub="resolve before buyer access" accent="#f87171" />
        <Kpi label="Est. buyer discount" value={`-${fmtMoney(buyerDiscount)}`} sub="value buyers would deduct" accent="#f87171" />
        <Kpi label="Critical questions" value={String(DILIGENCE.criticalQuestions.length)} sub="acquirers will ask" />
      </div>

      {/* ── Discovered risks by category ─────────────────────────── */}
      <h2 className="mt-10 mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Discovered risks</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const items = findings.filter((f) => f.category === cat.key);
          return (
            <div key={cat.key}>
              <div className="mb-2">
                <h3 className="font-serif text-base font-bold text-white">{cat.key} risks</h3>
                <p className="text-[11px] text-white/45">{cat.blurb}</p>
              </div>
              <div className="space-y-3">
                {items.map((f) => <FindingCard key={f.id} f={f} audience={audience} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Dual risk reports ────────────────────────────────────── */}
      <div className="mt-12 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-white">Generated diligence reports</h2>
          <p className="text-xs text-white/45">The same findings, written for each side of the table — Buyer Diligence Report and Seller Risk Report.</p>
        </div>
        <div className="inline-flex rounded-md border border-white/15 bg-ink-800/40 p-1">
          <button onClick={() => setAudience("seller")} className={`rounded px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${audience === "seller" ? "bg-deal-600/30 text-white" : "text-white/55 hover:text-white"}`}>Seller report</button>
          <button onClick={() => setAudience("buyer")} className={`rounded px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${audience === "buyer" ? "bg-deal-600/30 text-white" : "text-white/55 hover:text-white"}`}>Buyer report</button>
        </div>
      </div>

      <Card className={`mt-4 overflow-hidden p-0 ring-1 ${audience === "buyer" ? "ring-red-400/30" : "ring-deal-400/30"}`}>
        <div className={`border-b border-white/10 px-6 py-4 ${audience === "buyer" ? "bg-red-500/10" : "bg-deal-600/10"}`}>
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold ring-1 ${audience === "buyer" ? "bg-red-500/25 text-red-200 ring-red-400/40" : "bg-deal-600/30 text-deal-200 ring-deal-400/40"}`}>
              {audience === "buyer" ? "B" : "S"}
            </span>
            <span className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${audience === "buyer" ? "text-red-200" : "text-deal-300"}`}>{report.title}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/80">{report.headline}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-[12px]">
            <span className="text-white/55">{report.bySeverity.high} high</span>
            <span className="text-white/55">{report.bySeverity.medium} medium</span>
            <span className="text-white/55">{report.bySeverity.low} low</span>
            <span className="font-mono font-semibold text-white">{audience === "buyer" ? `-${fmtMoney(report.totalImpactUsd)} sought` : `${fmtMoney(report.totalImpactUsd)} protected`}</span>
          </div>
        </div>
        <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
          <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">{audience === "buyer" ? "What we'll diligence & discount" : "Fix before going to market"}</div>
            <ul className="mt-3 space-y-3">
              {report.points.map((p) => (
                <li key={p.title}>
                  <div className="text-[12px] font-semibold uppercase tracking-wide text-white/55">{p.title}</div>
                  <div className="mt-0.5 text-[13px] leading-snug text-white/80">{p.body}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Recommendation</div>
            <p className="mt-3 text-[13px] leading-relaxed text-white/75">{report.recommendation}</p>
            <Button variant="ghost" className="mt-4 text-[12px]">Export {audience === "buyer" ? "buyer" : "seller"} report</Button>
          </div>
        </div>
      </Card>

      {/* ── Diligence question bank ──────────────────────────────── */}
      <h2 className="mt-12 mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Diligence question bank</h2>
      <div className="space-y-2">
        {DILIGENCE.documents.map((d) => (
          <Card key={d.kind} className="overflow-hidden">
            <button onClick={() => setOpen(open === d.kind ? null : d.kind)} className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-white/[0.03]">
              <div>
                <div className="text-sm font-bold text-white">{d.title}</div>
                <div className="text-[11px] text-white/45">{d.sections.length} sections · classification: {d.classification}</div>
              </div>
              <span className="text-white/40">{open === d.kind ? "–" : "+"}</span>
            </button>
            {open === d.kind && (
              <div className="space-y-4 border-t border-white/10 px-5 py-4">
                {d.sections.map((s) => (
                  <div key={s.heading}>
                    <div className="text-[12px] font-semibold text-deal-300">{s.heading}</div>
                    <ul className="mt-1.5 space-y-1 text-[12px] text-white/65">
                      {s.questions.map((q) => (
                        <li key={q} className="flex items-baseline gap-2"><span className="mt-1 inline-block h-1 w-1 rounded-full bg-white/30" />{q}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

const FindingCard: React.FC<{ f: DiligenceFinding; audience: "buyer" | "seller" }> = ({ f, audience }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${SEV_DOT[f.severity]}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{f.subcategory}</span>
      </div>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${SEV_STYLE[f.severity]}`}>{f.severity}</span>
    </div>
    <div className="mt-1.5 text-[13px] font-semibold leading-snug text-white">{f.title}</div>
    <p className="mt-1 text-[11.5px] leading-snug text-white/55">{f.detail}</p>
    <div className="mt-3 rounded-md border border-white/10 bg-ink-900/50 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">{audience === "buyer" ? "Buyer view" : "Your move"}</span>
        <span className="font-mono text-[11px] text-red-300/80">-{fmtMoney(f.impactUsd)}</span>
      </div>
      <p className="mt-1 text-[11.5px] leading-snug text-white/70">{audience === "buyer" ? f.buyerView : f.sellerAction}</p>
    </div>
    <div className="mt-2 text-[10px] text-white/35">Source: {f.source}</div>
  </Card>
);

export default DiligenceAI;

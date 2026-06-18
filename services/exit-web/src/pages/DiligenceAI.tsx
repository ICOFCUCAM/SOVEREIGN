import React, { useMemo, useState } from "react";
import { Button, Card, fmtMoney, downloadText, downloadJson, notify } from "../lib/ui";
import { CommandHeader } from "../lib/workstation";
import { DILIGENCE } from "../lib/engines";
import BankerTake from "../components/BankerTake";
import {
  discoverFindings, allReports, SOURCE_FILES,
  type DiligenceFinding, type RiskCategory, type Severity,
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
  const reports = useMemo(() => allReports(findings), [findings]);
  const [reportKey, setReportKey] = useState<string>("seller");
  const [open, setOpen] = useState<string | null>(DILIGENCE.documents[0]?.kind ?? null);

  const high = findings.filter((f) => f.severity === "high").length;
  const buyerDiscount = findings.reduce((s, f) => s + f.impactUsd, 0);
  const [rerunning, setRerunning] = useState(false);
  const rerun = (): void => {
    setRerunning(true);
    setTimeout(() => {
      setRerunning(false);
      notify(`Re-ran across ${SOURCE_FILES.length} sources · ${findings.length} findings (${high} high-severity)`);
    }, 800);
  };
  const report = reports.find((r) => r.key === reportKey) ?? reports[0];

  const reportMarkdown = (r: typeof report): string =>
    `# ${r.title}\n\n${r.headline}\n\nHeadline metric: ${r.metric}\n\n## Findings\n` +
    (r.points.length ? r.points.map((p) => `- **${p.title}** — ${p.body}`).join("\n") : "- None on this dimension.") +
    `\n\n## Recommendation\n${r.recommendation}\n`;

  // findings grouped by the source file that surfaced them
  const bySource = SOURCE_FILES.map((s) => ({ ...s, count: findings.filter((f) => f.source === s.label).length }));

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="Due Diligence"
        title="AI Due Diligence"
        tag="Buyer + Seller reports"
        status={high > 0 ? `${high} high severity` : "Clean"}
        metrics={[
          { k: "Risks discovered", v: String(findings.length), accent: true, sub: "across 3 categories" },
          { k: "High severity", v: String(high), sub: "resolve before access" },
          { k: "Est. buyer discount", v: `-${fmtMoney(buyerDiscount)}`, sub: "buyers would deduct" },
          { k: "Critical questions", v: String(DILIGENCE.criticalQuestions.length), sub: "acquirers will ask" },
        ]}
      />


      <div className="flex justify-end">
        <Button variant="ghost" onClick={rerun} disabled={rerunning}>{rerunning ? "Re-running…" : "Re-run analysis"}</Button>
      </div>

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
        <button onClick={() => downloadJson("exitos-diligence-reports.json", reports)} className="inline-flex items-center rounded-md bg-deal-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-deal-500">Export both reports →</button>
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
                {items.map((f) => <FindingCard key={f.id} f={f} audience={report.accent} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Generated reports — six, from one scan ───────────────── */}
      <div className="mt-12">
        <h2 className="font-serif text-lg font-bold text-white">Generated reports</h2>
        <p className="text-xs text-white/45">Six reports an investment bank and law firm would bill thousands for — produced from one scan.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {reports.map((r) => (
            <button key={r.key} onClick={() => setReportKey(r.key)}
              className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${report.key === r.key ? "bg-deal-600/25 text-white ring-1 ring-deal-400/40" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
              {r.title}
            </button>
          ))}
        </div>
      </div>

      <Card className={`mt-4 overflow-hidden p-0 ring-1 ${report.accent === "buyer" ? "ring-red-400/30" : "ring-deal-400/30"}`}>
        <div className={`border-b border-white/10 px-6 py-4 ${report.accent === "buyer" ? "bg-red-500/10" : "bg-deal-600/10"}`}>
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${report.accent === "buyer" ? "text-red-200" : "text-deal-300"}`}>{report.title}</span>
            <span className="font-mono text-sm font-bold text-white">{report.metric}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/80">{report.headline}</p>
        </div>
        <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
          <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Findings</div>
            <ul className="mt-3 space-y-3">
              {report.points.length === 0 ? (
                <li className="text-[13px] text-white/55">Nothing flagged in this report — clean on this dimension.</li>
              ) : report.points.map((p) => (
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
            <Button variant="ghost" className="mt-4 text-[12px]" onClick={() => downloadText(`exitos-${report.key}-report.md`, reportMarkdown(report))}>Export this report</Button>
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

import React, { useMemo, useState } from "react";
import { fmtMoney, downloadText, downloadJson } from "../lib/ui";
import { MarketTape } from "../lib/workstation";
import { PageHeader, Section, Metric, Chip, Disclosure } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { DILIGENCE, VALUATION_CANONICAL } from "../lib/engines";
import BankerTake from "../components/BankerTake";
import {
  discoverFindings, allReports, SOURCE_FILES,
  type DiligenceFinding, type RiskCategory, type Severity,
} from "../lib/diligence-intel";

// Diligence — fixed checks on the company profile that surface the risks a
// buyer's analyst would probe across Financial, Legal and Operational
// categories, framed as Buyer / Seller risk reports from the same findings.
// No document is uploaded or read here; each check names the document a
// buyer would use to test it.

const SEV_STYLE: Record<Severity, string> = {
  high:   "border-xo-risk/50 text-xo-risk",
  medium: "border-xo-caution/50 text-xo-caution",
  low:    "border-xo-line text-xo-muted",
};
const SEV_DOT: Record<Severity, string> = { high: "bg-xo-risk", medium: "bg-xo-caution", low: "bg-xo-muted" };

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
  const MID = VALUATION_CANONICAL.headline.mid;
  const sharePct = (usd: number): string => String(Math.round((usd / MID) * 200) / 2);
  const report = reports.find((r) => r.key === reportKey) ?? reports[0];

  const reportMarkdown = (r: typeof report): string =>
    `# ${r.title}\n\n${r.headline}\n\nHeadline metric: ${r.metric}\n\n## Findings\n` +
    (r.points.length ? r.points.map((p) => `- **${p.title}** — ${p.body}`).join("\n") : "- None on this dimension.") +
    `\n\n## Recommendation\n${r.recommendation}\n`;

  // findings grouped by the source file that surfaced them
  const bySource = SOURCE_FILES.map((s) => ({ ...s, count: findings.filter((f) => f.source === s.label).length }));

  const tape = useMemo(() => buildMarketTape(), []);
  const BTN = "inline-flex items-center rounded-sm bg-deal-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
  const BTN_GHOST = "inline-flex items-center rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";

  return (
    <div data-page="diligence" className="space-y-3 text-xo-text">
      <PageHeader eyebrow="◉ Due Diligence" title="AI Due Diligence"
        badge={<span className="text-[12px] text-xo-muted">Buyer + Seller reports · <span className={high > 0 ? "text-xo-risk" : "text-xo-verified"}>{high > 0 ? `${high} high severity` : "Clean"}</span></span>}
        description="Findings recompute from the company profile each time the page opens." />

      <section aria-label="Diligence summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Risks discovered" emphasis value={String(findings.length)} sub="across 3 categories" /></div>
        <div className="bg-xo-panel"><Metric label="High severity" value={String(high)} sub="resolve before access" /></div>
        <div className="bg-xo-panel"><Metric label="Illustrative discount (rule)" value={`-${fmtMoney(buyerDiscount)}`} sub={`${sharePct(buyerDiscount)}% of the ${fmtMoney(MID)} midpoint · not a buyer estimate`} /></div>
        <div className="bg-xo-panel"><Metric label="Critical questions" value={String(DILIGENCE.criticalQuestions.length)} sub="acquirers will ask" /></div>
      </section>

      <MarketTape items={tape} />

      <BankerTake
        next={high > 0
          ? <>Clear the <span className="text-white">{high} high-severity finding{high === 1 ? "" : "s"}</span> in the Seller Risk Report before opening the data room.</>
          : <>No high-severity risks — the package is clean enough to open to buyers.</>}
        stake={<><span className="font-mono font-bold text-red-300">-{fmtMoney(buyerDiscount)}</span> by the illustrative rule — not an estimate of what a buyer would deduct.</>}
        inaction={<>Buyers who discover these in their own diligence retrade or walk — surfacing them first protects the price.</>}
        buyer={<>Resolve founder dependency and customer concentration first — they drive the structure a buyer demands.</>}
        automate={<>ExitOS applies fixed checks to the company profile and drafts the reports. It does not read documents.</>}
        impact={<>-{fmtMoney(buyerDiscount)}</>}
        cta={{ label: "Open the data room", to: "/console/data-room" }}
      />

      {/* ── Where a buyer would look ─────────────────────────────── */}
      <Section title="Where a buyer would look" className="border border-xo-line"
        foot="The findings are fixed checks on the company profile — no document is uploaded or read here. Each check names the document a buyer would use to test it; the counts are checks per document.">
        <ul className="grid grid-cols-2 gap-px bg-xo-line sm:grid-cols-5">
          {bySource.map((s) => (
            <li key={s.key} className="bg-xo-panel px-4 py-3">
              <div className="text-[13px] font-semibold leading-tight">{s.label}</div>
              <div className="mt-0.5 text-[11px] text-xo-muted">{s.note}</div>
              <div className="mt-2 font-mono text-lg font-semibold">{s.count}</div>
              <div className="text-[11px] text-xo-muted">check{s.count === 1 ? "" : "s"} · not analysed</div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Value prop — what a bank charges vs. what ExitOS just did */}
      <section aria-label="Comparison and exports" className="flex flex-wrap items-center justify-between gap-4 border border-xo-line bg-xo-panel px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px]">
          <div>
            <div className="text-[11px] text-xo-muted">Investment bank</div>
            <div className="font-mono text-[13px] text-xo-muted line-through">$40,000+ · 4–6 weeks</div>
          </div>
          <span aria-hidden className="text-xl text-xo-faint">→</span>
          <div>
            <div className="text-[11px] text-xo-verified">ExitOS</div>
            <div className="font-mono text-[13px] font-semibold text-xo-verified">{findings.length} findings · 2 reports · seconds</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => downloadJson("exitos-diligence-reports.json", reports)} className={BTN_GHOST}>Export data (.json)</button>
          <a href="/report/diligence" target="_blank" rel="noopener noreferrer" className={BTN}>Board-ready report (PDF) →</a>
        </div>
      </section>

      <p role="note" className="border border-xo-line bg-xo-panel px-4 py-2.5 text-[12px] text-xo-muted">
        <span className="font-semibold text-xo-text">Illustrative discount rule.</span> Each finding carries a fixed share of the canonical midpoint ({fmtMoney(MID)}), whatever its severity: {[...findings].sort((a, b) => b.impactUsd - a.impactUsd).map((f) => `${f.subcategory} ${sharePct(f.impactUsd)}%`).join(", ")} — {sharePct(buyerDiscount)}% in all. The shares are ExitOS assumptions, not measured buyer behaviour or a quote.
      </p>

      {/* ── Discovered risks by category ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const items = findings.filter((f) => f.category === cat.key);
          return (
            <Section key={cat.key} title={`${cat.key} risks`} eyebrow="Discovered risks" foot={cat.blurb}>
              <ul className="space-y-px bg-xo-line">
                {items.map((f) => <FindingCard key={f.id} f={f} audience={report.accent} />)}
              </ul>
            </Section>
          );
        })}
      </div>

      {/* ── Generated reports — six, from one scan ───────────────── */}
      <Section title="Generated reports" className="border border-xo-line"
        right={<span className="text-[11px] text-xo-muted">Six reports an investment bank and law firm would bill thousands for — produced from one scan.</span>}>
        <div className="px-4 pt-3">
          <div role="group" aria-label="Report" className="flex flex-wrap gap-2">
            {reports.map((r) => <Chip key={r.key} pressed={report.key === r.key} onToggle={() => setReportKey(r.key)}>{r.title}</Chip>)}
          </div>
        </div>
        <div className="m-4 border border-xo-line">
          <div className="border-b border-xo-line bg-xo-ink px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className={`text-[13px] font-semibold ${report.accent === "buyer" ? "text-xo-risk" : "text-xo-verified"}`}>{report.title}</h3>
              <span className="font-mono text-[13px] font-semibold">{report.metric}</span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-xo-muted">{report.headline}</p>
          </div>
          <div className="grid gap-px bg-xo-line lg:grid-cols-[1.4fr_1fr]">
            <div className="bg-xo-panel px-4 py-3">
              <h4 className="text-[12px] font-semibold text-xo-muted">Findings</h4>
              <ul className="mt-2 space-y-3">
                {report.points.length === 0 ? (
                  <li className="text-[13px] text-xo-muted">Nothing flagged in this report — clean on this dimension.</li>
                ) : report.points.map((p) => (
                  <li key={p.title}>
                    <div className="text-[12px] font-semibold">{p.title}</div>
                    <div className="mt-0.5 text-[13px] leading-snug text-xo-muted">{p.body}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-xo-panel px-4 py-3">
              <h4 className="text-[12px] font-semibold text-xo-muted">Recommendation</h4>
              <p className="mt-2 text-[13px] leading-relaxed text-xo-muted">{report.recommendation}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" className={BTN_GHOST} onClick={() => downloadText(`exitos-${report.key}-report.md`, reportMarkdown(report))}>Export draft (.md)</button>
                <a href="/report/diligence" target="_blank" rel="noopener noreferrer" className={BTN}>Board-ready report (PDF) →</a>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Diligence question bank ──────────────────────────────── */}
      <Section title="Diligence question bank" className="border border-xo-line">
        <ul>
          {DILIGENCE.documents.map((d) => (
            <li key={d.kind} className="border-b border-xo-line last:border-0">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <h3 className="text-[13px] font-semibold">{d.title}</h3>
                  <div className="text-[11px] text-xo-muted">{d.sections.length} sections · classification: {d.classification}</div>
                </div>
                <Disclosure open={open === d.kind} onToggle={() => setOpen(open === d.kind ? null : d.kind)} controls={`qb-${d.kind}`}>{open === d.kind ? "Hide questions" : "Show questions"}</Disclosure>
              </div>
              {open === d.kind && (
                <div id={`qb-${d.kind}`} className="space-y-4 border-t border-xo-line px-4 py-3">
                  {d.sections.map((s) => (
                    <div key={s.heading}>
                      <h4 className="text-[12px] font-semibold text-xo-verified">{s.heading}</h4>
                      <ul className="mt-1.5 space-y-1 text-[12px] text-xo-muted">
                        {s.questions.map((q) => (
                          <li key={q} className="flex items-baseline gap-2"><span aria-hidden className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-xo-faint" />{q}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
};

const FindingCard: React.FC<{ f: DiligenceFinding; audience: "buyer" | "seller" }> = ({ f, audience }) => (
  <li className="bg-xo-panel px-4 py-3">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${SEV_DOT[f.severity]}`} />
        <span className="text-[11px] font-semibold text-xo-muted">{f.subcategory}</span>
      </div>
      <span className={`shrink-0 rounded-sm border px-1.5 py-px text-[11px] font-semibold ${SEV_STYLE[f.severity]}`}>{f.severity}</span>
    </div>
    <h3 className="mt-1.5 text-[13px] font-semibold leading-snug">{f.title}</h3>
    <p className="mt-1 text-[12px] leading-snug text-xo-muted">{f.detail}</p>
    <div className="mt-3 border border-xo-line bg-xo-ink p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-xo-muted">{audience === "buyer" ? "Buyer view" : "Your move"}</span>
        <span className="font-mono text-[12px] text-xo-risk"><span className="font-sans text-[11px] text-xo-muted">illustrative </span>-{fmtMoney(f.impactUsd)}</span>
      </div>
      <p className="mt-1 text-[12px] leading-snug">{audience === "buyer" ? f.buyerView : f.sellerAction}</p>
    </div>
    <div className="mt-2 text-[11px] text-xo-muted">A buyer would check: {f.source}</div>
  </li>
);

export default DiligenceAI;

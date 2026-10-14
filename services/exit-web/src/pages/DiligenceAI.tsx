import React, { useMemo, useState } from "react";
import { frameDoc } from "../lib/deliverables";
import { fmtMoney, downloadText, downloadJson, notify } from "../lib/ui";
import { PageHeader, Section, Metric, Chip, Disclosure, Provenance, ActionLink } from "../components/xo";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { buildMarketTape } from "../lib/market-tape";
import { DILIGENCE as DEMO_DILIGENCE, VALUATION_CANONICAL } from "../lib/engines";
import { runDueDiligence } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { canonicalValuationFor } from "../lib/canonical-valuation";
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
  // The founder's saved intake when there is one; the demo company otherwise.
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const MID = useMemo(() => (fromIntake ? canonicalValuationFor(company).headline.mid : VALUATION_CANONICAL.headline.mid), [company, fromIntake]);
  const DILIGENCE = useMemo(() => (fromIntake ? runDueDiligence(company) : DEMO_DILIGENCE), [company, fromIntake]);
  const findings = useMemo(() => discoverFindings(company, MID), [company, MID]);
  const reports = useMemo(() => allReports(findings, MID), [findings, MID]);
  const [reportKey, setReportKey] = useState<string>("seller");
  const [open, setOpen] = useState<string | null>(DILIGENCE.documents[0]?.kind ?? null);

  const high = findings.filter((f) => f.severity === "high").length;
  const buyerDiscount = findings.reduce((s, f) => s + f.impactUsd, 0);
  const sharePct = (usd: number): string => String(Math.round((usd / MID) * 200) / 2);
  // PRELAUNCH-REVIEW: re-run control restored (the checks recompute from the profile on every render)
  const [rerunning, setRerunning] = useState(false);
  const rerun = (): void => {
    setRerunning(true);
    setTimeout(() => {
      setRerunning(false);
      notify(`Re-ran across ${SOURCE_FILES.length} sources · ${findings.length} findings (${high} high-severity)`);
    }, 800);
  };
  const report = reports.find((r) => r.key === reportKey) ?? reports[0];

  // framed like every other export: confidentiality line, basis and the standard notices
  const reportMarkdown = (r: typeof report): string => frameDoc({
    title: r.title,
    subtitle: `${company.name} · rule-based diligence checks on the company's figures`,
    meta: [["Headline metric", r.metric]],
    sections: [
      { heading: "Summary", body: r.headline },
      { heading: "Findings", bullets: r.points.length ? r.points.map((p) => `**${p.title}** — ${p.body}`) : ["None on this dimension."] },
      { heading: "Recommendation", body: r.recommendation },
    ],
    ...(fromIntake ? {} : { sample: "These checks run on the demo company's figures." }),
  });

  // findings grouped by the source file that surfaced them
  const bySource = SOURCE_FILES.map((s) => ({ ...s, count: findings.filter((f) => f.source === s.label).length }));

  const tape = useMemo(() => buildMarketTape(), []);
  const BTN = "inline-flex items-center rounded-sm bg-desk-gold px-3 py-1.5 text-[12px] font-semibold text-desk-ink hover:bg-[#AA8443] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
  const BTN_GHOST = "inline-flex items-center rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-text hover:bg-xo-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action disabled:opacity-60";

  return (
    <div data-page="diligence" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Due Diligence · rule-based checks · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`} title="Diligence"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Buyer + Seller reports · <span className={high > 0 ? "text-xo-risk" : "text-xo-verified"}>{high > 0 ? `${high} high severity` : "Clean"}</span></span></>}
        description={`Findings recompute from the company profile each time the page opens — ${fromIntake ? "your saved intake" : "the demo company; save an intake to check yours"}.`}
        actions={<button type="button" onClick={rerun} disabled={rerunning} className={BTN_GHOST}>{rerunning ? "Re-running…" : "Re-run analysis"}</button>} />

      <section aria-label="Diligence summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Risks discovered" emphasis value={String(findings.length)} sub="across 3 categories" /></div>
        <div className="bg-xo-panel"><Metric label="High severity" value={String(high)} sub="resolve before access" /></div>
        <div className="bg-xo-panel"><Metric label="Illustrative discount (rule)" value={`-${fmtMoney(buyerDiscount)}`} sub={`${sharePct(buyerDiscount)}% of the ${fmtMoney(MID)} midpoint · not a buyer estimate`} /></div>
        <div className="bg-xo-panel"><Metric label="Critical questions" value={String(DILIGENCE.criticalQuestions.length)} sub="acquirers will ask" /></div>
      </section>

      <RegistryTape items={tape} asOf={DNA_AS_OF.slice(0, 10)} />

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line"
        right={<span className={`text-[13px] font-semibold ${high > 0 ? "text-xo-risk" : "text-xo-verified"}`}>{high > 0 ? `${high} high severity` : "Clean"}</span>}>
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">{high > 0
            ? <>Clear the <span className="font-semibold">{high} high-severity finding{high === 1 ? "" : "s"}</span> in the Seller Risk Report before opening the data room.</>
            : <>No high-severity findings — the checks raise nothing that should hold back the data room.</>}</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="At stake"><span className="font-mono text-xo-risk">-{fmtMoney(buyerDiscount)}</span> by the illustrative rule — not an estimate of what a buyer would deduct.</TakeCell>
            <TakeCell k="If you wait">Buyers who find these in their own diligence retrade or walk — raising them first protects the price.</TakeCell>
            <TakeCell k="First">Founder dependency and customer concentration — they drive the structure a buyer asks for.</TakeCell>
            <TakeCell k="What ExitOS does">Applies fixed checks to the company profile and drafts the reports. It does not read documents. <ActionLink to="/console/data-room">Open the data room →</ActionLink></TakeCell>
          </dl>
        </div>
      </Section>

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

      {/* Exports */}
      <section aria-label="Exports" className="flex flex-wrap items-center justify-between gap-4 border border-xo-line bg-xo-panel px-4 py-3">
        <p className="text-[12px] text-xo-muted"><span className="font-semibold text-xo-text">{findings.length} findings · {reports.length} reports</span> from the same checks — export them or open the printable report.</p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => downloadJson("exitos-diligence-reports.json", reports)} className={BTN_GHOST}>Export data (.json)</button>
          <a href="/report/diligence" target="_blank" rel="noopener noreferrer" className={BTN}>Board-ready report →</a>
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
        right={<span className="text-[11px] text-xo-muted">Six views of the same findings.</span>}>
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
                <a href="/report/diligence" target="_blank" rel="noopener noreferrer" className={BTN}>Board-ready report →</a>
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

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

export default DiligenceAI;

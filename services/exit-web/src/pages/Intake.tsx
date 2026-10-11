import React, { useMemo, useState } from "react";
import { fmtMoney, Button } from "../lib/ui";
import { runInstitutionalValuation } from "@exit/engines";
import {
  buildProfile, SECTORS, SAMPLE_INTAKE, type IntakeInputs, type Sector,
} from "../lib/company-intake";
import { listCompany } from "../lib/listings";
import { loadSavedIntake, saveIntake, clearIntake } from "../lib/active-company";
import { NUMERIC_FIELDS, parseField, textsFor, type NumericKey } from "../lib/intake-fields";
import { Section, Metric, Provenance, ScrollRegion, ActionLink } from "../components/xo";

// ── VALUE MY COMPANY ────────────────────────────────────────────────
// Page 03 of the ExitOS institutional redesign (docs/redesign/PAGE-03-
// VALUE-MY-COMPANY.md). The founder enters their figures (left) and reads
// the institutional answer (right): value → key figures → likely buyers →
// comparable transactions → evidence. Every figure is the valuation
// constitution computed live on the inputs; the figures are saved only when
// the founder edits them, and then drive every console page.

const pct = (x: number): string => `${Math.round(x * 100)}%`;
const usd = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);
const INPUT = "w-full rounded-sm border bg-xo-ink px-2.5 py-2 text-[13px] text-xo-text placeholder:text-xo-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";
const LABEL = "mb-1 block text-[12px] font-medium text-xo-muted";

const Intake: React.FC = () => {
  // Saved only when the founder edits a field — opening the page saves nothing.
  const [inp, setInp] = useState<IntakeInputs>(() => loadSavedIntake() ?? SAMPLE_INTAKE);
  const [saved, setSaved] = useState<boolean>(() => loadSavedIntake() !== null);

  const report = useMemo(() => runInstitutionalValuation(buildProfile(inp)), [inp]);
  const [listed, setListed] = useState(false);
  const set = <K extends keyof IntakeInputs>(k: K, v: IntakeInputs[K]): void => {
    setInp((p) => { const next = { ...p, [k]: v }; saveIntake(next); return next; });
    setSaved(true); setListed(false);
  };
  // Number fields keep exactly what was typed; only valid values reach the engines.
  const [texts, setTexts] = useState<Record<NumericKey, string>>(() => textsFor(inp));
  const [errors, setErrors] = useState<Partial<Record<NumericKey, string>>>({});
  const typeNumber = (k: NumericKey, text: string): void => {
    setTexts((t) => ({ ...t, [k]: text }));
    const spec = NUMERIC_FIELDS.find((f) => f.key === k)!;
    const res = parseField(spec, text);
    setErrors((e) => { const n = { ...e }; if (res.ok) delete n[k]; else n[k] = res.error; return n; });
    if (res.ok) set(k, res.value as never);
  };
  const clearMine = (): void => { clearIntake(); setInp(SAMPLE_INTAKE); setTexts(textsFor(SAMPLE_INTAKE)); setErrors({}); setSaved(false); setListed(false); };

  const m = report.mandatoryOutputs;

  return (
    <div data-page="value-my-company" className="space-y-3 text-xo-text">
      {/* ── header ─────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border border-xo-line bg-xo-ink px-4 py-3">
        <div className="min-w-0 max-w-[70ch]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-xo-brass">Acquisition Intelligence · Intake</div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-serif text-[24px] font-semibold tracking-tight">Value my company</h1>
            <Provenance kind={saved ? "company" : "demo"} />
          </div>
          <p className="mt-1 text-[13px] text-xo-muted">Enter your company and receive the institutional answer in seconds — enterprise value, the buyers most likely to acquire you, comparable transactions and the evidence behind every figure.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => { listCompany(buildProfile(inp)); setListed(true); }}>{listed ? "✓ Listed (anonymized)" : "List on the exchange"}</Button>
          {saved && <Button variant="ghost" onClick={clearMine}>Clear my data</Button>}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ── the form ───────────────────────────────────────────────── */}
        <Section title="Your company" eyebrow="Inputs · recomputes as you type" className="self-start border border-xo-line">
          <div className="space-y-3 px-4 py-4">
            <div>
              <label htmlFor="intake-name" className={LABEL}>Company name</label>
              <input id="intake-name" className={`${INPUT} border-xo-line`} value={inp.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="intake-sector" className={LABEL}>Sector</label>
                <select id="intake-sector" className={`${INPUT} border-xo-line capitalize`} value={inp.sector} onChange={(e) => set("sector", e.target.value as Sector)}>
                  {SECTORS.map((x) => <option key={x} value={x}>{x.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="intake-hq" className={LABEL}>HQ country (ISO)</label>
                <input id="intake-hq" className={`${INPUT} border-xo-line uppercase`} value={inp.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              {NUMERIC_FIELDS.map((f) => {
                const err = errors[f.key];
                const id = `intake-${f.key}`;
                return (
                  <div key={f.key}>
                    <label htmlFor={id} className={LABEL}>{f.label} <span className="text-xo-faint">({f.unit === "customers" ? "count" : f.unit})</span></label>
                    <input id={id} className={`${INPUT} font-mono tabular-nums ${err ? "border-xo-risk" : "border-xo-line"}`} inputMode={f.integer ? "numeric" : "decimal"}
                      value={texts[f.key]} onChange={(e) => typeNumber(f.key, e.target.value)}
                      aria-invalid={err ? true : undefined} aria-describedby={`${id}-msg`} />
                    <span id={`${id}-msg`} className={`mt-1 block text-[11px] leading-snug ${err ? "text-xo-risk" : "text-xo-faint"}`}>{err ?? f.hint}</span>
                  </div>
                );
              })}
            </div>
            <fieldset className="flex flex-wrap gap-x-5 gap-y-2 border-t border-xo-line pt-3">
              <legend className="sr-only">Defensibility</legend>
              <label className="flex items-center gap-2 text-[13px] text-xo-muted"><input type="checkbox" className="accent-emerald-500" checked={inp.hasNetworkEffects} onChange={(e) => set("hasNetworkEffects", e.target.checked)} /> Network effects</label>
              <label className="flex items-center gap-2 text-[13px] text-xo-muted"><input type="checkbox" className="accent-emerald-500" checked={inp.hasDataMoat} onChange={(e) => set("hasDataMoat", e.target.checked)} /> Data moat</label>
            </fieldset>
            <p role="status" className="border-t border-xo-line pt-3 text-[12px] text-xo-muted">
              {saved
                ? "Your figures are saved in this browser and every console page now uses them."
                : `Showing the demo company (${SAMPLE_INTAKE.name}). Edit any field to value your own company; nothing is saved until you do.`}
            </p>
          </div>
        </Section>

        {/* ── the report ─────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-3">
          <Section title="Enterprise value" eyebrow="Institutional valuation framework · the console value" className="border border-xo-line"
            right={<Provenance kind="model" />}>
            <div className="px-4 py-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-[36px] font-semibold leading-none tabular-nums">{fmtMoney(report.headline.mid)}</span>
                <span className="font-mono text-[14px] tabular-nums text-xo-muted">{fmtMoney(report.headline.low)} – {fmtMoney(report.headline.high)}</span>
                <span className="text-[12px] text-xo-muted">Confidence <span className="font-mono text-xo-text">{report.confidence.score}%</span> · {report.confidence.tier}</span>
              </div>
              <p className="mt-3 max-w-[70ch] text-[13px] leading-relaxed text-xo-muted">
                Midpoint = financial baseline {usd(report.financialBaseline.mid)} × (1 + {pct(report.premium.appliedPct)} strategic premium). {report.premium.note}
              </p>
              <p className="mt-2 text-[12px] text-xo-faint">{saved ? "This is the value every console page shows for your company." : "Once you edit a field, this becomes the value every console page shows for your company."}</p>
            </div>
          </Section>

          <section aria-label="Key figures" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-xo-panel"><Metric label="Strategic premium" value={`+${pct(report.premium.appliedPct)}`} sub={`range ${pct(report.premium.rangeLowPct)}–${pct(report.premium.rangeHighPct)}`} /></div>
            <div className="bg-xo-panel"><Metric label="Comparables" value={String(report.comparablesUsed)} sub="source-referenced" /></div>
            <div className="bg-xo-panel"><Metric label="Qualified buyers" value={String(report.buyerUniverse.qualified)} sub={`of ${report.buyerUniverse.scored} scored`} /></div>
            <div className="bg-xo-panel"><Metric label="Time to close" value={`${report.timeToClose.lowDays}–${report.timeToClose.highDays}d`} sub="expected" /></div>
          </section>

          <Section title="Most likely acquirers" eyebrow="Ranked by fit-adjusted expected value" className="border border-xo-line">
            {report.mostLikelyBuyers.length ? (
              <ScrollRegion label="Most likely acquirers table">
                <table className="w-full min-w-[420px] text-[13px]">
                  <thead className="text-left text-[11px] text-xo-faint">
                    <tr className="border-b border-xo-line">
                      <th scope="col" className="px-4 py-2 font-medium">#</th>
                      <th scope="col" className="px-2 py-2 font-medium">Acquirer</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Probability</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">Time to cash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.mostLikelyBuyers.map((b, i) => (
                      <tr key={b.name} className="border-b border-xo-line/60 last:border-0">
                        <td className="px-4 py-2 font-mono text-xo-faint">{i + 1}</td>
                        <th scope="row" className="px-2 py-2 text-left font-semibold">{b.name}</th>
                        <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-verified">{b.probabilityPct}%</td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-xo-muted">~{b.expectedDaysToCash}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>
            ) : <p className="px-4 py-3 text-[13px] text-xo-muted">No qualified buyers for this sector in the curated registry yet.</p>}
          </Section>

          <Section title="Comparable transactions" eyebrow={inp.sector.replace(/_/g, " ")} className="border border-xo-line"
            foot={m.data_provenance_summary}>
            {report.comparableTransactions.length ? (
              <ScrollRegion label="Comparable transactions table">
                <table className="w-full min-w-[520px] text-[13px]">
                  <thead className="text-left text-[11px] text-xo-faint">
                    <tr className="border-b border-xo-line">
                      <th scope="col" className="px-4 py-2 font-medium">Target → buyer</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Date</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Premium</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.comparableTransactions.slice(0, 8).map((c, i) => (
                      <tr key={`${c.target}-${i}`} className="border-b border-xo-line/60 last:border-0">
                        <td className="px-4 py-2"><span className="font-medium">{c.target}</span> <span className="text-xo-faint">→</span> <span className="text-xo-muted">{c.buyer}</span></td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{c.date ?? "—"}</td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{c.premiumPct != null ? `+${Math.round(c.premiumPct * 100)}%` : "—"}</td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums">{c.priceUsd != null ? usd(c.priceUsd) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>
            ) : <p className="px-4 py-3 text-[13px] text-xo-muted">No same-sector comparables indexed yet — the radar widens this with every ingest run.</p>}
          </Section>

          <p className="px-1 text-[12px] text-xo-faint">
            Prepared under ExitOS Valuation Framework v{report.frameworkVersion}. This is the same institutional engine the whole platform runs on — explore the full breakdown in the <ActionLink to="/console/valuation">valuation desk</ActionLink> or the <ActionLink to="/console">Intelligence Terminal</ActionLink>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Intake;

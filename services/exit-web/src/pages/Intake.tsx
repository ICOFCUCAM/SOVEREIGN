import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Kpi, SectionHeader, Field, inputCls, fmtMoney, Button } from "../lib/ui";
import { runInstitutionalValuation } from "@exit/engines";
import {
  buildProfile, SECTORS, SAMPLE_INTAKE, type IntakeInputs, type Sector,
} from "../lib/company-intake";
import { listCompany } from "../lib/listings";
import { loadSavedIntake, saveIntake, clearIntake } from "../lib/active-company";
import { NUMERIC_FIELDS, parseField, textsFor, type NumericKey } from "../lib/intake-fields";

// COMPANY INTAKE → INSTANT REPORT — the success metric: a founder enters
// their company and within seconds receives the institutional answer (who
// buys them, at what price, why, on what evidence). Every figure is the
// valuation constitution computed live on their inputs; the buyer universe
// and comparables come from the registry, parameterized by their sector.

const pct = (x: number): string => `${Math.round(x * 100)}%`;
const usd = (n: number): string => (n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : `$${(n / 1e6).toFixed(1)}M`);

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
    <div>
      <SectionHeader
        kicker="Acquisition Intelligence · Intake"
        title="Value my company"
        description="Enter your company and receive the institutional answer in seconds — enterprise value, the buyers most likely to acquire you, comparable transactions and the evidence behind every figure."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { listCompany(buildProfile(inp)); setListed(true); }}>{listed ? "✓ Listed (anonymized)" : "List on the exchange"}</Button>
            {saved && <Button variant="ghost" onClick={clearMine}>Clear my data</Button>}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* ── intake form ── */}
        <Card className="space-y-4 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Your company</div>
          <Field label="Company name"><input className={inputCls} value={inp.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sector">
              <select className={inputCls} value={inp.sector} onChange={(e) => set("sector", e.target.value as Sector)}>
                {SECTORS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </Field>
            <Field label="HQ (ISO)"><input className={inputCls} value={inp.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {NUMERIC_FIELDS.map((f) => {
              const err = errors[f.key];
              const id = `intake-${f.key}`;
              return (
                <div key={f.key}>
                  <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">{f.label} ({f.unit === "customers" ? "count" : f.unit})</label>
                  <input id={id} className={`${inputCls} ${err ? "border-red-400/70" : ""}`} inputMode={f.integer ? "numeric" : "decimal"}
                    value={texts[f.key]} onChange={(e) => typeNumber(f.key, e.target.value)}
                    aria-invalid={err ? true : undefined} aria-describedby={`${id}-msg`} />
                  <span id={`${id}-msg`} className={`mt-1 block text-[11px] ${err ? "text-red-300" : "text-white/50"}`}>{err ?? f.hint}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 text-[12px] text-white/70"><input type="checkbox" checked={inp.hasNetworkEffects} onChange={(e) => set("hasNetworkEffects", e.target.checked)} /> Network effects</label>
            <label className="flex items-center gap-2 text-[12px] text-white/70"><input type="checkbox" checked={inp.hasDataMoat} onChange={(e) => set("hasDataMoat", e.target.checked)} /> Data moat</label>
          </div>
          <p role="status" className="text-[11px] text-white/60">
            {saved
              ? "Your figures are saved in this browser and every console page now uses them."
              : `Showing the demo company (${SAMPLE_INTAKE.name}). Edit any field to value your own company; nothing is saved until you do.`}
          </p>
        </Card>

        {/* ── instant report ── */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-deal-400/30 p-0">
            <div className="bg-gradient-to-r from-deal-600/15 to-transparent px-6 py-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-deal-300">Enterprise value · strategic-buyer basis</div>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <span className="font-mono text-3xl font-bold tabular-nums text-white">{fmtMoney(report.headline.mid)}</span>
                <span className="font-mono text-[15px] tabular-nums text-white/55">{fmtMoney(report.headline.low)} – {fmtMoney(report.headline.high)}</span>
                <span className="rounded-full bg-deal-500/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-deal-300 ring-1 ring-deal-400/40">Confidence {report.confidence.score}% · {report.confidence.tier}</span>
              </div>
              <p className="mt-3 max-w-3xl text-[12.5px] leading-relaxed text-white/55">
                Midpoint = financial baseline {usd(report.financialBaseline.mid)} × (1 + {pct(report.premium.appliedPct)} strategic premium). {report.premium.note}
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Kpi label="Strategic premium" value={`+${pct(report.premium.appliedPct)}`} sub={`range ${pct(report.premium.rangeLowPct)}–${pct(report.premium.rangeHighPct)}`} />
            <Kpi label="Comparables" value={String(report.comparablesUsed)} sub="source-referenced" accent="#34d399" />
            <Kpi label="Qualified buyers" value={String(report.buyerUniverse.qualified)} sub={`of ${report.buyerUniverse.scored} scored`} />
            <Kpi label="Time to close" value={`${report.timeToClose.lowDays}–${report.timeToClose.highDays}d`} sub="expected" accent="#fbbf24" />
          </div>

          {/* most likely buyers */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Most likely acquirers · ranked by fit-adjusted expected value</div>
            <table className="w-full text-[12.5px]">
              <tbody>
                {report.mostLikelyBuyers.map((b, i) => (
                  <tr key={b.name} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-2.5 font-mono text-white/40">{i + 1}</td>
                    <td className="px-3 py-2.5 font-semibold text-white">{b.name}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-deal-300">{b.probabilityPct}%</td>
                    <td className="px-5 py-2.5 text-right font-mono tabular-nums text-white/60">~{b.expectedDaysToCash}d to cash</td>
                  </tr>
                ))}
                {report.mostLikelyBuyers.length === 0 && <tr><td className="px-5 py-3 text-white/45">No qualified buyers for this sector in the curated registry yet.</td></tr>}
              </tbody>
            </table>
          </Card>

          {/* comparable transactions */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-deal-300">Comparable transactions · {inp.sector.replace(/_/g, " ")}</div>
            {report.comparableTransactions.length ? (
              <table className="w-full text-[12.5px]">
                <tbody>
                  {report.comparableTransactions.slice(0, 8).map((c, i) => (
                    <tr key={`${c.target}-${i}`} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-2.5"><span className="font-medium text-white">{c.target}</span> <span className="text-white/40">→</span> <span className="text-white/70">{c.buyer}</span></td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/55">{c.date ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-white/70">{c.premiumPct != null ? `+${Math.round(c.premiumPct * 100)}%` : "—"}</td>
                      <td className="px-5 py-2.5 text-right font-mono tabular-nums text-deal-300">{c.priceUsd != null ? usd(c.priceUsd) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="px-5 py-4 text-[12px] text-white/45">No same-sector comparables indexed yet — the radar widens this with every ingest run.</div>}
            <div className="border-t border-white/10 px-5 py-2 text-[10px] text-white/35">{m.data_provenance_summary}</div>
          </Card>

          <p className="text-[11px] text-white/40">
            Prepared under ExitOS Valuation Framework v{report.frameworkVersion}. This is the same institutional engine the whole platform runs on — explore the full breakdown in the <Link to="/console/valuation" className="text-deal-300 hover:text-deal-200">valuation desk</Link> or the <Link to="/console" className="text-deal-300 hover:text-deal-200">Intelligence Terminal</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Intake;

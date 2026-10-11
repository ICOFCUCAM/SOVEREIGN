import React, { useMemo, useState } from "react";
import { fmtMoney, Button } from "../lib/ui";
import { runInstitutionalValuation } from "@exit/engines";
import {
  buildProfile, SECTORS, SAMPLE_INTAKE, type IntakeInputs, type Sector,
} from "../lib/company-intake";
import { listCompany, listingFromCompany, unlistCompany, allListings } from "../lib/listings";
import { listingDestination } from "../lib/exit-api";
import { loadSavedIntake, saveIntake, clearIntake } from "../lib/active-company";
import { NUMERIC_FIELDS, parseField, textsFor, type NumericKey } from "../lib/intake-fields";
import { Section, Metric, Provenance, ScrollRegion, ActionLink, Bar } from "../components/xo";

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
  // Listing: preview exactly what buyers will see, confirm, and allow withdrawal.
  const preview = useMemo(() => listingFromCompany(buildProfile(inp)), [inp]);
  const [, setListingVersion] = useState(0);   // re-render after list / withdraw
  const stored = allListings().find((l) => l.id === preview.id);
  const listed = !!stored;
  const stale = !!stored && JSON.stringify(stored.publicView) !== JSON.stringify(preview.publicView);
  const [confirming, setConfirming] = useState(false);
  const destination = listingDestination();
  const confirmListing = (): void => { listCompany(buildProfile(inp)); setConfirming(false); setListingVersion((v) => v + 1); };
  const withdraw = (): void => { unlistCompany(preview.id); setConfirming(false); setListingVersion((v) => v + 1); };
  const set = <K extends keyof IntakeInputs>(k: K, v: IntakeInputs[K]): void => {
    setInp((p) => { const next = { ...p, [k]: v }; saveIntake(next); return next; });
    setSaved(true);
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
  const clearMine = (): void => { clearIntake(); setInp(SAMPLE_INTAKE); setTexts(textsFor(SAMPLE_INTAKE)); setErrors({}); setSaved(false); };

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
          {listed && <Button variant="ghost" onClick={withdraw}>Withdraw listing</Button>}
          {(!listed || stale) && <Button onClick={() => setConfirming(true)} disabled={!saved} aria-expanded={confirming} aria-controls="listing-confirm" aria-describedby={saved ? undefined : "list-needs-data"}>{stale ? "Update listing" : "List on the exchange"}</Button>}
          {!saved && !listed && <span id="list-needs-data" className="basis-full text-right text-[11px] text-xo-faint">Enter your figures to list — the demo company can't be listed.</span>}
          {saved && <Button variant="ghost" onClick={clearMine}>Clear my data</Button>}
        </div>
      </header>

      {(confirming || listed) && (
        <section id="listing-confirm" aria-label="Exchange listing" className="border border-xo-caution/50 bg-xo-panel px-4 py-3">
          {listed && !confirming ? (
            <p role="status" className="text-[13px] text-xo-text">
              {destination === "exchange"
                ? <>Listed anonymously on the exchange as <span className="font-mono">{preview.code}</span>. Buyers see the figures below, not your company name.</>
                : <>Saved as an anonymous listing <span className="font-mono">{preview.code}</span> <strong>in this browser only</strong> — this build is not connected to the live exchange, so no buyer can see it yet.</>}
            </p>
          ) : (
            <>
              <h2 className="text-[14px] font-semibold">Before you list: this is what buyers will see</h2>
              <p className="mt-1 text-[12px] text-xo-muted">Your company name is withheld. {destination === "exchange" ? "The listing is published to the live exchange." : "This build is not connected to the live exchange: the listing is saved in this browser only."} You can withdraw it at any time.</p>
            </>
          )}
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-5">
            {(() => { const pv = listed && !confirming && stored ? stored.publicView : preview.publicView; return ([["Sector", pv.sector], ["Region", pv.region], ["TTM revenue", fmtMoney(pv.revenueUsd)], ["Growth", pct(pv.growthPct)], ["EBITDA margin", pct(pv.ebitdaMarginPct)]] as const); })().map(([k, v]) => (
              <div key={k}><dt className="text-[11px] text-xo-faint">{k}</dt><dd className="font-mono text-[13px] tabular-nums capitalize">{String(v).replace(/_/g, " ")}</dd></div>
            ))}
          </dl>
          {listed && stale && !confirming && <p className="mt-2 text-[12px] text-xo-caution">Your figures changed since you listed. The listing still shows the earlier figures until you update it.</p>}
          {confirming && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={confirmListing}>{listed ? "Confirm update" : "Confirm listing"}</Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
            </div>
          )}
        </section>
      )}

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

          <Section title="Most likely acquirers" eyebrow="Ranked by fit-adjusted expected value" className="border border-xo-line"
            foot={`From the curated buyer registry (${report.buyerUniverse.registry} acquirers: ${report.buyerUniverse.strategic} strategic, ${report.buyerUniverse.financial} financial, ${report.buyerUniverse.family_office} family office, ${report.buyerUniverse.sovereign} sovereign); probability and time to cash are the framework's buyer model.`}>
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
                <table className="w-full min-w-[640px] text-[13px]">
                  <thead className="text-left text-[11px] text-xo-faint">
                    <tr className="border-b border-xo-line">
                      <th scope="col" className="px-4 py-2 font-medium">Target → buyer</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Date</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Premium</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Price</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.comparableTransactions.slice(0, 8).map((c, i) => (
                      <tr key={`${c.target}-${i}`} className="border-b border-xo-line/60 last:border-0">
                        <td className="px-4 py-2">
                          <span className="font-medium">{c.target}</span> <span className="text-xo-faint">→</span> <span className="text-xo-muted">{c.buyer}</span>
                          <span className="block text-[11px] text-xo-faint">{c.status}{c.closeDays != null ? ` · ${c.closeDays}d to close` : ""} · {c.rationale}</span>
                        </td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{c.date ?? "—"}</td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums text-xo-muted">{c.premiumPct != null ? `+${Math.round(c.premiumPct * 100)}%` : "—"}</td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums">{c.priceUsd != null ? usd(c.priceUsd) : <span className="font-sans text-[11px] text-xo-faint">undisclosed</span>}</td>
                        <td className="px-4 py-2 text-right font-mono text-[11px] text-xo-muted" title={c.sourceRef}>{c.sourceRef.split(":")[0].replace(/_/g, " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>
            ) : <p className="px-4 py-3 text-[13px] text-xo-muted">No same-sector comparables indexed yet — the radar widens this with every ingest run.</p>}
          </Section>

          <Section title="Confidence" eyebrow="What the valuation rests on" className="border border-xo-line"
            right={<span className="font-mono text-[14px] font-semibold">{report.confidence.score}% <span className="text-[11px] font-normal text-xo-faint">{report.confidence.tier}</span></span>}
            foot={report.confidence.note}>
            <ul className="grid gap-x-8 gap-y-2 px-4 py-3 sm:grid-cols-2">
              {([["Data completeness", report.confidence.drivers.dataCompleteness], ["Comparable depth", report.confidence.drivers.comparableDepth], ["Sector maturity", report.confidence.drivers.sectorMaturity], ["Financial quality", report.confidence.drivers.financialQuality], ["Data freshness", report.confidence.drivers.dataFreshness]] as const).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-xo-muted">{k}</span>
                  <Bar value={Math.round(v * 100)} label={`${Math.round(v * 100)}%`} tone="action" width="w-24" />
                </li>
              ))}
            </ul>
          </Section>

          <Section tone="paper" title="Disclaimer" eyebrow={`Valuation Framework v${report.frameworkVersion}`}>
            <p className="px-4 py-3 text-[12px] leading-relaxed text-xo-paper-muted">{report.disclaimer}</p>
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

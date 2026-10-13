import React, { useMemo, useState } from "react";
import { Modal, fmtMoney } from "../lib/ui";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { PageHeader, Section, Metric, ScrollRegion, Provenance } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { useMemorandum, VALUATION_CANONICAL } from "../lib/engines";
import { runInstitutionalValuation, runReadiness, runBuyerDiscovery, runDueDiligence, type CompanyProfile, type MemorandumInputs } from "@exit/engines";
import { canonicalValuationFor } from "../lib/canonical-valuation";
import { loadActiveCompany } from "../lib/active-company";
import { codeNameFor } from "../lib/listings";
import { useDocumentGate, GateNotice } from "../components/DocumentGate";
import { docToMarkdown, docFilename, downloadDeliverable } from "../lib/deliverables";
import { label, plural } from "../lib/labels";
import type { MemorandumKind, MemorandumDocument } from "@exit/engines";

// the registry type each generator kind produces
const KIND_TYPE: Record<MemorandumKind, string> = {
  cim: "exitos.cim", executive_summary: "exitos.executive_summary", investor_deck: "exitos.investor_deck",
  buyer_teaser: "exitos.teaser", dd_room_index: "exitos.data_room_index",
};

// Consistency check (rule-based) — scans the generated text for growth, gross
// margin and net-retention claims and compares each with the company profile;
// also flags a missing concentration disclosure. Four checks, nothing more.
interface RedFlag {
  readonly metric: string;
  readonly claimed: string;
  readonly actual: string;
  readonly severity: "high" | "medium" | "low";
  readonly note: string;
}
function redTeam(doc: MemorandumDocument | null, C: CompanyProfile): RedFlag[] {
  if (!doc) return [];
  const text = doc.sections.map((s) => `${s.heading} ${s.body} ${(s.bullets ?? []).join(" ")}`).join(" ");
  const flags: RedFlag[] = [];
  // truth values
  const truth = {
    growth: Math.round(C.growth.arrGrowthYoyPct * 100),
    gross: Math.round(C.revenue.grossMarginPct * 100),
    ebitda: Math.round(C.revenue.ebitdaMarginPct * 100),
    nrr: C.revenue.netRetentionPct != null ? Math.round(C.revenue.netRetentionPct * 100) : null,
    arrM: Math.round(C.revenue.annualRecurringRevenueUsd / 1_000_000),
    customers: C.users.totalCustomers,
  };
  const sev = (claimed: number, actual: number): RedFlag["severity"] => {
    const d = Math.abs(claimed - actual) / Math.max(1, actual);
    return d >= 0.2 ? "high" : d >= 0.08 ? "medium" : "low";
  };
  // helper: find a "<n>% <keyword>" or "<keyword> ... <n>%" claim
  const findPct = (re: RegExp) => { const m = text.match(re); return m ? parseInt(m[1] ?? m[2], 10) : null; };

  const growthClaim = findPct(/(\d{1,3})%\s*(?:yoy|growth|year[- ]over[- ]year)/i) ?? findPct(/grow\w*[^.]{0,40}?(\d{1,3})%/i);
  if (growthClaim != null && growthClaim !== truth.growth && Math.abs(growthClaim - truth.growth) >= 3)
    flags.push({ metric: "ARR growth", claimed: `${growthClaim}%`, actual: `${truth.growth}%`, severity: sev(growthClaim, truth.growth), note: "Growth narrative diverges from booked ARR growth — a buyer will reconcile against the financials." });

  const grossClaim = findPct(/(\d{1,3})%\s*gross\s*margin/i) ?? findPct(/gross\s*margin[^.]{0,30}?(\d{1,3})%/i);
  if (grossClaim != null && Math.abs(grossClaim - truth.gross) >= 3)
    flags.push({ metric: "Gross margin", claimed: `${grossClaim}%`, actual: `${truth.gross}%`, severity: sev(grossClaim, truth.gross), note: "Margin claim doesn't match the P&L — expect a quality-of-earnings challenge." });

  if (truth.nrr != null) {
    const nrrClaim = findPct(/(\d{2,3})%\s*(?:net\s*retention|nrr|ndr)/i) ?? findPct(/(?:net\s*retention|nrr)[^.]{0,30}?(\d{2,3})%/i);
    if (nrrClaim != null && Math.abs(nrrClaim - truth.nrr) >= 3)
      flags.push({ metric: "Net retention", claimed: `${nrrClaim}%`, actual: `${truth.nrr}%`, severity: sev(nrrClaim, truth.nrr), note: "Retention claim above reported NRR — cohort data will be requested." });
  }

  // concentration: doc silent on a known high concentration is itself a flag
  if ((C.revenue.customerConcentrationTop10Pct ?? 0) >= 0.35 && !/concentrat/i.test(text))
    flags.push({ metric: "Customer concentration", claimed: "not disclosed", actual: `top-10 = ${Math.round((C.revenue.customerConcentrationTop10Pct ?? 0) * 100)}%`, severity: "high", note: "Document omits a material concentration risk a buyer will surface in diligence." });

  return flags;
}

const Documents: React.FC = () => {
  const [kind, setKind] = useState<MemorandumKind>("cim");
  // The founder's saved intake when there is one; the demo company otherwise
  // (its engine runs are the hook's defaults, so no inputs are passed).
  const { company, fromIntake } = useMemo(() => loadActiveCompany(), []);
  const inputs = useMemo<Partial<MemorandumInputs> | undefined>(() => {
    // anonymised documents use the company's own listing code name
    const codeName = codeNameFor(company, !fromIntake);
    if (!fromIntake) return { codeName };
    const institutional = runInstitutionalValuation(company);
    return {
      codeName,
      company,
      valuation: canonicalValuationFor(company, institutional),
      constitution: institutional,
      readiness: runReadiness(company),
      buyers: runBuyerDiscovery(company, { limit: 12 }),
      diligence: runDueDiligence(company),
    };
  }, [company, fromIntake]);
  const doc = useMemorandum(kind, inputs);
  const flags = useMemo(() => redTeam(doc, company), [doc, company]);
  const valueUsd = inputs?.valuation?.headline.mid ?? VALUATION_CANONICAL.headline.mid;
  return (
    <DocumentsView kind={kind} setKind={setKind} doc={doc} flags={flags} company={company} fromIntake={fromIntake} valueUsd={valueUsd} />
  );
};

const DocumentsView: React.FC<{
  kind: MemorandumKind;
  setKind: (k: MemorandumKind) => void;
  doc: MemorandumDocument | null;
  flags: RedFlag[];
  company: CompanyProfile;
  fromIntake: boolean;
  valueUsd: number;
}> = ({ kind, setKind, doc, flags, company, fromIntake, valueUsd }) => {
  const gate = useDocumentGate(KIND_TYPE[kind], doc ? docToMarkdown(doc) : null, valueUsd);

// Document Generator surface — wired to TemplateMemorandumGenerator
// from @exit/engines. Selecting a kind triggers useMemorandum() which
// regenerates the document (the template generator is synchronous;
// useEffect just provides a clean refresh boundary for future Claude
// adapter wiring).

const KINDS: Array<{ key: MemorandumKind; label: string; description: string }> = [
  { key: "cim",                label: "Confidential Information Memorandum", description: "Long-form acquisition document — 10 sections, banker register." },
  { key: "executive_summary",  label: "Executive Summary",                  description: "One-pager. Lead with proposition, headline financials, valuation." },
  { key: "investor_deck",      label: "Investor Deck",                       description: "Ten-slide outline: title → opportunity → traction → process." },
  { key: "buyer_teaser",       label: "Anonymized Buyer Teaser",            description: "1–2 pages, anonymized under your listing's code name. Issued pre-NDA." },
  { key: "dd_room_index",      label: "Data Room Index",                     description: "Index of the diligence package contents organised by package." },
];

  const [libraryOpen, setLibraryOpen] = useState(false);
  return (
    <div data-page="documents" className="space-y-3 text-xo-text">
      <PageHeader eyebrow={`◉ Workspace · Documents · ${fromIntake ? "Your intake" : "Demo company"}: ${company.name}`} title="Document Generator"
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Engine-composed · {flags.length > 0 ? plural(flags.length, "consistency flag") : "no conflicts in the four checks"}</span></>}
        actions={<>
          {/* one size for the four header actions: three outlined, the report filled */}
          <span className="text-[12px] text-xo-faint">Nothing is sent from ExitOS — download a draft to share it.</span>
          <button type="button" onClick={() => setLibraryOpen(true)} className="rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Library</button>
          <a href="/report" target="_blank" rel="noreferrer" className="rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Publishing Center →<span className="sr-only"> (opens in a new tab)</span></a>
          <a href="/report/valuation" target="_blank" rel="noreferrer" className="rounded-sm bg-deal-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Board-ready report (PDF) →<span className="sr-only"> (opens in a new tab)</span></a>
          {doc && <button type="button" disabled={!!gate?.blocked} onClick={() => !gate?.blocked && downloadDeliverable(docFilename(doc), docToMarkdown(doc))} className="rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-muted hover:text-xo-text disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Download draft (.md)</button>}
        </>} />
      <GateNotice gate={gate} className="border border-xo-line bg-xo-panel px-4 py-2.5" />

      <section aria-label="Document summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Templates" value={String(KINDS.length)} sub="document kinds" /></div>
        <div className="bg-xo-panel"><Metric label="Word count" value={doc ? String(doc.wordCount) : "—"} sub="current document" /></div>
        <div className="bg-xo-panel"><Metric label="Anonymized" value={doc?.anonymized ? "Yes" : "No"} sub={doc?.kind === "buyer_teaser" ? "teaser default" : "founder-named"} /></div>
        <div className="bg-xo-panel"><Metric label="Consistency flags" emphasis value={<span className={flags.length === 0 ? "text-xo-verified" : "text-xo-caution"}>{flags.length}</span>} sub="four rule-based checks" /></div>
      </section>

      <RegistryTape items={buildMarketTape()} asOf={DNA_AS_OF.slice(0, 10)} />

      <Modal open={libraryOpen} onClose={() => setLibraryOpen(false)} title="Document library" subtitle={`${KINDS.length} acquisition documents — generated from the engines`}>
        <ul className="space-y-2">
          {KINDS.map((k) => (
            <li key={k.key}>
              <button type="button" onClick={() => { setKind(k.key); setLibraryOpen(false); }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action ${kind === k.key ? "border-deal-400/50 bg-deal-600/10" : "border-white/10 bg-ink-900/40 hover:border-white/20"}`}>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">{k.label}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-white/70">{k.description}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {kind === k.key && <span className="text-[11px] font-semibold text-deal-300">Open ✓</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Section title="Recommended action" eyebrow="Banker's take" className="border border-xo-line">
        <div className="px-4 py-3">
          <p className="text-[14px] leading-relaxed">{flags.length > 0
            ? <>Reconcile the <span className="font-semibold">{flags.length} consistency flag{flags.length === 1 ? "" : "s"}</span> before this document reaches a buyer.</>
            : <>No conflicts found in the four consistency checks — review the full draft before it reaches a buyer.</>}</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="At stake">A <span className="font-mono font-semibold text-xo-verified">{fmtMoney(valueUsd)}</span> outcome hinges on a narrative buyers can't pick apart.</TakeCell>
            <TakeCell k="If you wait">Every unreconciled claim is a retrade lever a buyer's analyst finds in diligence.</TakeCell>
            <TakeCell k="Buyer">The buyer's analyst reads this adversarially — close the gaps before they do.</TakeCell>
            <TakeCell k="What ExitOS does">Generates each document from templates and the engines, then checks four figures (ARR growth, gross margin, net retention, a concentration disclosure) against the company profile.</TakeCell>
          </dl>
        </div>
      </Section>

      {doc && (
        <Section title={`Consistency check · ${label(doc.kind)}`} eyebrow="Rule-based · four checks" className="border border-xo-line"
          foot="Checks: ARR growth, gross margin and net retention claims in the text against the profile (3-point tolerance), and whether a top-10 customer concentration of 35% or more is mentioned. Other claims are not checked."
          right={<span className="text-[12px] text-xo-muted">{flags.length} claim{flags.length === 1 ? "" : "s"} to reconcile before buyer review</span>}>
          {flags.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-xo-muted">No conflicts found in these four checks. Other claims in the draft are not checked — review it before use.</p>
          ) : (
            <ul className="divide-y divide-xo-line">
              {flags.map((f) => (
                <li key={f.metric} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-0.5 shrink-0 text-[11px] font-semibold uppercase ${f.severity === "high" ? "text-xo-risk" : f.severity === "medium" ? "text-xo-caution" : "text-xo-muted"}`}>{f.severity}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-semibold">{f.metric}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-xo-muted">
                      <span>Document claims <span className="font-mono font-semibold text-xo-risk">{f.claimed}</span></span>
                      <span>Financials show <span className="font-mono font-semibold text-xo-verified">{f.actual}</span></span>
                    </div>
                    <p className="mt-1 text-[12px] leading-snug text-xo-muted">{f.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <div className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line lg:grid-cols-[280px_1fr]">
        <nav aria-label="Document kinds" className="bg-xo-panel p-2">
          <ul className="space-y-1">
            {KINDS.map((k) => {
              const on = kind === k.key;
              return (
                <li key={k.key}>
                  <button type="button" aria-current={on ? "true" : undefined} onClick={() => setKind(k.key)}
                    className={`block w-full border px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action ${on ? "border-xo-verified/60 bg-xo-raise" : "border-xo-line hover:bg-xo-raise"}`}>
                    <span className="block text-[11px] font-semibold uppercase text-xo-faint">{k.key.replace(/_/g, " ")}</span>
                    <span className="mt-1 block text-[13px] font-medium">{k.label}</span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-xo-muted">{k.description}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-label="Generated document" className="min-w-0 bg-xo-panel px-5 py-5">
          {!doc ? (
            <p className="py-16 text-center text-[13px] text-xo-muted">Generating…</p>
          ) : (
            <article>
              <header className="mb-5 border-b border-xo-line pb-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-xo-brass">Generated by ExitOS from templates — review before use</div>
                <h2 className="mt-1 font-serif text-[22px] font-semibold">{doc.title}</h2>
                <div className="mt-1 flex flex-wrap gap-3 text-[12px] text-xo-faint">
                  <span>{doc.sections.length} sections</span><span aria-hidden>·</span><span>{doc.wordCount} words</span>
                  {doc.anonymized && (<><span aria-hidden>·</span><span className="font-mono text-[11px] text-xo-caution">ANONYMIZED</span></>)}
                </div>
              </header>
              <div className="space-y-6">
                {doc.sections.map((s, i) => (
                  <section key={`${i}-${s.heading}`}>
                    <h3 className="font-serif text-[17px] font-semibold">{s.heading}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-xo-muted">{s.body}</p>
                    {s.bullets && s.bullets.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-xo-muted">
                        {s.bullets.map((b) => <li key={b}>{b}</li>)}
                      </ul>
                    )}
                    {s.tables && s.tables.map((t, ti) => (
                      <figure key={ti} className="mt-3 border border-xo-line">
                        <ScrollRegion label={t.caption ?? `${s.heading} table`}>
                          <table className="w-full min-w-[480px] text-[12px]">
                            <thead className="text-left text-[11px] text-xo-faint">
                              <tr>{t.headers.map((h, hi) => <th key={`${hi}-${h}`} scope="col" className="px-3 py-2 font-medium">{h || <span className="sr-only">Row</span>}</th>)}</tr>
                            </thead>
                            <tbody>
                              {t.rows.map((row, ri) => (
                                <tr key={ri} className="border-t border-xo-line">
                                  {row.map((cell, ci) => <td key={ci} className="px-3 py-2 font-mono">{cell}</td>)}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </ScrollRegion>
                        {t.caption && <figcaption className="border-t border-xo-line px-3 py-1.5 text-[11px] text-xo-faint">{t.caption}</figcaption>}
                      </figure>
                    ))}
                  </section>
                ))}
              </div>
            </article>
          )}
        </section>
      </div>
    </div>
  );
};

const TakeCell: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <div className="bg-xo-panel px-3 py-2">
    <dt className="text-[11px] font-medium text-xo-faint">{k}</dt>
    <dd className="mt-0.5 text-[13px] leading-snug text-xo-muted">{children}</dd>
  </div>
);

export default Documents;

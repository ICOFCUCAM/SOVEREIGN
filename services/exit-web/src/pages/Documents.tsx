import React, { useMemo, useState } from "react";
import { Modal, fmtMoney } from "../lib/ui";
import { RegistryTape } from "../components/xo/RegistryTape";
import { DNA_AS_OF } from "../lib/buyer-dna";
import { PageHeader, Section, Metric, ScrollRegion, Provenance } from "../components/xo";
import { buildMarketTape } from "../lib/market-tape";
import { useMemorandum, useMemorandumSuite, memorandumBase, VALUATION_CANONICAL } from "../lib/engines";
import type { CompanyProfile } from "@exit/engines";
import { loadActiveCompany } from "../lib/active-company";
import { memorandumInputs } from "../lib/documents/memorandum-inputs";
import { codeNameFor } from "../lib/listings";
import { useDocumentGate, GateNotice } from "../components/DocumentGate";
import { DocumentVersions } from "../components/DocumentVersions";
import { DEFAULT_PROCESS_TIMELINE } from "@exit/engines";
import type { IntakeField } from "../lib/active-company";
import { docToMarkdown } from "../lib/deliverables";
import { checkSuite, type Finding } from "../lib/documents/consistency";
import { closingChecklistDoc } from "../lib/closing-checklist";
import { label, plural } from "../lib/labels";
import type { MemorandumKind, MemorandumDocument } from "@exit/engines";

const ALL_KINDS: readonly MemorandumKind[] = ["cim", "executive_summary", "investor_deck", "buyer_teaser", "dd_room_index"];
const TYPE_TITLE: Record<string, string> = {
  "exitos.cim": "CIM", "exitos.executive_summary": "Executive summary", "exitos.investor_deck": "Investor deck",
  "exitos.teaser": "Teaser", "exitos.data_room_index": "Data room index", "exitos.closing_checklist": "Closing checklist",
};

// the registry type each generator kind produces
const KIND_TYPE: Record<MemorandumKind, string> = {
  cim: "exitos.cim", executive_summary: "exitos.executive_summary", investor_deck: "exitos.investor_deck",
  buyer_teaser: "exitos.teaser", dd_room_index: "exitos.data_room_index",
};

const Documents: React.FC = () => {
  const [kind, setKind] = useState<MemorandumKind>("cim");
  // The founder's saved intake when there is one; the demo company otherwise
  // (its engine runs are the hook's defaults, so no inputs are passed).
  const { company, fromIntake, companyId, unconfirmed, story } = useMemo(() => loadActiveCompany(), []);
  // the same engine inputs the CIM report page and the Banker use
  const inputs = useMemo(() => memorandumInputs(company, fromIntake, story), [company, fromIntake, story]);
  const doc = useMemorandum(kind, inputs);
  // every document for this company, checked against each other and the one valuation, timeline and checklist
  const suite = useMemorandumSuite(ALL_KINDS, inputs);
  const findings = useMemo<Finding[] | null>(() => {
    if (!suite) return null;
    const base = memorandumBase(inputs);
    const h = base.valuation.headline;
    return checkSuite(
      suite.map((d) => ({ typeId: KIND_TYPE[d.kind], title: d.title, text: docToMarkdown(d), anonymized: d.anonymized })),
      { company: base.company, codeName: codeNameFor(company, !fromIntake), valuation: { low: h.low, mid: h.mid, high: h.high }, ...(base.timeline ? { timeline: base.timeline } : {}) },
      closingChecklistDoc(),
    );
  }, [suite, inputs, company, fromIntake]);
  const flags = useMemo(() => (findings ?? []).filter((f) => f.typeId === KIND_TYPE[kind]), [findings, kind]);
  const elsewhere = useMemo(() => (findings ?? []).filter((f) => f.typeId !== KIND_TYPE[kind]), [findings, kind]);
  const valueUsd = inputs?.valuation?.headline.mid ?? VALUATION_CANONICAL.headline.mid;
  return (
    <DocumentsView kind={kind} setKind={setKind} doc={doc} flags={flags} elsewhere={elsewhere} checked={findings != null} company={company} fromIntake={fromIntake} valueUsd={valueUsd}
      companyId={companyId} unconfirmed={unconfirmed} engineInputs={inputs} />
  );
};

const DocumentsView: React.FC<{
  kind: MemorandumKind;
  setKind: (k: MemorandumKind) => void;
  doc: MemorandumDocument | null;
  flags: Finding[];
  elsewhere: Finding[];
  checked: boolean;
  company: CompanyProfile;
  fromIntake: boolean;
  valueUsd: number;
  companyId: string | null;
  unconfirmed: readonly IntakeField[];
  engineInputs: Record<string, unknown> | undefined;
}> = ({ kind, setKind, doc, flags, elsewhere, checked, company, fromIntake, valueUsd, companyId, unconfirmed, engineInputs }) => {
  const gate = useDocumentGate(KIND_TYPE[kind], doc ? docToMarkdown(doc) : null, valueUsd);
  const codeName = useMemo(() => codeNameFor(company, !fromIntake), [company, fromIntake]);

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
        badge={<><Provenance kind={fromIntake ? "company" : "demo"} /><span className="text-[12px] text-xo-muted">Engine-composed · {!checked ? "checking consistency…" : flags.length + elsewhere.length > 0 ? plural(flags.length + elsewhere.length, "consistency finding") : "no contradictions found across the documents"}</span></>}
        actions={<>
          {/* one size for the four header actions: three outlined, the report filled */}
          <span className="text-[12px] text-xo-faint">Nothing is sent from ExitOS — download a draft to share it.</span>
          <button type="button" onClick={() => setLibraryOpen(true)} className="rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Library</button>
          <a href="/report" target="_blank" rel="noreferrer" className="rounded-sm border border-xo-line px-3 py-1.5 text-[12px] font-medium text-xo-muted hover:text-xo-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Publishing Center →<span className="sr-only"> (opens in a new tab)</span></a>
          <a href="/report/valuation" target="_blank" rel="noreferrer" className="rounded-sm bg-deal-700 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-deal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action">Board-ready report →<span className="sr-only"> (opens in a new tab)</span></a>
        </>} />
      <GateNotice gate={gate} className="border border-xo-line bg-xo-panel px-4 py-2.5" />
      <DocumentVersions typeId={KIND_TYPE[kind]} doc={doc} gate={gate} company={company} companyId={companyId} unconfirmed={unconfirmed}
        inputs={{ kind, company, engine: engineInputs ?? null, timeline: DEFAULT_PROCESS_TIMELINE }}
        ownerName={kind === "buyer_teaser" ? codeName : company.name} codeName={codeName} valuationMidUsd={valueUsd} sample={!fromIntake} />

      <section aria-label="Document summary" className="grid grid-cols-1 gap-px border border-xo-line bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-xo-panel"><Metric label="Templates" value={String(KINDS.length)} sub="document kinds" /></div>
        <div className="bg-xo-panel"><Metric label="Word count" value={doc ? String(doc.wordCount) : "—"} sub="current document" /></div>
        <div className="bg-xo-panel"><Metric label="Anonymized" value={doc?.anonymized ? "Yes" : "No"} sub={doc?.kind === "buyer_teaser" ? "teaser default" : "founder-named"} /></div>
        <div className="bg-xo-panel"><Metric label="Consistency findings" emphasis value={<span className={flags.length === 0 ? "text-xo-verified" : "text-xo-caution"}>{flags.length}</span>} sub="this document · rule-based" /></div>
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
          <p className="text-[14px] leading-relaxed">{flags.length + elsewhere.length > 0
            ? <>Reconcile the <span className="font-semibold">{plural(flags.length + elsewhere.length, "consistency finding")}</span> before any of these documents reaches a buyer.</>
            : <>No contradictions found between the documents — the checks read figures, dates and names, not the argument, so review the full draft before it reaches a buyer.</>}</p>
          <dl className="mt-3 grid grid-cols-1 gap-px bg-xo-line sm:grid-cols-2 xl:grid-cols-4">
            <TakeCell k="At stake">A <span className="font-mono font-semibold text-xo-verified">{fmtMoney(valueUsd)}</span> outcome hinges on a narrative buyers can't pick apart.</TakeCell>
            <TakeCell k="If you wait">Every unreconciled claim is a retrade lever a buyer's analyst finds in diligence.</TakeCell>
            <TakeCell k="Buyer">The buyer's analyst reads this adversarially — close the gaps before they do.</TakeCell>
            <TakeCell k="What ExitOS does">Generates each document from templates and the engines, then checks every document against the company's figures, the one valuation, the one process timeline and the one closing checklist.</TakeCell>
          </dl>
        </div>
      </Section>

      {doc && (
        <Section title={`Consistency check · ${label(doc.kind)}`} eyebrow="Rule-based · across every document" className="border border-xo-line"
          foot="Checks: the figures each document quotes (ARR, revenue, growth, margins, net retention) against the company's; the valuation against the one canonical valuation; every dated milestone against the one process timeline; the closing checklist's items and timing; the company name or code name; the currency; and a material customer concentration left undisclosed. Figures in phrasings the checks do not recognise are not checked."
          right={<span className="text-[12px] text-xo-muted">{checked ? `${plural(flags.length, "finding")} here · ${elsewhere.length} in other documents` : "checking…"}</span>}>
          {!checked ? (
            <p className="px-4 py-3 text-[13px] text-xo-muted">Checking the documents…</p>
          ) : flags.length + elsewhere.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-xo-muted">No contradictions found between the documents, the company's figures, the valuation, the timeline and the closing checklist. That is not a review of the argument — read the draft before use.</p>
          ) : (
            <ul className="divide-y divide-xo-line">
              {[...flags, ...elsewhere].map((f, n) => (
                <li key={`${f.typeId}-${f.check}-${f.what}-${n}`} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-0.5 shrink-0 text-[11px] font-semibold uppercase ${f.severity === "high" ? "text-xo-risk" : "text-xo-caution"}`}>{f.severity}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-semibold">{f.what} <span className="font-normal text-xo-muted">· {TYPE_TITLE[f.typeId] ?? f.typeId}</span></h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-xo-muted">
                      <span>Document says <span className="font-mono font-semibold text-xo-risk">{f.found}</span></span>
                      <span>Should say <span className="font-mono font-semibold text-xo-verified">{f.expected}</span></span>
                    </div>
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

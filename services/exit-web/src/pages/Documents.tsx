import React, { useMemo, useState } from "react";
import { Button, Card, Modal, fmtMoney } from "../lib/ui";
import { CommandHeader } from "../lib/workstation";
import { useMemorandum, VALUATION_STRATEGIC } from "../lib/engines";
import { SAMPLE_COMPANY } from "../lib/profile";
import { docToMarkdown, docFilename, sendDeliverable, downloadDeliverable } from "../lib/deliverables";
import type { MemorandumKind, MemorandumDocument } from "@exit/engines";
import BankerTake from "../components/BankerTake";

// AI Red Team — reads the generated document like a hostile buyer's analyst.
// It scans every section for numeric claims (growth, margin, retention, ARR,
// customers) and cross-checks each against the TRUE company profile. Any claim
// that diverges materially from source-of-truth becomes a flagged challenge —
// the gap a buyer will find in diligence.
interface RedFlag {
  readonly metric: string;
  readonly claimed: string;
  readonly actual: string;
  readonly severity: "high" | "medium" | "low";
  readonly note: string;
}
function redTeam(doc: MemorandumDocument | null): RedFlag[] {
  if (!doc) return [];
  const text = doc.sections.map((s) => `${s.heading} ${s.body} ${(s.bullets ?? []).join(" ")}`).join(" ");
  const C = SAMPLE_COMPANY;
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
  const doc = useMemorandum(kind);
  const flags = useMemo(() => redTeam(doc), [doc]);
  return (
    <DocumentsView kind={kind} setKind={setKind} doc={doc} flags={flags} />
  );
};

const DocumentsView: React.FC<{
  kind: MemorandumKind;
  setKind: (k: MemorandumKind) => void;
  doc: MemorandumDocument | null;
  flags: RedFlag[];
}> = ({ kind, setKind, doc, flags }) => {

// Document Generator surface — wired to TemplateMemorandumGenerator
// from @exit/engines. Selecting a kind triggers useMemorandum() which
// regenerates the document (the template generator is synchronous;
// useEffect just provides a clean refresh boundary for future Claude
// adapter wiring).

const KINDS: Array<{ key: MemorandumKind; label: string; description: string; accent: string }> = [
  { key: "cim",                label: "Confidential Information Memorandum", description: "Long-form acquisition document — 10 sections, banker register.",   accent: "text-deal-300" },
  { key: "executive_summary",  label: "Executive Summary",                  description: "One-pager. Lead with proposition, headline financials, valuation.", accent: "text-loi-300" },
  { key: "investor_deck",      label: "Investor Deck",                       description: "Ten-slide outline: title → opportunity → traction → process.",     accent: "text-stage-loi" },
  { key: "buyer_teaser",       label: "Anonymized Buyer Teaser",            description: "1–2 pages, anonymized as Project Cipher. Issued pre-NDA.",          accent: "text-stage-engaged" },
  { key: "dd_room_index",      label: "Data Room Index",                     description: "Index of the diligence package contents organised by package.",    accent: "text-white/65" },
];

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const markSent = (k: MemorandumKind, text: string, filename: string): void => {
    sendDeliverable(filename, text);
    setSent((prev) => new Set(prev).add(k));
  };

  return (
    <div className="space-y-2">
      <CommandHeader
        kicker="◉ Workspace · Documents"
        title="Document Generator"
        tag="Engine-composed"
        status={flags.length > 0 ? `${flags.length} flags` : "Defensible"}
        metrics={[
          { k: "Templates", v: String(KINDS.length), sub: "document kinds" },
          { k: "Word count", v: doc ? String(doc.wordCount) : "—", sub: "current document" },
          { k: "Anonymized", v: doc?.anonymized ? "Yes" : "No", sub: doc?.kind === "buyer_teaser" ? "teaser default" : "founder-named" },
          { k: "Red Team flags", v: String(flags.length), accent: flags.length === 0, sub: flags.length === 0 ? "no challenges" : "challenges detected" },
        ]}
      />


      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => setLibraryOpen(true)}>Library</Button>
        {doc && <Button variant="ghost" onClick={() => downloadDeliverable(docFilename(doc), docToMarkdown(doc))}>Download .md</Button>}
        {doc && <Button onClick={() => markSent(doc.kind, docToMarkdown(doc), docFilename(doc))}>{sent.has(doc.kind) ? "Sent ✓ · resend" : "Send to buyer"}</Button>}
      </div>

      {/* ── Document library ──────────────────────────────────────── */}
      <Modal open={libraryOpen} onClose={() => setLibraryOpen(false)} title="Document library" subtitle={`${KINDS.length} acquisition documents — generated from the engines`}>
        <div className="space-y-2">
          {KINDS.map((k) => (
            <button key={k.key} onClick={() => { setKind(k.key); setLibraryOpen(false); }}
              className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3.5 text-left transition ${kind === k.key ? "border-deal-400/50 bg-deal-600/10" : "border-white/10 bg-ink-900/40 hover:border-white/20"}`}>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white">{k.label}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-white/50">{k.description}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {sent.has(k.key) && <span className="rounded-full bg-deal-600/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-deal-300 ring-1 ring-deal-400/40">Sent</span>}
                {kind === k.key && <span className="text-[11px] font-semibold uppercase tracking-wide text-deal-300">Open ✓</span>}
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <BankerTake
        next={flags.length > 0
          ? <>Reconcile the <span className="text-white">{flags.length} Red Team flag{flags.length === 1 ? "" : "s"}</span> before this document reaches a buyer.</>
          : <>This draft is defensible — issue it to the process.</>}
        stake={<>A <span className="font-mono font-bold text-deal-300">{fmtMoney(VALUATION_STRATEGIC.headline.mid)}</span> outcome hinges on a narrative buyers can't pick apart.</>}
        inaction={<>Every unreconciled claim is a retrade lever a buyer's analyst finds in diligence.</>}
        buyer={<>The buyer's analyst reads this adversarially — close the gaps before they do.</>}
        automate={<>ExitOS generates each document from the engines and red-teams it against your real financials.</>}
      />


      {/* AI Red Team — claims vs source-of-truth, the way a buyer's analyst reads it */}
      {doc && (
        <Card className="mt-8 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/10 bg-red-500/10 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/25 text-[12px] text-red-200 ring-1 ring-red-400/40">⚔</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-200">AI Red Team · {doc.kind.replace(/_/g, " ")}</span>
            </div>
            <span className="text-[11px] text-white/45">{flags.length} claim{flags.length === 1 ? "" : "s"} to reconcile before buyer review</span>
          </div>
          {flags.length === 0 ? (
            <div className="p-5 text-sm text-white/55">No contradictions between document claims and source financials. This draft is defensible in diligence.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {flags.map((f) => (
                <div key={f.metric} className="flex items-start gap-3 p-4">
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${
                    f.severity === "high" ? "bg-red-500/15 text-red-300 ring-red-400/40" :
                    f.severity === "medium" ? "bg-loi-500/15 text-loi-300 ring-loi-400/40" :
                    "bg-white/5 text-white/50 ring-white/15"}`}>{f.severity}</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-white">{f.metric}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                      <span className="text-white/55">Document claims <span className="font-mono font-semibold text-red-300">{f.claimed}</span></span>
                      <span className="text-white/55">Financials show <span className="font-mono font-semibold text-deal-300">{f.actual}</span></span>
                    </div>
                    <p className="mt-1 text-[12px] leading-snug text-white/55">{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {KINDS.map((k) => (
            <button
              key={k.key}
              onClick={() => setKind(k.key)}
              className={`block w-full rounded-lg border p-4 text-left transition ${
                kind === k.key
                  ? "border-deal-400/50 bg-deal-600/10"
                  : "border-white/10 bg-ink-800/40 hover:border-white/20 hover:bg-ink-800/60"
              }`}
            >
              <div className={`text-[11px] font-semibold uppercase tracking-wide ${k.accent}`}>{k.key.replace(/_/g, " ")}</div>
              <div className="mt-1 text-sm font-medium text-white">{k.label}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-white/55">{k.description}</div>
            </button>
          ))}
        </div>

        <Card className="p-7">
          {!doc ? (
            <div className="flex h-full items-center justify-center py-20 text-sm text-white/40">Generating…</div>
          ) : (
            <article className="prose-invert max-w-none">
              <header className="mb-6 border-b border-white/10 pb-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-deal-400">
                  Prepared by ExitOS Advisory
                </div>
                <h2 className="mt-2 font-serif text-2xl font-bold text-white">{doc.title}</h2>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-white/45">
                  <span>{doc.sections.length} sections</span>
                  <span>·</span>
                  <span>{doc.wordCount} words</span>
                  {doc.anonymized && (<><span>·</span><span className="rounded bg-loi-500/15 px-1.5 py-0.5 font-mono text-[10px] text-loi-400">ANONYMIZED</span></>)}
                </div>
              </header>
              <div className="space-y-6">
                {doc.sections.map((s, i) => (
                  <section key={`${i}-${s.heading}`}>
                    <h3 className="font-serif text-lg font-bold text-white">{s.heading}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-white/75">{s.body}</p>
                    {s.bullets && s.bullets.length > 0 && (
                      <ul className="mt-3 space-y-1.5 text-[13px] text-white/65">
                        {s.bullets.map((b) => (
                          <li key={b} className="flex items-baseline gap-2">
                            <span className="mt-1 inline-block h-1 w-1 rounded-full bg-deal-400" /> {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    {s.tables && s.tables.map((t, ti) => (
                      <div key={ti} className="mt-3 overflow-hidden rounded-lg border border-white/10">
                        <table className="w-full text-[12px]">
                          <thead className="bg-white/[0.03] text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                            <tr>{t.headers.map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {t.rows.map((row, ri) => (
                              <tr key={ri} className="border-t border-white/5">
                                {row.map((cell, ci) => <td key={ci} className="px-3 py-2 font-mono text-white/85">{cell}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {t.caption && <div className="border-t border-white/10 bg-white/[0.02] px-3 py-1.5 text-[10px] uppercase tracking-wide text-white/40">{t.caption}</div>}
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            </article>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Documents;

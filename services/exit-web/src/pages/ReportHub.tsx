import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadActiveCompany } from "../lib/active-company";
import { buildBoardMemo } from "../lib/report-docs";
import { boardMemoToDdm } from "../lib/dispatch-ddm";
import { renderVersionPdf } from "../lib/dispatch-client";
import { useAuth } from "../lib/auth";
import { useDocumentRemote } from "../lib/documents/remote";
import { generateVersion } from "../lib/documents/service";
import { saveVersion } from "../lib/documents/store";
import { notify } from "../lib/ui";

// ── PUBLISHING CENTER ───────────────────────────────────────────────
// The index of every board-ready document ExitOS publishes for the active
// company. Each opens the institutional, print-to-PDF renderer in a new tab.

interface DocCard { kind: string; title: string; blurb: string; href?: string; audience: string }

const DOCUMENTS: DocCard[] = [
  { kind: "Valuation", title: "Valuation Report", blurb: "Full institutional valuation — football field, comparable transactions, strategic premium, confidence and provenance.", href: "/report/valuation", audience: "Board of Directors" },
  { kind: "CIM", title: "Confidential Information Memorandum", blurb: "The marketing document furnished to prospective acquirers under NDA — company, financials, market, valuation and buyer universe.", href: "/report/cim", audience: "Prospective Acquirers" },
  { kind: "Management", title: "Management Presentation", blurb: "The pitch deck: the opportunity, financials, valuation, buyer landscape, value creation and the ask.", href: "/report/management", audience: "Acquirers & IC" },
  { kind: "Buyers", title: "Buyer Intelligence Report", blurb: "Ranked acquirer scorecards — probability, expected value, check size, cadence and strategic fit.", href: "/report/buyers", audience: "Board of Directors" },
  { kind: "Readiness", title: "Acquisition Readiness Report", blurb: "The readiness scorecard and the priced value bridge from closing each gap.", href: "/report/readiness", audience: "Board of Directors" },
  { kind: "Board", title: "Board Transaction Memorandum", blurb: "The decision document — recommendation, transaction parameters, highlights, risks and an approval block.", href: "/report/board", audience: "Board of Directors" },
  { kind: "Market", title: "Market Intelligence Report", blurb: "Sector acquisition indexes and the most active acquirers, from the verified registry.", href: "/report/market", audience: "Investment Committee" },
  { kind: "Diligence", title: "Due-Diligence Report", blurb: "The pre-market diligence scan — findings register, buyer's view, seller remediation, red flags, valuation impact and legal exposure.", href: "/report/diligence", audience: "Board of Directors" },
  { kind: "NDA", title: "Non-Disclosure Agreement Package", blurb: "The institutional NDA suite and a board-ready execution copy with principal articles.", href: "/report/nda", audience: "Counterparties" },
  { kind: "Briefing", title: "Buyer Briefing Book", blurb: "A per-acquirer deep dive — thesis, probability drivers, profile, demonstrated pattern and signals. Opens from any acquirer in Buyer Graph.", audience: "Deal Team" },
];

const ReportHub: React.FC = () => {
  const nav = useNavigate();
  const { company, companyId, unconfirmed } = useMemo(() => loadActiveCompany(), []);
  const { session } = useAuth();
  const remote = useDocumentRemote();
  const [dispatching, setDispatching] = useState(false);

  // the board memorandum becomes a saved, hashed version, which Dispatch renders by id
  const submitBoardToDispatch = async (): Promise<void> => {
    if (!remote || !session) { notify("PDF rendering needs a signed-in account (e-mail sign-in)."); return; }
    setDispatching(true);
    try {
      const memo = buildBoardMemo(company);
      const v = await generateVersion({
        typeId: "exitos.board_memo_process", title: "Board Transaction Memorandum", sections: [], ddm: boardMemoToDdm(memo) as never,
        producedBy: "lib/report-docs:buildBoardMemo", company, companyId, unconfirmed, inputs: { memo },
        generatedBy: session.email, ownerName: company.name,
      });
      await saveVersion(v, remote);
      const r = await renderVersionPdf(v.id, remote.accessToken);
      if (r.ok) notify(`PDF requested from Dispatch${r.jobId ? ` · job ${r.jobId.slice(0, 8)}` : ""}`);
      else if (!r.configured) notify("PDF rendering is not connected yet: the version is saved, but no PDF was produced.");
      else notify(`Dispatch error: ${r.error}`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not prepare the document");
    } finally { setDispatching(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a1018] py-10">
      <div className="mx-auto max-w-[920px] px-5">
        <div className="flex items-center justify-between">
          <button onClick={() => nav(-1)} className="rounded-md border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-white/70 hover:bg-white/5">← Back</button>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-deal-300">ExitOS Acquisition Exchange</span>
        </div>

        <div className="mt-8">
          <div className="text-[12px] font-semibold uppercase tracking-[0.28em] text-white/40">Publishing Center</div>
          <h1 className="mt-2 font-serif text-[40px] font-bold leading-tight text-white">{company.name}</h1>
          <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-white/55">
            Every document below is generated from the live valuation, buyer DNA and market registries, then set in the
            institutional publishing layer as a print-ready page.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-deal-400/25 bg-deal-600/[0.06] px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-deal-300">Governed publication · Sovereign Dispatch</div>
            <p className="mt-0.5 text-[12px] text-white/55">Submit the Board Memorandum into the Dispatch pipeline (Submit → Approve → Render → Publish) for a classified, audited institutional document.</p>
          </div>
          <button onClick={submitBoardToDispatch} disabled={dispatching}
            className="shrink-0 rounded-md bg-desk-gold px-4 py-2 text-[12.5px] font-semibold text-desk-ink transition hover:bg-[#AA8443] disabled:opacity-60">
            {dispatching ? "Preparing…" : "Board memo · render PDF via Dispatch →"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTS.map((d) => {
            const openable = !!d.href;
            const Inner = (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-deal-300">{d.kind}</span>
                  {openable && <span className="text-[11px] font-semibold text-deal-400 group-hover:text-deal-300">Open →</span>}
                </div>
                <div className="mt-2 text-[16px] font-bold text-white">{d.title}</div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">{d.blurb}</p>
                <div className="mt-3 border-t border-white/10 pt-2.5 text-[10px] uppercase tracking-[0.14em] text-white/35">For · {d.audience}</div>
              </>
            );
            return openable ? (
              <a key={d.title} href={d.href} target="_blank" rel="noopener noreferrer"
                className="group rounded-lg border border-white/10 bg-white/[0.02] p-5 transition hover:border-deal-500/40 hover:bg-white/[0.04]">
                {Inner}
              </a>
            ) : (
              <div key={d.title} className="rounded-lg border border-dashed border-white/10 bg-white/[0.01] p-5 opacity-80">
                {Inner}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-white/35">
          Documents open in a new tab. “Print…” in the document toolbar opens your browser's print dialog, which can also save the
          page as a PDF with its running headers, page numbers and confidentiality markings. ExitOS does not yet generate PDFs itself.
        </p>
      </div>
    </div>
  );
};

export default ReportHub;

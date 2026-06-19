import type { BoardMemo } from "./report-docs";

// ── EXITOS → DISPATCH DDM MAPPER ────────────────────────────────────
// Maps an ExitOS report model into a Sovereign Dispatch DDM document so it can
// be submitted to the Dispatch publication pipeline (Submit → Approve → Render
// → Publish). The Board Transaction Memorandum maps to the `executive_briefing`
// docType, whose required section roles are executive_summary, key_judgements,
// analysis and recommendation. Content is the engine's — formatting only.

export interface DdmBlock { id: string; type: string; [k: string]: unknown }
export interface DdmSection { id: string; role: string; heading: string; level: number; blocks: DdmBlock[] }
export interface DdmDocument {
  ddmVersion: string;
  docType: string;
  metadata: { title: string; date: string; status: string };
  sections: DdmSection[];
}

const today = (): string => new Date().toISOString().slice(0, 10);

/** Board Transaction Memorandum → DDM executive_briefing. */
export function boardMemoToDdm(memo: BoardMemo): DdmDocument {
  return {
    ddmVersion: "1.0",
    docType: "executive_briefing",
    metadata: { title: `${memo.meta.company} — Board Transaction Memorandum`, date: today(), status: "final" },
    sections: [
      {
        id: "s-sum", role: "executive_summary", heading: "Executive Summary", level: 1,
        blocks: [{ id: "b-sum", type: "paragraph", text: memo.recommendation, style: "lead" }],
      },
      {
        id: "s-kj", role: "key_judgements", heading: "Investment Highlights", level: 1,
        blocks: [{ id: "b-kj", type: "bullets", ordered: true, items: memo.highlights.map((h) => ({ text: h })) }],
      },
      {
        id: "s-an", role: "analysis", heading: "Transaction Parameters", level: 1,
        blocks: [
          { id: "b-an-p", type: "paragraph", text: "The recommended transaction parameters and the risk factors most likely to be probed in diligence are set out below." },
          {
            id: "b-an-t", type: "table", caption: "Decision summary",
            columns: [{ key: "k", label: "Parameter" }, { key: "v", label: "Detail", align: "right" }],
            rows: memo.decision.map((d) => ({ k: d.k, v: d.v })),
          },
          {
            id: "b-an-r", type: "table", caption: "Risk factors & value at stake",
            columns: [{ key: "d", label: "Risk factor" }, { key: "i", label: "Value at stake", align: "right" }],
            rows: memo.risks.map((r) => ({ d: r.dimension, i: r.impact })),
          },
        ],
      },
      {
        id: "s-rec", role: "recommendation", heading: "Recommendation", level: 1,
        blocks: [{ id: "b-rec", type: "callout", style: "recommendation", text: memo.recommendation }],
      },
    ],
  };
}

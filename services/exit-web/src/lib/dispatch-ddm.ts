import type { BoardMemo } from "./report-docs";

// ── EXITOS → DISPATCH DDM MAPPER ────────────────────────────────────
// Maps an ExitOS report model into a Sovereign Dispatch DDM document so it can
// be submitted to the Dispatch publication pipeline (Submit → Approve → Render
// → Publish). The Board Transaction Memorandum maps to the `executive_briefing`
// docType, whose required section roles are executive_summary, key_judgements,
// analysis and recommendation. Content is the engine's — formatting only.

export interface DdmBlock { id: string; type: string; [k: string]: unknown }
export interface DdmSection { id: string; role: string; heading: string; level: number; order: number; blocks: DdmBlock[] }
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
    metadata: { title: `${memo.meta.company} — Board Transaction Memorandum`, date: today(), status: "draft" },
    // explicit order: Dispatch otherwise puts its profile's roles first and the rest after
    sections: [
      {
        id: "s-sum", role: "executive_summary", heading: "Executive Summary", level: 1, order: 1,
        blocks: [{ id: "b-sum", type: "paragraph", text: memo.summary, style: "lead" }],
      },
      {
        id: "s-bg", role: "background", heading: "Background", level: 1, order: 2,
        blocks: [{ id: "b-bg", type: "paragraph", text: memo.background }],
      },
      {
        id: "s-kj", role: "key_judgements", heading: "Investment Highlights", level: 1, order: 3,
        blocks: [{ id: "b-kj", type: "bullets", ordered: true, items: memo.highlights.map((h) => ({ text: h })) }],
      },
      {
        id: "s-an", role: "analysis", heading: "Transaction Parameters", level: 1, order: 4,
        blocks: [
          { id: "b-an-p", type: "paragraph", text: "The recommended transaction parameters and the risk factors most likely to be probed in diligence are set out below." },
          {
            id: "b-an-t", type: "table", caption: "Decision summary",
            columns: [{ key: "k", label: "Parameter" }, { key: "v", label: "Detail", align: "right" }],
            rows: memo.decision.map((d) => [{ text: d.k }, { text: d.v }]),   // DDM rows are arrays of cells
          },
          {
            id: "b-an-r", type: "table", caption: "Risk factors & value at stake",
            columns: [{ key: "d", label: "Risk factor" }, { key: "i", label: "Value at stake", align: "right" }],
            rows: memo.risks.map((r) => [{ text: r.dimension }, { text: r.impact }]),
          },
        ],
      },
      {
        id: "s-pr", role: "process", heading: "Process and Timing", level: 1, order: 5,
        blocks: [{ id: "b-pr", type: "bullets", items: memo.process.map((p) => ({ text: p })) }],
      },
      {
        id: "s-rec", role: "recommendation", heading: "Proposed Resolutions", level: 1, order: 6,
        blocks: [
          { id: "b-rec", type: "callout", style: "recommendation", text: memo.recommendation },
          { id: "b-res", type: "bullets", ordered: true, items: memo.resolutions.map((x) => ({ text: x })) },
        ],
      },
      {
        id: "s-basis", role: "basis", heading: "Basis of Preparation", level: 1, order: 7,
        blocks: [{ id: "b-basis", type: "paragraph", text: memo.basis }],
      },
    ],
  };
}

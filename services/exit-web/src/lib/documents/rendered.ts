import { figureForms } from "./gate";
import type { DocumentVersion } from "./service";
import type { QualityFinding } from "./quality";

// ── RENDERED-OUTPUT INSPECTION ──────────────────────────────────────
// The text review reads the document model; this reads what a person
// receives: the Markdown export, the HTML preview and the text extracted from
// the final PDF. A document whose tables, headings or notices are lost in
// rendering fails here even when its model is perfect. Pure functions: the
// caller renders (Dispatch's engine and renderers, headless Chromium) and
// extracts the PDF text (pdftotext) and metadata (pdfinfo).

export interface Rendered {
  readonly markdown: string;
  readonly html: string;
  /** pdftotext -layout output; null when no PDF renderer is available. */
  readonly pdfText: string | null;
  readonly pdfPages: number | null;
  /** pdfinfo Title */
  readonly pdfTitle: string | null;
}

interface Table { readonly columns: Array<{ label: string }>; readonly rows: Array<Array<{ text: string }>> }

/** Words of a cell as they survive PDF text extraction (spacing and hyphenation vary). */
const norm = (t: string): string => t.replace(/\s+/g, " ").replace(/[‐-―]/g, "-").trim().toLowerCase();
const has = (hay: string, needle: string): boolean => norm(hay).includes(norm(needle));
// PDF text extraction can wrap a long cell across lines: look for its first few words
const lead = (t: string): string => t.split(/\s+/).slice(0, 3).join(" ");

/** Seller-only wording that must never reach a buyer, in any rendering. */
export const BUYER_LEAK = /\benterprise value\b|\bvaluation range\b|\bmidpoint\b|\bstrategic premium\b|\bbuyer universe\b|\bprobability of engagement\b|\bexit readiness\b|\breadiness score\b|\bprice guidance\b|\breservation (?:price|line)\b|\bwalk-away\b|\bValuation Framework\b/i;

export function inspectRendered(v: DocumentVersion, r: Rendered, opts: { buyerFacing: boolean; valuationUsd?: readonly number[] }): QualityFinding[] {
  const f: QualityFinding[] = [];
  const add = (severity: QualityFinding["severity"], rule: string, section: string, excerpt: string, fix: string): void => { f.push({ severity, rule, section, excerpt, fix }); };
  const decode = (h: string): string => h.replace(/<\/(tr|p|li|h[1-6]|div)>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ");
  const outputs: Array<[string, string]> = [["Markdown", r.markdown], ["HTML preview", decode(r.html)], ...(r.pdfText != null ? [["PDF", r.pdfText] as [string, string]] : [])];

  // every section heading reaches every output (preview, export and PDF agree)
  for (const s of v.ddm.sections) for (const [name, text] of outputs)
    if (!has(text, s.heading)) add("critical", "render:heading-lost", s.heading, `missing from the ${name}`, "the renderer dropped a section");

  // every table reaches every output: its column labels and the first words of each row
  for (const s of v.ddm.sections) for (const b of s.blocks as Array<Record<string, unknown>>) {
    if (b.type !== "table") continue;
    const t = b as unknown as Table;
    for (const [name, text] of outputs) {
      const lostCols = t.columns.map((c) => c.label).filter((l) => l.trim() && !has(text, l));
      // a row is present when its first and last cells sit on one line of the output
      const lines = text.split("\n").map(norm);
      const lostRows: Array<unknown> = t.rows.filter((row) => {
        const cells = row.map((c) => c.text.trim()).filter((c) => c && c !== "—");
        if (!cells.length) return false;
        const first = norm(lead(cells[0])), last = norm(cells[cells.length - 1].split(/\s+/)[0]);
        // a row whose long cells wrap spans up to three lines of extracted PDF text
        return !lines.some((_, k) => { const w = lines.slice(Math.max(0, k - 1), k + 2).join(" "); return w.includes(first) && w.includes(last); });
      });
      const caption = (b as { caption?: string }).caption;
      if (caption && !has(text, caption)) lostRows.push([]);
      if (lostCols.length || lostRows.length) add("critical", "render:table-lost", s.heading, `${name}: ${lostCols.length} column label(s) and ${lostRows.length} row(s) of ${t.rows.length} missing`, "the table did not render; a document that loses its tables fails acceptance");
    }
  }

  // the PDF exists, has pages and carries the document's title
  if (r.pdfText != null) {
    if (!r.pdfPages || r.pdfPages < 1) add("critical", "render:pdf-empty", "—", "no pages", "the PDF did not render");
    const title = String((v.ddm.metadata as Record<string, unknown>)?.title ?? "");
    if (r.pdfTitle != null && title && !has(r.pdfTitle, title.slice(0, 40))) add("major", "render:pdf-metadata", "—", `PDF title "${r.pdfTitle}"`, `should be "${title}"`);
    const status = String((v.ddm.metadata as Record<string, unknown>)?.status ?? "");
    if (status && !has(r.pdfText, status)) add("major", "render:state-not-shown", "—", `status "${status}" not on the PDF`, "a draft must say it is a draft");
    if (/\bundefined\b|\bNaN\b|\[object /.test(r.pdfText)) add("critical", "render:placeholder", "—", (r.pdfText.match(/.{0,30}(undefined|NaN|\[object ).{0,30}/)?.[0] ?? "").trim(), "a missing value reached the PDF");
  }

  // buyer-facing: no valuation, price guidance or seller intelligence in the model, its metadata or any rendering
  if (opts.buyerFacing) {
    const all: Array<[string, string]> = [["document model", JSON.stringify(v.ddm)], ...outputs];
    for (const [name, text] of all) {
      const m = text.match(BUYER_LEAK);
      if (m) add("critical", "leak:seller-only", "—", `${name}: "${m[0]}"`, "seller-only material in a buyer-facing document");
      for (const usd of opts.valuationUsd ?? []) for (const term of new Set([...figureForms(usd), `$${(usd / 1e6).toFixed(1)}M`])) if (text.includes(term)) add("critical", "leak:valuation", "—", `${name}: ${term}`, "the seller's valuation in a buyer-facing document");
    }
  }
  return f;
}

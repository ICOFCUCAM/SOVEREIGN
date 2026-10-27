// Original against rewrite, chapter by chapter (DESIGN-SPEC.md §16): every
// paragraph of the rewrite paired with the original paragraph it comes from,
// original paragraphs the rewrite no longer has, and paragraphs that are new.
// The original is often text extracted from a PDF with no headings, so pairing
// is by shared words, preferring the order of the book; it is an aid to the
// author's reading, not a verdict. Scripture, numbers and quotations that differ
// within a pair are flagged.
import { scriptureRefs } from "@/lib/teacher/scripture";
import { parseBookRules, type TermRule } from "../../supabase/functions/_shared/teacher-core";
import { contentWords, stem } from "@/lib/editorial-audit";

export interface RewriteParagraph { text: string; start: number; end: number }
export type RowKind = "rewritten" | "unchanged" | "new" | "not-in-rewrite";
export interface CompareRow {
  kind: RowKind;
  rewrite?: RewriteParagraph;
  original?: string;
  /** How much the pair shares (0–1), for the author's eye only. */
  score?: number;
  /** What differs inside the pair and matters: scripture, numbers, quotations. */
  flags: string[];
}
export interface CompareChapter { title: string; rows: CompareRow[] }
export interface BookComparison {
  chapters: CompareChapter[];
  summary: { rewritten: number; unchanged: number; added: number; notInRewrite: number; flagged: number; originalParagraphs: number };
}

const flat = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^a-z0-9À-ɏ' ]+/g, " ").replace(/\s+/g, " ").trim();
const words = (s: string) => new Set(contentWords(s).map(stem));
const numbers = (s: string) => new Set((s.replace(/\b\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?\b/g, " ").match(/\b\d{2,4}\b/g) ?? []));
const quotes = (s: string) => [...s.matchAll(/“([^”]{12,})”|"([^"\n]{12,})"/g)].map((m) => flat(m[1] ?? m[2]));

function applyRules(text: string, rules: TermRule[]): string {
  let out = text;
  for (const r of rules) for (const w of r.replaces) out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "giu"), r.term);
  return out;
}

/** The rewrite's paragraphs with their exact place in its text, grouped under its chapter headings (## or #). */
export function rewriteChapters(text: string): { title: string; paragraphs: RewriteParagraph[] }[] {
  const out: { title: string; paragraphs: RewriteParagraph[] }[] = [{ title: "Opening", paragraphs: [] }];
  const re = /[^\n]+(?:\n(?!\s*\n)[^\n]+)*/g;
  for (const m of text.matchAll(re)) {
    const block = m[0];
    const h = /^(#{1,2})\s+(.+)$/.exec(block.trim());
    if (h && !block.includes("\n")) { out.push({ title: h[2].replace(/[*_]/g, "").trim(), paragraphs: [] }); continue; }
    out[out.length - 1].paragraphs.push({ text: block, start: m.index!, end: m.index! + block.length });
  }
  return out.filter((c) => c.paragraphs.length || c.title !== "Opening");
}

/** The original's paragraphs: blank-line separated; extracted PDF text with single line breaks is joined into sentences. */
export function originalParagraphs(text: string): string[] {
  const blocks = text.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  // A PDF extraction may give one huge block with a line per printed line; split it where a line ends a sentence.
  return blocks.flatMap((b) => (b.length > 2500 ? b.split(/(?<=[.!?”"])\n/) : [b])).map((b) => b.replace(/\s*\n\s*/g, " ").trim()).filter((b) => b.length > 1);
}

export function compareBook(original: string, rewrite: string, opts: { rules?: string } = {}): BookComparison {
  const rules = parseBookRules(opts.rules ?? "").filter((r): r is TermRule => r.kind === "required_term");
  const origParas = originalParagraphs(applyRules(original ?? "", rules));
  const origSets = origParas.map(words);
  const index = new Map<string, number[]>();
  origSets.forEach((set, i) => set.forEach((w) => index.set(w, [...(index.get(w) ?? []), i])));
  const used = new Set<number>();
  const chapters = rewriteChapters(rewrite ?? "");
  let last = -1;
  const result: CompareChapter[] = [];
  let rewritten = 0, unchanged = 0, added = 0, flagged = 0;

  for (const ch of chapters) {
    const rows: CompareRow[] = [];
    for (const p of ch.paragraphs) {
      const isHeading = /^#{1,6}\s/.test(p.text.trim());
      const want = words(p.text);
      const hits = new Map<number, number>();
      want.forEach((w) => (index.get(w) ?? []).forEach((i) => hits.set(i, (hits.get(i) ?? 0) + 1)));
      let best: { i: number; score: number } | null = null;
      hits.forEach((n, i) => {
        if (used.has(i)) return;
        // Prefer the order of the book: a small bonus for following the last match closely.
        const dice = (2 * n) / (want.size + origSets[i].size);
        const near = i > last && i - last <= 12 ? 0.08 : 0;
        const score = dice + near;
        if (!best || score > best.score) best = { i, score };
      });
      const b = best as { i: number; score: number } | null;
      if (!isHeading && b && b.score >= 0.3 && want.size >= 3) {
        // Original paragraphs skipped between the last match and this one are not in the rewrite.
        for (let k = last + 1; k < b.i; k++) if (!used.has(k) && origParas[k].split(/\s+/).length >= 8) { rows.push({ kind: "not-in-rewrite", original: origParas[k], flags: [] }); used.add(k); }
        used.add(b.i); last = Math.max(last, b.i);
        const o = origParas[b.i];
        const same = flat(o) === flat(p.text);
        const flags: string[] = [];
        const ro = new Set(scriptureRefs(o).map((r) => r.normalized)), rr = new Set(scriptureRefs(p.text).map((r) => r.normalized));
        const lostRefs = [...ro].filter((r) => !rr.has(r)), newRefs = [...rr].filter((r) => !ro.has(r));
        if (lostRefs.length) flags.push(`Scripture missing: ${lostRefs.join(", ")}`);
        if (newRefs.length) flags.push(`Scripture added: ${newRefs.join(", ")}`);
        const no = numbers(o), nr = numbers(p.text);
        const newNums = [...nr].filter((x) => !no.has(x));
        if (newNums.length) flags.push(`New numbers: ${newNums.join(", ")}`);
        const lostQuotes = quotes(o).filter((q) => !flat(p.text).includes(q));
        if (lostQuotes.length) flags.push(`${lostQuotes.length} quotation${lostQuotes.length === 1 ? "" : "s"} changed`);
        if (flags.length) flagged++;
        if (same) unchanged++; else rewritten++;
        rows.push({ kind: same ? "unchanged" : "rewritten", rewrite: p, original: o, score: Math.min(1, b.score), flags });
      } else {
        if (!isHeading) added++;
        rows.push({ kind: "new", rewrite: p, flags: [] });
      }
    }
    result.push({ title: ch.title, rows });
  }
  // Whatever the rewrite never used, at the end of the book, is not in the rewrite either.
  const tail: CompareRow[] = [];
  for (let k = 0; k < origParas.length; k++) if (!used.has(k) && origParas[k].split(/\s+/).length >= 8) tail.push({ kind: "not-in-rewrite", original: origParas[k], flags: [] });
  if (tail.length) result.push({ title: "Not found in the rewrite", rows: tail });
  const notInRewrite = result.reduce((n, c) => n + c.rows.filter((r) => r.kind === "not-in-rewrite").length, 0);
  return { chapters: result, summary: { rewritten, unchanged, added, notInRewrite, flagged, originalParagraphs: origParas.length } };
}

/** The rewrite with one paragraph replaced by the author's original wording. */
export function restoreParagraph(rewrite: string, p: RewriteParagraph, original: string): string {
  return rewrite.slice(0, p.start) + original + rewrite.slice(p.end);
}

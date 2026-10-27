// AI Teacher content pipeline (blueprint §2a, build step 1): a book's Markdown
// becomes validated structure (chapters and sections with stable IDs), then
// token-based, structure-first chunks carrying every location field a citation
// needs, and a content-hashed version. Indexing a version never makes it
// available to any tutor by itself; a course grants that (blueprint §0.1).
import { scriptureRefs, type ScriptureRef } from "./scripture";

/** Chunk sizes in tokens (blueprint §2a): target 450, normal range 300–650, overlap 50–80. */
export const CHUNK = { target: 450, min: 300, max: 650, overlap: 64 } as const;

/** A paragraph; index counts from 0 within its chapter, so "Chapter 2 ¶14" stays stable when other chapters change. */
export interface Paragraph { index: number; text: string; charStart: number; charEnd: number }
export interface SectionNode { id: string; title: string; level: number; headingPath: string[]; paragraphs: Paragraph[] }
export interface ChapterNode { id: string; number: number | null; title: string; charStart: number; charEnd: number; sections: SectionNode[]; unnumbered: boolean }
export interface StructureIssue { level: "error" | "warning"; code: string; message: string; line?: number }
export interface BookStructure { title: string; chapters: ChapterNode[]; issues: StructureIssue[] }

export interface Chunk {
  id: string; ordinal: number;
  chapterId: string; chapterNumber: number | null; headingPath: string[];
  paragraphStart: number; paragraphEnd: number; charStart: number; charEnd: number;
  text: string; tokens: number;
  scriptureRefs: ScriptureRef[];
  sourceType: "published_book" | "private_document"; sourceLocation: string;
  contentHash: string;
}
export interface SourceVersion { contentHash: string; structure: BookStructure; chunks: Chunk[]; createdAt: string }

/** An estimate good enough for sizing (about 4 characters a token in English prose); the index stores the estimate, not a billing figure. */
export const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.trim().length / 4));

const UNNUMBERED = /^(preface|foreword|introduction|prologue|acknowledg(e)?ments?|dedication|epigraph|contents|table of contents|epilogue|afterword|conclusion|appendix\b.*|glossary|notes|endnotes|bibliography|references|works cited|index|about the author|also by.*)$/i;

/** A stable, readable ID: an explicit {#anchor} wins; otherwise a slug of the heading, made unique by position. */
export function slug(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "section";
}
const anchor = (title: string) => { const m = /\s*\{#([\w-]+)\}\s*$/.exec(title); return m ? { title: title.slice(0, m.index).trim(), id: m[1] } : { title: title.trim(), id: null }; };

/** Reads the book's structure: "# Book title" (optional), "## Chapter", "###"+ sections; paragraphs with character offsets into the source. */
export function parseStructure(md: string): BookStructure {
  const issues: StructureIssue[] = [];
  const text = md.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  let title = "";
  // A book with a single "#" title uses "##" for chapters; a book of "#" chapters uses "#".
  const h1 = lines.filter((l) => /^# /.test(l)).length;
  const chapterLevel = h1 <= 1 && lines.some((l) => /^## /.test(l)) ? 2 : 1;
  const chapters: ChapterNode[] = [];
  const used = new Set<string>();
  const unique = (base: string) => { let id = base, n = 2; while (used.has(id)) id = `${base}-${n++}`; used.add(id); return id; };
  let ch: ChapterNode | null = null;
  let sec: SectionNode | null = null;
  let para: string[] = [], paraStart = 0, paraEnd = 0, offset = 0, pIndex = 0, number = 0, lastLevel = chapterLevel, inFence = false;

  const flush = (end: number) => {
    const t = para.join("\n").trim();
    if (t && sec) sec.paragraphs.push({ index: pIndex++, text: t, charStart: paraStart, charEnd: Math.min(end, paraEnd) });
    else if (t && !ch) issues.push({ level: "warning", code: "text-before-first-chapter", message: "Text before the first chapter heading is not part of any chapter." });
    para = [];
  };

  lines.forEach((line, i) => {
    const start = offset; offset += line.length + 1;
    if (/^```/.test(line)) inFence = !inFence;
    const h = !inFence && /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) {
      flush(start);
      const level = h[1].length; const { title: t, id: explicit } = anchor(h[2]);
      if (level < chapterLevel) { title = t; return; }
      if (level === chapterLevel) {
        if (ch) ch.charEnd = start;
        const plain = UNNUMBERED.test(t) || /\{-\}$/.test(h[2]);
        const clean = t.replace(/\s*\{-\}$/, "");
        if (!plain) number++;
        const id = unique(explicit ?? `${plain ? "" : `ch-${String(number).padStart(2, "0")}-`}${slug(clean)}`);
        ch = { id, number: plain ? null : number, title: clean, charStart: start, charEnd: text.length, sections: [], unnumbered: plain };
        sec = { id: `${id}`, title: clean, level, headingPath: [clean], paragraphs: [] };
        ch.sections.push(sec); chapters.push(ch); pIndex = 0; lastLevel = level;
        if (!clean) issues.push({ level: "error", code: "empty-heading", message: "A chapter heading has no text.", line: i + 1 });
        return;
      }
      if (!ch) { issues.push({ level: "warning", code: "section-before-chapter", message: `“${t}” comes before the first chapter.`, line: i + 1 }); return; }
      if (level > lastLevel + 1) issues.push({ level: "warning", code: "heading-skip", message: `“${t}” skips a heading level (h${lastLevel} to h${level}).`, line: i + 1 });
      lastLevel = level;
      const parent = [...ch.sections].reverse().find((s) => s.level < level) ?? ch.sections[0];
      const path = [...parent.headingPath, t];
      sec = { id: unique(explicit ?? `${ch.id}--${slug(t)}`), title: t, level, headingPath: path, paragraphs: [] };
      ch.sections.push(sec);
      return;
    }
    if (!line.trim()) { flush(start); return; }
    if (!para.length) paraStart = start + (line.length - line.trimStart().length);
    para.push(line); paraEnd = start + line.trimEnd().length;
  });
  flush(text.length);

  if (!chapters.length) issues.push({ level: "error", code: "no-chapters", message: "No chapter headings found: chapters start with “## ” under a “# ” book title, or with “# ”." });
  for (const c of chapters) {
    if (!c.sections.some((s) => s.paragraphs.length)) issues.push({ level: "warning", code: "empty-chapter", message: `“${c.title}” has no text yet.` });
  }
  const titles = new Map<string, number>();
  for (const c of chapters) titles.set(c.title.toLowerCase(), (titles.get(c.title.toLowerCase()) ?? 0) + 1);
  for (const [t, n] of titles) if (n > 1 && t) issues.push({ level: "warning", code: "duplicate-chapter", message: `${n} chapters are titled “${chapters.find((c) => c.title.toLowerCase() === t)!.title}”.` });
  if (/\[\[YOURS:/.test(text)) issues.push({ level: "warning", code: "unresolved-marker", message: "The text still has [[YOURS]] markers; learners would see them." });
  return { title, chapters, issues };
}

/** SHA-256 of the text, hex. */
export async function sha256(text: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Sentences, for splitting a paragraph longer than the maximum chunk. */
const sentences = (p: Paragraph): Paragraph[] => {
  const out: Paragraph[] = []; const re = /[^.!?]+(?:[.!?]+["”’)]*|$)\s*/g; let m: RegExpExecArray | null;
  while ((m = re.exec(p.text)) && m[0]) out.push({ index: p.index, text: m[0].trim(), charStart: p.charStart + m.index, charEnd: p.charStart + m.index + m[0].trimEnd().length });
  return out.filter((s) => s.text);
};

/**
 * Structure-first chunks: paragraphs are packed within a section up to the target;
 * a short section stays whole; a section never shares a chunk with another; a
 * paragraph longer than the maximum is split at sentences. Neighbouring chunks
 * in a section overlap by about CHUNK.overlap tokens (whole sentences).
 */
export async function chunkBook(md: string, source: { id: string; type?: Chunk["sourceType"] }): Promise<SourceVersion> {
  const structure = parseStructure(md);
  const chunks: Chunk[] = [];
  let ordinal = 0;
  for (const ch of structure.chapters) {
    for (const sec of ch.sections) {
      const units = sec.paragraphs.flatMap((p) => (estimateTokens(p.text) > CHUNK.max ? sentences(p) : [p]));
      let i = 0, carried = 0;
      while (i < units.length) {
        const group: Paragraph[] = []; let tokens = 0;
        while (i < units.length && (group.length <= carried || tokens + estimateTokens(units[i].text) <= CHUNK.target || (tokens < CHUNK.min && tokens + estimateTokens(units[i].text) <= CHUNK.max))) {
          group.push(units[i]); tokens += estimateTokens(units[i].text); i++;
        }
        // Overlap: the last sentences of this chunk open the next one, when they fit with it.
        let overlap: Paragraph[] = [];
        if (i < units.length) {
          let t = 0;
          for (const sn of sentences(group[group.length - 1]).reverse()) { if (t + estimateTokens(sn.text) > CHUNK.overlap) break; overlap.unshift(sn); t += estimateTokens(sn.text); }
          if (!overlap.length || t + estimateTokens(units[i].text) > CHUNK.max || overlap.length === sentences(group[group.length - 1]).length && group.length === 1) overlap = [];
        }
        // Sentences of one paragraph join with a space; paragraphs with a blank line.
        const text = group.map((g, n) => (n === 0 ? "" : group[n - 1].index === g.index ? " " : "\n\n") + g.text).join("");
        chunks.push({
          id: "", ordinal: ordinal++, chapterId: ch.id, chapterNumber: ch.number, headingPath: sec.headingPath,
          paragraphStart: group[0].index, paragraphEnd: group[group.length - 1].index, charStart: group[0].charStart, charEnd: group[group.length - 1].charEnd,
          text, tokens: estimateTokens(text), scriptureRefs: scriptureRefs(text),
          sourceType: source.type ?? "published_book", sourceLocation: `${ch.number ? `Chapter ${ch.number}` : ch.title}${sec.headingPath.length > 1 ? ` › ${sec.headingPath.slice(1).join(" › ")}` : ""} ¶${group[0].index + 1}${group.length > 1 ? `–${group[group.length - 1].index + 1}` : ""}`,
          contentHash: await sha256(text),
        });
        // The next chunk starts with the overlap and always takes at least one new unit, so the loop advances.
        if (overlap.length) { units.splice(i, 0, ...overlap); carried = overlap.length; } else carried = 0;
      }
    }
  }
  // IDs are stable for unchanged text: chapter, then the hash of the passage.
  const seen = new Map<string, number>();
  for (const c of chunks) { const base = `${source.id}:${c.chapterId}:${c.contentHash.slice(0, 12)}`; const n = seen.get(base) ?? 0; seen.set(base, n + 1); c.id = n ? `${base}-${n}` : base; }
  return { contentHash: await sha256(md.replace(/\r\n?/g, "\n")), structure, chunks, createdAt: new Date().toISOString() };
}

/** What changed between two versions: chunks kept (same ID), added and removed. Unchanged passages keep their citations. */
export function diffVersions(prev: SourceVersion | null, next: SourceVersion) {
  const before = new Set(prev?.chunks.map((c) => c.id) ?? []), after = new Set(next.chunks.map((c) => c.id));
  return { kept: next.chunks.filter((c) => before.has(c.id)).length, added: next.chunks.filter((c) => !before.has(c.id)), removed: (prev?.chunks ?? []).filter((c) => !after.has(c.id)) };
}

/** The author's preview before anything is indexed: chapters as detected, with counts and the issues to confirm. */
export function authorPreview(v: SourceVersion) {
  return {
    title: v.structure.title,
    chapters: v.structure.chapters.map((c) => ({
      id: c.id, label: c.number ? `Chapter ${c.number}` : "Unnumbered", title: c.title,
      sections: c.sections.length - 1, paragraphs: c.sections.reduce((n, s) => n + s.paragraphs.length, 0),
      chunks: v.chunks.filter((x) => x.chapterId === c.id).length,
      scripture: [...new Set(v.chunks.filter((x) => x.chapterId === c.id).flatMap((x) => x.scriptureRefs.map((r) => r.normalized)))],
    })),
    issues: v.structure.issues,
    blocking: v.structure.issues.some((i) => i.level === "error"),
  };
}

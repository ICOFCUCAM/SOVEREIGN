// Organise into chapters and sections (DESIGN-SPEC.md §19). Claude says where each part
// of the book begins ("starts": its first words, copied from the book) and what it is called;
// the split itself happens here, at those places, so no word of the book changes. The prompt is
// word for word the runner's (src/prompts.mjs organisePrompt); a test keeps them identical.
import { isChapterLine, kindDef, newId, words, type Manuscript, type Section } from "@/lib/manuscript";

export const ORGANISE_SHAPE = `{"sections": [{"kind": "chapter", "title": "", "starts": "", "headings": [{"title": "", "starts": ""}]}], "notes": ""}`;
export interface OrganiseOptions { titles: "keep" | "improve"; instructions?: string }
export function organisePrompt(o: Partial<OrganiseOptions>, where: string): string {
  const improve = o.titles === "improve";
  return `Organise ${where} into a book's chapters and sections. Do not change, add or remove any text of the book: you only say where each part begins and what it is called.
1. Read all of it. Find the front matter (title page, copyright, dedication, contents, foreword, preface, acknowledgements, introduction), the parts (if the book has parts), every chapter, and the back matter (conclusion, epilogue, appendices, notes, bibliography, glossary, index, about the author).
2. Within each chapter, find its sections: places where a new subject begins, with or without a heading in the text.
3. For each one give "starts": the first 8 to 15 words where it begins, copied character for character from the book (with its punctuation and capitals), so the place can be found again. If it begins with a heading line, start "starts" at that heading line.
4. Titles: ${improve ? "write clear, professional titles that say what each chapter and section is about, in the book's own terms; for a chapter the author already titled, keep the author's title unless it is only a number." : "use the author's own heading text where there is one (without the word \"Chapter\" and its number); where there is none, write a short title from the content."}${o.instructions ? `\n5. The owner adds: ${String(o.instructions).trim()}` : ""}
"kind" is one of: title-page, copyright, dedication, epigraph, foreword, preface, acknowledgments, introduction, prologue, part, chapter, epilogue, afterword, conclusion, appendix, notes, bibliography, glossary, index, about-author. List them in the order of the book; leave out a table of contents page (it is made from the chapters).
Valid JSON only (no comments, no code fences), exactly this shape:
${ORGANISE_SHAPE}
"notes": anything the owner should know (duplicated text, a chapter that seems missing, numbering the book skips).`;
}

export interface OrganisePlan { sections: { kind: string; title: string; starts: string; headings: { title: string; starts: string }[] }[]; notes: string }
export function parseOrganise(raw: string): OrganisePlan {
  let j: Record<string, unknown>;
  try { const t = raw.trim().replace(/^```(?:json)?\s*|\s*```\s*$/g, ""); j = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); }
  catch { throw new Error("Claude's plan of the chapters wasn't valid. Try again."); }
  const str = (v: unknown, n = 400) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const sections = (Array.isArray(j.sections) ? j.sections : []).map((x) => {
    const s = (x ?? {}) as Record<string, unknown>;
    return { kind: str(s.kind, 40) || "chapter", title: str(s.title, 300), starts: str(s.starts, 600), headings: (Array.isArray(s.headings) ? s.headings : []).map((h) => { const y = (h ?? {}) as Record<string, unknown>; return { title: str(y.title, 300), starts: str(y.starts, 600) }; }).filter((h) => h.title && h.starts) };
  }).filter((s) => s.title && s.starts);
  if (!sections.length) throw new Error("Claude found no chapters. Try again.");
  return { sections, notes: str(j.notes, 4000) };
}

/** Letters and digits only, lower-case, with each one's place in the text: so a passage is found again whatever its spacing, quotes or dashes. */
function fold(text: string): { s: string; at: number[] } {
  const at: number[] = []; let s = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i].toLowerCase();
    if (/[\p{L}\p{N}]/u.test(c)) { s += c; at.push(i); }
  }
  return { s, at };
}
const folded = (t: string) => fold(t).s;
/** A short line that is a heading (not a sentence of the book). */
function headingLine(line: string, title: string): boolean {
  const l = line.trim();
  if (!l || l.length > 90 || l.split(/\s+/).length > 14 || /[.!?]\s+\S/.test(l)) return false;
  const fl = folded(l), ft = folded(title);
  return isChapterLine(l) || /^#{1,6}\s/.test(l) || (l === l.toUpperCase() && /\p{L}/u.test(l)) || (fl.length > 0 && (fl === ft || ft.includes(fl) || fl.includes(ft)));
}
/** Cuts a leading heading line off a passage; returns the passage and the words it removed. */
function dropHeading(text: string, title: string): { text: string; removed: number } {
  // A heading can take up to three short lines ("CHAPTER 1" / "THE ONE GOD").
  let rest = text, removed = 0;
  for (let k = 0; k < 3; k++) {
    const m = /^\s*([^\n]*)\n?/.exec(rest)!;
    if (!m[1].trim() || !headingLine(m[1], title) || !rest.slice(m[0].length).trim()) break;
    removed += words(m[1]); rest = rest.slice(m[0].length);
  }
  return { text: rest.trim(), removed };
}

export interface Organised {
  sections: Section[]; missed: string[]; notes: string; totalWords: number; keptWords: number; removedHeadingWords: number;
  /** Arranged from the book's own contents (arrange-book.ts): the title block, read as the book's title and subtitle. */
  title?: string; subtitle?: string;
  /** What was taken out of the text and why (the typed contents list, a working label), shown before applying. */
  setAside?: string[];
}

/** The book split where Claude's plan says each part begins; nothing of the text is changed or lost. */
export function applyOrganise(text: string, plan: OrganisePlan): Organised {
  const f = fold(text);
  const find = (starts: string, from: number, to = f.s.length) => {
    const key = folded(starts);
    if (key.length < 10) return -1;
    for (const k of [key, key.slice(0, 40), key.slice(0, 24)]) { const i = f.s.indexOf(k, from); if (i >= 0 && i < to) return i; }
    return -1;
  };
  const missed: string[] = [];
  const found: { plan: OrganisePlan["sections"][number]; at: number }[] = [];
  let cursor = 0;
  for (const p of plan.sections) {
    const i = find(p.starts, cursor);
    if (i < 0) { missed.push(p.title); continue; }
    found.push({ plan: p, at: i }); cursor = i + 1;
  }
  const place = (i: number) => (i >= f.at.length ? text.length : f.at[i]);
  // Back to the start of the line, so a section never begins mid-word.
  const lineStart = (pos: number) => { const n = text.lastIndexOf("\n", pos - 1); return n < 0 ? 0 : n + 1; };
  const out: Section[] = [];
  let removed = 0;
  const firstPos = found.length ? lineStart(place(found[0].at)) : text.length;
  if (text.slice(0, firstPos).trim()) out.push({ id: newId(), kind: "chapter", title: "Opening pages", body: text.slice(0, firstPos).trim() });
  found.forEach((s, n) => {
    const start = lineStart(place(s.at));
    const endFold = n + 1 < found.length ? found[n + 1].at : f.s.length;
    const end = n + 1 < found.length ? lineStart(place(found[n + 1].at)) : text.length;
    // Sections inside the chapter: a "### " heading where each begins (a heading line already there is replaced).
    const cuts = s.plan.headings.map((h) => ({ h, at: find(h.starts, s.at + 1, endFold) })).filter((c) => {
      if (c.at < 0) { missed.push(`${s.plan.title} · ${c.h.title}`); return false; } return true;
    }).map((c) => ({ ...c, pos: lineStart(place(c.at)) })).filter((c) => c.pos > start && c.pos < end).sort((a, b) => a.pos - b.pos);
    const head = dropHeading(text.slice(start, cuts[0]?.pos ?? end), s.plan.title);
    removed += head.removed;
    let body = head.text;
    cuts.forEach((c, k) => {
      const piece = dropHeading(text.slice(c.pos, cuts[k + 1]?.pos ?? end), c.h.title);
      removed += piece.removed;
      body += `${body ? "\n\n" : ""}### ${c.h.title}\n\n${piece.text}`;
    });
    out.push({ id: newId(), kind: kindDef(s.plan.kind).kind, title: s.plan.title, body: body.trim() });
  });
  const inserted = out.reduce((n, s) => n + [...s.body.matchAll(/^### (.+)$/gm)].reduce((k, m) => k + words(m[1]) + 1, 0), 0);
  const kept = out.reduce((n, s) => n + words(s.body), 0) - inserted;
  return { sections: out, missed, notes: plan.notes, totalWords: words(text), keptWords: kept, removedHeadingWords: removed };
}

/** The text to organise: the manuscript as it stands, each section with its title line. */
export function manuscriptText(m: Manuscript): string {
  return m.sections.map((s) => (/^chapter \d+$/i.test(s.title.trim()) && !s.body.trim().toLowerCase().startsWith(s.title.trim().toLowerCase()) ? s.body : `${s.title}\n\n${s.body}`)).join("\n\n");
}

/** The manuscript laid out as organised; the sections it replaces are kept in the archive to restore. */
export function organisedToManuscript(o: Organised, m: Manuscript, at = new Date().toISOString()): Manuscript {
  const archive = m.sections.length ? [...(m.archive ?? []), { at, label: "Before organising into chapters", sections: m.sections.map(({ id, kind, title, body, idea }) => ({ id, kind, title, body, ...(idea ? { idea } : {}) })) }].slice(-5) : m.archive;
  return { ...m, sections: o.sections, ...(o.title ? { title: o.title } : {}), ...(o.subtitle ? { subtitle: o.subtitle } : {}), ...(archive ? { archive } : {}) };
}

/** The owner's corrections to Claude's division (DESIGN-SPEC.md §21): a part's title or kind. */
export function editPart(o: Organised, i: number, patch: Partial<Pick<Section, "title" | "kind">>): Organised {
  return { ...o, sections: o.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) };
}
/** Joins a part to the one before it; its title becomes a section heading there, so no word is lost. */
export function joinToPrevious(o: Organised, i: number): Organised {
  if (i <= 0 || i >= o.sections.length) return o;
  const prev = o.sections[i - 1], cur = o.sections[i];
  const body = [prev.body.trim(), cur.title.trim() ? `### ${cur.title.trim()}` : "", cur.body.trim()].filter(Boolean).join("\n\n");
  return { ...o, sections: [...o.sections.slice(0, i - 1), { ...prev, body }, ...o.sections.slice(i + 1)] };
}

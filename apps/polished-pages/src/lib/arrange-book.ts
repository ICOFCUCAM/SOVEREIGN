// Arrange a book from its own contents (DESIGN-SPEC.md §21). A manuscript imported in one piece often
// carries its title page and a typed contents list at the top: the list is the author's own map of the
// book. Each entry is found again where it stands as a heading in the text, and the book is split there
// (Introduction and other front matter, numbered chapters with their sections, back matter) without
// changing a word: the split itself is Organise's (applyOrganise). The title block becomes the book's
// title and subtitle; a working label ("COMPLETE MANUSCRIPT") is set aside, not printed.
import { applyOrganise, type Organised, type OrganisePlan } from "./organise";
import { SECTION_KINDS, type Section } from "./manuscript";

const norm = (s: string) => s.toLowerCase().replace(/^(chapter|part)\s+[\divxlc]+[.:)]?\s*/i, "").replace(/^\d+[.)]\s*/, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const FRONT: Record<string, string> = { introduction: "introduction", preface: "preface", foreword: "foreword", prologue: "prologue", dedication: "dedication", epigraph: "epigraph", acknowledgements: "acknowledgments", acknowledgments: "acknowledgments", "author s note": "author-note", "a note to the reader": "author-note", praise: "praise", "advance praise": "praise", endorsements: "praise" };
const BACK: Record<string, string> = {
  conclusion: "conclusion", "concluding remarks": "conclusion", "final thoughts": "conclusion", epilogue: "epilogue", afterword: "afterword",
  appendix: "appendix", appendices: "appendix", "discussion questions": "discussion", "study questions": "discussion", "questions for reflection": "discussion",
  glossary: "glossary", "glossary of terms": "glossary", references: "bibliography", bibliography: "bibliography", "works cited": "bibliography", "select bibliography": "bibliography", sources: "bibliography",
  index: "index", "scripture index": "scripture-index", "index of scripture": "scripture-index", "index of scriptures": "scripture-index", "subject index": "index", notes: "notes", endnotes: "notes",
  "about the author": "about-author", "also by the author": "also-by", resources: "resources", "further reading": "resources",
};
/** Back matter in the order books conventionally print it. */
const BACK_ORDER = ["conclusion", "epilogue", "afterword", "acknowledgments", "appendix", "discussion", "notes", "glossary", "bibliography", "scripture-index", "index", "about-author", "also-by", "resources"];
const kindOf = (line: string, key: string) =>
  /^\s*(chapter\s+)?\d+[.):]\s*\S/i.test(line) || /^chapter\s+[\divxlc]+\b/i.test(line) ? "chapter"
  : /^part\s+[\divxlc]+\b/i.test(line) ? "part"
  : /^appendix\b/i.test(line) ? "appendix"
  : /^(advance\s+)?praise\b|^endorsements\b|^what (readers|others) are saying\b/i.test(line) ? "praise"
  : FRONT[key] ?? BACK[key] ?? null;

/** Front matter, chapters, back matter in conventional order (DESIGN-SPEC.md §21); chapters and
 *  parts keep the author's order. Returns the sections and a line for each one that moved. */
export function conventionalOrder<T extends Pick<Section, "kind" | "title">>(sections: T[]): { sections: T[]; moved: string[] } {
  const group = (k: string) => (SECTION_KINDS.find((d) => d.kind === k)?.group ?? "body");
  const firstChapter = sections.findIndex((s) => group(s.kind) === "body");
  const rank = (s: T, i: number) => {
    // Acknowledgements the author placed after the chapters stay in the back matter.
    const g = s.kind === "acknowledgments" && firstChapter >= 0 && i > firstChapter ? "back" : group(s.kind);
    if (g === "front") return [0, SECTION_KINDS.findIndex((d) => d.kind === s.kind), i];
    if (g === "back") return [2, BACK_ORDER.indexOf(s.kind) < 0 ? BACK_ORDER.length : BACK_ORDER.indexOf(s.kind), i];
    return [1, 0, i];
  };
  const sorted = sections.map((s, i) => ({ s, r: rank(s, i) })).sort((a, b) => a.r[0] - b.r[0] || a.r[1] - b.r[1] || a.r[2] - b.r[2]).map((x) => x.s);
  const moved = sorted.flatMap((s, i) => (sections[i] !== s ? [`${s.title} moved to place ${i + 1}`] : []));
  return { sections: sorted, moved };
}
const WORKING = /^(the\s+)?(complete|full|final|working|revised|first|second)?\s*(manuscript|draft|version|copy|edition draft)(\s+\d+(\.\d+)?)?$/i;
const SMALL = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "with", "from"]);
/** "THE ONENESS OF YAHUAH" → "The Oneness of Yahuah"; a title already in mixed case stays as it is. */
export const titleCase = (t: string) => (t !== t.toUpperCase() ? t.trim() : t.trim().toLowerCase().split(/\s+/).map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(" "));

export interface Arrangement {
  plan: OrganisePlan;
  /** The text the plan applies to: the book after its title block and contents list. */
  body: string;
  title?: string; subtitle?: string; workingLabel?: string;
  /** Entries of the contents list that weren't found as headings in the text. */
  notFound: string[];
}

/** The book's typed contents list and the title block above it, or null when the text has none. */
export function arrangeFromContents(text: string): Arrangement | null {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const ci = lines.findIndex((l, i) => i < 80 && /^\s*(#+\s*)?(table of )?contents\s*$/i.test(l));
  if (ci < 0) return null;
  // The title block: the short lines above "Contents".
  const head = lines.slice(0, ci).map((l) => l.replace(/^#+\s*/, "").trim()).filter(Boolean);
  const workingLabel = head.find((l) => WORKING.test(l));
  const titled = head.filter((l) => l !== workingLabel && l.length < 160);
  // The list: short lines after "Contents", until an entry comes round again (the text begins).
  const entries: { line: string; at: number }[] = [];
  let i = ci + 1;
  for (; i < lines.length; i++) {
    const t = lines[i].replace(/^#+\s*/, "").replace(/\s*\.{2,}\s*[\divxlc]+\s*$/i, "").trim();
    if (!t) continue;
    // A sentence means the text has begun (a chapter number "1." is not a sentence end).
    if (t.length > 110 || /[.!?]["”’]?\s+\S/.test(t.replace(/^\s*(chapter\s+|part\s+|appendix\s+)?[\divxlc]+[.):]\s*/i, ""))) break;
    if (entries.some((e) => norm(e.line) === norm(t))) break;
    entries.push({ line: t, at: i });
  }
  if (entries.length < 3) return null;
  const bodyStart = i;
  const bodyLines = lines.slice(bodyStart);
  const body = bodyLines.join("\n");
  // Each entry found again as a standalone heading line, in order.
  const offsets: number[] = []; let acc = 0; for (const l of bodyLines) { offsets.push(acc); acc += l.length + 1; }
  let cursor = 0;
  const found: { line: string; idx: number }[] = []; const notFound: string[] = [];
  for (const e of entries) {
    const key = norm(e.line);
    let k = -1;
    for (let j = cursor; j < bodyLines.length; j++) { const l = bodyLines[j].replace(/^#+\s*/, "").trim(); if (l && l.length < 140 && norm(l) === key) { k = j; break; } }
    if (k < 0) { notFound.push(e.line); continue; }
    found.push({ line: e.line, idx: k }); cursor = k + 1;
  }
  // "starts": the heading line and the first words after it, so applyOrganise finds the very place.
  const startsAt = (k: number) => { const after = bodyLines.slice(k + 1).join(" ").split(/\s+/).filter(Boolean).slice(0, 10).join(" "); return `${bodyLines[k].replace(/^#+\s*/, "").trim()} ${after}`.trim(); };
  const sections: OrganisePlan["sections"] = [];
  for (const f of found) {
    const key = norm(f.line);
    const kind = kindOf(f.line, key);
    const title = f.line.replace(/^\s*(chapter\s+)?\d+[.):]\s*/i, "").replace(/^chapter\s+[\divxlc]+[.:]?\s*/i, "").trim() || f.line;
    if (kind) sections.push({ kind, title, starts: startsAt(f.idx), headings: [] });
    // Any other entry is a section of the part before it (its heading inside that chapter).
    else if (sections.length) sections[sections.length - 1].headings.push({ title, starts: startsAt(f.idx) });
    else sections.push({ kind: "chapter", title, starts: startsAt(f.idx), headings: [] });
  }
  if (!sections.length) return null;
  return {
    plan: { sections, notes: notFound.length ? `In the book's contents list but not found as a heading in the text: ${notFound.join("; ")}.` : "" },
    body, title: titled[0] ? titleCase(titled[0]) : undefined, subtitle: titled[1], workingLabel, notFound,
  };
}

/** The book arranged from its own contents list: split where each entry stands, put in conventional
 *  order, with the title block read as title and subtitle. Null when the book has no contents list. */
export function arrangeBook(text: string): Organised | null {
  const a = arrangeFromContents(text);
  if (!a) return null;
  const o = applyOrganise(a.body, a.plan);
  const { sections, moved } = conventionalOrder(o.sections);
  const setAside = [
    "The typed contents list: the book's Table of Contents is made from the headings, with page numbers, and updates itself.",
    ...(a.title ? [`The title block, used as the title${a.subtitle ? " and subtitle" : ""}.`] : []),
    ...(a.workingLabel ? [`"${a.workingLabel}", a working label rather than part of the book.`] : []),
  ];
  const notes = [a.plan.notes, moved.length ? `Put in the conventional order of a book: ${moved.join("; ")}.` : ""].filter(Boolean).join(" ");
  return { ...o, sections, notes, title: a.title, subtitle: a.subtitle, setAside };
}

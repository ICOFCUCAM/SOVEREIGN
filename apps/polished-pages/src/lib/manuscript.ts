// The manuscript a book is written in: front matter, chapters, back matter —
// each a section with its own text. Sections keep the order the owner gives
// them inside each group; groups compile in publishing order.

export type SectionGroup = "front" | "body" | "back";

export interface SectionKindDef {
  kind: string;
  label: string;
  group: SectionGroup;
  /** What Claude is told when drafting it. */
  guidance: string;
  /** Drafting reads the whole book (vs. just this section). */
  wholeBook?: boolean;
  /** Only one per book. */
  single?: boolean;
}

export const SECTION_KINDS: SectionKindDef[] = [
  // Front matter, in conventional order
  { kind: "title-page", label: "Title page", group: "front", single: true, guidance: "The book's title, subtitle and author name only, centred conventions handled by layout." },
  { kind: "copyright", label: "Copyright page", group: "front", single: true, guidance: "Standard copyright page: © year and author, all rights reserved notice, scripture permission notices for any Bible translations quoted (use the publishers' standard wording with [placeholders] to confirm), ISBN [placeholder], publisher [placeholder], edition, a short disclaimer if appropriate. Never invent an ISBN." },
  { kind: "dedication", label: "Dedication", group: "front", single: true, guidance: "One to three short lines. Use [name] placeholders; never invent the people it is dedicated to." },
  { kind: "epigraph", label: "Epigraph", group: "front", single: true, guidance: "One short quotation (a scripture verse or a line from a known author) that frames the book, with exact attribution. Only quote what you can verify." },
  { kind: "foreword", label: "Foreword", group: "front", single: true, guidance: "A foreword is written by someone other than the author. Draft a brief for the foreword writer: what the book is, why it matters, points they might speak to, and suggested length — not the foreword itself." },
  { kind: "preface", label: "Preface", group: "front", single: true, wholeBook: true, guidance: "The author's own note: why and how the book came to be written, who it is for, how to read it. First person, the author's voice. 400–900 words. Mark personal facts you don't know as [[YOURS: …]]." },
  { kind: "acknowledgments", label: "Acknowledgements", group: "front", single: true, guidance: "Warm thanks with [name] placeholders for the people, church, family, editors and readers the author will name. Never invent names." },
  { kind: "introduction", label: "Introduction", group: "front", single: true, wholeBook: true, guidance: "Introduce the book's subject, the problem it addresses, what the reader will gain, and a short map of the chapters. 800–1,500 words." },
  { kind: "prologue", label: "Prologue", group: "front", single: true, wholeBook: true, guidance: "A short scene or story that opens the book and leads into chapter one, in the book's voice." },
  // Body
  { kind: "part", label: "Part divider", group: "body", guidance: "A part title page with, optionally, one or two sentences introducing the chapters in this part." },
  { kind: "chapter", label: "Chapter", group: "body", guidance: "A full chapter that fits the book's outline and the chapters around it." },
  // Back matter, in conventional order
  { kind: "epilogue", label: "Epilogue", group: "back", single: true, wholeBook: true, guidance: "A short closing piece after the last chapter: where things stand now, or a final story." },
  { kind: "afterword", label: "Afterword", group: "back", single: true, wholeBook: true, guidance: "A reflection on the book after the fact: how it was received, what has changed, or a word to the reader." },
  { kind: "conclusion", label: "Conclusion", group: "back", single: true, wholeBook: true, guidance: "Draw the book's threads together: the main ideas, what they mean for the reader, and a clear call to action." },
  { kind: "appendix", label: "Appendix", group: "back", guidance: "Supporting material the owner describes (tables, extra notes, a study plan, prayers, resources)." },
  { kind: "discussion", label: "Discussion questions", group: "back", single: true, wholeBook: true, guidance: "A reading-group guide: for each chapter, 4–6 questions from recall to reflection and application." },
  { kind: "glossary", label: "Glossary", group: "back", single: true, wholeBook: true, guidance: "Alphabetical list of the specialised terms the book uses, each defined in one or two sentences as the book uses it." },
  { kind: "notes", label: "Notes", group: "back", single: true, wholeBook: true, guidance: "Endnotes grouped by chapter, gathered from the citations and references in the text, numbered in order." },
  { kind: "bibliography", label: "Bibliography", group: "back", single: true, wholeBook: true, guidance: "Every work cited or quoted in the manuscript, in the owner's chosen citation style, alphabetised. Include only sources that actually appear in the text or that you verified; mark incomplete details [check]." },
  { kind: "index", label: "Index", group: "back", single: true, wholeBook: true, guidance: "Back-of-book index of names, places, subjects, terms and scripture references, with chapter numbers (page numbers depend on layout), sub-entries and see-also links." },
  { kind: "about-author", label: "About the author", group: "back", single: true, wholeBook: true, guidance: "A 120–200-word third-person bio. Use only facts the owner has given; everything else as [placeholders]." },
  { kind: "also-by", label: "Also by the author", group: "back", single: true, guidance: "A list of the author's other books with [placeholders] for titles the owner will fill in." },
  { kind: "resources", label: "Resources & contact", group: "back", single: true, guidance: "Where readers can go next: website, newsletter, ministry or organisation, social links — all as [placeholders]." },
];

export const kindDef = (k: string) => SECTION_KINDS.find((d) => d.kind === k) ?? SECTION_KINDS.find((d) => d.kind === "chapter")!;
const rank = (k: string) => SECTION_KINDS.findIndex((d) => d.kind === k);
const GROUP_ORDER: Record<SectionGroup, number> = { front: 0, body: 1, back: 2 };

export interface Section {
  id: string; kind: string; title: string; body: string;
  /** Guided rewrite: what Claude says the section says, the owner's idea for it, and the text before it was rewritten. */
  summary?: string; idea?: string; original?: string;
}
export interface HistoryEntry { sectionId: string; op: string; engine: "claude-code" | "api"; at: string; accepted: boolean }
export interface Manuscript {
  title: string; subtitle?: string; author?: string; sections: Section[]; history: HistoryEntry[]; updatedAt?: string;
  /** Rules for rewriting the whole book (e.g. names to replace), applied to every guided rewrite. */
  rules?: string;
}

export const newId = () => `s-${Math.random().toString(36).slice(2, 10)}`;
export const words = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

/** Puts a new section where publishing convention expects it. Chapters go at the end of the body. */
export function insertSection(m: Manuscript, kind: string, title?: string): { manuscript: Manuscript; id: string } {
  const def = kindDef(kind);
  const sec: Section = { id: newId(), kind: def.kind, title: title ?? (def.kind === "chapter" ? `Chapter ${m.sections.filter((s) => s.kind === "chapter").length + 1}` : def.label), body: "" };
  const list = [...m.sections];
  let at = list.length;
  if (def.group === "body") {
    const firstBack = list.findIndex((s) => kindDef(s.kind).group === "back");
    at = firstBack < 0 ? list.length : firstBack;
  } else {
    // after the last section that comes before it in convention
    at = 0;
    list.forEach((s, i) => {
      const d = kindDef(s.kind);
      if (GROUP_ORDER[d.group] < GROUP_ORDER[def.group] || (d.group === def.group && rank(s.kind) <= rank(def.kind))) at = i + 1;
    });
  }
  list.splice(at, 0, sec);
  return { manuscript: { ...m, sections: list }, id: sec.id };
}

/** Moves a section up or down within its own group. */
export function moveSection(m: Manuscript, id: string, dir: -1 | 1): Manuscript {
  const list = [...m.sections];
  const i = list.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length || kindDef(list[i].kind).group !== kindDef(list[j].kind).group) return m;
  [list[i], list[j]] = [list[j], list[i]];
  return { ...m, sections: list };
}

/** A manuscript from an existing text: "## " headings (or "Chapter N" lines) become chapters. */
export function importText(title: string, text: string): Manuscript {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const sections: Section[] = [];
  let cur: Section | null = null;
  let bookTitle = title;
  for (const line of lines) {
    const h1 = /^#\s+(.+)$/.exec(line);
    if (h1 && !sections.length && !cur) { bookTitle = h1[1].trim(); continue; }
    const h = /^##\s+(.+)$/.exec(line) || /^((?:chapter|part)\s+[\divxlc]+\b.*)$/i.exec(line.trim());
    if (h) {
      if (cur) sections.push(cur);
      const t = h[1].trim();
      const known = SECTION_KINDS.find((d) => d.group !== "body" && d.label.toLowerCase() === t.toLowerCase().replace("acknowledgments", "acknowledgements"));
      cur = { id: newId(), kind: known?.kind ?? (/^part\b/i.test(t) ? "part" : "chapter"), title: t, body: "" };
      continue;
    }
    if (!cur) cur = { id: newId(), kind: "chapter", title: "Chapter 1", body: "" };
    cur.body += (cur.body ? "\n" : "") + line;
  }
  if (cur) sections.push(cur);
  for (const s of sections) s.body = s.body.trim();
  return { title: bookTitle, sections: sections.filter((s) => s.body || s.kind === "part"), history: [] };
}

/** The finished book as Markdown, in publishing order, with a generated table of contents. */
export function compile(m: Manuscript, opts: { contents?: boolean } = {}): string {
  const ordered = [...m.sections].sort((a, b) => GROUP_ORDER[kindDef(a.kind).group] - GROUP_ORDER[kindDef(b.kind).group]);
  const out: string[] = [`# ${m.title || "Untitled book"}`];
  if (m.subtitle) out.push(`*${m.subtitle}*`);
  if (m.author) out.push(`by ${m.author}`);
  const listed = ordered.filter((s) => s.kind !== "title-page" && s.kind !== "copyright" && s.kind !== "dedication" && s.kind !== "epigraph");
  let contentsDone = !opts.contents;
  for (const s of ordered) {
    if (s.kind === "title-page") continue;
    const d = kindDef(s.kind);
    if (!contentsDone && (d.group !== "front" || rank(s.kind) > rank("epigraph"))) {
      out.push(`## Contents\n\n${listed.map((x) => `- ${x.title}`).join("\n")}`);
      contentsDone = true;
    }
    out.push(`## ${s.title}${s.body.trim() ? `\n\n${s.body.trim()}` : ""}`);
  }
  if (!contentsDone) out.push(`## Contents\n\n${listed.map((x) => `- ${x.title}`).join("\n")}`);
  return out.join("\n\n") + "\n";
}

/** A plain record of what Claude did and what the author accepted. */
export function authorshipNotes(m: Manuscript): string {
  const byId = new Map(m.sections.map((s) => [s.id, s.title]));
  const rows = m.history.map((h) => `| ${new Date(h.at).toLocaleDateString()} | ${byId.get(h.sectionId) ?? "(removed section)"} | ${h.op} | ${h.engine === "api" ? "API" : "Claude Code"} | ${h.accepted ? "accepted" : "not used"} |`);
  const total = m.sections.reduce((n, s) => n + words(s.body), 0);
  return `# Authorship notes: ${m.title || "Untitled book"}\n\n${total.toLocaleString()} words in ${m.sections.length} sections.\n\nAI assistance used while writing (Claude), section by section:\n\n| Date | Section | What Claude did | Engine | Outcome |\n| --- | --- | --- | --- | --- |\n${rows.join("\n") || "| — | — | none | — | — |"}\n`;
}

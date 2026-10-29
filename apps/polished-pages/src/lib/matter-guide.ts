// Front and back matter, page by page (DESIGN-SPEC.md §21). The author goes through the preliminary
// and closing pages in the order a book prints them: writes what they want on each, has Claude rewrite
// it professionally (as often as they like), accepts it and moves on. Pages the manuscript already has
// are shown filled in, to edit by hand or with Claude. Facts (names, dates, ISBN, publisher) are asked
// for and never made up; Claude marks anything it would need as [[YOURS: …]].
import { insertSection, kindDef, type Manuscript, type Section } from "./manuscript";
import { addVersion } from "./section-versions";

export interface MatterStep {
  kind: string;
  group: "front" | "back";
  /** What the author is asked for on this page. */
  ask: string;
  /** Example of what to write. */
  hint: string;
  /** Set from the book's details (fields), not written as text. */
  facts?: "title" | "copyright";
  /** Made automatically from the book (the Contents): nothing to write. */
  auto?: boolean;
  /** On by default for a book that hasn't got it yet. */
  standard?: boolean;
  /** Claude may draft it from the book itself when the author writes nothing (no personal facts needed). */
  fromBook?: boolean;
  /** Words that are someone else's and stay exactly as given (endorsements): no rewrite. */
  verbatim?: boolean;
}

export const MATTER_STEPS: MatterStep[] = [
  { kind: "praise", group: "front", ask: "Endorsements you have received, word for word, each followed by a line with the person's name and role (start it with a dash). They open the book, before the title. Leave this page out until you have them.", hint: "“A clear and careful study…”\n— Name, role", verbatim: true },
  { kind: "half-title", group: "front", ask: "The book's title alone, on the first page. Nothing to write: switch it on or off.", hint: "", auto: true, standard: true },
  { kind: "title-page", group: "front", ask: "The title, subtitle and author as they should be printed, and the publisher if there is one.", hint: "", facts: "title", standard: true },
  { kind: "copyright", group: "front", ask: "The copyright facts. The standard rights wording is added for you; leave a field empty when you don't have it yet.", hint: "", facts: "copyright", standard: true },
  { kind: "dedication", group: "front", ask: "Who the book is dedicated to, in your own words. One to three short lines.", hint: "e.g. To my wife Ann, and to the church that taught me to read the scriptures." },
  { kind: "epigraph", group: "front", ask: "A short quotation that frames the book (a verse or a line from a known author), with its source.", hint: "e.g. Hear, O Israel: Yahuah our Elohim, Yahuah is one. Deuteronomy 6:4" },
  { kind: "foreword", group: "front", ask: "A foreword is written by someone else. Paste their text, with their name and role, when you have it.", hint: "Paste the foreword and the writer's name and role." },
  { kind: "preface", group: "front", ask: "Why you wrote this book, who it is for and how to read it: your own story of the book, not its argument (the Introduction does that).", hint: "e.g. I began this study after years of teaching… It is written for…", fromBook: true },
  { kind: "author-note", group: "front", ask: "Anything the reader should know before starting: the conventions you use (names, translations, spellings).", hint: "e.g. I use the names Yahuah and Yahusha throughout. Scripture is quoted from…", fromBook: true },
  { kind: "acknowledgments", group: "front", ask: "The people you want to thank and for what.", hint: "e.g. My thanks to Pastor … for reading every chapter, to …" },
  { kind: "contents", group: "front", ask: "Made from the book's headings with page numbers, and kept up to date. Nothing to write.", hint: "", auto: true, standard: true },
  { kind: "introduction", group: "front", ask: "What the book is about, the question it answers, and a short map of the chapters.", hint: "", fromBook: true, standard: true },
  { kind: "conclusion", group: "back", ask: "How the book's teaching comes together, and what you want the reader to take away.", hint: "", fromBook: true },
  { kind: "epilogue", group: "back", ask: "A short closing piece after the last chapter.", hint: "" },
  { kind: "afterword", group: "back", ask: "A reflection on the book after the fact.", hint: "" },
  { kind: "appendix", group: "back", ask: "Supporting material: tables, lists, extra notes, a study plan.", hint: "" },
  { kind: "discussion", group: "back", ask: "Questions for study groups, chapter by chapter.", hint: "", fromBook: true },
  { kind: "glossary", group: "back", ask: "The terms the book uses, each with its meaning as the book uses it.", hint: "e.g. Shema: the confession of Deuteronomy 6:4…", fromBook: true },
  { kind: "bibliography", group: "back", ask: "The works the book quotes or relies on.", hint: "", fromBook: true },
  { kind: "scripture-index", group: "back", ask: "Every scripture reference in the book (book, chapter and verse), with the pages it is printed on, made when the book is set. Nothing to write: switch it on or off. (An index you wrote yourself is kept as you wrote it.)", hint: "", auto: true },
  { kind: "about-author", group: "back", ask: "About you: your work, background and where readers can find you. Only what you write here is used.", hint: "e.g. Teacher of the scriptures for twenty years at…, lives in…", standard: true },
  { kind: "also-by", group: "back", ask: "Your other books, one per line.", hint: "" },
  { kind: "resources", group: "back", ask: "Where readers can go next: website, ministry, newsletter, contact.", hint: "" },
];

export const stepLabel = (kind: string) => (kind === "contents" ? "Contents" : kindDef(kind).label);

/** This page in the manuscript, when it has it. */
export const sectionFor = (m: Manuscript, kind: string): Section | undefined => m.sections.find((s) => s.kind === kind);

export type StepStatus = "done" | "off" | "to-do";
/** A fact the author gave: not empty, not a placeholder ("[Author name]"). */
export const given = (v: unknown) => { const t = typeof v === "string" || typeof v === "number" ? String(v).trim() : ""; return t && !/\[[^\]]*\]/.test(t) ? t : ""; };
/** Done: in the manuscript with text (or a page set automatically / from the details); off: turned off. */
export function stepStatus(m: Manuscript, step: MatterStep): StepStatus {
  if (step.kind === "contents") return "done";
  const s = sectionFor(m, step.kind);
  if (step.facts === "title") return given(m.title) && given(m.author) ? "done" : "to-do";
  if (step.facts === "copyright") return s?.omit ? "off" : given(m.meta?.copyrightHolder) || given(m.author) ? "done" : "to-do";
  if (!s) return "to-do";
  if (s.omit) return "off";
  return step.auto || s.body.trim() ? "done" : "to-do";
}

/** The question to Claude, the same on Claude Code and the API: the author's notes rewritten professionally. */
export function matterPrompt(o: { kind: string; label: string; notes: string; title: string; subtitle?: string; author?: string; rules?: string; guidance: string; fromBook: boolean; instructions?: string; words?: number }, where: { notes: string; book?: string }): string {
  const book = o.fromBook && where.book ? ` You may also read the book (${where.book}) to make the page fit it${o.notes.trim() ? "" : ", and, since the author wrote nothing, draft the page from what the book itself says"}.` : "";
  return `Write the ${o.label} of the book "${o.title}"${o.subtitle ? `: ${o.subtitle}` : ""}${o.author ? ` by ${o.author}` : ""}, ready to print.
The author's own words for it are in ${where.notes}. Rewrite them professionally, in the author's voice (first person where the author speaks as themselves), clear and well ordered.${book}
What this page is: ${o.guidance}${o.instructions?.trim() ? `\nThe author asks: ${o.instructions.trim()}` : ""}${o.words && o.words > 0 ? `\nLength: about ${Math.round(o.words)} words.` : ""}
Rules:
- Keep every fact the author gives, exactly. Add no facts of your own: no names, dates, places, credentials, endorsements, publishers or numbers the author didn't give. Where the page would need one, write [[YOURS: what is needed]] instead.
- Keep quotations and scripture word for word, with their sources.
- Follow the book's rules${o.rules?.trim() ? `: ${o.rules.trim()}` : ""}.
- No heading (the page title is set by the layout). Markdown paragraphs only; a list only where the page is a list.
Reply with the page's text only.`;
}

/** The book for Claude to read when a page may be drafted from it (the text of its chapters, in order). */
export function bookForMatter(m: Manuscript, max = 400_000): string {
  return m.sections.filter((s) => kindDef(s.kind).group === "body" || s.kind === "introduction").map((s) => `## ${s.title}\n\n${s.body}`).join("\n\n").slice(0, max);
}

/** A page's text, set as accepted: the page is added when the manuscript hasn't got it, switched on,
 *  and the text it had before is kept in its versions. */
export function setPage(m: Manuscript, kind: string, body: string, label = "Before front and back matter"): Manuscript {
  let next = m, sec = sectionFor(m, kind);
  if (!sec) { const r = insertSection(m, kind); next = r.manuscript; sec = next.sections.find((s) => s.id === r.id)!; }
  const id = sec.id;
  return { ...next, sections: next.sections.map((s) => (s.id !== id ? s : { ...(s.body.trim() && s.body.trim() !== body.trim() ? addVersion(s, "before-accept", label) : s), body: body.trim(), omit: false })) };
}
/** Includes a page in the book (adding it when missing) or leaves it out; its text is kept either way. */
export function setIncluded(m: Manuscript, kind: string, on: boolean): Manuscript {
  const sec = sectionFor(m, kind);
  if (!sec) return on ? insertSection(m, kind).manuscript : m;
  return { ...m, sections: m.sections.map((s) => (s.id === sec.id ? { ...s, omit: !on } : s)) };
}
/** The pages still to do, among those the book includes or conventionally has. */
export function matterProgress(m: Manuscript): { done: number; total: number } {
  const relevant = MATTER_STEPS.filter((st) => st.standard || sectionFor(m, st.kind) || st.facts);
  const st = relevant.map((x) => stepStatus(m, x)).filter((x) => x !== "off");
  return { done: st.filter((x) => x === "done").length, total: st.length };
}

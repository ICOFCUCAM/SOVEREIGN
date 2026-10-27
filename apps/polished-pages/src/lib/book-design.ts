// Rebuilding the author's material as a professional book (DESIGN-SPEC.md §17).
// Claude designs the book a publisher would make from the material (reader,
// parts, chapters, apparatus, what each section draws on, what is not placed),
// the owner reviews the design, and only then does it replace the manuscript's
// sections. The manuscript it replaces is kept and can be restored.
// DESIGN_RULES and BOOK_TYPES are word for word the runner's (src/prompts.mjs); a test keeps them identical.
import { importText, kindDef, newId, type Manuscript, type Section } from "@/lib/manuscript";

export const DESIGN_RULES = [
  "Design the book a professional publisher would make from this material, not a copy of the manuscript's order: decide who the reader is and the path the book takes them on, from foundations to application, and the parts and chapters that serve it. Merge material that is scattered, split chapters that do several jobs, move material to where the reader needs it, and remove repetition.",
  "Every teaching, argument, scripture, example and testimony in the author's material has a place in the new book: for each section say which parts of the material it draws on (their headings or page numbers). Anything left out goes under Not placed with the reason; nothing is lost silently.",
  "It stays the author's book: the author's teaching, convictions and level of certainty lead. Do not add claims, history, sources, statistics, people or testimony that are not in the material, except cited sources when the owner chose a book with cited sources.",
  "Professional apparatus follows the book type and the owner's instructions (front matter, chapter openings and closings, summaries, key terms, questions, glossary) and is built from the book's own content. Front matter describes only what the book contains.",
  "Chapters are written fresh, in professional prose, from the material they draw on: re-expressed, not copied. Quotations and scripture stay word for word apart from what the book's rules change; testimony stays clearly the author's testimony.",
  "One numbering scheme for the whole book: every number used once and in order; heading levels never skip.",
  "Gaps are reported, never filled: a promise the material cannot keep, or a section the design needs that the material does not support, goes under Missing for the author to supply.",
];

export type BookTypeId = "course" | "trade" | "academic" | "ministry" | "handbook" | "custom";
export const BOOK_TYPES: Record<BookTypeId, { label: string; apparatus: string }> = {
  course: { label: "Course textbook", apparatus: "Each chapter opens with learning outcomes drawn from its own content and a short overview, uses numbered sections, defines key terms where they first appear, and ends with a summary, the key terms and review questions. Front matter: an introduction that says how to use the book (a course schedule only if the author gave one). Back matter: a glossary, and a bibliography only of works the book cites." },
  trade: { label: "Non-fiction for general readers", apparatus: "Each chapter opens with a concrete hook from the author's material (a testimony, a scripture or a question; never \"In this chapter\"), develops one clear idea with transitions, and ends with its takeaways. An introduction that states the problem and maps the book; a conclusion that draws the threads together." },
  academic: { label: "Academic study", apparatus: "A measured register. Each chapter states its question, sets out the evidence (scripture and the sources the author cites) and the argument, and keeps interpretation distinct from the text it interprets. An introduction with scope and method, a conclusion, and a bibliography of the works cited." },
  ministry: { label: "Teaching and ministry book", apparatus: "Chapters move from scripture to explanation to application. Testimony is set apart and introduced as the author's testimony. Each chapter ends with reflection questions (and a prayer or response only where the author's material has one or the owner asks). An introduction, and a conclusion with the call to the reader." },
  handbook: { label: "Practical handbook", apparatus: "Short chapters built around tasks, with numbered steps and checklists made from the author's own instructions, a summary box per chapter, cross-references between chapters, and a quick-reference appendix." },
  custom: { label: "My instructions only", apparatus: "Follow the owner's instructions for the book's shape and apparatus." },
};

/** Where a rebuilt book's chapters come from. */
export type DesignApproach = "mine" | "mine-and-research";
export interface DesignBriefInput { bookType: BookTypeId; instructions: string; approach: DesignApproach }
export type BookDesignBrief = DesignBriefInput & { at: string };

export const DESIGN_KINDS = ["preface", "introduction", "part", "chapter", "conclusion", "appendix", "discussion", "glossary", "bibliography"] as const;
export interface DesignSection { kind: (typeof DESIGN_KINDS)[number]; title: string; summary: string; keyPoints: string[]; draws: string; apparatus: string }
export interface BookDesign {
  title: string; subtitle: string; reader: string; rationale: string;
  sections: DesignSection[];
  unplaced: { what: string; where: string; why: string }[];
  missing: string[];
}

/** The design brief as Claude is given it, the same text on both engines (runner: designBrief). */
export function designBrief(d: Partial<DesignBriefInput> | null | undefined): string {
  if (!d) return "";
  const t = BOOK_TYPES[d.bookType as BookTypeId] ?? BOOK_TYPES.custom;
  return [
    `Book type: ${t.label}. ${t.apparatus}`,
    d.instructions?.trim() ? `The owner's instructions for the whole book (follow them):\n${d.instructions.trim().slice(0, 8000)}` : "",
    `Standard:\n${DESIGN_RULES.map((l) => `- ${l}`).join("\n")}`,
  ].filter(Boolean).join("\n\n");
}

export const DESIGN_SHAPE = `{"title": "", "subtitle": "", "reader": "who the book is for", "rationale": "why this structure serves that reader, and the main changes from the manuscript's order", "sections": [{"kind": "introduction", "title": "", "summary": "2-3 sentences: what this section teaches", "keyPoints": [""], "draws": "which parts of the material it draws on (headings or page numbers)", "apparatus": "what it includes besides prose (learning outcomes, summary, questions…)"}], "unplaced": [{"what": "", "where": "", "why": ""}], "missing": [""]}`;

const str = (v: unknown, n = 4000) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/** Claude's design, checked: every section has a known kind and a title; at least one chapter. */
export function parseDesign(raw: string): BookDesign {
  let j: Record<string, unknown>;
  try {
    const t = raw.trim().replace(/^```(?:json)?\s*|\s*```\s*$/g, "");
    j = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)) as Record<string, unknown>;
  } catch { throw new Error("Claude's design wasn't valid. Try again."); }
  const sections = (Array.isArray(j.sections) ? j.sections : []).map((x) => {
    const s = (x ?? {}) as Record<string, unknown>;
    const kind = (DESIGN_KINDS as readonly string[]).includes(String(s.kind)) ? (s.kind as DesignSection["kind"]) : "chapter";
    return { kind, title: str(s.title, 300), summary: str(s.summary), keyPoints: (Array.isArray(s.keyPoints) ? s.keyPoints : []).map((k) => str(k, 500)).filter(Boolean), draws: str(s.draws), apparatus: str(s.apparatus) };
  }).filter((s) => s.title);
  if (!sections.some((s) => s.kind === "chapter")) throw new Error("Claude's design has no chapters. Try again.");
  return {
    title: str(j.title, 300), subtitle: str(j.subtitle, 300), reader: str(j.reader), rationale: str(j.rationale, 8000), sections,
    unplaced: (Array.isArray(j.unplaced) ? j.unplaced : []).map((x) => { const u = (x ?? {}) as Record<string, unknown>; return { what: str(u.what, 1000), where: str(u.where, 300), why: str(u.why, 1000) }; }).filter((u) => u.what),
    missing: (Array.isArray(j.missing) ? j.missing : []).map((x) => str(x, 1000)).filter(Boolean),
  };
}

/** What Claude follows when it writes a designed section: its plan and the parts of the material it draws on. */
export function sectionPlan(s: DesignSection): string {
  return [
    s.summary,
    s.keyPoints.length ? `Key points: ${s.keyPoints.join("; ")}` : "",
    s.draws ? `Draws on: ${s.draws}` : "",
    s.apparatus ? `Includes: ${s.apparatus}` : "",
  ].filter(Boolean).join("\n");
}

/**
 * The manuscript laid out to the design: its sections replaced by the designed
 * ones (empty, each with its plan), the book's rules, knowledge and production
 * details kept, and the sections it replaces kept in the archive to restore.
 */
export function designToManuscript(d: BookDesign, m: Manuscript, brief: DesignBriefInput, at = new Date().toISOString()): Manuscript {
  const sections: Section[] = d.sections.map((s) => ({ id: newId(), kind: kindDef(s.kind).kind, title: s.title, body: "", idea: sectionPlan(s) }));
  const archive = m.sections.length ? [...(m.archive ?? []), { at, label: "Before the rebuild", sections: m.sections.map(({ id, kind, title, body, idea }) => ({ id, kind, title, body, ...(idea ? { idea } : {}) })) }].slice(-5) : m.archive;
  return { ...m, title: m.title.trim() || d.title, subtitle: m.subtitle?.trim() || d.subtitle || undefined, sections, design: { ...brief, at }, ...(archive ? { archive } : {}) };
}

/** The manuscript as it was before a rebuild; the rebuilt sections go into the archive in turn, so nothing is lost. */
export function restoreArchived(m: Manuscript, index: number, at = new Date().toISOString()): Manuscript {
  const a = m.archive?.[index];
  if (!a) return m;
  const rest = (m.archive ?? []).filter((_, i) => i !== index);
  const archive = [...rest, { at, label: "The rebuilt book, before you restored the earlier one", sections: m.sections.map(({ id, kind, title, body, idea }) => ({ id, kind, title, body, ...(idea ? { idea } : {}) })) }].slice(-5);
  const { design: _design, ...without } = m;
  return { ...without, sections: a.sections.map((s) => ({ ...s })), archive };
}

/** Sections to write after a rebuild, in a sensible order: chapters first (the rest summarise them), part dividers last. */
export function sectionsToWrite(m: Manuscript): string[] {
  const empty = m.sections.filter((s) => !s.body.trim() && (s.kind === "chapter" || (m.design && s.idea?.trim())));
  const rank = (s: Section) => (s.kind === "chapter" ? 0 : s.kind === "part" ? 2 : 1);
  return [...empty].sort((a, b) => rank(a) - rank(b)).map((s) => s.id);
}

/**
 * A whole-book result (a rewrite, a corrected or proofread book…) as the book's
 * manuscript: its "## " sections replace the manuscript's, so the cover, design,
 * production and every Finish tool work on it. The sections it replaces are kept
 * in the archive to restore; the book's rules, knowledge and details are kept.
 */
export function resultToManuscript(text: string, m: Manuscript, label: string, at = new Date().toISOString()): Manuscript {
  const imported = importText(m.title, text);
  if (!imported.sections.length) throw new Error("This result has no sections to use.");
  const archive = m.sections.length ? [...(m.archive ?? []), { at, label: `Before “${label}” became the manuscript`, sections: m.sections.map(({ id, kind, title, body, idea }) => ({ id, kind, title, body, ...(idea ? { idea } : {}) })) }].slice(-5) : m.archive;
  const { design: _design, ...rest } = m;
  return { ...rest, title: m.title.trim() || imported.title, sections: imported.sections, ...(archive ? { archive } : {}) };
}

import { readDraft } from "@/hooks/use-draft-autosave";
import { kindDef, newId, type Manuscript, type Section } from "@/lib/manuscript";
import type { BookChapter, BookOutline } from "@/types/book";

// Claude Studio keeps one book per project: the manuscript. These bring work
// from the older Book wizard (a separate draft per project) and Claude's
// outlines into it, so nothing written there is lost.

/** The chapter plan from an outline or wizard chapter, as the section's idea. */
function planOf(c: { summary?: string; notes?: string; keyPoints?: string[]; hook?: string }): string {
  return [
    c.summary?.trim(),
    c.keyPoints?.filter((k) => k.trim()).length ? `Key points: ${c.keyPoints.filter((k) => k.trim()).join("; ")}` : "",
    c.hook?.trim() ? `Opening hook: ${c.hook.trim()}` : "",
    c.notes?.trim() ? `My notes: ${c.notes.trim()}` : "",
  ].filter(Boolean).join("\n");
}
const norm = (t: string) => t.toLowerCase().replace(/^(chapter\s+\d+[:.\s-]*)/, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
// A chapter's text without the "## Title" line the wizard starts it with.
const bodyOf = (content: string | undefined, title: string) => (content ?? "").replace(/\r\n?/g, "\n").replace(new RegExp(`^\\s*##\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n+`), "").trim();

/**
 * Lays out an outline as chapters. Chapters already in the manuscript (matched
 * by title) keep their text and gain the plan if they had none; new ones are
 * added in the outline's order; front and back matter stay where they are.
 */
export function outlineToManuscript(o: BookOutline, base?: Manuscript | null): Manuscript {
  const m: Manuscript = base ?? { title: "", sections: [], history: [] };
  const front = m.sections.filter((s) => kindDef(s.kind).group === "front");
  const back = m.sections.filter((s) => kindDef(s.kind).group === "back");
  const body = m.sections.filter((s) => kindDef(s.kind).group === "body");
  const used = new Set<string>();
  const chapters: Section[] = o.chapters.map((c) => {
    const hit = body.find((s) => !used.has(s.id) && norm(s.title) === norm(c.title));
    if (hit) { used.add(hit.id); return { ...hit, idea: hit.idea?.trim() ? hit.idea : planOf(c) }; }
    return { id: newId(), kind: "chapter", title: c.title, body: "", idea: planOf(c) };
  });
  return {
    ...m,
    title: m.title.trim() || o.title,
    subtitle: m.subtitle?.trim() || o.subtitle || undefined,
    sections: [...front, ...chapters, ...body.filter((s) => !used.has(s.id)), ...back],
  };
}

interface WizardDraft {
  bookTitle?: string; outline?: BookOutline | null; chapters?: BookChapter[];
  knowledge?: { rules: string; terminology: string; forbidden: string }; knowledgeDocIds?: string[];
  meta?: Record<string, unknown> & { author?: string; subtitle?: string };
}

/** The Book wizard's draft for a Studio project, if this browser has one with any chapters. */
export function readWizardDraft(threadId: string): WizardDraft | null {
  const d = readDraft<WizardDraft>(`studio.book.${threadId}`)?.data;
  return d?.chapters?.some((c) => c.title?.trim()) ? d : null;
}

/** A wizard draft as a manuscript: its chapters, their written text and plans, knowledge and production details. */
export function wizardDraftToManuscript(d: WizardDraft, base?: Manuscript | null): Manuscript {
  const outline: BookOutline = {
    ...(d.outline ?? ({} as BookOutline)),
    title: d.outline?.title || d.bookTitle || "",
    chapters: (d.chapters ?? []).filter((c) => c.title?.trim()).map((c) => ({ title: c.title, summary: planOf(c), keyPoints: [], hook: "" })),
  };
  const m = outlineToManuscript(outline, base);
  const written = new Map((d.chapters ?? []).filter((c) => c.content?.trim()).map((c) => [norm(c.title), bodyOf(c.content, c.title)]));
  return {
    ...m,
    subtitle: m.subtitle || d.meta?.subtitle || d.outline?.subtitle || undefined,
    author: m.author || d.meta?.author || undefined,
    sections: m.sections.map((s) => (s.kind === "chapter" && !s.body.trim() && written.has(norm(s.title)) ? { ...s, body: written.get(norm(s.title))! } : s)),
    knowledge: m.knowledge ?? d.knowledge,
    knowledgeDocIds: m.knowledgeDocIds ?? d.knowledgeDocIds,
    meta: m.meta ?? d.meta,
  };
}

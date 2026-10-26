import { authHeader } from "@/lib/session";
import type { RuleSet } from "@/lib/knowledge";
import type { BookDepth, BookMode, BookOutline, ImprovementType } from "@/types/book";

// The Book Creator's three AI steps behind one interface, so the same wizard can
// be driven by the site's generation service (the default, metered per user) or
// by the owner's own Claude Code in Claude Studio.
export interface OutlineInput { bookTitle: string; genre: string; targetAudience: string; depth: BookDepth; mode: BookMode; existingContent: string; knowledge: RuleSet | null }
export interface ChapterInput {
  bookTitle: string; genre: string; targetAudience: string; depth: BookDepth;
  chapters: { title: string; summary?: string; notes?: string; keyPoints?: string[]; hook?: string }[];
  chapterIndex: number; previousChapters: string[]; knowledge: RuleSet | null;
}
export interface ImproveInput { content: string; improvementType: ImprovementType; bookContext: string; chapterIndex: number }

export interface BookEngine {
  /** Shown in the wizard so it's always clear what is writing the book. */
  label?: string;
  outline(input: OutlineInput): Promise<BookOutline>;
  chapter(input: ChapterInput): Promise<string>;
  improve(input: ImproveInput): Promise<string>;
}

async function post<T>(fn: string, body: unknown, fallback: string): Promise<T> {
  const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await authHeader() },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || fallback);
  }
  return r.json() as Promise<T>;
}

export const apiBookEngine: BookEngine = {
  outline: async (i) =>
    (await post<{ outline: BookOutline }>("generate-book-outline", { ...i, knowledge: i.knowledge ?? undefined }, "Outline generation failed")).outline,
  chapter: async ({ chapterIndex, chapters, knowledge, ...rest }) =>
    (await post<{ chapter: string }>("generate-book-chapter", { ...rest, chapters, chapterIndex, knowledge: knowledge ?? undefined }, "Generation failed")).chapter,
  improve: async ({ content, improvementType, bookContext }) =>
    (await post<{ content: string }>("improve-book-content", { content, improvementType, bookContext }, "Improvement failed")).content,
};

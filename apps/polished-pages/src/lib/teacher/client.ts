// The author's side of the AI Teacher (BLUEPRINT.md build steps 1–3): prepare
// the book, show what will be indexed, index it on confirmation, and ask it
// questions through the Teacher Runtime. All access is decided server-side by
// the owner-checked RPCs and edge functions; nothing here is trusted by them.
import { supabase } from "@/integrations/supabase/client";
import { kindDef, type Manuscript } from "@/lib/manuscript";
import { authorPreview, chunkBook, type SourceVersion } from "@/lib/teacher/pipeline";
import { parseBookRules, type CourseRule } from "../../../supabase/functions/_shared/teacher-core";

export { parseBookRules };
export type { CourseRule };

type Rpc = { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> };
const rpc = () => supabase as unknown as Rpc;
async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

/** The book as the tutor reads it: its title, then every section with text, in publishing order (no title page or contents list). */
export function teacherMarkdown(m: Manuscript): string {
  const order = { front: 0, body: 1, back: 2 } as const;
  const skip = new Set(["title-page", "copyright", "dedication", "epigraph"]);
  const sections = [...m.sections].filter((s) => !skip.has(s.kind) && s.body.trim()).sort((a, b) => order[kindDef(a.kind).group] - order[kindDef(b.kind).group]);
  // Front and back matter are unnumbered ({-}); chapters are numbered.
  return [`# ${m.title || "Untitled book"}`, ...sections.map((s) => `## ${s.title || kindDef(s.kind).label}${s.kind === "chapter" ? "" : " {-}"}\n\n${s.body.trim()}`)].join("\n\n") + "\n";
}

export async function prepare(m: Manuscript, libraryId: string): Promise<{ version: SourceVersion; preview: ReturnType<typeof authorPreview> }> {
  const version = await chunkBook(teacherMarkdown(m), { id: libraryId });
  return { version, preview: authorPreview(version) };
}

export interface IndexProgress { step: "saving" | "approving" | "course" | "embedding" | "done"; embedded?: number; remaining?: number; note?: string }

/**
 * Indexes the confirmed version: saves it with its passages, approves it as the
 * version the tutor teaches from, makes (or reuses) the author-mode course with
 * the book's rules as structured records, then writes embeddings on the server.
 */
export async function indexBook(opts: { libraryId: string; title: string; rules: string; version: SourceVersion; onProgress: (p: IndexProgress) => void }): Promise<{ courseId: string; versionId: string; embeddingsReady: boolean; note?: string }> {
  const { libraryId, title, rules, version, onProgress } = opts;
  onProgress({ step: "saving" });
  const preview = authorPreview(version);
  const versionId = await call<string>("polished_teacher_save_version", { p_doc_id: libraryId, p_content_hash: version.contentHash, p_structure: { ...preview, chunks: version.chunks.length }, p_chunks: version.chunks });
  onProgress({ step: "approving" });
  await call("polished_teacher_approve_version", { p_version_id: versionId });
  onProgress({ step: "course" });
  const courseId = await call<string>("polished_teacher_ensure_course", { p_doc_id: libraryId, p_title: title });
  await call("polished_teacher_set_course_rules", { p_course_id: courseId, p_rules: parseBookRules(rules) });
  // Embeddings in batches; the keyword search works without them.
  for (let round = 0; round < 50; round++) {
    const { data, error } = await supabase.functions.invoke("teacher-index", { body: { versionId } });
    if (error) {
      const why = await errorMessage(error);
      onProgress({ step: "done", note: why });
      return { courseId, versionId, embeddingsReady: false, note: why };
    }
    const r = data as { embedded: number; remaining: number; skipped?: string };
    if (r.skipped) { onProgress({ step: "done", note: r.skipped }); return { courseId, versionId, embeddingsReady: false, note: r.skipped }; }
    onProgress({ step: "embedding", embedded: r.embedded, remaining: r.remaining });
    if (!r.remaining) break;
  }
  onProgress({ step: "done" });
  return { courseId, versionId, embeddingsReady: true };
}

export const courseFor = (libraryId: string) => call<string | null>("polished_teacher_course_for_document", { p_doc_id: libraryId });
export interface CourseSourceInfo { title: string; author: string | null; role: string; version_id: string | null; embedded: number; passages: number }
export const courseContext = (courseId: string) => call<{ id: string; title: string; rules: CourseRule[]; sources: CourseSourceInfo[] } | null>("polished_teacher_course_context", { p_course_id: courseId });

/** How a course's tutor may answer (BLUEPRINT.md §12): from the book only unless the owner turns AI on, within caps. */
export interface TeacherSettings { ai_answers: boolean; vector_search: boolean; monthly_request_cap: number; monthly_token_cap: number; per_minute: number; per_day: number }
export interface UsageSummary {
  settings: TeacherSettings; requests: number; by_path: Record<string, number>;
  model_calls: { provider: string; model: string; task: string; calls: number; tokens_in: number; tokens_out: number }[];
}
export const usageSummary = (courseId: string) => call<UsageSummary | null>("polished_teacher_usage_summary", { p_course_id: courseId });
export const saveSettings = (courseId: string, settings: Partial<TeacherSettings>) => call<TeacherSettings>("polished_teacher_set_course_settings", { p_course_id: courseId, p_settings: settings });

export interface TeacherAnswer {
  status: "answered" | "partially_covered" | "not_covered" | "out_of_scope" | "pastoral" | "evidence";
  /** "book": the book's own passages, no model; "model": an AI explanation that passed the checks. */
  answered_by?: "book" | "model";
  /** Why a book-only answer was given when AI explanations were expected (not set up, paused). */
  notice?: string | null;
  passages?: { evidence_id: string; source_title: string; source_location: string; chapter_id: string; text: string }[];
  answer: string;
  claims: { text: string; evidence: { evidence_id: string; source_title: string; source_location: string }[] }[];
  citations: { evidence_id: string; quote: string; source_title: string; source_location: string }[];
  limitations: string[];
  check_question: string | null;
  evidence?: { evidence_id: string; source_title: string; source_location: string; text: string }[];
  retrieval: { candidates: number; evidence: number; vector: boolean };
  /** The subject gate and sufficiency check (BLUEPRINT.md §12b): how many of the question's words the course and the evidence contain. */
  scope?: { verdict: "out_of_scope" | "insufficient" | "sufficient"; terms: number; in_course: number; in_evidence: number; best_passage: number };
  validation: { ok: boolean; repaired: boolean; citations_verified?: number };
  usage?: { model: string; tokens_in: number; tokens_out: number };
  request_id: string;
}

/** Asks the book through the Teacher Runtime; failures come back with the server's reason. */
export async function ask(opts: { courseId: string; question: string; level?: "curious" | "student" | "leader"; mode?: "ask" | "explain" | "guided"; chapterId?: string | null }): Promise<TeacherAnswer> {
  const { data, error } = await supabase.functions.invoke("teacher-runtime", { body: opts });
  if (error) throw new Error(await errorMessage(error));
  return data as TeacherAnswer;
}

async function errorMessage(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.json === "function") {
    try { const j = await ctx.clone().json(); if (j?.error) return String(j.error); } catch { /* not JSON */ }
  }
  return error instanceof Error ? error.message : "The request failed.";
}

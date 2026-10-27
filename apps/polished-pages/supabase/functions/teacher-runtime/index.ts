import { consumeOrThrow, getUserId, EntitlementError } from "../_shared/entitlements.ts";
import { HttpError, askClaude, corsHeaders, embed, embeddingsConfigured, json, rpcAsCaller } from "../_shared/teacher-http.ts";
import { parseAnswer, selectEvidence, systemPrompt, userPrompt, validateAnswer, type CourseRule, type Evidence, type LearnerLevel, type TeachMode } from "../_shared/teacher-core.ts";

// The Teacher Runtime (BLUEPRINT.md §5a, §11b; build step 3). It owns the whole
// request: the caller's token decides which course they may use (the database
// checks it), rules and sources are loaded here (never taken from the browser),
// evidence is retrieved and selected, the model answers through the server-side
// API, and the answer is validated before anything is returned: evidence IDs
// must be ones supplied, quotations must match the stored text, generated prose
// must follow the book's terminology. One repair attempt; otherwise a safe error.
// The owner-only Claude Code runner is never used here.

interface Row {
  version_id: string; chunk_id: string; chapter_id: string; chapter_number: number | null; heading_path: string[]; char_start: number; char_end: number;
  chunk_text: string; source_location: string; source_title: string; source_role: string; score: number;
}
interface CourseContext { id: string; title: string; mode: string; rules: CourseRule[]; sources: { title: string; author: string | null; embedded: number; passages: number }[] }

const LEVELS = new Set(["curious", "student", "leader"]);
const MODES = new Set(["ask", "explain", "guided"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const requestId = crypto.randomUUID();
  const started = Date.now();
  try {
    const userId = getUserId(req);
    const body = await req.json().catch(() => ({}));
    const courseId = String(body?.courseId ?? "");
    const question = String(body?.question ?? "").trim().slice(0, 2000);
    const level = (LEVELS.has(body?.level) ? body.level : "student") as LearnerLevel;
    const mode = (MODES.has(body?.mode) ? body.mode : "ask") as TeachMode;
    const chapterId = typeof body?.chapterId === "string" && body.chapterId ? String(body.chapterId).slice(0, 120) : null;
    if (!/^[0-9a-f-]{36}$/i.test(courseId)) return json({ error: "Missing course id.", request_id: requestId }, 400);
    if (question.length < 2) return json({ error: "Ask a question about the book.", request_id: requestId }, 400);

    // 1. Course, rules and sources, as the database allows this caller to see them.
    const ctx = await rpcAsCaller<CourseContext | null>(req, "polished_teacher_course_context", { p_course_id: courseId });
    if (!ctx) return json({ error: "Course not found.", request_id: requestId }, 404);
    const rules = Array.isArray(ctx.rules) ? ctx.rules : [];

    // 2. Evidence: hybrid retrieval scoped to the course's permitted, approved sources.
    const vector = embeddingsConfigured() && ctx.sources.some((s) => s.embedded > 0) ? JSON.stringify((await embed([question]))[0]) : null;
    const rows = await rpcAsCaller<Row[]>(req, "polished_teacher_retrieve", { p_course_id: courseId, p_query: question, p_embedding: vector, p_limit: 30, p_chapter: chapterId });
    const evidence: Evidence[] = selectEvidence(rows).map((r, i) => ({ handle: `E${i + 1}`, chunk_id: r.chunk_id, version_id: r.version_id, text: r.chunk_text, source_title: r.source_title, source_location: r.source_location,
      chapter_id: r.chapter_id, chapter_number: r.chapter_number, heading_path: r.heading_path, char_start: r.char_start, char_end: r.char_end, source_role: r.source_role }));
    const meta = { request_id: requestId, retrieval: { candidates: rows.length, evidence: evidence.length, vector: Boolean(vector) } };
    if (!evidence.length) {
      // Nothing in the permitted sources matches: say so without calling the model (and without charging).
      return json({ status: "not_covered", answer: "The book material available to this course does not address that question. Try naming a chapter, a term or a passage.", claims: [], citations: [], limitations: [], check_question: null, ...meta, validation: { ok: true, repaired: false } });
    }

    // 3. Generate (metered), validate, repair once.
    await consumeOrThrow(userId, "text");
    const system = systemPrompt({ courseTitle: ctx.title, sources: ctx.sources, rules, level, mode });
    const user = userPrompt(evidence, question);
    const first = await askClaude(system, user);
    let raw = first.text; let model = first.model; let tokensIn = first.tokensIn; let tokensOut = first.tokensOut;
    let v = validateAnswer(parseAnswer(raw), evidence, rules);
    let repaired = false;
    if (!v.ok) {
      repaired = true;
      const second = await askClaude(system, `${user}\n\nYOUR PREVIOUS REPLY:\n${raw.slice(0, 6000)}\n\nIt cannot be shown because:\n${v.problems.map((p) => `- ${p}`).join("\n")}\nReply again with corrected JSON only. Cite only E1–E${evidence.length}; copy quotations exactly; follow the terminology rules in your own words.`);
      raw = second.text; model = second.model; tokensIn += second.tokensIn; tokensOut += second.tokensOut;
      v = validateAnswer(parseAnswer(raw), evidence, rules);
    }
    // Usage and evaluation metadata, without the question or answer text (privacy-aware logging).
    console.log(JSON.stringify({ fn: "teacher-runtime", request_id: requestId, course: courseId, model, tokens_in: tokensIn, tokens_out: tokensOut, status: v.status, ok: v.ok, repaired, problems: v.problems.length, evidence: evidence.length, ms: Date.now() - started }));
    const usage = { model, tokens_in: tokensIn, tokens_out: tokensOut };
    if (!v.ok) {
      return json({ error: "The tutor could not produce an answer it could verify against the book. Please rephrase the question or name the chapter.", ...meta, usage, validation: { ok: false, repaired, problems: v.problems } }, 422);
    }
    return json({ status: v.status, answer: v.answer, claims: v.claims, citations: v.citations, limitations: v.limitations, check_question: v.check_question, ...meta,
      evidence: evidence.map((e) => ({ evidence_id: e.chunk_id, source_title: e.source_title, source_location: e.source_location, chapter_id: e.chapter_id, text: e.text })),
      usage, validation: { ok: true, repaired, citations_verified: v.citations.length } });
  } catch (e) {
    console.error("teacher-runtime error:", requestId, e instanceof Error ? e.message : e);
    const status = e instanceof EntitlementError || e instanceof HttpError ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "Unknown error", request_id: requestId }, status);
  }
});

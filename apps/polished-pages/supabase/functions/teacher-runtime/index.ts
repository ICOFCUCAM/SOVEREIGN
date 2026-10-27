import { consumeOrThrow, getUserId, EntitlementError } from "../_shared/entitlements.ts";
import { HttpError, anthropicConfigured, askClaude, corsHeaders, embedWithUsage, embeddingsConfigured, json, rpcAsCaller } from "../_shared/teacher-http.ts";
import { decidePath, evidenceAnswer, parseAnswer, selectEvidence, systemPrompt, userPrompt, validateAnswer, type CourseRule, type Evidence, type LearnerLevel, type TeachMode } from "../_shared/teacher-core.ts";

// The Teacher Runtime (BLUEPRINT.md §5a, §11b, §12). Knowledge first: every
// question is answered from the book's own passages unless the course owner has
// turned AI explanations on, a provider is configured and the course's monthly
// cap allows it. The caller's token decides which course they may use (the
// database checks it); rules, sources and settings are loaded here, never taken
// from the browser. Every request is rate-limited and recorded (path, model,
// tokens, timing, outcome; never the question or answer text). Model answers
// are validated before they are shown. There is no hidden fallback to another
// provider, and the owner-only Claude Code runner is never used here.

interface Row {
  version_id: string; chunk_id: string; chapter_id: string; chapter_number: number | null; heading_path: string[]; char_start: number; char_end: number;
  chunk_text: string; source_location: string; source_title: string; source_role: string; score: number;
}
interface CourseContext { id: string; title: string; mode: string; rules: CourseRule[]; sources: { title: string; author: string | null; embedded: number; passages: number }[] }
interface Settings { ai_answers: boolean; vector_search: boolean; monthly_request_cap: number; monthly_token_cap: number; per_minute: number; per_day: number }
interface Guard { allowed: boolean; reason?: string; settings?: Settings; model_allowed?: boolean }

const LEVELS = new Set(["curious", "student", "leader"]);
const MODES = new Set(["ask", "explain", "guided"]);
const MAX_QUESTION = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const requestId = crypto.randomUUID();
  const started = Date.now();
  let courseId = "";
  // One usage row per request and per model call; recording never blocks an answer.
  const record = async (kind: "request" | "model", task: string, extra: { path?: string; provider?: string; model?: string; tokensIn?: number; tokensOut?: number; attempts?: number; ms?: number; status?: string }) => {
    try {
      await rpcAsCaller(req, "polished_teacher_record_usage", { p_course_id: courseId, p_request_id: requestId, p_kind: kind, p_task: task, p_path: extra.path ?? null, p_provider: extra.provider ?? null,
        p_model: extra.model ?? null, p_tokens_in: extra.tokensIn ?? 0, p_tokens_out: extra.tokensOut ?? 0, p_attempts: extra.attempts ?? 1, p_ms: extra.ms ?? null, p_status: extra.status ?? "ok" });
    } catch (e) { console.error("usage record failed", requestId, e instanceof Error ? e.message : e); }
  };
  try {
    const userId = getUserId(req);
    const body = await req.json().catch(() => ({}));
    courseId = String(body?.courseId ?? "");
    const question = String(body?.question ?? "").trim();
    const level = (LEVELS.has(body?.level) ? body.level : "student") as LearnerLevel;
    const mode = (MODES.has(body?.mode) ? body.mode : "ask") as TeachMode;
    const chapterId = typeof body?.chapterId === "string" && body.chapterId ? String(body.chapterId).slice(0, 120) : null;
    if (!/^[0-9a-f-]{36}$/i.test(courseId)) return json({ error: "Missing course id.", request_id: requestId }, 400);
    if (question.length < 2) return json({ error: "Ask a question about the book.", request_id: requestId }, 400);
    if (question.length > MAX_QUESTION) return json({ error: `Please keep questions under ${MAX_QUESTION} characters.`, request_id: requestId }, 400);

    // 1. Permission, rate limits and this course's settings, before any work.
    const guard = await rpcAsCaller<Guard>(req, "polished_teacher_guard", { p_course_id: courseId });
    if (!guard.allowed || !guard.settings) return json({ error: guard.reason ?? "Not allowed.", request_id: requestId }, guard.reason === "Course not found." ? 404 : 429);
    const settings = guard.settings;
    const ctx = await rpcAsCaller<CourseContext | null>(req, "polished_teacher_course_context", { p_course_id: courseId });
    if (!ctx) return json({ error: "Course not found.", request_id: requestId }, 404);
    const rules = Array.isArray(ctx.rules) ? ctx.rules : [];

    // 2. Evidence. Meaning search (a paid OpenAI call per question) only when the course has chosen it.
    let vector: string | null = null;
    if (settings.vector_search && embeddingsConfigured() && ctx.sources.some((s) => s.embedded > 0)) {
      const e = await embedWithUsage([question]);
      vector = JSON.stringify(e.vectors[0]);
      await record("model", "embed_question", { provider: "openai", model: e.model, tokensIn: e.tokens, ms: e.ms });
    }
    const rows = await rpcAsCaller<Row[]>(req, "polished_teacher_retrieve", { p_course_id: courseId, p_query: question, p_embedding: vector, p_limit: 30, p_chapter: chapterId });
    const evidence: Evidence[] = selectEvidence(rows).map((r, i) => ({ handle: `E${i + 1}`, chunk_id: r.chunk_id, version_id: r.version_id, text: r.chunk_text, source_title: r.source_title, source_location: r.source_location,
      chapter_id: r.chapter_id, chapter_number: r.chapter_number, heading_path: r.heading_path, char_start: r.char_start, char_end: r.char_end, source_role: r.source_role }));
    const meta = { request_id: requestId, retrieval: { candidates: rows.length, evidence: evidence.length, vector: Boolean(vector) } };

    // 3. Knowledge first: decide whether a model may be used at all.
    const decision = decidePath({ evidence: evidence.length, aiAnswers: settings.ai_answers, modelAllowed: Boolean(guard.model_allowed), providerConfigured: anthropicConfigured() });
    if (decision.path === "not_covered") {
      await record("request", "ask", { path: "not_covered", ms: Date.now() - started });
      return json({ status: "not_covered", answer: "The book material available to this course does not address that question. Try naming a chapter, a term or a passage.", claims: [], citations: [], limitations: [], check_question: null, passages: [], ...meta, answered_by: "book", validation: { ok: true, repaired: false } });
    }
    if (decision.path === "evidence_only") {
      const a = evidenceAnswer(evidence);
      await record("request", "ask", { path: "evidence_only", status: decision.reason, ms: Date.now() - started });
      return json({ ...a, claims: [], citations: [], limitations: [], check_question: null, notice: decision.notice, ...meta, answered_by: "book", validation: { ok: true, repaired: false } });
    }

    // 4. AI explanation (allowed, configured, within the cap): metered, validated, repaired at most once.
    await consumeOrThrow(userId, "text");
    const system = systemPrompt({ courseTitle: ctx.title, sources: ctx.sources, rules, level, mode });
    const user = userPrompt(evidence, question);
    const first = await askClaude(system, user);
    await record("model", "answer", { provider: "anthropic", model: first.model, tokensIn: first.tokensIn, tokensOut: first.tokensOut, attempts: first.attempts, ms: first.ms });
    let raw = first.text; const model = first.model; let tokensIn = first.tokensIn; let tokensOut = first.tokensOut;
    let v = validateAnswer(parseAnswer(raw), evidence, rules);
    let repaired = false;
    if (!v.ok) {
      repaired = true;
      const second = await askClaude(system, `${user}\n\nYOUR PREVIOUS REPLY:\n${raw.slice(0, 6000)}\n\nIt cannot be shown because:\n${v.problems.map((p) => `- ${p}`).join("\n")}\nReply again with corrected JSON only. Cite only E1–E${evidence.length}; copy quotations exactly; follow the terminology rules in your own words.`);
      await record("model", "answer_repair", { provider: "anthropic", model: second.model, tokensIn: second.tokensIn, tokensOut: second.tokensOut, attempts: second.attempts, ms: second.ms });
      raw = second.text; tokensIn += second.tokensIn; tokensOut += second.tokensOut;
      v = validateAnswer(parseAnswer(raw), evidence, rules);
    }
    await record("request", "ask", { path: "model", status: v.ok ? "ok" : "unverified", ms: Date.now() - started });
    const usage = { model, tokens_in: tokensIn, tokens_out: tokensOut };
    if (!v.ok) {
      // Never show an answer that failed the checks; the book's passages are still useful.
      const a = evidenceAnswer(evidence);
      return json({ ...a, claims: [], citations: [], limitations: [], check_question: null, notice: "The tutor could not produce an explanation it could verify against the book, so here is what the book itself says.", ...meta, usage, answered_by: "book", validation: { ok: false, repaired, problems: v.problems } });
    }
    return json({ status: v.status, answer: v.answer, claims: v.claims, citations: v.citations, limitations: v.limitations, check_question: v.check_question, ...meta,
      evidence: evidence.map((e) => ({ evidence_id: e.chunk_id, source_title: e.source_title, source_location: e.source_location, chapter_id: e.chapter_id, text: e.text })),
      usage, answered_by: "model", validation: { ok: true, repaired, citations_verified: v.citations.length } });
  } catch (e) {
    console.error("teacher-runtime error:", requestId, e instanceof Error ? e.message : e);
    const status = e instanceof EntitlementError || e instanceof HttpError ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "Unknown error", request_id: requestId }, status);
  }
});

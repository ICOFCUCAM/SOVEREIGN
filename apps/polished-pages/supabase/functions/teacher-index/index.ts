import { HttpError, callerId, corsHeaders, embedWithUsage, json, rpcAsCaller } from "../_shared/teacher-http.ts";

// AI Teacher indexing (BLUEPRINT.md §2a, build step 1): writes embeddings for the
// passages of a version the caller owns. Runs in batches within a time budget and
// reports what remains, so the author's screen calls it until nothing is left.
// Indexing grants no access: a course decides who may use a version. Vectors
// (a paid OpenAI call) are made only for a version a course has chosen meaning
// search for (off by default, BLUEPRINT.md §12); every batch is recorded.
const BATCH = 96;
const BUDGET_MS = 40_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const started = Date.now();
  try {
    callerId(req);
    const body = await req.json().catch(() => ({}));
    const versionId = String(body?.versionId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(versionId)) return json({ error: "Missing version id." }, 400);
    const gate = await rpcAsCaller<{ enabled: boolean; course_id: string | null }>(req, "polished_teacher_version_vectors_enabled", { p_version_id: versionId });
    if (!gate.enabled) return json({ embedded: 0, remaining: 0, skipped: "Meaning search is off for this course, so no vectors were made. Keyword search works without them." });
    let embedded = 0;
    while (Date.now() - started < BUDGET_MS) {
      const todo = await rpcAsCaller<{ chunk_id: string; chunk_text: string }[]>(req, "polished_teacher_chunks_to_embed", { p_version_id: versionId, p_limit: BATCH });
      if (!todo.length) return json({ embedded, remaining: 0 });
      const e = await embedWithUsage(todo.map((t) => t.chunk_text.slice(0, 24_000)));
      embedded += await rpcAsCaller<number>(req, "polished_teacher_set_embeddings", { p_version_id: versionId, p_items: todo.map((t, i) => ({ id: t.chunk_id, embedding: e.vectors[i] })) });
      if (gate.course_id) await rpcAsCaller(req, "polished_teacher_record_usage", { p_course_id: gate.course_id, p_request_id: crypto.randomUUID(), p_kind: "model", p_task: "embed_index", p_path: null, p_provider: "openai",
        p_model: e.model, p_tokens_in: e.tokens, p_tokens_out: 0, p_attempts: 1, p_ms: e.ms, p_status: "ok" }).catch(() => {});
    }
    const left = await rpcAsCaller<unknown[]>(req, "polished_teacher_chunks_to_embed", { p_version_id: versionId, p_limit: 500 });
    return json({ embedded, remaining: left.length });
  } catch (e) {
    console.error("teacher-index error:", e instanceof Error ? e.message : e);
    const status = e instanceof HttpError ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, status);
  }
});

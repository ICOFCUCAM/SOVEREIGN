import { HttpError, callerId, corsHeaders, embed, json, rpcAsCaller } from "../_shared/teacher-http.ts";

// AI Teacher indexing (BLUEPRINT.md §2a, build step 1): writes embeddings for the
// passages of a version the caller owns. Runs in batches within a time budget and
// reports what remains, so the author's screen calls it until nothing is left.
// Indexing grants no access: a course decides who may use a version.
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
    let embedded = 0;
    while (Date.now() - started < BUDGET_MS) {
      const todo = await rpcAsCaller<{ chunk_id: string; chunk_text: string }[]>(req, "polished_teacher_chunks_to_embed", { p_version_id: versionId, p_limit: BATCH });
      if (!todo.length) return json({ embedded, remaining: 0 });
      const vectors = await embed(todo.map((t) => t.chunk_text.slice(0, 24_000)));
      embedded += await rpcAsCaller<number>(req, "polished_teacher_set_embeddings", { p_version_id: versionId, p_items: todo.map((t, i) => ({ id: t.chunk_id, embedding: vectors[i] })) });
    }
    const left = await rpcAsCaller<unknown[]>(req, "polished_teacher_chunks_to_embed", { p_version_id: versionId, p_limit: 500 });
    return json({ embedded, remaining: left.length });
  } catch (e) {
    console.error("teacher-index error:", e instanceof Error ? e.message : e);
    const status = e instanceof HttpError ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, status);
  }
});

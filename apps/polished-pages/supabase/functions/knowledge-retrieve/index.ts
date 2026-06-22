import { getUserId, requirePlanOrThrow, EntitlementError } from "../_shared/entitlements.ts";

// Retrieve the most relevant passages from the selected knowledge documents for
// a generation query: embed the query (OpenAI text-embedding-3-small) and run a
// vector-similarity search via polished_knowledge_match. Enterprise Plus.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function embedOne(apiKey: string, input: string): Promise<number[]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input }),
  });
  if (!r.ok) throw new Error(`Embeddings request failed (${r.status}).`);
  const d = await r.json();
  return (d.data as { embedding: number[] }[])[0].embedding;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const userId = getUserId(req);
    await requirePlanOrThrow(userId, "enterprise-plus");
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ context: "" });

    const body = await req.json().catch(() => ({}));
    const docIds = Array.isArray(body?.docIds) ? body.docIds.map((x: unknown) => String(x)).slice(0, 50) : [];
    const query = String(body?.query ?? "").slice(0, 8000).trim();
    const k = Math.max(1, Math.min(Number(body?.k ?? 8) || 8, 24));
    if (docIds.length === 0 || !query) return json({ context: "" });

    const emb = await embedOne(apiKey, query);
    const embStr = `[${emb.join(",")}]`;

    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const auth = req.headers.get("authorization") || "";
    const r = await fetch(`${url}/rest/v1/rpc/polished_knowledge_match`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: anon ?? "", authorization: auth },
      body: JSON.stringify({ p_doc_ids: docIds, p_embedding: embStr, p_k: k }),
    });
    if (!r.ok) {
      console.error("knowledge_match failed", r.status, await r.text().catch(() => ""));
      return json({ context: "" });
    }
    const rows = (await r.json()) as { content: string }[];
    return json({ context: rows.map((x) => x.content).join("\n\n"), passages: rows.length });
  } catch (e) {
    console.error("knowledge-retrieve error:", e);
    const status = e instanceof EntitlementError ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "Unknown error", context: "" }, status);
  }
});

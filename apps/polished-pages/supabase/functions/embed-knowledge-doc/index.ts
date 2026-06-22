import { getUserId, requirePlanOrThrow, EntitlementError } from "../_shared/entitlements.ts";

// Chunk a knowledge document and embed each chunk (OpenAI text-embedding-3-small),
// then store the chunks via polished_knowledge_index. Called after upload so the
// document can be retrieved by vector search at generation. Enterprise Plus.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Split text into ~900-char chunks at paragraph, then sentence, boundaries.
function chunk(text: string, max = 900): string[] {
  const out: string[] = [];
  let buf = "";
  const flush = () => { if (buf.trim()) out.push(buf.trim()); buf = ""; };
  for (const para of text.replace(/\r\n/g, "\n").split(/\n\n+/)) {
    if (para.length <= max && (buf.length + para.length + 2) <= max) { buf = buf ? `${buf}\n\n${para}` : para; continue; }
    flush();
    if (para.length <= max) { buf = para; continue; }
    let s = "";
    for (const sent of para.split(/(?<=[.!?])\s+/)) {
      if ((s.length + sent.length + 1) > max) { if (s) out.push(s.trim()); s = ""; }
      s = s ? `${s} ${sent}` : sent;
      while (s.length > max) { out.push(s.slice(0, max)); s = s.slice(max); }
    }
    if (s.trim()) out.push(s.trim());
  }
  flush();
  return out.filter(Boolean).slice(0, 1200);
}

async function embed(apiKey: string, inputs: string[]): Promise<number[][]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: inputs }),
  });
  if (!r.ok) throw new Error(`Embeddings request failed (${r.status}).`);
  const d = await r.json();
  return (d.data as { embedding: number[] }[]).map((x) => x.embedding);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const userId = getUserId(req);
    await requirePlanOrThrow(userId, "enterprise-plus");
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "Indexing is not configured (OPENAI_API_KEY missing)." }, 503);

    const body = await req.json().catch(() => ({}));
    const docId = String(body?.docId ?? "").trim();
    const content = String(body?.content ?? "");
    if (!docId) return json({ error: "Missing document id." }, 400);

    const chunks = chunk(content);
    if (chunks.length === 0) return json({ chunks: 0 });

    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += 96) {
      embeddings.push(...(await embed(apiKey, chunks.slice(i, i + 96))));
    }
    const payload = chunks.map((c, i) => ({ idx: i, content: c, embedding: embeddings[i] }));

    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const auth = req.headers.get("authorization") || "";
    const r = await fetch(`${url}/rest/v1/rpc/polished_knowledge_index`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: anon ?? "", authorization: auth },
      body: JSON.stringify({ p_doc_id: docId, p_chunks: payload }),
    });
    if (!r.ok) {
      console.error("knowledge_index failed", r.status, await r.text().catch(() => ""));
      return json({ error: "Could not store the index." }, 502);
    }
    return json({ chunks: await r.json() });
  } catch (e) {
    console.error("embed-knowledge-doc error:", e);
    const status = e instanceof EntitlementError ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, status);
  }
});

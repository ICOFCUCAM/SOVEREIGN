// HTTP helpers shared by the AI Teacher functions: CORS, JSON replies, calls to
// the owner-checked RPCs with the caller's own token (so the database decides
// what they may see), and OpenAI embeddings (text-embedding-3-small, as the
// existing knowledge index).
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
export const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export class HttpError extends Error { constructor(message: string, public status: number) { super(message); } }

/** The signed-in caller (the gateway has verified the token's signature; verify_jwt is on). */
export function callerId(req: Request): string {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");
  if (parts.length !== 3) throw new HttpError("Sign in first.", 401);
  try {
    const seg = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const c = JSON.parse(atob(seg.padEnd(Math.ceil(seg.length / 4) * 4, "="))) as { sub?: string; role?: string };
    if (c.role !== "authenticated" || !c.sub) throw new Error("not a user");
    return c.sub;
  } catch { throw new HttpError("Sign in first.", 401); }
}

/** Calls a public RPC as the signed-in caller (never with the service role). */
export async function rpcAsCaller<T>(req: Request, fn: string, args: Record<string, unknown>): Promise<T> {
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) throw new HttpError("The database is not configured for this function.", 503);
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: anon, authorization: req.headers.get("authorization") || "" },
    body: JSON.stringify(args),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    console.error(`${fn} failed`, r.status, detail.slice(0, 300));
    const msg = /not found/i.test(detail) ? "Not found, or not yours." : "The database refused the request.";
    throw new HttpError(msg, r.status === 401 ? 401 : r.status === 404 || /not found/i.test(detail) ? 404 : 502);
  }
  return (await r.json()) as T;
}

export function embeddingsConfigured(): boolean { return Boolean((Deno.env.get("OPENAI_API_KEY") ?? "").trim()); }

export async function embed(inputs: string[]): Promise<number[][]> {
  const key = (Deno.env.get("OPENAI_API_KEY") ?? "").replace(/\s+/g, "");
  if (!key) throw new HttpError("Indexing is not configured (OPENAI_API_KEY missing).", 503);
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: inputs }),
  });
  if (!r.ok) { console.error("embeddings failed", r.status); throw new HttpError(`Embeddings request failed (${r.status}).`, 502); }
  const d = await r.json();
  return (d.data as { embedding: number[] }[]).map((x) => x.embedding);
}

/**
 * One Claude Messages API call for the Teacher Runtime (the customer-facing API,
 * billed per use; never the owner's Claude Code runner). Retries transient
 * errors twice.
 */
export async function askClaude(system: string, user: string, maxTokens = 1800): Promise<{ text: string; model: string; tokensIn: number; tokensOut: number }> {
  const key = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").replace(/\s+/g, "");
  if (!key) throw new HttpError("The tutor is not configured (ANTHROPIC_API_KEY missing).", 503);
  const model = Deno.env.get("TEACHER_MODEL") || Deno.env.get("ANTHROPIC_MODEL") || "claude-opus-4-8";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 700 * attempt));
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
    });
    if (r.ok) {
      const d = await r.json();
      if (d.stop_reason === "refusal") throw new HttpError("The tutor declined to answer this question.", 422);
      const text = (d.content ?? []).filter((b: { type?: string }) => b.type === "text").map((b: { text?: string }) => b.text ?? "").join("");
      return { text, model: d.model ?? model, tokensIn: d.usage?.input_tokens ?? 0, tokensOut: d.usage?.output_tokens ?? 0 };
    }
    if (r.status === 401 || r.status === 403) throw new HttpError("The AI provider rejected the API key.", 502);
    if (![408, 409, 429, 500, 502, 503, 504, 529].includes(r.status)) { console.error("claude error", r.status); throw new HttpError("The tutor could not reach the AI model.", 502); }
  }
  throw new HttpError("The AI model is busy right now. Please try again in a moment.", 503);
}

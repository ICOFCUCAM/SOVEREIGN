import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, EntitlementError } from "../_shared/entitlements.ts";

// Claude Studio's API engine: what the owner's Studio uses when their own Claude
// Code is unavailable (signed out, plan limit reached, or the runner offline),
// or when they choose the API. Admins only — checked against Polished Pages'
// admin list with the caller's own session on every request. Billed per use on
// the site's ANTHROPIC_API_KEY.
//
// Request:  { system, user, maxTokens?, webSearch?: boolean }
// Response: { text, sources: {url,title}[], engine: "api", model }
// The Studio page builds the task prompts (summarise, rewrite, tools, chat) and
// splits long books into chapters before calling this.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MODEL = Deno.env.get("STUDIO_MODEL") || "claude-opus-5-5";
const MAX_INPUT_CHARS = 1_500_000;

async function isAdmin(req: Request): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return false;
  const r = await fetch(`${url}/rest/v1/rpc/polished_is_admin`, {
    method: "POST",
    headers: { apikey: anon, Authorization: req.headers.get("authorization") ?? "", "Content-Type": "application/json" },
    body: "{}",
  });
  return r.ok && (await r.json()) === true;
}

type Block = { type: string; text?: string; citations?: { url?: string; title?: string }[] };

// Claude on the API, with the web search server tool when the task needs it.
// A long search can return pause_turn: the turn is continued by sending its
// content back, up to a few times.
async function completeClaude(key: string, system: string, user: string, maxTokens: number, web: boolean) {
  const messages: { role: string; content: unknown }[] = [{ role: "user", content: user }];
  const content: Block[] = [];
  for (let turn = 0; turn < 6; turn++) {
    // Refusal fallbacks route a declined request to another model; if this
    // account doesn't accept that option, the request is sent once without it.
    const send = (withFallback: boolean) => fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", ...(withFallback ? { "anthropic-beta": "server-side-fallback-2026-07-01" } : {}), "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL, max_tokens: maxTokens, system, messages,
        output_config: { effort: "high" },
        ...(withFallback ? { fallbacks: "default" } : {}),
        ...(web ? { tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 20 }] } : {}),
      }),
    });
    let r = await send(true);
    if (r.status === 400) {
      const detail = await r.clone().text().catch(() => "");
      if (/fallback/i.test(detail)) r = await send(false);
    }
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      throw new LlmError(r.status === 429 ? "The API is rate-limited right now. Try again shortly." : `The API answered ${r.status}. ${detail.slice(0, 200)}`, r.status);
    }
    const data = await r.json();
    if (data.stop_reason === "refusal") throw new LlmError("Claude declined this request.", 422);
    content.push(...(data.content as Block[]));
    if (data.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: data.content });
  }
  const text = content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  if (!text.trim()) throw new LlmError("Claude returned an empty response. Try again.", 502);
  const seen = new Map<string, string>();
  for (const b of content) for (const c of b.citations ?? []) if (c.url && !seen.has(c.url)) seen.set(c.url, c.title ?? c.url);
  return { text, sources: [...seen].map(([url, title]) => ({ url, title })) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    getUserId(req);
    if (!(await isAdmin(req))) return json({ error: "Claude Studio is private to the site owner." }, 403);
    const { system, user, maxTokens, webSearch } = await req.json();
    if (typeof system !== "string" || typeof user !== "string" || !user.trim()) return json({ error: "Nothing to send." }, 400);
    if (system.length + user.length > MAX_INPUT_CHARS) return json({ error: "This part is too long for one request; it should have been split." }, 413);
    const max = Math.min(Math.max(Number(maxTokens) || 16000, 1024), 32000);
    const key = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").replace(/\s+/g, "");
    if (key) return json({ ...(await completeClaude(key, system, user, max, Boolean(webSearch))), engine: "api", model: MODEL });
    // No Claude API key: the site's shared adapter (its fallback provider), without web search.
    if (webSearch) return json({ error: "Web search needs the Claude API (ANTHROPIC_API_KEY) on this deployment." }, 503);
    const text = await complete({ system, user, maxTokens: max });
    return json({ text, sources: [], engine: "api", model: "fallback provider" });
  } catch (e) {
    const status = e instanceof EntitlementError ? e.status : e instanceof LlmError && e.status ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, status);
  }
});

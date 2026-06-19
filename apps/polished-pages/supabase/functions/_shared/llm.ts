// Shared LLM adapter for Polished Pages.
//
// Polished Pages cannot function without a language model — a CV, cover letter,
// or book is generated text, not a template fill. This module is the single
// place every edge function talks to a model, so the provider is a deployment
// decision (which API key is set) rather than something baked into each
// function.
//
// Provider precedence:
//   1. ANTHROPIC_API_KEY  → Claude Messages API (the primary engine)
//   2. LOVABLE_API_KEY    → Lovable AI gateway (OpenAI-compatible fallback)
//   3. neither            → a clear, honest error (no silent fake output)
//
// Callers pass a normalized { system, user } pair plus an optional token
// ceiling. The adapter returns the assistant's text. Rate-limit / out-of-credit
// conditions surface as an LlmError carrying the HTTP status so callers can
// pass the right code back to the browser, exactly as before.

const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-opus-4-8";
const ANTHROPIC_VERSION = "2023-06-01";
const LOVABLE_DEFAULT_MODEL = "google/gemini-2.5-flash";

export class LlmError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "LlmError";
    this.status = status;
  }
}

export interface CompleteOptions {
  system: string;
  user: string;
  /** Upper bound on generated tokens. Default 8000; raise for long-form (books). */
  maxTokens?: number;
  /** Lovable-gateway model used only when falling back. Preserves per-call choice. */
  lovableModel?: string;
}

// Secrets are frequently pasted with a trailing newline or stray whitespace,
// which is an illegal HTTP header value ("not a valid ByteString"). Strip it so
// a clumsy `secrets set` can never break the outbound call.
function readKey(name: string): string | undefined {
  const raw = Deno.env.get(name)?.trim();
  return raw ? raw : undefined;
}

/** True when at least one provider key is present. */
export function llmConfigured(): boolean {
  return Boolean(readKey("ANTHROPIC_API_KEY") || readKey("LOVABLE_API_KEY"));
}

/** Generate a completion from whichever provider is configured. Returns the text. */
export async function complete(opts: CompleteOptions): Promise<string> {
  const maxTokens = opts.maxTokens ?? 8000;
  const anthropicKey = readKey("ANTHROPIC_API_KEY");
  if (anthropicKey) return completeWithClaude(anthropicKey, opts.system, opts.user, maxTokens);

  const lovableKey = readKey("LOVABLE_API_KEY");
  if (lovableKey) {
    return completeWithLovable(lovableKey, opts.system, opts.user, opts.lovableModel ?? LOVABLE_DEFAULT_MODEL);
  }

  throw new LlmError(
    "No AI provider configured. Set ANTHROPIC_API_KEY (recommended) or LOVABLE_API_KEY in the Supabase function secrets.",
    503,
  );
}

async function completeWithClaude(apiKey: string, system: string, user: string, maxTokens: number): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    const detail = await safeText(response);
    if (response.status === 429) throw new LlmError("Rate limit exceeded. Please try again in a moment.", 429);
    if (response.status === 401 || response.status === 403) {
      throw new LlmError("AI provider rejected the API key. Check ANTHROPIC_API_KEY.", 502);
    }
    console.error("Claude API error:", response.status, detail);
    throw new LlmError("AI generation failed", 502);
  }

  const data = await response.json();

  // Refusals arrive as HTTP 200 with stop_reason "refusal" — check before reading content.
  if (data.stop_reason === "refusal") {
    throw new LlmError("The AI declined to complete this request. Please revise the input and try again.", 422);
  }

  const text = Array.isArray(data.content)
    ? data.content.filter((b: { type?: string }) => b?.type === "text").map((b: { text?: string }) => b.text ?? "").join("")
    : "";

  if (!text.trim()) throw new LlmError("AI returned an empty response. Please try again.", 502);
  return text;
}

async function completeWithLovable(apiKey: string, system: string, user: string, model: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await safeText(response);
    if (response.status === 429) throw new LlmError("Rate limit exceeded. Please try again in a moment.", 429);
    if (response.status === 402) throw new LlmError("AI credits exhausted. Please add funds.", 402);
    console.error("Lovable gateway error:", response.status, detail);
    throw new LlmError("AI generation failed", 502);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new LlmError("AI returned an empty response. Please try again.", 502);
  return text;
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "<no body>";
  }
}

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

// Secrets pasted from a console often pick up stray characters — a trailing
// newline, or (for long keys copied from a line-wrapped display) a newline in
// the MIDDLE of the value. Any of these is an illegal HTTP header character and
// makes the outbound request throw "not a valid ByteString". API keys never
// contain whitespace, so stripping all of it is always safe.
function readKey(name: string): string | undefined {
  const raw = Deno.env.get(name);
  if (!raw) return undefined;
  const cleaned = raw.replace(/\s+/g, "");
  return cleaned ? cleaned : undefined;
}

// Reject any non-printable-ASCII byte so a corrupted key surfaces as a clear,
// actionable message instead of the opaque ByteString error from fetch().
function assertHeaderSafe(key: string, name: string): void {
  for (const ch of key) {
    const code = ch.charCodeAt(0);
    if (code < 0x20 || code > 0x7e) {
      throw new LlmError(
        `${name} contains an invalid character (code ${code}). Re-copy the key — it must be plain ASCII with no spaces or line breaks.`,
        500,
      );
    }
  }
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
  assertHeaderSafe(apiKey, "ANTHROPIC_API_KEY");
  // Transient upstream conditions (overload/5xx/rate) are common on long-form
  // generation; retry a bounded number of times with backoff so a blip
  // self-heals instead of surfacing as a hard failure. Kept small so the total
  // stays within the function's wall-clock budget (a success runs ~50-60s).
  const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504, 529]);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let lastStatus = 0;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(700 * attempt); // 0, 700ms, 1400ms

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

    if (response.ok) {
      const data = await response.json();
      // Refusals arrive as HTTP 200 with stop_reason "refusal" — check before reading content.
      if (data.stop_reason === "refusal") {
        throw new LlmError("Polished Scribe declined to complete this request. Please revise the input and try again.", 422);
      }
      const text = Array.isArray(data.content)
        ? data.content.filter((b: { type?: string }) => b?.type === "text").map((b: { text?: string }) => b.text ?? "").join("")
        : "";
      if (!text.trim()) throw new LlmError("Polished Scribe returned an empty response. Please try again.", 502);
      return text;
    }

    lastStatus = response.status;
    const detail = await safeText(response);
    if (response.status === 401 || response.status === 403) {
      throw new LlmError("AI provider rejected the API key. Check ANTHROPIC_API_KEY.", 502);
    }
    console.error(`Claude API error (attempt ${attempt + 1}):`, response.status, detail.slice(0, 300));
    if (!RETRYABLE.has(response.status)) throw new LlmError("Polished Scribe Failed", 502);
    // otherwise loop and retry
  }

  // Exhausted retries on a retryable condition.
  if (lastStatus === 429) throw new LlmError("Polished Scribe is rate-limited right now. Please try again in a moment.", 429);
  throw new LlmError("Polished Scribe is temporarily overloaded. Please try again in a moment.", 503);
}

async function completeWithLovable(apiKey: string, system: string, user: string, model: string): Promise<string> {
  assertHeaderSafe(apiKey, "LOVABLE_API_KEY");
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
    throw new LlmError("Polished Scribe Failed", 502);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new LlmError("Polished Scribe returned an empty response. Please try again.", 502);
  return text;
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "<no body>";
  }
}

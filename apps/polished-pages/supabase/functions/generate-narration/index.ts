import { getUserId, requirePlanOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Audiobook narration via OpenAI text-to-speech. Audiobooks are an Enterprise
// capability. One chapter's text per call; the text is split to the TTS
// per-request limit, each part synthesised to MP3 and the parts concatenated
// into a single chapter track returned inline as a data URL.
const VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]);
const TTS_LIMIT = 4000;     // OpenAI caps input at 4096 chars; stay under it
const MAX_INPUT = 24000;    // ~6 parts per call to stay within the time budget

// Split text into <=TTS_LIMIT chunks at paragraph, then sentence, boundaries so
// narration never cuts mid-word.
function splitForTts(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  const flush = () => { if (buf.trim()) out.push(buf.trim()); buf = ""; };
  for (const para of text.split(/\n\n+/)) {
    if (para.length <= TTS_LIMIT && (buf.length + para.length + 2) <= TTS_LIMIT) {
      buf = buf ? `${buf}\n\n${para}` : para;
      continue;
    }
    flush();
    if (para.length <= TTS_LIMIT) { buf = para; continue; }
    // Paragraph itself too long — split by sentences.
    let sent = "";
    for (const s of para.split(/(?<=[.!?])\s+/)) {
      if ((sent.length + s.length + 1) > TTS_LIMIT) { if (sent) out.push(sent.trim()); sent = ""; }
      sent = sent ? `${sent} ${s}` : s;
      while (sent.length > TTS_LIMIT) { out.push(sent.slice(0, TTS_LIMIT)); sent = sent.slice(TTS_LIMIT); }
    }
    if (sent.trim()) out.push(sent.trim());
  }
  flush();
  return out.filter(Boolean);
}

// Strip markdown so the narrator reads prose, not symbols.
function plainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_`>#]/g, "")
    .replace(/^\s*[-–—]{3,}\s*$/gm, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function base64(bytes: Uint8Array): string {
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(bin);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const userId = getUserId(req);
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "Narration is not configured (OPENAI_API_KEY missing)." }, 503);

    const body = await req.json().catch(() => ({}));
    const voice = VOICES.has(String(body?.voice)) ? String(body.voice) : "alloy";
    const text = plainText(String(body?.text ?? ""));
    if (!text) return json({ error: "There is no text to narrate." }, 400);
    if (text.length > MAX_INPUT) return json({ error: "This section is too long to narrate in one request. Narrate it by chapter." }, 413);

    // Audiobooks are an Enterprise Plus capability — verified before any TTS cost.
    await requirePlanOrThrow(userId, "enterprise-plus");

    const parts = splitForTts(text);
    const buffers: Uint8Array[] = [];
    const ac = new AbortController();
    const killer = setTimeout(() => ac.abort(), 55000);
    try {
      for (const part of parts) {
        const resp = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "tts-1", voice, input: part, response_format: "mp3" }),
          signal: ac.signal,
        });
        if (!resp.ok) {
          clearTimeout(killer);
          const detail = await resp.text().catch(() => "");
          console.error("OpenAI tts error", resp.status, detail.slice(0, 300));
          return json({ error: `Narration failed (${resp.status}).` }, 502);
        }
        buffers.push(new Uint8Array(await resp.arrayBuffer()));
      }
    } catch (e) {
      clearTimeout(killer);
      if (e instanceof EntitlementError) throw e;
      return json({ error: "Narration timed out. Try a shorter chapter." }, 504);
    }
    clearTimeout(killer);

    const total = buffers.reduce((n, b) => n + b.length, 0);
    const merged = new Uint8Array(total);
    let off = 0;
    for (const b of buffers) { merged.set(b, off); off += b.length; }

    return json({ audio: `data:audio/mpeg;base64,${base64(merged)}`, parts: parts.length });
  } catch (e) {
    console.error("generate-narration error:", e);
    const status = e instanceof EntitlementError ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, status);
  }
});

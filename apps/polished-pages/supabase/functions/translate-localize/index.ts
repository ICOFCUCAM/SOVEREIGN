import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, consumeOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Translate OR culturally localize one document/section into one target language.
// "translate" = faithful translation, structure preserved. "localize" = a
// culturally relevant edition: names, settings, examples, animals, foods and
// references adapted to the target culture while keeping meaning, structure and
// any educational objective. The client calls this per target language (and per
// section for long books).
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const userId = getUserId(req);
    const b = await req.json();
    const content = String(b.content ?? "");
    const targetLanguage = String(b.targetLanguage ?? "").slice(0, 40).trim();
    const culture = String(b.culture ?? "").slice(0, 120).trim();
    const mode = b.mode === "localize" ? "localize" : "translate";

    if (!content.trim()) {
      return new Response(JSON.stringify({ error: "Nothing to translate." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (content.length > 40000) {
      return new Response(JSON.stringify({ error: "Section too large; split further." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!targetLanguage) {
      return new Response(JSON.stringify({ error: "A target language is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = mode === "localize"
      ? `You are an expert literary translator and cultural localizer. Produce a CULTURALLY LOCALIZED edition of the document in ${targetLanguage}${culture ? ` for ${culture}` : ""}.

This is localization, not mere translation:
- Translate the text naturally and fluently into ${targetLanguage}.
- Adapt names, settings, animals, foods, landscapes, festivals and everyday references so they are authentic and familiar to readers in ${culture || "the target culture"} — while keeping the SAME story/meaning, structure and any educational objective.
- Be respectful and accurate about the culture; avoid stereotypes and clichés.
- Preserve all markdown structure (headings, lists, emphasis) and the order of sections/pages.
- Return ONLY the localized document in markdown — no notes or commentary.`
      : `You are an expert literary and educational translator. Translate the document into ${targetLanguage} faithfully and fluently.

- Preserve meaning, tone and reading level. Keep numbers, names and facts.
- Preserve all markdown structure (headings, lists, emphasis) and the order of sections.
- Use natural, idiomatic ${targetLanguage}.
- Return ONLY the translated document in markdown — no notes or commentary.`;

    await consumeOrThrow(userId);
    const out = await complete({ system, user: content, maxTokens: 16000 });

    return new Response(JSON.stringify({ content: out, language: targetLanguage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-localize error:", e);
    const status = e instanceof EntitlementError ? e.status : e instanceof LlmError && e.status ? e.status : 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

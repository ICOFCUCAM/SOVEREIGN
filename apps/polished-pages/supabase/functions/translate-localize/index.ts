import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, consumeOrThrow, requirePlanOrThrow, EntitlementError } from "../_shared/entitlements.ts";

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
      ? `You are a master literary translator and cultural localizer who creates editions that feel written FROM WITHIN ${culture || "the target culture"} — not translated into it. Produce a culturally NATIVE edition in ${targetLanguage}${culture ? ` for ${culture}` : ""}.

This is deep localization, not translation. Keep the SAME story, meaning, structure, reading level and any educational objective, but make every cultural detail authentic to ${culture || "the target culture"}:
- NAMES: use real, common given names and surnames from ${culture || "the culture"}, with correct local naming conventions.
- PLACES & NATURE: real-feeling local settings, landscapes, climate, plants and animals native to the region.
- FOOD & DAILY LIFE: local dishes, ingredients, meals, clothing, homes, transport, games, music and crafts.
- CALENDAR & CUSTOMS: local festivals, holidays, greetings, etiquette, family and community life, faith where relevant — portrayed respectfully.
- LANGUAGE TEXTURE: idioms, proverbs, honorifics, terms of endearment and turns of phrase a native speaker would actually use; keep a few untranslatable local words where they ring true.
- PRACTICALS: local units, currency, dates and the school/grade system where they appear.

Honor the culture with genuine SPECIFICITY — especially for under-represented cultures, choose concrete, accurate local detail over generic or stereotyped imagery. Never caricature. When unsure, prefer warm, everyday authenticity.

- Preserve all markdown structure (headings, lists, emphasis) and the order of sections/pages.
- Return ONLY the localized document in markdown — no notes or commentary.`
      : `You are an expert literary and educational translator. Translate the document into ${targetLanguage} faithfully and fluently.

- Preserve meaning, tone and reading level. Keep numbers, names and facts.
- Preserve all markdown structure (headings, lists, emphasis) and the order of sections.
- Use natural, idiomatic ${targetLanguage}.
- Return ONLY the translated document in markdown — no notes or commentary.`;

    await requirePlanOrThrow(userId, "professional");
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

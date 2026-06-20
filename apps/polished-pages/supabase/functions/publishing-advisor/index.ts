import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, consumeOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AI Publishing Advisor — publishing intelligence, not content creation. Given a
// finished manuscript it returns a structured go-to-market plan: audience,
// markets, categories, page estimate, price, distribution and translation
// opportunities. The word count is computed deterministically and fed to the
// model so the page/price estimates are grounded in the actual manuscript.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const userId = getUserId(req);
    const b = await req.json().catch(() => ({}));
    const title = String(b.title ?? "").slice(0, 200);
    const content = String(b.content ?? "");
    if (!content.trim()) {
      return new Response(JSON.stringify({ error: "Nothing to analyze." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const words = (content.trim().match(/\S+/g) || []).length;

    const system = `You are a seasoned book-publishing strategist who has launched titles on Amazon KDP, IngramSpark, Kobo, Apple Books and Google Play. Analyse the manuscript and produce a realistic, specific go-to-market plan grounded in its actual content and length.

Return ONLY valid JSON (no markdown fences) with this EXACT shape:
{
  "audience": "the primary readership (e.g. 'Children ages 6–8' or 'Early-career software engineers')",
  "readingLevel": "short reading-level note",
  "categories": ["2–3 real, specific bookstore/BISAC-style categories"],
  "markets": ["3–5 country markets where this would sell, by relevance"],
  "estimatedPages": 0,
  "price": "$0.00",
  "priceRationale": "one short sentence on the price",
  "distribution": ["recommended channels, e.g. 'Amazon KDP', 'Kobo', 'IngramSpark'"],
  "translations": ["2–5 languages with the best translation/localization upside"],
  "positioning": "one-sentence positioning statement for the book"
}

Base "estimatedPages" on roughly 275 words per printed page for prose (this manuscript has about ${words} words), but adjust sensibly for picture books, workbooks or illustrated formats. Pick a realistic "price" for the format and market. Be concrete and honest — no filler.`;

    const user = `Title: ${title || "(untitled)"}
Approximate word count: ${words}

Manuscript (excerpt):
${content.slice(0, 18000)}`;

    await consumeOrThrow(userId);
    const raw = await complete({ system, user, maxTokens: 1500 });

    let advice: Record<string, unknown>;
    try {
      advice = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      throw new LlmError("Could not produce a publishing plan. Please try again.", 502);
    }
    advice.wordCount = words;

    return new Response(JSON.stringify(advice), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("publishing-advisor error:", e);
    const status = e instanceof EntitlementError ? e.status : e instanceof LlmError && e.status ? e.status : 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

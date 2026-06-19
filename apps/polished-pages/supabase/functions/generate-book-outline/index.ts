import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, consumeOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = getUserId(req);
    const { bookTitle, genre, targetAudience, depth, mode, existingContent } = await req.json();

    const depthGuide = {
      short: "6 chapters, concise (1500-2000 words each)",
      standard: "8-10 chapters, thorough (2500-3500 words each)",
      detailed: "10-12 chapters, comprehensive (3500-5000 words each)",
    }[depth || "standard"];

    const modeInstructions = {
      quick: "Create a complete, publication-ready outline immediately. Make bold creative decisions.",
      guided: "Create a thorough outline with detailed chapter summaries for user review.",
      restructure: `Analyze this existing content and create an improved structure:\n\n${existingContent || ""}`,
      improve: `Review this existing content and suggest improvements:\n\n${existingContent || ""}`,
      publish: "Create a publishing-optimized outline with market positioning, keywords, and categories.",
    }[mode || "guided"];

    const systemPrompt = `You are a bestselling book strategist and publisher. You create compelling, marketable book outlines.

RESPOND ONLY WITH VALID JSON. No markdown, no explanation.

JSON structure:
{
  "title": "Marketable book title",
  "subtitle": "Compelling subtitle",
  "description": "2-3 sentence book description for marketing",
  "targetAudience": "Specific audience",
  "positioning": "What makes this book unique",
  "keywords": ["keyword1", "keyword2", ...],
  "categories": ["category1", "category2"],
  "coverDirection": {
    "style": "visual style description",
    "colors": "color palette suggestion",
    "typography": "font style suggestion"
  },
  "frontMatter": "Introduction/preface content outline",
  "backMatter": "Conclusion/author bio outline",
  "chapters": [
    {
      "title": "Chapter title",
      "summary": "2-3 sentence summary of chapter content and value",
      "keyPoints": ["point1", "point2", "point3"],
      "hook": "Opening hook concept for this chapter"
    }
  ]
}

RULES:
- Genre: ${genre || "general non-fiction"}
- Target: ${targetAudience || "general readers"}
- Depth: ${depthGuide}
- Each chapter must have a UNIQUE angle — NO repetition of themes
- Chapters must flow logically with clear progression
- Include actionable, practical content
- ${modeInstructions}`;

    await consumeOrThrow(userId);
    let content = await complete({
      system: systemPrompt,
      user: `Create a ${mode || "guided"} book outline for: "${bookTitle || "Untitled Book"}"`,
      maxTokens: 8000,
      lovableModel: "google/gemini-3-flash-preview",
    });

    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const outline = JSON.parse(content);

    return new Response(JSON.stringify({ outline }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-book-outline error:", e);
    const status = e instanceof EntitlementError ? e.status : e instanceof LlmError && e.status ? e.status : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

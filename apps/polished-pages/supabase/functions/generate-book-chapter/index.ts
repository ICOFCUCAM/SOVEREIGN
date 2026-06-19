import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";

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
    const { bookTitle, genre, targetAudience, chapters, chapterIndex, depth, previousChapters } = await req.json();

    const chapter = chapters[chapterIndex];
    const outlineContext = chapters
      .map((ch: any, i: number) => `${i + 1}. ${ch.title}${ch.summary ? ` – ${ch.summary}` : ""}`)
      .join("\n");

    // Build anti-repetition context from previous chapters
    const prevContext = previousChapters?.length
      ? `\n\nPREVIOUSLY COVERED (DO NOT REPEAT these ideas/examples):\n${previousChapters.map((p: string, i: number) => `Ch${i + 1} key points: ${p.substring(0, 500)}`).join("\n")}`
      : "";

    const depthGuide = {
      short: "Write a focused chapter of 1500-2000 words. Be concise but impactful.",
      standard: "Write a thorough chapter of 2500-3500 words with detailed explanations.",
      detailed: "Write a comprehensive chapter of 3500-5000 words with extensive examples and analysis.",
    }[depth || "standard"];

    const systemPrompt = `You are a bestselling author and ghostwriter. Write compelling, publication-ready book chapters.

RULES:
- Genre: ${genre || "general non-fiction"}
- Target audience: ${targetAudience || "general readers"}
- ${depthGuide}

CHAPTER QUALITY REQUIREMENTS:
1. HOOK: Start with a powerful, specific hook (story, question, statistic, bold claim). NEVER start with "In this chapter..." or generic introductions.
2. SECTIONS: Use ### for clear section breaks. Each section should have a distinct purpose.
3. EXAMPLES: Include at least 2-3 real-world examples, case studies, or scenarios.
4. INSIGHTS: Provide actionable, practical insights readers can apply immediately.
5. FLOW: Use short paragraphs (2-4 sentences). Vary sentence length. Create momentum.
6. ENDING: End with a powerful summary, key takeaways, or action steps.

ANTI-REPETITION: Each idea, example, and explanation must be UNIQUE to this chapter.${prevContext}

FORMAT:
- Start with ## Chapter Title
- Use ### for sections
- Use **bold** for emphasis
- Use - for bullet lists where appropriate
- Do NOT include meta-commentary or instructions`;

    const userPrompt = `Book: "${bookTitle}"

Full Chapter Outline:
${outlineContext}

Now write Chapter ${chapterIndex + 1}: "${chapter.title}"
${chapter.summary ? `\nChapter brief: ${chapter.summary}` : ""}
${chapter.notes ? `\nAuthor notes: ${chapter.notes}` : ""}
${chapter.keyPoints?.length ? `\nKey points to cover: ${chapter.keyPoints.join(", ")}` : ""}
${chapter.hook ? `\nSuggested hook concept: ${chapter.hook}` : ""}

Write the complete chapter now.`;

    // A detailed chapter runs 3500-5000 words (~7k tokens) — give headroom.
    const content = await complete({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 16000,
      lovableModel: "google/gemini-3-flash-preview",
    });

    return new Response(JSON.stringify({ chapter: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-book-chapter error:", e);
    const status = e instanceof LlmError && e.status ? e.status : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

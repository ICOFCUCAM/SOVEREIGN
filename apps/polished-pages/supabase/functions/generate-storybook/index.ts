import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, consumeOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Children's storybook engine. Produces a structured, age-appropriate
// illustrated picture book: a title, a consistent art-direction, character
// sheets (so illustrations stay on-model), a cover prompt, and per-page text +
// illustration prompts. The client then renders the pages and generates the
// illustrations one at a time. Text is Claude; images are a separate function.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const userId = getUserId(req);
    const b = await req.json();
    const childAge = String(b.childAge ?? "").slice(0, 20);
    const readingLevel = String(b.readingLevel ?? "").slice(0, 40);
    const theme = String(b.theme ?? "").slice(0, 200);
    const moral = String(b.moralLesson ?? "").slice(0, 200);
    const characters = String(b.characters ?? "").slice(0, 600);
    const childName = String(b.childName ?? "").slice(0, 60).trim();
    const pageCount = Math.min(Math.max(parseInt(String(b.pageCount ?? "12"), 10) || 12, 6), 24);

    if (!theme.trim()) {
      return new Response(JSON.stringify({ error: "A theme or story idea is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You are an award-winning children's picture-book author and an art director. You write wholesome, imaginative, age-appropriate stories and specify illustrations for them.

SAFETY (non-negotiable): Content must be completely child-safe and wholesome — no violence, fear, peril beyond gentle age-appropriate tension, no romance, no scary imagery, no branded characters, nothing political or commercial. Kindness, curiosity and warmth throughout.

WRITING:
- Match vocabulary, sentence length and concepts to the child's age and reading level. Younger = very short, rhythmic, concrete sentences; older = slightly richer.
- Tell ONE clear story with a beginning, a gentle problem, and a warm resolution. Weave the moral in naturally — never preach.
- ${childName ? `The hero of the story is a child named "${childName}". Make them brave, kind and central.` : "Create an endearing main character."}
- Aim for about ${pageCount} pages. Each page is one or two short paragraphs of story text.

ILLUSTRATIONS:
- Define a single consistent "artStyle" string used for every image (e.g. soft watercolour, warm palette, rounded friendly shapes).
- Define each recurring character with a fixed visual "appearance" so they look the same on every page.
- For each page, write an "illustrationPrompt" describing the scene, and ALWAYS restate the relevant character appearances inside it so the image stays on-model. No text or words in the illustrations.

Return ONLY valid JSON (no markdown fences) with this EXACT shape:
{
  "title": "",
  "dedication": "",
  "artStyle": "",
  "characters": [{ "name": "", "appearance": "" }],
  "coverPrompt": "cover illustration scene, restating the hero's appearance",
  "pages": [{ "text": "", "illustrationPrompt": "" }]
}`;

    const user = `Create a children's picture book.
Child's age: ${childAge || "5"}
Reading level: ${readingLevel || "early reader"}
Theme / idea: ${theme}
Moral / lesson: ${moral || "(let the story carry a gentle, positive message)"}
Characters: ${characters || "(invent suitable characters)"}
${childName ? `Personalize: the child "${childName}" is the hero.` : ""}
Pages: about ${pageCount}.`;

    await consumeOrThrow(userId);
    const raw = await complete({ system, user, maxTokens: 8000 });

    let book;
    try {
      book = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      throw new LlmError("Could not build the storybook. Please try again.", 502);
    }

    return new Response(JSON.stringify(book), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-storybook error:", e);
    const status = e instanceof EntitlementError ? e.status : e instanceof LlmError && e.status ? e.status : 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, consumeOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const TEMPLATES = ["classic", "modern", "devotional", "academic", "children", "thriller"];

// Cover copy for Cover Studio, written from the book: tagline, back-cover blurb,
// author bio from the book's own facts ([placeholders] otherwise), category,
// suggested template and art direction for text-free artwork. Same rules as
// src/lib/cover-copy.ts (Claude Studio uses those directly).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const userId = getUserId(req);
    const b = await req.json().catch(() => ({}));
    const title = String(b.title ?? "").slice(0, 200);
    const subtitle = String(b.subtitle ?? "").slice(0, 300);
    const author = String(b.author ?? "").slice(0, 120);
    const text = String(b.text ?? "").slice(0, 60_000);
    if (!text.trim()) return json({ error: "There's no book text to write the cover copy from." }, 400);

    await consumeOrThrow(userId);
    const raw = await complete({
      system: "You are an experienced book-jacket copywriter and cover art director. You write honest, specific, compelling copy and never invent facts.",
      user: `Write the cover copy for this book.
Title: ${title || "Untitled"}${subtitle ? `\nSubtitle: ${subtitle}` : ""}${author ? `\nAuthor: ${author}` : ""}

Reply with valid JSON only (no code fences, no commentary), with exactly this shape:
{"tagline": "", "backHeadline": "", "blurb": "", "bio": "", "category": "", "template": "", "frontArt": "", "backArt": ""}

- tagline: one line for the front cover, under 12 words.
- backHeadline: a short hook line that opens the back cover (under 14 words).
- blurb: back-cover copy of 120–180 words that sells the book honestly: the hook, what the reader will gain or feel, why this book. Short paragraphs separated by a blank line. For fiction, don't give away the ending.
- bio: a 40–70 word author bio in the third person, using only facts the book states about the author. Use [placeholders] for anything else.
- category: a shelving line in BISAC style.
- template: one of ${TEMPLATES.join(", ")}.
- frontArt: art direction for a front-cover illustration with NO text, letters or logos: subject, composition, mood, palette, medium, and where to leave calm space for the title.
- backArt: art direction for a quieter, matching back-cover background with large calm areas for text, also with no text.
Write everything except frontArt and backArt in the language the book is written in.
Never invent endorsements, reviews, awards, sales figures or facts about the author.

The book:

${text}`,
      maxTokens: 2000,
      lovableModel: "google/gemini-3-flash-preview",
    });
    const s = raw.replace(/```json\n?|```\n?/g, "").trim();
    const copy = JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1));
    return json({ copy });
  } catch (e) {
    console.error("generate-cover-copy error:", e);
    const status = e instanceof EntitlementError ? e.status : e instanceof LlmError && e.status ? e.status : 500;
    return json({ error: e instanceof SyntaxError ? "The cover copy came back malformed. Try again." : e instanceof Error ? e.message : "Unknown error" }, status);
  }
});

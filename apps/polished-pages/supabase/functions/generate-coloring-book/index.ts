import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, consumeOrThrow, requirePlanOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Colouring-book engine. Plans a set of distinct, clearly-outlinable scenes for a
// theme and age, each with a short caption and a line-art illustration prompt.
// The client then renders each as black-and-white line art via the illustration
// engine (lineArt mode).
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const userId = getUserId(req);
    const b = await req.json();
    const theme = String(b.theme ?? "").slice(0, 200);
    const age = String(b.age ?? "").slice(0, 20);
    const pageCount = Math.min(Math.max(parseInt(String(b.pageCount ?? "12"), 10) || 12, 6), 30);

    if (!theme.trim()) {
      return new Response(JSON.stringify({ error: "A theme is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You plan children's COLOURING BOOKS. Given a theme and age, design ${pageCount} distinct, wholesome scenes that colour in beautifully as black-and-white line art.

RULES:
- Each scene = ONE clear subject with bold, simple outlines suitable for a child to colour. Age-appropriate complexity (younger = simpler, fewer elements).
- Vary the scenes so the book feels rich and non-repetitive.
- Completely child-safe: friendly, gentle, no scary/violent/branded content.
- The "illustrationPrompt" must describe only the subject and composition (it will be rendered as line art automatically) — do not mention colour.

Return ONLY valid JSON (no fences):
{ "title": "", "pages": [{ "caption": "short kid-friendly caption", "illustrationPrompt": "" }] }`;

    const user = `Theme: ${theme}
Age: ${age || "5"}
Pages: ${pageCount}`;

    await requirePlanOrThrow(userId, "creator");
    await consumeOrThrow(userId);
    const raw = await complete({ system, user, maxTokens: 4000 });

    let book;
    try {
      book = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      throw new LlmError("Could not plan the colouring book. Please try again.", 502);
    }

    return new Response(JSON.stringify(book), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-coloring-book error:", e);
    const status = e instanceof EntitlementError ? e.status : e instanceof LlmError && e.status ? e.status : 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

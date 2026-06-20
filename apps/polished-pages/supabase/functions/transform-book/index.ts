import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { complete, LlmError } from "../_shared/llm.ts";
import { getUserId, consumeOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Transform ONE section of an uploaded book per the user's instruction. The
// client splits the book into sections and calls this per section (the same
// orchestration the chapter generator uses), so an arbitrarily long book is
// revised without ever exceeding a single request's time budget. The model
// applies the requested change while preserving structure and voice.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = getUserId(req);
    const { section, instruction, bookTitle, sectionIndex, total } = await req.json();

    if (!section || typeof section !== "string" || !section.trim()) {
      return new Response(JSON.stringify({ error: "A book section is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      return new Response(JSON.stringify({ error: "Describe the change you want to make." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (section.length > 40000) {
      return new Response(JSON.stringify({ error: "Section too large; split further." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You are an expert book editor. You revise ONE section of a book to apply a change the author requested, consistently across the whole book.

CHANGE REQUESTED BY THE AUTHOR (apply wherever it is relevant in this section):
${instruction}

RULES:
- Apply the requested change faithfully and consistently. If the change does not affect this particular section, return the section essentially unchanged.
- Preserve the section's markdown structure (headings, lists, emphasis) and the author's voice and tone.
- Do not summarize, truncate, or drop content unless the instruction explicitly asks you to.
- Return ONLY the revised section in markdown — no preamble, no meta-commentary, no notes about what you changed.`;

    const user = `BOOK TITLE: ${bookTitle || "Untitled"}
SECTION ${sectionIndex ?? 1} OF ${total ?? 1}

--- SECTION CONTENT ---
${section}`;

    await consumeOrThrow(userId);
    const content = await complete({ system, user, maxTokens: 16000 });

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transform-book error:", e);
    const status = e instanceof EntitlementError ? e.status : e instanceof LlmError && e.status ? e.status : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

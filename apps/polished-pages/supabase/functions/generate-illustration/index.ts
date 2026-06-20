import { getUserId, consumeOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Illustration engine via OpenAI gpt-image-1 (Claude has no image model). Used
// for children's storybook pages, covers and line-art colouring pages. One
// image per call, returned inline as a data URL, metered per generation.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const userId = getUserId(req);
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Image generation is not configured (OPENAI_API_KEY missing)." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const b = await req.json().catch(() => ({}));
    const prompt = String(b.prompt ?? "").slice(0, 1500);
    const artStyle = String(b.artStyle ?? "").slice(0, 400);
    const orientation = b.orientation === "portrait" ? "portrait" : b.orientation === "landscape" ? "landscape" : "square";
    const lineArt = b.lineArt === true;

    if (!prompt.trim()) {
      return new Response(JSON.stringify({ error: "An illustration prompt is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safety = "Wholesome, child-safe, age-appropriate children's book art. Friendly and warm. No text, letters or words in the image. No scary, violent or inappropriate content.";
    const style = lineArt
      ? "Black-and-white line-art colouring-book page: clean bold outlines, no shading, no fill, plenty of white space to colour in."
      : (artStyle || "Soft, warm children's picture-book illustration, gentle colour palette, rounded friendly shapes.");
    const fullPrompt = `${prompt}. ${style}. ${safety}`;

    const size = orientation === "portrait" ? "1024x1536" : orientation === "landscape" ? "1536x1024" : "1024x1024";

    const ac = new AbortController();
    const killer = setTimeout(() => ac.abort(), 55000);
    let resp: Response;
    try {
      await consumeOrThrow(userId);
      resp = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "gpt-image-1", prompt: fullPrompt, size, n: 1, quality: "medium" }),
        signal: ac.signal,
      });
    } catch (e) {
      clearTimeout(killer);
      if (e instanceof EntitlementError) throw e;
      return new Response(JSON.stringify({ error: "Image request did not respond in time. Please try again." }), {
        status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    clearTimeout(killer);

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.error("OpenAI image error", resp.status, detail.slice(0, 400));
      return new Response(JSON.stringify({ error: `Illustration failed (${resp.status}).` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const item = data?.data?.[0] ?? {};
    let b64: string | undefined = item.b64_json;
    if (!b64 && item.url) {
      const img = await fetch(item.url);
      if (img.ok) {
        const buf = new Uint8Array(await img.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        b64 = btoa(bin);
      }
    }
    if (!b64) {
      return new Response(JSON.stringify({ error: "No image was returned. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ image: `data:image/png;base64,${b64}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-illustration error:", e);
    const status = e instanceof EntitlementError ? e.status : 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { getUserId, consumeOrThrow, EntitlementError } from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Book cover / back-cover image generation via OpenAI gpt-image-1 (the platform's
// image engine — Claude has no image model). One side per call so a request never
// exceeds the time budget; the image is returned inline as a data URL.
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

    const body = await req.json().catch(() => ({}));
    const side: string = body.side === "back" ? "back" : "front";
    const instruction: string = (body.instruction || "").toString();
    const title: string = (body.title || "").toString();
    const subtitle: string = (body.subtitle || "").toString();
    const author: string = (body.author || "").toString();
    const blurb: string = (body.blurb || "").toString();

    if (!instruction.trim() && !title.trim()) {
      return new Response(JSON.stringify({ error: "Describe the cover you want, or provide a title." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base =
      side === "front"
        ? `Design a professional, premium FRONT BOOK COVER, portrait orientation, print-ready.${title ? ` Title text to feature prominently: "${title.slice(0, 120)}".` : ""}${subtitle ? ` Subtitle: "${subtitle.slice(0, 160)}".` : ""}${author ? ` Author name: "${author.slice(0, 80)}".` : ""} Strong typographic hierarchy, balanced composition, bookstore-quality.`
        : `Design a professional BACK BOOK COVER, portrait orientation, print-ready, visually consistent with a premium front cover.${blurb ? ` Leave a clean area for this back-cover blurb text: "${blurb.slice(0, 400)}".` : " Leave a clean area for back-cover blurb text."} Include a subtle area suggesting a barcode at the bottom. Restrained, elegant.`;

    const prompt = `${base}${instruction.trim() ? ` Art direction from the author: ${instruction.slice(0, 1200)}.` : ""} High production value, sharp, professional book-cover design.`;

    const ac = new AbortController();
    const killer = setTimeout(() => ac.abort(), 55000);
    let resp: Response;
    try {
      // Meter only once the request is validated and about to incur cost.
      await consumeOrThrow(userId, "image");
      resp = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1536", n: 1, quality: "medium" }),
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
      return new Response(JSON.stringify({ error: `Image generation failed (${resp.status}).` }), {
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

    return new Response(JSON.stringify({ side, image: `data:image/png;base64,${b64}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-book-cover error:", e);
    const status = e instanceof EntitlementError ? e.status : 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

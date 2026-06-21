import { getUserContext, requirePlanOrThrow, EntitlementError } from "../_shared/entitlements.ts";

// Publish a saved audiobook to the Wankong store. The trusted middle: the
// browser sends the audiobook's chapter audio URLs + metadata with the user's
// JWT; this function (holding the bridge secret the browser must never see)
// forwards them to Wankong. Audiobooks are an Enterprise Plus capability.
//
// Contract Wankong's receiver must accept (POST, header `x-polished-secret`):
//   { format: "audiobook", source_doc_id, seller_email, title, author,
//     description, price_cents, language, voice,
//     audio_chapters: [{ title, url }] }
// and respond { ok: true, status, product_id, url } or { needs_account: true }.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { id: userId, email } = getUserContext(req);
    if (!email) throw new EntitlementError("Your account has no email, so it can't be matched to a Wankong account.", 400);

    // A dedicated audiobook endpoint if configured, else the shared bridge
    // (Wankong routes on the `format` field).
    const publishUrl = Deno.env.get("WANKONG_AUDIOBOOK_URL") ?? Deno.env.get("WANKONG_PUBLISH_URL");
    const secret = Deno.env.get("WANKONG_BRIDGE_SECRET");
    if (!publishUrl || !secret) throw new EntitlementError("Wankong publishing is not configured.", 503);

    const body = await req.json().catch(() => ({}));
    const docId = String(body?.docId ?? "").trim();
    const title = String(body?.title ?? "").trim();
    const priceCents = Math.max(0, Math.round(Number(body?.priceCents ?? 0)) || 0);
    const chapters = Array.isArray(body?.chapters)
      ? body.chapters.map((c: { title?: unknown; url?: unknown }) => ({ title: String(c?.title ?? "").slice(0, 200), url: String(c?.url ?? "") })).filter((c: { url: string }) => c.url)
      : [];
    if (!docId || !title) throw new EntitlementError("Missing audiobook id or title.", 400);
    if (chapters.length === 0) throw new EntitlementError("This audiobook has no chapters to publish.", 400);

    // Audiobook distribution is an Enterprise Plus capability.
    await requirePlanOrThrow(userId, "enterprise-plus");

    const res = await fetch(publishUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-polished-secret": secret },
      body: JSON.stringify({
        format: "audiobook",
        source_doc_id: docId,
        seller_email: email,
        title,
        author: body?.author ?? null,
        description: body?.description ?? "",
        price_cents: priceCents,
        language: body?.language ?? "en",
        voice: body?.voice ?? null,
        audio_chapters: chapters,
      }),
    });

    const out = await res.json().catch(() => ({}));

    if (out?.needs_account) {
      return json({ needs_account: true, error: out.error ?? "No Wankong account for your email." });
    }
    if (!res.ok || !out?.ok) {
      console.error("wankong audiobook publish responded", res.status, out);
      return json({ error: out?.error ?? "Wankong rejected the audiobook publish." }, 502);
    }

    // Record the external listing (service role), channel "wankong".
    try {
      const url = Deno.env.get("SUPABASE_URL");
      const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (url && key) {
        await fetch(`${url}/rest/v1/rpc/polished_record_external_listing`, {
          method: "POST",
          headers: { "content-type": "application/json", apikey: key, authorization: `Bearer ${key}` },
          body: JSON.stringify({
            p_doc_id: docId,
            p_channel: "wankong",
            p_external_id: out.product_id ?? null,
            p_external_url: out.url ?? null,
            p_status: out.status ?? "live",
          }),
        });
      }
    } catch (e) {
      console.error("record external listing failed (non-fatal):", e);
    }

    return json({ ok: true, status: out.status ?? "live", productId: out.product_id, url: out.url });
  } catch (e) {
    console.error("publish-audiobook-to-wankong error:", e);
    const status = e instanceof EntitlementError ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "Publish failed" }, status);
  }
});

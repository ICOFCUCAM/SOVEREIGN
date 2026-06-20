import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getUserContext, requirePlanOrThrow, EntitlementError } from "../_shared/entitlements.ts";

// Publish a signed-in user's book/storybook to the Wankong store.
//
// This is the trusted middle: the browser sends the exported EPUB + metadata
// with the user's JWT (verify_jwt on), and this function — which holds the
// shared bridge secret the browser must never see — forwards it to Wankong's
// `wankong-publish-book` endpoint. The seller is identified by the verified
// email on the JWT, so a title only lands in the store if that email already
// owns a Wankong account.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Mirror the catalog rule: charging for a title needs a paid (commercial) plan.
const PAID_MIN_PLAN = "creator";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { id: userId, email } = getUserContext(req);
    if (!email) {
      throw new EntitlementError("Your account has no email, so it can't be matched to a Wankong account.", 400);
    }

    const publishUrl = Deno.env.get("WANKONG_PUBLISH_URL");
    const secret = Deno.env.get("WANKONG_BRIDGE_SECRET");
    if (!publishUrl || !secret) throw new EntitlementError("Wankong publishing is not configured.", 503);

    const body = await req.json().catch(() => ({}));
    const docId = String(body?.docId ?? "").trim();
    const title = String(body?.title ?? "").trim();
    const priceCents = Math.max(0, Math.round(Number(body?.priceCents ?? 0)) || 0);
    if (!docId || !title) throw new EntitlementError("Missing document id or title.", 400);
    if (!body?.epubBase64) throw new EntitlementError("Missing the exported book file.", 400);

    if (priceCents > 0) await requirePlanOrThrow(userId, PAID_MIN_PLAN);

    // Forward to Wankong with the verified seller email + bridge secret.
    const res = await fetch(publishUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-polished-secret": secret },
      body: JSON.stringify({
        source_doc_id: docId,
        seller_email: email,
        title,
        author: body?.author ?? null,
        description: body?.description ?? "",
        price_cents: priceCents,
        language: body?.language ?? "en",
        genre: body?.genre ?? null,
        isbn: body?.isbn ?? null,
        pages: body?.pages ?? null,
        publisher: body?.publisher ?? null,
        handle: body?.handle ?? null,
        epub_base64: body.epubBase64,
        epub_filename: body?.epubFilename ?? `${title}.epub`,
        cover_base64: body?.coverBase64 ?? null,
        cover_mime: body?.coverMime ?? null,
      }),
    });

    const out = await res.json().catch(() => ({}));

    // The author doesn't own a Wankong account yet — surface it cleanly.
    if (out?.needs_account) {
      return json({ needs_account: true, error: out.error ?? "No Wankong account for your email." });
    }
    if (!res.ok || !out?.ok) {
      console.error("wankong-publish-book responded", res.status, out);
      return json({ error: out?.error ?? "Wankong rejected the publish." }, 502);
    }

    // Record the listing on the document (service role).
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
    console.error("polished-publish-to-wankong error:", e);
    const status = e instanceof EntitlementError ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "Publish failed" }, status);
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17?target=deno";
import { getUserContext, EntitlementError } from "../_shared/entitlements.ts";

// Creates a Stripe Checkout Session for the signed-in user. Two modes:
//   • default            → subscription checkout to upgrade to Pro
//   • { kind: "credits" } → one-time payment for an image-credit pack
// The user id travels on the session (client_reference_id + metadata) so the
// webhook can flip the account to 'pro' or grant the purchased credits.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { id: userId, email } = getUserContext(req);
    const secret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secret) throw new EntitlementError("Billing is not configured.", 503);

    const body = await req.json().catch(() => ({}));
    const origin = req.headers.get("origin") || Deno.env.get("PUBLIC_SITE_URL") || "";
    const stripe = new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });

    if (body?.kind === "credits") {
      // One-time image-credit pack.
      const price = Deno.env.get("STRIPE_CREDITS_PRICE_ID");
      if (!price) throw new EntitlementError("Credit packs are not configured.", 503);
      const perPack = parseInt(Deno.env.get("STRIPE_CREDITS_PER_PACK") || "100", 10) || 100;
      const quantity = Math.min(Math.max(parseInt(String(body.quantity ?? "1"), 10) || 1, 1), 20);
      const credits = perPack * quantity;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price, quantity }],
        client_reference_id: userId,
        metadata: { user_id: userId, kind: "credits", credits: String(credits) },
        payment_intent_data: { metadata: { user_id: userId, kind: "credits", credits: String(credits) } },
        customer_email: email || undefined,
        success_url: `${origin}/account?credits=1`,
        cancel_url: `${origin}/account?canceled=1`,
      });
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: Pro subscription.
    const price = Deno.env.get("STRIPE_PRICE_ID");
    if (!price) throw new EntitlementError("Billing is not configured.", 503);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: userId,
      metadata: { user_id: userId },
      subscription_data: { metadata: { user_id: userId } },
      customer_email: email || undefined,
      allow_promotion_codes: true,
      success_url: `${origin}/?upgraded=1`,
      cancel_url: `${origin}/?canceled=1`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("polished-create-checkout error:", e);
    const status = e instanceof EntitlementError ? e.status : 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Checkout failed" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

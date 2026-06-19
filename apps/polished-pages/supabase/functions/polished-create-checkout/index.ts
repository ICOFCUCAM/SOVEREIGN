import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17?target=deno";
import { getUserContext, EntitlementError } from "../_shared/entitlements.ts";

// Creates a Stripe Checkout Session to upgrade the signed-in user to Pro.
// The user id travels on the session (client_reference_id) and the subscription
// (metadata.user_id) so the webhook can flip the right account to 'pro'.

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
    const price = Deno.env.get("STRIPE_PRICE_ID");
    if (!secret || !price) throw new EntitlementError("Billing is not configured.", 503);

    const origin = req.headers.get("origin") || Deno.env.get("PUBLIC_SITE_URL") || "";

    const stripe = new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });
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

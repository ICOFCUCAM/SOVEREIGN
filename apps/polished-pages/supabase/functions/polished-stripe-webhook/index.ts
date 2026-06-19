import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17?target=deno";

// Stripe webhook for Polished Pages subscriptions. Verifies the signature, then
// flips the user's entitlement to 'pro' (active subscription) or 'free'
// (cancelled). The user id rides on the session / subscription metadata, so no
// customer->user lookup table is needed. Deploy with verify_jwt = false — Stripe
// authenticates via the signature, not a Supabase token (see config.toml).

serve(async (req) => {
  const secret = Deno.env.get("STRIPE_SECRET_KEY");
  const whSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !whSecret || !supabaseUrl || !serviceKey) {
    return new Response("not configured", { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  const stripe = new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, whSecret, undefined, Stripe.createSubtleCryptoProvider());
  } catch (e) {
    console.error("webhook signature verification failed:", e instanceof Error ? e.message : e);
    return new Response("bad signature", { status: 400 });
  }

  const applyPlan = async (userId: string, plan: "free" | "pro", customer: unknown, subscription: unknown): Promise<void> => {
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/polished_apply_subscription`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: serviceKey, authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({
        p_user_id: userId, p_plan: plan,
        p_customer: typeof customer === "string" ? customer : null,
        p_subscription: typeof subscription === "string" ? subscription : null,
      }),
    });
    if (!r.ok) console.error("polished_apply_subscription failed", r.status, await r.text().catch(() => ""));
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.client_reference_id || (s.metadata?.user_id ?? null);
        if (userId) await applyPlan(userId, "pro", s.customer, s.subscription);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) {
          const active = sub.status === "active" || sub.status === "trialing";
          await applyPlan(userId, active ? "pro" : "free", sub.customer, sub.id);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) await applyPlan(userId, "free", sub.customer, sub.id);
        break;
      }
    }
  } catch (e) {
    console.error("webhook handler error:", e instanceof Error ? e.message : e);
    return new Response("handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});

// subscription-checkout: creates a Stripe Checkout Session for an Emergency AI
// plan. The webhook (stripe-webhook) finalizes the subscriptions row.
//
// Body: { plan: 'evaluator' | 'operator' | 'institutional', user_id, email, return_url }
// Returns: { url } — the Checkout URL to redirect to.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const PRICE_MAP: Record<string, string | undefined> = {
  evaluator:     Deno.env.get('STRIPE_PRICE_EVALUATOR'),
  operator:      Deno.env.get('STRIPE_PRICE_OPERATOR'),
  institutional: Deno.env.get('STRIPE_PRICE_INSTITUTIONAL'),
};

async function stripe<T>(path: string, body: Record<string, string>): Promise<T> {
  const params = new URLSearchParams(body);
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${STRIPE_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`stripe ${path} ${r.status}: ${text}`);
  }
  return (await r.json()) as T;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!STRIPE_KEY) return json({ error: 'STRIPE_SECRET_KEY not configured' }, 503);

  let body: { plan?: string; user_id?: string; email?: string; return_url?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const plan = body.plan || '';
  const userId = body.user_id || '';
  const email = body.email || '';
  if (!plan || !userId || !email) return json({ error: 'plan, user_id, email required' }, 400);

  const priceId = PRICE_MAP[plan];
  if (!priceId) return json({ error: `No Stripe price configured for plan ${plan}` }, 400);

  const returnUrl = body.return_url || 'https://emergency.ai/console/billing';

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });

  // Reuse an existing customer if one exists for this user.
  const { data: existing } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe<{ id: string }>('customers', {
      email,
      'metadata[user_id]': userId,
      'metadata[app]': 'emergency-ai',
    });
    customerId = customer.id;
  }

  const session = await stripe<{ url: string; id: string }>('checkout/sessions', {
    mode: 'subscription',
    customer: customerId,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'success_url': `${returnUrl}?success=1&session_id={CHECKOUT_SESSION_ID}`,
    'cancel_url': `${returnUrl}?canceled=1`,
    'subscription_data[metadata][user_id]': userId,
    'subscription_data[metadata][plan]': plan,
    'subscription_data[metadata][app]': 'emergency-ai',
    'metadata[user_id]': userId,
    'metadata[plan]': plan,
    'metadata[app]': 'emergency-ai',
    'client_reference_id': userId,
    allow_promotion_codes: 'true',
  });

  return json({ url: session.url });
});

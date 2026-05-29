// subscription-portal: opens the Stripe Customer Portal for the signed-in user.
// Body: { user_id, return_url }

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';

async function stripe<T>(path: string, body: Record<string, string>): Promise<T> {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${STRIPE_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  if (!r.ok) throw new Error(`stripe ${path} ${r.status}: ${await r.text()}`);
  return (await r.json()) as T;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!STRIPE_KEY) return json({ error: 'STRIPE_SECRET_KEY not configured' }, 503);

  let body: { user_id?: string; return_url?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const userId = body.user_id || '';
  if (!userId) return json({ error: 'user_id required' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const customerId = sub?.stripe_customer_id as string | undefined;
  if (!customerId) return json({ error: 'No Stripe customer found for this user' }, 404);

  const session = await stripe<{ url: string }>('billing_portal/sessions', {
    customer: customerId,
    return_url: body.return_url || 'https://emergency.ai/console/billing',
  });

  return json({ url: session.url });
});

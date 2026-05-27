import { createClient } from 'jsr:@supabase/supabase-js@2';

// Stripe webhook → plan management. Verifies the Stripe signature (HMAC-SHA256 over
// `${timestamp}.${payload}` with STRIPE_WEBHOOK_SECRET), then maps subscription events to
// api_clients.plan. Dormant (501) until STRIPE_WEBHOOK_SECRET is configured.
//
// Map your Stripe Price IDs → plans via STRIPE_PRICE_<PLAN> env (e.g. STRIPE_PRICE_PRO).

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=')) as [string, string][]);
  const t = parts['t'];
  const v1 = parts['v1'];
  if (!t || !v1) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

function planForPrice(priceId: string | undefined): string | null {
  for (const plan of ['free', 'basic', 'pro', 'enterprise']) {
    if (priceId && Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}`) === priceId) return plan;
  }
  return null;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Billing dormant — set STRIPE_WEBHOOK_SECRET.' }), { status: 501, headers: { 'Content-Type': 'application/json' } });
  }

  const payload = await req.text();
  const sigHeader = req.headers.get('stripe-signature') ?? '';
  if (!(await verifyStripeSignature(payload, sigHeader, secret))) {
    return new Response(JSON.stringify({ error: 'invalid signature' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });

  try {
    const event = JSON.parse(payload) as { type: string; data: { object: Record<string, unknown> } };
    const obj = event.data.object;
    const customerId = (obj.customer as string) ?? null;

    let plan: string | null = null;
    if (event.type === 'customer.subscription.deleted') {
      plan = 'free';
    } else if (event.type.startsWith('customer.subscription.')) {
      const items = (obj.items as { data?: { price?: { id?: string } }[] } | undefined)?.data ?? [];
      plan = planForPrice(items[0]?.price?.id);
    }

    if (customerId && plan) {
      const renews = obj.current_period_end ? new Date(Number(obj.current_period_end) * 1000).toISOString() : null;
      await admin.from('api_clients').update({ plan, plan_renews_at: renews }).eq('stripe_customer_id', customerId);
      const { data: client } = await admin.from('api_clients').select('id').eq('stripe_customer_id', customerId).single();
      await admin.from('plan_events').insert({ client_id: client?.id ?? null, event: event.type, plan, raw: obj });
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

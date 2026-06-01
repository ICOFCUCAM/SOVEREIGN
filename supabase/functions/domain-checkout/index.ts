// domain-checkout: dual-path purchase entry.
//   • stripe   — Stripe Checkout session with manual capture (auth-hold).
//   • invoice  — creates a 'requested' order; admin approves & registers.
// Ownership enforced via the caller's JWT; pricing is computed server-side from
// a fresh Openprovider check so retail/cost can't be tampered with by the client.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

const DEFAULT_BASE = 'https://api.openprovider.eu';
const MARKUP_BPS = Number(Deno.env.get('DOMAIN_MARKUP_BPS') || '1500');
const SITE_URL = Deno.env.get('SITE_URL') || Deno.env.get('PUBLIC_SITE_URL') || 'https://sovereigndo.com';
const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';

function clean(v?: string): string | undefined {
  let s = (v ?? '').trim();
  const dq = '"', sq = "'";
  if (s.length >= 2 && ((s[0] === dq && s.at(-1) === dq) || (s[0] === sq && s.at(-1) === sq))) s = s.slice(1, -1);
  return s || undefined;
}
const retail = (cost: number) => Math.round(cost * (1 + MARKUP_BPS / 10000) * 100) / 100;

async function opCheck(base: string, name: string, ext: string): Promise<{ available: boolean; cost: number; currency: string }> {
  const r1 = await fetch(base + '/v1beta/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: clean(Deno.env.get('OPENPROVIDER_USERNAME')), password: clean(Deno.env.get('OPENPROVIDER_PASSWORD')), ip: '0.0.0.0' }),
  });
  const b1 = await r1.json().catch(() => ({})) as { code?: number; desc?: string; data?: { token?: string } };
  if (!r1.ok || (b1?.code && b1.code !== 0) || !b1?.data?.token) throw new Error(b1?.desc || 'Openprovider auth failed');
  const r2 = await fetch(base + '/v1beta/domains/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${b1.data.token}` },
    body: JSON.stringify({ domains: [{ name, extension: ext }], with_price: true }),
  });
  const b2 = await r2.json().catch(() => ({})) as { code?: number; desc?: string; data?: { results?: Array<{ status: string; price?: { reseller?: { price?: number; currency?: string }; product?: { price?: number; currency?: string } } }> } };
  if (!r2.ok || (b2?.code && b2.code !== 0)) throw new Error(b2?.desc || 'Openprovider check failed');
  const row = b2?.data?.results?.[0]; if (!row) throw new Error('No availability result');
  const p = row.price?.reseller ?? row.price?.product;
  return { available: row.status === 'free', cost: typeof p?.price === 'number' ? p.price : 0, currency: p?.currency || 'USD' };
}

async function createStripeCheckout(args: { domain: string; amount: number; currency: string; metadata: Record<string, string> }) {
  if (!STRIPE_KEY) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing).');
  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('payment_intent_data[capture_method]', 'manual');
  form.set('line_items[0][quantity]', '1');
  form.set('line_items[0][price_data][currency]', args.currency.toLowerCase());
  form.set('line_items[0][price_data][unit_amount]', String(Math.round(args.amount * 100)));
  form.set('line_items[0][price_data][product_data][name]', `Domain registration · ${args.domain}`);
  form.set('success_url', `${SITE_URL}/deployments?order={CHECKOUT_SESSION_ID}`);
  form.set('cancel_url', `${SITE_URL}/search?order=cancelled`);
  for (const [k, v] of Object.entries(args.metadata)) form.set(`metadata[${k}]`, v);
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${STRIPE_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b?.error?.message || 'Stripe session create failed');
  return { id: b.id as string, url: b.url as string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const base = (Deno.env.get('OPENPROVIDER_BASE_URL') || DEFAULT_BASE).trim().replace(/\/+$/, '').replace(/\/v1beta$/i, '');
  const authz = req.headers.get('Authorization') || '';
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authz } }, auth: { persistSession: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  try {
    const body = await req.json().catch(() => ({}));
    const domain = String(body?.domain || '').toLowerCase().trim();
    const dot = domain.indexOf('.');
    if (dot === -1) return json({ error: 'Invalid domain' }, 400);
    const name = domain.slice(0, dot); const ext = domain.slice(dot + 1);
    const years = Math.max(1, Math.min(10, Number(body?.years) || 1));
    const payment_method = (body?.payment_method as string) || 'stripe';
    if (!['stripe', 'invoice'].includes(payment_method)) return json({ error: 'Unsupported payment_method' }, 400);
    const registrant_profile_id = body?.registrant_profile_id as string | undefined;
    if (!registrant_profile_id) return json({ error: 'registrant_profile_id is required' }, 400);

    const { data: profile } = await userClient.from('registrant_profiles').select('id, email').eq('id', registrant_profile_id).maybeSingle();
    if (!profile) return json({ error: 'Profile not found or not owned' }, 403);

    const live = await opCheck(base, name, ext);
    if (!live.available) return json({ error: 'Domain is not available' }, 409);
    const cost = live.cost * years;
    const retailAmt = retail(cost);

    const initialStatus = payment_method === 'stripe' ? 'awaiting_payment' : 'requested';
    const { data: order, error: oerr } = await userClient.from('domain_orders').insert({
      domain, tld: ext, years, registrant_profile_id,
      status: initialStatus, payment_method,
      cost_amount: cost, retail_amount: retailAmt, currency: live.currency, markup_bps: MARKUP_BPS,
      contact_email: (body?.contact_email as string) || profile.email || null,
      company_name: (body?.company_name as string) || null,
      notes: (body?.notes as string) || null,
    }).select().single();
    if (oerr || !order) return json({ error: oerr?.message || 'Order create failed' }, 500);

    await admin.from('audit_logs').insert({ actor_email: 'domain-checkout', action: `order.create.${payment_method}`, resource_type: 'domain_order', resource_id: order.id, changes: { domain, retail: retailAmt, currency: live.currency } });

    if (payment_method === 'invoice') return json({ order, checkout_url: null });

    try {
      const session = await createStripeCheckout({ domain, amount: retailAmt, currency: live.currency, metadata: { order_id: order.id, owner: order.owner, domain } });
      await admin.from('domain_orders').update({ stripe_session_id: session.id, updated_at: new Date().toISOString() }).eq('id', order.id);
      return json({ order: { ...order, stripe_session_id: session.id }, checkout_url: session.url });
    } catch (e) {
      await admin.from('domain_orders').update({ status: 'failed', error: (e as Error).message, updated_at: new Date().toISOString() }).eq('id', order.id);
      return json({ error: (e as Error).message }, 502);
    }
  } catch (e) {
    return json({ error: (e as Error).message || 'Checkout failed' }, 502);
  }
});

// domain-register: the irreversible step. Admin-callable. Idempotent.
//   • Reads the order + registrant.
//   • Calls Openprovider domain-create.
//   • On success — captures the Stripe PaymentIntent (stripe path) or just
//     marks registered (invoice/manual paths). Records op_domain_id, audits.
//   • On failure — voids the PaymentIntent (stripe path) so the auth-hold is
//     released; marks the order failed. Audits.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

const DEFAULT_BASE = 'https://api.openprovider.eu';
const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const NAMESERVERS = (Deno.env.get('SOVEREIGN_NAMESERVERS') || 'ns1.openprovider.nl,ns2.openprovider.be,ns3.openprovider.eu')
  .split(',').map((s) => s.trim()).filter(Boolean);

function clean(v?: string): string | undefined {
  let s = (v ?? '').trim();
  const dq = '"', sq = "'";
  if (s.length >= 2 && ((s[0] === dq && s.at(-1) === dq) || (s[0] === sq && s.at(-1) === sq))) s = s.slice(1, -1);
  return s || undefined;
}

async function opLogin(base: string): Promise<string> {
  const r = await fetch(base + '/v1beta/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: clean(Deno.env.get('OPENPROVIDER_USERNAME')), password: clean(Deno.env.get('OPENPROVIDER_PASSWORD')), ip: '0.0.0.0' }),
  });
  const b = await r.json().catch(() => ({})) as { code?: number; desc?: string; data?: { token?: string } };
  if (!r.ok || (b?.code && b.code !== 0) || !b?.data?.token) throw new Error(b?.desc || 'Openprovider auth failed');
  return b.data.token as string;
}

async function opCreateDomain(base: string, token: string, args: { name: string; ext: string; period: number; handle: string }): Promise<{ id?: number | string }> {
  const r = await fetch(base + '/v1beta/domains', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      domain: { name: args.name, extension: args.ext },
      period: args.period,
      owner_handle: args.handle, admin_handle: args.handle, tech_handle: args.handle, billing_handle: args.handle,
      name_servers: NAMESERVERS.map((n) => ({ name: n })),
      use_domicile: false,
      autorenew: 'off',
    }),
  });
  const b = await r.json().catch(() => ({})) as { code?: number; desc?: string; data?: { id?: number | string } };
  if (!r.ok || (b?.code && b.code !== 0)) throw new Error(b?.desc || `Openprovider domain create failed (${r.status})`);
  return b?.data ?? {};
}

async function stripeCapture(intentId: string): Promise<void> {
  if (!STRIPE_KEY) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing).');
  const r = await fetch(`https://api.stripe.com/v1/payment_intents/${intentId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${STRIPE_KEY}` },
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b?.error?.message || 'Stripe capture failed');
}

async function stripeCancel(intentId: string): Promise<void> {
  if (!STRIPE_KEY) return;
  await fetch(`https://api.stripe.com/v1/payment_intents/${intentId}/cancel`, {
    method: 'POST', headers: { Authorization: `Bearer ${STRIPE_KEY}` },
  }).catch(() => undefined);
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
    const orderId = body?.order_id as string | undefined;
    if (!orderId) return json({ error: 'order_id is required' }, 400);

    // Only admins can trigger registration (RLS update policy requires is_admin()).
    const { data: caller } = await userClient.from('user_roles').select('role').limit(1).maybeSingle();
    if (!caller || caller.role !== 'admin') return json({ error: 'Admin role required' }, 403);

    const { data: order } = await admin.from('domain_orders').select('*').eq('id', orderId).maybeSingle();
    if (!order) return json({ error: 'Order not found' }, 404);
    if (['registered', 'registering'].includes(order.status)) return json({ ok: true, order, cached: true });

    // For stripe path, require payment_authorized. For invoice/manual, require paid or quoted/approved.
    const ok = order.payment_method === 'stripe'
      ? order.status === 'payment_authorized'
      : ['paid', 'requested', 'quoted', 'invoiced', 'draft'].includes(order.status);
    if (!ok) return json({ error: `Order not eligible for registration (status: ${order.status})` }, 409);

    // Resolve the registrant + ensure the OP customer handle exists.
    const { data: profile } = await admin.from('registrant_profiles').select('*').eq('id', order.registrant_profile_id).maybeSingle();
    if (!profile?.op_handle) return json({ error: 'Registrant identity must be verified with the registry first' }, 412);

    await admin.from('domain_orders').update({ status: 'registering', updated_at: new Date().toISOString() }).eq('id', order.id);

    let token = '';
    try { token = await opLogin(base); }
    catch (e) {
      await admin.from('domain_orders').update({ status: 'failed', error: (e as Error).message, updated_at: new Date().toISOString() }).eq('id', order.id);
      return json({ error: (e as Error).message }, 502);
    }

    try {
      const res = await opCreateDomain(base, token, { name: order.domain.split('.')[0], ext: order.tld, period: order.years, handle: profile.op_handle });
      const opDomainId = res?.id != null ? String(res.id) : null;

      // Capture the auth-hold (stripe path) — only after the provider accepted the create.
      if (order.payment_method === 'stripe' && order.stripe_payment_intent) {
        try { await stripeCapture(order.stripe_payment_intent); }
        catch (cap) {
          // Provider succeeded but capture failed — leave the registration but mark partial.
          await admin.from('domain_orders').update({ status: 'registered', op_domain_id: opDomainId, registered_at: new Date().toISOString(), error: `Capture failed: ${(cap as Error).message}`, updated_at: new Date().toISOString() }).eq('id', order.id);
          await admin.from('audit_logs').insert({ actor_email: 'domain-register', action: 'register.partial', resource_type: 'domain_order', resource_id: order.id, changes: { domain: order.domain, capture_error: (cap as Error).message } });
          return json({ ok: true, order, warning: 'Domain registered but payment capture failed; reconcile in Stripe.' });
        }
      }

      const patch: Record<string, unknown> = { status: 'registered', op_domain_id: opDomainId, registered_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      if (order.payment_method === 'stripe') patch.captured_at = new Date().toISOString();
      await admin.from('domain_orders').update(patch).eq('id', order.id);
      await admin.from('audit_logs').insert({ actor_email: 'domain-register', action: 'register.success', resource_type: 'domain_order', resource_id: order.id, changes: { domain: order.domain, op_domain_id: opDomainId, path: order.payment_method } });
      return json({ ok: true, order: { ...order, ...patch } });
    } catch (e) {
      // Provider rejected — void the auth-hold so the customer isn't charged.
      if (order.payment_method === 'stripe' && order.stripe_payment_intent) await stripeCancel(order.stripe_payment_intent);
      await admin.from('domain_orders').update({ status: 'failed', error: (e as Error).message, updated_at: new Date().toISOString() }).eq('id', order.id);
      await admin.from('audit_logs').insert({ actor_email: 'domain-register', action: 'register.failed', resource_type: 'domain_order', resource_id: order.id, changes: { domain: order.domain, error: (e as Error).message } });
      return json({ error: (e as Error).message }, 502);
    }
  } catch (e) {
    return json({ error: (e as Error).message || 'Registration failed' }, 502);
  }
});

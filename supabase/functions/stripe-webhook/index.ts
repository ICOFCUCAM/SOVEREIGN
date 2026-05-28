// stripe-webhook: verifies Stripe signature and transitions the order on
// payment events. Auth-hold model:
//   checkout.session.completed     → store payment_intent id
//   payment_intent.amount_capturable_updated → status = payment_authorized
//   payment_intent.canceled        → status = voided
//   charge.refunded                → status = refunded

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

async function verifyStripeSignature(payload: string, signature: string, secret: string, toleranceSec = 300): Promise<boolean> {
  // Stripe header: t=timestamp,v1=hex...,v0=hex...
  const parts = Object.fromEntries(signature.split(',').map((p) => p.trim().split('=', 2)));
  const t = parts['t']; const v1 = parts['v1'];
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  // Constant-time compare.
  if (hex.length !== v1.length) return false;
  let diff = 0; for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!WEBHOOK_SECRET) return json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, 503);

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const sig = req.headers.get('stripe-signature') || '';
  const raw = await req.text();
  if (!(await verifyStripeSignature(raw, sig, WEBHOOK_SECRET))) {
    return json({ error: 'Invalid Stripe signature' }, 401);
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try { event = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const obj = event.data?.object as Record<string, unknown>;
  const metadata = (obj?.metadata || {}) as Record<string, string>;
  const orderIdFromMeta = metadata.order_id;
  const piFromSession = (obj as { payment_intent?: string }).payment_intent;
  const piFromIntent = (obj as { id?: string }).id;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        if (!orderIdFromMeta) break;
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (typeof piFromSession === 'string') patch.stripe_payment_intent = piFromSession;
        await admin.from('domain_orders').update(patch).eq('id', orderIdFromMeta);
        await admin.from('audit_logs').insert({ actor_email: 'stripe-webhook', action: 'stripe.session.completed', resource_type: 'domain_order', resource_id: orderIdFromMeta, changes: { payment_intent: piFromSession } });
        break;
      }
      case 'payment_intent.amount_capturable_updated':
      case 'payment_intent.requires_action': {
        // Card has been authorized (manual capture). Move order forward.
        const pi = typeof piFromIntent === 'string' ? piFromIntent : '';
        if (!pi) break;
        const { data: order } = await admin.from('domain_orders').select('id, status').eq('stripe_payment_intent', pi).maybeSingle();
        if (order && ['awaiting_payment', 'draft'].includes(order.status as string)) {
          await admin.from('domain_orders').update({ status: 'payment_authorized', updated_at: new Date().toISOString() }).eq('id', order.id);
          await admin.from('audit_logs').insert({ actor_email: 'stripe-webhook', action: 'stripe.payment_authorized', resource_type: 'domain_order', resource_id: order.id, changes: { payment_intent: pi } });
        }
        break;
      }
      case 'payment_intent.canceled': {
        const pi = typeof piFromIntent === 'string' ? piFromIntent : '';
        if (!pi) break;
        const { data: order } = await admin.from('domain_orders').select('id').eq('stripe_payment_intent', pi).maybeSingle();
        if (order) {
          await admin.from('domain_orders').update({ status: 'voided', updated_at: new Date().toISOString() }).eq('id', order.id);
          await admin.from('audit_logs').insert({ actor_email: 'stripe-webhook', action: 'stripe.voided', resource_type: 'domain_order', resource_id: order.id, changes: { payment_intent: pi } });
        }
        break;
      }
      case 'charge.refunded': {
        const pi = (obj as { payment_intent?: string }).payment_intent;
        if (!pi) break;
        const { data: order } = await admin.from('domain_orders').select('id').eq('stripe_payment_intent', pi).maybeSingle();
        if (order) {
          await admin.from('domain_orders').update({ status: 'refunded', updated_at: new Date().toISOString() }).eq('id', order.id);
          await admin.from('audit_logs').insert({ actor_email: 'stripe-webhook', action: 'stripe.refunded', resource_type: 'domain_order', resource_id: order.id, changes: { payment_intent: pi } });
        }
        break;
      }
    }
  } catch (e) {
    // Don't fail Stripe back — log and 200 so Stripe doesn't retry into a loop.
    await admin.from('audit_logs').insert({ actor_email: 'stripe-webhook', action: 'stripe.error', resource_type: 'domain_order', resource_id: orderIdFromMeta || null, changes: { error: (e as Error).message, type: event.type } });
  }
  return json({ received: true });
});

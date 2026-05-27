// op-customer: create an Openprovider customer handle from an owned registrant
// profile. Ownership enforced via the caller's JWT (RLS read); op_handle is
// written back with the service role. Customer handles are free — no money.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });

const DEFAULT_BASE = 'https://api.openprovider.eu';
function clean(v?: string) { let s = (v ?? '').trim(); if (s.length >= 2 && ((s[0] === '"' && s.at(-1) === '"') || (s[0] === "'" && s.at(-1) === "'"))) s = s.slice(1, -1); return s || undefined; }

async function opLogin(base: string): Promise<string> {
  const r = await fetch(base + '/v1beta/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: clean(Deno.env.get('OPENPROVIDER_USERNAME')), password: clean(Deno.env.get('OPENPROVIDER_PASSWORD')), ip: '0.0.0.0' }) });
  const b = await r.json().catch(() => ({}));
  if (!r.ok || (b?.code && b.code !== 0) || !b?.data?.token) throw new Error(b?.desc || 'Openprovider auth failed');
  return b.data.token as string;
}

interface Profile {
  company_name?: string | null; first_name: string; last_name: string; email: string;
  phone_country_code: string; phone_area_code?: string | null; phone_subscriber: string;
  street: string; city: string; state?: string | null; zipcode: string; country: string;
}

function splitStreet(input: string): { street: string; number: string } {
  const lead = input.match(/^(\d+[\w-]*)\s+(.+)$/);   // "350 Fifth Avenue"
  if (lead) return { number: lead[1], street: lead[2] };
  const trail = input.match(/^(.+?)\s+(\d+[\w-]*)$/);  // "Fifth Avenue 350"
  if (trail) return { street: trail[1], number: trail[2] };
  return { street: input, number: ' ' };
}

function toCustomerPayload(p: Profile) {
  const { street, number } = splitStreet(p.street);
  const cc = p.phone_country_code.startsWith('+') ? p.phone_country_code : `+${p.phone_country_code.replace(/\D/g, '')}`;
  return {
    company_name: p.company_name || undefined,
    name: { first_name: p.first_name, last_name: p.last_name },
    address: { street, number, zipcode: p.zipcode, city: p.city, state: p.state || undefined, country: p.country.toUpperCase() },
    phone: { country_code: cc, area_code: (p.phone_area_code || '').replace(/\D/g, ''), subscriber_number: p.phone_subscriber.replace(/\D/g, '') },
    email: p.email,
    locale: 'en_US',
  };
}

async function createCustomer(base: string, token: string, p: Profile): Promise<string> {
  const r = await fetch(base + '/v1beta/customers', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(toCustomerPayload(p)) });
  const b = await r.json().catch(() => ({}));
  if (!r.ok || (b?.code && b.code !== 0)) throw new Error(b?.desc || `Customer create failed (${r.status})`);
  if (!b?.data?.handle) throw new Error('Provider returned no customer handle');
  return b.data.handle as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const base = (Deno.env.get('OPENPROVIDER_BASE_URL') || DEFAULT_BASE).trim().replace(/\/+$/, '').replace(/\/v1beta$/i, '');
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  try {
    const body = await req.json().catch(() => ({}));
    const authz = req.headers.get('Authorization') || '';
    const profileId = body?.profile_id as string | undefined;
    if (!profileId) return json({ error: 'profile_id is required' }, 400);

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authz } }, auth: { persistSession: false } });
    const { data: profile, error } = await userClient.from('registrant_profiles').select('*').eq('id', profileId).maybeSingle();
    if (error || !profile) return json({ error: 'Profile not found or not owned by caller' }, 403);
    if (profile.op_handle) return json({ handle: profile.op_handle, cached: true });

    const token = await opLogin(base);
    const handle = await createCustomer(base, token, profile as Profile);
    await admin.from('registrant_profiles').update({ op_handle: handle, updated_at: new Date().toISOString() }).eq('id', profileId);
    await admin.from('audit_logs').insert({ actor_email: 'op-customer', action: 'registrant.handle', resource_type: 'registrant', resource_id: profileId, changes: { handle } });
    return json({ handle });
  } catch (e) {
    return json({ error: (e as Error).message || 'Customer handle creation failed' }, 502);
  }
});

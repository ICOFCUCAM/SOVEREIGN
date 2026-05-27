// connect-domain: prove control of an externally-registered domain via a DNS
// TXT challenge. 'init' issues a token + the TXT record to publish; 'verify'
// resolves the record over DNS-over-HTTPS and marks the connection verified.
// Ownership is enforced via the caller's JWT (RLS). No money, no registration.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });
const CHALLENGE_HOST = '_sovereign-challenge';

function normalizeDomain(input: string): string | null {
  const s = (input || '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s)) return null;
  return s;
}

// Resolve TXT records via DNS-over-HTTPS (Google), falling back to Cloudflare.
async function resolveTxt(name: string): Promise<string[]> {
  const parse = (j: { Answer?: Array<{ type: number; data: string }> }) =>
    (j.Answer ?? []).filter((a) => a.type === 16).map((a) => a.data.replace(/^"|"$/g, '').replace(/\\"/g, '"'));
  try {
    const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT`, { headers: { accept: 'application/dns-json' } });
    if (r.ok) return parse(await r.json());
  } catch { /* fall through */ }
  try {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`, { headers: { accept: 'application/dns-json' } });
    if (r.ok) return parse(await r.json());
  } catch { /* ignore */ }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const authz = req.headers.get('Authorization') || '';
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authz } }, auth: { persistSession: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    if (action === 'init') {
      const domain = normalizeDomain(body?.domain || '');
      if (!domain) return json({ error: 'Enter a valid domain.' }, 400);
      const token = `sovereign-verify=${crypto.randomUUID().replace(/-/g, '')}`;
      const { data: existing } = await userClient.from('domain_connections').select('id').eq('domain', domain).maybeSingle();
      let row;
      if (existing) {
        const { data, error } = await userClient.from('domain_connections').update({ token, verified: false, status: 'pending', updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
        if (error) return json({ error: error.message }, 400); row = data;
      } else {
        const { data, error } = await userClient.from('domain_connections').insert({ domain, token }).select().single();
        if (error) return json({ error: error.message }, 400); row = data;
      }
      return json({ connection: row, record: { type: 'TXT', host: CHALLENGE_HOST, name: `${CHALLENGE_HOST}.${domain}`, value: token } });
    }

    if (action === 'verify') {
      const id = body?.connection_id as string | undefined;
      if (!id) return json({ error: 'connection_id is required' }, 400);
      const { data: conn } = await userClient.from('domain_connections').select('*').eq('id', id).maybeSingle();
      if (!conn) return json({ error: 'Connection not found or not owned by caller' }, 403);
      const txt = await resolveTxt(`${CHALLENGE_HOST}.${conn.domain}`);
      const ok = txt.includes(conn.token);
      if (ok) {
        await admin.from('domain_connections').update({ verified: true, verified_at: new Date().toISOString(), status: 'verified', updated_at: new Date().toISOString() }).eq('id', id);
        await admin.from('audit_logs').insert({ actor_email: 'connect-domain', action: 'domain.connect.verified', resource_type: 'domain_connection', resource_id: id, changes: { domain: conn.domain } });
      }
      return json({ verified: ok, found: txt });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || 'Connect failed' }, 502);
  }
});

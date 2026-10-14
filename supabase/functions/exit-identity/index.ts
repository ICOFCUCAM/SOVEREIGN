// ExitOS · identity verification before listing a company.
//
//   GET                                   which methods are switched on, and the caller's current verification
//   POST { action: "start", provider, returnUrl }   begin: returns the provider's URL to send the founder to
//   POST { action: "complete", code, state }        finish an eID sign-in (OIDC authorization-code flow)
//   POST { action: "refresh" }                      re-read the caller's latest Stripe Identity session
//
// Methods:
//   stripe_identity  Stripe Identity: an identity document and a matching selfie, worldwide.
//                    Needs STRIPE_SECRET_KEY.
//   national eIDs    BankID Norway / Sweden, MitID, Finnish Trust Network, itsme, iDIN, German eID,
//                    FranceConnect, Smart-ID, through one OIDC broker (Criipto/Idura, Signicat, ...).
//                    Needs IDENTITY_BROKER_ISSUER (https://...), IDENTITY_BROKER_CLIENT_ID,
//                    IDENTITY_BROKER_CLIENT_SECRET and IDENTITY_REDIRECT_URI (the app's /console/intake,
//                    registered with the broker). Each eID is offered when the broker has an acr value
//                    for it: the defaults below are Criipto's; IDENTITY_ACR_<ID> overrides one, and
//                    IDENTITY_EIDS (comma list) limits which are offered.
//
// Every call identifies the caller from their own access token. Results are written with the
// service role into exitos_identity_verifications, which clients can read but never write; the
// database refuses a listing from an account without a current verification and stamps listings
// itself. No document image, personal number or birth date is stored: the provider keeps those.
// Secrets stay in the function's environment and never appear in a response.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

const EIDS: Record<string, string> = {
  no_bankid: 'urn:grn:authn:no:bankid',
  se_bankid: 'urn:grn:authn:se:bankid',
  dk_mitid: 'urn:grn:authn:dk:mitid:substantial',
  fi_ftn: 'urn:grn:authn:fi:all',
  be_itsme: 'urn:grn:authn:itsme:advanced',
  nl_idin: 'urn:grn:authn:nl:idin',
  de_eid: '', fr_franceconnect: '', ee_smartid: '',   // broker-specific: set IDENTITY_ACR_<ID>
};
const VALID_YEARS = 2;
const PENDING_MINUTES = 30;
const env = (k: string) => Deno.env.get(k) ?? '';

const acrFor = (id: string): string => env(`IDENTITY_ACR_${id.toUpperCase()}`) || EIDS[id] || '';
function enabledProviders(): Record<string, boolean> {
  const broker = !!(env('IDENTITY_BROKER_ISSUER') && env('IDENTITY_BROKER_CLIENT_ID') && env('IDENTITY_BROKER_CLIENT_SECRET') && env('IDENTITY_REDIRECT_URI'));
  const only = env('IDENTITY_EIDS').split(',').map((s) => s.trim()).filter(Boolean);
  const out: Record<string, boolean> = { stripe_identity: !!env('STRIPE_SECRET_KEY') };
  for (const id of Object.keys(EIDS)) out[id] = broker && !!acrFor(id) && (only.length === 0 || only.includes(id));
  return out;
}

const randomHex = (n: number) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');
async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const b64urlJson = (part: string): Record<string, unknown> =>
  JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')), (c) => c.charCodeAt(0))));
const stripe = (path: string, init: RequestInit = {}) =>
  fetch(`https://api.stripe.com/v1/${path}`, { ...init, headers: { Authorization: `Bearer ${env('STRIPE_SECRET_KEY')}`, 'content-type': 'application/x-www-form-urlencoded', ...(init.headers ?? {}) } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = env('SUPABASE_URL'), service = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !service) return json(500, { ok: false, error: 'server not configured' });
  const auth = req.headers.get('authorization') ?? '';
  if (!/^Bearer\s+\S+/i.test(auth)) return json(401, { ok: false, error: 'sign in to verify your identity' });
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: who } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  const uid = who?.user?.id;
  if (!uid) return json(401, { ok: false, error: 'sign in to verify your identity' });
  const table = () => admin.from('exitos_identity_verifications');
  const current = async () => (await table().select('provider, status, country, verified_at, expires_at')
    .eq('account_id', uid).eq('status', 'verified').gt('expires_at', new Date().toISOString())
    .order('verified_at', { ascending: false }).limit(1)).data?.[0] ?? null;
  const verified = (provider: string, country: string | null, subjectHash: string | null) => {
    const now = new Date(); const until = new Date(now); until.setFullYear(until.getFullYear() + VALID_YEARS);
    return { status: 'verified', country, subject_hash: subjectHash, verified_at: now.toISOString(), expires_at: until.toISOString(), failure: null };
  };

  if (req.method === 'GET') return json(200, { ok: true, providers: enabledProviders(), verification: await current() });
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method not allowed' });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json(400, { ok: false, error: 'invalid json' }); }
  const action = String(body.action ?? '');
  const enabled = enabledProviders();

  if (action === 'start') {
    const provider = String(body.provider ?? '');
    if (!(provider in enabled)) return json(400, { ok: false, error: 'unknown verification method' });
    if (!enabled[provider]) return json(409, { ok: false, error: 'this verification method is not available yet' });
    // the founder comes back to the page they started from, on the same site only
    let back: URL;
    try { back = new URL(String(body.returnUrl ?? '')); } catch { return json(400, { ok: false, error: 'returnUrl required' }); }
    const origin = req.headers.get('origin');
    if (!origin || back.origin !== origin) return json(400, { ok: false, error: 'returnUrl must be on this site' });

    if (provider === 'stripe_identity') {
      back.searchParams.set('verify', 'stripe_identity');
      const form = new URLSearchParams({
        type: 'document', 'options[document][require_matching_selfie]': 'true', 'options[document][require_live_capture]': 'true',
        return_url: back.toString(), 'metadata[account_id]': uid, client_reference_id: uid,
      });
      const res = await stripe('identity/verification_sessions', { method: 'POST', body: form });
      const s = await res.json().catch(() => ({})) as { id?: string; url?: string; error?: { message?: string } };
      if (!res.ok || !s.id || !s.url) return json(502, { ok: false, error: `Stripe: ${s.error?.message ?? res.status}` });
      const { error } = await table().insert({ account_id: uid, provider, status: 'pending', provider_ref: s.id });
      if (error) return json(500, { ok: false, error: 'could not record the verification' });
      return json(200, { ok: true, url: s.url });
    }

    const state = randomHex(24), nonce = randomHex(24);
    const { error } = await table().insert({ account_id: uid, provider, status: 'pending', provider_ref: state, nonce });
    if (error) return json(500, { ok: false, error: 'could not record the verification' });
    const authorize = new URL(`${env('IDENTITY_BROKER_ISSUER').replace(/\/$/, '')}/oauth2/authorize`);
    authorize.search = new URLSearchParams({
      response_type: 'code', client_id: env('IDENTITY_BROKER_CLIENT_ID'), redirect_uri: env('IDENTITY_REDIRECT_URI'),
      scope: 'openid', state, nonce, acr_values: acrFor(provider), response_mode: 'query',
    }).toString();
    return json(200, { ok: true, url: authorize.toString() });
  }

  if (action === 'complete') {
    const code = String(body.code ?? ''), state = String(body.state ?? '');
    if (!/^[0-9a-f]{48}$/.test(state) || !code || code.length > 2048) return json(400, { ok: false, error: 'code and state required' });
    const since = new Date(Date.now() - PENDING_MINUTES * 60_000).toISOString();
    const { data: rows } = await table().select('id, provider, nonce').eq('account_id', uid).eq('provider_ref', state).eq('status', 'pending').gt('created_at', since).limit(1);
    const row = rows?.[0];
    if (!row) return json(400, { ok: false, error: 'this sign-in has expired or was not started here; start again' });
    const fail = async (why: string) => { await table().update({ status: 'failed', failure: why }).eq('id', row.id); return json(400, { ok: false, error: why }); };
    const issuer = env('IDENTITY_BROKER_ISSUER').replace(/\/$/, '');
    const res = await fetch(`${issuer}/oauth2/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', Authorization: `Basic ${btoa(`${encodeURIComponent(env('IDENTITY_BROKER_CLIENT_ID'))}:${encodeURIComponent(env('IDENTITY_BROKER_CLIENT_SECRET'))}`)}` },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: env('IDENTITY_REDIRECT_URI') }),
    });
    const tok = await res.json().catch(() => ({})) as { id_token?: string };
    if (!res.ok || !tok.id_token) return fail('the identity provider did not confirm the sign-in');
    // the ID token came straight from the broker's token endpoint over TLS, authenticated with the
    // client secret (OIDC Core 3.1.3.7); its claims are still checked against this request
    let c: Record<string, unknown>;
    try { c = b64urlJson(tok.id_token.split('.')[1] ?? ''); } catch { return fail('unreadable identity token'); }
    const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
    if (String(c.iss ?? '').replace(/\/$/, '') !== issuer) return fail('identity token from the wrong issuer');
    if (!aud.includes(env('IDENTITY_BROKER_CLIENT_ID'))) return fail('identity token for another application');
    if (c.nonce !== row.nonce) return fail('identity token does not belong to this sign-in');
    if (typeof c.exp !== 'number' || c.exp * 1000 < Date.now()) return fail('identity token expired');
    if (typeof c.sub !== 'string' || !c.sub) return fail('identity token without a subject');
    const country = typeof c.country === 'string' ? c.country.slice(0, 2).toUpperCase() : null;
    await table().update(verified(row.provider, country, await sha256Hex(`${issuer}|${c.sub}`))).eq('id', row.id);
    return json(200, { ok: true, verification: await current() });
  }

  if (action === 'refresh') {
    if (!enabled.stripe_identity) return json(409, { ok: false, error: 'Stripe Identity is not available yet' });
    const { data: rows } = await table().select('id, provider_ref').eq('account_id', uid).eq('provider', 'stripe_identity').eq('status', 'pending').order('created_at', { ascending: false }).limit(1);
    const row = rows?.[0];
    if (!row?.provider_ref) return json(200, { ok: true, status: 'none', verification: await current() });
    const res = await stripe(`identity/verification_sessions/${encodeURIComponent(row.provider_ref)}`);
    const s = await res.json().catch(() => ({})) as { status?: string; metadata?: { account_id?: string }; last_error?: { reason?: string } };
    if (!res.ok) return json(502, { ok: false, error: 'Stripe did not answer; try again' });
    if (s.metadata?.account_id !== uid) return json(403, { ok: false, error: 'this verification belongs to another account' });
    if (s.status === 'verified') await table().update(verified('stripe_identity', null, null)).eq('id', row.id);
    else if (s.status === 'canceled') await table().update({ status: 'canceled' }).eq('id', row.id);
    else if (s.status === 'requires_input' && s.last_error?.reason) await table().update({ failure: s.last_error.reason }).eq('id', row.id);
    return json(200, { ok: true, status: s.status ?? 'unknown', verification: await current() });
  }

  return json(400, { ok: false, error: 'unknown action' });
});

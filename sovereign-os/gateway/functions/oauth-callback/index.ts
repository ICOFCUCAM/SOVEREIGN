import { createClient } from 'jsr:@supabase/supabase-js@2';
import { exchangeCodeForToken } from '../_shared/oauth.ts';
import { encryptSecret } from '../_shared/vault.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OAuth redirect target. Exchanges the code for a token, encrypts it with the vault key,
// and stores it in social_connections attributed to the client carried in `state`.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
  const vaultKey = Deno.env.get('SOVEREIGN_VAULT_KEY');

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateRaw = url.searchParams.get('state');
    if (!code || !stateRaw) {
      return new Response(JSON.stringify({ error: 'Missing code or state.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    if (!vaultKey) {
      return new Response(JSON.stringify({ error: 'SOVEREIGN_VAULT_KEY not configured.' }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { client_id, platform } = JSON.parse(atob(stateRaw)) as { client_id: string; platform: string };
    const appClientId = Deno.env.get(`${platform.toUpperCase()}_OAUTH_CLIENT_ID`);
    const appSecret = Deno.env.get(`${platform.toUpperCase()}_OAUTH_CLIENT_SECRET`);
    const redirectUri = Deno.env.get('OAUTH_REDIRECT_URI');
    if (!appClientId || !appSecret || !redirectUri) {
      return new Response(JSON.stringify({ error: `Missing OAuth app config for ${platform}.` }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const token = await exchangeCodeForToken(platform, { code, clientId: appClientId, clientSecret: appSecret, redirectUri });

    const enc = await encryptSecret(token.access_token, vaultKey);
    const encRefresh = token.refresh_token ? await encryptSecret(token.refresh_token, vaultKey) : null;
    const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null;

    const { error } = await admin.from('social_connections').insert({
      client_id, platform, access_token: enc, refresh_token: encRefresh, expires_at: expiresAt,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ connected: true, client_id, platform }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

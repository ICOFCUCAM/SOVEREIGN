import { buildAuthorizeUrl, OAUTH_PROVIDERS } from '../_shared/oauth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
};

// Returns the provider authorize URL for a client to connect a social account.
// The signed `state` carries the client_id + platform so oauth-callback can attribute
// the resulting token. Admin-gated.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const adminSecret = Deno.env.get('ADMIN_SECRET');
  if (!adminSecret || req.headers.get('x-admin-secret') !== adminSecret) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  try {
    const { client_id, platform } = await req.json().catch(() => ({}));
    if (!OAUTH_PROVIDERS[platform]) {
      return new Response(JSON.stringify({ error: `Unsupported platform "${platform}".` }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    const appClientId = Deno.env.get(`${platform.toUpperCase()}_OAUTH_CLIENT_ID`);
    const redirectUri = Deno.env.get('OAUTH_REDIRECT_URI');
    if (!appClientId || !redirectUri) {
      return new Response(JSON.stringify({ error: `Set ${platform.toUpperCase()}_OAUTH_CLIENT_ID and OAUTH_REDIRECT_URI.` }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const state = btoa(JSON.stringify({ client_id, platform, n: crypto.randomUUID() }));
    const url = buildAuthorizeUrl(platform, { clientId: appClientId, redirectUri, state });
    return new Response(JSON.stringify({ authorize_url: url, state }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

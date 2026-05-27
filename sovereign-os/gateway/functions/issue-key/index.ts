import { createClient } from 'jsr:@supabase/supabase-js@2';
import { generateApiKey, type KeyEnv } from '../_shared/keys.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
};

// Issues an API key to a client (creating the client on first use). Admin-gated by
// ADMIN_SECRET. The plaintext key is returned ONCE and never stored — only its hash.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const adminSecret = Deno.env.get('ADMIN_SECRET');
  if (!adminSecret || req.headers.get('x-admin-secret') !== adminSecret) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });

  try {
    const { client_id, name, owner_email, env = 'live', scopes = ['publish'], rate_limit_per_month = 1000 } =
      await req.json().catch(() => ({}));

    // Resolve or create the client.
    let clientId = client_id as string | undefined;
    if (!clientId) {
      if (!name || !owner_email) {
        return new Response(JSON.stringify({ error: 'Provide client_id, or name + owner_email to create a client.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const { data: client, error } = await admin.from('api_clients').insert({ name, owner_email }).select('id').single();
      if (error) throw error;
      clientId = client.id;
    }

    const issued = await generateApiKey(env as KeyEnv);
    const { data: keyRow, error: kErr } = await admin.from('api_keys').insert({
      client_id: clientId,
      prefix: issued.prefix,
      last4: issued.last4,
      key_hash: issued.hash,
      scopes,
      rate_limit_per_month,
    }).select('id, prefix, last4, scopes, rate_limit_per_month, created_at').single();
    if (kErr) throw kErr;

    // The full key is shown exactly once.
    return new Response(JSON.stringify({ key: issued.key, ...keyRow, client_id: clientId }), {
      status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

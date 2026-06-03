// ExitOS Data Room · list endpoint.
//
// Returns documents in a tenant's data room, optionally filtered by
// roomKind, each with a short-lived signed download URL.
//
// Query: ?tenantId=...&roomKind=...
// Auth:  anon JWT (demo); tightens to founder-tenant JWT in production.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const SIGNED_URL_TTL = 60 * 60; // 1 hour

function err(status: number, message: string) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET')     return err(405, 'method not allowed');

  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') ?? '';
  const roomKind = url.searchParams.get('roomKind');
  if (!tenantId) return err(400, 'tenantId required');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) return err(500, 'server not configured');
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let q = admin
    .from('exit_data_room_documents')
    .select('id, room_kind, filename, mime, bytes, storage_path, classification, uploaded_by, uploaded_at, description')
    .eq('tenant_id', tenantId)
    .order('uploaded_at', { ascending: false });
  if (roomKind) q = q.eq('room_kind', roomKind);

  const { data, error } = await q;
  if (error) return err(500, error.message);

  const items: Array<Record<string, unknown>> = [];
  for (const row of data ?? []) {
    const signed = await admin.storage.from('exit-data-room').createSignedUrl(row.storage_path, SIGNED_URL_TTL);
    items.push({
      ...row,
      downloadUrl: signed.data?.signedUrl ?? null,
      downloadUrlExpiresIn: SIGNED_URL_TTL,
    });
  }

  // Audit the list call (one row regardless of result count)
  await admin.from('exit_data_room_access_log').insert({
    tenant_id: tenantId,
    action: 'list',
    details: { roomKind: roomKind ?? null, count: items.length },
  });

  return new Response(JSON.stringify({ ok: true, items }), {
    status: 200,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});

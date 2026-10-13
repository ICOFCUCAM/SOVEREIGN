// ExitOS Data Room · list endpoint.
//
// Returns documents in a tenant's data room, optionally filtered by
// roomKind, each with a short-lived signed download URL.
//
// Query: ?roomKind=...
// Auth:  the signed-in user's access token (Authorization: Bearer). The
//        tenant is that user; a tenantId in the query is ignored.

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

// The tenant is the signed-in user, read from their own access token — never
// from the request body or query, so one company cannot reach another's room.
// The public anon key is not a user and is refused.
async function tenantOf(req: Request, admin: ReturnType<typeof createClient>): Promise<string | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  const id = data.user.id;
  // the data-room rows hang off exit_tenants; a new account gets its row here
  await admin.from('exit_tenants').upsert(
    { id, company_name: 'Unnamed company', company_sector: 'unspecified', jurisdiction: 'unspecified' },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  return id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET')     return err(405, 'method not allowed');

  const url = new URL(req.url);
  const roomKind = url.searchParams.get('roomKind');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) return err(500, 'server not configured');
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const tenantId = await tenantOf(req, admin);
  if (!tenantId) return err(401, 'sign in to use the data room');

  let q = admin
    .from('exit_data_room_documents')
    .select('id, room_kind, filename, mime, bytes, storage_path, classification, uploaded_by, uploaded_at, description, artifact_id, company_id, review_state, reviewed_at, review_note, disclosure')
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

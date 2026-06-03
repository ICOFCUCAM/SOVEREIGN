// ExitOS Data Room · upload endpoint.
//
// Accepts a base64-encoded document + metadata, writes the bytes to
// the 'exit-data-room' bucket, inserts a metadata row, and emits an
// access-log entry. Returns the document record.
//
// Auth: anon JWT (demo). Production tightens this to founder-tenant
// JWT and verifies tenant_id matches sub.
//
// Body: { tenantId, roomKind, filename, mime, bytes, base64,
//          description?, classification?, principalId? }

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VALID_KINDS = new Set([
  'financial', 'market', 'user_growth', 'technical_architecture', 'security', 'legal', 'commercial',
]);

const VALID_CLASS = new Set(['unclassified', 'sensitive', 'confidential']);

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per upload (demo)

function err(status: number, message: string) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')   return err(405, 'method not allowed');

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return err(400, 'invalid json'); }

  const tenantId       = String(body.tenantId   ?? '');
  const roomKind       = String(body.roomKind   ?? '');
  const filename       = String(body.filename   ?? '').trim();
  const mime           = String(body.mime       ?? 'application/octet-stream');
  const bytes          = Number(body.bytes      ?? 0);
  const base64         = String(body.base64     ?? '');
  const description    = body.description ? String(body.description) : null;
  const classification = String(body.classification ?? 'sensitive');
  const principalId    = body.principalId ? String(body.principalId) : null;

  if (!tenantId)                       return err(400, 'tenantId required');
  if (!VALID_KINDS.has(roomKind))      return err(400, `roomKind must be one of ${[...VALID_KINDS].join(', ')}`);
  if (!filename)                       return err(400, 'filename required');
  if (!base64)                         return err(400, 'base64 content required');
  if (bytes <= 0)                      return err(400, 'bytes must be > 0');
  if (bytes > MAX_BYTES)               return err(413, `bytes exceeds ${MAX_BYTES}`);
  if (!VALID_CLASS.has(classification)) return err(400, 'invalid classification');

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey)    return err(500, 'server not configured');
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // storage path: <tenant>/<room_kind>/<timestamp>_<sanitized_filename>
  const safe = filename.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 120);
  const storagePath = `${tenantId}/${roomKind}/${Date.now()}_${safe}`;

  let data: Uint8Array;
  try { data = base64ToBytes(base64); } catch { return err(400, 'invalid base64'); }

  const up = await admin.storage.from('exit-data-room').upload(storagePath, data, {
    contentType: mime,
    upsert: false,
  });
  if (up.error) return err(500, `storage upload failed: ${up.error.message}`);

  const ins = await admin
    .from('exit_data_room_documents')
    .insert({
      tenant_id: tenantId,
      room_kind: roomKind,
      filename: filename.slice(0, 200),
      mime,
      bytes,
      storage_path: storagePath,
      classification,
      uploaded_by: principalId,
      description,
    })
    .select('*')
    .single();
  if (ins.error) {
    // rollback storage object
    await admin.storage.from('exit-data-room').remove([storagePath]).catch(() => {});
    return err(500, `metadata insert failed: ${ins.error.message}`);
  }

  await admin.from('exit_data_room_access_log').insert({
    tenant_id: tenantId,
    document_id: ins.data.id,
    principal: principalId,
    action: 'upload',
    details: { bytes, mime, roomKind },
  });

  return new Response(JSON.stringify({ ok: true, document: ins.data }), {
    status: 201,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
});

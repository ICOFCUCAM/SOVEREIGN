// exit-dispatch-submit: ExitOS → Sovereign Dispatch bridge. Renders one of the
// caller's own document versions to PDF through Dispatch.
//
// Who may call: a signed-in ExitOS user (their Supabase access token). The
// browser sends only a version id; the function loads that version under the
// caller's own token (RLS: only the owner can read it), checks the stored
// document against its recorded content hash, submits it to Dispatch with the
// dedicated ExitOS service client, and records the request in the version's
// audit trail. Dispatch credentials never leave this function.
//
// Secrets (function env):
//   DISPATCH_API_URL       the deployed dispatch-api
//   DISPATCH_CLIENT_ID     svc-exitos (the dedicated ExitOS client — never the svc-a console client)
//   DISPATCH_CLIENT_SECRET its secret
// Without them it answers { configured:false } and submits nothing.
//
// POST body: { versionId: string, outputs?: ["pdf"] }

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });
const env = (k: string) => Deno.env.get(k);

function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(',')}}`;
}
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  // 1) the caller must be a signed-in user, verified by Supabase Auth
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const url = env('SUPABASE_URL') ?? '', anon = env('SUPABASE_ANON_KEY') ?? '';
  if (!token || !url || !anon) return json({ error: 'sign in to render documents' }, 401);
  const asUser = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: who, error: whoErr } = await asUser.auth.getUser(token);
  if (whoErr || !who?.user?.id) return json({ error: 'sign in to render documents' }, 401);

  let payload: { versionId?: string; outputs?: string[] };
  try { payload = await req.json(); } catch { return json({ error: 'invalid JSON body' }, 400); }
  if (!payload?.versionId) return json({ error: "a 'versionId' is required" }, 400);
  const outputs = (Array.isArray(payload.outputs) && payload.outputs.length ? payload.outputs : ['pdf']).filter((o) => ['pdf', 'md', 'docx'].includes(o));

  // 2) the version must be the caller's own (RLS), and its content must match its hash
  const { data: row, error: rowErr } = await asUser.from('exitos_document_versions')
    .select('id, owner_account_id, content_hash, data').eq('id', payload.versionId).maybeSingle();
  if (rowErr) return json({ error: rowErr.message }, 500);
  if (!row || row.owner_account_id !== who.user.id) return json({ error: 'no such document version' }, 404);
  const ddm = (row.data as { ddm?: unknown })?.ddm;
  if (!ddm || (await sha256(canonicalJson(ddm))) !== row.content_hash) return json({ error: 'the stored document does not match its content hash' }, 409);

  // 3) Dispatch, with the dedicated ExitOS client
  const apiUrl = env('DISPATCH_API_URL'), clientId = env('DISPATCH_CLIENT_ID'), clientSecret = env('DISPATCH_CLIENT_SECRET');
  if (!apiUrl || !clientId || !clientSecret) {
    return json({ configured: false, error: 'PDF rendering is not connected: the Dispatch service is not deployed or its ExitOS client is not configured.' });
  }
  if (clientId === 'svc-a') return json({ configured: false, error: 'refusing to use the demo console client; configure the dedicated ExitOS client' });

  const base = apiUrl.replace(/\/+$/, '');
  try {
    const tok = await fetch(`${base}/v1/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, secret: clientSecret }) });
    if (!tok.ok) return json({ configured: true, error: `Dispatch token ${tok.status}` }, 502);
    const accessToken = (await tok.json().catch(() => ({})))?.access_token;
    if (!accessToken) return json({ configured: true, error: 'Dispatch did not return an access token' }, 502);
    const sub = await fetch(`${base}/v1/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Idempotency-Key': `${row.id}:${outputs.join(',')}` },
      body: JSON.stringify({ document: ddm, outputs }),
    });
    const body = await sub.json().catch(() => ({}));
    if (!sub.ok) return json({ configured: true, error: body?.error?.message ?? body?.error ?? `Dispatch submit ${sub.status}` }, 502);
    await asUser.from('exitos_document_events').insert({ version_id: row.id, action: 'rendered_pdf', detail: { dispatchDocumentId: body?.documentId ?? null, jobId: body?.jobId ?? null, outputs } });
    return json({ configured: true, ok: true, documentId: body?.documentId ?? null, jobId: body?.jobId ?? null, status: body?.status ?? null });
  } catch (e) {
    return json({ configured: true, error: (e as Error).message }, 502);
  }
});

// exit-dispatch-submit: ExitOS → Sovereign Dispatch certification. ExitOS writes, versions, reviews and
// renders its own documents; this function asks Dispatch to certify an approved deal document: a
// permanent record number, a public verification page (title withheld for classified records, body never
// shown), an integrity hash and preservation.
//
// Who may call: a signed-in ExitOS user (their Supabase access token), for their own version only.
// The function loads the version under the caller's token (RLS: only the owner can read it), requires it
// to be approved and of a certifiable type, checks the stored document against its recorded content hash,
// and only then talks to Dispatch with the dedicated ExitOS client. ExitOS's record of the certification
// (exitos_document_certificates) is written with the service role: no client can mark a document certified.
// Dispatch credentials never leave this function.
//
// Secrets (function env):
//   DISPATCH_API_URL        the deployed dispatch-api
//   DISPATCH_CLIENT_ID      svc-exitos — the ExitOS institution's client with render, read and publish
//   DISPATCH_CLIENT_SECRET  its secret
//   DISPATCH_VERIFY_URL     optional: the public verify page base, e.g. https://<dispatch-site>/verify
// Without the first three it answers { configured:false } and certifies nothing.
//
// POST body: { versionId: string, action: "certify" | "status" }
//   certify  register the version with Dispatch (once; repeating it returns the same certificate)
//   status   move a requested certification on and report it
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { CERTIFIABLE_TYPES, dispatchSession, submitForCertification, advanceCertification } from './certify.mjs';

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
const view = (c: Record<string, unknown> | null) => c && ({
  state: c.state, recordId: c.record_id ?? null, verifyUrl: c.verify_url ?? null, integritySha256: c.integrity_sha256 ?? null,
  requestedAt: c.requested_at, certifiedAt: c.certified_at ?? null, error: c.error ?? null,
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  // 1) the caller must be a signed-in user, verified by Supabase Auth
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const url = env('SUPABASE_URL') ?? '', anon = env('SUPABASE_ANON_KEY') ?? '', service = env('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!token || !url || !anon || !service) return json({ error: 'sign in to certify documents' }, 401);
  const asUser = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: who, error: whoErr } = await asUser.auth.getUser(token);
  if (whoErr || !who?.user?.id) return json({ error: 'sign in to certify documents' }, 401);

  let payload: { versionId?: string; action?: string };
  try { payload = await req.json(); } catch { return json({ error: 'invalid JSON body' }, 400); }
  if (!payload?.versionId) return json({ error: "a 'versionId' is required" }, 400);
  const action = payload.action === 'status' ? 'status' : payload.action === 'certify' ? 'certify' : null;
  if (!action) return json({ error: "action must be 'certify' or 'status'" }, 400);

  // 2) the version must be the caller's own (RLS), approved, certifiable, and match its content hash
  const { data: row, error: rowErr } = await asUser.from('exitos_document_versions')
    .select('id, owner_account_id, type_id, status, content_hash, data').eq('id', payload.versionId).maybeSingle();
  if (rowErr) return json({ error: rowErr.message }, 500);
  if (!row || row.owner_account_id !== who.user.id) return json({ error: 'no such document version' }, 404);

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const certs = admin.from('exitos_document_certificates');
  const { data: existing } = await certs.select('*').eq('version_id', row.id).maybeSingle();
  if (existing?.state === 'certified') return json({ configured: true, ok: true, certificate: view(existing) });
  if (action === 'status' && !existing) return json({ configured: true, ok: true, certificate: null });

  if (!CERTIFIABLE_TYPES.has(row.type_id)) return json({ error: 'only deal documents both parties rely on can be certified (NDA, letter of intent, exclusivity, bring-down certificate, funds flow, post-closing register)' }, 422);
  if (row.status !== 'approved') return json({ error: 'only an approved version can be certified' }, 409);
  const ddm = (row.data as { ddm?: unknown })?.ddm;
  if (!ddm || (await sha256(canonicalJson(ddm))) !== row.content_hash) return json({ error: 'the stored document does not match its content hash' }, 409);

  // 3) Dispatch, with the dedicated ExitOS client
  const apiUrl = env('DISPATCH_API_URL'), clientId = env('DISPATCH_CLIENT_ID'), clientSecret = env('DISPATCH_CLIENT_SECRET');
  if (!apiUrl || !clientId || !clientSecret) {
    return json({ configured: false, error: 'Certification is not connected: the Dispatch service is not deployed or the ExitOS client is not configured.' });
  }
  const verifyBase = (env('DISPATCH_VERIFY_URL') ?? '').replace(/\/+$/, '');
  try {
    const s = await dispatchSession({ base: apiUrl.replace(/\/+$/, ''), clientId, secret: clientSecret, fetch });
    let documentId = existing?.dispatch_document_id as string | undefined;
    if (!documentId || existing?.state === 'failed') {
      if (action === 'status') return json({ configured: true, ok: true, certificate: view(existing) });
      documentId = (await submitForCertification(s, { versionId: row.id, contentHash: row.content_hash, ddm })).documentId;
      const { error } = await certs.upsert({
        version_id: row.id, owner_account_id: row.owner_account_id, content_hash: row.content_hash, state: 'requested',
        dispatch_document_id: documentId, record_id: null, verify_url: null, integrity_sha256: null, error: null, requested_at: new Date().toISOString(), certified_at: null,
      }, { onConflict: 'version_id' });
      if (error) return json({ configured: true, error: error.message }, 500);
    }

    const step = await advanceCertification(s, documentId);
    const patch: Record<string, unknown> = step.state === 'certified'
      ? { state: 'certified', record_id: step.recordId, integrity_sha256: step.integritySha256, certified_at: new Date().toISOString(), error: null,
          verify_url: /^https:\/\//.test(verifyBase) ? `${verifyBase}/${encodeURIComponent(step.recordId)}` : null }
      : step.state === 'failed' ? { state: 'failed', error: step.error.slice(0, 500) } : {};
    if (Object.keys(patch).length) await certs.update(patch).eq('version_id', row.id);
    const { data: now } = await certs.select('*').eq('version_id', row.id).maybeSingle();
    return json({ configured: true, ok: true, certificate: view(now), waitingFor: step.state === 'requested' ? step.waitingFor : null });
  } catch (e) {
    return json({ configured: true, error: (e as Error).message }, 502);
  }
});

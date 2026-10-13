// ExitOS Data Room · buyer access under an executed NDA.
//
//   GET  ?agreement=<uuid>                 list the files disclosed to the caller under that NDA
//   POST { agreement: <uuid>, file: <uuid> } a 60-second signed download link for one of them
//
// Every call re-checks authorisation on the server, as the caller: the request runs the
// database functions exitos_buyer_room_files / exitos_buyer_file_path with the caller's own
// access token, so the caller must be the agreement's buyer, the NDA must be executed and inside
// its access term, and the file must be the seller's, for the agreement's company, disclosed
// post-NDA, not rejected and within scope. Only then does the service role sign a link, valid for
// 60 seconds. A refusal is recorded in the NDA's audit trail when the agreement exists.
// The bucket stays private; nothing here lists or signs on the caller's word.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const LINK_TTL = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'content-type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !anon || !service) return json(500, { ok: false, error: 'server not configured' });
  const auth = req.headers.get('authorization') ?? '';
  if (!/^Bearer\s+\S+/i.test(auth)) return json(401, { ok: false, error: 'sign in to open a data room' });

  // the caller's own identity decides; the service role only signs a link afterwards
  const asCaller = createClient(url, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: who } = await admin.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  if (!who?.user?.id) return json(401, { ok: false, error: 'sign in to open a data room' });

  const deny = async (agreement: string, action: string, message: string) => {
    await admin.from('exitos_nda_events').insert({ agreement_id: agreement, actor: who.user!.id, action: 'access_denied', details: { request: action, reason: message } })
      .then(() => undefined, () => undefined);
    return json(403, { ok: false, error: message });
  };

  if (req.method === 'GET') {
    const agreement = new URL(req.url).searchParams.get('agreement') ?? '';
    if (!UUID.test(agreement)) return json(400, { ok: false, error: 'agreement id required' });
    const { data, error } = await asCaller.rpc('exitos_buyer_room_files', { p_agreement: agreement });
    if (error) return deny(agreement, 'list', error.message);
    return json(200, { ok: true, items: data ?? [] });
  }

  if (req.method === 'POST') {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json(400, { ok: false, error: 'invalid json' }); }
    const agreement = String(body.agreement ?? ''); const file = String(body.file ?? '');
    if (!UUID.test(agreement) || !UUID.test(file)) return json(400, { ok: false, error: 'agreement and file ids required' });
    const { data: path, error } = await asCaller.rpc('exitos_buyer_file_path', { p_agreement: agreement, p_file: file });
    if (error || typeof path !== 'string') return deny(agreement, 'download', error?.message ?? 'not disclosed');
    const signed = await admin.storage.from('exit-data-room').createSignedUrl(path, LINK_TTL);
    if (signed.error || !signed.data?.signedUrl) return json(500, { ok: false, error: 'could not sign the link' });
    return json(200, { ok: true, url: signed.data.signedUrl, expiresIn: LINK_TTL });
  }

  return json(405, { ok: false, error: 'method not allowed' });
});

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { insertJob, transition } from '../_shared/queue.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'ecosystem';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not configured on the server.' }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { script = '', voice = 'onyx', title } = await req.json().catch(() => ({}));
    if (!script || typeof script !== 'string') {
      return new Response(JSON.stringify({ error: 'A non-empty "script" string is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const jobId = await insertJob(admin, {
      kind: 'narration', status: 'processing', provider: 'openai-tts', title: title ?? undefined, input: { voice, chars: script.length },
    });

    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'tts-1', voice, input: script.slice(0, 4000), response_format: 'mp3' }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      if (jobId) await transition(admin, jobId, { status: 'failed', error: errText.slice(0, 500) });
      return new Response(JSON.stringify({ error: `OpenAI TTS error (${resp.status})`, detail: errText.slice(0, 500) }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const bytes = new Uint8Array(await resp.arrayBuffer());
    const path = `narration/${Date.now()}.mp3`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: 'audio/mpeg', upsert: true, cacheControl: '3600' });
    if (upErr) {
      if (jobId) await transition(admin, jobId, { status: 'failed', error: upErr.message });
      return new Response(JSON.stringify({ error: 'Audio generated but storage upload failed', detail: upErr.message }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    if (jobId) await transition(admin, jobId, { status: 'done', result_url: pub.publicUrl });

    return new Response(JSON.stringify({ url: pub.publicUrl, job_id: jobId, model_used: 'tts-1' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

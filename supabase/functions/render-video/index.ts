import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Provider-agnostic video render submission.
// Configure VIDEO_PROVIDER_URL (the provider's text/image-to-video submit endpoint)
// and VIDEO_PROVIDER_KEY (bearer token) to activate. Works with Runway, Kling,
// Sora-compatible, or any provider that accepts a JSON body and returns a job id.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const { script = '', title, mediaClass, duration = 8, shots } = await req.json().catch(() => ({}));
    if (!script || typeof script !== 'string') {
      return new Response(JSON.stringify({ error: 'A non-empty "script" string is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const providerUrl = Deno.env.get('VIDEO_PROVIDER_URL');
    const providerKey = Deno.env.get('VIDEO_PROVIDER_KEY');

    // Always record the job so the pipeline is auditable even while dormant.
    const { data: job } = await admin.from('pipeline_jobs').insert({
      kind: 'video',
      status: providerUrl && providerKey ? 'queued' : 'failed',
      provider: providerUrl ? new URL(providerUrl).host : null,
      title: title ?? null,
      input: { script: script.slice(0, 2000), mediaClass: mediaClass ?? null, duration, shots: shots ?? null },
      error: providerUrl && providerKey ? null : 'No video provider configured (set VIDEO_PROVIDER_URL and VIDEO_PROVIDER_KEY).',
    }).select('id').single();
    const jobId = job?.id as string | undefined;

    if (!providerUrl || !providerKey) {
      return new Response(JSON.stringify({
        error: 'Video provider not configured.',
        detail: 'Set VIDEO_PROVIDER_URL and VIDEO_PROVIDER_KEY secrets to activate Runway / Kling / Sora rendering. The job has been recorded as pending.',
        job_id: jobId,
      }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const submit = await fetch(providerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${providerKey}` },
      body: JSON.stringify({ prompt: script.slice(0, 2000), duration, shots: shots ?? undefined }),
    });
    const submitBody = await submit.json().catch(() => ({}));

    if (!submit.ok) {
      if (jobId) await admin.from('pipeline_jobs').update({ status: 'failed', error: JSON.stringify(submitBody).slice(0, 500), updated_at: new Date().toISOString() }).eq('id', jobId);
      return new Response(JSON.stringify({ error: `Video provider error (${submit.status})`, detail: submitBody }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Provider returns a job/render id; status polling is handled separately (cron or status fn).
    if (jobId) await admin.from('pipeline_jobs').update({ status: 'processing', result: submitBody, updated_at: new Date().toISOString() }).eq('id', jobId);
    return new Response(JSON.stringify({ job_id: jobId, provider_response: submitBody }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

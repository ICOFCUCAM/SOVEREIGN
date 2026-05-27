import { createClient } from 'jsr:@supabase/supabase-js@2';
import { transition } from '../_shared/queue.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Triggers the external FFmpeg worker to stitch a film's clips + narration.
// Dormant until FFMPEG_WORKER_URL (and WORKER_SECRET) are configured.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const workerUrl = Deno.env.get('FFMPEG_WORKER_URL');
  const workerSecret = Deno.env.get('WORKER_SECRET');

  try {
    const body = await req.json().catch(() => ({}));
    let { film_job_id, clip_urls, audio_url } = body as { film_job_id?: string; clip_urls?: string[]; audio_url?: string };

    // If only a film id is given, gather its finished clips + narration.
    if (film_job_id && (!clip_urls || clip_urls.length === 0)) {
      const { data: kids } = await admin.from('pipeline_jobs').select('kind, status, result_url, result').limit(100);
      const clips = (kids || []).filter((j) => j.kind === 'video' && j.status === 'done' && (j.result as Record<string, unknown> | null)?.film_id === film_job_id && j.result_url);
      clip_urls = clips.map((c) => c.result_url as string);
      if (!audio_url) {
        const film = (kids || []).find((j) => j.kind === 'film');
        const r = (film?.result ?? {}) as Record<string, unknown>;
        if (typeof r.narration_url === 'string') audio_url = r.narration_url;
      }
    }

    if (!clip_urls || clip_urls.length === 0) {
      return new Response(JSON.stringify({ error: 'No clips to assemble (provide clip_urls or a film_job_id with finished video clips).' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (!workerUrl) {
      return new Response(JSON.stringify({
        error: 'FFmpeg worker not configured.',
        detail: 'Deploy worker/ and set FFMPEG_WORKER_URL + WORKER_SECRET secrets to enable multi-clip film assembly.',
      }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (film_job_id) await transition(admin, film_job_id, { status: 'processing' });

    const resp = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(workerSecret ? { 'x-worker-secret': workerSecret } : {}) },
      body: JSON.stringify({ film_job_id, clip_urls, audio_url }),
    });
    const out = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `Worker error (${resp.status})`, detail: out }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

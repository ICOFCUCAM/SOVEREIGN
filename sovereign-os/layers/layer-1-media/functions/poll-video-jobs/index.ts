import { createClient } from 'jsr:@supabase/supabase-js@2';
import { transition } from '../_shared/queue.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'ecosystem';
const RUNWAY_BASE = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';

// Polls processing Runway clips, finalizes them, and auto-stitches a film
// once all its scene clips are done (if the FFmpeg worker is configured).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const runwayKey = Deno.env.get('RUNWAY_API_KEY') || Deno.env.get('RUNWAYML_API_SECRET') || Deno.env.get('VIDEO_PROVIDER_KEY');
  const workerUrl = Deno.env.get('FFMPEG_WORKER_URL');
  const workerSecret = Deno.env.get('WORKER_SECRET');

  try {
    const { data: jobs } = await admin.from('pipeline_jobs').select('*').eq('kind', 'video').eq('status', 'processing').limit(30);
    if (!jobs || jobs.length === 0) return new Response(JSON.stringify({ checked: 0 }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    if (!runwayKey) return new Response(JSON.stringify({ checked: jobs.length, note: 'RUNWAY_API_KEY not configured' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });

    let finalized = 0;
    const touchedFilms = new Set<string>();

    for (const job of jobs) {
      const r = (job.result ?? {}) as Record<string, unknown>;
      const taskId = r.id as string | undefined;
      if (!taskId) continue;
      const st = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, { headers: { Authorization: `Bearer ${runwayKey}`, 'X-Runway-Version': RUNWAY_VERSION } });
      const body = await st.json().catch(() => ({}));
      const status = String(body.status || '').toUpperCase();
      const videoUrl = Array.isArray(body.output) ? body.output[0] : (body.output as string | undefined);

      if (status === 'SUCCEEDED' && videoUrl) {
        const vid = await fetch(videoUrl);
        if (vid.ok) {
          const bytes = new Uint8Array(await vid.arrayBuffer());
          const path = `video/${job.id}.mp4`;
          await admin.storage.from(BUCKET).upload(path, bytes, { contentType: 'video/mp4', upsert: true, cacheControl: '3600' });
          const pub = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
          await transition(admin, job.id, { status: 'done', result_url: pub });
          finalized++;
          if (typeof r.film_id === 'string') touchedFilms.add(r.film_id);
        }
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        await transition(admin, job.id, { status: 'failed', error: JSON.stringify(body).slice(0, 500) });
        if (typeof r.film_id === 'string') touchedFilms.add(r.film_id);
      }
    }

    // Auto-stitch any film whose clips are all finalized.
    let assembled = 0;
    if (workerUrl && touchedFilms.size > 0) {
      const { data: all } = await admin.from('pipeline_jobs').select('id, kind, status, result_url, result').limit(300);
      for (const filmId of touchedFilms) {
        const clips = (all || []).filter((j) => j.kind === 'video' && (j.result as Record<string, unknown> | null)?.film_id === filmId);
        if (clips.length === 0) continue;
        const allDone = clips.every((c) => c.status === 'done' || c.status === 'failed');
        const ready = clips.filter((c) => c.status === 'done' && c.result_url)
          .sort((a, b) => Number((a.result as Record<string, unknown>).scene ?? 0) - Number((b.result as Record<string, unknown>).scene ?? 0));
        if (!allDone || ready.length === 0) continue;

        const film = (all || []).find((j) => j.kind === 'film' && j.id === filmId);
        if (film && film.status === 'done') continue;
        const audio_url = (film?.result as Record<string, unknown> | null)?.narration_url as string | undefined;

        const resp = await fetch(workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(workerSecret ? { 'x-worker-secret': workerSecret } : {}) },
          body: JSON.stringify({ film_job_id: filmId, clip_urls: ready.map((c) => c.result_url), audio_url }),
        });
        if (resp.ok) assembled++;
      }
    }

    return new Response(JSON.stringify({ checked: jobs.length, finalized, assembled }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

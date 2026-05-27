import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'ecosystem';
const RUNWAY_BASE = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';

// Polls processing Runway video tasks and finalizes them into storage + media.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const runwayKey = Deno.env.get('RUNWAY_API_KEY') || Deno.env.get('RUNWAYML_API_SECRET') || Deno.env.get('VIDEO_PROVIDER_KEY');

  try {
    const { data: jobs } = await admin.from('pipeline_jobs').select('*').eq('kind', 'video').eq('status', 'processing').limit(20);
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ checked: 0 }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    if (!runwayKey) {
      return new Response(JSON.stringify({ checked: jobs.length, note: 'RUNWAY_API_KEY not configured; left pending' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    let finalized = 0;
    for (const job of jobs) {
      const taskId = ((job.result ?? {}) as Record<string, unknown>).id as string | undefined;
      if (!taskId) continue;

      const st = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${runwayKey}`, 'X-Runway-Version': RUNWAY_VERSION },
      });
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
          await admin.from('pipeline_jobs').update({ status: 'done', result_url: pub, updated_at: new Date().toISOString() }).eq('id', job.id);
          finalized++;
        }
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        await admin.from('pipeline_jobs').update({ status: 'failed', error: JSON.stringify(body).slice(0, 500), updated_at: new Date().toISOString() }).eq('id', job.id);
      }
    }

    return new Response(JSON.stringify({ checked: jobs.length, finalized }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

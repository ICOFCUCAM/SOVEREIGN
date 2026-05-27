import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'ecosystem';

// Polls processing video jobs against the configured provider and finalizes them.
// Reads VIDEO_PROVIDER_STATUS_URL (status endpoint, job id appended as /{id})
// and VIDEO_PROVIDER_KEY. Dormant (no-op) until those are set.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const statusUrl = Deno.env.get('VIDEO_PROVIDER_STATUS_URL');
  const providerKey = Deno.env.get('VIDEO_PROVIDER_KEY');

  try {
    const { data: jobs } = await admin.from('pipeline_jobs').select('*').eq('kind', 'video').eq('status', 'processing').limit(20);
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ checked: 0, note: 'no processing video jobs' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    if (!statusUrl || !providerKey) {
      return new Response(JSON.stringify({ checked: jobs.length, note: 'video provider status endpoint not configured; left pending' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    let finalized = 0;
    for (const job of jobs) {
      const r = (job.result ?? {}) as Record<string, unknown>;
      const providerId = (r.id || r.job_id || r.uuid || r.task_id) as string | undefined;
      if (!providerId) continue;

      const st = await fetch(`${statusUrl.replace(/\/$/, '')}/${providerId}`, { headers: { Authorization: `Bearer ${providerKey}` } });
      const body = await st.json().catch(() => ({}));
      const status = String(body.status || body.state || '').toLowerCase();
      const videoUrl = (body.url || body.output_url || body.video_url || (Array.isArray(body.output) ? body.output[0] : undefined)) as string | undefined;

      if (['succeeded', 'completed', 'done', 'success'].includes(status) && videoUrl) {
        const vid = await fetch(videoUrl);
        if (vid.ok) {
          const bytes = new Uint8Array(await vid.arrayBuffer());
          const path = `video/${job.id}.mp4`;
          await admin.storage.from(BUCKET).upload(path, bytes, { contentType: 'video/mp4', upsert: true, cacheControl: '3600' });
          const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
          await admin.from('pipeline_jobs').update({ status: 'done', result_url: pub.publicUrl, updated_at: new Date().toISOString() }).eq('id', job.id);
          finalized++;
        }
      } else if (['failed', 'error', 'cancelled'].includes(status)) {
        await admin.from('pipeline_jobs').update({ status: 'failed', error: JSON.stringify(body).slice(0, 500), updated_at: new Date().toISOString() }).eq('id', job.id);
      }
    }

    return new Response(JSON.stringify({ checked: jobs.length, finalized }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

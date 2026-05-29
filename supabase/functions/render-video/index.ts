import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'ecosystem';
const RUNWAY_BASE = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Pipeline: prompt -> gpt-image-1 seed frame -> Runway image_to_video task.
// The render is async; poll-video-jobs finalizes it into storage.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const {
      script = '',
      title,
      mediaClass,
      duration: durationIn,
      promptImage,
      aspectRatio,
      format,
    } = await req.json().catch(() => ({}));
    if (!script || typeof script !== 'string') {
      return new Response(JSON.stringify({ error: 'A non-empty "script" string is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Format presets — operator-selectable shapes.
    // Each one decides aspect ratio + clamped duration; explicit fields override.
    const PRESETS: Record<string, { ratio: string; duration: number; size: string }> = {
      short_ad:        { ratio: '1280:720',  duration: 10, size: '1536x1024' }, // 16:9 horizontal advert
      long_film:       { ratio: '1280:720',  duration: 10, size: '1536x1024' }, // 16:9 cinematic
      social_vertical: { ratio: '720:1280',  duration: 10, size: '1024x1536' }, // 9:16 reels / shorts
      social_square:   { ratio: '960:960',   duration: 10, size: '1024x1024' }, // 1:1 feed
      custom:          { ratio: '1280:720',  duration: 10, size: '1536x1024' },
    };
    const fmt = typeof format === 'string' && PRESETS[format] ? format : 'short_ad';
    const preset = PRESETS[fmt];
    const ratio = typeof aspectRatio === 'string' && /^\d+:\d+$/.test(aspectRatio) ? aspectRatio : preset.ratio;
    // Runway gen4_turbo currently accepts 5 or 10 second clips.
    const requested = Number(durationIn ?? preset.duration);
    const duration = requested >= 8 ? 10 : 5;

    const runwayKey = Deno.env.get('RUNWAY_API_KEY') || Deno.env.get('RUNWAYML_API_SECRET') || Deno.env.get('VIDEO_PROVIDER_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    const { data: job } = await admin.from('pipeline_jobs').insert({
      kind: 'video', status: runwayKey ? 'processing' : 'failed', provider: 'runway',
      title: title ?? null, input: { script: script.slice(0, 2000), mediaClass: mediaClass ?? null, duration, format: fmt, aspect_ratio: ratio },
      error: runwayKey ? null : 'RUNWAY_API_KEY is not configured on the server.',
    }).select('id').single();
    const jobId = job?.id as string | undefined;

    if (!runwayKey) {
      return new Response(JSON.stringify({ error: 'Video provider not configured.', detail: 'Set RUNWAY_API_KEY to activate rendering.', job_id: jobId }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // 1) Seed frame: use provided promptImage, else generate one with gpt-image-1.
    let seedUrl: string | undefined = typeof promptImage === 'string' ? promptImage : undefined;
    if (!seedUrl) {
      if (!openaiKey) {
        if (jobId) await admin.from('pipeline_jobs').update({ status: 'failed', error: 'No seed image and OPENAI_API_KEY missing for auto-seed.', updated_at: new Date().toISOString() }).eq('id', jobId);
        return new Response(JSON.stringify({ error: 'No promptImage and no OPENAI_API_KEY to auto-generate a seed frame.' }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const seedPrompt = `Cinematic opening frame for a sovereign-infrastructure film. ${script.slice(0, 800)}. Anamorphic widescreen, volumetric light, deep teal-and-cyan palette, dramatic, no text, no logos.`;
      const imgResp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'gpt-image-1', prompt: seedPrompt, size: preset.size, n: 1, quality: 'medium' }),
      });
      if (!imgResp.ok) {
        const e = await imgResp.text();
        if (jobId) await admin.from('pipeline_jobs').update({ status: 'failed', error: `seed image failed: ${e.slice(0, 300)}`, updated_at: new Date().toISOString() }).eq('id', jobId);
        return new Response(JSON.stringify({ error: 'Seed-frame generation failed', detail: e.slice(0, 400) }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      const imgData = await imgResp.json();
      const item = imgData?.data?.[0] ?? {};
      const bytes = item.b64_json ? b64ToBytes(item.b64_json) : new Uint8Array(await (await fetch(item.url)).arrayBuffer());
      const seedPath = `video-seed/${jobId}.png`;
      await admin.storage.from(BUCKET).upload(seedPath, bytes, { contentType: 'image/png', upsert: true, cacheControl: '3600' });
      seedUrl = admin.storage.from(BUCKET).getPublicUrl(seedPath).data.publicUrl;
    }

    // 2) Submit Runway image_to_video task.
    const submit = await fetch(`${RUNWAY_BASE}/image_to_video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${runwayKey}`, 'X-Runway-Version': RUNWAY_VERSION },
      body: JSON.stringify({ model: 'gen4_turbo', promptImage: seedUrl, promptText: script.slice(0, 1000), ratio, duration }),
    });
    const submitBody = await submit.json().catch(() => ({}));
    if (!submit.ok || !submitBody?.id) {
      if (jobId) await admin.from('pipeline_jobs').update({ status: 'failed', error: JSON.stringify(submitBody).slice(0, 500), result: { seedUrl }, updated_at: new Date().toISOString() }).eq('id', jobId);
      return new Response(JSON.stringify({ error: `Runway error (${submit.status})`, detail: submitBody }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (jobId) await admin.from('pipeline_jobs').update({ status: 'processing', result: { id: submitBody.id, seedUrl }, updated_at: new Date().toISOString() }).eq('id', jobId);
    return new Response(JSON.stringify({ job_id: jobId, runway_task: submitBody.id, seed_url: seedUrl }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

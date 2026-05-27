import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'ecosystem';
const RUNWAY_BASE = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';

const FILM_SYSTEM =
  'You are a cinematic director for CIVICOS / SOVEREIGN, a sovereign-civilization infrastructure ecosystem. ' +
  'Given a brief, design a single continuous ~10-second hero shot. Return STRICT JSON only: ' +
  '{"title":"<short film title>",' +
  '"seed_prompt":"<vivid description of the opening frame: composition, subject, palette (deep teal-and-cyan, volumetric light), cinematic, no text/logos>",' +
  '"motion_prompt":"<the camera move and motion over the shot: e.g. slow dolly-in, parallax, light sweep — one or two sentences>",' +
  '"narration_script":"<60-110 words of cinematic voiceover in the house voice: institutional, restrained, inevitable, no hype, no emoji>"}';

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const runwayKey = Deno.env.get('RUNWAY_API_KEY') || Deno.env.get('RUNWAYML_API_SECRET') || Deno.env.get('VIDEO_PROVIDER_KEY');

  try {
    const { brief = '' } = await req.json().catch(() => ({}));
    if (!brief || typeof brief !== 'string') {
      return new Response(JSON.stringify({ error: 'A non-empty "brief" string is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    if (!anthropicKey || !openaiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY and OPENAI_API_KEY are required.' }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // 1) Director: brief -> shot + narration.
    const dir = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-opus-4-7', max_tokens: 1200, system: FILM_SYSTEM, thinking: { type: 'adaptive' }, messages: [{ role: 'user', content: `Design a hero film shot for: ${brief}` }] }),
    });
    if (!dir.ok) {
      return new Response(JSON.stringify({ error: `Director (Claude) error (${dir.status})`, detail: (await dir.text()).slice(0, 400) }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    const dirData = await dir.json();
    const dirText = Array.isArray(dirData?.content) ? dirData.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n') : '';
    const m = dirText.match(/\{[\s\S]*\}/);
    if (!m) return new Response(JSON.stringify({ error: 'Director did not return parseable JSON.' }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    const plan = JSON.parse(m[0]);
    const title = String(plan.title || 'Untitled film').slice(0, 80);

    // Parent film job.
    const { data: filmJob } = await admin.from('pipeline_jobs').insert({ kind: 'film', status: 'processing', provider: 'runway+openai', title, input: { brief: brief.slice(0, 1000), plan } }).select('id').single();
    const filmId = filmJob?.id as string | undefined;

    // 2) Seed frame (gpt-image-1).
    const seedResp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'gpt-image-1', prompt: `${plan.seed_prompt}. Cinematic, anamorphic widescreen, no text, no logos.`.slice(0, 1800), size: '1536x1024', n: 1, quality: 'medium' }),
    });
    let seedUrl: string | undefined;
    if (seedResp.ok) {
      const sd = await seedResp.json();
      const item = sd?.data?.[0] ?? {};
      const bytes = item.b64_json ? b64ToBytes(item.b64_json) : new Uint8Array(await (await fetch(item.url)).arrayBuffer());
      const seedPath = `video-seed/${filmId}.png`;
      await admin.storage.from(BUCKET).upload(seedPath, bytes, { contentType: 'image/png', upsert: true, cacheControl: '3600' });
      seedUrl = admin.storage.from(BUCKET).getPublicUrl(seedPath).data.publicUrl;
    }

    // 3) Runway 10s render (native max). Recorded as a 'video' job so poll-video-jobs finalizes it.
    let videoTask: string | undefined;
    let videoErr: string | undefined;
    if (runwayKey && seedUrl) {
      const sub = await fetch(`${RUNWAY_BASE}/image_to_video`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${runwayKey}`, 'X-Runway-Version': RUNWAY_VERSION },
        body: JSON.stringify({ model: 'gen4_turbo', promptImage: seedUrl, promptText: String(plan.motion_prompt || brief).slice(0, 1000), ratio: '1280:720', duration: 10 }),
      });
      const subBody = await sub.json().catch(() => ({}));
      if (sub.ok && subBody?.id) {
        videoTask = subBody.id;
        await admin.from('pipeline_jobs').insert({ kind: 'video', status: 'processing', provider: 'runway', title, result: { id: subBody.id, seedUrl, film_id: filmId } });
      } else {
        videoErr = JSON.stringify(subBody).slice(0, 400);
      }
    } else {
      videoErr = !runwayKey ? 'RUNWAY_API_KEY not configured' : 'no seed frame';
    }

    // 4) Narration (OpenAI TTS).
    let narrationUrl: string | undefined;
    if (plan.narration_script) {
      const tts = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'tts-1', voice: 'onyx', input: String(plan.narration_script).slice(0, 4000), response_format: 'mp3' }),
      });
      if (tts.ok) {
        const audio = new Uint8Array(await tts.arrayBuffer());
        const aPath = `narration/${filmId}.mp3`;
        await admin.storage.from(BUCKET).upload(aPath, audio, { contentType: 'audio/mpeg', upsert: true, cacheControl: '3600' });
        narrationUrl = admin.storage.from(BUCKET).getPublicUrl(aPath).data.publicUrl;
        await admin.from('pipeline_jobs').insert({ kind: 'narration', status: 'done', provider: 'openai-tts', title, result_url: narrationUrl });
      }
    }

    if (filmId) {
      await admin.from('pipeline_jobs').update({
        status: videoErr ? 'failed' : 'processing',
        result: { seedUrl, video_task: videoTask, narration_url: narrationUrl },
        error: videoErr ?? null,
        updated_at: new Date().toISOString(),
      }).eq('id', filmId);
    }

    return new Response(JSON.stringify({ film_id: filmId, title, seed_url: seedUrl, video_task: videoTask, narration_url: narrationUrl, video_error: videoErr }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

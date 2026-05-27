import { createClient } from 'jsr:@supabase/supabase-js@2';
import { insertJob, transition } from '../_shared/queue.ts';
import { isMediaClass, MEDIA_CLASS_PRESETS, mediaDirective, type MediaClass } from '../_shared/media.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'ecosystem';
const RUNWAY_BASE = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';

function filmSystem(n: number, mediaClass: MediaClass): string {
  return 'You are a cinematic director for the Sovereign AI Media & Acquisition Infrastructure. ' +
    `${mediaDirective(mediaClass)} ` +
    `Break the brief into exactly ${n} sequential scenes that tell one continuous story. Return STRICT JSON only: ` +
    '{"title":"<short film title>",' +
    '"narration_script":"<full continuous voiceover across all scenes, house voice: institutional, restrained, inevitable, no hype, no emoji>",' +
    `"scenes":[{"image_prompt":"<vivid opening frame for this scene: composition, subject, deep teal-and-cyan palette, volumetric light, cinematic, no text/logos>","motion_prompt":"<camera move / motion for this ~5s shot>"}]}. ` +
    `The scenes array must have exactly ${n} entries, in narrative order.`;
}

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
    const { brief = '', scenes, seedImages = [], mediaClass: rawClass } = await req.json().catch(() => ({}));
    if (!brief || typeof brief !== 'string') {
      return new Response(JSON.stringify({ error: 'A non-empty "brief" string is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    if (!anthropicKey || !openaiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY and OPENAI_API_KEY are required.' }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    const mediaClass: MediaClass = isMediaClass(rawClass) ? rawClass : 'cinematic';
    const defaultScenes = MEDIA_CLASS_PRESETS[mediaClass].scenes;
    const sceneCount = Math.max(1, Math.min(6, Math.round(Number(scenes) || defaultScenes)));
    const overrides: string[] = Array.isArray(seedImages) ? seedImages : [];

    // 1) Director: brief -> scenes + narration.
    const dir = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-opus-4-7', max_tokens: 2500, system: filmSystem(sceneCount, mediaClass), thinking: { type: 'adaptive' }, messages: [{ role: 'user', content: `Design a ${sceneCount}-scene film for: ${brief}` }] }),
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
    const planScenes: Array<{ image_prompt?: string; motion_prompt?: string }> = Array.isArray(plan.scenes) ? plan.scenes.slice(0, sceneCount) : [];

    const filmId = await insertJob(admin, { kind: 'film', status: 'processing', provider: 'runway+openai', title, media_class: mediaClass, input: { brief: brief.slice(0, 1000), scene_count: sceneCount, media_class: mediaClass } });

    // 2) Per-scene seed image (override or gpt-image-1) -> Runway clip. Run scenes in parallel.
    const sceneWork = planScenes.map(async (sc, i) => {
      let seedUrl: string | undefined = typeof overrides[i] === 'string' && overrides[i] ? overrides[i] : undefined;
      if (!seedUrl) {
        const imgResp = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: 'gpt-image-1', prompt: `${sc.image_prompt || brief}. Cinematic, anamorphic widescreen, no text, no logos.`.slice(0, 1800), size: '1536x1024', n: 1, quality: 'medium' }),
        });
        if (imgResp.ok) {
          const sd = await imgResp.json();
          const item = sd?.data?.[0] ?? {};
          const bytes = item.b64_json ? b64ToBytes(item.b64_json) : new Uint8Array(await (await fetch(item.url)).arrayBuffer());
          const seedPath = `video-seed/${filmId}-${i}.png`;
          await admin.storage.from(BUCKET).upload(seedPath, bytes, { contentType: 'image/png', upsert: true, cacheControl: '3600' });
          seedUrl = admin.storage.from(BUCKET).getPublicUrl(seedPath).data.publicUrl;
        }
      }
      let taskId: string | undefined;
      let err: string | undefined;
      if (runwayKey && seedUrl) {
        const sub = await fetch(`${RUNWAY_BASE}/image_to_video`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${runwayKey}`, 'X-Runway-Version': RUNWAY_VERSION },
          body: JSON.stringify({ model: 'gen4_turbo', promptImage: seedUrl, promptText: String(sc.motion_prompt || brief).slice(0, 1000), ratio: '1280:720', duration: 5 }),
        });
        const sb = await sub.json().catch(() => ({}));
        if (sub.ok && sb?.id) taskId = sb.id; else err = JSON.stringify(sb).slice(0, 300);
      } else {
        err = !runwayKey ? 'RUNWAY_API_KEY not configured' : 'no seed frame';
      }
      await insertJob(admin, {
        kind: 'video', status: taskId ? 'processing' : 'failed', provider: 'runway', title: `${title} — scene ${i + 1}`,
        media_class: mediaClass, result: { id: taskId, seedUrl, film_id: filmId, scene: i }, error: err ?? null,
      });
      return { scene: i, taskId, seedUrl, err };
    });

    // 3) Narration (full script) in parallel with scene work.
    const narrationWork = (async () => {
      if (!plan.narration_script) return undefined;
      const tts = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'tts-1', voice: 'onyx', input: String(plan.narration_script).slice(0, 4000), response_format: 'mp3' }),
      });
      if (!tts.ok) return undefined;
      const audio = new Uint8Array(await tts.arrayBuffer());
      const aPath = `narration/${filmId}.mp3`;
      await admin.storage.from(BUCKET).upload(aPath, audio, { contentType: 'audio/mpeg', upsert: true, cacheControl: '3600' });
      const url = admin.storage.from(BUCKET).getPublicUrl(aPath).data.publicUrl;
      await insertJob(admin, { kind: 'narration', status: 'done', provider: 'openai-tts', title, media_class: mediaClass, result_url: url });
      return url;
    })();

    const [sceneResults, narrationUrl] = await Promise.all([Promise.all(sceneWork), narrationWork]);
    const anyClip = sceneResults.some((s) => s.taskId);

    if (filmId) {
      await transition(admin, filmId, {
        status: anyClip ? 'processing' : 'failed',
        result: { scene_count: sceneCount, media_class: mediaClass, narration_url: narrationUrl, scenes: sceneResults },
        error: anyClip ? null : 'No scene clips were submitted (check RUNWAY_API_KEY / credits).',
      });
    }

    return new Response(JSON.stringify({ film_id: filmId, title, media_class: mediaClass, scene_count: sceneCount, narration_url: narrationUrl, scenes: sceneResults }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

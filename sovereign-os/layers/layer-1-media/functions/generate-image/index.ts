import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'ecosystem';

const STYLE: Record<string, string> = {
  cinematic: 'cinematic key art, anamorphic widescreen, volumetric light, deep teal-and-cyan palette with warm rim light, film grain, dramatic atmosphere, sovereign-civilization scale, no text, no logos, no watermark',
  operational: 'sleek operational command-center aesthetic, dark glassmorphism, holographic telemetry, cyan and indigo accents, precise and technical, no text, no logos, no watermark',
  strategic: 'institutional strategic visualization, Bloomberg-terminal gravitas, dark editorial tone, restrained palette, data-driven, no text, no logos, no watermark',
  crisis: 'high-tension crisis-room atmosphere, red-and-amber alert lighting against deep blue, kinetic and urgent, cinematic, no text, no logos, no watermark',
  default: 'cinematic sovereign-infrastructure aesthetic, dark cyan-and-indigo palette, dramatic light, premium and authoritative, no text, no logos, no watermark',
};

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not configured on the server.' }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { prompt = '', mediaClass, orientation = 'landscape' } = await req.json().catch(() => ({}));
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'A non-empty "prompt" string is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const style = STYLE[mediaClass as string] || STYLE.default;
    const fullPrompt = `${prompt.slice(0, 1800)}. Art direction: ${style}.`;
    const size = orientation === 'portrait' ? '1024x1536' : orientation === 'square' ? '1024x1024' : '1536x1024';

    const ac = new AbortController();
    const killer = setTimeout(() => ac.abort(), 50000);
    let resp: Response;
    try {
      resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-image-1', prompt: fullPrompt, size, n: 1, quality: 'medium' }),
        signal: ac.signal,
      });
    } catch {
      clearTimeout(killer);
      return new Response(JSON.stringify({ error: 'OpenAI image request did not respond in time.' }), { status: 504, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    clearTimeout(killer);

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: `OpenAI image error (${resp.status})`, detail: errText.slice(0, 600) }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const data = await resp.json();
    const item = data?.data?.[0] ?? {};
    let bytes: Uint8Array;
    if (item.b64_json) {
      bytes = b64ToBytes(item.b64_json);
    } else if (item.url) {
      const imgResp = await fetch(item.url);
      if (!imgResp.ok) {
        return new Response(JSON.stringify({ error: 'Failed to download generated image.' }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      bytes = new Uint8Array(await imgResp.arrayBuffer());
    } else {
      return new Response(JSON.stringify({ error: 'No image returned from provider.' }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const path = `generated/${(mediaClass || 'media')}-${Date.now()}.png`;

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'image/png', upsert: true, cacheControl: '3600',
    });
    if (upErr) {
      return new Response(JSON.stringify({ error: 'Image generated but storage upload failed', detail: upErr.message }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    return new Response(JSON.stringify({ url: pub.publicUrl, model_used: 'gpt-image-1' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

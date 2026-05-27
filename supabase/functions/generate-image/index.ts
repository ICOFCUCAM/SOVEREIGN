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

async function logDiag(source: string, detail: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    await fetch(`${supabaseUrl}/rest/v1/diagnostics`, {
      method: 'POST',
      headers: {
        apikey: serviceKey ?? '',
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ source, detail: detail.slice(0, 2000) }),
    });
  } catch (_) { /* best-effort */ }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      await logDiag('generate-image', 'OPENAI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not configured on the server.' }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { prompt = '', mediaClass, orientation = 'landscape' } = await req.json().catch(() => ({}));
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'A non-empty "prompt" string is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const style = STYLE[mediaClass as string] || STYLE.default;
    const fullPrompt = `${prompt.slice(0, 1800)}. Art direction: ${style}.`;
    const size = orientation === 'portrait' ? '1024x1792' : orientation === 'square' ? '1024x1024' : '1792x1024';

    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt: fullPrompt, size, n: 1, response_format: 'b64_json' }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      await logDiag('generate-image:openai', `status=${resp.status} body=${errText}`);
      return new Response(JSON.stringify({ error: `OpenAI image error (${resp.status})`, detail: errText.slice(0, 600) }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const data = await resp.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      await logDiag('generate-image', 'No b64_json in OpenAI response');
      return new Response(JSON.stringify({ error: 'No image returned from provider.' }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const bytes = b64ToBytes(b64);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const path = `generated/${(mediaClass || 'media')}-${Date.now()}.png`;

    const upload = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'image/png', 'x-upsert': 'true', 'cache-control': '3600' },
      body: bytes,
    });

    if (!upload.ok) {
      const upErr = await upload.text();
      await logDiag('generate-image:storage', `status=${upload.status} body=${upErr}`);
      return new Response(JSON.stringify({ error: 'Image generated but storage upload failed', detail: upErr.slice(0, 400) }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const url = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
    return new Response(JSON.stringify({ url, model_used: 'dall-e-3' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    await logDiag('generate-image:exception', (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

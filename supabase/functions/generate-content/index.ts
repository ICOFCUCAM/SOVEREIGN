const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-opus-4-7';

const BASE_VOICE =
  'You are the chief narrative architect for CIVICOS / SOVEREIGN — a sovereign-civilization infrastructure, media, and acquisition ecosystem. ' +
  'Your register sits between Apple cinematic, Anduril, Palantir, Bloomberg Terminal, and high-end science-fiction infrastructure. ' +
  'Never sound like SaaS marketing. No "unlock", no "supercharge", no "game-changer", no emoji, no hype filler. ' +
  'Write with restraint, authority, and weight — institutional, cinematic, inevitable. Plain prose, no markdown headers unless asked.';

function systemFor(type: string, mediaClass?: string): string {
  const cls = mediaClass ? ` The intended media class is "${mediaClass}".` : '';
  switch (type) {
    case 'dispatch':
      return BASE_VOICE +
        ' Task: write a SOVEREIGN DISPATCH — a short cinematic narrative briefing (180–320 words). ' +
        'It reads like a transmission from a civilization-scale operating system: situational, consequential, forward-leaning. ' +
        'Open with a single arresting line. Then body. No headline label, no sign-off boilerplate.' + cls;
    case 'script':
      return BASE_VOICE +
        ' Task: write a cinematic FILM SCRIPT / voiceover narration for a short sovereign-infrastructure film (200–400 words). ' +
        'Use sparse scene/visual cues in [brackets] interleaved with voiceover lines. Build tension and resolve to inevitability.' + cls;
    case 'scenario':
      return BASE_VOICE +
        ' Task: write a CRISIS SCENARIO briefing — a tense, structured situation report (180–320 words). ' +
        'Cover: the precipitating event, cascading second-order effects across ministries/sectors, and the coordinated sovereign response. ' +
        'Clinical, high-stakes, operational.' + cls;
    case 'ad':
    case 'campaign':
      return BASE_VOICE +
        ' Task: write CAMPAIGN / ad copy for a sovereign acquisition or platform offering. ' +
        'Provide a commanding headline, a 1–2 sentence subhead, and 3 short body lines. ' +
        'Premium, declarative, zero fluff.' + cls;
    default:
      return BASE_VOICE + cls;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const { type = 'dispatch', brief = '', mediaClass } = await req.json().catch(() => ({}));
    if (!brief || typeof brief !== 'string') {
      return new Response(
        JSON.stringify({ error: 'A non-empty "brief" string is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1600,
        system: systemFor(type, mediaClass),
        thinking: { type: 'adaptive' },
        messages: [{ role: 'user', content: brief.slice(0, 6000) }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error (${resp.status})`, detail: errText.slice(0, 800) }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }

    const data = await resp.json();
    const text = Array.isArray(data?.content)
      ? data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim()
      : '';

    return new Response(
      JSON.stringify({ text, model_used: MODEL }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  }
});

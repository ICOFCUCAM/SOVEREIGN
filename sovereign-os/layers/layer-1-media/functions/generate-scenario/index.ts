const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-opus-4-7';

const SYSTEM =
  'You design crisis-response simulations for CIVICOS, a sovereign government operating layer. ' +
  'The national mesh has exactly 7 ministry nodes, indexed 0-6: 0=Power, 1=Comms, 2=Transport, 3=Emergency, 4=Health, 5=Justice, 6=Treasury. ' +
  'Given a crisis brief, output a simulation as STRICT JSON only (no markdown, no commentary) in exactly this shape: ' +
  '{"label":"<short crisis name, 1-3 words>",' +
  '"accent":"<hex color fitting the threat: red #FF5470 kinetic, purple #7C4DFF cyber, cyan #22D3EE systemic>",' +
  '"icon_key":"<one of: alert, zap, shield, heart, water, flame, globe>",' +
  '"origin":<node index 0-6 where the crisis begins>,' +
  '"down":[<node indices that go down/affected at peak>],' +
  '"respond":[<node indices that lead the sovereign response>],' +
  '"phases":[' +
  '{"label":"Nominal","resilience":<90-98>,"affected":0,"clock":"00:00","desc":"<one sentence>"},' +
  '{"label":"<detection phase>","resilience":<68-80>,"affected":1,"clock":"00:0X","desc":"<one sentence>"},' +
  '{"label":"<escalation phase>","resilience":<35-55>,"affected":<2-5>,"clock":"00:XX","desc":"<one sentence>"},' +
  '{"label":"<sovereign response phase>","resilience":<60-72>,"affected":<2-3>,"clock":"00:XX","desc":"<one sentence>"},' +
  '{"label":"<contained phase>","resilience":<95-99>,"affected":0,"clock":"00:XX","desc":"<one sentence, ends with total minutes>"}' +
  ']}. ' +
  'Exactly 5 phases. Clocks must be ascending mm:ss. Voice: clinical, high-stakes, institutional, no hype.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { brief = '' } = await req.json().catch(() => ({}));
    if (!brief || typeof brief !== 'string') {
      return new Response(JSON.stringify({ error: 'A non-empty "brief" string is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM,
        thinking: { type: 'adaptive' },
        messages: [{ role: 'user', content: `Design a crisis simulation for: ${brief}` }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: `Anthropic API error (${resp.status})`, detail: errText.slice(0, 600) }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const data = await resp.json();
    const text = Array.isArray(data?.content) ? data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim() : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Model did not return parseable scenario.', raw: text.slice(0, 400) }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    const s = JSON.parse(match[0]);

    const clampNodes = (arr: unknown): number[] => Array.isArray(arr) ? arr.map((n) => Math.max(0, Math.min(6, Math.round(Number(n))))).filter((n) => !Number.isNaN(n)) : [];
    const scenario = {
      label: String(s.label || 'Untitled scenario').slice(0, 40),
      accent: /^#[0-9A-Fa-f]{6}$/.test(s.accent) ? s.accent : '#FF5470',
      icon_key: ['alert', 'zap', 'shield', 'heart', 'water', 'flame', 'globe'].includes(s.icon_key) ? s.icon_key : 'alert',
      origin: Math.max(0, Math.min(6, Math.round(Number(s.origin) || 0))),
      down: clampNodes(s.down),
      respond: clampNodes(s.respond),
      phases: Array.isArray(s.phases) ? s.phases.slice(0, 5).map((p: any) => ({
        label: String(p.label || '').slice(0, 30),
        resilience: Math.max(0, Math.min(100, Math.round(Number(p.resilience) || 0))),
        affected: Math.max(0, Math.min(7, Math.round(Number(p.affected) || 0))),
        clock: String(p.clock || '00:00').slice(0, 6),
        desc: String(p.desc || '').slice(0, 240),
      })) : [],
    };

    return new Response(JSON.stringify({ scenario, model_used: MODEL }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

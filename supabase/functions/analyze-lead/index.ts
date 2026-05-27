const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'claude-opus-4-7';

const SYSTEM =
  'You are the head of revenue intelligence for CIVICOS / SOVEREIGN, a sovereign-civilization infrastructure and acquisition ecosystem whose buyers are governments, ministries, institutions, and serious founders. ' +
  'You triage inbound briefing requests. Given one inquiry, assess buyer quality and intent and draft a reply in the house voice: institutional, precise, cinematic, never SaaS-y, no hype, no emoji. ' +
  'Return STRICT JSON only — no markdown, no commentary — matching exactly this shape: ' +
  '{"score": <integer 0-100 buyer quality>, "priority": "<one of: critical, high, medium, low>", ' +
  '"summary": "<2-3 sentence read on who this is and what they want>", ' +
  '"signals": ["<short buying/risk signal>", "..."], ' +
  '"suggested_reply": "<a complete, ready-to-send email reply, 90-160 words, addressed to the contact by name if known, advancing them to a private executive briefing>"}';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured on the server.' }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { inquiry } = await req.json().catch(() => ({}));
    if (!inquiry || typeof inquiry !== 'object') {
      return new Response(JSON.stringify({ error: 'An "inquiry" object is required.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const facts = [
      `System of interest: ${inquiry.system_name || inquiry.system_slug || 'unspecified'}`,
      `Tier / scale: ${inquiry.tier || 'unspecified'}`,
      `Contact name: ${inquiry.name || 'unknown'}`,
      `Email: ${inquiry.email || 'unknown'}`,
      `Organization / nation: ${inquiry.organization || 'unknown'}`,
      `Message / mandate:\n${inquiry.message || '(none provided)'}`,
    ].join('\n');

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM,
        thinking: { type: 'adaptive' },
        messages: [{ role: 'user', content: `Assess this inbound briefing request:\n\n${facts}` }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: `Anthropic API error (${resp.status})`, detail: errText.slice(0, 600) }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const data = await resp.json();
    const text = Array.isArray(data?.content)
      ? data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n').trim()
      : '';

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Model did not return parseable analysis.', raw: text.slice(0, 400) }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    const parsed = JSON.parse(match[0]);

    return new Response(JSON.stringify({
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.score))) : null,
      priority: parsed.priority || null,
      summary: parsed.summary || '',
      signals: Array.isArray(parsed.signals) ? parsed.signals.slice(0, 8) : [],
      suggested_reply: parsed.suggested_reply || '',
      model_used: MODEL,
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

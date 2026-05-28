// domain-suggest: AI-powered sovereign domain naming. Generates candidate
// labels + TLDs + a short rationale from a natural-language brief using Claude.
// Availability/pricing is resolved separately by the registrar discovery layer.

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });
const MODEL = 'claude-opus-4-7';
// Registerable TLDs only (no restricted zones like .gov) so availability checks succeed.
const TLDS = ['com', 'so', 'io', 'ai', 'net', 'org', 'co', 'app', 'dev', 'city', 'cloud', 'tech'];

const SYSTEM =
  'You are the naming architect for SOVEREIGN — a civilization-scale digital infrastructure platform serving governments, banks, cities, and institutions. ' +
  'Generate domain name candidates that sound institutional, sovereign, and infrastructural — never SaaS-cute, no hype, no leetspeak. ' +
  'Favor authority, clarity, and weight. Respond with ONLY a JSON array, no prose, no markdown fences.';

function sanitizeLabel(s: string): string {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').slice(0, 40);
}

function extractJson(text: string): unknown[] {
  const a = text.indexOf('['); const b = text.lastIndexOf(']');
  if (a === -1 || b === -1 || b <= a) return [];
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ error: 'AI naming is not configured (ANTHROPIC_API_KEY missing).' }, 503);

    const body = await req.json().catch(() => ({}));
    const prompt = (body?.prompt as string || '').trim();
    const context = (body?.context as string || '').trim().slice(0, 120);
    if (!prompt || prompt.length < 2) return json({ error: 'A brief is required.' }, 400);
    const count = Math.min(Math.max(Number(body?.count) || 12, 4), 18);

    const instruction =
      (context ? `Deployment context: ${context}.\n` : '') +
      `Brief: "${prompt.slice(0, 400)}"\n\n` +
      `Produce ${count} domain candidates. Each item: {"label": lowercase name without dot/TLD (a-z 0-9 hyphen), ` +
      `"tld": one of ${TLDS.join('/')}, "why": a <=6 word rationale}. ` +
      `Vary the naming strategy (literal, compound, classical, geographic). Return ONLY the JSON array.`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 900, system: SYSTEM, messages: [{ role: 'user', content: instruction }] }),
    });
    if (!resp.ok) return json({ error: `AI naming error (${resp.status})`, detail: (await resp.text()).slice(0, 400) }, 502);

    const data = await resp.json();
    const text = Array.isArray(data?.content) ? data.content.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n') : '';
    const raw = extractJson(text) as Array<{ label?: string; tld?: string; why?: string }>;

    const seen = new Set<string>();
    const suggestions = raw
      .map((r) => ({ label: sanitizeLabel(r.label || ''), tld: TLDS.includes((r.tld || '').toLowerCase()) ? (r.tld as string).toLowerCase() : 'com', why: (r.why || '').slice(0, 60) }))
      .filter((r) => r.label.length >= 2)
      .filter((r) => { const k = `${r.label}.${r.tld}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, count);

    return json({ suggestions });
  } catch (e) {
    return json({ error: (e as Error).message || 'AI naming failed' }, 500);
  }
});

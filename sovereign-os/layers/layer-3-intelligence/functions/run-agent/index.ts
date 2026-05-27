import { createClient } from 'jsr:@supabase/supabase-js@2';
import { insertJob, transition } from '../../../layer-1-media/functions/_shared/queue.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AGENTS = new Set(['content', 'viral', 'competitor', 'brand-guardian', 'revenue', 'crisis-intelligence', 'executive-briefing']);

const BASE =
  'You are part of the Sovereign Strategic Intelligence Engine — an executive-grade, ' +
  'restrained institutional analyst. Return STRICT JSON only: {"summary":"...","data":{...}}.';

const FOCUS: Record<string, string> = {
  content: 'propose media content angles + briefs.',
  viral: 'estimate virality drivers and a 0-100 viral_score.',
  competitor: 'map competitor moves and exploitable gaps.',
  'brand-guardian': 'flag brand-safety/narrative risks with severity and fixes.',
  revenue: 'identify funnel leaks and revenue levers with impact.',
  'crisis-intelligence': 'assess crisis signals, severity, and a calm action plan.',
  'executive-briefing': 'synthesize a cross-layer executive briefing.',
};

// Runs a Layer 3 strategic agent and records it as a kind:'intelligence' pipeline job.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  try {
    const { agent, prompt = '', context } = await req.json().catch(() => ({}));
    if (!AGENTS.has(agent)) {
      return new Response(JSON.stringify({ error: `Unknown agent "${agent}".` }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const jobId = await insertJob(admin, { kind: 'intelligence', status: 'processing', provider: 'anthropic', title: `agent:${agent}`, input: { agent, prompt: String(prompt).slice(0, 1000) } });

    if (!apiKey) {
      if (jobId) await transition(admin, jobId, { status: 'failed', error: 'ANTHROPIC_API_KEY not configured' });
      return new Response(JSON.stringify({ error: 'Intelligence dormant — set ANTHROPIC_API_KEY.', job_id: jobId }), { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const userContent = context ? `${prompt}\n\nContext:\n${JSON.stringify(context).slice(0, 6000)}` : String(prompt);
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: Deno.env.get('SOVEREIGN_AGENT_MODEL') ?? 'claude-opus-4-7', max_tokens: 1500, system: `${BASE} Focus: ${FOCUS[agent]}`, messages: [{ role: 'user', content: userContent }] }),
    });
    if (!r.ok) {
      if (jobId) await transition(admin, jobId, { status: 'failed', error: `Anthropic HTTP ${r.status}` });
      return new Response(JSON.stringify({ error: `Anthropic error (${r.status})`, job_id: jobId }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    const body = await r.json();
    const text = (body.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n');
    const m = text.match(/\{[\s\S]*\}/);
    const result = m ? JSON.parse(m[0]) : { summary: text.slice(0, 300) };

    if (jobId) await transition(admin, jobId, { status: 'done', result });
    return new Response(JSON.stringify({ job_id: jobId, agent, ...result }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});

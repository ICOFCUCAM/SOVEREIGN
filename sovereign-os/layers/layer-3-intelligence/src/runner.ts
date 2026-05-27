import type { AgentId, AgentInput, AgentResult } from './types.js';
import { SYSTEM_PROMPTS } from './prompts.js';

export interface RunnerOptions {
  apiKey?: string;
  model?: string;
}

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Runs a strategic agent against Claude. Returns a dormant no-op (implemented:false)
// when no API key is configured, so callers degrade gracefully.
export async function runAgent(id: AgentId, input: AgentInput, opts: RunnerOptions = {}): Promise<AgentResult> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { agent: id, summary: `${id} agent dormant — set ANTHROPIC_API_KEY`, implemented: false };
  }
  const model = opts.model ?? process.env.SOVEREIGN_AGENT_MODEL ?? 'claude-opus-4-7';

  const userContent = input.context
    ? `${input.prompt}\n\nContext:\n${JSON.stringify(input.context).slice(0, 6000)}`
    : input.prompt;

  try {
    const r = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 1500,
        system: SYSTEM_PROMPTS[id],
        messages: [{ role: 'user', content: userContent }],
      }),
    });
    if (!r.ok) {
      return { agent: id, summary: 'agent call failed', implemented: true, error: `Anthropic HTTP ${r.status}` };
    }
    const body = (await r.json()) as { content?: { type: string; text?: string }[] };
    const text = (body.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { agent: id, summary: text.slice(0, 300), implemented: true };
    const parsed = JSON.parse(match[0]) as { summary?: string; data?: Record<string, unknown> };
    return { agent: id, summary: parsed.summary ?? '', data: parsed.data, implemented: true };
  } catch (e) {
    return { agent: id, summary: 'agent error', implemented: true, error: (e as Error).message };
  }
}

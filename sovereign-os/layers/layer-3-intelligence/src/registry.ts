import type { AgentId, AgentMeta } from './types.js';
import { AGENT_META } from './prompts.js';

export const AGENT_IDS = Object.keys(AGENT_META) as AgentId[];

export function getAgentMeta(id: AgentId): AgentMeta {
  return AGENT_META[id];
}

export function isAgentId(value: string): value is AgentId {
  return value in AGENT_META;
}

/** Shape an agent run as a pipeline job for the shared queue (kind: 'intelligence'). */
export function toJobInput(id: AgentId, prompt: string, context?: Record<string, unknown>) {
  return { kind: 'intelligence' as const, title: `agent:${id}`, input: { agent: id, prompt, context } };
}

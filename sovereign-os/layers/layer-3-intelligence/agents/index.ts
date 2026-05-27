import type { PipelineJob } from '@sovereign/core/types';

// Strategic Intelligence Engine — typed agent registry.
// Each agent runs as a `kind: 'intelligence'` job. `analyze-lead` (migrated) is the
// working seed behind the acquisition-optimization surface; the seven strategic agents
// are declared here so the engine has a complete, typed contract from day one.

export type AgentId =
  | 'content'
  | 'viral'
  | 'competitor'
  | 'brand-guardian'
  | 'revenue'
  | 'crisis-intelligence'
  | 'executive-briefing';

export interface AgentInput {
  prompt: string;
  context?: Record<string, unknown>;
}

export interface AgentResult {
  agent: AgentId;
  summary: string;
  data?: Record<string, unknown>;
  implemented: boolean;
}

export interface Agent {
  id: AgentId;
  description: string;
  run(input: AgentInput): Promise<AgentResult>;
}

function seam(id: AgentId, description: string): Agent {
  return {
    id,
    description,
    async run(): Promise<AgentResult> {
      return { agent: id, summary: `${id} agent seam — inference not yet wired`, implemented: false };
    },
  };
}

export const agents: Record<AgentId, Agent> = {
  content: seam('content', 'Generates and optimizes media content briefs feeding Layer 1.'),
  viral: seam('viral', 'Viral forecasting and trend intelligence.'),
  competitor: seam('competitor', 'Competitor monitoring and influence mapping.'),
  'brand-guardian': seam('brand-guardian', 'Brand-safety and narrative-consistency guardrails.'),
  revenue: seam('revenue', 'Acquisition-funnel and revenue optimization.'),
  'crisis-intelligence': seam('crisis-intelligence', 'Crisis detection and response recommendations.'),
  'executive-briefing': seam('executive-briefing', 'Synthesizes the daily executive briefing across layers.'),
};

export function getAgent(id: AgentId): Agent {
  return agents[id];
}

/** Shape an agent run into a pipeline job input for the shared queue. */
export function toJobInput(id: AgentId, input: AgentInput): Pick<PipelineJob, 'kind' | 'title' | 'input'> {
  return { kind: 'intelligence', title: `agent:${id}`, input: { agent: id, ...input } };
}

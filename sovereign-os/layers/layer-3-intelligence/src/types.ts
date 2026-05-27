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
  /** False when inference was unavailable (no API key) — the call is a dormant no-op. */
  implemented: boolean;
  error?: string;
}

export interface AgentMeta {
  id: AgentId;
  label: string;
  description: string;
}

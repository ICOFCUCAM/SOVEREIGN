import type { AgentId, AgentMeta } from './types.js';

export const AGENT_META: Record<AgentId, AgentMeta> = {
  content: { id: 'content', label: 'Content', description: 'Generates and optimizes media briefs feeding Layer 1.' },
  viral: { id: 'viral', label: 'Viral', description: 'Viral forecasting and trend intelligence.' },
  competitor: { id: 'competitor', label: 'Competitor', description: 'Competitor monitoring and influence mapping.' },
  'brand-guardian': { id: 'brand-guardian', label: 'Brand Guardian', description: 'Brand-safety and narrative-consistency guardrails.' },
  revenue: { id: 'revenue', label: 'Revenue', description: 'Acquisition-funnel and revenue optimization.' },
  'crisis-intelligence': { id: 'crisis-intelligence', label: 'Crisis Intelligence', description: 'Crisis detection and response recommendations.' },
  'executive-briefing': { id: 'executive-briefing', label: 'Executive Briefing', description: 'Synthesizes the cross-layer executive briefing.' },
};

const BASE =
  'You are part of the Sovereign Strategic Intelligence Engine — an executive-grade, ' +
  'restrained, institutional analyst. Return STRICT JSON only: ' +
  '{"summary":"<2-3 sentence executive takeaway>","data":{<structured findings>}}. No prose outside the JSON.';

export const SYSTEM_PROMPTS: Record<AgentId, string> = {
  content: `${BASE} Focus: propose media content angles + briefs (title, hook, media_class, target platforms).`,
  viral: `${BASE} Focus: estimate virality drivers, trend windows, and a 0-100 viral_score with rationale.`,
  competitor: `${BASE} Focus: map competitor moves, share-of-voice, and exploitable gaps.`,
  'brand-guardian': `${BASE} Focus: flag brand-safety/narrative-consistency risks with severity and fixes.`,
  revenue: `${BASE} Focus: identify acquisition-funnel leaks and revenue levers with expected impact.`,
  'crisis-intelligence': `${BASE} Focus: assess crisis signals, severity, and a calm action plan.`,
  'executive-briefing': `${BASE} Focus: synthesize a daily executive briefing across media, distribution, and intelligence.`,
};

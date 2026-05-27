# Layer 3 — Strategic Intelligence Engine

AI-powered strategic intelligence and acquisition optimization. Packaged as
`@sovereign/intelligence` (builds via `tsc`).

## `src/` — the intelligence library

- `types.ts` — `AgentId`, `AgentInput`, `AgentResult`, `AgentMeta`.
- `prompts.ts` — per-agent system prompts + metadata for all 7 agents.
- `runner.ts` — `runAgent(id, input)` calls Claude with the agent's system prompt and
  parses a strict-JSON `{ summary, data }` result. Returns a dormant no-op
  (`implemented: false`) when `ANTHROPIC_API_KEY` is absent.
- `registry.ts` — `AGENT_IDS`, `isAgentId`, `getAgentMeta`, and `toJobInput` (shapes a run
  as a `kind: 'intelligence'` job for the shared queue).

## Agents

Content · Viral · Competitor · Brand Guardian · Revenue · Crisis Intelligence ·
Executive Briefing.

## Edge function

`functions/run-agent` (Deno) runs an agent against Claude and records the run as a
`kind: 'intelligence'` pipeline job (processing → done/failed). `functions/analyze-lead`
remains the live acquisition-scoring seed.

## Status

Built; runner dormant-path + registry runtime-verified. Live inference needs
`ANTHROPIC_API_KEY` and has not been exercised against the API here. The Deno `run-agent`
function is written to the same contract but not runtime-tested (no `deno` in CI).

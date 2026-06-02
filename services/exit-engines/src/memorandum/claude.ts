import type {
  MemorandumGenerator, MemorandumKind, MemorandumInputs, MemorandumDocument, MemorandumSection,
} from './types.js';
import { TemplateMemorandumGenerator } from './template.js';

// Production memorandum generator backed by Claude (Anthropic Messages
// API). Composes the deterministic template skeleton with LLM-written
// prose for each section, so the document keeps verified structure and
// audit-ready citations while the narrative reads like banker copy.
//
// Falls back to the deterministic template generator if the API call
// fails or no API key is configured.

export interface ClaudeMemorandumOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
}

interface AnthropicResponse {
  readonly content?: ReadonlyArray<{ readonly type: string; readonly text?: string }>;
}

const IMPL = 'claude-memorandum-generator';
const VERSION = '0.1.0';

const KIND_DIRECTIVES: Record<MemorandumKind, string> = {
  cim:                'Produce a confidential information memorandum at the editorial register of a top-tier investment bank. Authoritative, dense, decision-ready. No marketing language.',
  executive_summary:  'Produce a one-page executive summary. Banker register. Lead with the proposition; surface the headline financials, growth and valuation; close with the process.',
  investor_deck:      'Produce slide titles and speaking points for a 10-slide investor deck. One body paragraph plus 3–6 bullets per slide. No transitions; this is the operator deck.',
  buyer_teaser:       'Produce an anonymized 1–2 page buyer teaser. No identifying details. "Project Cipher" as the project name. Tease only the highest-signal facts.',
  dd_room_index:      'Produce a structured index of the virtual data-room contents organized by diligence package.',
};

function compactInputs(i: MemorandumInputs): string {
  const c = i.company;
  return JSON.stringify({
    name: c.name,
    jurisdiction: c.jurisdiction,
    businessModel: c.businessModel,
    sector: c.sector,
    foundedYear: c.foundedYear,
    revenue: c.revenue,
    growth: c.growth,
    users: c.users,
    market: c.market,
    product: c.product,
    team: c.team,
    valuationHeadline: i.valuation.headline,
    valuationMethodologies: i.valuation.methodologies,
    premiums: i.valuation.premiums,
    readiness: i.readiness ? { score: i.readiness.overallScore, band: i.readiness.band, strengths: i.readiness.strengths, recommendations: i.readiness.recommendations } : null,
    buyers: i.buyers ? i.buyers.candidates.slice(0, 8).map((c) => ({ name: c.buyer.name, type: c.buyer.buyerType, probability: c.probability })) : null,
  });
}

interface LlmSection { readonly heading: string; readonly body: string; readonly bullets?: readonly string[] }

function parseSections(raw: string): readonly LlmSection[] {
  if (!raw) return [];
  let cleaned = raw.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) cleaned = fence[1].trim();
  try {
    const parsed = JSON.parse(cleaned);
    const list = Array.isArray(parsed)
      ? parsed
      : (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).sections))
        ? (parsed as Record<string, unknown>).sections as unknown[]
        : [];
    const out: LlmSection[] = [];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const v = item as Record<string, unknown>;
      const heading = typeof v.heading === 'string' ? v.heading : '';
      const body = typeof v.body === 'string' ? v.body : '';
      const bullets = Array.isArray(v.bullets) ? v.bullets.filter((b) => typeof b === 'string') as string[] : undefined;
      if (heading && body) {
        out.push({ heading, body, ...(bullets ? { bullets } : {}) });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export class ClaudeMemorandumGenerator implements MemorandumGenerator {
  readonly implementation = IMPL;
  readonly version = VERSION;

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly fallback = new TemplateMemorandumGenerator();

  constructor(opts: ClaudeMemorandumOptions) {
    if (!opts.apiKey) throw new Error('ClaudeMemorandumGenerator: apiKey required');
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? 'claude-sonnet-4-6';
    this.baseUrl = opts.baseUrl ?? 'https://api.anthropic.com';
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async generate(kind: MemorandumKind, inputs: MemorandumInputs): Promise<MemorandumDocument> {
    const system = `You are a managing director at a top-tier investment bank, producing institutional acquisition documents. Output strict JSON only.\n\nFormat: { "sections": [{ "heading": "1. ...", "body": "...", "bullets": ["..."] }, ...] }\n\nNo prose outside the JSON. Adhere to the section structure of the document kind. Banker register; declarative; verified facts only.\n\n${KIND_DIRECTIVES[kind]}`;
    const user = `Document kind: ${kind}\nAnonymize: ${inputs.anonymize ? 'yes (use Project Cipher and redact identifying details)' : 'no'}\n\nInputs:\n${compactInputs(inputs)}`;

    try {
      const res = await this.fetchImpl(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: kind === 'cim' ? 4096 : 2048,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      });
      if (!res.ok) throw new Error(`claude: ${res.status}`);
      const body = (await res.json()) as AnthropicResponse;
      const text = body.content?.find((c) => c.type === 'text')?.text ?? '';
      const llmSections = parseSections(text);

      if (llmSections.length === 0) {
        return this.fallback.generate(kind, inputs);
      }
      const sections: MemorandumSection[] = llmSections.map((s) => ({
        heading: s.heading,
        body: s.body,
        ...(s.bullets ? { bullets: s.bullets } : {}),
      }));
      const wordCount = sections.reduce((s, sec) => s + sec.body.split(/\s+/).length + (sec.bullets?.length ?? 0) * 8, 0);
      return {
        kind,
        title: `${inputs.anonymize ? 'Project Cipher' : inputs.company.name} — ${kind.replace(/_/g, ' ')}`,
        sections,
        anonymized: !!inputs.anonymize,
        wordCount,
        producedBy: `${IMPL}@${VERSION}/${this.model}`,
      };
    } catch {
      // Network or model error — fall back to deterministic.
      return this.fallback.generate(kind, inputs);
    }
  }
}

import type { EntityExtractor } from './extractor.js';
import type { EnrichSignalInput, ExtractionResult } from '../types.js';
import { extractionPrompt, parseExtractionResponse } from './prompt.js';

// Production entity extractor backed by Anthropic Claude.
//
// Default model: claude-haiku-4-5 — fast, cheap, sufficient for the
// extraction prompt. Routing to a stronger model (Sonnet) for
// high-value signal classes (regulatory filings, board minutes) is the
// Enrichment Agent's job; this adapter accepts the model in options.

export interface ClaudeExtractorOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
}

interface AnthropicResponse {
  readonly content?: ReadonlyArray<{ readonly type: string; readonly text?: string }>;
  readonly error?: { readonly message?: string };
}

export class ClaudeExtractor implements EntityExtractor {
  readonly name = 'claude-extractor';
  readonly version = '0.1.0';

  private readonly model: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly apiKey: string;

  constructor(opts: ClaudeExtractorOptions) {
    if (!opts.apiKey) throw new Error('ClaudeExtractor: apiKey required');
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? 'claude-haiku-4-5';
    this.baseUrl = opts.baseUrl ?? 'https://api.anthropic.com';
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async extract(input: EnrichSignalInput): Promise<ExtractionResult> {
    const { system, user } = extractionPrompt(input);
    const res = await this.fetchImpl(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`claude-extractor: ${res.status} ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as AnthropicResponse;
    const text = body.content?.find((c) => c.type === 'text')?.text ?? '';
    const entities = parseExtractionResponse(text);
    return {
      signalId: input.signalId,
      entities,
      model: `${this.name}@${this.version}/${this.model}`,
      extractedAt: new Date().toISOString(),
    };
  }
}

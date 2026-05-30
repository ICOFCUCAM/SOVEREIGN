import type { Embedder } from './embedder.js';
import { EMBEDDING_DIMENSIONS } from './embedder.js';
import type { EmbeddingResult } from '../types.js';

// Production embedder backed by Voyage AI. voyage-3 emits 1024-dim
// vectors that match the intel_signal_embeddings.embedding column.

export interface VoyageEmbedderOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
}

interface VoyageResponse {
  readonly data?: ReadonlyArray<{ readonly embedding: readonly number[] }>;
  readonly error?: { readonly message?: string };
}

export class VoyageEmbedder implements Embedder {
  readonly name = 'voyage-embedder';
  readonly model: string;
  readonly dimensions = EMBEDDING_DIMENSIONS;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: VoyageEmbedderOptions) {
    if (!opts.apiKey) throw new Error('VoyageEmbedder: apiKey required');
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? 'voyage-3';
    this.baseUrl = opts.baseUrl ?? 'https://api.voyageai.com';
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async embed(signalId: string, text: string): Promise<EmbeddingResult> {
    const results = await this.embedBatch([{ signalId, text }]);
    const first = results[0];
    if (!first) throw new Error('voyage-embedder: empty response');
    return first;
  }

  async embedBatch(items: ReadonlyArray<{ readonly signalId: string; readonly text: string }>): Promise<readonly EmbeddingResult[]> {
    if (items.length === 0) return [];
    const res = await this.fetchImpl(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: items.map((it) => it.text.slice(0, 32000)),
        input_type: 'document',
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`voyage-embedder: ${res.status} ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as VoyageResponse;
    if (!body.data || body.data.length !== items.length) {
      throw new Error('voyage-embedder: response length mismatch');
    }
    const embeddedAt = new Date().toISOString();
    return items.map((it, i) => {
      const vec = body.data?.[i]?.embedding ?? [];
      if (vec.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(`voyage-embedder: expected ${EMBEDDING_DIMENSIONS} dims, got ${vec.length}`);
      }
      return { signalId: it.signalId, embedding: vec, model: `${this.name}@${this.model}`, embeddedAt };
    });
  }
}

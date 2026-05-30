import { createHash } from 'node:crypto';
import type { Embedder } from './embedder.js';
import type { EmbeddingResult } from '../types.js';
import { EMBEDDING_DIMENSIONS } from './embedder.js';

// Deterministic mock embedder. Produces a normalized 1024-dim vector
// from a SHA-512 hash of the input text. Honest reference for tests
// and integration: nothing about it is semantically meaningful — it's
// here so the pipeline stays exercised without a network call.

export class MockEmbedder implements Embedder {
  readonly name = 'mock-embedder';
  readonly model = 'mock-1024';
  readonly dimensions = EMBEDDING_DIMENSIONS;

  async embed(signalId: string, text: string): Promise<EmbeddingResult> {
    const buf = Buffer.alloc(0);
    const seeds: Buffer[] = [];
    for (let i = 0; seeds.length * 64 < EMBEDDING_DIMENSIONS * 8; i++) {
      seeds.push(createHash('sha512').update(`${text}::${i}`).digest());
    }
    const concat = Buffer.concat(seeds);
    const vec = new Array<number>(EMBEDDING_DIMENSIONS);
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      const byte = concat[i] ?? 0;
      vec[i] = (byte - 128) / 128;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) vec[i] = (vec[i] ?? 0) / norm;

    return {
      signalId,
      embedding: vec,
      model: `${this.name}@${this.model}`,
      embeddedAt: new Date().toISOString(),
    };
  }
}

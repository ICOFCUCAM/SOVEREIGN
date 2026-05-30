import type { EmbeddingResult } from '../types.js';

export const EMBEDDING_DIMENSIONS = 1024 as const;

export interface Embedder {
  readonly name: string;
  readonly model: string;
  readonly dimensions: number;
  embed(signalId: string, text: string): Promise<EmbeddingResult>;
  embedBatch?(items: ReadonlyArray<{ readonly signalId: string; readonly text: string }>): Promise<readonly EmbeddingResult[]>;
}

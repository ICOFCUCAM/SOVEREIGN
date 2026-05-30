import type { EnrichSignalInput, ExtractionResult } from '../types.js';

// EntityExtractor — the interface every extraction backend implements.
// The runner is backend-agnostic; swap Mock for production Claude /
// OpenAI without touching the pipeline.

export interface EntityExtractor {
  readonly name: string;
  readonly version: string;
  extract(input: EnrichSignalInput): Promise<ExtractionResult>;
  // Optional: batched extraction. The runner uses this when the
  // backend supports it (Claude Message Batches, etc.); otherwise it
  // falls back to extract() in a loop.
  extractBatch?(inputs: readonly EnrichSignalInput[]): Promise<readonly ExtractionResult[]>;
}

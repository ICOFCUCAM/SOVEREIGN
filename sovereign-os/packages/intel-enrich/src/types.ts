import type { EntityType, Sentiment, SignalEntity } from '@sovereign/intel-core';

// Input for enrichment — the connector-emitted signal shape, distilled
// down to what the enrichers need.

export interface EnrichSignalInput {
  readonly signalId: string;
  readonly tenantId: string;
  readonly title?: string;
  readonly bodyExcerpt?: string;
  readonly canonicalUrl?: string;
  readonly signalClass: string;
  readonly publishedAt: string;
}

// Extracted entity mention from a single signal. Not yet resolved to a
// canonical intel_entities row.
export interface ExtractedEntity {
  readonly entityType: EntityType;
  readonly mention: string;
  readonly aliases?: readonly string[];
  readonly salience: number;
  readonly sentiment?: Sentiment;
  readonly role?: SignalEntity['role'];
  readonly externalIds?: Readonly<Record<string, string>>;
  readonly attributes?: Readonly<Record<string, unknown>>;
}

// Result of extracting from one signal.
export interface ExtractionResult {
  readonly signalId: string;
  readonly entities: readonly ExtractedEntity[];
  readonly model: string;
  readonly extractedAt: string;
}

// Result of embedding one signal.
export interface EmbeddingResult {
  readonly signalId: string;
  readonly embedding: readonly number[];
  readonly model: string;
  readonly embeddedAt: string;
}

// Detected language: ISO 639-1 code + confidence.
export interface DetectedLanguage {
  readonly language: string;
  readonly confidence: number;
}

// Resolution outcome for one extracted mention.
export interface ResolutionOutcome {
  readonly mention: ExtractedEntity;
  readonly entityId: string;
  readonly created: boolean;
  readonly confidence: number;
  readonly via: 'alias' | 'fuzzy' | 'external_id' | 'new';
}

// One signal's full enrichment, produced by the runner.
export interface EnrichmentRecord {
  readonly signalId: string;
  readonly tenantId: string;
  readonly language?: DetectedLanguage;
  readonly sentiment?: Sentiment;
  readonly embedding?: EmbeddingResult;
  readonly entities: readonly ResolutionOutcome[];
}

export * from './types.js';
export { detectLanguage } from './language.js';
export { scoreSentiment } from './sentiment.js';

export type { EntityExtractor } from './extract/extractor.js';
export { MockExtractor } from './extract/mock.js';
export { ClaudeExtractor, type ClaudeExtractorOptions } from './extract/claude.js';
export { extractionPrompt, parseExtractionResponse, ENTITY_TYPES_LIST } from './extract/prompt.js';

export type { Embedder } from './embed/embedder.js';
export { EMBEDDING_DIMENSIONS } from './embed/embedder.js';
export { MockEmbedder } from './embed/mock.js';
export { VoyageEmbedder, type VoyageEmbedderOptions } from './embed/voyage.js';

export type { EntityResolver, EntityBucket } from './resolve/resolver.js';
export { normalizeName, jaccard } from './resolve/resolver.js';
export { MockResolver } from './resolve/mock.js';
export { SupabaseEntityResolver } from './resolve/supabase.js';
export { WikidataClient, type WikidataMatch, type WikidataClientOptions } from './resolve/wikidata.js';

export {
  enrichOne, runUnenrichedForTenant,
  type EnrichmentPipeline, type RunUnenrichedOptions, type EnrichmentOutcome,
} from './runner.js';

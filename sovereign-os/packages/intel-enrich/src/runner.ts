import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConnectorLogger } from '@sovereign/intel-core';
import { consoleLogger } from '@sovereign/intel-core';
import type { EntityExtractor } from './extract/extractor.js';
import type { Embedder } from './embed/embedder.js';
import type { EntityResolver } from './resolve/resolver.js';
import { detectLanguage } from './language.js';
import { scoreSentiment } from './sentiment.js';
import type { EnrichSignalInput, EnrichmentRecord, ResolutionOutcome } from './types.js';

export interface EnrichmentPipeline {
  readonly extractor: EntityExtractor;
  readonly embedder: Embedder;
  readonly resolver: EntityResolver;
  readonly logger?: ConnectorLogger;
}

export interface RunUnenrichedOptions {
  readonly supabase: SupabaseClient;
  readonly tenantId: string;
  readonly pipeline: EnrichmentPipeline;
  readonly limit?: number;
}

export interface EnrichmentOutcome {
  readonly signalsProcessed: number;
  readonly entitiesResolved: number;
  readonly entitiesCreated: number;
  readonly embeddingsWritten: number;
  readonly errors: readonly string[];
}

// Walk one signal through the full pipeline: language → sentiment →
// extraction → embedding → resolution → persist. Returns an
// EnrichmentRecord that the caller may inspect; persistence happens
// inline.

export async function enrichOne(
  supabase: SupabaseClient,
  signal: EnrichSignalInput,
  pipeline: EnrichmentPipeline,
): Promise<EnrichmentRecord & { readonly errors: readonly string[] }> {
  const log = pipeline.logger ?? consoleLogger;
  const errors: string[] = [];
  const text = `${signal.title ?? ''}\n${signal.bodyExcerpt ?? ''}`.trim();

  // Language + sentiment (always local, no errors expected).
  const language = detectLanguage(text);
  const sentiment = scoreSentiment(text);

  // Extraction.
  let extracted: Awaited<ReturnType<EntityExtractor['extract']>> | undefined;
  try {
    extracted = await pipeline.extractor.extract(signal);
  } catch (e) {
    errors.push(`extract: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Embedding.
  let embedding: Awaited<ReturnType<Embedder['embed']>> | undefined;
  try {
    embedding = await pipeline.embedder.embed(signal.signalId, text);
  } catch (e) {
    errors.push(`embed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Resolution.
  const resolved: ResolutionOutcome[] = [];
  if (extracted) {
    for (const m of extracted.entities) {
      try {
        resolved.push(await pipeline.resolver.resolve(signal.tenantId, m));
      } catch (e) {
        errors.push(`resolve(${m.mention}): ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // Persist sentiment + language onto the signal.
  {
    const { error } = await supabase
      .from('intel_signals')
      .update({
        sentiment,
        language: language.language,
      })
      .eq('id', signal.signalId);
    if (error) errors.push(`update signal: ${error.message}`);
  }

  // Persist signal_entities junction rows.
  if (resolved.length > 0) {
    const rows = resolved.map((r) => ({
      signal_id: signal.signalId,
      entity_id: r.entityId,
      tenant_id: signal.tenantId,
      salience: r.mention.salience,
      ...(r.mention.sentiment !== undefined ? { sentiment: r.mention.sentiment } : {}),
      ...(r.mention.role !== undefined ? { role: r.mention.role } : {}),
    }));
    const { error } = await supabase.from('intel_signal_entities').upsert(rows, { onConflict: 'signal_id,entity_id' });
    if (error) errors.push(`upsert signal_entities: ${error.message}`);
  }

  // Persist embedding.
  if (embedding) {
    const vector = pgVectorLiteral(embedding.embedding);
    const { error } = await supabase
      .from('intel_signal_embeddings')
      .upsert(
        {
          signal_id: signal.signalId,
          tenant_id: signal.tenantId,
          embedding: vector,
          model: embedding.model,
        },
        { onConflict: 'signal_id' },
      );
    if (error) errors.push(`upsert embedding: ${error.message}`);
  }

  if (errors.length > 0) log.warn('enrich: completed with errors', { signalId: signal.signalId, errors });

  return {
    signalId: signal.signalId,
    tenantId: signal.tenantId,
    language,
    sentiment,
    ...(embedding !== undefined ? { embedding } : {}),
    entities: resolved,
    errors,
  };
}

// Convenience: pull unenriched signals for a tenant (no embedding yet)
// and run the pipeline against each. Caller controls batch size.

export async function runUnenrichedForTenant(opts: RunUnenrichedOptions): Promise<EnrichmentOutcome> {
  const limit = Math.max(1, Math.min(opts.limit ?? 50, 200));
  // Pull signals that have no embedding yet — the simplest "unenriched"
  // proxy. The Enrichment Agent in 1.7 introduces a proper claim
  // table; for 1.3, this query is sufficient.
  const { data: signals, error } = await opts.supabase
    .from('intel_signals')
    .select('id, tenant_id, title, body_excerpt, canonical_url, signal_class, published_at')
    .eq('tenant_id', opts.tenantId)
    .not('id', 'in',
      `(select signal_id from public.intel_signal_embeddings where tenant_id = '${opts.tenantId}')`,
    )
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`runUnenrichedForTenant: ${error.message}`);

  let entitiesResolved = 0;
  let entitiesCreated = 0;
  let embeddingsWritten = 0;
  const errors: string[] = [];

  for (const row of signals ?? []) {
    const input: EnrichSignalInput = {
      signalId: row.id,
      tenantId: row.tenant_id,
      ...(row.title       !== null ? { title: row.title }              : {}),
      ...(row.body_excerpt !== null ? { bodyExcerpt: row.body_excerpt } : {}),
      ...(row.canonical_url !== null ? { canonicalUrl: row.canonical_url } : {}),
      signalClass: row.signal_class,
      publishedAt: row.published_at,
    };
    const r = await enrichOne(opts.supabase, input, opts.pipeline);
    entitiesResolved += r.entities.length;
    entitiesCreated  += r.entities.filter((e) => e.created).length;
    if (r.embedding) embeddingsWritten += 1;
    errors.push(...r.errors);
  }

  return {
    signalsProcessed:  signals?.length ?? 0,
    entitiesResolved,
    entitiesCreated,
    embeddingsWritten,
    errors,
  };
}

// pgvector literal: '[0.1,0.2,...]' — Supabase serializes vector via text.
function pgVectorLiteral(vec: readonly number[]): string {
  return `[${vec.map((v) => Number.isFinite(v) ? v.toFixed(6) : '0').join(',')}]`;
}

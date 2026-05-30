import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConnectorPullResult, NormalizedSignal } from '@sovereign/intel-core';

export interface NormalizerContext {
  readonly supabase: SupabaseClient;
  readonly tenantId: string;
  readonly sourceId: string;
  readonly ingestRunId?: string;
}

export interface PersistOutcome {
  readonly pulled: number;
  readonly inserted: number;
  readonly duplicates: number;
  readonly errors: readonly string[];
}

// Persist a ConnectorPullResult into intel_raw_documents + intel_signals.
// Dedup strategy: content_hash carries the canonical fingerprint;
// inserts that violate the (tenant_id, content_hash) unique constraint
// are counted as duplicates rather than errors.

export async function persist(
  ctx: NormalizerContext,
  result: ConnectorPullResult,
): Promise<PersistOutcome> {
  const errors: string[] = [];
  let inserted = 0;
  let duplicates = 0;

  const rawByHash = new Map<string, ConnectorPullResult['raws'][number]>();
  for (const r of result.raws) rawByHash.set(r.contentHash, r);

  for (const signal of result.signals) {
    const raw = pickRawForSignal(signal, rawByHash);
    let rawDocumentId: string | undefined;

    if (raw) {
      const rawInsert = await ctx.supabase
        .from('intel_raw_documents')
        .insert({
          tenant_id:       ctx.tenantId,
          source_id:       ctx.sourceId,
          ingest_run_id:   ctx.ingestRunId ?? null,
          content_hash:    bytesFromHex(raw.contentHash),
          canonical_url:   raw.canonicalUrl ?? null,
          mime:            raw.mime,
          bytes:           raw.bytes,
          storage_path:    null,
          payload_excerpt: raw.payloadExcerpt ?? null,
          provenance:      raw.provenance,
        })
        .select('id')
        .single();

      if (rawInsert.error) {
        // Duplicate raw (same tenant+hash) is fine — look up the existing id.
        if (isUniqueViolation(rawInsert.error)) {
          const existing = await ctx.supabase
            .from('intel_raw_documents')
            .select('id')
            .eq('tenant_id', ctx.tenantId)
            .eq('content_hash', bytesFromHex(raw.contentHash))
            .maybeSingle();
          rawDocumentId = existing.data?.id;
        } else {
          errors.push(`raw insert: ${rawInsert.error.message}`);
        }
      } else {
        rawDocumentId = rawInsert.data?.id;
      }
    }

    const signalInsert = await ctx.supabase
      .from('intel_signals')
      .insert({
        tenant_id:           ctx.tenantId,
        source_id:           ctx.sourceId,
        raw_document_id:     rawDocumentId ?? null,
        content_hash:        bytesFromHex(signal.contentHash),
        canonical_url:       signal.canonicalUrl ?? null,
        signal_class:        signal.signalClass,
        published_at:        signal.publishedAt,
        language:            signal.language ?? null,
        title:               signal.title ?? null,
        body_excerpt:        signal.bodyExcerpt ?? null,
        summary:             signal.summary ?? null,
        geo_focus:           signal.geoFocus ?? null,
        sentiment:           signal.sentiment ?? null,
        influence_score:     signal.influenceScore ?? null,
        velocity_at_ingest:  signal.velocityAtIngest ?? null,
        attestations:        signal.attestations ?? {},
        provenance:          signal.provenance,
      });

    if (signalInsert.error) {
      if (isUniqueViolation(signalInsert.error)) {
        duplicates += 1;
      } else {
        errors.push(`signal insert: ${signalInsert.error.message}`);
      }
    } else {
      inserted += 1;
    }
  }

  return { pulled: result.signals.length, inserted, duplicates, errors };
}

// Insert a fresh intel_ingest_runs row for a connector pull.
export async function openIngestRun(
  supabase: SupabaseClient,
  tenantId: string,
  sourceId: string,
  connectorVersion: string,
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('intel_ingest_runs')
    .insert({
      tenant_id:         tenantId,
      source_id:         sourceId,
      started_at:        new Date().toISOString(),
      connector_version: connectorVersion,
    })
    .select('id')
    .single();
  if (error) {
    console.warn('[intel] openIngestRun failed:', error.message);
    return undefined;
  }
  return data?.id;
}

export async function closeIngestRun(
  supabase: SupabaseClient,
  runId: string,
  outcome: PersistOutcome,
  errorText?: string,
  metadata?: Readonly<Record<string, unknown>>,
): Promise<void> {
  await supabase
    .from('intel_ingest_runs')
    .update({
      finished_at:     new Date().toISOString(),
      pulled_count:    outcome.pulled,
      inserted_count:  outcome.inserted,
      duplicate_count: outcome.duplicates,
      ...(errorText !== undefined ? { error: errorText } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
    })
    .eq('id', runId);
}

// ── Helpers ──────────────────────────────────────────────────────────

function pickRawForSignal(
  signal: NormalizedSignal,
  rawByHash: Map<string, ConnectorPullResult['raws'][number]>,
): ConnectorPullResult['raws'][number] | undefined {
  // Naive: connectors that emit (raw_i, signal_i) in parallel use
  // matching i; for now pick the first raw with matching canonical_url.
  if (signal.canonicalUrl) {
    for (const raw of rawByHash.values()) {
      if (raw.canonicalUrl === signal.canonicalUrl) return raw;
    }
  }
  // Fallback — first raw available.
  const first = rawByHash.values().next();
  return first.done ? undefined : first.value;
}

function bytesFromHex(hex: string): string {
  // Supabase serializes bytea over JSON as `\x<hex>`.
  return `\\x${hex}`;
}

function isUniqueViolation(err: { code?: string; message?: string }): boolean {
  return err.code === '23505' || /duplicate key value/i.test(err.message ?? '');
}

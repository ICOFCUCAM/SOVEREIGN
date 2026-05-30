import type { SupabaseClient } from '@supabase/supabase-js';
import type { EntityResolver } from './resolver.js';
import { normalizeName, jaccard } from './resolver.js';
import type { ExtractedEntity, ResolutionOutcome } from '../types.js';

// Production-shaped resolver backed by intel_entities. Match order:
//   1. external_ids JSONB hit
//   2. canonical_name = normalized mention OR mention ∈ aliases[]
//   3. fuzzy: pg_trgm ilike + jaccard re-rank (top candidate ≥ 0.7)
//   4. create new row, return its id
//
// Operates under the caller's RLS context — the client passed in must
// already be tenant-scoped (service_role for workers, user-scoped JWT
// for interactive resolvers).

const FUZZY_THRESHOLD = 0.7;

export class SupabaseEntityResolver implements EntityResolver {
  readonly name = 'supabase-resolver';

  constructor(private readonly supabase: SupabaseClient) {}

  async resolve(tenantId: string, mention: ExtractedEntity): Promise<ResolutionOutcome> {
    const norm = normalizeName(mention.mention);

    // 1 · external_id hit
    if (mention.externalIds && Object.keys(mention.externalIds).length > 0) {
      const { data } = await this.supabase
        .from('intel_entities')
        .select('id, canonical_name, aliases, external_ids')
        .eq('tenant_id', tenantId)
        .eq('entity_type', mention.entityType)
        .contains('external_ids', mention.externalIds as Record<string, string>)
        .limit(1);
      if (data && data.length > 0 && data[0]) {
        return { mention, entityId: data[0].id, created: false, confidence: 0.98, via: 'external_id' };
      }
    }

    // 2 · canonical/alias exact (post-normalization)
    {
      const { data } = await this.supabase
        .from('intel_entities')
        .select('id, canonical_name, aliases')
        .eq('tenant_id', tenantId)
        .eq('entity_type', mention.entityType)
        .or(`canonical_name.ilike.${escapeIlike(mention.mention)},aliases.cs.{${escapeArray(mention.mention)}}`)
        .limit(8);
      if (data) {
        for (const row of data) {
          if (normalizeName(row.canonical_name) === norm) {
            return { mention, entityId: row.id, created: false, confidence: 0.95, via: 'alias' };
          }
          if (Array.isArray(row.aliases) && row.aliases.some((a: string) => normalizeName(a) === norm)) {
            return { mention, entityId: row.id, created: false, confidence: 0.9, via: 'alias' };
          }
        }
      }
    }

    // 3 · fuzzy via pg_trgm ilike + jaccard rerank
    {
      const { data } = await this.supabase
        .from('intel_entities')
        .select('id, canonical_name, aliases')
        .eq('tenant_id', tenantId)
        .eq('entity_type', mention.entityType)
        .ilike('canonical_name', `%${escapeIlike(mention.mention).replace(/%/g, '')}%`)
        .limit(16);
      if (data && data.length > 0) {
        let best: { id: string; score: number } | undefined;
        for (const row of data) {
          const score = Math.max(
            jaccard(row.canonical_name, mention.mention),
            ...(Array.isArray(row.aliases) ? row.aliases.map((a: string) => jaccard(a, mention.mention)) : []),
          );
          if (score >= FUZZY_THRESHOLD && (!best || score > best.score)) {
            best = { id: row.id, score };
          }
        }
        if (best) {
          return { mention, entityId: best.id, created: false, confidence: best.score, via: 'fuzzy' };
        }
      }
    }

    // 4 · create new
    const ins = await this.supabase
      .from('intel_entities')
      .insert({
        tenant_id: tenantId,
        entity_type: mention.entityType,
        canonical_name: mention.mention,
        aliases: mention.aliases ?? [],
        external_ids: mention.externalIds ?? {},
        attributes: mention.attributes ?? {},
        confidence: 0.7,
        mention_count: 1,
      })
      .select('id')
      .single();
    if (ins.error || !ins.data) {
      throw new Error(`supabase-resolver: create failed: ${ins.error?.message}`);
    }
    return { mention, entityId: ins.data.id, created: true, confidence: 0.7, via: 'new' };
  }
}

function escapeIlike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function escapeArray(s: string): string {
  return `"${s.replace(/"/g, '\\"')}"`;
}

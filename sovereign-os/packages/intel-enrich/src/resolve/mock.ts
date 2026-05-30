import { randomUUID } from 'node:crypto';
import type { EntityResolver, EntityBucket } from './resolver.js';
import { normalizeName, jaccard } from './resolver.js';
import type { ExtractedEntity, ResolutionOutcome } from '../types.js';

// In-memory resolver for tests + reference. Holds a per-tenant alias
// graph; matches by external_id → alias → trigram (jaccard ≥ 0.6).

const FUZZY_THRESHOLD = 0.6;

export class MockResolver implements EntityResolver {
  readonly name = 'mock-resolver';
  private readonly buckets = new Map<string, EntityBucket[]>();

  async resolve(tenantId: string, mention: ExtractedEntity): Promise<ResolutionOutcome> {
    const tenantBuckets = this.bucketsOf(tenantId);

    // 1. external_id hit
    if (mention.externalIds) {
      for (const [system, value] of Object.entries(mention.externalIds)) {
        for (const b of tenantBuckets) {
          if (b.entityType === mention.entityType && b.externalIds[system] === value) {
            return { mention, entityId: b.entityId, created: false, confidence: 0.98, via: 'external_id' };
          }
        }
      }
    }

    // 2. alias hit (normalized exact)
    const norm = normalizeName(mention.mention);
    for (const b of tenantBuckets) {
      if (b.entityType !== mention.entityType) continue;
      if (normalizeName(b.canonicalName) === norm) {
        return { mention, entityId: b.entityId, created: false, confidence: 0.95, via: 'alias' };
      }
      for (const a of b.aliases) if (normalizeName(a) === norm) {
        return { mention, entityId: b.entityId, created: false, confidence: 0.9, via: 'alias' };
      }
    }

    // 3. fuzzy (jaccard over normalized tokens)
    let best: { bucket: EntityBucket; score: number } | undefined;
    for (const b of tenantBuckets) {
      if (b.entityType !== mention.entityType) continue;
      const score = Math.max(
        jaccard(b.canonicalName, mention.mention),
        ...b.aliases.map((a) => jaccard(a, mention.mention)),
      );
      if (score >= FUZZY_THRESHOLD && (!best || score > best.score)) {
        best = { bucket: b, score };
      }
    }
    if (best) {
      return { mention, entityId: best.bucket.entityId, created: false, confidence: best.score, via: 'fuzzy' };
    }

    // 4. create new
    const entityId = randomUUID();
    tenantBuckets.push({
      entityId,
      entityType: mention.entityType,
      canonicalName: mention.mention,
      aliases: mention.aliases ?? [],
      externalIds: mention.externalIds ?? {},
    });
    return { mention, entityId, created: true, confidence: 0.7, via: 'new' };
  }

  private bucketsOf(tenantId: string): EntityBucket[] {
    let b = this.buckets.get(tenantId);
    if (!b) { b = []; this.buckets.set(tenantId, b); }
    return b;
  }
}

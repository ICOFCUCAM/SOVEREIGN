import type { EntityType } from '@sovereign/intel-core';
import type { ExtractedEntity, ResolutionOutcome } from '../types.js';

// EntityResolver — interface every resolution backend implements. The
// runner is backend-agnostic; alias + fuzzy resolution uses the
// substrate via SupabaseEntityResolver, while WikidataResolver layers
// on top to ground people / organizations against canonical QIDs.

export interface EntityResolver {
  readonly name: string;
  resolve(
    tenantId: string,
    mention: ExtractedEntity,
  ): Promise<ResolutionOutcome>;
}

// Normalize a string for alias comparison. Lowercase, collapse spaces,
// strip honorifics + corporate suffixes. Conservative.
export function normalizeName(input: string): string {
  let s = input.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/[.,'"`’]/g, '');
  s = s.replace(/^(mr|mrs|ms|dr|sir|hon|h\.e|ms\.|mrs\.|mr\.|dr\.)\s+/i, '');
  s = s.replace(/\b(inc|llc|ltd|corp|corporation|gmbh|s\.?a\.?|plc|co|company)\b/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// Token-set Jaccard similarity over normalized names. Sufficient for
// the alias graph; the runner pairs it with pg_trgm scoring at the DB
// boundary for production-quality matching.
export function jaccard(a: string, b: string): number {
  const ta = new Set(normalizeName(a).split(' ').filter(Boolean));
  const tb = new Set(normalizeName(b).split(' ').filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Canonical bucket map: a resolver maintains one per tenant. Used by
// the in-memory MockResolver for tests; production keeps state in
// intel_entities and intel_signal_entities.
export interface EntityBucket {
  readonly entityId: string;
  readonly entityType: EntityType;
  readonly canonicalName: string;
  readonly aliases: readonly string[];
  readonly externalIds: Readonly<Record<string, string>>;
}

import {
  CONTRACT_NAME,
  CONTRACT_VERSION,
  err,
  ok,
} from '@sovereign/intel-knowledge-contract';
import type {
  AccessVerdict,
  AuditEntry,
  Classification,
  DecisionEnvelope,
  DocumentCapability,
  DocumentEnvelope,
  DocumentFilter,
  DocumentKind,
  DocumentRef,
  DoctrineCapability,
  DoctrineExcerpt,
  EntityGraphCapability,
  EventEnvelope,
  Excerpt,
  GovernanceCapability,
  GroundedAnswer,
  InstitutionalEntity,
  KnowledgeProvider,
  MemoryCapability,
  OutcomeEnvelope,
  Page,
  PageRequest,
  Precedent,
  PrincipalContext,
  Provenance,
  ProviderHealth,
  ReferenceCapability,
  Relationship,
  Result,
  SearchResult,
  SimilarityScope,
} from '@sovereign/intel-knowledge-contract';
import { MemoryKnowledgeStore } from './store/memory-store.js';
import type { KnowledgeStore } from './store/store.js';
import { chunkDocument } from './chunking.js';
import { makeDoc, score, tokenize } from './lexical.js';
import { contentHash, deterministicId, newId } from './ids.js';
import { decideAccess, isValidPrincipal } from './access.js';
import { IMPLEMENTATION_NAME, IMPLEMENTATION_VERSION, REFERENCE_DISCLAIMER } from './version.js';

export interface ReferenceProviderOptions {
  readonly store?: KnowledgeStore;
}

export interface IngestInput {
  readonly title: string;
  readonly kind: DocumentKind;
  readonly body: string;
  readonly classification?: Classification;
  readonly jurisdiction?: string;
  readonly validFrom?: string;
  readonly validUntil?: string;
  readonly mimeType?: string;
}

export class ReferenceKnowledgeProvider implements KnowledgeProvider {
  readonly meta = {
    contract: CONTRACT_NAME,
    version: CONTRACT_VERSION,
    implementation: IMPLEMENTATION_NAME,
    implementationVersion: IMPLEMENTATION_VERSION,
  } as const;

  private readonly store: KnowledgeStore;

  constructor(options: ReferenceProviderOptions = {}) {
    this.store = options.store ?? new MemoryKnowledgeStore();
  }

  get disclaimer(): string { return REFERENCE_DISCLAIMER; }

  async health(): Promise<ProviderHealth> {
    return {
      status: 'ok',
      checkedAt: new Date().toISOString(),
      details: { implementation: this.meta.implementation, disclaimer: REFERENCE_DISCLAIMER },
    };
  }

  // ── Non-contract ingestion convenience ──────────────────────────────
  // Tests and admin tools call this to seed documents. Production
  // Veritas OS exposes its own console upload surface.
  async ingest(principal: PrincipalContext, input: IngestInput): Promise<Result<DocumentRef>> {
    const guard = guardPrincipal(principal);
    if (guard) return guard;

    const body = input.body;
    if (!body || typeof body !== 'string') {
      return err('invalid_argument', 'ingest input must include a non-empty body');
    }

    const documentId = deterministicId(`${principal.tenantId}:${input.title}`);
    const versionId = contentHash(body).slice(0, 16);
    const provenance: Provenance = {
      recordedAt: new Date().toISOString(),
      recordedBy: principal.principalId,
      source: this.meta.implementation,
      contentHash: contentHash(body),
    };

    const envelope: DocumentEnvelope = {
      documentId,
      versionId,
      kind: input.kind,
      title: input.title,
      classification: input.classification ?? 'internal',
      ...(input.jurisdiction !== undefined ? { jurisdiction: input.jurisdiction } : {}),
      validFrom: input.validFrom ?? new Date().toISOString(),
      ...(input.validUntil !== undefined ? { validUntil: input.validUntil } : {}),
      provenance,
      body,
      mimeType: input.mimeType ?? 'text/plain',
    };

    const ref = await this.store.putDocument(principal.tenantId, envelope);
    const chunks = chunkDocument(body);
    await this.store.putChunks(principal.tenantId, documentId, versionId, chunks);
    return ok(ref);
  }

  // ── Six capability groups ───────────────────────────────────────────

  readonly documents: DocumentCapability = {
    retrieve: async (principal, documentId, versionId) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const env = await this.store.getDocument(principal.tenantId, documentId, versionId);
      if (!env) return err('not_found', `document ${documentId} not found`);
      const decision = decideAccess(principal, env.classification, env.jurisdiction);
      await this.audit(principal, `documents.retrieve:${documentId}`, decision.verdict);
      if (decision.verdict === 'deny') {
        return err('access_denied', decision.reason);
      }
      if (decision.verdict === 'redact') {
        return ok({
          ...env,
          body: '[redacted]',
          redactions: [{ anchor: 'doc', reason: 'insufficient_clearance', auditPointer: decision.auditPointer }],
        });
      }
      return ok(env);
    },

    list: async (principal, filter, page) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const all = await this.store.listDocuments(principal.tenantId, undefined);
      const filtered = applyFilter(all.items, filter, principal);
      return ok(paginateRefs(filtered, page));
    },

    resolveExcerpt: async (principal, documentId, anchor) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const env = await this.store.getDocument(principal.tenantId, documentId);
      if (!env) return err('not_found', `document ${documentId} not found`);
      const chunk = await this.store.getChunk(principal.tenantId, documentId, anchor);
      if (!chunk) return err('not_found', `anchor ${anchor} not found in document ${documentId}`);
      const decision = decideAccess(principal, env.classification, env.jurisdiction);
      await this.audit(principal, `documents.resolveExcerpt:${documentId}`, decision.verdict);
      if (decision.verdict === 'deny') return err('access_denied', decision.reason);
      const excerpt: Excerpt = {
        documentId,
        versionId: env.versionId,
        anchor,
        text: decision.verdict === 'redact' ? '[redacted]' : chunk.text,
        classification: env.classification,
        redacted: decision.verdict === 'redact',
      };
      return ok(excerpt);
    },
  };

  readonly reference: ReferenceCapability = {
    search: async (principal, query, scope, page) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      if (!query || query.trim().length === 0) {
        return err('invalid_argument', 'query must be non-empty');
      }
      const results = await this.lexicalSearch(principal, query, scope);
      return ok(paginateResults(results, page));
    },

    similarTo: async (principal, target, scope, page) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      let seedText = '';
      if (target.kind === 'document') {
        const env = await this.store.getDocument(principal.tenantId, target.documentId);
        if (!env) return err('not_found', `document ${target.documentId} not found`);
        seedText = `${env.title}\n\n${env.body.slice(0, 2000)}`;
      } else {
        const ent = await this.store.getEntity(principal.tenantId, target.entityId);
        if (!ent) return err('not_found', `entity ${target.entityId} not found`);
        seedText = `${ent.canonicalName} ${ent.aliases.join(' ')}`;
      }
      const results = (await this.lexicalSearch(principal, seedText, scope))
        .filter((r) => !(target.kind === 'document' && r.ref.documentId === target.documentId));
      return ok(paginateResults(results, page));
    },

    groundedAnswer: async (principal, question, scope) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const top = (await this.lexicalSearch(principal, question, scope)).slice(0, 5);
      if (top.length === 0) {
        const empty: GroundedAnswer = {
          answer: 'No matching institutional knowledge found.',
          citations: [],
          confidence: 0,
          degraded: true,
        };
        return ok(empty);
      }
      const stitched = top
        .map((r, i) => `[${i + 1}] ${r.excerpt.text}`)
        .join('\n\n');
      const answer: GroundedAnswer = {
        answer: stitched,
        citations: top.map((r) => ({
          documentId: r.ref.documentId,
          versionId: r.ref.versionId,
          anchor: r.excerpt.anchor,
          title: r.ref.title,
          ...(r.ref.jurisdiction !== undefined ? { jurisdiction: r.ref.jurisdiction } : {}),
        })),
        confidence: Math.min(1, top[0]?.relevance ?? 0),
        degraded: true,
      };
      return ok(answer);
    },
  };

  readonly doctrine: DoctrineCapability = {
    doctrineFor: async (principal, topic, jurisdiction) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const rows = await this.store.listDoctrineForTopic(principal.tenantId, topic, jurisdiction);
      const result: DoctrineExcerpt[] = [];
      for (const r of rows) {
        const citations = await Promise.all(r.citations.map(async (c) => {
          const env = await this.store.getDocument(principal.tenantId, c.documentId, c.versionId);
          return {
            documentId: c.documentId,
            versionId: c.versionId,
            title: env?.title ?? '[unknown]',
            ...(env?.jurisdiction !== undefined ? { jurisdiction: env.jurisdiction } : {}),
          };
        }));
        result.push({
          topic: r.topic,
          position: r.position,
          ...(r.jurisdiction !== undefined ? { jurisdiction: r.jurisdiction } : {}),
          citations,
          issuedAt: r.issuedAt,
          ...(r.supersededAt !== undefined ? { supersededAt: r.supersededAt } : {}),
        });
      }
      return ok(result);
    },

    precedentFor: async (principal, subject) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      // Reference implementation: surface the most-relevant historical
      // events captured through the memory write side as precedents.
      const seed = subject.kind === 'entity' ? subject.entityId : subject.descriptor;
      const allChunks = await this.store.listChunks(principal.tenantId);
      const corpus = allChunks.map((c) => makeDoc(`${c.documentId}::${c.anchor}`, c.text));
      const scored = score(seed, corpus).slice(0, 5);
      const precedents: Precedent[] = [];
      for (const s of scored) {
        const [documentId, anchor] = s.id.split('::');
        if (!documentId || !anchor) continue;
        const env = await this.store.getDocument(principal.tenantId, documentId);
        const chunk = await this.store.getChunk(principal.tenantId, documentId, anchor);
        if (!env || !chunk) continue;
        precedents.push({
          precedentId: deterministicId(`prec:${documentId}:${anchor}`),
          summary: chunk.text.slice(0, 240),
          occurredAt: env.validFrom,
          citations: [{
            documentId,
            versionId: env.versionId,
            anchor,
            title: env.title,
            ...(env.jurisdiction !== undefined ? { jurisdiction: env.jurisdiction } : {}),
          }],
        });
      }
      return ok(precedents);
    },
  };

  readonly graph: EntityGraphCapability = {
    resolve: async (principal, identifier) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const ent = identifier.kind === 'name'
        ? await this.store.findEntityByName(principal.tenantId, identifier.value)
        : await this.store.findEntityByExternal(principal.tenantId, identifier.system, identifier.value);
      return ok(ent);
    },

    neighbours: async (principal, entityId, edgeTypes) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const ns = await this.store.neighbours(principal.tenantId, entityId, edgeTypes);
      return ok(ns);
    },

    relationship: async (principal, a, b) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const rs = await this.store.relationships(principal.tenantId, a, b);
      return ok(rs);
    },
  };

  readonly memory: MemoryCapability = {
    recordEvent: async (principal, envelope) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const r = await this.store.appendEvent(principal.tenantId, principal.principalId, envelope);
      return ok(r);
    },
    recordDecision: async (principal, envelope) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const r = await this.store.appendDecision(principal.tenantId, principal.principalId, envelope);
      return ok(r);
    },
    recordOutcome: async (principal, envelope) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const r = await this.store.appendOutcome(principal.tenantId, principal.principalId, envelope);
      return ok(r);
    },
  };

  readonly governance: GovernanceCapability = {
    classify: async (principal, documentId) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const env = await this.store.getDocument(principal.tenantId, documentId);
      if (!env) return err('not_found', `document ${documentId} not found`);
      return ok(env.classification);
    },

    accessFor: async (principal, documentId) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const env = await this.store.getDocument(principal.tenantId, documentId);
      if (!env) return err('not_found', `document ${documentId} not found`);
      const d = decideAccess(principal, env.classification, env.jurisdiction);
      const verdict: AccessVerdict =
        d.verdict === 'permit'
          ? { verdict: 'permit' }
          : d.verdict === 'redact'
            ? { verdict: 'redact', auditPointer: d.auditPointer }
            : { verdict: 'deny', reason: d.reason };
      return ok(verdict);
    },

    auditTrail: async (principal, documentId, page) => {
      const guard = guardPrincipal(principal);
      if (guard) return guard;
      const list = await this.store.listAudit(principal.tenantId, documentId, page);
      return ok(list);
    },
  };

  // ── Internals ───────────────────────────────────────────────────────

  private async audit(principal: PrincipalContext, action: string, result: 'permit' | 'redact' | 'deny'): Promise<void> {
    const entry: AuditEntry = {
      entryId: newId(),
      at: new Date().toISOString(),
      principal: principal.principalId,
      action,
      result,
      ...(principal.correlationId !== undefined ? { correlationId: principal.correlationId } : {}),
    };
    await this.store.appendAudit(principal.tenantId, entry);
  }

  private async lexicalSearch(
    principal: PrincipalContext,
    query: string,
    scope: SimilarityScope,
  ): Promise<readonly SearchResult[]> {
    const chunks = await this.store.listChunks(principal.tenantId);
    const exclude = new Set(scope.excludeDocumentIds ?? []);
    const candidates = chunks.filter((c) => !exclude.has(c.documentId));

    const allRefs = await this.store.listDocuments(principal.tenantId, undefined);
    const refMap = new Map<string, DocumentRef>();
    for (const r of allRefs.items) refMap.set(r.documentId, r);

    const filtered = candidates.filter((c) => {
      const ref = refMap.get(c.documentId);
      if (!ref) return false;
      if (scope.kinds && !scope.kinds.includes(ref.kind)) return false;
      if (scope.jurisdictions && (!ref.jurisdiction || !scope.jurisdictions.includes(ref.jurisdiction))) return false;
      return true;
    });

    const corpus = filtered.map((c) => makeDoc(`${c.documentId}::${c.anchor}`, c.text));
    const scored = score(query, corpus);
    if (scored.length === 0) return [];

    const maxScore = scored[0]?.score ?? 1;
    const results: SearchResult[] = [];
    for (const s of scored) {
      const [documentId, anchor] = s.id.split('::');
      if (!documentId || !anchor) continue;
      const ref = refMap.get(documentId);
      if (!ref) continue;
      const chunk = filtered.find((c) => c.documentId === documentId && c.anchor === anchor);
      if (!chunk) continue;
      const decision = decideAccess(principal, ref.classification, ref.jurisdiction);
      if (decision.verdict === 'deny') continue;
      const excerpt: Excerpt = {
        documentId,
        versionId: ref.versionId,
        anchor,
        text: decision.verdict === 'redact' ? '[redacted]' : chunk.text,
        classification: ref.classification,
        redacted: decision.verdict === 'redact',
      };
      results.push({ ref, relevance: s.score / maxScore, excerpt });
    }
    return results;
  }
}

function guardPrincipal(principal: PrincipalContext): { readonly ok: false; readonly error: import('@sovereign/intel-knowledge-contract').KnowledgeError } | null {
  if (!isValidPrincipal(principal)) {
    return err('invalid_argument', 'PrincipalContext is required and must include tenantId, principalId, roles') as { readonly ok: false; readonly error: import('@sovereign/intel-knowledge-contract').KnowledgeError };
  }
  return null;
}

function applyFilter(refs: readonly DocumentRef[], filter: DocumentFilter, principal: PrincipalContext): readonly DocumentRef[] {
  return refs.filter((r) => {
    if (filter.kinds && !filter.kinds.includes(r.kind)) return false;
    if (filter.jurisdictions && (!r.jurisdiction || !filter.jurisdictions.includes(r.jurisdiction))) return false;
    if (filter.validAt) {
      const at = filter.validAt;
      if (r.validFrom > at) return false;
      if (r.validUntil && r.validUntil < at) return false;
    }
    if (filter.modifiedSince) {
      if (r.provenance.recordedAt < filter.modifiedSince) return false;
    }
    const d = decideAccess(principal, r.classification, r.jurisdiction);
    if (d.verdict === 'deny') return false;
    return true;
  });
}

function paginateRefs(items: readonly DocumentRef[], page: PageRequest | undefined): Page<DocumentRef> {
  const limit = Math.max(1, Math.min(page?.limit ?? 50, 200));
  const start = page?.cursor ? Number.parseInt(page.cursor, 10) : 0;
  const slice = items.slice(start, start + limit);
  const next = start + slice.length;
  return next < items.length
    ? { items: slice, nextCursor: String(next), total: items.length }
    : { items: slice, total: items.length };
}

function paginateResults(items: readonly SearchResult[], page: PageRequest | undefined): Page<SearchResult> {
  const limit = Math.max(1, Math.min(page?.limit ?? 20, 100));
  const start = page?.cursor ? Number.parseInt(page.cursor, 10) : 0;
  const slice = items.slice(start, start + limit);
  const next = start + slice.length;
  return next < items.length
    ? { items: slice, nextCursor: String(next), total: items.length }
    : { items: slice, total: items.length };
}

// Re-exports used by typings consumers.
export type { Relationship, InstitutionalEntity, EventEnvelope, DecisionEnvelope, OutcomeEnvelope };

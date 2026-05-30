import type { PrincipalContext } from './principal.js';
import type { Result } from './result.js';
import type { ContractMeta } from './version.js';
import type {
  AccessVerdict,
  AuditEntry,
  Citation,
  Classification,
  DecisionEnvelope,
  DocumentEnvelope,
  DocumentFilter,
  DocumentRef,
  DoctrineExcerpt,
  EventEnvelope,
  Excerpt,
  GroundedAnswer,
  InstitutionalEntity,
  OutcomeEnvelope,
  Page,
  PageRequest,
  Precedent,
  ProviderHealth,
  Relationship,
  SearchResult,
  SimilarityScope,
} from './types.js';

// Knowledge Provider Contract v0.1
//
// Six capability groups. Every method is async and returns Result<T>.
// Implementations may throw only for programmer errors (null arguments,
// schema violations); contract failures resolve as { ok: false, error }.
//
// The provider is the authority on principal access. Callers pass a
// PrincipalContext on every call that touches sensitive data and trust
// the verdict. Excerpts may arrive marked `redacted` rather than
// withheld entirely.

export interface KnowledgeProvider {
  readonly meta: ContractMeta;
  health(): Promise<ProviderHealth>;

  documents: DocumentCapability;
  reference: ReferenceCapability;
  doctrine: DoctrineCapability;
  graph: EntityGraphCapability;
  memory: MemoryCapability;
  governance: GovernanceCapability;
}

// 1 · Document Retrieval

export interface DocumentCapability {
  retrieve(
    principal: PrincipalContext,
    documentId: string,
    versionId?: string,
  ): Promise<Result<DocumentEnvelope>>;

  list(
    principal: PrincipalContext,
    filter: DocumentFilter,
    page?: PageRequest,
  ): Promise<Result<Page<DocumentRef>>>;

  resolveExcerpt(
    principal: PrincipalContext,
    documentId: string,
    anchor: string,
  ): Promise<Result<Excerpt>>;
}

// 2 · Semantic Reference

export interface ReferenceCapability {
  search(
    principal: PrincipalContext,
    query: string,
    scope: SimilarityScope,
    page?: PageRequest,
  ): Promise<Result<Page<SearchResult>>>;

  similarTo(
    principal: PrincipalContext,
    target: { kind: 'document'; documentId: string } | { kind: 'entity'; entityId: string },
    scope: SimilarityScope,
    page?: PageRequest,
  ): Promise<Result<Page<SearchResult>>>;

  groundedAnswer(
    principal: PrincipalContext,
    question: string,
    scope: SimilarityScope,
  ): Promise<Result<GroundedAnswer>>;
}

// 3 · Doctrine Surface

export interface DoctrineCapability {
  doctrineFor(
    principal: PrincipalContext,
    topic: string,
    jurisdiction?: string,
  ): Promise<Result<readonly DoctrineExcerpt[]>>;

  precedentFor(
    principal: PrincipalContext,
    subject: { kind: 'entity'; entityId: string } | { kind: 'event'; descriptor: string },
  ): Promise<Result<readonly Precedent[]>>;
}

// 4 · Institutional Entity Graph

export interface EntityGraphCapability {
  resolve(
    principal: PrincipalContext,
    identifier: { kind: 'name'; value: string } | { kind: 'external_id'; system: string; value: string },
  ): Promise<Result<InstitutionalEntity | null>>;

  neighbours(
    principal: PrincipalContext,
    entityId: string,
    edgeTypes?: readonly string[],
  ): Promise<Result<readonly InstitutionalEntity[]>>;

  relationship(
    principal: PrincipalContext,
    aEntityId: string,
    bEntityId: string,
  ): Promise<Result<readonly Relationship[]>>;
}

// 5 · Memory Capture (write side)

export interface MemoryCapability {
  recordEvent(
    principal: PrincipalContext,
    envelope: EventEnvelope,
  ): Promise<Result<{ readonly eventId: string }>>;

  recordDecision(
    principal: PrincipalContext,
    envelope: DecisionEnvelope,
  ): Promise<Result<{ readonly decisionId: string }>>;

  recordOutcome(
    principal: PrincipalContext,
    envelope: OutcomeEnvelope,
  ): Promise<Result<{ readonly outcomeId: string }>>;
}

// 6 · Governance

export interface GovernanceCapability {
  classify(
    principal: PrincipalContext,
    documentId: string,
  ): Promise<Result<Classification>>;

  accessFor(
    principal: PrincipalContext,
    documentId: string,
  ): Promise<Result<AccessVerdict>>;

  auditTrail(
    principal: PrincipalContext,
    documentId: string,
    page?: PageRequest,
  ): Promise<Result<Page<AuditEntry>>>;
}

// Read-only "no provider" guard. EAI uses this when no Veritas OS (or
// reference provider) is configured — every method returns no_provider,
// allowing the call site to degrade explicitly. Citation type is
// re-exported for downstream convenience.

export type { Citation };

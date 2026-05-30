// Core data types exchanged across the Knowledge Provider contract.
// Every reference type carries provenance sufficient for downstream
// audit; redaction is represented explicitly rather than by absence.

export type Classification = 'public' | 'internal' | 'restricted' | 'confidential' | 'secret';

export type DocumentKind =
  | 'policy'
  | 'procedure'
  | 'contract'
  | 'board_minute'
  | 'strategy_paper'
  | 'dispatch'
  | 'report'
  | 'briefing'
  | 'memo'
  | 'precedent'
  | 'doctrine'
  | 'other';

export interface Provenance {
  readonly recordedAt: string;
  readonly recordedBy: string;
  readonly source: string;
  readonly contentHash: string;
  readonly signature?: string;
}

export interface DocumentRef {
  readonly documentId: string;
  readonly versionId: string;
  readonly kind: DocumentKind;
  readonly title: string;
  readonly classification: Classification;
  readonly jurisdiction?: string;
  readonly validFrom: string;
  readonly validUntil?: string;
  readonly provenance: Provenance;
}

export interface DocumentEnvelope extends DocumentRef {
  readonly body: string;
  readonly mimeType: string;
  readonly attachments?: readonly AttachmentRef[];
  readonly redactions?: readonly RedactionMarker[];
}

export interface AttachmentRef {
  readonly attachmentId: string;
  readonly title: string;
  readonly mimeType: string;
  readonly byteLength: number;
}

export interface RedactionMarker {
  readonly anchor: string;
  readonly reason: string;
  readonly auditPointer: string;
}

export interface Excerpt {
  readonly documentId: string;
  readonly versionId: string;
  readonly anchor: string;
  readonly text: string;
  readonly classification: Classification;
  readonly redacted: boolean;
}

export interface Citation {
  readonly documentId: string;
  readonly versionId: string;
  readonly anchor?: string;
  readonly title: string;
  readonly jurisdiction?: string;
}

export interface DocumentFilter {
  readonly kinds?: readonly DocumentKind[];
  readonly jurisdictions?: readonly string[];
  readonly minClassification?: Classification;
  readonly validAt?: string;
  readonly modifiedSince?: string;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string;
  readonly total?: number;
}

export interface PageRequest {
  readonly limit?: number;
  readonly cursor?: string;
}

// Semantic reference shapes

export interface SearchResult {
  readonly ref: DocumentRef;
  readonly relevance: number;
  readonly excerpt: Excerpt;
}

export interface SimilarityScope {
  readonly kinds?: readonly DocumentKind[];
  readonly jurisdictions?: readonly string[];
  readonly excludeDocumentIds?: readonly string[];
}

export interface GroundedAnswer {
  readonly answer: string;
  readonly citations: readonly Citation[];
  readonly confidence: number;
  readonly degraded: boolean;
}

// Doctrine surface

export interface DoctrineExcerpt {
  readonly topic: string;
  readonly position: string;
  readonly citations: readonly Citation[];
  readonly jurisdiction?: string;
  readonly issuedAt: string;
  readonly supersededAt?: string;
}

export interface Precedent {
  readonly precedentId: string;
  readonly summary: string;
  readonly occurredAt: string;
  readonly outcome?: string;
  readonly citations: readonly Citation[];
}

// Institutional entity graph

export type InstitutionalEntityType =
  | 'person'
  | 'unit'
  | 'programme'
  | 'contract'
  | 'product'
  | 'committee'
  | 'role';

export interface InstitutionalEntity {
  readonly entityId: string;
  readonly entityType: InstitutionalEntityType;
  readonly canonicalName: string;
  readonly aliases: readonly string[];
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly externalIds?: Readonly<Record<string, string>>;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
}

export interface Relationship {
  readonly relationshipId: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly type: string;
  readonly strength: number;
  readonly firstObservedAt: string;
  readonly lastObservedAt: string;
  readonly citations: readonly Citation[];
}

// Memory capture (write side)

export interface EventEnvelope {
  readonly eventType: string;
  readonly occurredAt: string;
  readonly subjectEntityIds: readonly string[];
  readonly summary: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly originService: string;
  readonly correlationId?: string;
}

export interface DecisionEnvelope {
  readonly decidedAt: string;
  readonly decidedBy: string;
  readonly subjectEntityIds: readonly string[];
  readonly question: string;
  readonly optionsConsidered: readonly string[];
  readonly chosenOption: string;
  readonly rationale: string;
  readonly citations: readonly Citation[];
}

export interface OutcomeEnvelope {
  readonly decisionId: string;
  readonly observedAt: string;
  readonly summary: string;
  readonly metrics?: Readonly<Record<string, number | string>>;
  readonly lessons?: readonly string[];
}

// Governance

export type AccessVerdict =
  | { readonly verdict: 'permit' }
  | { readonly verdict: 'redact'; readonly auditPointer: string }
  | { readonly verdict: 'deny'; readonly reason: string };

export interface AuditEntry {
  readonly entryId: string;
  readonly at: string;
  readonly principal: string;
  readonly action: string;
  readonly result: 'permit' | 'redact' | 'deny';
  readonly correlationId?: string;
}

// Health & metadata

export interface ProviderHealth {
  readonly status: 'ok' | 'degraded' | 'down';
  readonly checkedAt: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

import type {
  AuditEntry,
  DecisionEnvelope,
  DocumentEnvelope,
  DocumentRef,
  EventEnvelope,
  InstitutionalEntity,
  OutcomeEnvelope,
  Page,
  PageRequest,
  Relationship,
} from '@sovereign/intel-knowledge-contract';

// Storage interface for the reference provider. The in-memory store is
// the default; a Postgres-backed implementation would satisfy the same
// shape. All operations are tenant-scoped.

export interface KnowledgeStore {
  // Documents
  putDocument(tenantId: string, doc: DocumentEnvelope): Promise<DocumentRef>;
  getDocument(tenantId: string, documentId: string, versionId?: string): Promise<DocumentEnvelope | null>;
  listDocuments(tenantId: string, page: PageRequest | undefined): Promise<Page<DocumentRef>>;

  // Chunks (anchors)
  putChunks(tenantId: string, documentId: string, versionId: string, chunks: ReadonlyArray<{ anchor: string; text: string }>): Promise<void>;
  getChunk(tenantId: string, documentId: string, anchor: string): Promise<{ text: string } | null>;
  listChunks(tenantId: string): Promise<ReadonlyArray<{ documentId: string; versionId: string; anchor: string; text: string }>>;

  // Doctrine
  putDoctrine(tenantId: string, topic: string, doctrine: { position: string; jurisdiction?: string; issuedAt: string; citations: ReadonlyArray<{ documentId: string; versionId: string }> }): Promise<void>;
  listDoctrineForTopic(tenantId: string, topic: string, jurisdiction?: string): Promise<ReadonlyArray<{ topic: string; position: string; jurisdiction?: string; issuedAt: string; supersededAt?: string; citations: ReadonlyArray<{ documentId: string; versionId: string }> }>>;

  // Entities
  putEntity(tenantId: string, entity: InstitutionalEntity): Promise<void>;
  getEntity(tenantId: string, entityId: string): Promise<InstitutionalEntity | null>;
  findEntityByName(tenantId: string, name: string): Promise<InstitutionalEntity | null>;
  findEntityByExternal(tenantId: string, system: string, value: string): Promise<InstitutionalEntity | null>;
  neighbours(tenantId: string, entityId: string, edgeTypes?: readonly string[]): Promise<readonly InstitutionalEntity[]>;
  putRelationship(tenantId: string, rel: Relationship): Promise<void>;
  relationships(tenantId: string, a: string, b: string): Promise<readonly Relationship[]>;

  // Memory write-side
  appendEvent(tenantId: string, principalId: string, envelope: EventEnvelope): Promise<{ eventId: string }>;
  appendDecision(tenantId: string, principalId: string, envelope: DecisionEnvelope): Promise<{ decisionId: string }>;
  appendOutcome(tenantId: string, principalId: string, envelope: OutcomeEnvelope): Promise<{ outcomeId: string }>;

  // Audit
  appendAudit(tenantId: string, entry: AuditEntry): Promise<void>;
  listAudit(tenantId: string, documentId: string, page: PageRequest | undefined): Promise<Page<AuditEntry>>;
}

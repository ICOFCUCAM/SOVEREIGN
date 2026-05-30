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
import type { KnowledgeStore } from './store.js';
import { newId } from '../ids.js';

interface DoctrineRow {
  topic: string;
  position: string;
  jurisdiction?: string;
  issuedAt: string;
  supersededAt?: string;
  citations: ReadonlyArray<{ documentId: string; versionId: string }>;
}

interface Bucket {
  documents: Map<string, Map<string, DocumentEnvelope>>;
  documentOrder: string[];
  latestVersion: Map<string, string>;
  chunks: Map<string, { documentId: string; versionId: string; text: string }>;
  doctrine: DoctrineRow[];
  entities: Map<string, InstitutionalEntity>;
  entityByName: Map<string, string>;
  entityByExternal: Map<string, string>;
  relationships: Relationship[];
  events: Array<{ id: string; principalId: string; envelope: EventEnvelope }>;
  decisions: Array<{ id: string; principalId: string; envelope: DecisionEnvelope }>;
  outcomes: Array<{ id: string; principalId: string; envelope: OutcomeEnvelope }>;
  audit: Map<string, AuditEntry[]>;
}

function emptyBucket(): Bucket {
  return {
    documents: new Map(),
    documentOrder: [],
    latestVersion: new Map(),
    chunks: new Map(),
    doctrine: [],
    entities: new Map(),
    entityByName: new Map(),
    entityByExternal: new Map(),
    relationships: [],
    events: [],
    decisions: [],
    outcomes: [],
    audit: new Map(),
  };
}

function chunkKey(documentId: string, anchor: string): string {
  return `${documentId}::${anchor}`;
}

function externalKey(system: string, value: string): string {
  return `${system}::${value}`;
}

function refOf(doc: DocumentEnvelope): DocumentRef {
  return {
    documentId: doc.documentId,
    versionId: doc.versionId,
    kind: doc.kind,
    title: doc.title,
    classification: doc.classification,
    ...(doc.jurisdiction !== undefined ? { jurisdiction: doc.jurisdiction } : {}),
    validFrom: doc.validFrom,
    ...(doc.validUntil !== undefined ? { validUntil: doc.validUntil } : {}),
    provenance: doc.provenance,
  };
}

function paginate<T>(items: readonly T[], page: PageRequest | undefined): Page<T> {
  const limit = Math.max(1, Math.min(page?.limit ?? 50, 200));
  const start = page?.cursor ? Number.parseInt(page.cursor, 10) : 0;
  const slice = items.slice(start, start + limit);
  const next = start + slice.length;
  return next < items.length
    ? { items: slice, nextCursor: String(next), total: items.length }
    : { items: slice, total: items.length };
}

export class MemoryKnowledgeStore implements KnowledgeStore {
  private readonly buckets = new Map<string, Bucket>();

  private bucket(tenantId: string): Bucket {
    let b = this.buckets.get(tenantId);
    if (!b) { b = emptyBucket(); this.buckets.set(tenantId, b); }
    return b;
  }

  async putDocument(tenantId: string, doc: DocumentEnvelope): Promise<DocumentRef> {
    const b = this.bucket(tenantId);
    let versions = b.documents.get(doc.documentId);
    if (!versions) {
      versions = new Map();
      b.documents.set(doc.documentId, versions);
      b.documentOrder.push(doc.documentId);
    }
    versions.set(doc.versionId, doc);
    b.latestVersion.set(doc.documentId, doc.versionId);
    return refOf(doc);
  }

  async getDocument(tenantId: string, documentId: string, versionId?: string): Promise<DocumentEnvelope | null> {
    const versions = this.bucket(tenantId).documents.get(documentId);
    if (!versions) return null;
    const v = versionId ?? this.bucket(tenantId).latestVersion.get(documentId);
    return v ? versions.get(v) ?? null : null;
  }

  async listDocuments(tenantId: string, page: PageRequest | undefined): Promise<Page<DocumentRef>> {
    const b = this.bucket(tenantId);
    const refs: DocumentRef[] = [];
    for (const id of b.documentOrder) {
      const v = b.latestVersion.get(id);
      const env = v ? b.documents.get(id)?.get(v) : undefined;
      if (env) refs.push(refOf(env));
    }
    return paginate(refs, page);
  }

  async putChunks(tenantId: string, documentId: string, versionId: string, chunks: ReadonlyArray<{ anchor: string; text: string }>): Promise<void> {
    const b = this.bucket(tenantId);
    for (const c of chunks) {
      b.chunks.set(chunkKey(documentId, c.anchor), { documentId, versionId, text: c.text });
    }
  }

  async getChunk(tenantId: string, documentId: string, anchor: string): Promise<{ text: string } | null> {
    const c = this.bucket(tenantId).chunks.get(chunkKey(documentId, anchor));
    return c ? { text: c.text } : null;
  }

  async listChunks(tenantId: string): Promise<ReadonlyArray<{ documentId: string; versionId: string; anchor: string; text: string }>> {
    const out: Array<{ documentId: string; versionId: string; anchor: string; text: string }> = [];
    for (const [key, c] of this.bucket(tenantId).chunks) {
      const anchor = key.split('::')[1] ?? '';
      out.push({ documentId: c.documentId, versionId: c.versionId, anchor, text: c.text });
    }
    return out;
  }

  async putDoctrine(tenantId: string, topic: string, doctrine: { position: string; jurisdiction?: string; issuedAt: string; citations: ReadonlyArray<{ documentId: string; versionId: string }> }): Promise<void> {
    const b = this.bucket(tenantId);
    // Auto-supersede previous doctrine for same topic+jurisdiction
    for (const row of b.doctrine) {
      if (row.topic === topic && row.jurisdiction === doctrine.jurisdiction && !row.supersededAt) {
        row.supersededAt = doctrine.issuedAt;
      }
    }
    b.doctrine.push({
      topic,
      position: doctrine.position,
      ...(doctrine.jurisdiction !== undefined ? { jurisdiction: doctrine.jurisdiction } : {}),
      issuedAt: doctrine.issuedAt,
      citations: doctrine.citations,
    });
  }

  async listDoctrineForTopic(tenantId: string, topic: string, jurisdiction?: string): Promise<ReadonlyArray<{ topic: string; position: string; jurisdiction?: string; issuedAt: string; supersededAt?: string; citations: ReadonlyArray<{ documentId: string; versionId: string }> }>> {
    const b = this.bucket(tenantId);
    return b.doctrine
      .filter((r) => r.topic === topic)
      .filter((r) => jurisdiction === undefined || r.jurisdiction === jurisdiction)
      .map((r) => ({ ...r }));
  }

  async putEntity(tenantId: string, entity: InstitutionalEntity): Promise<void> {
    const b = this.bucket(tenantId);
    b.entities.set(entity.entityId, entity);
    b.entityByName.set(entity.canonicalName.toLowerCase(), entity.entityId);
    for (const alias of entity.aliases) {
      b.entityByName.set(alias.toLowerCase(), entity.entityId);
    }
    if (entity.externalIds) {
      for (const [system, value] of Object.entries(entity.externalIds)) {
        b.entityByExternal.set(externalKey(system, value), entity.entityId);
      }
    }
  }

  async getEntity(tenantId: string, entityId: string): Promise<InstitutionalEntity | null> {
    return this.bucket(tenantId).entities.get(entityId) ?? null;
  }

  async findEntityByName(tenantId: string, name: string): Promise<InstitutionalEntity | null> {
    const id = this.bucket(tenantId).entityByName.get(name.toLowerCase());
    return id ? this.bucket(tenantId).entities.get(id) ?? null : null;
  }

  async findEntityByExternal(tenantId: string, system: string, value: string): Promise<InstitutionalEntity | null> {
    const id = this.bucket(tenantId).entityByExternal.get(externalKey(system, value));
    return id ? this.bucket(tenantId).entities.get(id) ?? null : null;
  }

  async neighbours(tenantId: string, entityId: string, edgeTypes?: readonly string[]): Promise<readonly InstitutionalEntity[]> {
    const b = this.bucket(tenantId);
    const ids = new Set<string>();
    for (const r of b.relationships) {
      if (edgeTypes && !edgeTypes.includes(r.type)) continue;
      if (r.sourceEntityId === entityId) ids.add(r.targetEntityId);
      else if (r.targetEntityId === entityId) ids.add(r.sourceEntityId);
    }
    const out: InstitutionalEntity[] = [];
    for (const id of ids) {
      const e = b.entities.get(id);
      if (e) out.push(e);
    }
    return out;
  }

  async putRelationship(tenantId: string, rel: Relationship): Promise<void> {
    this.bucket(tenantId).relationships.push(rel);
  }

  async relationships(tenantId: string, a: string, b: string): Promise<readonly Relationship[]> {
    return this.bucket(tenantId).relationships.filter((r) =>
      (r.sourceEntityId === a && r.targetEntityId === b) ||
      (r.sourceEntityId === b && r.targetEntityId === a),
    );
  }

  async appendEvent(tenantId: string, principalId: string, envelope: EventEnvelope): Promise<{ eventId: string }> {
    const eventId = newId();
    this.bucket(tenantId).events.push({ id: eventId, principalId, envelope });
    return { eventId };
  }

  async appendDecision(tenantId: string, principalId: string, envelope: DecisionEnvelope): Promise<{ decisionId: string }> {
    const decisionId = newId();
    this.bucket(tenantId).decisions.push({ id: decisionId, principalId, envelope });
    return { decisionId };
  }

  async appendOutcome(tenantId: string, principalId: string, envelope: OutcomeEnvelope): Promise<{ outcomeId: string }> {
    const outcomeId = newId();
    this.bucket(tenantId).outcomes.push({ id: outcomeId, principalId, envelope });
    return { outcomeId };
  }

  async appendAudit(tenantId: string, entry: AuditEntry): Promise<void> {
    const b = this.bucket(tenantId);
    const docId = entry.action.split(':').slice(-1)[0] ?? 'unknown';
    let arr = b.audit.get(docId);
    if (!arr) { arr = []; b.audit.set(docId, arr); }
    arr.push(entry);
  }

  async listAudit(tenantId: string, documentId: string, page: PageRequest | undefined): Promise<Page<AuditEntry>> {
    const arr = this.bucket(tenantId).audit.get(documentId) ?? [];
    return paginate(arr, page);
  }
}

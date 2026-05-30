// Canonical types for the Strategic Intelligence Substrate. Mirror the
// intel_* schema in supabase_migration_0024_intel_substrate.sql.

export type SourceFamily =
  | 'news'
  | 'social'
  | 'government'
  | 'regulatory'
  | 'financial'
  | 'stakeholder'
  | 'web'
  | 'wire'
  | 'telegram'
  | 'other';

export type SignalClass =
  | 'news_article'
  | 'press_release'
  | 'regulatory_filing'
  | 'gov_release'
  | 'political_statement'
  | 'social_post'
  | 'financial_disclosure'
  | 'corporate_announcement'
  | 'analyst_report'
  | 'litigation_filing'
  | 'patent_grant'
  | 'executive_appointment'
  | 'policy_document'
  | 'treaty'
  | 'protest_event'
  | 'incident_report';

export type EntityType =
  | 'person'
  | 'organization'
  | 'place'
  | 'product'
  | 'topic'
  | 'event'
  | 'asset'
  | 'document';

export type AlertSeverity = 'info' | 'warn' | 'critical';
export type AlertState = 'open' | 'acknowledged' | 'suppressed' | 'closed';

export const SOURCE_FAMILIES: readonly SourceFamily[] = [
  'news','social','government','regulatory','financial','stakeholder','web','wire','telegram','other',
];

export const SIGNAL_CLASSES: readonly SignalClass[] = [
  'news_article','press_release','regulatory_filing','gov_release',
  'political_statement','social_post','financial_disclosure',
  'corporate_announcement','analyst_report','litigation_filing',
  'patent_grant','executive_appointment','policy_document',
  'treaty','protest_event','incident_report',
];

export const ENTITY_TYPES: readonly EntityType[] = [
  'person','organization','place','product','topic','event','asset','document',
];

export interface SourceRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly family: SourceFamily;
  readonly connector: string;
  readonly displayName: string;
  readonly config: Readonly<Record<string, unknown>>;
  readonly authRef?: string;
  readonly enabled: boolean;
  readonly rateLimitPolicy: Readonly<Record<string, unknown>>;
  readonly freshnessSlaMinutes: number;
  readonly lastRunAt?: string;
  readonly lastStatus?: string;
}

export interface IngestRunRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly sourceId: string;
  readonly startedAt: string;
  readonly finishedAt?: string;
  readonly pulledCount: number;
  readonly insertedCount: number;
  readonly duplicateCount: number;
  readonly error?: string;
  readonly connectorVersion?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface RawDocument {
  readonly id: string;
  readonly tenantId: string;
  readonly sourceId: string;
  readonly ingestRunId?: string;
  readonly contentHash: string;
  readonly canonicalUrl?: string;
  readonly mime: string;
  readonly bytes: number;
  readonly storagePath?: string;
  readonly payloadExcerpt?: string;
  readonly provenance: Provenance;
  readonly ingestedAt: string;
}

export interface Provenance {
  readonly fetchedAt: string;
  readonly connectorVersion: string;
  readonly etag?: string;
  readonly lastModified?: string;
  readonly signature?: string;
  readonly additional?: Readonly<Record<string, unknown>>;
}

export interface Sentiment {
  readonly polarity: number;       // [-1, 1]
  readonly magnitude: number;      // [0, ∞)
  readonly confidence: number;     // [0, 1]
}

export interface GeoFocus {
  readonly countries?: readonly string[];
  readonly regions?: readonly string[];
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface Attestations {
  readonly syndicatedFrom?: readonly string[];
  readonly duplicateCount?: number;
  readonly primarySourceUrl?: string;
}

export interface SignalRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly sourceId: string;
  readonly rawDocumentId?: string;
  readonly contentHash: string;
  readonly canonicalUrl?: string;
  readonly signalClass: SignalClass;
  readonly publishedAt: string;
  readonly ingestedAt: string;
  readonly language?: string;
  readonly title?: string;
  readonly bodyExcerpt?: string;
  readonly summary?: string;
  readonly geoFocus?: GeoFocus;
  readonly sentiment?: Sentiment;
  readonly influenceScore?: number;
  readonly velocityAtIngest?: number;
  readonly narrativeClusterId?: string;
  readonly attestations: Attestations;
  readonly provenance: Provenance;
}

export interface EntityRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly entityType: EntityType;
  readonly canonicalName: string;
  readonly aliases: readonly string[];
  readonly externalIds: Readonly<Record<string, string>>;
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly confidence: number;
  readonly sourceDiversityScore: number;
  readonly mentionCount: number;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
  readonly mergedInto?: string;
}

export interface SignalEntity {
  readonly signalId: string;
  readonly entityId: string;
  readonly tenantId: string;
  readonly salience: number;
  readonly sentiment?: Sentiment;
  readonly role?: 'subject' | 'mentioned' | 'source' | 'target';
}

export interface RelationshipRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly relationshipType: string;
  readonly strength: number;
  readonly firstObservedAt: string;
  readonly lastObservedAt: string;
  readonly supersededAt?: string;
  readonly evidenceSignalIds: readonly string[];
  readonly attributes: Readonly<Record<string, unknown>>;
}

export interface TopicRecord {
  readonly id: string;
  readonly tenantId?: string;
  readonly label: string;
  readonly description?: string;
  readonly parentTopicId?: string;
  readonly signalCount: number;
  readonly velocity24h: number;
  readonly noveltyScore: number;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
}

// Watchlist definition DSL — mirrors §7 of the Phase 1 architecture.
export interface WatchDefinition {
  readonly match: WatchClause;
  readonly thresholds?: Readonly<Record<AlertSeverity, WatchThreshold>>;
  readonly delivery?: WatchDelivery;
  readonly quietHours?: WatchQuietHours;
}

export type WatchClause =
  | { readonly all: readonly WatchClause[] }
  | { readonly any: readonly WatchClause[] }
  | { readonly not: WatchClause }
  | { readonly entity: { readonly id: string; readonly role?: readonly SignalEntity['role'][] } }
  | { readonly signalClass: readonly SignalClass[] }
  | { readonly query: string }
  | { readonly sentiment: { readonly polarity?: NumberRange; readonly magnitude?: NumberRange } }
  | { readonly velocity: { readonly gt?: number; readonly windowMinutes: number } }
  | { readonly novelty: 'low' | 'medium' | 'high' };

export type NumberRange = { readonly lt?: number; readonly lte?: number; readonly gt?: number; readonly gte?: number };

export interface WatchThreshold {
  readonly minConfidence?: number;
  readonly minInfluence?: number;
  readonly novelty?: 'low' | 'medium' | 'high';
}

export interface WatchDelivery {
  readonly inApp?: boolean;
  readonly email?: readonly string[];
  readonly webhook?: string;
  readonly briefingFeed?: string;
}

export interface WatchQuietHours {
  readonly tz: string;
  readonly start: string;
  readonly end: string;
  readonly escalateCritical?: boolean;
}

export interface WatchlistRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly description?: string;
  readonly definition: WatchDefinition;
  readonly severityThresholds: Readonly<Record<AlertSeverity, WatchThreshold>>;
  readonly deliveryChannels: WatchDelivery;
  readonly quietHours?: WatchQuietHours;
  readonly enabled: boolean;
  readonly precisionBudgetPerDay: number;
}

export interface AlertRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly watchlistId: string;
  readonly signalId?: string;
  readonly severity: AlertSeverity;
  readonly state: AlertState;
  readonly matchedDefinition?: Readonly<Record<string, unknown>>;
  readonly deliveredTo: readonly string[];
  readonly acknowledgedBy?: string;
  readonly acknowledgedAt?: string;
  readonly createdAt: string;
}

export type IntelJobKind =
  | 'intel.ingest'
  | 'intel.normalize'
  | 'intel.extract'
  | 'intel.embed'
  | 'intel.cluster'
  | 'intel.evaluate';

export const INTEL_JOB_KINDS: readonly IntelJobKind[] = [
  'intel.ingest','intel.normalize','intel.extract','intel.embed','intel.cluster','intel.evaluate',
];

export function isSourceFamily(v: unknown): v is SourceFamily {
  return typeof v === 'string' && (SOURCE_FAMILIES as readonly string[]).includes(v);
}

export function isSignalClass(v: unknown): v is SignalClass {
  return typeof v === 'string' && (SIGNAL_CLASSES as readonly string[]).includes(v);
}

export function isEntityType(v: unknown): v is EntityType {
  return typeof v === 'string' && (ENTITY_TYPES as readonly string[]).includes(v);
}

export function isIntelJobKind(v: unknown): v is IntelJobKind {
  return typeof v === 'string' && (INTEL_JOB_KINDS as readonly string[]).includes(v);
}

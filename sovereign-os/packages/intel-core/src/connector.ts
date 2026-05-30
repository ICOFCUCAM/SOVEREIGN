import type { Provenance, RawDocument, SignalClass, SignalRecord, SourceFamily, Sentiment, GeoFocus } from './types.js';

// Connector contract. Sprint 1.2's news/social/gov connectors all
// implement this. Connectors are stateless modules — the
// connector-scheduler decides when to invoke them; the normalizer and
// downstream agents pick up from intel_raw_documents and intel_signals.

export interface ConnectorContext {
  readonly sourceId: string;
  readonly tenantId: string;
  readonly cursor?: string;          // last-seen marker, opaque to the scheduler
  readonly limit?: number;           // soft cap on items per pull
  readonly now: () => Date;          // injectable clock for determinism
  readonly fetch: typeof fetch;      // injectable for tests + rate-limit middleware
  readonly logger: ConnectorLogger;
}

export interface ConnectorLogger {
  debug(msg: string, data?: Record<string, unknown>): void;
  info (msg: string, data?: Record<string, unknown>): void;
  warn (msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
}

export interface ConnectorPullResult {
  readonly raws: readonly Pick<RawDocument, 'contentHash' | 'canonicalUrl' | 'mime' | 'bytes' | 'payloadExcerpt' | 'provenance'>[];
  readonly signals: readonly NormalizedSignal[];
  readonly nextCursor?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// A NormalizedSignal is what a connector hands to the normalizer. It
// omits server-assigned fields (id, tenantId, sourceId, rawDocumentId,
// ingestedAt) — those are populated downstream.
export interface NormalizedSignal {
  readonly contentHash: string;
  readonly canonicalUrl?: string;
  readonly signalClass: SignalClass;
  readonly publishedAt: string;
  readonly language?: string;
  readonly title?: string;
  readonly bodyExcerpt?: string;
  readonly summary?: string;
  readonly geoFocus?: GeoFocus;
  readonly sentiment?: Sentiment;
  readonly influenceScore?: number;
  readonly velocityAtIngest?: number;
  readonly attestations?: SignalRecord['attestations'];
  readonly provenance: Provenance;
}

export interface Connector {
  readonly name: string;             // stable id, e.g. 'gdelt-v2'
  readonly family: SourceFamily;
  readonly version: string;

  pull(ctx: ConnectorContext): Promise<ConnectorPullResult>;

  // Optional: connectors that expose a health probe (rate limit budget,
  // last successful pull, auth state). The scheduler surfaces results
  // to the Health Agent.
  health?(ctx: ConnectorContext): Promise<ConnectorHealth>;
}

export interface ConnectorHealth {
  readonly status: 'ok' | 'degraded' | 'down';
  readonly checkedAt: string;
  readonly rateBudgetRemaining?: number;
  readonly nextResetAt?: string;
  readonly notes?: string;
}

// Helper for connector authors: produce a Provenance envelope with
// connector identity preserved. Workers extend with signature/etag.
export function makeProvenance(
  connectorName: string,
  connectorVersion: string,
  options: Partial<Pick<Provenance, 'etag' | 'lastModified' | 'signature' | 'additional'>> = {},
): Provenance {
  return {
    fetchedAt: new Date().toISOString(),
    connectorVersion: `${connectorName}@${connectorVersion}`,
    ...(options.etag !== undefined ? { etag: options.etag } : {}),
    ...(options.lastModified !== undefined ? { lastModified: options.lastModified } : {}),
    ...(options.signature !== undefined ? { signature: options.signature } : {}),
    ...(options.additional !== undefined ? { additional: options.additional } : {}),
  };
}

// Console logger that satisfies ConnectorLogger. Workers may swap in
// structured loggers.
export const consoleLogger: ConnectorLogger = {
  debug: (m, d) => console.debug(`[intel] ${m}`, d ?? ''),
  info:  (m, d) => console.info (`[intel] ${m}`, d ?? ''),
  warn:  (m, d) => console.warn (`[intel] ${m}`, d ?? ''),
  error: (m, d) => console.error(`[intel] ${m}`, d ?? ''),
};

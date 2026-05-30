import type { Connector, ConnectorContext, ConnectorPullResult, NormalizedSignal, SignalClass } from '@sovereign/intel-core';
import { makeProvenance, signalContentHash, canonicalizeUrl, sha256Hex } from '@sovereign/intel-core';

const CONNECTOR = 'apify';
const VERSION = '0.1.0';
const RUN_SYNC = 'https://api.apify.com/v2/acts';

// Generic Apify actor runner. One connector wraps any actor (LinkedIn
// scraper, Companies House scraper, press wire scrapers, web monitors)
// via a simple field mapping. config.mapping selects which keys on
// each dataset item become title / body / url / publishedAt.

export interface ApifyConfig {
  readonly actorId: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly signalClass?: SignalClass;
  readonly costPerRunUsd?: number;
  readonly mapping?: {
    readonly url?: string;
    readonly title?: string;
    readonly bodyExcerpt?: string;
    readonly publishedAt?: string;
    readonly language?: string;
  };
}

export function isApifyConfig(v: unknown): v is ApifyConfig {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return typeof c.actorId === 'string' && !!c.input && typeof c.input === 'object';
}

function readApiKey(authRef: string | undefined): string {
  const envName = authRef && authRef.length > 0 ? authRef : 'APIFY_TOKEN';
  const key = process.env[envName];
  if (!key) throw new Error(`apify: env ${envName} not set`);
  return key;
}

function pickPath(item: Record<string, unknown>, path: string | undefined): string | undefined {
  if (!path) return undefined;
  const parts = path.split('.');
  let cur: unknown = item;
  for (const p of parts) {
    if (cur === undefined || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export const apifyConnector: Connector = {
  name: CONNECTOR,
  family: 'web',
  version: VERSION,

  async pull(ctx: ConnectorContext, config?: unknown): Promise<ConnectorPullResult> {
    if (!isApifyConfig(config)) throw new Error('apify: missing or invalid config.actorId/input');
    const apiKey = readApiKey((ctx as ConnectorContext & { authRef?: string }).authRef);
    const signalClass: SignalClass = config.signalClass ?? 'news_article';

    const url = `${RUN_SYNC}/${encodeURIComponent(config.actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(apiKey)}`;
    ctx.logger.info('apify: running actor', { actorId: config.actorId });
    const res = await ctx.fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'sovereign-intel-connector/0.1.0' },
      body: JSON.stringify(config.input),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`apify: ${res.status} ${text.slice(0, 200)}`);
    }
    const items = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(items)) throw new Error('apify: expected JSON array dataset response');

    const m = config.mapping ?? {};
    const raws: Array<ConnectorPullResult['raws'][number]> = [];
    const signals: NormalizedSignal[] = [];

    for (const item of items) {
      const rawUrl = pickPath(item, m.url) ?? (typeof item.url === 'string' ? item.url : undefined);
      const title  = pickPath(item, m.title) ?? (typeof item.title === 'string' ? item.title : undefined);
      if (!rawUrl || !title) continue;

      const canonicalUrl = canonicalizeUrl(rawUrl);
      const bodyExcerpt = pickPath(item, m.bodyExcerpt) ?? (typeof item.description === 'string' ? item.description : undefined);
      const publishedAtRaw = pickPath(item, m.publishedAt) ?? (typeof item.publishedAt === 'string' ? item.publishedAt : undefined);
      const publishedAt = publishedAtRaw ? new Date(publishedAtRaw).toISOString() : new Date(ctx.now()).toISOString();
      const language = pickPath(item, m.language);

      const provenance = makeProvenance(CONNECTOR, VERSION, {
        additional: { actorId: config.actorId },
      });

      const rawBody = JSON.stringify(item);
      raws.push({
        contentHash: sha256Hex(rawBody),
        canonicalUrl,
        mime: 'application/json',
        bytes: rawBody.length,
        payloadExcerpt: rawBody.slice(0, 4096),
        provenance,
      });
      signals.push({
        contentHash: signalContentHash({
          canonicalUrl,
          title,
          ...(bodyExcerpt !== undefined ? { bodyExcerpt } : {}),
        }),
        canonicalUrl,
        signalClass,
        publishedAt,
        ...(language    !== undefined ? { language }    : {}),
        title,
        ...(bodyExcerpt !== undefined ? { bodyExcerpt } : {}),
        attestations: { primarySourceUrl: canonicalUrl },
        provenance,
      });
    }

    return {
      raws,
      signals,
      metadata: {
        provider: 'apify',
        actorId: config.actorId,
        costEstimateUsd: config.costPerRunUsd ?? 0,
      },
    };
  },
};

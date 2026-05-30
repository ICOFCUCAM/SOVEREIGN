import type { Connector, ConnectorContext, ConnectorPullResult, NormalizedSignal } from '@sovereign/intel-core';
import { makeProvenance, signalContentHash, canonicalizeUrl, sha256Hex } from '@sovereign/intel-core';

const CONNECTOR = 'newsapi';
const VERSION = '0.1.0';
const ENDPOINT = 'https://newsapi.org/v2/everything';

// NewsAPI v2 /everything connector. Paid (dev tier free with quotas).
// Requires NEWSAPI_KEY; source.auth_ref selects the env var to read.
//
// Cost model: ~$0.001 per request on the developer plan, $0.0002 on
// business plan. Reported back in ConnectorPullResult.metadata.cost.

export interface NewsApiConfig {
  readonly query: string;
  readonly sources?: readonly string[];
  readonly domains?: readonly string[];
  readonly language?: string;
  readonly sortBy?: 'publishedAt' | 'relevancy' | 'popularity';
  readonly pageSize?: number;
  readonly costPerRequestUsd?: number;
}

interface NewsApiArticle {
  readonly source?: { readonly id?: string | null; readonly name?: string };
  readonly author?: string;
  readonly title?: string;
  readonly description?: string;
  readonly url?: string;
  readonly publishedAt?: string;
  readonly content?: string;
}

export function isNewsApiConfig(v: unknown): v is NewsApiConfig {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return typeof c.query === 'string' && c.query.length > 0;
}

function readApiKey(authRef: string | undefined): string {
  const envName = authRef && authRef.length > 0 ? authRef : 'NEWSAPI_KEY';
  const key = process.env[envName];
  if (!key) throw new Error(`newsapi: env ${envName} not set`);
  return key;
}

export const newsApiConnector: Connector = {
  name: CONNECTOR,
  family: 'news',
  version: VERSION,

  async pull(ctx: ConnectorContext, config?: unknown): Promise<ConnectorPullResult> {
    if (!isNewsApiConfig(config)) throw new Error('newsapi: missing or invalid config.query');
    const apiKey = readApiKey((ctx as ConnectorContext & { authRef?: string }).authRef);

    const pageSize = Math.max(1, Math.min(config.pageSize ?? 50, 100));
    const url = new URL(ENDPOINT);
    url.searchParams.set('q', config.query);
    if (config.sources?.length) url.searchParams.set('sources', config.sources.join(','));
    if (config.domains?.length) url.searchParams.set('domains', config.domains.join(','));
    if (config.language) url.searchParams.set('language', config.language);
    url.searchParams.set('sortBy', config.sortBy ?? 'publishedAt');
    url.searchParams.set('pageSize', String(pageSize));

    ctx.logger.info('newsapi: fetching', { query: config.query, pageSize });
    const res = await ctx.fetch(url.toString(), {
      headers: { 'x-api-key': apiKey, 'user-agent': 'sovereign-intel-connector/0.1.0' },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`newsapi: ${res.status} ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as { articles?: NewsApiArticle[] };
    const articles = body.articles ?? [];

    const raws: Array<ConnectorPullResult['raws'][number]> = [];
    const signals: NormalizedSignal[] = [];

    for (const a of articles) {
      if (!a.url || !a.title) continue;
      const canonicalUrl = canonicalizeUrl(a.url);
      const publishedAt = a.publishedAt ? new Date(a.publishedAt).toISOString() : new Date(ctx.now()).toISOString();
      const provenance = makeProvenance(CONNECTOR, VERSION, {
        additional: {
          query: config.query,
          source: a.source?.name,
          source_id: a.source?.id ?? undefined,
          author: a.author,
        },
      });
      const rawBody = JSON.stringify(a);
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
          title: a.title,
          ...(a.description !== undefined ? { bodyExcerpt: a.description } : {}),
        }),
        canonicalUrl,
        signalClass: 'news_article',
        publishedAt,
        ...(config.language !== undefined ? { language: config.language } : {}),
        title: a.title,
        ...(a.description !== undefined ? { bodyExcerpt: a.description } : {}),
        ...(a.content     !== undefined ? { summary:     a.content }     : {}),
        attestations: {
          primarySourceUrl: canonicalUrl,
          ...(a.source?.name ? { syndicatedFrom: [a.source.name] } : {}),
        },
        provenance,
      });
    }

    const costUsd = config.costPerRequestUsd ?? 0;
    return {
      raws,
      signals,
      metadata: { provider: 'newsapi', costEstimateUsd: costUsd, pageSize },
    };
  },
};
